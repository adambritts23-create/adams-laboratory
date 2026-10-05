import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {networkBenchmarks,repo,ids,physical} from '../scripts/validation/networkBenchmarks.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork} from '../src/thermodynamics/equilibriumNetwork.js'
const b=await networkBenchmarks()
test('compiler preserves reviewed Fe peroxide source scope and independent Step-5 expectations',()=>{
 for(const c of b.fe){assert.ok(c.result.ok);assert.equal(c.compiled.inspection.included.length,24);assert.ok(c.comparison.maximumCarrierLogError<1e-9);assert.ok(Math.abs(c.comparison.pHError)<1e-9);assert.ok(Math.abs(c.comparison.peError)<1e-9);assert.ok(c.compiled.inspection.reviewedScope)}
})
test('two soluble redox families and non-Fe network agree with separate raw-law balances',()=>{
 for(const c of [b.mixed,b.eu]){assert.ok(c.result.ok);assert.ok(c.comparison.maximumCarrierLogError<1e-9);assert.ok(Math.abs(c.comparison.peError)<1e-9);assert.ok(Math.abs(c.comparison.pHError)<1e-9);assert.ok(c.comparison.reference.maximumMassActionResidual<1e-10);assert.ok(Math.abs(c.comparison.reference.netCharge)<1e-12);assert.ok(c.comparison.reference.maximumScaledBalance<1e-12);assert.ok(c.result.accepted.closed.inspection.inventories.every(i=>i.ok));assert.ok(c.result.accepted.closed.inspection.waterBalance.ok);assert.ok(c.result.accepted.closed.inspection.nonRedoxReactions.every(r=>r.ok));assert.ok(c.result.accepted.closed.inspection.potentials.every(r=>r.ok));assert.ok(!c.request.selectedIds.includes('component:e-'));assert.equal(c.compiled.inspection.Eh,'derived')}
 assert.ok(b.mixed.compiled.inspection.redoxFamilies.some(f=>f.conservedElements==='Fe'));assert.ok(b.mixed.compiled.inspection.redoxFamilies.some(f=>f.conservedElements==='Eu'));assert.ok(!JSON.stringify(b.eu.compiled.inspection.metadata).includes('"Fe":'))
})
test('abstract signed proton equivalents compile acid/base source laws without spectator inventory',()=>{
 for(const c of b.acid){assert.ok(c.result.ok);assert.equal(c.compiled.inspection.included.length,2);assert.ok(c.comparison.maximumCarrierLogError<1e-9);assert.ok(Math.abs(c.comparison.pHError)<1e-9);assert.ok(Math.abs(c.comparison.chargeError)<1e-10);assert.ok(Math.abs(c.comparison.carbonError)<1e-10);assert.ok(Math.abs(c.comparison.protonEquivalentError)<1e-10);assert.equal(c.compiled.inspection.redoxCoupling,false);assert.ok(c.compiled.inspection.algebra.expressions.every(r=>r.checks.charge.status==='passed'&&r.checks.elements.status==='passed'));assert.ok(!c.request.selectedIds.some(id=>/Na|K%/.test(id)));assert.ok(c.compiled.inspection.unreachable.length>0)}
})
test('excluded supersaturated Fe phases withhold complete equilibrium despite aqueous convergence',()=>{
 assert.equal(b.limited.result.ok,false);assert.ok(b.limited.result.candidate.ok);assert.ok(!b.limited.result.accepted);assert.equal(b.limited.result.diagnostics[0].code,'relevant-solid-or-unresolved-phase');assert.ok(b.limited.result.phaseDiagnostics.some(p=>p.name==='Fe2O3(cr)'&&p.logActivity>0))
})
test('compiler fails closed for missing metadata, unknown identities, boundary conflicts and forged results',async()=>{
 const q=b.acid[0].request
 for(const patch of [{boundary:'anything'},{sourceFingerprint:'wrong'},{selectedIds:[ids.H,ids.W,'component:Cu%202%2B']},{selectedIds:[ids.H,ids.H]},{selectedIds:[ids.W,'component:e-']},{phases:['aqueous','solid']},{amounts:{[ids.A]:.5}},{exclusions:['x']},{Eh:0}])assert.equal((await compileEquilibriumNetwork(repo,{...q,...patch})).ok,false)
 assert.equal(solveEquilibriumNetwork({...b.acid[0].compiled}).ok,false)
 const unbalanced=await physical({[ids.F]:.001});assert.equal(unbalanced.result.ok,false)
 const changed={...repo,getSpecies:()=>repo.getSpecies().map((r,i)=>i===0?{...r,logK:r.logK+.1}:r)};assert.equal((await compileEquilibriumNetwork(changed,q)).diagnostics[0].code,'source-integrity')
})
test('source identity ordering leaves analytical accepted amounts invariant',async()=>{
 const reversed={...repo,getSpecies:()=>repo.getSpecies().toReversed(),getComponents:()=>repo.getComponents().toReversed()},c=await compileEquilibriumNetwork(reversed,b.acid[2].request),r=solveEquilibriumNetwork(c)
 assert.ok(r.ok);for(const [i,id] of r.accepted.speciesIds.entries()){const old=b.acid[2].result.accepted;assert.ok(Math.abs(r.accepted.concentrations[i]-old.concentrations[old.speciesIds.indexOf(id)])<1e-12)}
})
test('Calculation integration uses compiler without replacing reviewed engines or adding a new mode',()=>{
 const ui=fs.readFileSync('src/components/GeneralClosedPanel.jsx','utf8');assert.match(ui,/compileEquilibriumNetwork/);assert.match(ui,/solveEquilibriumNetwork/);assert.doesNotMatch(ui,/prepareGeneralClosed|solveGeneralClosed/)
 const beaker=fs.readFileSync('src/components/InteractiveBeaker.jsx','utf8');assert.doesNotMatch(beaker,/ObserverPortrait/);assert.match(beaker,/<BeakerDrawing state=\{state\}/)
})
