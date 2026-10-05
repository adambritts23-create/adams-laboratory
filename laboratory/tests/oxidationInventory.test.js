import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {oxidationFixture} from '../scripts/validation/oxidationFixtures.js'
import {summarizeOxidationInventory,prepareOxidationAllocation,classifyOxidationPoint,oxidationTieTolerance} from '../src/analysis/oxidationInventory.js'
import {solveFixedRedox,peToEh} from '../src/solver/redox.js'
const carrier=(id,amount,oxidationState,count=1,phase='aqueous')=>({id,name:id,amount,phase,distribution:[{oxidationState,count}]})
const fe=await oxidationFixture('Fe'),cu=await oxidationFixture('Cu'),mn=await oxidationFixture('Mn')
async function point(f,pH,pe){const x=await solveFixedRedox(f.system,{pH,Eh:peToEh(pe),totals:{[f.system.components[0].id]:.001}});assert.ok(x.ok,JSON.stringify(x.diagnostics));return {x,c:classifyOxidationPoint(f.model,f.system,x.input,x.result,{currentRevision:0})}}
test('oxidation largest fraction is predominant without a majority; deterministic and no alphabetical tie-break',()=>{
 const carriers=[carrier('two',.45,2),carrier('three',.4,3),carrier('zero',.15,0)]
 const a=summarizeOxidationInventory(carriers,1),b=summarizeOxidationInventory([...carriers].reverse(),1)
 assert.equal(a.predominant,2);assert.equal(a.majority,false);assert.equal(a.largestFraction,.45);assert.equal(a.secondLargestFraction,.4);assert.ok(Math.abs(a.margin-.05)<1e-15)
 assert.deepEqual(a,b)
})
test('oxidation explicit tie tolerance is in analytical fractions; exact and near ties remain unassigned',()=>{
 for(const delta of [0,oxidationTieTolerance/4]){const a=summarizeOxidationInventory([carrier('a',.5+delta,2),carrier('b',.5-delta,3)],1);assert.equal(a.status,'tie');assert.equal(a.predominant,null);assert.deepEqual(new Set(a.tiedStates),new Set([2,3]))}
 const a=summarizeOxidationInventory([carrier('a',.5+oxidationTieTolerance,2),carrier('b',.5-oxidationTieTolerance,3)],1);assert.equal(a.predominant,2);assert.equal(a.majority,true)
})
test('oxidation includes weighted solids and aqueous inventory; secondary carrier uses component amount',()=>{
 const a=summarizeOxidationInventory([carrier('oxide',.3,3,2,'solid'),carrier('ion',.4,3)],1)
 assert.equal(a.fractions[0].fraction,1);assert.equal(a.secondaryCarriers[0].name,'oxide');assert.equal(a.secondaryCarriers[0].componentAmount,.6)
 assert.equal(summarizeOxidationInventory([carrier('missing',.9,2)],1).status,'unavailable')
 assert.equal(summarizeOxidationInventory([],1e-20).status,'unavailable')
})
test('oxidation metadata requires absolute reference, electron localization and full carrier coverage',()=>{
 for(const mutate of [m=>delete m.reference,m=>delete m.carriers[fe.system.components[0].id],m=>{m.carriers[fe.system.components[0].id].electronLocalization='unknown'}]){const m=structuredClone(fe.metadata);mutate(m);assert.equal(prepareOxidationAllocation(fe.system,m).status,'unavailable')}
 const model=structuredClone(fe.metadata);model.systemId='wrong';assert.equal(prepareOxidationAllocation(fe.system,model).status,'unavailable')
})
test('mixed-valence magnetite allocates one II and two III, never an average state',()=>{
 const a=fe.model.allocations.find(a=>a.name==='Fe3O4(cr)');assert.deepEqual(a.distribution,[{oxidationState:2,count:1},{oxidationState:3,count:2}])
 const s=summarizeOxidationInventory([{...a,amount:1}],3);assert.equal(s.predominant,3);assert.equal(s.fractions.find(f=>f.oxidationState===2).fraction,1/3);assert.equal(s.fractions.find(f=>f.oxidationState===3).fraction,2/3)
 const m=structuredClone(fe.metadata);delete m.carriers[a.id].allocation;assert.equal(prepareOxidationAllocation(fe.system,m).reason,'unresolved-mixed-valence')
 m.carriers[a.id].allocation=[{oxidationState:3,count:3}];assert.equal(prepareOxidationAllocation(fe.system,m).reason,'inconsistent-oxidation-allocation')
})
test('solid-dominated FeIII remains state III, with exact hematite amount retained as secondary carrier',async()=>{
 const {x,c}=await point(fe,7,13);assert.equal(c.status,'classified');assert.equal(c.predominant,3);assert.ok(c.fractions.find(f=>f.oxidationState===3).fraction>.99)
 assert.equal(c.secondaryCarriers[0].name,'Fe2O3(cr)');assert.equal(c.secondaryCarriers[0].phase,'solid')
 const solid=x.result.solids.find(s=>s.name==='Fe2O3(cr)');assert.equal(c.acceptedSolids.find(s=>s.name===solid.name).amount,solid.amount);assert.equal(c.secondaryCarriers[0].componentAmount,2*solid.amount)
})
test('absent solid candidates contribute zero; accepted free and aqueous carriers all close',async()=>{
 const {c}=await point(fe,2,0);assert.equal(c.predominant,2);assert.equal(c.acceptedSolids.length,0);assert.ok(c.carriers.filter(c=>c.phase==='solid').every(c=>c.componentAmount===0));assert.ok(Math.abs(c.fractions.reduce((s,f)=>s+f.fraction,0)-1)<1e-10)
})
test('failed, not-run, ambiguous, stale and forged outcomes never classify',async()=>{
 const {x}=await point(fe,7,13)
 for(const status of ['failed','not-run','ambiguous-solid-assemblage','unsupported'])assert.equal(classifyOxidationPoint(fe.model,fe.system,x.input,x.result,{currentRevision:0,status}).status,'unavailable')
 assert.equal(classifyOxidationPoint(fe.model,fe.system,x.input,x.result,{currentRevision:1}).reason,'stale')
 assert.equal(classifyOxidationPoint(fe.model,fe.system,x.input,structuredClone(x.result),{currentRevision:0}).status,'unavailable')
})
test('independent stripped Fe Nernst control verifies fractions and transition; classifier never uses the line',async()=>{
 const f=await oxidationFixture('Fe',{pairOnly:true}),K=13.051
 for(const offset of [-1,0,1]){const {c}=await point(f,2,K+offset);const expectedIII=1/(1+10**(-offset));assert.ok(Math.abs(c.fractions.find(f=>f.oxidationState===3).fraction-expectedIII)<1e-10);assert.equal(c.status,offset===0?'tie':'classified');if(offset!==0)assert.equal(c.predominant,offset>0?3:2)}
})
test('generic Cu and Mn cross-checks include metallic, monovalent and multivalent inventories',async()=>{
 for(const [pH,pe,state] of [[2,0,0],[7,2,1],[7,13,2]])assert.equal((await point(cu,pH,pe)).c.predominant,state)
 assert.equal(mn.model.allocations.find(a=>a.name==='MnO2(s)').distribution[0].oxidationState,4)
 assert.deepEqual(mn.model.allocations.find(a=>a.name==='Mn3O4(s)').distribution,[{oxidationState:2,count:1},{oxidationState:3,count:2}])
 const {c}=await point(mn,7,13);assert.notEqual(c.status,'unavailable');assert.ok(Math.abs(c.fractions.reduce((n,f)=>n+f.fraction,0)-1)<1e-10)
})
test('generic production classifier contains no metal-specific assignment table or solver call',()=>{
 const source=fs.readFileSync('src/analysis/oxidationInventory.js','utf8');assert.doesNotMatch(source,/Fe2O3|Fe3O4|Cu2O|MnO2|solvePoint|solveFixedRedox/)
 assert.equal(fe.model.publicSupported,false)
})
