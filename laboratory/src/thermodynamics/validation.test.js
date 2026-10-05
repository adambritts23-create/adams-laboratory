import assert from 'node:assert/strict'
import test from 'node:test'
import { validateDataset, validateSpecies } from './validation.js'
import { demoSpecies } from '../data/species.js'
import { elements } from '../data/elements.js'
const options = { elementSymbols: elements.map(e => e.symbol) }
test('all demo records are valid and thermodynamic fields remain explicitly null', () => {
  assert.deepEqual(validateDataset(demoSpecies, options), [])
  for (const r of demoSpecies) for (const key of ['logK', 'temperatureReference', 'pressureReference', 'temperatureModel', 'formationReaction', 'componentStoichiometry']) assert.equal(r[key], null)
})
test('record validation reports malformed science and provenance without repairing it', () => {
  const original = demoSpecies.find(r => r.id === 'uranyl')
  for (const patch of [
    { id: '' }, { phase: 'plasma' }, { charge: '2' }, { elementalComposition: { U: -1 } },
    { elementalComposition: { Xx: 1 } }, { oxidationStates: { U: [{ value: '6', count: 1 }] } },
    { oxidationStates: { U: [{ value: 6, count: 2 }] } }, { oxidationStates: { Fe: null } },
    { logK: NaN }, { logK: 'unknown' }, { logK: 0 }, { pressureReference: 1 },
    { provenance: null }, { provenance: { ...original.provenance, original: {} } },
    { provenance: { ...original.provenance, original: { ...original.provenance.original, logK: 0 } } },
    { qualityFlags: 'demo' }, { formationReaction: { equation: 'x', stoichiometry: { x: NaN } } },
  ]) {
    const record = { ...original, ...patch }
    const before = structuredClone(record)
    assert.ok(validateSpecies(record, options).length, JSON.stringify(patch))
    assert.deepEqual(record, before)
  }
  assert.ok(validateDataset([original, original], options).some(d => d.path === 'id'))
  assert.ok(validateSpecies(null).length)
  assert.ok(validateSpecies({}).length)
  assert.ok(validateDataset(null).length)
})
