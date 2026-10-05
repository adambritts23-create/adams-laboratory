import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRepository } from '../src/thermodynamics/repository.js'
import { calculateBeakerExample, beakerState, precipitateVisual } from '../src/beaker/equilibriumBeaker.js'
import { isSuccessfulPointResult } from '../src/solver/point.js'
import { deriveOutputs } from '../src/calculations/outputs.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { thermodynamicRepository as demo } from '../src/thermodynamics/index.js'

const repository=createRepository(JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json',import.meta.url))))
const snapshot=await calculateBeakerExample(repository)
assert.ok(snapshot.ok,JSON.stringify(snapshot))
const evidence=JSON.parse(fs.readFileSync(new URL('../docs/multisolid-validation.json',import.meta.url)))

test('beaker consumes branded accepted equilibrium points, never lookalike or archived objects',()=>{
 for(let i=0;i<29;i++){
  const state=beakerState(snapshot,i/2)
  assert.ok(state.ok);assert.ok(isSuccessfulPointResult(state.result))
  assert.equal(state.result,snapshot.sweep.outcomes[i].result)
  assert.equal(state.input,snapshot.sweep.outcomes[i].input)
 }
 assert.equal(beakerState(structuredClone(snapshot),7).reason,'unaccepted-beaker-data')
})
test('all pH control samples map exactly to the existing proton activity input',()=>{
 const proton=snapshot.system.components.find(c=>c.role==='proton')
 for(let i=0;i<29;i++){
  const state=beakerState(snapshot,String(i/2)),constraint=state.input.constraints.find(c=>c.componentId===proton.id)
  assert.equal(constraint.kh,2);assert.equal(constraint.value,-i/2)
  assert.equal(state.pH,i/2)
 }
 for(const value of ['',-1,15,7.25,'NaN'])assert.equal(beakerState(snapshot,value).ok,false)
})
test('accepted aqueous-only points have no precipitate and retain unavailable saturation solubility',()=>{
 const state=beakerState(snapshot,0)
 assert.equal(state.category,'aqueous');assert.deepEqual(state.solids,[])
 assert.equal(state.visual.bedHeight,0);assert.equal(state.visual.inventory,0)
 assert.ok(state.components.every(c=>c.totalDissolved>0&&c.solubility===null&&c.solubilityReason==='relevant-solid-not-saturated'))
})
test('one-solid beaker state identifies calcite from the solver assemblage',()=>{
 const state=beakerState(snapshot,7)
 assert.equal(state.category,'one-solid');assert.deepEqual(state.solids.map(s=>s.name),['CaCO3(cr)'])
 assert.ok(state.visual.bedHeight>0)
})
test('multi-solid beaker states show all two- and three-phase inventories without layers',()=>{
 assert.deepEqual(beakerState(snapshot,10.5).solids.map(s=>s.name).sort(),['CaCO3(cr)','Mg(OH)2(cr)'])
 assert.deepEqual(beakerState(snapshot,14).solids.map(s=>s.name).sort(),['Ca(OH)2(cr)','CaCO3(cr)','Mg(OH)2(cr)'])
 assert.equal(beakerState(snapshot,14).category,'multiple-solids')
 assert.equal(typeof beakerState(snapshot,14).visual.bedHeight,'number')
})
test('display inventory preserves every exact solid amount and agrees with prior multi-solid evidence',()=>{
 for(let i=0;i<29;i++){
  const state=beakerState(snapshot,i/2),expected=evidence.points[i]
  assert.deepEqual(state.solids,state.result.solids.filter(s=>s.amount>0))
  for(const solid of state.allSolids){const reference=expected.solids.find(s=>s.name===solid.name);assert.ok(Math.abs(solid.amount-reference.amount)<2e-10)}
 }
 assert.equal(precipitateVisual([]).bedHeight,0)
 assert.ok(precipitateVisual([{amount:0.1}]).bedHeight>precipitateVisual([{amount:0.01}]).bedHeight)
})
test('dissolved totals and all weighted contributors reuse existing calculated output',()=>{
 for(const series of snapshot.derived.series){
  const dissolved=deriveOutputs(snapshot.system,snapshot.sweep,{type:'total-dissolved',componentId:series.id})
  for(let i=0;i<29;i++){
   const component=beakerState(snapshot,i/2).components.find(c=>c.id===series.id)
   assert.equal(component.totalDissolved,dissolved.series[0].points[i].value)
   assert.equal(component.contributors,series.points[i].trace.contributors)
   assert.ok(Math.abs(component.contributors.reduce((n,c)=>n+c.weightedMolality,0)-component.totalDissolved)<1e-14)
  }
 }
 assert.equal(beakerState(snapshot,12).components[1].contributors.find(c=>c.name==='Mg4(OH)4+4').coefficient,4)
})
test('synchronized marker uses exactly the beaker pH, input identity and original solubility samples',()=>{
 for(let i=0;i<29;i++){
  const state=beakerState(snapshot,i/2)
  assert.equal(state.marker.index,i);assert.equal(state.marker.pH,state.pH)
  assert.equal(state.marker.inputId,state.result.inputId)
  assert.deepEqual(state.marker.values,snapshot.derived.series.map(s=>s.points[i].value))
 }
})
test('unsupported and uncalculated states remain explicit and never produce a visual equilibrium',async()=>{
 const unsupported=await calculateBeakerExample(demo)
 assert.equal(unsupported.ok,false);assert.equal(beakerState(unsupported,7).visual,null)
 const controller=new AbortController();controller.abort()
 const cancelled=await calculateBeakerExample(repository,{signal:controller.signal})
 const state=beakerState(cancelled,7)
 assert.equal(state.reason,'unavailable-beaker-equilibrium');assert.equal(state.visual,null)
 assert.equal(beakerState({ok:false,reason:'solver-failed',message:'No accepted state'},7).ok,false)
 // Real rejected points, not a fabricated successful-result object. Extreme input
 // is test-only; the selectable beaker still has its fixed audited totals.
 const d=structuredClone(snapshot.sweep.definition.calculationDefinition)
 d.componentConditions[0].value=1e300;d.independentVariables[0].points=2
 const prepared=await createSweepDefinition(snapshot.system,d,snapshot.revision)
 assert.ok(prepared.ok)
 const failedSweep=await runSweep(snapshot.system,prepared.sweep)
 assert.ok(failedSweep.outcomes.every(o=>o.status==='failed'))
 const derived=deriveOutputs(snapshot.system,failedSweep,{type:'saturated-log-solubility',...d.mixedSolubility})
 const failed=beakerState({...snapshot,sweep:failedSweep,derived},0)
 assert.equal(failed.reason,'unavailable-beaker-equilibrium');assert.equal(failed.visual,null)
})
test('stale revision and late invalidated runs cannot masquerade as the current beaker state',async()=>{
 const state=beakerState(snapshot,7,snapshot.revision+1)
 assert.equal(state.reason,'stale-beaker-state');assert.equal(state.visual,null)
 const stale=await calculateBeakerExample(repository,{isCurrent:()=>false})
 assert.equal(stale.ok,false);assert.equal(beakerState(stale,7).visual,null)
 // Rapid selection reads separate exact stored results, never a previous display cache.
 for(const pH of [14,0,10.5,7,14,0])assert.equal(beakerState(snapshot,pH).input.constraints.find(c=>c.componentId===snapshot.system.components.find(c=>c.role==='proton').id).value,-pH)
})
