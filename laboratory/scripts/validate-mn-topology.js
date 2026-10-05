import fs from 'node:fs'
import {gzipSync} from 'node:zlib'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {prepare,analytical} from './validation/mnAudit.js'
import {ehToPe} from '../src/solver/redox.js'
import {primary} from './validation/mnBoundaries.js'
import {segmentCandidates,traceSegment,junctionCandidates,inspectJunction,topologyPolicy} from './validation/mnTopology.js'
const original=fs.readFileSync('docs/mn-boundary-validation.json'),audit=JSON.parse(original),system=await prepare()
assert.equal(system.id,audit.originalSnapshot.evidence.system.id)
const inventory=audit.originalSnapshot.inventory,candidates=segmentCandidates(audit.geometry.boundaries),segments=[]
for(const c of candidates)segments.push(await traceSegment(system,inventory,c))
const junctions=[]
for(const c of junctionCandidates(audit.geometry.boundaries,audit.originalSnapshot.evidence.grid.outcomes))junctions.push(await inspectJunction(system,inventory,c))
const validationPoints=[...segments.flatMap(s=>[...s.attempts,...s.samples.flatMap(r=>[r.left,r.right,...r.samples])]),...junctions.flatMap(j=>j.samples)]
let maximumIndependentLogFreeError=0
for(const p of validationPoints.filter(p=>p.result?.ok)){
 const expected=analytical(p.pH,ehToPe(p.Eh)),error=Math.abs(Math.log10(expected.free)-p.result.logActivities[0]);assert.ok(error<1e-8)
 maximumIndependentLogFreeError=Math.max(maximumIndependentLogFreeError,error)
}
const count=rows=>rows.reduce((a,r)=>{a[r.status]=(a[r.status]??0)+1;return a},{})
const artifact={kind:'Mn-topology-audit',sourceBoundarySha256:createHash('sha256').update(original).digest('hex'),identity:audit.identity,
 originalSnapshot:audit.originalSnapshot,policy:topologyPolicy,segments,junctions,
 stats:{segments:count(segments),junctions:count(junctions),validationPoints:validationPoints.length,maximumIndependentLogFreeError},
 regionChange:'None: local certified branches do not establish closed global region topology. Existing certified interiors and gray uncertainty retained.',consistency:audit.geometry.consistency}
fs.writeFileSync('docs/mn-topology-validation.json.gz',gzipSync(JSON.stringify(artifact)+'\n'))
const summary=p=>({pH:p.pH,Eh:p.Eh,inputId:p.input?.id,state:primary(p.classification),diagnostics:p.diagnostics,residuals:{componentBalance:p.result?.residuals?.componentBalance,maximumMassActionLog:Math.max(0,...(p.result?.residuals?.massActionLog??[]).map(Math.abs))},activeSolids:p.classification.activeSolids})
const view={sourceBoundarySha256:artifact.sourceBoundarySha256,identity:artifact.identity,policy:artifact.policy,stats:artifact.stats,regionChange:artifact.regionChange,
 segments:segments.map(s=>({...s,attempts:undefined,samples:s.samples.map(r=>({t:r.t,status:r.status,uncertainty:r.uncertainty,left:summary(r.left),right:summary(r.right)}))})),
 junctions:junctions.map(j=>({...j,samples:j.samples.map(summary)}))}
fs.writeFileSync('docs/mn-topology-view.json',JSON.stringify(view))
fs.writeFileSync('src/data/mnTopologyIdentity.js',`export const mnTopologySha256 = '${createHash('sha256').update(fs.readFileSync('docs/mn-topology-view.json')).digest('hex')}'\n`)
fs.appendFileSync('src/data/mnTopologyIdentity.js',`export const mnTopologyAuditSha256 = '${createHash('sha256').update(JSON.stringify(artifact)+'\n').digest('hex')}'\n`)
console.log(JSON.stringify(artifact.stats,null,2))
