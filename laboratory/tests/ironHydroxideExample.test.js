import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {createWorkspaceSession} from '../src/session/laboratorySession.js'
import {createWetLabExperience} from '../src/calculations/wetLabExperience.js'
import {ironHydroxideSetup,ironHydroxideIds,wetLabExperimentSystem} from '../src/calculations/ironHydroxideExample.js'
import {wetLab3DState,solidDisplayColor} from '../src/beaker/wetLab3DState.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const system=createWorkspaceSession(repo).chemicalSystem,before=JSON.stringify(system)
const engine=await createWetLabExperience(repo,{chemicalSystem:system,setup:ironHydroxideSetup,revision:1})
const points=engine.snapshot().points
const at=v=>points.find(p=>p.x===v).state
const moles=(s,id)=>(s.equilibrium.inspection.solids.find(p=>p.id===id)?.amount??0)*s.mixture.modelSolventMassKg

test('fresh hydroxide scope leaves global System untouched and admits only named source solids',()=>{
 assert.equal(JSON.stringify(system),before)
 assert.equal(wetLabExperimentSystem(repo,system,{}),system)
 const local=wetLabExperimentSystem(repo,system,ironHydroxideSetup)
 assert.deepEqual(local.selectedSpecies.filter(id=>repo.getSpeciesById(id).phase==='solid').sort(),[...ironHydroxideIds].sort())
 assert.ok(!local.selectedComponents.some(id=>repo.getComponentById(id).role==='electron'))
})
test('all 101 doses accepted; ferric precipitates before ferrous, both nearly complete at 35 mL',()=>{
 assert.equal(points.length,101)
 for(const {state:s} of points){
  assert.equal(s.status,'accepted-v0',JSON.stringify(s.diagnostics))
  assert.ok(s.equilibrium.inspection.solids.every(p=>ironHydroxideIds.includes(p.id)))
  s.equilibrium.result.residuals.componentBalance.forEach((v,i)=>{if(v!==null)assert.ok(Math.abs(v)<=s.equilibrium.result.residuals.componentBalanceLimits[i])})
 }
 assert.ok(at(0).pH<1.1);assert.equal(at(0).equilibrium.inspection.solids.length,0)
 assert.ok(moles(at(20),ironHydroxideIds[1])>.001)
 assert.equal(moles(at(20),ironHydroxideIds[0]),0)
 for(const id of ironHydroxideIds)assert.ok(moles(at(35),id)/.0025>.999)
})
test('green and orange follow source phases, exact amount and rewind; no extra solves',()=>{
 const solves=engine.snapshot().equilibriumSolveCount
 engine.select(points.find(p=>p.x===35))
 const d=wetLab3DState(engine.snapshot().displayed,50)
 assert.equal(d.visibleSolids.length,2)
 assert.equal(d.visibleSolids.find(s=>s.id===ironHydroxideIds[0]).color,'#18583b')
 assert.equal(d.visibleSolids.find(s=>s.id===ironHydroxideIds[1]).color,'#df7929')
 assert.equal(solidDisplayColor(ironHydroxideIds[0]),'#18583b')
 engine.reset();assert.equal(wetLab3DState(engine.snapshot().displayed,50).solidMoles,0)
 assert.equal(engine.snapshot().equilibriumSolveCount,solves)
 engine.dispose()
})
