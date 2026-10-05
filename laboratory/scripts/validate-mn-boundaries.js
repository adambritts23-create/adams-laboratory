import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {regionSvg} from '../src/plots/mnRegions.js'
import {loadMnSnapshot} from '../src/analysis/mnDiagnostic.js'
import {prepare,analytical,included,sourceAmount,compile} from './validation/mnAudit.js'
import {ehToPe} from '../src/solver/redox.js'
import {detectBrackets,refineTransitions,evaluate,solidEquality,boundaryCriteria,primary,aqueousEquality} from './validation/mnBoundaries.js'
import {regions} from './validation/mnRegionCertificates.js'
import {classifySnapshot} from '../src/analysis/mnDiagnostic.js'
const read=name=>fs.readFileSync(`docs/${name}`,'utf8')
const snapshot=await loadMnSnapshot(read('mn-retry-validation.json'),read('mn-diagnostic-inventory.json'))
const system=await prepare();assert.equal(system.id,snapshot.evidence.system.id)
const brackets=detectBrackets(snapshot),results=[]
for(const b of brackets){
 const r=await refineTransitions(b,(pH,Eh)=>evaluate(system,snapshot.inventory,pH,Eh))
 const equality=solidEquality(system,b)
 if(equality){
 r.analytical=equality
 r.analytical.insideFinalBracket=equality.coordinate>=r.uncertainty[b.axis][0]&&equality.coordinate<=r.uncertainty[b.axis][1]
 }
 r.independentChecks=[r.left,r.right,...r.samples].filter(p=>p.result?.ok).map(p=>{
 const expected=analytical(p.pH,ehToPe(p.Eh)),logFreeError=Math.abs(Math.log10(expected.free)-p.result.logActivities[0])
 assert.ok(logFreeError<1e-8)
 return {pH:p.pH,Eh:p.Eh,logFreeError,expectedSolid:expected.solid,expectedDissolved:expected.dissolved}
 })
 results.push(r)
}
const counts=results.reduce((a,r)=>{a[r.status]=(a[r.status]??0)+1;return a},{})
const flatten=r=>[r,...(r.children??[]).flatMap(flatten)]
const all=results.flatMap(flatten),leaves=all.filter(r=>!r.children)
for(const r of all){
 const states=[primary(r.left.classification),primary(r.right.classification)]
 const b={left:r.left,right:r.right,type:states.map(s=>s.kind).sort().join('/'),axis:r.axis}
 
 if(!r.children){
 r.equalityResiduals=[r.left,r.right].map(p=>{
 const pe=ehToPe(p.Eh),v=analytical(p.pH,pe)
 if(states.every(s=>s.kind==='solid'))return v.caps.find(c=>c.id===states[0].ids[0]).logFreeCap-v.caps.find(c=>c.id===states[1].ids[0]).logFreeCap
 if(states.every(s=>s.kind==='aqueous'))return Math.log10(v.aqueous.find(c=>c.id===states[0].ids[0]).weightedMolality/v.aqueous.find(c=>c.id===states[1].ids[0]).weightedMolality)
 const cap=v.caps.find(c=>c.id===states.find(s=>s.kind==='solid').ids[0]).logFreeCap,free=10**cap
 return Math.log10((free+included.filter(s=>s.phase==='aqueous').reduce((n,s)=>n+compile(s).coefficients[0]*sourceAmount(s,free,p.pH,pe),0))/.001)
 })
 assert.ok(r.equalityResiduals[0]*r.equalityResiduals[1]<=0)
 }
 r.aqueousAnalytical=aqueousEquality(system,r.left,r.right,r.axis)
 if(r.aqueousAnalytical?.coordinate!=null&&r.status==='coordinate-bracketed')assert.ok(r.aqueousAnalytical.coordinate>=r.uncertainty[r.axis][0]&&r.aqueousAnalytical.coordinate<=r.uncertainty[r.axis][1])
 r.analytical=solidEquality(system,b)
 if(r.analytical&&r.status==='coordinate-bracketed'){
 assert.ok(r.analytical.coordinate>=r.uncertainty[r.axis][0]&&r.analytical.coordinate<=r.uncertainty[r.axis][1])
 }
 for(const p of r.samples.filter(p=>p.result?.ok))assert.ok(Math.abs(Math.log10(analytical(p.pH,ehToPe(p.Eh)).free)-p.result.logActivities[0])<1e-8)
}
const geometry=regions(system),points=classifySnapshot(snapshot)
const consistency=points.map(p=>{
 const tiles=geometry.tiles.filter(t=>p.pH>=t.box[0]&&p.pH<=t.box[1]&&p.Eh>=t.box[2]&&p.Eh<=t.box[3])
 assert.ok(tiles.every(t=>t.key===primary(p.classification).key))
 return {index:p.index,status:tiles.length?'compatible-certified-interior':'unresolved-enclosure; original point retained'}
})
const view={identity:snapshot.identity,...geometry,consistency,boundaries:leaves.map(r=>({id:r.bracketId,status:r.status,uncertainty:r.uncertainty,left:{pH:r.left.pH,Eh:r.left.Eh,state:primary(r.left.classification)},right:{pH:r.right.pH,Eh:r.right.Eh,state:primary(r.right.classification)},analytical:r.analytical,aqueousAnalytical:r.aqueousAnalytical})),
 warning:'Partially refined: colored interiors are conservatively enclosed; gray strips are unresolved. Crossing brackets are not connected into invented boundaries or junctions.'}
fs.writeFileSync('docs/mn-region-enclosures.json',JSON.stringify(view))
const output={kind:'Mn-boundary-feasibility-audit',identity:snapshot.identity,criteria:boundaryCriteria,counts,
 geometryStatus:view.warning,geometry:view,originalSnapshot:snapshot,brackets,results}
fs.writeFileSync('docs/mn-boundary-validation.json',JSON.stringify(output)+'\n')
fs.writeFileSync('src/data/mnRegionIdentity.js',`export const mnRegionSha256 = '${createHash('sha256').update(fs.readFileSync('docs/mn-region-enclosures.json')).digest('hex')}'\n`)
fs.writeFileSync('docs/mn-refined-regions.svg',regionSvg(snapshot,view,points,true,true,104))
console.log(JSON.stringify({counts,types:brackets.reduce((a,b)=>{a[b.type]=(a[b.type]??0)+1;return a},{}),solverCalls:results.reduce((a,r)=>a+r.samples.length,0),unresolved:results.filter(r=>r.status!=='coordinate-bracketed').map(r=>({id:r.bracketId,status:r.status,reason:r.reason,last:r.samples.at(-1)?.diagnostics})),analytical:results.filter(r=>r.analytical).map(r=>({id:r.bracketId,status:r.status,inside:r.analytical.insideFinalBracket}))},null,2))
