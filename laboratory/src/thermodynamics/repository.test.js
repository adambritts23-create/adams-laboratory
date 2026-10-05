import assert from 'node:assert/strict'
import test from 'node:test'
import { thermodynamicRepository as repository } from './index.js'
import { createRepository, matchesOxidationStates } from './repository.js'
import { demoSpecies, demoSource } from '../data/species.js'
import { elements } from '../data/elements.js'

test('repository queries elements, IDs, sources, phases and text from a validated snapshot', () => {
  assert.ok(repository.getElements().some(e => e.symbol === 'F'))
  assert.equal(repository.getSources()[0].id, demoSource.id)
  assert.equal(repository.getSpeciesById('missing'), null)
  assert.deepEqual(repository.getSpeciesByPhase('gas').map(s => s.id), ['carbon-dioxide-gas'])
  assert.deepEqual(repository.getSpeciesByPhase('liquid').map(s => s.id), ['water'])
  assert.deepEqual(repository.getSpecies({ text: 'IRON(III)' }).map(s => s.id), ['iron-iii'])
  assert.deepEqual(repository.getSpeciesByElements([]), [])
  assert.deepEqual(repository.getSpeciesByElements(['H']).map(s => s.id), ['hydrogen-ion'])
  assert.ok(repository.getSpeciesByElements(['C'], { implicitElements: ['H', 'O'] }).some(s => s.id === 'carbonic-acid'))
  assert.ok(!repository.getSpeciesByElements(['U'], { implicitElements: ['H', 'O'] }).some(s => s.id === 'uranyl-carbonate'))
})
test('oxidation-state filtering is generic, explicit about unknown, and supports mixed valence', () => {
  assert.deepEqual(repository.getSpeciesByOxidationState('Fe', 2).map(s => s.id), ['iron-ii'])
  assert.deepEqual(repository.getSpeciesByOxidationState('Fe', 3).map(s => s.id), ['iron-iii'])
  assert.deepEqual(repository.getSpecies({ elements: ['Fe'], oxidationStates: { Fe: [3] } }).map(s => s.id), ['iron-iii'])
  assert.ok(repository.getSpeciesByOxidationState('C', 'unknown').length > 0)
  assert.equal(repository.getSpeciesByOxidationState('C', 4).length, 0)
  const mixed = { elementalComposition: { Fe: 3 }, oxidationStates: { Fe: [{ value: 2, count: 1 }, { value: 3, count: 2 }] } }
  assert.equal(matchesOxidationStates(mixed, { Fe: [2] }), true)
  assert.equal(matchesOxidationStates(mixed, { Fe: [4] }), false)
  assert.equal(matchesOxidationStates(mixed, { U: [6] }), true)
})
test('repository protects provenance from mutations and rejects invalid datasets', () => {
  const records = structuredClone(demoSpecies)
  const r = createRepository({ species: records, elements, sources: [demoSource] })
  records[0].provenance.original.speciesName = 'mutated'
  const water = r.getSpeciesById('water')
  water.provenance.original.speciesName = 'also mutated'
  assert.equal(r.getSpeciesById('water').provenance.original.speciesName, 'Water')
  assert.throws(() => createRepository({ species: [...records, records[0]], elements, sources: [] }), /Duplicate species ID/)
  assert.throws(() => createRepository({ species: demoSpecies, elements, sources: [] }), /source registry/)
  assert.throws(() => createRepository({ species: demoSpecies, elements, sources: [demoSource, demoSource] }), /unique IDs/)
})
