import test from 'node:test'
import assert from 'node:assert/strict'
import { references, prepareReference } from './pointHelpers.js'
import { definitionFor, vary, reconstruct } from './phase6Helpers.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { solvePoint } from '../src/solver/point.js'
import { updateLaboratorySession, deserializeSession, serializeSession } from '../src/session/laboratorySession.js'

async function setup(caseName = 'fixed-activity', mode = 'LAV', min = -7, max = -5, points = 5, index = 0, quantity) {
  const { system, input } = await prepareReference(references.cases.find(c => c.id === caseName))
  const definition = vary(definitionFor(system, input), system.components[index].id, mode, min, max, points, quantity)
  const s = await createSweepDefinition(system, definition, 3)
  assert.ok(s.ok, JSON.stringify(s)); return { system, sweep: s.sweep }
}
test('TV/LTV/LAV endpoint inclusion, transformations and independent point equivalence', async () => {
  for (const [mode, min, max] of [['TV', 1e-6, 1e-4], ['LTV', -8, -4], ['LAV', -8, -4]]) {
    const { system, sweep } = await setup('fixed-activity', mode, min, max)
    const r = await runSweep(system, sweep)
    assert.equal(r.status, 'completed'); assert.equal(r.outcomes.length, 5)
    assert.equal(r.coordinates[0], min); assert.equal(r.coordinates.at(-1), max)
    r.outcomes.forEach(p => { assert.equal(p.transformed.value, mode === 'LTV' ? 10 ** p.coordinate : p.coordinate); reconstruct(system, p.input, p.result); assert.deepEqual(p.result, solvePoint(system, p.input)) })
    assert.ok(Object.isFrozen(r.outcomes[0].result.concentrations))
    const repeat = await runSweep(system, sweep, { chunkSize: 1 })
    assert.deepEqual(r.outcomes, repeat.outcomes)
  }
})
test('pH, pe and Eh retain increasing display coordinates and decreasing solver activities', async () => {
  for (const [name, index, quantity, min, max] of [['acid-base', 0, 'pH', 3, 11], ['redox', 1, 'pe', 10, 16], ['redox', 1, 'Eh', 0.5, 0.9]]) {
    const { system, sweep } = await setup(name, 'LAV', min, max, 5, index, quantity)
    const r = await runSweep(system, sweep)
    assert.equal(r.status, 'completed')
    assert.ok(r.transformedCoordinates[0].value > r.transformedCoordinates.at(-1).value)
    for (const p of r.outcomes) {
      const expected = quantity === 'Eh' ? -p.coordinate * Number('96485.3321233100184') / (8.31446261815324 * Math.LN10 * 298.15) : -p.coordinate
      assert.ok(Math.abs(p.transformed.value - expected) < 1e-13)
      reconstruct(system, p.input, p.result)
    }
  }
})
test('failed coordinates remain between their neighbors with typed diagnostics', async () => {
  const { system, sweep } = await setup('fixed-activity', 'TV', -1e-5, 1e-5)
  const r = await runSweep(system, sweep)
  assert.equal(r.status, 'completed-with-failed-points')
  assert.equal(r.outcomes.length, 5); assert.equal(r.outcomes[2].coordinate, 0)
  assert.equal(r.outcomes[2].status, 'failed'); assert.equal(r.outcomes[3].status, 'converged')
  assert.equal(r.outcomes[2].diagnostics[0].code, 'inconsistent-or-boundary-total')
  assert.equal(r.outcomes[2].input.constraints.find(c => c.componentId === sweep.axis.componentId).value, 0)
})
test('definition rejects unsupported domain, multiple axes, malformed sampling and identity forgery', async () => {
  const { system, sweep } = await setup()
  for (const change of [d => { d.activityModel = 'SIT' }, d => { d.temperature.value = 30 }, d => { d.pressure.value = 2 }, d => { d.independentVariables.push(d.independentVariables[0]) }, d => { d.independentVariables[0].points = 1 }, d => { d.independentVariables[0].range.min = 99 }, d => { d.componentConditions = [] }, d => { d.ionicStrength = { mode: 'fixed', value: 0.1, unit: 'mol/kg-H2O' } }]) {
    const d = structuredClone(sweep.calculationDefinition); change(d)
    assert.equal((await createSweepDefinition(system, d, 3)).status, 'definition-preparation-failure')
  }
  assert.equal((await runSweep(system, structuredClone(sweep))).status, 'definition-preparation-failure')
})
test('cancellation and stale runs preserve N requested points distinctly', async () => {
  const { system, sweep } = await setup('fixed-activity', 'LAV', -7, -5, 101)
  const controller = new AbortController()
  const pending = runSweep(system, sweep, { signal: controller.signal, chunkSize: 1 })
  setTimeout(() => controller.abort(), 0)
  const cancelled = await pending
  assert.equal(cancelled.status, 'cancelled'); assert.equal(cancelled.counts.requested, 101)
  assert.ok(cancelled.counts.notRun > 0); assert.equal(cancelled.counts.failed, 0)
  let current = true
  const stalePending = runSweep(system, sweep, { isCurrent: () => current, chunkSize: 1 })
  setTimeout(() => { current = false }, 0)
  const stale = await stalePending
  assert.equal(stale.status, 'invalidated-stale'); assert.equal(stale.outcomes.length, 101)
})
test('application integration: sweep commits require exact revision, system, definition and branded result', async () => {
  const { system, sweep } = await setup()
  const r = await runSweep(system, sweep)
  const session = { schemaVersion: 1, revision: 3, chemicalSystem: {}, calculationDefinition: sweep.calculationDefinition, analysisState: {} }
  const begin = updateLaboratorySession(session, { type: 'beginSweep', revision: 3, systemId: system.id, sweepId: sweep.id })
  assert.equal(updateLaboratorySession(begin, { type: 'sweepResult', result: structuredClone(r) }), begin)
  assert.equal(updateLaboratorySession({ ...begin, revision: 4 }, { type: 'sweepResult', result: r }).sweepResult, null)
  const wrong = { ...begin, sweepRequest: { ...begin.sweepRequest, sweepId: 'wrong' } }
  assert.equal(updateLaboratorySession(wrong, { type: 'sweepResult', result: r }), wrong)
  const committed = updateLaboratorySession(begin, { type: 'sweepResult', result: r })
  assert.equal(committed.sweepResult, r)
  assert.equal(deserializeSession(serializeSession(committed)).sweepResult, null)
})
