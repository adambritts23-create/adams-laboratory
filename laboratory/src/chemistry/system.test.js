import assert from 'node:assert/strict'
import test from 'node:test'
import { createChemicalSystem, updateChemicalSystem, candidateSpecies } from './system.js'
import { validateChemicalSystem } from './validation.js'
import { thermodynamicRepository as repository } from '../thermodynamics/index.js'
const update = (s, a) => updateChemicalSystem(s, a, repository)
function validSystem() {
  let s = update(createChemicalSystem(), { type: 'toggleSpecies', id: 'uranyl' })
  return update(s, { type: 'total', id: 'total:U', value: 1e-6 })
}
test('aqueous element discovery includes H/O implicitly but does not define totals or basis', () => {
  const s = createChemicalSystem()
  assert.ok(candidateSpecies(s, repository).some(r => r.id === 'carbonic-acid'))
  assert.ok(candidateSpecies(s, repository).some(r => r.id === 'water'))
  assert.deepEqual(s.analyticalComponents, [])
  assert.equal(s.componentBasis, null)
  assert.deepEqual(update(s, { type: 'toggleElement', symbol: 'H' }), s)
})
test('selected species define analytical constraints excluding solvent H/O', () => {
  const s = update(createChemicalSystem(), { type: 'toggleSpecies', id: 'uranyl-carbonate' })
  assert.deepEqual(s.analyticalComponents.map(c => c.element), ['C', 'U'])
  assert.equal(s.componentBasis, null)
  const noSolvent = update(s, { type: 'toggleSpecies', id: 'water' })
  assert.deepEqual(noSolvent.selectedSpecies, ['uranyl-carbonate'])
})
test('element and phase changes prune incompatible species and orphan totals', () => {
  let s = validSystem()
  s = update(s, { type: 'toggleSpecies', id: 'uranium-trioxide' })
  s = update(s, { type: 'togglePhase', phase: 'solid' })
  assert.deepEqual(s.selectedSpecies, ['uranyl'])
  assert.equal(s.analyticalComponents[0].total, 1e-6)
  s = update(s, { type: 'toggleElement', symbol: 'U' })
  assert.deepEqual(s.selectedSpecies, [])
  assert.deepEqual(s.analyticalComponents, [])
  s = update(s, { type: 'toggleElement', symbol: 'U' })
  assert.deepEqual(s.selectedSpecies, [])
  assert.ok(update(s, { type: 'togglePhase', phase: 'liquid' }).enabledPhases.includes('liquid'))
})
test('system validation checks both pH modes, numbers, fixed ionic strength and future redox inputs', () => {
  const valid = validSystem()
  assert.deepEqual(validateChemicalSystem(valid, repository), [])
  for (const total of [null, -1, Infinity, NaN, '0', '']) assert.ok(validateChemicalSystem({ ...valid, analyticalComponents: [{ ...valid.analyticalComponents[0], total }] }, repository).length)
  for (const patch of [
    { pHMode: 'fixed', pHValue: null }, { pHRange: { min: 14, max: 0 } }, { temperature: -273.15 },
    { pressure: 0 }, { ionicStrengthMode: 'fixed', fixedIonicStrength: null }, { redoxMode: 'fixedEh', redoxValue: null },
    { redoxMode: 'range', redoxRange: { quantity: 'pe', min: 2, max: 1 } }, { selectedSpecies: ['missing'] },
    { solvent: null }, { selectedElements: ['Xx'] }, { enabledPhases: ['aqueous'] }, { componentBasis: [] },
    { analyticalComponents: [] }, { selectedSpecies: ['uranyl', 'uranyl'] }, { activityModel: 'invented' },
  ]) assert.ok(validateChemicalSystem({ ...valid, ...patch }, repository).length, JSON.stringify(patch))
  assert.deepEqual(validateChemicalSystem({ ...valid, pHMode: 'fixed', pHValue: -1, ionicStrengthMode: 'fixed', fixedIonicStrength: 0 }, repository), [])
  assert.ok(validateChemicalSystem({ ...valid, redoxMode: 'fixedPe', redoxValue: 0 }, repository).some(e => e.includes('electron component')))
  assert.ok(validateChemicalSystem(null, repository).length)
  assert.ok(validateChemicalSystem({}, repository).length)
})
