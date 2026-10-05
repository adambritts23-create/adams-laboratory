import { definitionFor } from './phase6Helpers.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { references, prepareReference } from './pointHelpers.js'
import { solvePoint } from '../src/solver/point.js'
import { saturatedLogSolubility, solubilityApplicability } from '../src/calculations/solubility.js'
import { gridFixture, calculateGrid, vary } from './phase8Helpers.js'
import { deriveGridOutputs } from '../src/calculations/outputs.js'
import { classifyDissolvedFormGrid } from '../src/calculations/predominance.js'
import { toSourceInput } from '../src/calculations/definition.js'

test('saturated AgCl solubility is independently reconstructed, not analytical total or free ion', async () => {
  const { system, input } = await prepareReference(references.cases.find(c => c.id === 'precipitation'))
  const result = solvePoint(system, input), output = saturatedLogSolubility(system, result, system.components[0].id)
  const solid = system.products.find(p => p.phase === 'solid'), aqueous = system.products.find(p => p.phase === 'aqueous')
  const ksp = 10 ** -solid.logBeta, expected = Math.sqrt(ksp) + 10 ** aqueous.logBeta * ksp
  assert.equal(output.reason, null)
  assert.ok(Math.abs(output.value - Math.log10(expected)) < 1e-8)
  assert.notEqual(output.linearValue, input.constraints[0].value)
  assert.ok(output.linearValue > result.concentrations[0])
  assert.equal(solubilityApplicability(system, system.components[0].id).contributors.length, 2)
  assert.equal(saturatedLogSolubility(system, { ...result }, system.components[0].id).reason, 'accepted-equilibrium-required')
})
test('solubility keeps unsaturated and cancelled grid samples unavailable with no linear fallback', async () => {
  const { system, definition } = await gridFixture('precipitation')
  definition.independentVariables[0] = { ...definition.independentVariables[0], mode: 'LTV', quantity: 'total', unit: 'mol/kg-H2O', range: { min: -10, max: -2 } }
  const grid = await calculateGrid(system, definition)
  const request = { type: 'saturated-log-solubility', componentId: system.components[0].id }
  const derived = deriveGridOutputs(system, grid, request)
  assert.ok(derived.ok)
  assert.ok(derived.series[0].points.some(p => p.value !== null))
  assert.ok(derived.series[0].points.some(p => p.reason === 'relevant-solid-not-saturated' && p.linearValue === null))
  const controller = new AbortController(); controller.abort()
  const cancelled = deriveGridOutputs(system, await calculateGrid(system, definition, 0, { signal: controller.signal }), request)
  assert.ok(cancelled.series[0].points.every(p => p.value === null))
  const noSolid = await gridFixture()
  assert.equal(solubilityApplicability(noSolid.system, noSolid.system.components[0].id).reason, 'one-relevant-pure-solid-required')
})
test('aqueous iron classification follows actual FeIII/FeII equation on pH-pe and pH-Eh samples', async () => {
  const { system, input } = await gridFixture('pH-redox')
  const proton = system.components.find(c => c.role === 'proton'), electron = system.components.find(c => c.role === 'electron'), iron = system.components.find(c => c.role === 'ordinary')
  const product = system.products.find(p => p.coefficients[system.components.indexOf(iron)] > 0), boundary = -product.logBeta
  for (const quantity of ['pe', 'Eh']) {
    const factor = quantity === 'pe' ? 1 : -1 / toSourceInput({ mode: 'LAV', quantity: 'Eh', unit: 'V-SHE' }, 1, 25).value
    let d = definitionFor(system, input)
    d = vary(d, proton.id, 'LAV', 0, 14, 3, 'pH')
    d = vary(d, electron.id, 'LAV', (boundary - 1) * factor, (boundary + 1) * factor, 3, quantity)
    const grid = await calculateGrid(system, d), output = classifyDissolvedFormGrid(system, grid, iron.id)
    assert.ok(output.ok); assert.equal(output.policy.pourbaixEnabled, false)
    output.points.forEach(p => {
      const pe = p.y / factor
      assert.equal(p.status, Math.abs(pe - boundary) < 1e-10 ? 'tie' : 'classified')
      if (p.status === 'classified') assert.equal(p.winner, pe > boundary ? product.id : iron.id)
      assert.equal(grid.outcomes[p.index].result.logActivities[system.components.indexOf(proton)], -p.x)
    })
    const controller = new AbortController(); controller.abort()
    const missing = classifyDissolvedFormGrid(system, await calculateGrid(system, d, 0, { signal: controller.signal }), iron.id)
    assert.ok(missing.points.every(p => p.status === 'unavailable' && p.winner === null))
  }
})
import { createPointInput } from '../src/solver/models.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { deriveOutputs } from '../src/calculations/outputs.js'
import { auditPointEquations, recomputeOutput } from '../src/analysis/pointTrace.js'
import { updateLaboratorySession } from '../src/session/laboratorySession.js'

