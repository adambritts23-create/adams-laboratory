import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {createWetLabExperience as createExperience,titrationSamples} from '../src/calculations/wetLabExperience.js'
import {createWorkspaceSession,updateLaboratorySession} from '../src/session/laboratorySession.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const chemicalSystem={...createWorkspaceSession(repo).chemicalSystem,selectedComponents:['component:H%2B','component:H2O','component:Na%2B','component:Cl-'],selectedSpecies:['spana:2ac52a30213c9288:250448']}
const createWetLabExperience=repository=>createExperience(repository,{chemicalSystem})
test('Wet Lab precomputes 107 accepted samples with dense equivalence coordinates',async()=>{
 const e=await createWetLabExperience(repo),s=e.snapshot()
 assert.equal(s.points.length,107);assert.equal(s.solveRuns,1)
 for(const v of [49.9,49.99,50,50.01,50.1])assert.ok(titrationSamples.includes(v))
 assert.ok(s.points.every(p=>p.state.status==='accepted-v0'))
 assert.equal(s.selected.totalVolumeMl,50);assert.equal(s.selected.titrantRemainingMl,100)
 e.dispose()
})
test('cached curve selections share exact engine state and never solve inspection independently',async()=>{
 const e=await createWetLabExperience(repo)
 for(const v of [0,25,49.99,50,50.01,100]){
  const p=e.snapshot().points.find(p=>p.x===v),s=e.select(p)
  assert.equal(s.selected,p.state);assert.equal(s.selected.pH,p.y)
  assert.equal(s.selected.totalVolumeMl,50+v);assert.equal(s.selected.titrantRemainingMl,100-v)
  assert.equal(s.selected.equilibrium.result,s.selected.equilibrium.inspection.result)
 }
 assert.equal(e.snapshot().solveRuns,1);e.dispose()
})
test('arbitrary total and increment controls calculate once then cache; reset restores exact initial object',async()=>{
 const e=await createWetLabExperience(repo),initial=e.snapshot().selected
 for(const v of [.01,.11,1.11]){const s=await e.setVolume(v);assert.equal(s.selected.titrantVolumeAddedMl,v)}
 const p=e.snapshot().selected,runs=e.snapshot().solveRuns
 assert.equal((await e.setVolume('1.11')).selected,p);assert.equal(e.snapshot().solveRuns,runs)
 assert.equal(e.reset().selected,initial);assert.equal(e.snapshot().solveRuns,runs);e.dispose()
})
test('invalid values, forged points and old experiment points are refused without replacing selection',async()=>{
 const e=await createWetLabExperience(repo),other=await createWetLabExperience(repo),initial=e.snapshot().selected
 for(const v of [-1,101,NaN,Infinity,'','abc',null,undefined])await assert.rejects(e.setVolume(v),{code:'invalid-volume'})
 assert.throws(()=>e.select({...e.snapshot().points[0]}),{code:'stale-or-foreign-point'})
 assert.throws(()=>e.select(other.snapshot().points[0]),{code:'stale-or-foreign-point'})
 assert.equal(e.snapshot().selected,initial);e.dispose();other.dispose()
 assert.throws(()=>e.reset(),{code:'stale-or-foreign-point'})
})
test('newer selection cancels pending custom-volume state before it can replace the view',async()=>{
 const e=await createWetLabExperience(repo),pending=e.setVolume(2.3456)
 const selected=e.select(e.snapshot().points.find(p=>p.x===50)).selected
 await assert.rejects(pending,{code:'stale-titration'})
 assert.equal(e.snapshot().selected,selected);assert.equal(e.snapshot().points.some(p=>p.x===2.3456),false);e.dispose()
})
test('Wet Lab navigation leaves ordinary chemistry and scientific revision unchanged',()=>{
 const s=createWorkspaceSession(repo),wet=updateLaboratorySession(s,{type:'workspace',workspace:'wet-lab'},repo)
 assert.equal(wet.visualizationState.workspace,'wet-lab');assert.equal(wet.chemicalSystem,s.chemicalSystem)
 assert.equal(wet.calculationDefinition,s.calculationDefinition);assert.equal(wet.revision,s.revision)
 assert.equal(updateLaboratorySession(wet,{type:'workspace',workspace:'calculation'},repo).visualizationState.workspace,'calculation')
})
