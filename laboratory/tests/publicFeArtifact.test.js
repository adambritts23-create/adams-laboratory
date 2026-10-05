import test from 'node:test'
import assert from 'node:assert/strict'
import {auditProductionArtifacts} from '../scripts/production-artifacts.js'
import {feOxidationMetadata as metadata} from '../src/analysis/feOxidationMetadata.js'
import {fePourbaixCandidate} from '../src/analysis/fePourbaixContract.js'
const approved=[{value:metadata,sha256:fePourbaixCandidate.metadataSha256}],hashes=[metadata.rows[0].sourceDatabaseSha256]
const code='const registry='+JSON.stringify(metadata)+';'
test('artifact audit permits only the exact approved registry and rejects drift, duplicate or additional source payloads',()=>{
 const file=content=>[{name:'assets/app.js',content}]
 assert.ok(auditProductionArtifacts(file(code),hashes,[],approved).unintendedLocalFilesAbsent)
 for(const text of [code.replace('"count":2','"count":3'),code+'const raw="'+hashes[0]+'";',code+'const duplicate='+JSON.stringify(metadata)+';',code.replace('"sourceBindingSha256"','"changedSourceBinding"')])assert.throws(()=>auditProductionArtifacts(file(text),hashes,[],approved))
 assert.throws(()=>auditProductionArtifacts(file(code),hashes))
})
