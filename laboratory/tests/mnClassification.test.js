import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {loadMnSnapshot,classifySnapshot,classifyMn,leaders,mnDiagnosticExport,mnClassificationPolicy} from '../src/analysis/mnDiagnostic.js'
import {waterReferences} from '../src/analysis/waterReferences.js'
import {diagnosticSvg,category} from '../src/plots/mnDiagnostic.js'
import {analytical} from '../scripts/validation/mnAudit.js'
const evidenceText=fs.readFileSync(new URL('../docs/mn-retry-validation.json',import.meta.url),'utf8'),inventoryText=fs.readFileSync(new URL('../docs/mn-diagnostic-inventory.json',import.meta.url),'utf8')
const snapshot=await loadMnSnapshot(evidenceText,inventoryText),points=classifySnapshot(snapshot)
const {system,grid}=snapshot.evidence
const close=(a,b)=>assert.ok(Math.abs(a-b)<=4e-14+2e-10*Math.abs(b))
test('Mn classification: pinned provenance and exact candidate set; corrupted evidence is rejected',async()=>{
 await assert.rejects(loadMnSnapshot(evidenceText+' ',inventoryText),/differs/)
 assert.equal(snapshot.inventory.species.length,20);assert.equal(snapshot.inventory.excluded.length,64)
 assert.deepEqual(snapshot.inventory.species.slice(1).map(s=>s.id).sort(),system.products.map(s=>s.id).sort())
})
test('Mn classification: deterministic, nonmutating, invariant to candidate and metadata order',()=>{
 const before=JSON.stringify(snapshot);assert.deepEqual(classifySnapshot(snapshot),points);assert.equal(JSON.stringify(snapshot),before)
 const inv={...snapshot.inventory,species:[...snapshot.inventory.species].reverse()}
 // Reordering result solids and metadata must not affect phase or aqueous classification.
 for(const o of grid.outcomes){const changed={...o,result:{...o.result,solids:[...o.result.solids].reverse()}};assert.deepEqual(classifyMn(system,changed,inv),classifyMn(system,o,snapshot.inventory))}
 const order=system.products.map((_,j)=>j).reverse(),n=system.components.length
 const reordered={...system,products:order.map(j=>system.products[j]),aqueousRows:system.aqueousRows.map(j=>order.indexOf(j)).reverse()}
 for(const o of grid.outcomes){const changed={...o,result:{...o.result,concentrations:[...o.result.concentrations.slice(0,n),...order.map(j=>o.result.concentrations[n+j])]}};assert.deepEqual(classifyMn(reordered,changed,inv),classifyMn(system,o,snapshot.inventory))}
})
test('Mn classification: oxidation derivations and dimers use atom/charge stoichiometry',()=>{
 for(const m of snapshot.inventory.species.slice(1))assert.equal(m.oxidationState,2-m.coefficients[2]/m.coefficient)
 assert.equal(snapshot.inventory.species.find(s=>s.name==='Mn3O4(s)').oxidationState,8/3)
 assert.equal(snapshot.inventory.species.find(s=>s.name==='MnO4-3').oxidationState,5)
 for(const p of points){const c=p.classification;close(c.oxidationStates.reduce((v,a)=>v+a.weightedMolality,0),c.dissolved);assert.ok(c.aqueous.filter(a=>a.name.startsWith('Mn2')).every(a=>a.coefficient===2))}
})
test('Mn classification: independent source oracle checks every region and both sides of sampled changes',()=>{
 for(const p of points){const expected=analytical(p.pH,p.pe),c=p.classification
 assert.deepEqual(c.activeSolids.map(s=>s.id),expected.solid?[expected.solid.id]:[])
 for(const a of expected.aqueous)close(c.aqueous.find(s=>s.id===a.id).weightedMolality,a.weightedMolality)
 const independentMaximum=expected.aqueous.reduce((a,b)=>a.weightedMolality>b.weightedMolality?a:b)
 if(c.speciesLeaders.length===1)assert.equal(c.speciesLeaders[0],independentMaximum.id)
 }
 assert.ok(new Set(points.map(p=>category(p.classification,'assemblage'))).size>=6)
 assert.ok(points.some(p=>p.classification.speciesLeaders.length>1))
})
test('Mn classification: explicit comparison intervals identify unresolved ties without arbitrary cleanup',()=>{
 const e=mnClassificationPolicy.absoluteMolality
 assert.deepEqual(leaders([{id:'a',weightedMolality:1,comparisonBound:e},{id:'b',weightedMolality:1,comparisonBound:e}]),['a','b'])
 assert.deepEqual(leaders([{id:'a',weightedMolality:1,comparisonBound:1e-5},{id:'b',weightedMolality:.5,comparisonBound:1e-5}]),['a'])
 const tie=points.find(p=>p.classification.speciesLeaders.length>1);assert.match(tie.classification.reason,/intervals overlap/)
})
test('Mn classification: active, multiple, negligible and unavailable categories stay separate',()=>{
 // Synthetic presentation fixtures only; these are NOT new accepted chemical equilibria.
 const o=structuredClone(grid.outcomes[0]),met=snapshot.inventory
 const solids=o.result.solids.slice(0,2);for(const s of o.result.solids){s.amount=0;s.status='absent'}
 for(const s of solids){s.amount=1e-4;s.status='present'}o.result.assemblageSelection.activeSolidIds=solids.map(s=>s.id)
 const multi=classifyMn(system,o,met);assert.equal(multi.phaseCategory,'multiple-active-solids');assert.equal(multi.activeSolids.length,2)
 o.result.solids.forEach(s=>{s.amount=0;s.status='saturated-zero-amount';s.logSaturation=0});o.result.assemblageSelection.activeSolidIds=[]
 assert.equal(classifyMn(system,o,met).phaseCategory,'aqueous-only')
 o.result.concentrations=o.result.concentrations.map(()=>1e-20)
 assert.equal(classifyMn(system,o,met).dissolvedCategory,'negligible-dissolved')
 assert.equal(classifyMn(system,o,met,false).status,'stale')
 assert.equal(classifyMn(system,{status:'failed',diagnostics:[{code:'ambiguous-solid-assemblage'}]},met).status,'ambiguous')
 assert.equal(classifyMn(system,{status:'unsupported'},met).status,'unsupported')
})
test('Mn water references: original source equations, SHE slope, gas exclusion and temperature gate',()=>{
 const slope=8.31446261815324*Math.LN10*298.15/Number('96485.3321233100184')
 for(const pH of [0,7,14])for(const ref of waterReferences(snapshot.inventory,pH)){
 const r=snapshot.inventory.water.find(r=>r.id===ref.sourceId),logs={'H+':-pH,'e-':-ref.pe,H2O:0}
 assert.ok(Math.abs(r.logBeta+r.coefficients.reduce((v,c)=>v+c.coefficient*logs[c.name],0))<1e-12)
 assert.ok(Math.abs(ref.Eh-(ref.name==='H2(g)'?-pH:83.09/4-pH)*slope)<1e-14)
 assert.ok(!system.products.some(p=>p.id===ref.sourceId))
 }
 assert.throws(()=>waterReferences(snapshot.inventory,7,50),/25/)
})
test('Mn diagnostic: pH/Eh controls, exact JSON, SVG conditions and stale exports',()=>{
 for(const p of points){const o=grid.outcomes[p.index];assert.equal(p.pH,o.x);assert.equal(p.Eh,o.y);assert.equal(-p.pe,o.input.constraints.find(c=>c.componentId==='e-').value)}
 const text=mnDiagnosticExport(snapshot,'species',true),copy=JSON.parse(text)
 assert.equal(JSON.stringify(copy.snapshot.evidence),JSON.stringify(snapshot.evidence));assert.equal(copy.classification.length,195)
 const svg=diagnosticSvg(snapshot,points,'species',true);assert.equal((svg.match(/data-sample=/g)??[]).length,195);assert.match(svg,/not refined thermodynamic/);assert.match(svg,/not a calculated gas equilibrium/)
 assert.ok(JSON.parse(mnDiagnosticExport(snapshot,'species',false,false)).classification.every(p=>p.classification.status==='stale'))
})
