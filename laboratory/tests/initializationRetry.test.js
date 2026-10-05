import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { prepare,analytical } from '../scripts/validation/mnAudit.js'
import { solvePoint } from '../src/solver/point.js'
import { createPointInput,prepareChemicalSystem } from '../src/solver/models.js'
import { reconstruct } from './phase6Helpers.js'
import { ehToPe,solveFixedRedox,peToEh } from '../src/solver/redox.js'
const historical=JSON.parse(fs.readFileSync(new URL('../docs/mn-grid-validation.json',import.meta.url)))
const system=await prepare()
async function replay(o){const p=await createPointInput(system,o.input);assert.ok(p.ok);return {input:p.input,result:solvePoint(system,p.input)}}
test('initialization retry: all 29 historical Mn failures recover through ordinary acceptance gates',async()=>{
 const failed=historical.grid.outcomes.filter(o=>!o.result.ok);assert.equal(failed.length,29)
 for(const o of failed){const {input,result}=await replay(o);assert.ok(result.ok,JSON.stringify(result));reconstruct(system,input,result)
 const expected=analytical(o.x,ehToPe(o.y));assert.ok(Math.abs(result.logActivities[0]-Math.log10(expected.free))<1e-8)
 const active=result.solids.filter(s=>s.amount>0);assert.deepEqual(active.map(s=>s.id),expected.solid?[expected.solid.id]:[])
 assert.ok(result.attempts.some(a=>a.initializationRetry));assert.equal(result.saturationTolerance,1e-12);assert.equal(result.iterationTolerance,2e-13)
 }
})
test('initialization retry: all 166 previously accepted sampled numerical states are unchanged',async()=>{
 const accepted=historical.grid.outcomes.filter(o=>o.result.ok);assert.equal(accepted.length,166)
 for(const o of accepted){const {result}=await replay(o);assert.ok(result.ok)
 for(const key of ['concentrations','logActivities','componentTotals','solids','residuals'])assert.deepEqual(result[key],o.result[key])}
})
test('initialization retry: coexistence, invalid total and zero iteration budget still fail explicitly',async()=>{
 const tie=await solveFixedRedox(system,{pH:9,Eh:peToEh(5.025),totals:{'Mn 2+':.001}})
 assert.equal(tie.ok,false);assert.equal(tie.diagnostics[0].code,'ambiguous-solid-assemblage')
 const o=historical.grid.outcomes.find(o=>!o.result.ok),p=await createPointInput(system,o.input)
 const limited=solvePoint(system,p.input,{maxIterations:0});assert.equal(limited.ok,false);assert.equal(limited.result,null);assert.ok(limited.attempts.every(a=>!a.initializationRetry))
 const zero=await solveFixedRedox(system,{pH:7,Eh:0,totals:{'Mn 2+':0}});assert.equal(zero.ok,false);assert.equal(zero.result.result,null)
})
test('initialization retry: applies to generic mathematical monomer chemistry without Mn or redox identity',async()=>{
 const p=await prepareChemicalSystem({basisStatus:'explicit-direct',temperatureC:25,pressureBar:1,unit:'mol/kg-H2O',sourceIdentity:{kind:'synthetic-mathematical-test'},components:[{id:'A',name:'A',role:'ordinary'}],products:[{id:'bound-A',name:'bound-A',phase:'aqueous',coefficients:[1],logBeta:160,sourceRecord:{kind:'synthetic-mathematical-test'}}]});assert.ok(p.ok)
 const i=await createPointInput(p.system,{revision:0,temperatureC:25,pressureBar:1,unit:'mol/kg-H2O',activityModel:'ideal',constraints:[{componentId:'A',kh:1,value:.001}]});assert.ok(i.ok)
 const r=solvePoint(p.system,i.input);assert.ok(r.ok);assert.ok(Math.abs(r.logActivities[0]+163)<1e-10);assert.ok(Math.abs(r.concentrations[1]-.001)<1e-13)
 assert.ok(r.attempts[0].initializationRetry);assert.equal(r.attempts[0].initializationRetry.originalFailure.code,'numerical-nonconvergence')
})
test('initialization retry: exact export retains original failure and starting activities',async()=>{
 const o=historical.grid.outcomes.find(o=>!o.result.ok&&o.x===14&&o.y===0),{result}=await replay(o)
 const retry=result.attempts.find(a=>a.accepted&&a.initializationRetry).initializationRetry
 assert.equal(retry.policy,'single-positive-total-mass-action-seed-v1');assert.equal(retry.originalFailure.code,'singular-or-ill-conditioned')
 assert.equal(retry.initialLogActivities[1],-14);assert.equal(retry.initialLogActivities[2],0)
 const copy=JSON.parse(JSON.stringify(retry));assert.equal(copy.initialLogActivities[0],retry.initialLogActivities[0]);assert.deepEqual(copy.originalFailure,retry.originalFailure)
})
