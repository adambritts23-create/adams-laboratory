import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {redoxWorkflowExample} from '../src/data/redoxWorkflowExample.js'
import {runCarrierPourbaix,inspectCarrier,carrierColors} from '../src/experimental/carrierPourbaix.js'
import {preparePourbaixWorkflow} from '../src/calculations/userPourbaix.js'
import {isPourbaixResult} from '../src/calculations/boundedPourbaix.js'
const repository=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const session=redoxWorkflowExample(repository,'Cr')
session.calculationDefinition.pourbaix.total=1
session.calculationDefinition.pourbaix.Eh.max=1
const result=await runCarrierPourbaix(session,repository)
test('local generic Cr carrier smoke: accepted full grid, exact source identities, no guessed oxidation states',()=>{
 assert.ok(result.ok,result.reason)
 assert.deepEqual(result.grid.counts,{requested:2565,converged:2565,failed:0,notRun:0})
 assert.equal(result.publicEnabled,false);assert.equal(isPourbaixResult(result),false)
 const ids=new Set(result.points.map(p=>p.dominant?.id))
 assert.equal(ids.size,8);assert.ok(!ids.has(undefined))
 for(const p of result.points){assert.equal(p.oxidationStateStatus,'unclassified / metadata pending');assert.equal(p.oxidationState,undefined);assert.equal(p.predominant,undefined);assert.ok(Math.abs(p.residual)<=p.tolerance);assert.equal(p.totalInventory,1);assert.ok(p.carriers.some(c=>c.id===p.dominant.id));assert.equal(p.state.result,result.grid.outcomes[result.points.indexOf(p)].result)}
 // Hydrolysis/acid-base carriers retain their distinct source identities and regions.
 for(const id of ['spana:2ac52a30213c9288:94983','spana:2ac52a30213c9288:91532','spana:2ac52a30213c9288:94892','spana:2ac52a30213c9288:96141'])assert.ok(ids.has(id))
 const oligomer=result.points.find(p=>p.dominant.id==='spana:2ac52a30213c9288:94983').dominant
 assert.equal(oligomer.contribution,3*oligomer.amount)
 assert.deepEqual(carrierColors([...ids]),carrierColors([...ids].reverse()))
})
test('metadata-pending public maps remain blocked and reviewed Fe/Cu cannot use the fallback',async()=>{
 for(const label of ['Cr','U']){const p=await preparePourbaixWorkflow(redoxWorkflowExample(repository,label),repository);assert.equal(p.ok,false);assert.equal(p.discovery.inventoryComplete,false)}
 for(const label of ['Fe','Cu']){const p=await runCarrierPourbaix(redoxWorkflowExample(repository,label),repository);assert.equal(p.ok,false)}
})
test('failed or forged equilibria yield gaps, never carrier winners',()=>{
 const o=result.grid.outcomes[0]
 for(const outcome of [{...o,result:null,input:null,status:'failed'},{...o,result:{...o.result}}]){const p=inspectCarrier(result.system,outcome,1);assert.equal(p.status,'gap');assert.equal(p.dominant,null);assert.deepEqual(p.carriers,[])}
})
test('cancellation retains uncalculated gaps without manufacturing equilibria',async()=>{
 const small=structuredClone(session);small.calculationDefinition.pourbaix.pH.points=2;small.calculationDefinition.pourbaix.Eh.points=2
 const controller=new AbortController();controller.abort()
 const r=await runCarrierPourbaix(small,repository,{signal:controller.signal})
 assert.equal(r.grid.status,'cancelled');assert.equal(r.grid.counts.notRun,4);assert.ok(r.points.every(p=>p.status==='gap'&&!p.dominant))
})
