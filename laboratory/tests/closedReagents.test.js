import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {automatic,controlled,exclusions,amounts,compareAmounts,reagentRequest,repo,scope,ids,initial} from '../scripts/validation/fePeroxideChecks.js'
import {prepareClosedReagents,solveClosedReagents} from '../src/thermodynamics/closedReagents.js'
import {runClosedReagentSweep,inspectClosedReagentSample} from '../src/calculations/closedReagentSweep.js'
import {numericalValidationContract as tolerance} from '../src/solver/validationContract.js'
const expected=JSON.parse(fs.readFileSync('docs/closed-redox-step5-independent-points.json'))
const main=await automatic()
const axis={reagentId:ids.P,min:0,max:initial.Fe,points:21}
const sweep=await runClosedReagentSweep(repo,reagentRequest(),scope,axis)
test('Step 5 actual reagents automatically discover all 24 source reactions without selected electron',()=>{
 assert.ok(main.ok);assert.equal(main.discovery.included.length,24);assert.equal(main.discovery.electronSelected,false);assert.ok(!main.discovery.inputReagentIds.includes(ids.e));assert.ok(!main.result.speciesIds.includes(ids.e));assert.equal(main.inspection.elements.Fe.unresolved,0)
})
for(const e of expected)test(`Step 5 independent raw-law expectation and equivalent controlled boundary conditions at dose ${e.peroxideSupplied}`,async()=>{
 const r=await automatic({peroxide:e.peroxideSupplied}),c=await controlled(r);assert.ok(r.ok);assert.ok(c.ok)
 assert.ok(compareAmounts(amounts(r),e.amounts)<tolerance.comparisonLogActivityTolerance)
 assert.ok(Math.abs(r.inspection.pH-e.pH)<tolerance.comparisonLogActivityTolerance)
 assert.ok(Math.abs(r.inspection.pe-e.pe)<tolerance.comparisonLogActivityTolerance)
 assert.ok(compareAmounts(amounts(r),Object.fromEntries(c.result.speciesIds.map((id,i)=>[id,c.result.concentrations[i]])))<tolerance.comparisonLogActivityTolerance)
 for(const row of [...r.closed.inspection.inventories,...r.closed.inspection.nonRedoxReactions,...r.closed.inspection.potentials,...r.closed.inspection.netReactions,r.closed.inspection.waterBalance])assert.ok(row.ok)
})
test('Step 5 generated net reaction retains electron cancellation, source coefficients and signed extent closure',()=>{
 const d=main.inspection.redistribution;assert.equal(d.status,'available');assert.ok(d.residuals.every(r=>Math.abs(r)<=d.limit))
 const r=d.reactions.find(r=>r.sourceIds.some(id=>id.endsWith(':152743')))
 assert.equal(r.electrons,2);assert.ok(Math.abs(r.logK-33.508)<1e-12)
 assert.deepEqual(r.reactants.map(s=>[s.id,s.coefficient]).sort(),[[ids.F2,2],[ids.P,1],[ids.H,2]].sort())
 assert.deepEqual(r.products.map(s=>[s.id,s.coefficient]).sort(),[[ids.F3,2],[ids.W,2]].sort())
 assert.deepEqual(r.halfReactionDirections.map(r=>r.role),['oxidation','reduction']);assert.ok(r.halfReactionDirections.every(r=>r.reference))
 assert.ok(Math.abs(r.extent-initial.peroxide)<1e-14)
})
test('Step 5 preparation history, supported bases and reversed source order preserve equilibrium',async()=>{
 const reversed={...repo,getSpecies:query=>repo.getSpecies(query).reverse(),getComponents:()=>repo.getComponents().reverse()}
 for(const basis of ['reagents','ferric'])for(const history of [0,1])for(const repository of [repo,reversed]){const r=await automatic({basis,history},repository);assert.ok(r.ok);assert.ok(compareAmounts(amounts(r),amounts(main))<tolerance.comparisonLogActivityTolerance)}
})
test('Step 5 scope fails closed for imposed conditions, electron inventory, changed sources and unreviewed metadata',async()=>{
 for(const extra of [{Eh:0},{pe:0},{pH:2},{amounts:{...reagentRequest().amounts,[ids.e]:0}},{amounts:{...reagentRequest().amounts,[ids.W]:1}}])assert.equal((await prepareClosedReagents(repo,{...reagentRequest(),...extra},scope)).ok,false)
 const changed={...repo,getSpecies:q=>repo.getSpecies(q).map(r=>r.id.endsWith(':152743')?{...r,logK:r.logK+.01}:r)}
 assert.equal((await prepareClosedReagents(changed,reagentRequest(),scope)).diagnostics[0].code,'unreviewed-reagent-source')
 const removed={...repo,getSpecies:q=>repo.getSpecies(q).filter(r=>!r.id.endsWith(':250448'))};assert.equal((await prepareClosedReagents(removed,reagentRequest(),scope)).diagnostics[0].code,'incomplete-reagent-source-scope')
 const missing=structuredClone(scope);delete missing.reactions['spana:2ac52a30213c9288:152743'];assert.equal((await prepareClosedReagents(repo,reagentRequest(),missing)).ok,false)
 const metadata=structuredClone(scope);delete metadata.metadata['spana:2ac52a30213c9288:250448'];assert.equal((await prepareClosedReagents(repo,reagentRequest(),metadata)).ok,false)
 assert.equal(solveClosedReagents({}).ok,false)
})
test('Step 5 reviewed aqueous domain excludes supersaturated high-Fe candidate and out-of-range additions',async()=>{
 const q=reagentRequest();q.amounts[ids.F2]=.001;q.amounts[ids.Cl]=.012
 assert.equal((await prepareClosedReagents(repo,q,scope)).diagnostics[0].code,'reagent-inventory-outside-scope')
 assert.equal((await automatic({peroxide:1.1e-6})).ok,false)
})
test('Step 5 broad closed addition sweep preserves inventories, phase exclusions and derived outputs',()=>{
 assert.deepEqual(sweep.counts,{requested:21,accepted:21,failed:0})
 for(const o of sweep.outcomes){const r=o.accepted,Fe=r.inspection.elements.Fe;assert.ok(Math.abs(Fe.total-initial.Fe)<tolerance.sourceAbsoluteBalanceFloor);assert.ok(Math.abs(Object.values(Fe.states).reduce((n,x)=>n+x,0)-Fe.total)<tolerance.sourceAbsoluteBalanceFloor);assert.equal(Fe.solidBound,0);assert.deepEqual(r.inspection.acceptedSolids,[]);assert.ok(Number.isFinite(r.inspection.pH));assert.ok(Number.isFinite(r.inspection.Eh));assert.ok(exclusions(r).filter(s=>s.phase==='solid'||s.phase==='gas').every(s=>s.logQ<0));assert.ok(r.closed.inspection.inventories.every(i=>i.ok))}
 assert.equal(new Set(sweep.outcomes.map(o=>o.accepted.requestId)).size,21)
 const d=sweep.outcomes.at(-1).accepted.inspection.carriers;assert.ok(d.find(s=>s.name==='O2').amount>2.49e-7);assert.ok(d.find(s=>s.id===ids.P).amount<1e-19)
})
test('Step 5 source-derived equivalence region is sampled without imposing textbook completion',async()=>{
 const net=main.inspection.redistribution.reactions.find(r=>r.sourceIds.some(id=>id.endsWith(':152743')))
 const dose=initial.Fe*net.reactants.find(s=>s.id===ids.P).coefficient/net.reactants.find(s=>s.id===ids.F2).coefficient
 const d=await runClosedReagentSweep(repo,reagentRequest(),scope,{...axis,min:dose-1e-10,max:dose+1e-10,points:17});assert.equal(d.counts.accepted,17)
 assert.ok(d.outcomes[0].accepted.inspection.elements.Fe.states[2]>d.outcomes.at(-1).accepted.inspection.elements.Fe.states[2]);assert.ok(d.outcomes.every(o=>o.accepted.inspection.elements.Fe.states[2]>0))
})
test('Step 5 selected sample is exact accepted result, retains dimer weighting and rejects stale or forged selection',()=>{
 for(const index of [0,10,20]){const s=inspectClosedReagentSample(sweep,index,{revision:1,scopeId:sweep.scopeId});assert.ok(s.ok);assert.equal(s.result,sweep.outcomes[index].result);assert.equal(s.accepted,sweep.outcomes[index].accepted);const fe=s.inspection.carriers.filter(c=>c.elements.Fe);const weighted=fe.reduce((n,c)=>n+c.elements.Fe*c.amount,0);assert.equal(weighted,s.inspection.elements.Fe.total)}
 for(const context of [{revision:2,scopeId:sweep.scopeId},{revision:1,scopeId:'stale'}])assert.equal(inspectClosedReagentSample(sweep,0,context).ok,false)
 assert.equal(inspectClosedReagentSample({...sweep},0,{revision:1,scopeId:sweep.scopeId}).ok,false)
})
test('Step 5 failed additions remain gaps and cancelled/stale sweeps cannot provide inspection',async()=>{
 const g=await runClosedReagentSweep(repo,reagentRequest(),scope,{...axis,max:2e-6,points:3});assert.equal(g.outcomes[2].status,'failed');assert.equal(g.outcomes[2].accepted,null);assert.equal(inspectClosedReagentSample(g,2,{revision:1,scopeId:g.scopeId}).ok,false)
 const stale=await runClosedReagentSweep(repo,reagentRequest(),scope,axis,{isCurrent:()=>false});assert.equal(stale.status,'invalidated-stale')
 const c=new AbortController();c.abort();const cancelled=await runClosedReagentSweep(repo,reagentRequest(),scope,axis,{signal:c.signal});assert.equal(cancelled.status,'cancelled')
})
test('Step 5 analytical axis validation retains existing invalid/reversed-range rules',async()=>{
 for(const a of [{...axis,min:1,max:0},{...axis,min:-1},{...axis,points:1},{...axis,points:NaN},{...axis,reagentId:ids.e}])assert.equal((await runClosedReagentSweep(repo,reagentRequest(),scope,a)).ok,false)
})
