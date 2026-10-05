import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareChemicalSystem, createPointInput } from '../src/solver/models.js'
import { solvePoint } from '../src/solver/point.js'
import { multiSolidPolicy } from '../src/solver/assemblages.js'
import { specification, solids, basis, totals, analyticalTwoSolid, reconstruct } from './mixedCarbonateAudit.js'
const conditions = { revision: 0, unit: 'mol/kg-H2O', temperatureC: 25, pressureBar: 1, activityModel: 'ideal' }
async function run(spec, values) {
  const p = await prepareChemicalSystem({ ...spec, solidPolicy: multiSolidPolicy }); assert.ok(p.ok, JSON.stringify(p))
  const i = await createPointInput(p.system, { ...conditions, constraints: p.system.components.map((c, k) => ({ componentId: c.id, ...values[k] })) }); assert.ok(i.ok)
  return solvePoint(p.system, i.input)
}
const close = (a,b) => assert.ok(Math.abs(a-b) <= 1e-12 + 1e-10*Math.abs(b), a+' vs '+b)
// Artificial mathematical fixtures only; these are not thermodynamic database constants.
const toy = { ...specification([]), components: ['A','B'].map(name => ({ id:name, name, role:'ordinary' })), products: [
 { id:'a', name:'A-solid', phase:'solid', coefficients:[1,0], logBeta:3 },
 { id:'b', name:'B-solid', phase:'solid', coefficients:[0,1], logBeta:4 },
 { id:'c', name:'weaker-A', phase:'solid', coefficients:[1,0], logBeta:2 },
].map(p => ({...p,sourceRecord:{kind:'synthetic-mathematical-test'}})), sourceIdentity:{kind:'synthetic-mathematical-test'} }
const tv = [{kh:1,value:0.01},{kh:1,value:0.02}]
test('C: independent two-solid mathematical solution and candidate permutation', async () => {
 const r = await run(toy,tv); assert.ok(r.ok,JSON.stringify(r)); close(r.concentrations[0],0.001); close(r.concentrations[1],0.0001)
 close(r.solids.find(s=>s.id==='a').amount,0.009); close(r.solids.find(s=>s.id==='b').amount,0.0199)
 close(r.solids.find(s=>s.id==='c').logSaturation,-1)
 r.componentTotals.forEach((x,i)=>close(x,tv[i].value))
 const reversed = await run({...toy,products:[...toy.products].reverse()},tv)
 assert.deepEqual(reversed.concentrations,r.concentrations); assert.deepEqual(reversed.solids,r.solids)
})
const mixed = pH => run(specification(solids), basis.map((_,i)=>({kh:i<3?1:2,value:i<3?totals[i]:i===3?-pH:0})))
test('D: complete candidate set recovers audited pH12 closed form', async()=>{
 const r = await mixed(12); assert.ok(r.ok,JSON.stringify(r)); const w=analyticalTwoSolid(12)
 r.logActivities.slice(0,5).forEach((x,i)=>close(x,w.logA[i]));
 assert.deepEqual(r.solids.filter(s=>s.amount>0).map(s=>s.name).sort(),Object.keys(w.solidAmounts).sort())
 for(const s of r.solids.filter(s=>s.amount>0)) close(s.amount,w.solidAmounts[s.name])
})
test('E: pH14 full candidate selection independently satisfies three-solid mass action and inventories',async()=>{
 const r=await mixed(14); assert.ok(r.ok,JSON.stringify(r))
 const beta=name=>solids.find(s=>s.name===name).logK
 const ca=-beta('Ca(OH)2(cr)')-28, mg=-beta('Mg(OH)2(cr)')-28
 const logs=[ca,-beta('CaCO3(cr)')-ca,mg,-14,0], w=reconstruct(logs)
 const amounts={'CaCO3(cr)':totals[1]-w.dissolved[1], 'Ca(OH)2(cr)':w.dissolved[1]-w.dissolved[0], 'Mg(OH)2(cr)':totals[2]-w.dissolved[2]}
 assert.ok(Object.values(amounts).every(x=>x>0)); assert.ok(w.saturations.every(s=>s.logSaturation<=1e-12))
 r.logActivities.slice(0,5).forEach((x,i)=>close(x,logs[i]))
 assert.deepEqual(r.solids.filter(s=>s.amount>0).map(s=>s.name).sort(),Object.keys(amounts).sort())
 for(const s of r.solids.filter(s=>s.amount>0)) close(s.amount,amounts[s.name])
})


