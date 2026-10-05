import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {prepareClosedRedox} from '../src/solver/closedRedox.js'
import {ids,expected,realClosedRequest,closedReal,imposedReal,verifyReal} from '../scripts/validation/closedRedoxReal.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
test('real V/Eu raw-source expected solution is independently analytic before production calculation',()=>{
 const q=realClosedRequest(repo),v=q.reactions.find(r=>r.id===ids.Vr),eu=q.reactions.find(r=>r.id===ids.Eur),logNet=v.logK-eu.logK,sqrtK=10**(logNet/2)
 assert.ok(Math.abs(logNet-.27)<1e-14);assert.equal(expected.extent,expected.total*sqrtK/(1+sqrtK));assert.equal(expected.remaining,expected.total/(1+sqrtK))
 const peV=v.logK+Math.log10(expected.remaining/expected.extent),peEu=eu.logK+Math.log10(expected.extent/expected.remaining);assert.ok(Math.abs(peV-expected.pe)<1e-14);assert.ok(Math.abs(peEu-expected.pe)<1e-14)
 assert.equal(q.species.filter(s=>s.role!=='electron').length,5);assert.deepEqual(new Set(q.species.flatMap(s=>Object.keys(s.elements))),new Set(['V','Eu','Cl']))
})
test('real two-family closed chemistry closes atoms, charge and electrons with common derived potential',async()=>{
 const {prepared,solved}=await closedReal(repo);verifyReal(solved.result);assert.ok(solved.inspection.inventories.every(r=>r.ok));assert.ok(solved.inspection.netReactions.every(r=>r.ok));assert.ok(solved.inspection.potentials.every(r=>r.ok));assert.ok(Math.abs(solved.inspection.pe-expected.pe)<1e-10);assert.ok(Math.abs(solved.inspection.Eh-expected.Eh)<1e-11)
 assert.ok(solved.input.constraints.every(c=>c.kh===1));assert.ok(!solved.result.speciesIds.includes(ids.e));assert.equal(prepared.network.cancellations[0].electronResidual,0)
 const e=prepared.network.algebra.componentExpressions;assert.deepEqual(e[ids.Eur].coefficients.map(n=>n||0),[-1,1,1,0]);assert.ok(Math.abs(e[ids.Eur].logK+.27)<1e-14)
})
test('real closed chemistry is preparation-history, reaction-order and supported-basis invariant',async()=>{
 const baseline=await closedReal(repo),amounts=verifyReal(baseline.solved.result)
 for(const alternate of [false,true])for(const history of [0,1])for(const reverse of [false,true]){const r=await closedReal(repo,{alternate,history,reverse}),actual=verifyReal(r.solved.result);for(const id of Object.keys(amounts))assert.ok(Math.abs(actual[id]-amounts[id])<1e-12);assert.ok(Math.abs(r.solved.inspection.Eh-expected.Eh)<1e-11);if(history)assert.notEqual(r.prepared.preparationId,baseline.prepared.preparationId);if(!alternate)assert.equal(r.prepared.equilibriumId,baseline.prepared.equilibriumId)}
})
test('same five-ion chemistry through generic imposed-Eh sweep agrees at exact independent equilibrium potential',async()=>{
 const fixed=await imposedReal(repo),closed=await closedReal(repo);verifyReal(fixed.exact.result);assert.equal(fixed.sweep.counts.converged,5)
 for(const id of closed.solved.result.speciesIds){const a=closed.solved.result.concentrations[closed.solved.result.speciesIds.indexOf(id)],b=fixed.exact.result.concentrations[fixed.exact.result.speciesIds.indexOf(id)];assert.ok(Math.abs(a-b)<1e-12)}
 for(const o of fixed.sweep.outcomes){const exact=await fixed.fixed(o.coordinate);assert.deepEqual(o.result.concentrations,exact.result.concentrations);assert.equal(o.input.constraints.find(c=>c.componentId===ids.e).kh,2)}
 const charges=Object.fromEntries(realClosedRequest(repo).species.map(s=>[s.id,s.charge]));const charge=r=>r.speciesIds.filter(id=>id!==ids.e).reduce((n,id)=>n+charges[id]*r.concentrations[r.speciesIds.indexOf(id)],0)
 assert.ok(Math.abs(charge(fixed.exact.result))<1e-12);assert.ok(Math.abs(charge(fixed.sweep.outcomes[0].result))>1e-5);assert.ok(Math.abs(charge(fixed.sweep.outcomes[4].result))>1e-5)
 // Only the matching potential is equivalent to the electroneutral closed preparation.
})
test('real fixture cannot silently admit unbalanced preparation, imposed closed potential or edited source constants',async()=>{
 const q=realClosedRequest(repo);q.preparation.amounts[ids.Cl]=.004;assert.equal((await prepareClosedRedox(q)).ok,false)
 const imposed={...realClosedRequest(repo),Eh:expected.Eh};assert.equal((await prepareClosedRedox(imposed)).ok,false)
 const wrong={...repo,getSpeciesById:id=>{const r=repo.getSpeciesById(id);return id===ids.Vr?{...r,logK:-5.8}:r}};assert.throws(()=>realClosedRequest(wrong))
})
