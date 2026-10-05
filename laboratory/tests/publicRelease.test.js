import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { defaultDatabaseUrl, createDefaultSourceProvider } from '../src/components/defaultSource.js'
import { publicSnapshot } from '../scripts/prepare-public-data.js'
import { auditProductionArtifacts } from '../scripts/production-artifacts.js'
import { loadSnapshotFile } from '../src/components/databaseLoading.js'

const publicText = fs.readFileSync('public/data/thermodynamic-default.json','utf8')
test('public default resolves under the exact deployment base and loads once with original source identity', async () => {
  assert.equal(defaultDatabaseUrl('/adambritts-site/laboratory/'), '/adambritts-site/laboratory/data/thermodynamic-default.json')
  assert.equal(defaultDatabaseUrl('/adambritts-site/laboratory'), defaultDatabaseUrl('/adambritts-site/laboratory/'))
  let calls = 0
  const provider = createDefaultSourceProvider({ enabled:true, fetchSource: async () => { calls++; return new Response(publicText) } })
  const stages=[]
  const [a,b]=await Promise.all([provider(s=>stages.push(s)),provider(()=>{})])
  assert.equal(a,b); assert.equal(calls,1); assert.equal(a.origin,'default'); assert.equal(a.recordCount,4445)
  assert.deepEqual(stages,['Loading thermodynamic source…','Loading database…','Validating…'])
  assert.deepEqual(a.repository.getSources(),JSON.parse(publicText).sources)
  assert.equal(await provider(()=>{}),a); assert.equal(calls,1)
})
test('public asset retains every scientific field; only absolute archive-location prefixes are removed', () => {
  const source=JSON.parse(fs.readFileSync('.local/spana-components.json','utf8'))
  assert.deepEqual(JSON.parse(publicText),publicSnapshot(source))
  const published=JSON.parse(publicText)
  source.species.forEach((s,i)=>{
    assert.equal(published.species[i].logK,s.logK)
    assert.deepEqual(published.species[i].metadata,s.metadata)
    assert.equal(published.species[i].id,s.id)
    assert.equal(published.species[i].provenance.dbSha256,s.provenance.dbSha256)
  })
  assert.doesNotMatch(publicText,/[A-Z]:[\\/]+Users[\\/]/i)
})
test('explicit manual load is a replacement repository, while automatic failures never supply a fake database', async () => {
  for(const response of [new Response('',{status:404}),new Response('{}')]) {
    await assert.rejects(createDefaultSourceProvider({enabled:true,fetchSource:async()=>response})(()=>{}))
  }
  const s=JSON.parse(publicText)
  const smaller={...s,species:s.species.filter(s=>s.role==='solvent')}
  const text=JSON.stringify(smaller)
  const manual=await loadSnapshotFile({name:'manual.json',size:text.length,text:async()=>text},()=>{})
  assert.equal(manual.recordCount,1); assert.equal(manual.name,'manual.json')
  assert.equal(manual.repository.getSpecies().length,1)
  const ui=fs.readFileSync('src/components/DatabaseSource.jsx','utf8')
  assert.match(ui,/origin:'manual'/); assert.match(ui,/generation.current/); assert.match(ui,/sources are not merged/)
})
test('asset exceptions require exact content hashes and cannot admit unrelated data or duplicate copies', () => {
  const manifest=JSON.parse(fs.readFileSync('scripts/public-data-manifest.json','utf8'))
  assert.equal(createHash('sha256').update(publicText).digest('hex'),manifest.sha256)
  const asset={name:manifest.file,content:publicText}
  assert.ok(auditProductionArtifacts([asset],[],[manifest]).unintendedLocalFilesAbsent)
  assert.throws(()=>auditProductionArtifacts([{...asset,content:publicText+' '}],[],[manifest]))
  assert.throws(()=>auditProductionArtifacts([asset,{...asset,name:'duplicate.json'}],[],[manifest]))
  assert.throws(()=>auditProductionArtifacts([{name:'oracle.jar',content:'x'}],[],[manifest]))
})
test('expandable imagery stays in the header and remains visible at narrow widths; plots contain no artwork', () => {
  const css=fs.readFileSync('src/App.css','utf8'),app=fs.readFileSync('src/App.jsx','utf8')
  assert.match(css,/@media \(max-width: 900px\).*adam-media-trigger.*width: 104px/)
  assert.match(css,/adam-media-trigger.*overflow: hidden/)
  assert.match(app,/<header><div className="adam-media-pair"><AdamMedia/)
  for(const f of ['GridPlot.jsx','Surface3D.jsx','ScientificPlot.jsx'])assert.doesNotMatch(fs.readFileSync('src/components/'+f,'utf8'),/adam-laboratory.png/)
})
