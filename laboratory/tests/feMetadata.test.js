import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {summarizeOxidationInventory,oxidationTieTolerance} from '../src/analysis/oxidationInventory.js'
import {createRepository} from '../src/thermodynamics/repository.js'
import {prepareChemicalSystem,identity} from '../src/solver/models.js'
import {solveFixedRedox} from '../src/solver/redox.js'
import {prepareFeCandidate} from '../src/analysis/prepareFeCandidate.js'
import {feOxidationMetadata as registry} from '../src/analysis/feOxidationMetadata.js'
import {prepareRegisteredFeOxidation,classifyRegisteredFePoint} from '../src/analysis/registeredOxidation.js'
import {fePourbaixCandidate,fePhaseScope,inspectRegisteredFePoint,assessFePourbaixCandidate} from '../src/analysis/fePourbaixContract.js'
import {prepareFeWaterContext,feWaterContext} from '../src/analysis/feWaterContext.js'
const repository=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const f=await prepareFeCandidate(repository),{system,model,waterModel}=f
const options={currentRevision:0,waterModel}
const point=(pH=10,Eh=-0.6,total=0.001)=>solveFixedRedox(system,{pH,Eh,totals:{[registry.conservedComponent]:total}})
const changed=async mutate=>{const s=structuredClone(system);mutate(s);const p=await prepareChemicalSystem(s);assert.ok(p.ok,JSON.stringify(p));return p.system}

test('production registry covers every Fe carrier with explicit sourced integer allocations and pinned identity',async()=>{
 assert.equal(model.status,'registered');assert.equal(system.id,fePourbaixCandidate.systemId)
 assert.equal(registry.rows.length,19);assert.equal(new Set(registry.rows.map(r=>r.id)).size,19)
 assert.equal(await identity(registry),fePourbaixCandidate.metadataSha256)
 for(const r of registry.rows){assert.equal(r.allocation.reduce((n,d)=>n+d.count,0),r.componentCount);assert.ok(r.provenance.sourceCitation);assert.ok(r.provenance.references.length);assert.equal(r.bindingSha256.length,64)}
 assert.deepEqual(registry.rows.find(r=>r.id.endsWith(':134486')).allocation,[{oxidationState:2,count:1},{oxidationState:3,count:2}])
 assert.deepEqual(registry.rows.find(r=>r.id.endsWith(':138672')).allocation,[{oxidationState:6,count:1}])
 assert.equal(registry.materiality.unresolvedInventoryFloor,0)
})

test('display labels do not assign oxidation states, whereas changed reaction/source identities invalidate them',async()=>{
 const renamed=await changed(s=>{s.products[0].name='arbitrary display label'})
 assert.equal((await prepareRegisteredFeOxidation(renamed)).status,'registered')
 for(const mutation of [s=>{s.products[0].sourceRecord.original.id='different-source'},s=>{s.products[0].logBeta+=0.01},s=>{s.products[0].coefficients[2]-=1}]){
  const m=await prepareRegisteredFeOxidation(await changed(mutation));assert.equal(m.reason,'inconsistent-source-identity')
 }
 const invalid=await changed(s=>{s.sourceIdentity.inventory.weights[0].coefficient=2})
 assert.equal((await prepareRegisteredFeOxidation(invalid)).reason,'inconsistent-source-basis')
})

test('an unknown candidate is unsupported even when its equilibrium contribution would be numerically zero',async()=>{
 const s=await changed(s=>{s.products.push({...structuredClone(s.products[1]),id:'unresolved-trace',name:'unresolved trace',logBeta:-300})})
 const m=await prepareRegisteredFeOxidation(s)
 assert.equal(m.reason,'missing-carrier-metadata');assert.equal(m.carrierId,'unresolved-trace');assert.equal(m.unresolvedInventory,null)
 assert.equal(classifyRegisteredFePoint(m,s,null,null,options).status,'unavailable')
})

test('duplicate source identity cannot form an accepted prepared chemistry',async()=>{
 const s=structuredClone(system);s.products.push(structuredClone(s.products[0]))
 assert.equal((await prepareChemicalSystem(s)).ok,false)
})

test('magnetite contributes one Fe(II) and two Fe(III), preserving dissolved plus solid closure',async()=>{
 const p=await point();assert.ok(p.ok)
 const c=inspectRegisteredFePoint(model,system,p.input,p.result,options)
 assert.equal(c.status,'classified');assert.equal(c.predominant,3)
 assert.ok(Math.abs(c.fractions.find(r=>r.oxidationState===2).fraction-0.3334402808885098)<1e-10)
 assert.ok(Math.abs(c.fractions.find(r=>r.oxidationState===3).fraction-0.6665597191114901)<1e-10)
 const rows=c.carriers.filter(r=>r.id.endsWith(':134486'))
 assert.equal(rows.length,2);assert.equal(rows[1].componentAmount,2*rows[0].componentAmount)
 assert.ok(Math.abs(c.fractions.reduce((n,r)=>n+r.amount,0)-c.total)<=c.tolerance)
 assert.equal(c.unresolvedInventory,0);assert.equal(c.metadataVersion,registry.version)
})

