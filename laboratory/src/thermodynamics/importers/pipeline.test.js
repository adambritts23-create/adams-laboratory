import assert from 'node:assert/strict'
import test from 'node:test'
import { runImporter } from './pipeline.js'
import { demoSpecies } from '../../data/species.js'
const context = { sourceDatabase: 'test-format-only', importDate: '2026-09-05T00:00:00Z', importerVersion: 'test-1' }
function normalized(raw, ctx) {
  const r = structuredClone(demoSpecies[0])
  r.sourceDatabase = ctx.sourceDatabase
  r.sourceRecordId = ctx.sourceRecordId
  r.provenance = { ...r.provenance, ...ctx, kind: 'imported', original: { speciesName: raw.name, reaction: null, logK: null, citation: null } }
  return { status: 'supported', record: r }
}
test('import runner preserves raw input even if adapter mutates its copy and reports unsupported/malformed rows', async () => {
  const raw = { name: 'source water', untouched: 'original text' }
  const adapter = {
    parse: () => ({ records: [{ raw, sourceRecordId: '1' }, { raw: {}, sourceRecordId: '2' }, { raw: {}, sourceRecordId: '3' }], diagnostics: [] }),
    normalize: (value, ctx) => {
      if (ctx.sourceRecordId === '2') return { status: 'unsupported', message: 'Unsupported test row.' }
      if (ctx.sourceRecordId === '3') throw new Error('Malformed test row.')
      const result = normalized(value, ctx)
      value.untouched = 'changed by adapter'
      return result
    },
  }
  const result = await runImporter(adapter, '', context)
  assert.equal(result.records.length, 1)
  assert.deepEqual(result.records[0].provenance.original.raw, raw)
  assert.equal(raw.untouched, 'original text')
  assert.deepEqual(result.diagnostics.map(d => d.kind), ['unsupported', 'malformed'])
})
test('import runner rejects duplicates, missing context provenance and parser failures', async () => {
  const parse = () => ({ records: [{ raw: { name: 'water' }, sourceRecordId: '1' }, { raw: { name: 'water' }, sourceRecordId: '2' }], diagnostics: [] })
  const duplicates = await runImporter({ parse, normalize: normalized }, '', context)
  assert.equal(duplicates.records.length, 0)
  assert.ok(duplicates.diagnostics.some(d => d.path === 'id'))
  const mismatch = await runImporter({ parse, normalize: raw => normalized(raw, { ...context, sourceRecordId: 'wrong' }) }, '', context)
  assert.equal(mismatch.records.length, 0)
  assert.ok(mismatch.diagnostics.length)
  const failed = await runImporter({ parse: () => { throw new Error('bad file') } }, '', context)
  assert.match(failed.diagnostics[0].message, /Parse failed/)
})
