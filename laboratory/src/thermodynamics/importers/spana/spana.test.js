import assert from 'node:assert/strict'
import test from 'node:test'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { BinaryReader, parseDb, parseElb, EMPTY, ANALYTIC, LOOKUP } from './binary.js'
import { parseReferences, splitReferences, resolveReferences } from './references.js'
import { sourceCharge, sourcePhase } from './names.js'
import { convertSpana } from './convert.js'
import { repositoryFromSnapshot } from '../../snapshot.js'
import { readZipEntry } from '../../../../scripts/spana-source.js'
import { componentLinks, normalizeSpanaRecord } from './normalize.js'
import { createChemicalSystem, updateChemicalSystem, candidateSpecies } from '../../../chemistry/system.js'
import { getSystemCapabilities } from '../../../chemistry/components.js'

// SYNTHETIC PARSER FIXTURES ONLY. Values are arbitrary byte-test payloads, never shipped as chemical data.
const utf = text => { const raw = Buffer.from(text, 'utf8'), length = Buffer.alloc(2); length.writeUInt16BE(raw.length); return Buffer.concat([length, raw]) }
const double = n => { const b = Buffer.alloc(8); b.writeDoubleBE(n); return b }
const integer = n => { const b = Buffer.alloc(4); b.writeInt32BE(n); return b }
const float = n => { const b = Buffer.alloc(4); b.writeFloatBE(n); return b }
function dbFixture({ name = 'Fe+2', logK = 123.456, thermal = 'normal', old = false, components = [{ name: 'Fe+2', coefficient: 1 }] } = {}) {
  const parts = [utf(name), double(logK)]
  if (thermal === 'analytic') parts.push(double(ANALYTIC), double(300), ...[1, 2, 3, 4, 5, 6].map(double))
  else if (thermal === 'lookup') parts.push(double(LOOKUP), double(600))
  else parts.push(double(EMPTY), double(EMPTY))
  if (old) parts.push(utf('Fe+2'), double(1), ...Array.from({ length: 5 }, () => [utf(''), double(0)]).flat(), double(-2))
  else parts.push(utf(String(components.length)), ...components.flatMap(c => [utf(c.name), double(c.coefficient)]))
  parts.push(utf('TEST + (unknown+code)'), utf('SYNTHETIC PARSER FIXTURE'))
  if (thermal === 'lookup') parts.push(...Array.from({ length: 62 }, (_, i) => float(i === 0 ? NaN : i)))
  return Buffer.concat(parts)
}
const elbFixture = Buffer.concat([utf('Fe'), integer(1), utf('Fe+2'), utf('Synthetic component description')])
const context = { sourceDatabase: 'synthetic-parser-fixture', sourceFile: 'fixture.db', referenceSourceFile: 'fixture-references',
  dbHash: 'a'.repeat(64), importDate: '2026-09-05T00:00:00Z' }

