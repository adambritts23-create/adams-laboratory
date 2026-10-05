import test from 'node:test'
import assert from 'node:assert/strict'
import { conditionModes, createCalculationDefinition, createCondition, toSourceInput, validateCalculationDefinition } from './definition.js'
import { createLaboratorySession, updateLaboratorySession, serializeSession, deserializeSession } from '../session/laboratorySession.js'
import { componentRole } from '../chemistry/components.js'

const components = ['H+', 'H2O', 'e-', 'Fe 2+'].map(name => ({ id: name, name, role: componentRole(name), associations: name === 'Fe 2+' ? [{ element: 'Fe', description: 'iron(II)' }] : [] }))
const repository = { getComponents: () => structuredClone(components), getComponentById: id => structuredClone(components.find(c => c.id === id) ?? null),
  getElements: () => [{ symbol: 'Fe' }], getSources: () => [{ id: 'test', name: 'Identity test only' }],
  getSpeciesById: id => id === 'water' ? { id, elementalComposition: { H: 2, O: 1 } } : null, getSpecies: () => [], getPhases: () => ['aqueous', 'solid', 'gas', 'liquid'] }
function valid() {
  const session = createLaboratorySession(repository)
  session.calculationDefinition.componentConditions.find(c => c.componentId === 'H+').value = 7
  return session
}
test('T/TV/LTV/LA/LAV preserve hur, kh and source input semantics', () => {
  for (const [mode, spec] of Object.entries(conditionModes)) {
    const c = createCondition(components[3], mode)
    const source = toSourceInput(c, mode === 'LTV' ? -3 : 0.001, 25)
    assert.equal(source.hur, spec.hur); assert.equal(source.kh, spec.kh)
    assert.equal(source.value, 0.001)
    assert.equal(source.field, spec.kh === 1 ? 'tot' : 'logA')
  }
})
test('pH/pe/Eh are electron/proton activity coordinates with temperature-dependent conversion', () => {
  assert.equal(toSourceInput(createCondition(components[0], 'LA', 'pH'), 7, 25).value, -7)
  assert.equal(toSourceInput(createCondition(components[2], 'LAV', 'pe'), 13, 25).value, -13)
  const eh = createCondition(components[2], 'LAV', 'Eh')
  assert.ok(Math.abs(toSourceInput(eh, 0.7690715459, 25).value + 13) < 1e-7)
  assert.notEqual(toSourceInput(eh, 0.7, 25).value, toSourceInput(eh, 0.7, 50).value)
  assert.throws(() => toSourceInput(eh, 0.7, -273.15))
})
test('molality and molarity stay distinct; no density-free conversion or exponent overflow', () => {
  assert.throws(() => toSourceInput({ ...createCondition(components[3]), unit: 'mol/L-solution' }, 1, 25), /Molarity/)
  assert.throws(() => toSourceInput(createCondition(components[3], 'LTV'), 400, 25))
  assert.throws(() => toSourceInput(createCondition(components[3], 'LTV'), -400, 25))
  const s = valid(); const c = s.calculationDefinition.componentConditions[0]
  c.mode = 'T'; c.quantity = 'total'; c.unit = 'mol/L-solution'; c.value = 1
  assert.deepEqual(validateCalculationDefinition(s.calculationDefinition, s.chemicalSystem, repository), [])
})
test('definition validates capability, duplicate constraints, unknown components, units and sampling', () => {
  const s = valid(), check = d => validateCalculationDefinition(d, s.chemicalSystem, repository)
  assert.deepEqual(check(s.calculationDefinition), [])
  for (const mutate of [
    d => { d.output.type = 'calculated-redox' },
    d => { d.componentConditions[0].quantity = 'pe' },
    d => { d.componentConditions.push({ ...d.componentConditions[0] }) },
    d => { d.componentConditions[0].componentId = 'missing' },
    d => { d.temperature.unit = 'K' },
    d => { d.pressure.value = -1 },
    d => { d.ionicStrength.unit = 'unknown' },
    d => { d.componentConditions[1].mode = 'T' },
    d => { d.sampling.maxPoints = 0 },
    d => { d.independentVariables = [null] },
  ]) { const d = structuredClone(s.calculationDefinition); mutate(d); assert.ok(check(d).length) }
})
test('multidimensional definition uses independent-variable arrays and an explicit point budget', () => {
  const s = valid(); s.chemicalSystem.selectedComponents.push('e-')
  const d = createCalculationDefinition(s.chemicalSystem, repository)
  d.componentConditions = d.componentConditions.filter(c => c.componentId === 'H2O')
  d.independentVariables = [createCondition(components[0], 'LAV', 'pH'), createCondition(components[2], 'LAV', 'Eh')].map(c => ({ ...c, range: { min: 0, max: 1 }, points: 11 }))
  d.output.type = 'predominance'; d.output.componentId = 'H+'
  assert.deepEqual(validateCalculationDefinition(d, s.chemicalSystem, repository), [])
  d.independentVariables[0].points = 1000
  assert.ok(validateCalculationDefinition(d, s.chemicalSystem, repository).some(e => e.includes('budget')))
})
test('workspaces retain the same system; edits invalidate results without requiring persistence', () => {
  const original = valid()
  const workspace = updateLaboratorySession(original, { type: 'workspace', workspace: 'calculation' }, repository)
  assert.equal(workspace.chemicalSystem, original.chemicalSystem); assert.equal(workspace.revision, 0)
  const edited = updateLaboratorySession({ ...workspace, calculationResult: { stale: true }, analysisState: { results: ['old'] } }, { type: 'calculation', definition: { ...workspace.calculationDefinition, temperature: { value: 50, unit: 'C' } } }, repository)
  assert.equal(edited.chemicalSystem.temperature, 50); assert.equal(edited.calculationResult, null); assert.equal(edited.analysisState.results, null)
  assert.equal(original.chemicalSystem.temperature, 25); assert.equal(edited.revision, 1)
  assert.deepEqual(deserializeSession(serializeSession(edited)), edited)
})
test('removing electron/proton/required components removes incompatible conditions and outputs', () => {
  let s = valid()
  s = updateLaboratorySession(s, { type: 'system', action: { type: 'toggleComponent', id: 'e-' } }, repository)
  s.calculationDefinition.componentConditions.find(c => c.componentId === 'e-').quantity = 'pe'
  s.calculationDefinition.output.type = 'calculated-redox'
  s = updateLaboratorySession(s, { type: 'system', action: { type: 'toggleComponent', id: 'e-' } }, repository)
  assert.ok(!s.calculationDefinition.componentConditions.some(c => c.componentId === 'e-'))
  assert.equal(s.calculationDefinition.output.type, 'log-concentration'); assert.ok(s.invalidations.length)
  s.calculationDefinition.output.type = 'calculated-pH'
  s = updateLaboratorySession(s, { type: 'system', action: { type: 'toggleComponent', id: 'H+' } }, repository)
  assert.equal(s.calculationDefinition.output.type, 'log-concentration')
  assert.ok(!s.calculationDefinition.componentConditions.some(c => c.quantity === 'pH'))
})
