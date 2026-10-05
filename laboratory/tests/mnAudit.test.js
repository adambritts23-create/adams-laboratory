import test from 'node:test'
import assert from 'node:assert/strict'
import { audit,included,compile,conversion,prepare,specification,analytical,sourceAmount,gridDefinition,classify,inventoryLeaders,coordinates } from '../scripts/validation/mnAudit.js'
import { prepareChemicalSystem } from '../src/solver/models.js'
import { solveFixedRedox,peToEh,ehToPe } from '../src/solver/redox.js'
import { createGridDefinition,runGrid } from '../src/calculations/grid.js'
import { reconstruct } from './phase6Helpers.js'
const s=await prepare()
const run=(system,pH,pe)=>solveFixedRedox(system,{pH,Eh:peToEh(pe),totals:{'Mn 2+':.001}})
const closeLog=(a,b)=>assert.ok(Math.abs(Math.log10(a)-Math.log10(b))<1e-8,`${a} vs ${b}`)
const request=await createGridDefinition(s,gridDefinition(s),0);assert.ok(request.ok)
const grid=await runGrid(s,request.grid)
test('Mn audit: all 83 records accounted for, 19 atom/charge-checked candidates, explicit exclusions',()=>{
 assert.equal(audit.length,83);assert.equal(included.length,19);assert.equal(s.aqueousRows.length,12);assert.equal(s.solidRows.length,7)
 assert.equal(audit.filter(a=>a.reason==='outside-Mn-H-O-components').length,63)
 assert.equal(audit.filter(a=>a.reason==='basis-identity-reverse-reaction').length,1)
 assert.ok(audit.every(a=>a.provenance&&Number.isFinite(a.logK)))
 for(const r of included)assert.ok(compile(r).sourceRecord)
 const reverse=audit.find(a=>a.name==='Mn 2+');assert.equal(reverse.logK+conversion.logK,0)
})
test('Mn audit: explicit MnIII substitution preserves original source mass action at independent coordinates',()=>{
 const transformed=included.filter(r=>compile(r).sourceRecord.conversion);assert.equal(transformed.length,4)
 for(const r of transformed)for(const [pH,pe,free] of [[0,0,1e-3],[7,10,1e-8],[14,-5,1e-10]]){
 const p=compile(r),log=p.logBeta+p.coefficients.reduce((sum,c,i)=>sum+c*[Math.log10(free),-pH,-pe,0][i],0)
 closeLog(10**log,sourceAmount(r,free,pH,pe));assert.ok(p.sourceRecord.conversion.record.originalLogK===-25.42)
 }
})
test('Mn audit: expanded aqueous monomer/dimer inventory matches independent quadratic, weights two Mn per dimer',async()=>{
 const spec=specification();spec.products=spec.products.filter(p=>p.phase==='aqueous');const p=await prepareChemicalSystem(spec);assert.ok(p.ok)
 const x=await run(p.system,8,0);assert.ok(x.ok);reconstruct(p.system,x.input,x.result)
 // Direct source products give a monotonic quadratic; reconstruct its total at the solver free activity.
 let total=x.result.concentrations[0]
 for(const r of included.filter(r=>r.phase==='aqueous')){const n=compile(r).coefficients[0],amount=sourceAmount(r,x.result.concentrations[0],8,0);total+=n*amount;closeLog(amount,x.result.concentrations[p.system.speciesIds.indexOf(r.id)])}
 assert.ok(Math.abs(total-.001)<1e-13)
 const dimers=x.contributions[0].aqueous.filter(a=>a.coefficient===2);assert.equal(dimers.length,2);assert.ok(dimers.every(a=>a.weightedMolality===2*a.molality&&a.molality>0))
})
test('Mn audit: accepted grid points independently satisfy source equations, quadratic/caps, inventory and phase selection',()=>{
 assert.equal(grid.counts.requested,195);assert.equal(grid.counts.converged,195);assert.equal(grid.counts.failed,0)
 for(const o of grid.outcomes.filter(o=>o.result.ok)){
 const a=analytical(o.x,ehToPe(o.y));closeLog(o.result.concentrations[0],a.free);reconstruct(s,o.input,o.result)
 for(const row of a.aqueous)closeLog(o.result.concentrations[s.speciesIds.indexOf(row.id)],row.molality)
 const present=o.result.solids.filter(p=>p.amount>0);assert.deepEqual(present.map(p=>p.id),a.solid?[a.solid.id]:[])
 if(a.solid)assert.ok(Math.abs(present[0].amount-a.solid.amount)<4e-14+2e-10*Math.abs(a.solid.amount))
 assert.deepEqual(o.result.method,grid.method)
 }
})
test('Mn audit: candidate order invariant for each sampled assemblage, coexistence fails explicitly',async()=>{
 const spec=specification();spec.products.reverse();const p=await prepareChemicalSystem(spec);assert.ok(p.ok)
 const examples=new Map();for(const o of grid.outcomes.filter(o=>o.result.ok))examples.set(o.result.solids.filter(p=>p.amount>0).map(p=>p.id).join(),o)
 for(const o of examples.values()){const x=await solveFixedRedox(p.system,{pH:o.x,Eh:o.y,totals:{'Mn 2+':.001}});assert.ok(x.ok);assert.deepEqual(x.result.concentrations,o.result.concentrations);assert.deepEqual(x.result.solids,o.result.solids)}
 const tie=await run(s,9,5.025);assert.equal(tie.ok,false);assert.equal(tie.diagnostics[0].code,'ambiguous-solid-assemblage');assert.equal(tie.result.result,null)
 const again=await run(p.system,9,5.025);assert.deepEqual(again.result,tie.result)
 assert.equal(tie.result.attempts.filter(a=>a.accepted).length,2)
})
test('Mn audit: classification retains mixtures, exact ties, stale, unsupported and failed samples',async()=>{
 assert.deepEqual(inventoryLeaders([{id:'a',weightedMolality:1},{id:'b',weightedMolality:1}]),['a','b'])
 const o=grid.outcomes.find(o=>o.result.ok&&o.result.solids.some(s=>s.amount>0));const c=classify(s,o)
 assert.ok(c.mixedAqueousAndSolid);assert.equal(c.aqueous.length,13);assert.equal(c.solids.length,7);assert.equal(c.criterion.threshold,null)
 assert.equal(classify(s,o,false).status,'stale');assert.equal(classify(s,{status:'unsupported'}).aqueous,null)
 const invalid=gridDefinition(s);invalid.componentConditions[0].value=0
 const invalidRequest=await createGridDefinition(s,invalid,0);assert.ok(invalidRequest.ok)
 const invalidGrid=await runGrid(s,invalidRequest.grid)
 const failed=invalidGrid.outcomes[0];assert.equal(classify(s,failed).status,'failed');assert.equal(classify(s,failed).leaders,null);assert.equal(failed.result.result,null)
 const tie=await run(s,9,5.025);assert.equal(classify(s,{status:'failed',result:tie.result,diagnostics:tie.diagnostics}).status,'ambiguous')
 const cancelled=await runGrid(s,request.grid,{signal:AbortSignal.abort()});assert.equal(cancelled.counts.notRun,195);assert.ok(cancelled.outcomes.every(o=>classify(s,o).aqueous===null))
})
test('Mn audit: exact numerical export contains all controls, conversion provenance and failure traces',()=>{
 const exported={system:s,grid,samples:grid.outcomes.map(o=>({coordinates:coordinates(o),classification:classify(s,o)}))}
 const copy=JSON.parse(JSON.stringify(exported))
 const exact=(a,b)=>{if(a&&typeof a==='object'){assert.deepEqual(Object.keys(a),Object.keys(b));for(const k of Object.keys(a))exact(a[k],b[k])}else assert.ok(a===b)}
 // JSON represents signed zero as 0; every numerical value otherwise round trips exactly.
 exact(exported,copy)
 assert.ok(exported.system.products.filter(p=>p.sourceRecord.conversion).length===4)
 assert.ok(exported.samples.every(p=>p.coordinates.referenceElectrode==='SHE'))
 assert.ok(grid.outcomes.every(o=>o.input.constraints[1].kh===2&&o.input.constraints[2].kh===2))
 assert.ok(grid.outcomes.filter(o=>o.result.ok).every(o=>o.result.residuals.componentBalance[2]===null))
})
