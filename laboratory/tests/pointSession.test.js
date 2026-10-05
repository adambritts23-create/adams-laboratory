import test from 'node:test'
import assert from 'node:assert/strict'
import { references, role } from './pointHelpers.js'
import { createLaboratorySession, updateLaboratorySession, deserializeSession, serializeSession } from '../src/session/laboratorySession.js'
import { prepareSessionPoint } from '../src/solver/prepareSession.js'
import { createCalculationDefinition } from '../src/calculations/definition.js'
import { solvePoint } from '../src/solver/point.js'
import { componentRole } from '../src/chemistry/components.js'
import { sourcePhase } from '../src/thermodynamics/importers/spana/names.js'

function setup(caseName = 'redox') {
  const c = references.cases.find(c => c.id === caseName)
  const components = [...new Set([...c.components, 'H2O'])].map(name => ({ id: name, name, role: componentRole(name), associations: [] }))
  const species = c.sourceRecords.map(r => ({ id: r.id, name: r.name, phase: sourcePhase(r.name), provenance: r.provenance,
    temperatureReference: 298.15, logK: r.logK, logKConvention: 'log10 formation constant for one named product from signed components',
    metadata: { sourceFormat: 'spana-java-binary', effectiveSourceReaction: { components: Object.entries(r.coefficients).map(([name, coefficient]) => ({ name, coefficient })) } } }))
  const water = { id: 'water', role: 'solvent', phase: 'liquid', elementalComposition: { H: 2, O: 1 } }
  const repository = { getComponents: () => components, getComponentById: id => components.find(c => c.id === id) ?? null,
    getSpecies: () => species, getSpeciesById: id => id === 'water' ? water : species.find(s => s.id === id),
    getElements: () => [], getSources: () => [{ id: 'reference-data', name: 'Official source reactions' }], getPhases: () => ['aqueous', 'solid', 'gas', 'liquid'] }
  const session = createLaboratorySession(repository)
  session.chemicalSystem.selectedComponents = [...c.components]
  session.chemicalSystem.selectedSpecies = species.map(s => s.id)
  session.calculationDefinition = createCalculationDefinition(session.chemicalSystem, repository)
  session.calculationDefinition.componentConditions = c.conditions.map((text, i) => {
    const [mode, value] = text.split(',')
    return { componentId: c.components[i], mode, quantity: mode === 'T' ? 'total' : 'log-activity', unit: mode === 'T' ? 'mol/kg-H2O' : 'dimensionless', value: Number(value) }
  })
  session.calculationDefinition.activityModel = 'ideal'
  return { session, repository, components, species }
}
test('repository preparation reaches a real point; only matching successful results enter the session', async () => {
  const { session, repository } = setup()
  const prepared = await prepareSessionPoint(session, repository)
  assert.ok(prepared.ok, JSON.stringify(prepared))
  const result = solvePoint(prepared.system, prepared.input)
  assert.ok(result.ok)
  assert.equal(updateLaboratorySession(session, { type: 'pointResult', result }, repository), session)
  const pending = updateLaboratorySession(session, { type: 'beginPoint', revision: session.revision, systemId: prepared.system.id, inputId: prepared.input.id }, repository)
  assert.equal(updateLaboratorySession(pending, { type: 'pointResult', result: structuredClone(result) }, repository), pending)
  const committed = updateLaboratorySession(pending, { type: 'pointResult', result }, repository)
  assert.equal(committed.calculationResult, result)
  const edited = updateLaboratorySession(committed, { type: 'calculation', definition: { ...session.calculationDefinition, temperature: { value: 30, unit: 'C' } } }, repository)
  assert.equal(edited.calculationResult, null)
  assert.equal(updateLaboratorySession(edited, { type: 'pointResult', result }, repository), edited)
  assert.equal(updateLaboratorySession(edited, { type: 'beginPoint', revision: 0, systemId: prepared.system.id, inputId: prepared.input.id }, repository), edited)
  assert.equal(deserializeSession(serializeSession(committed)).calculationResult, null)
})
test('preparation rejects sweeps, unit confusion, nonideal conditions, absent basis terms and dependencies', async () => {
  for (const mutate of [
    s => { s.calculationDefinition.temperature.value = 30 },
    s => { s.calculationDefinition.activityModel = 'SIT' },
    s => { s.calculationDefinition.componentConditions[0].unit = 'mol/L-solution' },
    s => { const axis = { ...s.calculationDefinition.componentConditions.shift(), mode: 'TV', range: { min: 1, max: 2 }, points: 10 }; s.calculationDefinition.independentVariables.push(axis) },
    s => { s.calculationDefinition.ionicStrength = { mode: 'fixed', value: 0.1, unit: 'mol/kg-H2O' } },
  ]) { const { session, repository } = setup(); mutate(session); assert.equal((await prepareSessionPoint(session, repository)).ok, false) }
  const missing = setup(); missing.species[0].metadata.effectiveSourceReaction.components.push({ name: 'unselected', coefficient: 1 })
  assert.equal((await prepareSessionPoint(missing.session, missing.repository)).diagnostics[0].code, 'unsupported-basis-transformation')
  const dependent = setup(); const name = 'Fe 3+'
  dependent.components.push({ id: name, name, role: role(name) === 'ordinary' ? 'basis-choice' : role(name), associations: [] })
  dependent.session.chemicalSystem.selectedComponents.push(name)
  dependent.session.calculationDefinition.componentConditions.push({ componentId: name, mode: 'LA', quantity: 'log-activity', value: -5, unit: 'dimensionless' })
  assert.ok((await prepareSessionPoint(dependent.session, dependent.repository)).diagnostics.some(d => d.code === 'redundant-basis'))
  const changedConstant = setup(); changedConstant.species[0].logK += 1
  assert.equal((await prepareSessionPoint(changedConstant.session, changedConstant.repository)).diagnostics[0].code, 'thermodynamic-data-unavailable')
})
test('prepared/input identities change with science but not workspace; stale/wrong identity results are rejected', async () => {
  const { session, repository } = setup('fixed-activity')
  const a = await prepareSessionPoint(session, repository)
  const b = await prepareSessionPoint({ ...session, visualizationState: { workspace: 'system' } }, repository)
  assert.equal(a.system.id, b.system.id); assert.equal(a.input.id, b.input.id)
  session.calculationDefinition.componentConditions[0].value = -7
  const changed = await prepareSessionPoint(session, repository)
  assert.equal(a.system.id, changed.system.id); assert.notEqual(a.input.id, changed.input.id)
  const pending = updateLaboratorySession(session, { type: 'beginPoint', revision: 0, systemId: changed.system.id, inputId: changed.input.id }, repository)
  const oldResult = solvePoint(a.system, a.input)
  assert.equal(updateLaboratorySession(pending, { type: 'pointResult', result: oldResult }, repository), pending)
})
