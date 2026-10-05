import fs from 'node:fs'
import assert from 'node:assert/strict'
import {repo,requestFor,reference as acidReference} from './nonRedoxPhysicalBenchmark.js'
import {request,crRequest,refs} from './exactConservationRun.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork} from '../../src/thermodynamics/equilibriumNetwork.js'
const results=[]
async function run(q,ref,label){const c=await compileEquilibriumNetwork(repo,q);assert.ok(c.ok,JSON.stringify(c.diagnostics));const r=solveEquilibriumNetwork(c);assert.ok(r.ok,JSON.stringify(r.diagnostics));const i=r.accepted.inspection;assert.ok(Math.abs(i.pH-ref.pH)<1e-8,label+' pH');assert.ok(Math.abs(i.pe-ref.pe)<1e-8,label+' pe');let maxLogRatio=0;for(const carrier of i.carriers){const expected=ref.amounts?.[carrier.id]??ref.carriers?.[carrier.name];if(expected===undefined)continue;if(expected>0){const error=Math.abs(Math.log10(carrier.amount/expected));maxLogRatio=Math.max(maxLogRatio,error);assert.ok(error<1e-7,label+' trace '+carrier.name+' '+error)}}assert.equal(c.preparedSystemInput.prepared.network.sourceConservation.reviewedSpan,'matched');results.push({label,pH:i.pH,pe:i.pe,maxLogRatio});fs.writeFileSync('docs/production-source-gate.json',JSON.stringify({ok:true,results},null,2))}
try{
 for(const ref of refs)await run(crRequest(ref.volumeMl),{pH:ref.reference.pH,pe:ref.reference.pe,carriers:Object.fromEntries(ref.reference.carriers.map(c=>[c.name,c.amount]))},'Cr '+ref.volumeMl)
 for(const ref of JSON.parse(fs.readFileSync('docs/closed-redox-step5-independent-points.json')))await run({...request({'component:Fe%202%2B':1e-6,'component:H2O2':ref.peroxideSupplied,'component:H%2B':.01,'component:Cl-':.010002}),reviewedScope:true},ref,'Fe '+ref.peroxideSupplied)
 await run(request({'component:Eu%203%2B':1e-6,'component:H%2B':.01,'component:Cl-':.010003}),JSON.parse(fs.readFileSync('docs/open-closed-independent.json')),'Eu')
 for(const volume of [0,10,100]){const c=await compileEquilibriumNetwork(repo,{...requestFor(volume),boundary:'physical-preparation'}),r=solveEquilibriumNetwork(c);assert.ok(r.ok);assert.ok(Math.abs(r.derived.pH-acidReference.benchmark.find(p=>p.volumeMl===volume).pH)<1e-9);results.push({label:'acetate/borate '+volume,pH:r.derived.pH})}
 const lithium=await compileEquilibriumNetwork(repo,request({'component:Li%2B':.01,'component:CH3COO-':.01}));assert.ok(lithium.ok);assert.ok(solveEquilibriumNetwork(lithium).ok);results.push({label:'Li acetate'})
 fs.writeFileSync('docs/production-source-gate.json',JSON.stringify({ok:true,results},null,2));console.log('Passed',results.length)
}catch(error){fs.writeFileSync('docs/production-source-gate.json',JSON.stringify({ok:false,results,error:error.message,stack:error.stack},null,2));throw error}
