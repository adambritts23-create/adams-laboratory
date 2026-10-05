import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {gunzipSync} from 'node:zlib'
import {createRepository} from '../src/thermodynamics/repository.js'
import {prepareElementCandidate,elementGridDefinition} from '../src/analysis/prepareElementCandidate.js'
import {prepareRegisteredOxidation} from '../src/analysis/registeredElementOxidation.js'
import {inspectRegisteredPoint,assessPourbaixCandidate,elementPhaseScope} from '../src/analysis/pourbaixContract.js'
import {cuOxidationMetadata as registry} from '../src/analysis/cuOxidationMetadata.js'
import {cuPourbaixCandidate as contract} from '../src/analysis/cuPourbaixContract.js'
import {feOxidationMetadata} from '../src/analysis/feOxidationMetadata.js'
import {fePourbaixCandidate} from '../src/analysis/fePourbaixContract.js'
import {runBoundedPourbaix,pourbaixSample,exportPourbaix} from '../src/calculations/boundedPourbaix.js'
import {pourbaixSvg,pourbaixRepresentatives,pourbaixSampleIndex} from '../src/plots/pourbaixView.js'
import {identity,prepareChemicalSystem} from '../src/solver/models.js'
import {componentBalanceTolerance} from '../src/solver/validationContract.js'
const repository=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const p=await prepareElementCandidate(repository,registry),{system,model,waterModel}=p
const r=await runBoundedPourbaix(p,elementGridDefinition(system,contract),0,contract)
const reference=JSON.parse(gunzipSync(fs.readFileSync('docs/cu-haltafall-reference.json.gz')))
const view={element:'Cu',styles:{0:{label:'Cu(0)',color:'#465260'},1:{label:'Cu(I)',color:'#237b9a'},2:{label:'Cu(II)',color:'#ab7538'}},anchors:{0:[7,-.7],1:[9,-.05],2:[8,.7]}}

