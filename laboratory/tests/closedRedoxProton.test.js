import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {prepareClosedRedox,solveClosedRedox} from '../src/solver/closedRedox.js'
import {compileClosedRedoxNetwork} from '../src/thermodynamics/closedRedoxNetwork.js'
import {solvePoint} from '../src/solver/point.js'
import {scaleReaction} from '../src/thermodynamics/reactionBasis.js'
import {protonRequest,runProton,controls,amounts,target,ids,expected} from '../scripts/validation/closedRedoxProton.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const near=(a,b,t=1e-12)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=t,`${a} vs ${b}`)
const verify=r=>{for(const [id,n] of Object.entries(target())){const a=amounts(r)[id];near(a,n);near(Math.log10(a),Math.log10(n),1e-10)}}
const inventory=r=>{const n=amounts(r);return {charge:3*n[ids.Vo]+2*n[ids.Vr]+3*n[ids.Euo]+2*n[ids.Eur]+2*n[ids.VH]+n[ids.H]-n[ids.OH]-n[ids.Cl],acid:n[ids.H]-n[ids.OH]-n[ids.VH]}}

test('independent water/proton scalar solution is pinned before production and satisfies every raw law',()=>{
 const saved=JSON.parse(fs.readFileSync('docs/closed-redox-step4-independent.json'))
 for(const k of ['h','x','v3','vh','oh','eu3','eu2','pH','peV','peEu','Eh','exactEh','exactFaraday'])assert.equal(expected[k],saved[k])
 near(expected.h-expected.oh-expected.vh,expected.A,1e-17)
 near(expected.v3+expected.vh+expected.x,expected.T,1e-17)
 near(expected.eu3+expected.eu2,expected.T,1e-17)
 near(Math.log10(expected.vh*expected.h/expected.v3),-2.26,1e-13)
 near(Math.log10(expected.h*expected.oh),-14.0015,1e-13)
 near(expected.peV,expected.peEu,1e-13)
 // F is strictly increasing: OH and hydrolysed V(III) decrease as h grows.
 const F=h=>{const r=Math.sqrt(expected.K/(1+expected.kh/h));return h-expected.kw/h-expected.T/(1+r)*expected.kh/(h+expected.kh)-expected.A}
 assert.ok(F(expected.A)<0);assert.ok(F(expected.A+expected.T+expected.kw/expected.A)>0)
 const grid=Array.from({length:101},(_,i)=>expected.A+expected.T*i/100);for(let i=1;i<grid.length;i++)assert.ok(F(grid[i])>F(grid[i-1]))
})

test('one simultaneous real redox/hydrolysis/water network derives pH and Eh with physical closure',async()=>{
 const {prepared,solved:r}=await runProton(repo);verify(r.result)
 near(r.inspection.pH,expected.pH,1e-10);near(r.inspection.pe,expected.peV,1e-10);near(r.inspection.Eh,expected.exactEh,1e-11)
 assert.equal(prepared.network.version,'closed-redox-aqueous-closure-v2')
 assert.equal(prepared.network.halves.length,2);assert.equal(prepared.network.ordinaryReactions.length,2)
 assert.ok(r.inspection.nonRedoxReactions.every(c=>c.ok));assert.ok(r.inspection.potentials.every(c=>c.ok));assert.ok(r.inspection.netReactions.every(c=>c.ok));assert.ok(r.inspection.inventories.every(c=>c.ok))
 assert.ok(prepared.network.cancellations.every(c=>c.electronResidual===0))
 assert.deepEqual(prepared.input.constraints.filter(c=>c.kh===2),[{componentId:ids.W,kh:2,value:0}]);assert.ok(!r.result.speciesIds.includes(ids.e))
 assert.ok(!prepared.inventories.some(c=>['H','O'].includes(c.key)));assert.ok(prepared.inventories.some(c=>c.key==='H-2O'))
 near(inventory(r.result).charge,0);near(inventory(r.result).acid,expected.A)
 assert.ok(r.inspection.waterBalance.ok);near(r.inspection.waterBalance.waterToSolutes,expected.vh+expected.oh)
 assert.equal(r.result.concentrations[r.result.speciesIds.indexOf(ids.W)],0);assert.equal(r.inspection.waterBalance.logActivity,0)
})

