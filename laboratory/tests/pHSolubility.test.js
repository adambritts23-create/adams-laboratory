import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRepository } from '../src/thermodynamics/repository.js'
import { magnesiumSolubilityExample } from '../src/data/solubilityExample.js'
import { prepareSessionPoint } from '../src/solver/prepareSession.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { deriveOutputs } from '../src/calculations/outputs.js'
import { solubilityApplicability } from '../src/calculations/solubility.js'

const repository = createRepository(JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json', import.meta.url))))
async function calculate(session, options) {
  const prepared = await prepareSessionPoint(session, repository, { sweep: true })
  assert.ok(prepared.ok, JSON.stringify(prepared.diagnostics))
  const { system } = prepared
  const definition = await createSweepDefinition(system, session.calculationDefinition, session.revision)
  assert.ok(definition.ok, JSON.stringify(definition.diagnostics))
  const sweep = await runSweep(system, definition.sweep, options)
  const output = deriveOutputs(system, sweep, session.visualizationState.plot)
  assert.ok(output.ok)
  return { system, sweep, output }
}

test('bundled Mg hydroxide pH solubility agrees with independent analytical saturation and weighted aqueous sum', async () => {
  const session = magnesiumSolubilityExample(repository)
  const { system, sweep, output } = await calculate(session)
  assert.equal(sweep.counts.converged, 61)
  assert.ok(!system.components.some(c => c.role === 'electron'))
  const mg = system.components.findIndex(c => c.name === 'Mg 2+')
  const scope = solubilityApplicability(system, system.components[mg].id)
  assert.deepEqual(scope.contributors.map(c => [c.name, c.coefficient]).sort(), [['Mg 2+', 1], ['Mg4(OH)4+4', 4], ['MgOH+', 1]].sort())
  const solid = system.products.find(p => p.phase === 'solid')
  assert.equal(solid.name, 'Mg(OH)2(cr)')
  const hydroxide = system.products.find(p => p.name === 'MgOH+')
  const tetramer = system.products.find(p => p.name === 'Mg4(OH)4+4')
  const before = JSON.stringify(sweep)
  let available = 0, absent = 0
  for (const [i, point] of output.series[0].points.entries()) {
    // Independent closed form from the stored reactions, with log(a_H2O)=0:
    // 0 = b_s + log(a_Mg) + 2 pH. No solver-derived free ion enters this oracle.
    const logMg = -solid.logBeta - 2 * point.x
    const expected = 10 ** logMg + 10 ** (hydroxide.logBeta + logMg + point.x) + 4 * 10 ** (tetramer.logBeta + 4 * logMg + 4 * point.x)
    if (expected > 0.001) {
      absent++
      assert.equal(point.value, null)
      assert.equal(point.reason, 'relevant-solid-not-saturated')
    } else {
      available++
      assert.ok(Math.abs(point.value - Math.log10(expected)) < 1e-8)
      const r = sweep.outcomes[i].result
      const sum = r.concentrations[mg] + system.products.reduce((v, p, j) => v + (p.phase === 'aqueous' ? p.coefficients[mg] * r.concentrations[system.components.length + j] : 0), 0)
      assert.ok(Math.abs(point.linearValue - sum) < 1e-15)
      assert.ok(point.linearValue > r.concentrations[mg])
      assert.ok(Math.abs(sum + r.solids[0].amount - 0.001) < 1e-10)
    }
  }
  assert.ok(available > 0 && absent > 0)
  assert.equal(JSON.stringify(sweep), before)
  assert.deepEqual(JSON.parse(JSON.stringify(output)).series[0].points, output.series[0].points)
})

test('pH solubility example preserves unsaturated and failed sample gaps', async () => {
  const session = magnesiumSolubilityExample(repository)
  session.calculationDefinition.componentConditions.find(c => c.quantity === 'total').value = 1e-10
  const unsaturated = await calculate(session)
  assert.ok(unsaturated.output.series[0].points.every(p => p.value === null && p.reason === 'relevant-solid-not-saturated'))
  session.calculationDefinition.independentVariables[0] = { ...session.calculationDefinition.independentVariables[0], range: { min: -400, max: 400 }, points: 3 }
  const failed = await calculate(session)
  assert.ok(failed.sweep.counts.failed > 0)
  failed.sweep.outcomes.forEach((p, i) => { if (p.status !== 'converged') assert.equal(failed.output.series[0].points[i].value, null) })
})

test('example rejects missing source records instead of supplying constants or substitute phases', () => {
  assert.throws(() => magnesiumSolubilityExample({ getComponents: () => [], getSpecies: () => [] }), /requires unambiguous/)
})