test('Cu uses the registered generic pipeline with exact metadata, chemistry and phase pins',async()=>{
 assert.ok(r.ok,JSON.stringify(r));assert.equal(await identity(registry),contract.metadataSha256);assert.equal(system.id,contract.systemId)
 assert.equal(registry.rows.length,14);assert.equal(new Set(registry.rows.map(x=>x.sourceSpeciesId)).size,14)
 for(const row of registry.rows){assert.equal(row.allocation.reduce((a,b)=>a+b.count,0),row.componentCount);assert.equal(row.conservedComponent,registry.conservedComponent);assert.ok(row.provenance.sourceCitation);assert.ok(row.provenance.references.length);assert.equal(row.bindingSha256.length,64)}
 assert.equal(r.support.publicEnabled,false);assert.equal(elementPhaseScope(system,contract).modified,false)
 assert.deepEqual(r.grid.counts,{requested:2565,converged:2565,failed:0,notRun:0})
})
test('Cu grid has all three states, complete total inventory, explicit fractions and symmetric tie policy',()=>{
 const counts={};for(const c of r.points){counts[c.predominant]=(counts[c.predominant]??0)+1;assert.equal(c.totalInventory,.0001);assert.equal(c.unresolvedInventory,0);assert.ok(Math.abs(c.residual)<=componentBalanceTolerance(.0001,.0001));assert.equal(c.majority,c.largestFraction>.5);assert.equal(c.tieTolerance,1e-8);for(const f of c.fractions)assert.equal(f.fraction,f.amount/c.total)}
 assert.deepEqual(counts,{0:1179,1:156,2:1230})
})
test('Cu(I) oxide counts two Cu atoms and Cu(II) hydrolysis polymers retain their full weighting',()=>{
 const c=r.points[pourbaixSampleIndex(contract,9,-.05)],solid=c.acceptedSolids.find(s=>s.id==='spana:2ac52a30213c9288:104641');assert.ok(solid);assert.equal(solid.componentAmount,2*solid.amount);assert.equal(c.predominant,1)
 for(const [id,count] of [[104107,2],[105296,3]]){const row=registry.rows.find(x=>x.sourceSpeciesId==='spana:2ac52a30213c9288:'+id);assert.deepEqual(row.allocation,[{oxidationState:2,count}]);for(const c of r.points){const amount=c.carriers.find(x=>x.id===row.id);assert.equal(amount.componentAmount,count*amount.formulaAmount)}}
})
test('Cu unknown, ambiguous, implicit or altered allocations reject before any trace waiver',async()=>{
 const altered=structuredClone(system);altered.products[0].id='unsupported-source-carrier';const prepared=await prepareChemicalSystem(altered);assert.ok(prepared.ok);assert.equal((await prepareRegisteredOxidation(prepared.system,registry)).reason,'missing-carrier-metadata')
 for(const mutate of [m=>m.rows.pop(),m=>m.rows.push(m.rows[0]),m=>delete m.rows[1].allocation,m=>m.rows[1].allocation=[{oxidationState:2,count:1}],m=>m.rows[1].bindingSha256='0'.repeat(64)]){const changed=structuredClone(registry);mutate(changed);assert.equal((await prepareRegisteredOxidation(system,changed)).status,'unavailable')}
 assert.equal(registry.materiality.unresolvedInventoryFloor,0)
})
test('Fe and Cu metadata cannot contaminate each other or claim the other support contract',async()=>{
 const fe=await prepareElementCandidate(repository,feOxidationMetadata)
 assert.equal((await prepareRegisteredOxidation(system,feOxidationMetadata)).status,'unavailable');assert.equal((await prepareRegisteredOxidation(fe.system,registry)).status,'unavailable')
 const o=r.grid.outcomes[0];assert.equal(inspectRegisteredPoint(model,system,o.input,o.result,{currentRevision:0,waterModel},fePourbaixCandidate).reason,'metadata-evidence-mismatch')
 assert.equal(assessPourbaixCandidate(model,system,r.grid,{currentRevision:0,waterModel},fePourbaixCandidate).eligible,false)
})
test('Cu support rejects changed total, phase scope, grid evidence and stale or forged results',()=>{
 for(const changed of [{...contract,total:.001},{...contract,metadataSha256:'changed'},{...contract,includedSolids:contract.includedSolids.slice(1)},{...contract,pH:{...contract.pH,points:29}}])assert.equal(assessPourbaixCandidate(model,system,r.grid,{currentRevision:0,waterModel},changed).eligible,false)
 assert.equal(pourbaixSample(r,0,1),null);assert.equal(pourbaixSample({...r},0,0),null);assert.equal(exportPourbaix({...r},0),null);assert.equal(exportPourbaix(r,1),null)
})
test('Cu inspection, exact cell map and JSON export share one accepted result contract',()=>{
 const e=exportPourbaix(r,0);assert.equal(e.schemaVersion,'bounded-oxidation-pourbaix-v1');assert.equal(e.points,r.points);assert.equal(e.conservedComponent,registry.conservedComponent)
 const representatives=pourbaixRepresentatives(r,view);assert.deepEqual(Object.keys(representatives),['0','1','2'])
 for(const [state,c] of Object.entries(representatives)){assert.equal(c.predominant,Number(state));assert.equal(c.inputId,r.grid.outcomes[c.index].input.id);assert.ok(c.dominantThermodynamicCarriers.length)}
 const svg=pourbaixSvg(r,null,0,view);assert.equal((svg.match(/data-sample=/g)??[]).length,2565);assert.equal((svg.match(/data-state="1"/g)??[]).length,156);assert.match(svg,/H₂ \/ O₂ references/);assert.equal(pourbaixSvg({...r},0,0,view),'')
})
test('Cu matches independently aggregated unchanged HALTAFALL at every identical coordinate',()=>{
 const summary=reference.summary;assert.deepEqual(summary.flags,{0:2565});assert.equal(summary.classificationDisagreements.length,0);assert.equal(summary.solidAssemblageDisagreements.length,0)
 // Frozen independent results are comparison evidence only, never a solver/metadata fallback.
 const allocations=[[2,1],null,null,null,[1,1],[2,1],[1,1],[2,1],[2,1],[2,2],[2,3],[1,1],[2,1],[2,1],[1,2],[2,1],[0,1]]
 for(const [i,o] of reference.reference.entries()){
  assert.equal(o.flags,0);const c=r.points[i],a=r.grid.outcomes[i];const fractions={0:0,1:0,2:0};let sum=0
  o.C.forEach((amount,j)=>{if(!allocations[j])return;const [state,count]=allocations[j];sum+=count*amount;fractions[state]+=count*amount/contract.total;assert.ok(Math.abs(amount-a.result.concentrations[j])<=componentBalanceTolerance(contract.total,contract.total))})
  assert.ok(Math.abs(sum-contract.total)<=componentBalanceTolerance(contract.total,contract.total));for(const f of c.fractions)assert.ok(Math.abs(f.fraction-fractions[f.oxidationState])<c.tieTolerance/4)
  assert.equal(c.predominant,reference.comparisons[i].predominant);assert.deepEqual(c.acceptedSolids.map(s=>s.id),reference.comparisons[i].solidIds)
 }
})
test('Cu water context retains every state and distinguishes included from stable phases',()=>{
 const states=r.points.filter(c=>c.predominant===1);assert.equal(states.length,156);assert.ok(states.every(c=>c.waterWindow==='inside-water-reference-window'))
 assert.ok(r.points.some(c=>c.predominant===0&&c.waterWindow==='inside-water-reference-window'));assert.ok(r.points.some(c=>c.predominant===0&&c.waterWindow==='below-H2-reference'));assert.ok(r.points.some(c=>c.predominant===2&&c.waterWindow==='above-O2-reference'))
 assert.ok(r.points.every(c=>c.phaseScope.included.includes('spana:2ac52a30213c9288:102394')));assert.ok(r.points.every(c=>!c.acceptedSolids.some(s=>s.id==='spana:2ac52a30213c9288:102394')))
})
test('Research stays outside the public import graph and the Fe full-grid evidence remains exact',()=>{
 const fe=JSON.parse(fs.readFileSync('docs/cu-validation-summary.json')).Fe;assert.deepEqual(fe.counts,{0:422,2:581,3:1473,6:89});assert.equal(fe.maximumFractionDifference,0);assert.deepEqual(fe.contract,fePourbaixCandidate)
 const visited=new Set();function visit(p){if(visited.has(p))return;visited.add(p);const text=fs.readFileSync(p,'utf8');assert.doesNotMatch(text,/\.local\/spana-audit/);for(const m of text.matchAll(/from\s*['"](\.[^'"]+)['"]/g)){const target=path.resolve(path.dirname(p),m[1]);if(/\.(jsx?|css)$/.test(target))visit(target)}}
 visit('src/main.jsx')
})