test('Java modified UTF handles NUL and surrogate pairs, rejects broken sequences', () => {
  assert.equal(new BinaryReader(Buffer.from([0, 2, 0xc0, 0x80])).utf(), '\0')
  assert.equal(new BinaryReader(Buffer.from([0, 6, 0xed, 0xa0, 0xbd, 0xed, 0xb8, 0x80])).utf(), '😀')
  assert.throws(() => new BinaryReader(Buffer.from([0, 2, 0xc0, 0x20])).utf(), /Malformed/)
  assert.throws(() => new BinaryReader(Buffer.from([0, 3, 0x41])).utf(), /Truncated/)
})
test('DB variable and six-slot layouts preserve source doubles, offsets, proton field and bytes', () => {
  const first = dbFixture(), second = dbFixture({ old: true })
  const parsed = parseDb(Buffer.concat([first, second]))
  assert.equal(parsed.complete, true)
  assert.equal(parsed.records.length, 2)
  assert.equal(parsed.records[0].logK, 123.456)
  assert.equal(parsed.records[0].layout, 'variable')
  assert.equal(parsed.records[1].layout, 'six-slot')
  assert.equal(parsed.records[1].protonCount, -2)
  assert.equal(parsed.records[1].byteOffset, first.length)
  assert.deepEqual(Buffer.from(parsed.records[0].rawBase64, 'base64'), first)
})
test('DB analytic and lookup fields remain raw; missing lookup NaN is preserved', () => {
  const parsed = parseDb(Buffer.concat([dbFixture({ thermal: 'analytic' }), dbFixture({ thermal: 'lookup' })]))
  assert.equal(parsed.complete, true)
  assert.deepEqual(parsed.records[0].thermal.coefficients, [1, 2, 3, 4, 5, 6])
  assert.deepEqual(parsed.records[1].thermal.rows.map(r => r.length), [9, 11, 14, 14, 14])
  assert.ok(Number.isNaN(parsed.records[1].thermal.rows[0][0]))
})
test('DB truncation reports an error instead of silently treating partial record as EOF', () => {
  assert.equal(parseDb(Buffer.alloc(0)).complete, false)
  assert.equal(parseElb(Buffer.alloc(0)).complete, false)
  const bytes = dbFixture()
  for (const length of [1, 5, bytes.length - 1]) assert.equal(parseDb(bytes.subarray(0, length)).complete, false)
  assert.equal(parseDb(Buffer.from([8, 0, 40, 67, 72])).complete, false)
})
test('ELB retains labels and descriptions, not fabricated atom counts', () => {
  const parsed = parseElb(elbFixture)
  assert.equal(parsed.complete, true)
  assert.deepEqual(parsed.entries[0].components, [{ name: 'Fe+2', description: 'Synthetic component description' }])
  assert.deepEqual(Buffer.from(parsed.entries[0].rawBase64, 'base64'), elbFixture)
  assert.equal(parseElb(elbFixture.subarray(0, -1)).complete, false)
  assert.equal(parseElb(Buffer.concat([utf('Fe'), integer(-1)])).complete, false)
})
test('Java properties escaping, continuation, duplicates and reference token lookup', () => {
  const parsed = parseReferences('# comment\nTEST=Line one\\nLine two\nSpaced\\ key : text\\\n  continued\nUnicode=\\u00e5\nTEST=Replacement\n')
  assert.equal(parsed.mapping.TEST, 'Replacement')
  assert.equal(parsed.mapping['Spaced key'], 'textcontinued')
  assert.equal(parsed.mapping.Unicode, 'å')
  assert.equal(parsed.diagnostics.length, 1)
  assert.deepEqual(splitReferences('TEST+(=Fe+3),other;[a,b]'), ['TEST', '(=Fe+3)', 'other', '[a,b]'])
  assert.equal(resolveReferences('test', parsed.mapping)[0].citation, 'Replacement')
  assert.equal(resolveReferences('missing', parsed.mapping)[0].citation, null)
  assert.equal(parseReferences('bad=\\u00xy').diagnostics[0].severity, 'error')
})
test('documented source naming conventions preserve phase and charge without redox inference', () => {
  for (const [name, expected] of [['H+', 1], ['CO3-2', -2], ['SO4 2-', -2], ['I2-', -1], ['Al+++', 3], ['B++--', -2], ['X+10', 10], ['A+B ', 0]]) assert.equal(sourceCharge(name), expected, name)
  for (const [name, expected] of [['CO2(g)', 'gas'], ['Fe(OH)3(am)', 'solid'], ['H2O(l)', 'liquid'], ['Fe+2', 'aqueous']]) assert.equal(sourcePhase(name), expected)
})
test('imported repository preserves constants, source component coefficients and missing metadata', () => {
  const artifact = convertSpana({ db: dbFixture(), elb: elbFixture, referencesText: 'TEST=Synthetic citation', context })
  const r = repositoryFromSnapshot(artifact)
  const item = r.getSpeciesByElements(['Fe'], { implicitElements: ['H', 'O'] }).find(s => s.role === 'solute')
  assert.equal(item.logK, 123.456)
  assert.equal(item.elementalComposition, null)
  assert.equal(item.oxidationStates, null)
  assert.equal(item.pressureReference, null)
  assert.deepEqual(item.componentStoichiometry, { 'Fe+2': 1 })
  assert.equal(item.provenance.originalReferenceCode, 'TEST + (unknown+code)')
  assert.equal(item.provenance.original.raw.logK, 123.456)
  assert.equal(item.provenance.sourceFile, 'fixture.db')
  assert.equal(item.provenance.originalRecordId, null)
  assert.equal(item.provenance.importerVersion, 'spana-readonly-1.0.0')
  assert.equal(r.getSpeciesByPhase('aqueous').length, 1)
  assert.equal(r.getSpeciesByElements(['Cu']).length, 0)
  assert.equal(r.getSpeciesByOxidationState('Fe', 2).length, 0)
  assert.equal(r.getSpeciesByOxidationState('Fe', 'unknown').length, 1)
  assert.ok(r.getDiagnostics().some(d => d.severity === 'warning'))
})
test('ZIP reader rejects malformed input rather than extracting files', () => {
  assert.throws(() => readZipEntry(Buffer.from('not an archive'), 'Reactions.db'), /ZIP/)
})
test('unknown ELB labels do not silently become compatible with every element selection', () => {
  const { links } = componentLinks([{ element: 'XX', byteOffset: 0, components: [{ name: 'Fe+2', description: 'Unknown linkage fixture' }] }], ['Fe'])
  const record = normalizeSpanaRecord(parseDb(dbFixture()).records[0], { ...context, links, references: {} })
  assert.equal(record.discoveryElements, null)
  assert.ok(record.notes.some(n => n.includes('Unlinked source components')))
})
test('source component choices gate direct reactions and electron-dependent redox capability', () => {
  const elb = Buffer.concat([elbFixture, utf('e-'), integer(1), utf('e-'), utf('electron'), utf('H'), integer(1), utf('H+'), utf('hydrogen ion'), utf('XX'), integer(1), utf('H2O'), utf('water')])
  const db = Buffer.concat([
    dbFixture({ name: 'Fe+3', components: [{ name: 'Fe+2', coefficient: 1 }, { name: 'e-', coefficient: -1 }] }),
    dbFixture({ name: 'OH-', components: [{ name: 'H+', coefficient: -1 }, { name: 'H2O', coefficient: 1 }] }),
  ])
  const artifact = convertSpana({ db, elb, context }), repository = repositoryFromSnapshot(artifact)
  const fe = repository.getComponentsByElement('Fe')[0], electron = repository.getComponents().find(c => c.role === 'electron')
  assert.equal(fe.name, 'Fe+2')
  assert.equal(fe.associations[0].description, 'Synthetic component description')
  assert.equal(repository.getSpeciesBySource(context.sourceDatabase).length, 2)
  assert.equal(repository.getSpeciesByComponents([fe.id]).filter(s => s.role === 'solute').length, 0)
  assert.equal(repository.getSpeciesByComponents([fe.id, electron.id]).filter(s => s.role === 'solute')[0].name, 'Fe+3')
  let system = { ...createChemicalSystem(repository), selectedElements: ['Fe'] }
  const update = action => { system = updateChemicalSystem(system, action, repository) }
  assert.equal(getSystemCapabilities(system, repository).redox, false)
  update({ type: 'field', field: 'redoxMode', value: 'fixedEh' })
  assert.equal(system.redoxMode, 'none')
  update({ type: 'toggleComponent', id: fe.id })
  update({ type: 'toggleComponent', id: electron.id })
  assert.equal(getSystemCapabilities(system, repository).redox, true)
  update({ type: 'field', field: 'redoxMode', value: 'fixedEh' })
  assert.equal(system.redoxMode, 'fixedEh')
  const species = candidateSpecies(system, repository).find(s => s.name === 'Fe+3')
  update({ type: 'toggleSpecies', id: species.id })
  assert.equal(system.selectedSpecies.length, 1)
  update({ type: 'toggleComponent', id: electron.id })
  assert.equal(system.redoxMode, 'none')
  assert.equal(system.redoxValue, null)
  assert.deepEqual(system.selectedSpecies, [])
})
test('optional local snapshot integration checks every stored reaction against retained bytes', async t => {
  let artifact
  for (const file of ['.local/spana-components.json', '.local/spana-final.json', '.local/spana.json']) {
    try { artifact = JSON.parse(await readFile(file, 'utf8')); break } catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  if (!artifact) { t.skip('No local source snapshot supplied'); return }
  const repository = repositoryFromSnapshot(artifact)
  const imported = repository.getSpecies().filter(s => s.provenance.kind === 'imported')
  assert.ok(imported.length > 0)
  for (const record of imported) {
    const parsed = parseDb(Buffer.from(record.provenance.original.raw.rawBase64, 'base64'))
    assert.equal(parsed.complete, true)
    assert.equal(parsed.records[0].name, record.provenance.originalSpeciesName)
    assert.equal(parsed.records[0].logK, record.provenance.originalLogK)
    assert.deepEqual(parsed.records[0].components, record.provenance.original.raw.components)
  }
  assert.ok(repository.getSpeciesByElements(['U', 'C'], { implicitElements: ['H', 'O'] }).some(s => s.logK !== null))
})
