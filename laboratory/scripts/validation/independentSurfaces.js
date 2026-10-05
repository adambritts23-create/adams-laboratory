import fs from 'node:fs'
import assert from 'node:assert/strict'
import {prepareChemicalSystem,createPointInput} from '../../src/solver/models.js'
import {solvePoint} from '../../src/solver/point.js'
import {multiSolidPolicy} from '../../src/solver/assemblages.js'
import {createCalculationDefinition} from '../../src/calculations/definition.js'
import {createGridDefinition,runGrid} from '../../src/calculations/grid.js'
import {createSweepDefinition,runSweep} from '../../src/calculations/sweep.js'
import {deriveGridOutputs,deriveOutputs} from '../../src/calculations/outputs.js'
import {gridModel} from '../../src/plots/gridView.js'
import {prepareSurface} from '../../src/plots/surface3d.js'
const database=JSON.parse(fs.readFileSync(new URL('../../public/data/thermodynamic-default.json',import.meta.url)))
export async function surfaceCase(mixed=false){
 const names=mixed?['Ca 2+','CO3 2-','Mg 2+','H+','H2O']:['CO3 2-','H+','H2O']
 const records=database.species.filter(s=>!names.includes(s.name)&&s.role!=='solvent'&&(s.phase==='aqueous'||mixed&&s.phase==='solid')&&s.metadata.effectiveSourceReaction?.components?.length&&s.metadata.effectiveSourceReaction.components.every(c=>c.coefficient===0||names.includes(c.name)))
 const p=await prepareChemicalSystem({...(mixed?{solidPolicy:multiSolidPolicy}:{}),basisStatus:'explicit-direct',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,
 components:names.map(name=>({id:name,name,role:name==='H+'?'proton':name==='H2O'?'water':'ordinary'})),products:records.map(s=>({id:s.id,name:s.name,phase:s.phase,logBeta:s.logK,coefficients:names.map(n=>s.metadata.effectiveSourceReaction.components.find(c=>c.name===n)?.coefficient??0),sourceRecord:s.provenance})),sourceIdentity:{databaseHash:database.species[0].provenance.dbSha256,records:records.map(s=>s.id)}})
 assert.ok(p.ok,JSON.stringify(p));const system=p.system
 const chemical={selectedComponents:names,selectedSpecies:system.products.map(s=>s.id),enabledPhases:['aqueous','solid','liquid'],temperature:25,pressure:1}
 const definition=createCalculationDefinition(chemical,{getComponentById:id=>({id,name:id,role:id==='H+'?'proton':id==='H2O'?'solvent':'basis-choice'})})
 definition.activityModel='ideal';definition.dimensions=2
 definition.componentConditions=names.filter(n=>!['CO3 2-','H+'].includes(n)).map(n=>({componentId:n,mode:n==='H2O'?'LA':'T',quantity:n==='H2O'?'log-activity':'total',unit:n==='H2O'?'dimensionless':'mol/kg-H2O',value:n==='H2O'?0:n==='Ca 2+'?.1:.001}))
 definition.independentVariables=[{componentId:'H+',mode:'LAV',quantity:'pH',unit:'dimensionless',range:{min:mixed?6:4,max:12},points:mixed?13:9},{componentId:'CO3 2-',mode:'LTV',quantity:'total',unit:'mol/kg-H2O',range:{min:mixed?-2:-6,max:mixed?-1:-2},points:5}]
 const output=mixed?{type:'total-dissolved',componentId:'Ca 2+'}:{type:'log-concentration'}
 const seriesId=mixed?'total-dissolved':system.products.find(s=>s.name==='HCO3-').id
 return {system,definition,records,output,seriesId,mixed}
}
export async function calculate(c,definition=c.definition,options){const p=await createGridDefinition(c.system,definition,0);assert.ok(p.ok,JSON.stringify(p));return runGrid(c.system,p.grid,options)}
const numerical=r=>({ok:r?.ok,concentrations:r?.concentrations,logActivities:r?.logActivities,solids:r?.solids,residuals:r?.residuals,diagnosticCodes:r?.diagnostics?.map(d=>d.code)})
export async function validateSurfaceCase(c){
 const grid=await calculate(c),derived=deriveGridOutputs(c.system,grid,c.output),model=gridModel(derived,c.seriesId),surface=prepareSurface(model,grid.outcomes),points=model.points
 assert.ok(derived.ok&&model)
 const comparisons=[]
 for(const o of grid.outcomes){
 const constraints=c.system.components.map(p=>({componentId:p.id,kh:['H+','H2O'].includes(p.id)?2:1,value:p.id==='H+'?-o.x:p.id==='CO3 2-'?10**o.y:p.id==='Ca 2+'?.1:p.id==='Mg 2+'?.001:0}))
 assert.deepEqual(o.input.constraints.map(({componentId,kh,value})=>({componentId,kh,value})),constraints)
 const prepared=await createPointInput(c.system,{constraints,revision:0,unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,activityModel:'ideal'})
 const direct=solvePoint(c.system,prepared.input);assert.deepEqual(numerical(direct),numerical(o.result))
 if(!direct.ok){assert.equal(points[o.index].value,null);continue}
 let expected
 if(!c.mixed){const ci=c.system.componentIndex['CO3 2-'],h=c.system.componentIndex['H+'];let denominator=1
 for(const p of c.system.products){assert.ok([0,1].includes(p.coefficients[ci]));if(p.coefficients[ci])denominator+=10**(p.logBeta-p.coefficients[h]*o.x)}
 const record=c.system.products.find(p=>p.id===c.seriesId)
 expected=Math.log10(10**o.y/denominator)+record.logBeta-record.coefficients[h]*o.x
 }else{const ci=c.system.componentIndex['Ca 2+'];expected=direct.concentrations[ci]+c.system.aqueousRows.reduce((s,j)=>s+c.system.products[j].coefficients[ci]*direct.concentrations[c.system.components.length+j],0)}
 assert.ok(Math.abs(expected-points[o.index].value)<=4e-14+2e-10*Math.abs(expected))
 comparisons.push({index:o.index,expected,actual:points[o.index].value})
 }
 const slices=[]
 for(const kept of [0,1])for(const fixedIndex of [0,Math.floor((grid.shape[1-kept]-1)/2),grid.shape[1-kept]-1]){
 const fixedAxis=c.definition.independentVariables[1-kept],d=structuredClone(c.definition),value=grid.coordinates[1-kept][fixedIndex]
 d.dimensions=1;d.independentVariables=[d.independentVariables[kept]]
 d.componentConditions.push({componentId:fixedAxis.componentId,mode:kept===0?'T':'LA',quantity:kept===0?'total':'pH',unit:fixedAxis.unit,value:kept===0?10**value:value})
 const p=await createSweepDefinition(c.system,d,0);assert.ok(p.ok,JSON.stringify(p));const sweep=await runSweep(c.system,p.sweep),output=deriveOutputs(c.system,sweep,c.output),series=output.series.find(s=>s.id===c.seriesId)
 for(const o of sweep.outcomes){const index=kept===0?fixedIndex*grid.shape[0]+o.index:o.index*grid.shape[0]+fixedIndex;assert.deepEqual(numerical(o.result),numerical(grid.outcomes[index].result));assert.equal(series.points[o.index].value,points[index].value)}
 slices.push({kept,fixedIndex,coordinate:value,status:sweep.status,count:sweep.outcomes.length})
 }
 const traversal=[]
 for(const mode of ['column-major','reversed-X','reversed-Y']){
 const d=structuredClone(c.definition);if(mode==='column-major')d.independentVariables.reverse();else{const a=d.independentVariables[mode==='reversed-X'?0:1];[a.range.min,a.range.max]=[a.range.max,a.range.min]}
 const other=await calculate(c,d),out=deriveGridOutputs(c.system,other,c.output).series.find(s=>s.id===c.seriesId)
 for(const o of other.outcomes){const x=mode==='column-major'?o.y:o.x,y=mode==='column-major'?o.x:o.y,original=grid.outcomes.find(p=>p.x===x&&p.y===y);assert.ok(original);assert.deepEqual(numerical(o.result),numerical(original.result));assert.equal(out.points[o.index].value,points[original.index].value)}
 traversal.push({mode,status:other.status,counts:other.counts})
 }
 return {case:c.mixed?'mixed-Ca-carbonate-Mg':'carbonate-bicarbonate',system:c.system,definition:c.definition,output:c.output,seriesId:c.seriesId,grid,derived,model,surface,comparisons,slices,traversal}
}