test('degenerate equal-stability phases reject arbitrary inventories; unequal polymorphs select stable phase', async()=>{
 const duplicate={...toy.products[0],id:'duplicate',name:'duplicate'}
 const r=await run({...toy,products:[...toy.products,duplicate]},tv)
 assert.equal(r.ok,false); assert.equal(r.diagnostics[0].code,'ambiguous-solid-assemblage'); assert.equal(r.result,null)
 const stable=await run({...toy,products:[...toy.products,{...duplicate,logBeta:2.5}]},tv)
 assert.ok(stable.ok); assert.equal(stable.solids.find(s=>s.id==='duplicate').amount,0)
 assert.ok(stable.attempts.some(a=>a.code==='dependent-active-solids'))
 assert.ok(stable.attempts.some(a=>a.diagnostics?.some(d=>d.code==='negative-solid-amount' || d.code==='solid-saturation')))
})
test('bounds fail closed without a truncated search; non-redox policy and fixed saturated reservoirs',async()=>{
 const products=Array.from({length:13},(_,i)=>({...toy.products[0],id:'s'+i,name:'s'+i}))
 const p=await prepareChemicalSystem({...toy,products,solidPolicy:multiSolidPolicy}); assert.equal(p.ok,false); assert.ok(p.diagnostics.some(d=>d.code==='unsupported-solid-count'))
 const components=Array.from({length:12},(_,i)=>({id:'X'+i,name:'X'+i,role:'ordinary'}))
 const many=await run({...toy,components,products:components.map((c,i)=>({...toy.products[0],id:'s'+i,name:'s'+i,coefficients:components.map((_,j)=>i===j?1:0)}))},components.map(()=>({kh:1,value:0.01})))
 assert.equal(many.ok,false); assert.equal(many.diagnostics[0].code,'assemblage-search-limit'); assert.equal(many.result,null)
 const fixed=await run(toy,[{kh:2,value:-3},{kh:2,value:-4}]); assert.equal(fixed.ok,false); assert.equal(fixed.diagnostics[0].code,'underdetermined-solid-inventory')
 const redox=await prepareChemicalSystem({...toy,solidPolicy:multiSolidPolicy,components:[{id:'e-',name:'e-',role:'electron'},toy.components[1]]})
 assert.equal(redox.ok,false); assert.ok(redox.diagnostics.some(d=>d.code==='unsupported-redox-assemblage'))
})


test('F: full pH sweep preserves independently reconstructed balances and complementarity without gaps',async()=>{
 const {createSweepDefinition,runSweep}=await import('../src/calculations/sweep.js')
 const {definitionFor,vary,reconstruct:verify}=await import('./phase6Helpers.js')
 const p=await prepareChemicalSystem({...specification(solids),solidPolicy:multiSolidPolicy}); assert.ok(p.ok)
 const input=await createPointInput(p.system,{...conditions,constraints:basis.map((componentId,i)=>({componentId,kh:i<3?1:2,value:i<3?totals[i]:i===3?-7:0}))})
 const def=vary(definitionFor(p.system,input.input),'H+','LAV',0,14,29,'pH')
 const request=await createSweepDefinition(p.system,def,0); assert.ok(request.ok,JSON.stringify(request))
 const sweep=await runSweep(p.system,request.sweep); assert.equal(sweep.counts.converged,29,JSON.stringify(sweep.counts))
 for(const o of sweep.outcomes){
  verify(p.system,o.input,o.result)
  const active=o.result.solids.filter(s=>s.amount>0).map(s=>s.name).sort()
  if(o.coordinate<=5) assert.equal(active.length,0)
  else if(o.coordinate<=9.5) assert.deepEqual(active,['CaCO3(cr)'])
  else assert.ok(active.length>=2)
  assert.equal(o.result.assemblageSelection.candidateSolidIds.length,10)
  assert.equal(o.result.method.name,sweep.method.name)
 }
})
test('phase-boundary neighborhoods retain nonnegative inventories and explicit failures',async()=>{
 for(const delta of [-1e-8,0,1e-8]){
  const r=await run(toy,[{kh:1,value:0.001*(1+delta)},tv[1]])
  if(!r.ok){ assert.equal(r.result,null); assert.ok(['ambiguous-solid-assemblage','no-consistent-solid-assemblage'].includes(r.diagnostics[0].code)); continue }
  assert.ok(r.solids.every(s=>s.amount>=0 && s.logSaturation<=1e-12))
  close(r.componentTotals[0],0.001*(1+delta))
 }
})