test('zero inventory and failed points never become solubility values; 1D trace agrees at accepted saturation', async () => {
  const { system, input } = await prepareReference(references.cases.find(c => c.id === 'precipitation'))
  const zero = await createPointInput(system, { ...input, constraints: input.constraints.map(c => ({ ...c, value: 0 })) })
  assert.ok(zero.ok)
  assert.equal(saturatedLogSolubility(system, solvePoint(system, zero.input), system.components[0].id).value, null)
  let d = definitionFor(system, input)
  d = vary(d, system.components[0].id, 'LTV', -10, -2, 5)
  const prepared = await createSweepDefinition(system, d, 0)
  assert.ok(prepared.ok)
  const sweep = await runSweep(system, prepared.sweep), request = { type: 'saturated-log-solubility', componentId: system.components[0].id }
  const derived = deriveOutputs(system, sweep, request)
  assert.ok(derived.ok)
  for (const outcome of sweep.outcomes) {
    const point = derived.series[0].points[outcome.index]
    const audit = auditPointEquations(system, outcome.input, outcome.result)
    const independent = recomputeOutput(system, outcome.input, outcome.result, request, request.type, audit)
    if (point.value === null) assert.equal(independent, null)
    else assert.ok(Math.abs(point.value - independent) < 1e-8)
  }
  const exported = JSON.parse(JSON.stringify(derived))
  assert.deepEqual(exported.series[0].points, derived.series[0].points)
  assert.equal(derived.series[0].descriptor.quantity, 'saturated-component-solubility')
})
test('aqueous classification retains failed sampled coordinates without filling across them', async () => {
  const { system, definition } = await gridFixture()
  definition.independentVariables[0].range = { min: -400, max: 400 }
  const grid = await calculateGrid(system, definition), classified = classifyDissolvedFormGrid(system, grid, system.components[0].id)
  assert.ok(classified.ok)
  assert.equal(classified.points.length, grid.outcomes.length)
  assert.ok(grid.outcomes.some(p => p.status !== 'converged'))
  assert.ok(classified.points.some(p => p.status === 'classified'))
  grid.outcomes.forEach((p, i) => {
    assert.equal(classified.points[i].x, p.x)
    assert.equal(classified.points[i].y, p.y)
    if (p.status !== 'converged') assert.equal(classified.points[i].status, 'unavailable')
  })
})
test('compact-editor definition edits retain fixed/varied semantics and invalidate previous results', async () => {
  const { system, input } = await prepareReference(references.cases.find(c => c.id === 'precipitation'))
  const definition = definitionFor(system, input)
  const original = { revision: 0, chemicalSystem: { temperature: 25, pressure: 1 }, calculationDefinition: definition, calculationResult: {}, gridResult: {}, sweepResult: {}, lastPlot: { retained: true }, analysisState: { results: {} }, visualizationState: { plot: {} } }
  const changed = vary(definition, system.components[0].id, 'LTV', -8, -2, 7)
  changed.componentConditions[0].value = 0.002
  const edited = updateLaboratorySession(original, { type: 'calculation', definition: changed }, { getSources: () => [] })
  assert.equal(edited.revision, 1)
  assert.equal(edited.gridResult, null); assert.equal(edited.sweepResult, null)
  assert.equal(edited.lastPlot, original.lastPlot)
  assert.equal(edited.calculationDefinition.independentVariables[0].mode, 'LTV')
  assert.equal(toSourceInput(changed.independentVariables[0], -8, 25).value, 1e-8)
  assert.equal(edited.calculationDefinition.componentConditions[0].mode, 'T')
  assert.equal(edited.calculationDefinition.componentConditions[0].value, 0.002)
  assert.equal(original.calculationDefinition.independentVariables.length, 0)
  const view = updateLaboratorySession(edited, { type: 'plotView', patch: { type: 'saturated-log-solubility' } })
  assert.equal(view.revision, edited.revision)
  assert.equal(view.calculationDefinition, edited.calculationDefinition)
})
import { pointStatusText } from '../src/plots/statusText.js'
import { logarithmicOutput } from '../src/plots/presentation.js'
import { axisDisplayLabel } from '../src/plots/export.js'

test('solubility inspection explains unsaturation and identifies log-total coordinates', () => {
  assert.match(pointStatusText({ reason: 'relevant-solid-not-saturated', pointStatus: 'converged' }), /unsaturated\/absent/)
  assert.equal(logarithmicOutput('saturated-log-solubility'), true)
  assert.match(axisDisplayLabel({ componentId: 'Cl-', mode: 'LTV', quantity: 'total', unit: 'mol/kg-H2O' }, { 'Cl-': 'Cl-' }), /log₁₀/)
})
