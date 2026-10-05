import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRepository } from '../src/thermodynamics/repository.js'
import { magnesiumSolubilityExample } from '../src/data/solubilityExample.js'
import { runIndependentSolubility, defaultSolubilityComparison, comparisonOutputs, comparisonPackage, commitIndependentSolubility } from '../src/calculations/independentSolubility.js'
import { segments, inspectPoint } from '../src/plots/geometry.js'

const repository = createRepository(JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json', import.meta.url))))
const setup = () => {
  const session = magnesiumSolubilityExample(repository)
  session.calculationDefinition.solubilityComparison = defaultSolubilityComparison()
  return session
}

test('both independent hydroxide curves satisfy analytical saturation and exact aqueous weighting', async () => {
  const s = setup(), r = await runIndependentSolubility(repository, s.calculationDefinition, 0), output = comparisonOutputs(r)
  assert.equal(output.series.length, 2)
  const expectedContributors = [[['Mg 2+', 1], ['Mg4(OH)4+4', 4], ['MgOH+', 1]], [['Ca 2+', 1], ['CaOH+', 1]]]
  r.entries.forEach((e, k) => {
    assert.ok(!e.error)
    assert.equal(e.sweep.counts.failed, 0)
    assert.equal(e.system.products.filter(p => p.phase === 'solid').length, 1)
    assert.ok(!e.system.components.some(c => c.role === 'electron'))
    assert.deepEqual(e.scope.contributors.map(c => [c.name, c.coefficient]), expectedContributors[k])
    const solid = e.system.products.find(p => p.phase === 'solid')
    assert.deepEqual(solid.coefficients, [1, -2, 2])
    let available = 0
    output.series[k].points.forEach(p => {
      // Independent closed-form saturation: log a_M = -b_s - 2 pH.
      // Reconstruct every aqueous mass-action term without solver-returned activities.
      const logMetal = -solid.logBeta - 2 * p.x
      const terms = e.system.products.filter(p => p.phase === 'aqueous' && p.coefficients[0] > 0)
      const total = 10 ** logMetal + terms.reduce((n, a) => n + a.coefficients[0] * 10 ** (a.logBeta + a.coefficients[0] * logMetal - a.coefficients[1] * p.x), 0)
      if (total > e.total) { assert.equal(p.value, null); assert.equal(p.reason, 'relevant-solid-not-saturated') }
      else {
        available++
        assert.ok(Math.abs(p.value - Math.log10(total)) < 1e-8)
        assert.ok(Math.abs(p.trace.contributors.reduce((n, c) => n + c.weightedMolality, 0) - p.linearValue) < 1e-15)
        assert.ok(Math.abs(p.trace.weightedDissolvedTotal + p.trace.saturation.amount - e.total) < 1e-10)
        assert.equal(p.trace.logSolubility, p.value)
      }
      p.trace.contributors.forEach(c => assert.equal(c.weightedMolality, c.coefficient * c.molality))
    })
    assert.ok(available > 1)
  })
  assert.deepEqual(output.series[0].points.map(p => p.x), output.series[1].points.map(p => p.x))
})

test('changing or removing one independent inventory cannot change the other curve', async () => {
  const s = setup(), both = await runIndependentSolubility(repository, s.calculationDefinition, 0)
  s.calculationDefinition.solubilityComparison.pairs[0].total = 1e-12
  const changed = await runIndependentSolubility(repository, s.calculationDefinition, 0)
  assert.deepEqual(changed.entries[1].sweep.outcomes.map(o => o.result.concentrations), both.entries[1].sweep.outcomes.map(o => o.result.concentrations))
  assert.ok(comparisonOutputs(changed).series[0].points.every(p => p.value === null))
  s.calculationDefinition.solubilityComparison.pairs.shift()
  const alone = await runIndependentSolubility(repository, s.calculationDefinition, 0)
  assert.deepEqual(comparisonOutputs(alone).series[0].points, comparisonOutputs(both).series[1].points)
})

test('failed, unsupported, cancelled and stale comparison samples remain gaps with traceable reasons', async () => {
  const s = setup()
  s.calculationDefinition.solubilityComparison = { ...s.calculationDefinition.solubilityComparison, min: -400, max: 400, points: 3 }
  const failed = await runIndependentSolubility(repository, s.calculationDefinition, 0)
  assert.ok(failed.entries.every(e => e.sweep.counts.failed > 0))
  comparisonOutputs(failed).series.forEach(series => {
    assert.equal(series.points[0].value, null)
    assert.equal(series.points[2].value, null)
    assert.ok(segments(series.points).every(run => run.every(p => p.value !== null)))
  })
  const controller = new AbortController(); controller.abort()
  const cancelled = await runIndependentSolubility(repository, s.calculationDefinition, 0, { signal: controller.signal })
  assert.ok(comparisonOutputs(cancelled).series.every(s => s.points.every(p => p.value === null)))
  s.calculationDefinition.pressure.value = 2
  const unsupported = await runIndependentSolubility(repository, s.calculationDefinition, 0)
  assert.ok(unsupported.entries.every(e => e.error))
  assert.ok(comparisonOutputs(unsupported).series.every(s => s.points.every(p => p.value === null && p.trace.unavailableReason)))
  assert.ok(comparisonOutputs(failed, 1).series.every(s => s.points.every(p => p.value === null && p.reason === 'stale-independent-comparison')))
})

test('comparison commits and exact exports preserve identities, traces, raw precision and stale status', async () => {
  const s = setup(), result = await runIndependentSolubility(repository, s.calculationDefinition, s.revision)
  assert.equal(commitIndependentSolubility(s, { ...result }), s)
  const newer = { ...s, revision: 1 }
  assert.equal(commitIndependentSolubility(newer, result), newer)
  assert.equal(commitIndependentSolubility(s, result).lastPlot.comparison, result)
  const d = comparisonOutputs(result), original = JSON.stringify(result)
  const inspection = inspectPoint(d, d.series[0].points.length - 1)
  assert.equal(inspection.values.length, 2)
  assert.ok(inspection.values.every(p => p.trace.component && p.trace.solid && p.trace.inputId))
  const exported = JSON.parse(comparisonPackage(result, 0, [d.series[1].id], {}))
  assert.deepEqual(exported.derived.series, d.series)
  assert.deepEqual(exported.comparison, JSON.parse(original))
  const stale = JSON.parse(comparisonPackage(result, 1, [], {}))
  assert.equal(stale.stale, true)
  assert.deepEqual(stale.comparison, exported.comparison)
  assert.ok(stale.derived.series.every(s => s.points.every(p => p.value === null)))
  assert.equal(JSON.stringify(result), original)
})
