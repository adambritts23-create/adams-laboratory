import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {mixedCarbonateSolubilityExample} from '../src/data/solubilityExample.js'
import {prepareSessionPoint} from '../src/solver/prepareSession.js'
import {prepareChemicalSystem,createPointInput} from '../src/solver/models.js'
import {solvePoint} from '../src/solver/point.js'
import {createSweepDefinition,runSweep} from '../src/calculations/sweep.js'
import {deriveOutputs,deriveGridOutputs} from '../src/calculations/outputs.js'
import {validateOutputRequest} from '../src/calculations/outputDescriptors.js'
import {aqueousFractionScope,aqueousFractionState,normalizeAqueousContributions,aqueousFractionNumerics} from '../src/calculations/aqueousFractions.js'
import {resultPackage,figureSvg} from '../src/plots/export.js'
import {segments,bounds} from '../src/plots/geometry.js'
import {scientificPointTrace} from '../src/analysis/pointTrace.js'
import {updateLaboratorySession} from '../src/session/laboratorySession.js'
const repo=createRepository(JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json',import.meta.url))))
const evidence=JSON.parse(fs.readFileSync(new URL('../docs/multisolid-validation.json',import.meta.url)))
const session=mixedCarbonateSolubilityExample(repo)
const p=await prepareSessionPoint(session,repo,{sweep:true}); assert.ok(p.ok)
const {system}=p, sd=await createSweepDefinition(system,session.calculationDefinition,session.revision)
const sweep=await runSweep(system,sd.sweep)
const component=name=>system.components.find(c=>c.name===name).id
const output=id=>deriveOutputs(system,sweep,{type:'aqueous-fraction',componentId:id})
const close=(a,b,tol=1e-12)=>assert.ok(Math.abs(a-b)<=tol,a+' vs '+b)
for(const [name,ei] of [['Ca 2+',0],['CO3 2-',1],['Mg 2+',2]]) test('aqueous fractions: '+name+' agree with independent saved mixed evidence and sum to one',()=>{
 const d=output(component(name));assert.ok(d.ok);assert.deepEqual(d.metadata.defaultYRange,[0,1])
 for(let i=0;i<29;i++){
  const saved=evidence.points[i], rows=saved.independentReconstruction.amounts.filter(s=>s.coefficients[ei]>0)
  const amounts=new Map(rows.map(s=>[s.name,s.molality*s.coefficients[ei]]));amounts.set(name,10**saved.logActivities[ei])
  const denominator=[...amounts.values()].reduce((n,v)=>n+v,0)
  assert.equal(d.series.length,amounts.size)
  close(d.series.reduce((n,s)=>n+s.points[i].value,0),1)
  for(const s of d.series){close(s.points[i].value,amounts.get(s.name)/denominator); assert.equal(s.phase,'aqueous');assert.equal(s.points[i].fractionTrace.inputId,sweep.outcomes[i].input.id)}
  close(d.series[0].points[i].fractionTrace.totalDissolved,denominator)
 }
})
test('precipitation is excluded from the denominator; tetramer carries four units and excluded species never contribute',()=>{
 const d=output(component('Mg 2+')),i=24,r=sweep.outcomes[i].result
 const tetramer=d.series.find(s=>s.name==='Mg4(OH)4+4'),trace=tetramer.points[i].fractionTrace,row=trace.contributors.find(c=>c.id===tetramer.id)
 assert.equal(row.coefficient,4);close(row.weightedMolality,4*row.molality,1e-30)
 close(tetramer.points[i].value,4*row.molality/trace.totalDissolved,1e-25)
 assert.ok(r.solids.some(s=>s.amount>0));assert.ok(trace.totalDissolved<0.001/1000)
 assert.ok(Math.abs(trace.sumFractions-trace.totalDissolved/0.001)>0.9)
 const ids=new Set(d.series.map(s=>s.id))
 assert.ok(system.products.filter(p=>p.phase==='solid'||p.coefficients[2]===0).every(p=>!ids.has(p.id)))
 const check=scientificPointTrace(system,sweep,d,tetramer.id,i)
 assert.ok(check.ok,JSON.stringify(check))
})
test('zero, sub-resolution, nonfinite and invalid inputs never manufacture fractions',()=>{
 for(const molality of [0,1e-300,aqueousFractionNumerics.minimumDissolvedAmount]){
  const s=normalizeAqueousContributions([{coefficient:4,molality:molality/4}]);assert.equal(s.ok,false);assert.equal(s.contributors[0].fraction,null);assert.equal(s.reason,'dissolved-total-below-fraction-resolution')
 }
 for(const molality of [-1,NaN,Infinity]) assert.equal(normalizeAqueousContributions([{coefficient:1,molality}]).ok,false)
 assert.equal(aqueousFractionState(system,{ok:true},component('Ca 2+')).ok,false)
 assert.equal(aqueousFractionScope(system,component('H+')).ok,false)
 assert.equal(deriveGridOutputs(system,{}, {type:'aqueous-fraction'}).ok,false)
 assert.equal(validateOutputRequest(system,{type:'aqueous-fraction',componentId:component('Ca 2+')},{requireSeries:true}).ok,false)
})
test('stale, cancelled and failed states stay gaps while raw export retains original precision',async()=>{
 const id=component('Ca 2+'),request={type:'aqueous-fraction',componentId:id}
 const stale=deriveOutputs(system,sweep,request,{currentRevision:session.revision+1})
 assert.ok(stale.series.every(s=>s.points.every(p=>p.value===null&&p.reason==='stale-aqueous-fraction')))
 const controller=new AbortController();controller.abort()
 const cancelled=await runSweep(system,sd.sweep,{signal:controller.signal}),gaps=deriveOutputs(system,cancelled,request)
 assert.ok(gaps.series.every(s=>segments(s.points).length===0))
 const bad=structuredClone(session.calculationDefinition);bad.componentConditions.find(c=>c.componentId===id).value=0
 const badDef=await createSweepDefinition(system,bad,0);assert.ok(badDef.ok)
 const failed=await runSweep(system,badDef.sweep),f=deriveOutputs(system,failed,request)
 assert.equal(failed.counts.failed,29);assert.ok(f.series.every(s=>s.points.every(p=>p.value===null)))
 const d=output(id),ids=d.series.map(s=>s.id),view={...bounds(d.series,d.metadata.axis),yMin:0,yMax:1}
 const exported=JSON.parse(resultPackage(system,sweep,d,ids,view,session.revision))
 assert.deepEqual(exported.derived.series,d.series);assert.deepEqual(exported.sweep.outcomes[24].result.concentrations,sweep.outcomes[24].result.concentrations)
 const svg=figureSvg(d,ids,view,'dark',session.revision,undefined,ids[0]);assert.ok(svg.includes('data-focused="true"'));assert.ok(svg.includes('opacity="0.25"'))
 const old={...session,lastPlot:{system,sweep}},changed=updateLaboratorySession(old,{type:'plotView',patch:request},repo)
 assert.equal(changed.lastPlot.sweep,sweep);assert.equal(changed.revision,old.revision)
})
test('reordering candidate solids does not change aqueous fractions',async()=>{
 const prepared=await prepareChemicalSystem({...system,products:[...system.products].reverse()});assert.ok(prepared.ok)
 const input=await createPointInput(prepared.system,{...sweep.outcomes[24].input});assert.ok(input.ok,JSON.stringify(input))
 const r=solvePoint(prepared.system,input.input);assert.ok(r.ok)
 for(const name of ['Ca 2+','CO3 2-','Mg 2+']){
  const original=aqueousFractionState(system,sweep.outcomes[24].result,component(name)),reordered=aqueousFractionState(prepared.system,r,component(name))
  assert.deepEqual(reordered.contributors,original.contributors)
 }
})

test('independent carbonate acid/base fractions follow stored mass-action ratios; omitted forms are absent',async()=>{
 const keep=[1,3,4], components=keep.map(i=>system.components[i])
 const acidProducts=system.products.filter(p=>p.phase==='aqueous'&&p.coefficients[0]===0&&p.coefficients[2]===0).map(p=>({...p,coefficients:keep.map(i=>p.coefficients[i])}))
 const spec={...system,components,products:acidProducts};delete spec.solidPolicy
 const prepared=await prepareChemicalSystem(spec);assert.ok(prepared.ok)
 const id=components[0].id, byName=name=>acidProducts.find(p=>p.name===name).logBeta
 for(const pH of [3,7,10.5,14]){
  const input=await createPointInput(prepared.system,{revision:0,unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,activityModel:'ideal',constraints:components.map((c,i)=>({componentId:c.id,kh:i===0?1:2,value:i===0?0.001:i===1?-pH:0}))})
  const r=solvePoint(prepared.system,input.input);assert.ok(r.ok)
  // Closed form: each carbonate-bearing product is first order in free carbonate.
  // The free-carbonate activity cancels between numerator and denominator.
  const weights={'CO3 2-':1,'HCO3-':10**(byName('HCO3-')-pH),'H2CO3':10**(byName('H2CO3')-2*pH),'CO2':10**(byName('CO2')-2*pH)}
  const denominator=Object.values(weights).reduce((n,v)=>n+v,0), fractions=aqueousFractionState(prepared.system,r,id)
  assert.ok(fractions.ok);assert.equal(fractions.contributors.length,4)
  fractions.contributors.forEach(c=>close(c.fraction,weights[c.name]/denominator))
  close(fractions.sumFractions,1)
  if(pH===7){
   const reduced=await prepareChemicalSystem({...spec,products:acidProducts.filter(p=>p.name!=='H2CO3')})
   const ri=await createPointInput(reduced.system,{...input.input})
   const rr=solvePoint(reduced.system,ri.input), rf=aqueousFractionState(reduced.system,rr,id)
   assert.ok(rf.ok);assert.equal(rf.contributors.length,3);assert.ok(rf.contributors.every(c=>c.name!=='H2CO3'));close(rf.sumFractions,1)
  }
 }
})
test('an accepted very small dissolved inventory remains explicitly unavailable for fractions',async()=>{
 const component=system.components[0]
 const prepared=await prepareChemicalSystem({...system,components:[component],products:[]})
 const input=await createPointInput(prepared.system,{revision:0,unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,activityModel:'ideal',constraints:[{componentId:component.id,kh:1,value:1e-16}]})
 const r=solvePoint(prepared.system,input.input);assert.ok(r.ok)
 const f=aqueousFractionState(prepared.system,r,component.id);assert.equal(f.ok,false);assert.equal(f.reason,'dissolved-total-below-fraction-resolution');assert.equal(f.contributors[0].fraction,null)
})
