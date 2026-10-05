import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {createGunzip} from 'node:zlib'
import {prepare,analytical} from '../scripts/validation/mnAudit.js'
import {segmentCandidates,traceSegment,solidSegmentProof,junctionCandidates} from '../scripts/validation/mnTopology.js'
import {primary} from '../scripts/validation/mnBoundaries.js'
import {classifySnapshot} from '../src/analysis/mnDiagnostic.js'
import {ehToPe,peToEh,solveFixedRedox} from '../src/solver/redox.js'
import {topologySvg} from '../src/plots/mnTopology.js'
import {mnTopologySha256,mnTopologyAuditSha256} from '../src/data/mnTopologyIdentity.js'
const view=JSON.parse(fs.readFileSync('docs/mn-topology-view.json','utf8')),regions=JSON.parse(fs.readFileSync('docs/mn-region-enclosures.json','utf8'))
const snapshot={evidence:JSON.parse(fs.readFileSync('docs/mn-retry-validation.json','utf8')),inventory:JSON.parse(fs.readFileSync('docs/mn-diagnostic-inventory.json','utf8'))}
const system=await prepare(),candidates=segmentCandidates(regions.boundaries),certified=view.segments.filter(s=>s.status==='certified')
test('Mn topology: 71 same-state/equality candidates, stable under crossing order changes',()=>{
 assert.equal(candidates.length,71)
 assert.deepEqual(segmentCandidates([...regions.boundaries].reverse()),candidates)
 for(const c of candidates)assert.ok(c.crossingIds.every(id=>regions.boundaries.find(b=>b.id===id)))
})
test('Mn topology: 25 certificates require consistent accepted side states and physical brackets',()=>{
 assert.equal(certified.length,25);assert.equal(view.segments.filter(s=>s.status==='partial').length,45)
 for(const c of certified)for(const r of c.samples){
 assert.equal(r.status,'coordinate-bracketed')
 assert.deepEqual([r.left.state.key,r.right.state.key].sort(),c.states.map(s=>s.key).sort())
 assert.ok(r.left.inputId&&r.right.inputId);assert.ok(c.proof.ok)
 }
})
test('Mn topology: deterministic adaptive tracing uses unchanged solver',async()=>{
 const c=candidates.find(c=>c.id===certified[0].id)
 const a=await traceSegment(system,snapshot.inventory,c),b=await traceSegment(system,snapshot.inventory,c)
 assert.deepEqual(a,b);assert.equal(a.status,'certified');assert.ok(a.samples.length>=7)
})
test('Mn topology: continuous solid-cap certificate agrees with independent source reactions',()=>{
 for(const c of certified){const proof=solidSegmentProof(system,c);assert.ok(proof.ok)
 for(let i=0;i<=30;i++){const t=i/30,p={pH:proof.projected[0].pH*(1-t)+proof.projected[1].pH*t,Eh:proof.projected[0].Eh*(1-t)+proof.projected[1].Eh*t}
 const a=analytical(p.pH,ehToPe(p.Eh)),caps=a.caps.filter(s=>c.states.some(k=>k.ids.includes(s.id)))
 assert.ok(Math.abs(caps[0].logFreeCap-caps[1].logFreeCap)<1e-10)
 assert.ok(a.dissolved<.001);assert.ok(caps.every(s=>s.logFreeCap<=a.caps[0].logFreeCap+1e-10))
 }
 assert.ok(c.proof.maximumProjectionError<=c.proof.permittedProjection)
 }
})
test('Mn topology: an A to C shortcut cannot collapse the intervening Mn2O3 phase',()=>{
 const a=system.products.find(p=>p.name==='Mn3O4(s)'),c=system.products.find(p=>p.name==='MnO2(s)')
 const q={constant:a.logBeta/a.coefficients[0]-c.logBeta/c.coefficients[0],nH:a.coefficients[1]/a.coefficients[0]-c.coefficients[1]/c.coefficients[0],ne:a.coefficients[2]/a.coefficients[0]-c.coefficients[2]/c.coefficients[0]}
 const candidate={axis:'pH',states:[a,c].map(p=>({kind:'solid',ids:[p.id]})),equality:q,endpoints:[10,11].map(pH=>({pH,Eh:peToEh((q.constant-q.nH*pH)/q.ne)}))}
 const proof=solidSegmentProof(system,candidate);assert.equal(proof.ok,false);assert.ok(proof.minimumOtherCapMargin<0)
})
test('Mn topology: junction candidates retain eight uncertain cells and disprove four false triple points',()=>{
 assert.equal(junctionCandidates(regions.boundaries,snapshot.evidence.grid.outcomes).length,12)
 assert.equal(view.junctions.filter(j=>j.status==='rejected-not-a-junction').length,4)
 for(const j of view.junctions.filter(j=>j.status==='unresolved')){assert.deepEqual(j.uncertainty,j.box);assert.ok(j.samples.length>=9);assert.ok(j.sampledLocalization)}
 for(const j of view.junctions.filter(j=>j.status==='rejected-not-a-junction'))assert.ok(j.offset>1e-9)
})
test('Mn topology: genuine pure-solid degeneracy remains typed ambiguous, never fabricated amounts',async()=>{
 const point=await solveFixedRedox(system,{pH:9,Eh:peToEh(5.025),totals:{'Mn 2+':.001}})
 assert.equal(point.ok,false);assert.ok(point.diagnostics.some(d=>d.code==='ambiguous-solid-assemblage'))
})
test('Mn topology: all 195 original points retain compatible interiors or explicit uncertainty',()=>{
 const points=classifySnapshot(snapshot);assert.equal(points.length,195)
 for(const p of points){const tiles=regions.tiles.filter(t=>p.pH>=t.box[0]&&p.pH<=t.box[1]&&p.Eh>=t.box[2]&&p.Eh<=t.box[3]);assert.ok(tiles.every(t=>t.key===primary(p.classification).key))}
 assert.equal(regions.unresolved.length,4676)
})
test('Mn topology: pinned compressed numerical export preserves exact audit bytes and provenance',async()=>{
 assert.equal(createHash('sha256').update(fs.readFileSync('docs/mn-topology-view.json')).digest('hex'),mnTopologySha256)
 const hash=createHash('sha256'),stream=fs.createReadStream('docs/mn-topology-validation.json.gz').pipe(createGunzip())
 for await(const chunk of stream)hash.update(chunk)
 assert.equal(hash.digest('hex'),mnTopologyAuditSha256)
 for(const s of certified){assert.ok(s.crossingIds.length===2&&s.equality&&s.samples.length);assert.ok(Number.isFinite(s.maximumBalanceResidual))}
})
test('Mn topology: SVG renders only certified connections, inspectable junctions and separate water references',()=>{
 const svg=topologySvg(snapshot,regions,view,classifySnapshot(snapshot),true,true,true,104)
 assert.equal((svg.match(/data-segment=/g)||[]).length,25)
 assert.equal((svg.match(/data-junction=/g)||[]).length,8)
 assert.equal((svg.match(/data-sample=/g)||[]).length,195)
 assert.match(svg,/Analytical water reference/);assert.match(svg,/No new global region fill/)
 for(const s of view.segments.filter(s=>s.status!=='certified'))assert.ok(!svg.includes(`data-segment="${s.id}"`))
})