test('proton closure survives both preparations, physical bases, solvent position and reaction order',async()=>{
 let first
 for(const alternate of [false,true])for(const history of [0,1])for(const reverse of [false,true]){
  const q=protonRequest(repo,{alternate,history,reverse});if(reverse)q.basisIds=[ids.W,...q.basisIds.filter(id=>id!==ids.W)]
  const p=await prepareClosedRedox(q);assert.ok(p.ok,JSON.stringify(p));const r=solveClosedRedox(p);assert.ok(r.ok,JSON.stringify(r));verify(r.result)
  near(r.inspection.pH,expected.pH,1e-10);near(r.inspection.Eh,expected.exactEh,1e-11);near(inventory(r.result).charge,0)
  const rows=Object.fromEntries(p.inventories.map(c=>[c.key,c.total]));if(!first)first=rows;for(const k of Object.keys(first))near(rows[k],first[k],1e-17)
 }
 const a=await runProton(repo),b=await runProton(repo,{history:1});assert.notEqual(a.prepared.preparationId,b.prepared.preparationId)
 // Hydrolysis history exchanges solvent water; conserved H-2O is identical.
 near(a.solved.inspection.waterBalance.finalSoluteO,b.solved.inspection.waterBalance.finalSoluteO)
 near(a.solved.inspection.waterBalance.waterToSolutes-b.solved.inspection.waterBalance.waterToSolutes,.0001)
})

test('ordinary and electron-bearing source reactions may be reversed/scaled without fake electron terms',async()=>{
 const q=protonRequest(repo);q.reactions=q.reactions.map((r,i)=>scaleReaction(r,i%2?-2:3));const p=await prepareClosedRedox(q);assert.ok(p.ok,JSON.stringify(p));const r=solveClosedRedox(p);assert.ok(r.ok,JSON.stringify(r));verify(r.result);assert.ok(r.inspection.nonRedoxReactions.every(c=>c.ok))
})

test('exact fixed-pH, fixed-Eh and both-controlled comparisons preserve equivalent equilibrium inventories',async()=>{
 const c=await controls(repo);for(const r of [c.atPH,c.atEh,c.atBoth]){verify(r);near(inventory(r).charge,0);near(inventory(r).acid,expected.A)}
 // Other reservoir values are different thermodynamic systems, never branded closed results.
 const alteredPH=await c.fixedPH(expected.pH+.2),alteredEh=await c.fixedEh(expected.exactEh+.02)
 assert.ok(Math.abs(inventory(alteredPH).acid-expected.A)>1e-5);assert.ok(Math.abs(inventory(alteredPH).charge)>1e-5)
 near(inventory(alteredEh).acid,expected.A);assert.ok(Math.abs(inventory(alteredEh).charge)>1e-5)
})

test('water inventory, undeclared solvent, imposed proton/electron reservoirs and bad source metadata fail closed',async()=>{
 for(const edit of [q=>delete q.solvent,q=>q.solvent.logActivity=-1,q=>q.solvent.total=55.5,q=>q.preparation.amounts[ids.W]=55.5,q=>q.preparation.amounts[ids.e]=.001,q=>q.fixedActivities={[ids.H]:-3},q=>q.pH=3,q=>q.Eh=-.3,q=>q.species.find(s=>s.id===ids.W).elements.H=1,q=>q.species.find(s=>s.id===ids.H).charge=0,q=>q.basisIds=q.basisIds.filter(id=>id!==ids.W),q=>q.reactions.find(r=>r.id===ids.VH).terms.find(t=>t.id===ids.H).coefficient=1,q=>q.preparation.amounts[ids.Cl]=.005]){
  const q=protonRequest(repo);edit(q);assert.equal((await prepareClosedRedox(q)).ok,false)
 }
 const pure=protonRequest(repo);pure.reactions=pure.reactions.filter(r=>!r.terms.some(t=>t.id===ids.e));assert.equal(compileClosedRedoxNetwork(pure).diagnostics[0].code,'missing-redox-network')
 const cycle=protonRequest(repo);cycle.reactions.push({...cycle.reactions.find(r=>r.id===ids.OH),id:'inconsistent-water',logK:-13});assert.equal(compileClosedRedoxNetwork(cycle).ok,false)
})


test('cancellation-residue initialization preserves the signed target and cannot alter fixed water activity',async()=>{
 const q=protonRequest(repo,{history:1}),p=await prepareClosedRedox(q);assert.ok(p.ok)
 const total=p.input.constraints.find(c=>c.componentId===ids.Vo).value
 assert.ok(total>0&&total<1e-18);assert.ok(p.initialLogActivities)
 const r=solveClosedRedox(p);assert.ok(r.ok);verify(r.result)
 assert.equal(r.input.constraints.find(c=>c.componentId===ids.Vo).value,total)
 for(const bad of [[],p.initialLogActivities.map(()=>NaN),p.initialLogActivities.map((n,i)=>p.system.components[i].role==='water'?-1:n)])assert.equal(solvePoint(p.system,p.input,{initialLogActivities:bad}).diagnostics[0].code,'invalid-options')
})
