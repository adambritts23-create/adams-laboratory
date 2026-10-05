import fs from 'node:fs'
import assert from 'node:assert/strict'
import {prepareChemicalSystem} from '../../src/solver/models.js'
import {multiSolidPolicy} from '../../src/solver/assemblages.js'
import {createCalculationDefinition} from '../../src/calculations/definition.js'
import {createGridDefinition,runGrid} from '../../src/calculations/grid.js'
import {createSweepDefinition,runSweep} from '../../src/calculations/sweep.js'
import {deriveGridOutputs,deriveOutputs} from '../../src/calculations/outputs.js'
import {gridModel} from '../../src/plots/gridView.js'
import {prepareSurface,surfaceContours} from '../../src/plots/surface3d.js'
const database=JSON.parse(fs.readFileSync(new URL('../../public/data/thermodynamic-default.json',import.meta.url)))
export async function metalLigandCase(metal='Ni 2+',species='Ni(NH3)2+2') {
 const names=[metal,'NH3','H+','H2O']
 const records=database.species.filter(s=>!names.includes(s.name)&&s.role!=='solvent'&&['aqueous','solid'].includes(s.phase)&&s.metadata.effectiveSourceReaction?.components?.length&&s.metadata.effectiveSourceReaction.components.every(c=>c.coefficient===0||names.includes(c.name)))
 const p=await prepareChemicalSystem({solidPolicy:multiSolidPolicy,basisStatus:'explicit-direct',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,components:names.map(name=>({id:name,name,role:name==='H+'?'proton':name==='H2O'?'water':'ordinary'})),products:records.map(s=>({id:s.id,name:s.name,phase:s.phase,logBeta:s.logK,coefficients:names.map(n=>s.metadata.effectiveSourceReaction.components.find(c=>c.name===n)?.coefficient??0),sourceRecord:s.provenance})),sourceIdentity:{databaseHash:database.species[0].provenance.dbSha256,records:records.map(s=>s.id)}})
 assert.ok(p.ok,JSON.stringify(p));const system=p.system
 const definition=createCalculationDefinition({selectedComponents:names,selectedSpecies:system.products.map(s=>s.id),enabledPhases:['aqueous','solid','liquid'],temperature:25,pressure:1},{getComponentById:id=>({id,name:id,role:id==='H+'?'proton':id==='H2O'?'solvent':'basis-choice'})})
 definition.activityModel='ideal';definition.dimensions=2;definition.gridMultiSolid=true
 definition.componentConditions=[{componentId:metal,mode:'T',quantity:'total',unit:'mol/kg-H2O',value:1e-10},{componentId:'H2O',mode:'LA',quantity:'log-activity',unit:'dimensionless',value:0}]
 definition.independentVariables=[{componentId:'H+',mode:'LAV',quantity:'pH',unit:'dimensionless',range:{min:6.5,max:10},points:33},{componentId:'NH3',mode:'LTV',quantity:'total',unit:'mol/kg-H2O',range:{min:-2,max:0},points:17}]
 const output={type:'log-concentration'},seriesId=system.products.find(s=>s.name===species).id
 return {system,records,definition,output,seriesId}
}
export async function calculateMetal(c,definition=c.definition){const p=await createGridDefinition(c.system,definition,0);assert.ok(p.ok,JSON.stringify(p));return runGrid(c.system,p.grid)}
const physical=r=>Object.fromEntries(Object.entries(r).filter(([key])=>key!=='inputId'))
const close=(a,b)=>assert.ok(Math.abs(a-b)<2e-9,`${a} != ${b}`)
// Independent nested monotone bisection: no production solver, initial activities,
// Jacobian, or accepted-point activities. Reconstruct both analytical balances.
export function independentAqueous(c,pH,ligandTotal){
 const total=c.definition.componentConditions[0].value,rows=c.system.products.filter(s=>s.phase==='aqueous')
 assert.ok(rows.every(s=>s.coefficients[0]>=0&&s.coefficients[1]>=0))
 const amount=(s,m,l)=>10**s.logBeta*m**s.coefficients[0]*l**s.coefficients[1]*10**(-pH*s.coefficients[2])
 const metal=l=>{let lo=0,hi=total;for(let i=0;i<100;i++){const mid=(lo+hi)/2,sum=mid+rows.reduce((v,s)=>v+s.coefficients[0]*amount(s,mid,l),0);if(sum>total)hi=mid;else lo=mid}return (lo+hi)/2}
 let lo=0,hi=ligandTotal
 for(let i=0;i<100;i++){const l=(lo+hi)/2,m=metal(l),sum=l+rows.reduce((v,s)=>v+s.coefficients[1]*amount(s,m,l),0);if(sum>ligandTotal)hi=l;else lo=l}
 const l=(lo+hi)/2,m=metal(l),amounts=rows.map(s=>({id:s.id,name:s.name,amount:amount(s,m,l)}))
 const saturations=c.system.products.filter(s=>s.phase==='solid').map(s=>({name:s.name,logSaturation:s.logBeta+s.coefficients[0]*Math.log10(m)+s.coefficients[1]*Math.log10(l)-s.coefficients[2]*pH}))
 return {freeMetal:m,freeLigand:l,amounts,saturations,z:Math.log10(amounts.find(s=>s.id===c.seriesId).amount)}
}
export function responseMetrics(model){
 const [nx,ny]=model.metadata.shape,z=model.points.map(p=>p.value)
 const range=a=>Math.max(...a)-Math.min(...a)
 const rows=Array.from({length:ny},(_,iy)=>{const row=model.points.slice(iy*nx,(iy+1)*nx);return {y:row[0].y,range:range(row.map(p=>p.value)),peak:row.reduce((a,b)=>a.value>b.value?a:b)}})
 const columns=Array.from({length:nx},(_,ix)=>{const col=model.points.filter(p=>p.ix===ix);return {x:col[0].x,range:range(col.map(p=>p.value))}})
 let mixedDifference=0
 for(let iy=1;iy<ny;iy++)for(let ix=1;ix<nx;ix++)mixedDifference=Math.max(mixedDifference,Math.abs(z[iy*nx+ix]-z[ix]-z[iy*nx]+z[0]))
 const surface=prepareSurface(model),levels=Array.from({length:5},(_,i)=>model.min+(model.max-model.min)*(i+1)/6),contours=surfaceContours(surface,levels)
 const angles=contours.map(s=>Math.atan2((s.to.y-s.from.y)/2,(s.to.x-s.from.x)/3.5)*180/Math.PI).map(a=>(a+180)%180)
 return {min:model.min,max:model.max,rows,columns,mixedDifference,contourSegments:contours.length,normalizedContourAngleRange:range(angles),levels}
}
export async function validateMetal(){
 const c=await metalLigandCase(),grid=await calculateMetal(c),derived=deriveGridOutputs(c.system,grid,c.output),model=gridModel(derived,c.seriesId)
 assert.ok(grid.outcomes.every(o=>o.result.ok),'All points must be accepted; failures are not filtered')
 const independent=grid.outcomes.map(o=>{const a=independentAqueous(c,o.x,10**o.y);assert.ok(a.saturations.every(s=>s.logSaturation<0));assert.ok(o.result.solids.every(s=>s.amount===0));close(a.z,model.points[o.index].value);return {index:o.index,x:o.x,y:o.y,...a}})
 const slices=[]
 for(const kept of [0,1])for(const fi of [0,Math.floor((grid.shape[1-kept]-1)/2),grid.shape[1-kept]-1]){
  const d=structuredClone(c.definition),axis=d.independentVariables[1-kept],value=grid.coordinates[1-kept][fi];d.dimensions=1;d.independentVariables=[d.independentVariables[kept]];d.componentConditions.push({componentId:axis.componentId,mode:kept===0?'T':'LA',quantity:kept===0?'total':'pH',unit:axis.unit,value:kept===0?10**value:value})
  const p=await createSweepDefinition(c.system,d,0);assert.ok(p.ok,JSON.stringify(p));const sweep=await runSweep(c.system,p.sweep),series=deriveOutputs(c.system,sweep,c.output).series.find(s=>s.id===c.seriesId)
  for(const o of sweep.outcomes){const index=kept===0?fi*grid.shape[0]+o.index:o.index*grid.shape[0]+fi;assert.deepEqual(physical(o.result),physical(grid.outcomes[index].result));assert.equal(series.points[o.index].value,model.points[index].value)}
  slices.push({kept,fixed:value,points:sweep.outcomes.length})
 }
 const traversals=[]
 for(const mode of ['column-major','reverse-X','reverse-Y']){const d=structuredClone(c.definition);if(mode==='column-major')d.independentVariables.reverse();else{const a=d.independentVariables[mode==='reverse-X'?0:1];[a.range.min,a.range.max]=[a.range.max,a.range.min]}
 const other=await calculateMetal(c,d);for(const o of other.outcomes){const x=mode==='column-major'?o.y:o.x,y=mode==='column-major'?o.x:o.y,original=grid.outcomes.find(p=>p.x===x&&p.y===y);assert.deepEqual(physical(o.result),physical(original.result))}traversals.push(mode)}
 return {...c,grid,model,independent,slices,traversals,metrics:responseMetrics(model)}
}
