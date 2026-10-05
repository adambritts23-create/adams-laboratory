import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {fePeroxideScope} from '../src/thermodynamics/scopes/fePeroxide.js'
import {auditProductionArtifacts} from '../scripts/production-artifacts.js'
test('Closed UI artifact permits only exact unchanged Step-5 metadata, never source payloads or drift',()=>{
 const manifest=JSON.parse(fs.readFileSync('scripts/closed-reagent-metadata-manifest.json')),approved=[{value:fePeroxideScope,sha256:manifest.sha256}],sourceHash='2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a',code='const scope='+JSON.stringify(fePeroxideScope)+';',files=text=>[{name:'assets/closed.js',content:text}]
 assert.ok(auditProductionArtifacts(files(code),[sourceHash],[],approved))
 for(const text of [code.replace('"max":0.000001','"max":0.001'),code+'const extra="'+sourceHash+'";',code+code.replace('const scope','const second')])assert.throws(()=>auditProductionArtifacts(files(text),[sourceHash],[],approved))
 assert.throws(()=>auditProductionArtifacts(files(code),[sourceHash]))
})
