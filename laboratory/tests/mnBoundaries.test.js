import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {detectBrackets,refineTransitions,evaluate,primary,solidEquality} from '../scripts/validation/mnBoundaries.js'
import {prepare,analytical} from '../scripts/validation/mnAudit.js'
import {ehToPe,peToEh} from '../src/solver/redox.js'
import {classifySnapshot} from '../src/analysis/mnDiagnostic.js'
import {regionSvg} from '../src/plots/mnRegions.js'
const audit=JSON.parse(fs.readFileSync('docs/mn-boundary-validation.json','utf8')),snapshot=audit.originalSnapshot,system=await prepare()
const flat=r=>[r,...(r.children??[]).flatMap(flat)],all=audit.results.flatMap(flat),leaves=all.filter(r=>!r.children)
test('Mn boundaries: 80 exact-neighbor brackets, canonical candidate independence, original evidence intact',()=>{
 assert.equal(detectBrackets(snapshot).length,80)
 const changed=structuredClone(snapshot);changed.inventory.species.reverse();for(const o of changed.evidence.grid.outcomes)o.result.solids.reverse()
 assert.deepEqual(detectBrackets(changed).map(b=>b.id),detectBrackets(snapshot).map(b=>b.id))
 assert.deepEqual(snapshot.evidence,JSON.parse(fs.readFileSync('docs/mn-retry-validation.json','utf8')))
})
test('Mn boundaries: deterministic unchanged solver refinement reaches physical coordinate bounds',async()=>{
 const b=detectBrackets(snapshot)[0],run=(h,e)=>evaluate(system,snapshot.inventory,h,e)
 const a=await refineTransitions(b,run),c=await refineTransitions(b,run)
 assert.deepEqual(a,c)
 assert.equal(leaves.length,84)
 for(const r of leaves){assert.equal(r.status,'coordinate-bracketed');assert.ok(Math.abs(r.left[r.axis]-r.right[r.axis])<=r.criteria[r.axis]);assert.notEqual(primary(r.left.classification).key,primary(r.right.classification).key)}
})
test('Mn boundaries: Nernst equal-cap coordinates and proton slope agree independently',()=>{
 for(const r of leaves.filter(r=>r.aqueousAnalytical?.coordinate!=null)){
 const q=r.aqueousAnalytical,h=r.axis==='pH'?q.coordinate:r.left.pH,e=r.axis==='Eh'?q.coordinate:r.left.Eh
 const rows=analytical(h,ehToPe(e)).aqueous.filter(a=>q.speciesIds.includes(a.id))
 assert.ok(Math.abs(Math.log10(rows[0].weightedMolality/rows[1].weightedMolality))<1e-10)
 }
 for(const r of leaves.filter(r=>r.analytical)){
 const q=r.analytical;assert.ok(q.coordinate>=r.uncertainty[r.axis][0]&&q.coordinate<=r.uncertainty[r.axis][1])
 const h=r.axis==='pH'?q.coordinate:r.left.pH,e=r.axis==='Eh'?q.coordinate:r.left.Eh
 const caps=analytical(h,ehToPe(e)).caps.filter(c=>q.phaseIds.includes(c.id));assert.ok(Math.abs(caps[0].logFreeCap-caps[1].logFreeCap)<1e-10)
 }
 const b=detectBrackets(snapshot).find(b=>b.type==='solid/solid'&&b.left.classification.activeSolids[0].name==='Mn(cr)'&&b.right.classification.activeSolids[0].name==='Mn(OH)2(am)')
 const q=solidEquality(system,b);assert.ok(Math.abs(q.EhSlopePerPH+peToEh(1))<1e-14)
})
test('Mn boundaries: accepted solid/aqueous and solid/solid states preserve balances and saturation',()=>{
 for(const r of leaves)assert.ok(r.equalityResiduals[0]*r.equalityResiduals[1]<=0)
 for(const r of leaves)for(const p of [r.left,r.right]){
 const a=analytical(p.pH,ehToPe(p.Eh));assert.ok(Math.abs(Math.log10(a.free)-p.result.logActivities[0])<1e-8)
 assert.ok(Math.abs(p.result.residuals.componentBalance[0])<1e-12)
 for(const s of p.result.solids.filter(s=>s.amount>0))assert.ok(Math.abs(s.logSaturation)<1e-10)
 }
})
test('Mn boundaries: intervening phases remain explicit; no junction or degenerate state invented',async()=>{
 assert.equal(audit.results.filter(r=>r.children).length,4)
 for(const r of audit.results.filter(r=>r.children)){assert.equal(r.children.length,2);assert.equal(r.status,'intervening-state')}
 const b=detectBrackets(snapshot)[0],r=await refineTransitions(b,async()=>({pH:0,Eh:0,classification:{status:'ambiguous'}}))
 assert.equal(r.status,'unresolved');assert.equal(r.samples[0].classification.status,'ambiguous')
 assert.ok(audit.geometry.unresolved.length>0)
})
test('Mn regions: every enclosure corner independently matches the source mass-action oracle',()=>{
 for(const t of audit.geometry.tiles){const [a,b,c,d]=t.box;for(const [h,e] of [[a,c],[a,d],[b,c],[b,d]]){
 const expected=analytical(h,ehToPe(e)),key=expected.solid?'solid:'+expected.solid.id:'aqueous:'+expected.aqueous.reduce((a,b)=>a.weightedMolality>b.weightedMolality?a:b).id
 assert.equal(t.key,key)
 }}
})
test('Mn regions: all 195 samples compatible or explicitly unresolved, never contradictory',()=>{
 const points=classifySnapshot(snapshot);assert.equal(points.length,195)
 for(const p of points){const tiles=audit.geometry.tiles.filter(t=>p.pH>=t.box[0]&&p.pH<=t.box[1]&&p.Eh>=t.box[2]&&p.Eh<=t.box[3]);assert.ok(tiles.every(t=>t.key===primary(p.classification).key))}
 assert.equal(audit.geometry.consistency.filter(p=>p.status.startsWith('compatible')).length,187)
})
test('Mn regions: JSON retains exact states, uncertainty and inspection provenance; SVG separates water',()=>{
 const points=classifySnapshot(snapshot),svg=regionSvg(snapshot,audit.geometry,points,true,true,104)
 assert.equal((svg.match(/data-sample=/g)||[]).length,195)
 assert.match(svg,/nearest ORIGINAL stored sample/);assert.match(svg,/NOT thermodynamic boundaries/);assert.match(svg,/Analytical water reference/)
 assert.ok(all.every(r=>r.samples.every(p=>p.input&&p.result&&p.classification)))
 assert.ok(audit.geometry.boundaries.every(b=>b.uncertainty&&b.left&&b.right))
})