test('ferrate outside the water window remains classified and exact analytical fractions are not renormalized',async()=>{
 const p=await point(14,1.2),c=inspectRegisteredFePoint(model,system,p.input,p.result,options)
 assert.equal(c.predominant,6);assert.equal(c.waterWindow,'above-O2-reference');assert.equal(c.majority,true)
 for(const row of c.fractions)assert.equal(row.fraction,row.amount/c.total)
 assert.equal(c.waterReferences.length,2)
 const small=await point(10,-0.6,1e-6)
 assert.equal(inspectRegisteredFePoint(model,system,small.input,small.result,options).reason,'inventory-resolution-insufficient')
})

test('unbranded, stale, failed and copied results cannot receive metadata-backed classification',async()=>{
 const p=await point()
 assert.equal(classifyRegisteredFePoint({...model},system,p.input,p.result,options).reason,'unregistered-allocation-model')
 assert.equal(classifyRegisteredFePoint(model,system,p.input,{...p.result},options).reason,'equilibrium-not-accepted')
 assert.equal(classifyRegisteredFePoint(model,system,p.input,p.result,{currentRevision:1}).reason,'stale')
 assert.equal(classifyRegisteredFePoint(model,system,p.input,p.result,{currentRevision:0,status:'failed'}).reason,'failed')
})

test('phase suppression discloses a modified model and invalidates default support evidence',async()=>{
 const s=await changed(s=>{s.products=s.products.filter(p=>!p.id.endsWith(':134486'))}),m=await prepareRegisteredFeOxidation(s)
 assert.equal(m.status,'registered');assert.equal(fePhaseScope(s).modified,true)
 assert.equal(assessFePourbaixCandidate(m,s,null,options).reason,'modified-phase-scope')
 assert.equal(fePhaseScope(system).included.length,7)
 assert.equal(fePhaseScope(system).excluded[0].name,'Fe0.932O(cr)')
 assert.equal(assessFePourbaixCandidate(model,system,{},options).reason,'unaccepted-or-stale-grid')
 assert.equal(fePourbaixCandidate.publicEnabled,false)
})

test('water context requires static source identity and cannot accept edited constants or forged overlays',async()=>{
 const bad={getSpeciesById:id=>{const r=repository.getSpeciesById(id);r.logK+=0.001;return r}}
 assert.equal((await prepareFeWaterContext(bad)).reason,'water-reference-source-mismatch')
 assert.equal(feWaterContext({...waterModel},7,0).reason,'unvalidated-water-references')
 assert.equal(feWaterContext(waterModel,7,0).waterWindow,'inside-water-reference-window')
})

test('new validation evidence is pinned, complete, fraction-identical and restricted to the independently matched total',()=>{
 const e=JSON.parse(fs.readFileSync('docs/fe-metadata-validation.json'))
 assert.equal(e.metadataSha256,fePourbaixCandidate.metadataSha256)
 assert.deepEqual(e.totals[0].counts,{'0':422,'2':581,'3':1473,'6':89})
 assert.equal(e.totals[0].maximumFractionDifference,0)
 assert.equal(e.totals[0].assessment.eligible,true)
 for(const t of e.totals.slice(1))assert.equal(t.assessment.eligible,false)
 assert.equal(e.boundarySummary.rows.length,6)
 for(const row of e.boundarySummary.rows){assert.ok(row.resolvedBrackets>0);assert.equal(row.exceptions,0);assert.ok(row.maximumObservedDisplacement<=(row.direction==='pH'?0.125:0.025)+1e-12)}
})

test('registered support preserves symmetric ties and distinguishes predominance from a majority',()=>{
 assert.equal(oxidationTieTolerance,fePourbaixCandidate.tieTolerance)
 const carriers=[{id:'a',amount:0.0005,distribution:[{oxidationState:2,count:1}]},{id:'b',amount:0.0005,distribution:[{oxidationState:3,count:1}]}]
 for(const rows of [carriers,[...carriers].reverse()]){const c=summarizeOxidationInventory(rows,0.001);assert.equal(c.status,'tie');assert.equal(c.predominant,null);assert.equal(c.majority,false);assert.equal(c.fractions[0].fraction,0.5)}
 const c=summarizeOxidationInventory([2,3,6].map((oxidationState,i)=>({id:String(i),amount:[0.0004,0.00035,0.00025][i],distribution:[{oxidationState,count:1}]})),0.001)
 assert.equal(c.predominant,2);assert.equal(c.majority,false)
})

test('new production metadata entry points have no research, fixture or runtime network dependencies',()=>{
 const seen=new Set(),root=path.resolve('src')
 function visit(file){
  if(seen.has(file))return;seen.add(file)
  assert.ok(file.startsWith(root+path.sep));assert.doesNotMatch(file,/fixtures|\.local|\.test\./)
  const text=fs.readFileSync(file,'utf8')
  assert.doesNotMatch(text,/\bfetch\s*\(|\bimport\s*\(/)
  for(const m of text.matchAll(/\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/g)){
   assert.ok(m[1].startsWith('.'));visit(path.resolve(path.dirname(file),m[1]))
  }
 }
 for(const name of ['prepareFeCandidate','fePourbaixContract'])visit(path.join(root,'analysis',name+'.js'))
 assert.ok(seen.has(path.join(root,'analysis','feOxidationMetadata.js')))
})
