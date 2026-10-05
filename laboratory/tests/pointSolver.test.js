import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { references, prepareReference, role } from './pointHelpers.js'
import { solvePoint } from '../src/solver/point.js'
import { prepareChemicalSystem, createPointInput } from '../src/solver/models.js'
import { numericalValidationContract as contract } from '../src/solver/validationContract.js'

test('official golden fixture remains unchanged from Phase 4', () => {
  assert.equal(createHash('sha256').update(fs.readFileSync(new URL('./fixtures/eq-diagr/references.json', import.meta.url))).digest('hex'), 'aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960')
})
for (const c of references.cases) test(`independent solver quantitatively reproduces official ${c.id}`, async () => {
  const { system, input } = await prepareReference(c)
  const actual = solvePoint(system, input), expected = c.probes[1].values
  assert.equal(actual.ok, true, JSON.stringify(actual))
  const mappings = { concentrations: 'concentration', logActivities: 'logActivity', componentTotals: 'total', dissolvedComponentAmounts: 'dissolved', logActivityCoefficients: 'logActivityCoefficient' }
  for (const [key, target] of Object.entries(mappings)) {
    assert.equal(actual[key].length, expected[target].length)
    actual[key].forEach((value, i) => {
      const limit = key === 'logActivities' || key === 'logActivityCoefficients' ? contract.comparisonLogActivityTolerance : contract.comparisonAbsoluteConcentrationTolerance + contract.comparisonRelativeConcentrationTolerance * Math.abs(expected[target][i])
      assert.ok(Math.abs(value - expected[target][i]) <= limit, `${c.id}.${key}[${i}]: ${value} vs ${expected[target][i]} limit ${limit}`)
    })
  }
  actual.residuals.componentBalance.forEach((r, i) => { if (r !== null) assert.ok(Math.abs(r) <= actual.residuals.componentBalanceLimits[i]) })
  actual.residuals.massActionLog.forEach(r => { if (r !== null) assert.ok(Math.abs(r) <= contract.massActionLogResidualTolerance) })
  input.constraints.forEach((constraint, i) => { if (constraint.kh === 2) assert.equal(actual.logActivities[i], constraint.value) })
  if (c.id === 'precipitation') { assert.equal(actual.solids[0].status, 'present'); assert.ok(Math.abs(actual.solids[0].logSaturation) <= contract.saturatedSolidLogActivityTolerance) }
  if (c.id === 'redox') assert.equal(actual.freeComponentConcentrations[1], 0)
  assert.deepEqual(solvePoint(system, input), actual)
  assert.ok(Object.isFrozen(system.products[0].coefficients)); assert.ok(Object.isFrozen(actual.residuals.componentBalance))
})

// Synthetic coefficients below are mathematical fixtures, never database records.
async function synthetic(names = ['A'], products = [], constraints = [{ kh: 1, value: 0.001 }], overrides = {}) {
  const prepared = await prepareChemicalSystem({ components: names.map(name => ({ id: name, name, role: role(name) })), products: products.map((p, i) => ({ id: `product:${i}`, name: `P${i}`, phase: 'aqueous', sourceRecord: { kind: 'synthetic-mathematical-test' }, ...p })), basisStatus: 'explicit-direct', temperatureC: 25, pressureBar: 1, unit: 'mol/kg-H2O', sourceIdentity: { kind: 'synthetic-mathematical-test' }, ...overrides })
  if (!prepared.ok) return prepared
  const point = await createPointInput(prepared.system, { revision: 0, unit: 'mol/kg-H2O', temperatureC: 25, pressureBar: 1, activityModel: 'ideal', constraints: constraints.map((c, i) => ({ componentId: names[i], ...c })) })
  return point.ok ? { ok: true, system: prepared.system, input: point.input } : point
}
test('structural regression: zero residual cannot accept an unconstrained electron activity', async () => {
  for (const names of [['e-'], ['A', 'e-']]) {
    const p = await synthetic(names, [], names.map(name => ({ kh: 1, value: name === 'e-' ? 0 : 1e-7 })))
    const r = solvePoint(p.system, p.input)
    assert.equal(r.ok, false)
    assert.equal(r.diagnostics[0].code, 'singular-or-ill-conditioned')
    assert.equal(r.result, null)
    assert.equal(r.logActivities, undefined)
  }
  // Fixed activity supplies the missing constraint; a free ordinary component
  // supplies its own identity contribution. Neither requires product rows.
  const fixed = await synthetic(['e-'], [], [{ kh: 2, value: -7 }])
  assert.equal(solvePoint(fixed.system, fixed.input).ok, true)
  const ordinary = await synthetic(['A'], [], [{ kh: 1, value: 1e-7 }])
  assert.equal(solvePoint(ordinary.system, ordinary.input).ok, true)
})

test('free components, mixed inputs and extremely small representable activity', async () => {
  const p = await synthetic(['A', 'B'], [], [{ kh: 1, value: 1e-250 }, { kh: 2, value: -200 }])
  const r = solvePoint(p.system, p.input)
  assert.ok(r.ok); assert.equal(r.concentrations[0], 1e-250); assert.equal(r.concentrations[1], 1e-200)
  assert.equal(r.componentTotals[1], 1e-200)
})
test('analytically checkable formation, signed proton balance, and mixed constraints', async () => {
  const p = await synthetic(['A'], [{ coefficients: [1], logBeta: 0 }], [{ kh: 1, value: 0.002 }])
  const r = solvePoint(p.system, p.input)
  assert.ok(r.ok); assert.ok(Math.abs(r.concentrations[0] - 0.001) < 1e-15)
  const acid = await synthetic(['H+'], [{ coefficients: [-1], logBeta: -14 }], [{ kh: 1, value: 0 }])
  const a = solvePoint(acid.system, acid.input)
  assert.ok(a.ok, JSON.stringify(a)); assert.ok(Math.abs(a.logActivities[0] + 7) < 1e-10)
  const mixed = await synthetic(['A', 'B'], [{ coefficients: [1, 1], logBeta: 3 }], [{ kh: 1, value: 0.002 }, { kh: 2, value: -3 }])
  const m = solvePoint(mixed.system, mixed.input)
  assert.ok(m.ok); assert.ok(Math.abs(m.concentrations[0] - 0.001) < 1e-15); assert.equal(m.logActivities[1], -3)
})
test('solid absent, saturated, and inconsistent fixed-activity reservoirs', async () => {
  const product = { coefficients: [1], logBeta: 3, phase: 'solid' }
  for (const [total, status] of [[0.0001, 'absent'], [0.01, 'present']]) {
    const p = await synthetic(['A'], [product], [{ kh: 1, value: total }]); const r = solvePoint(p.system, p.input)
    assert.ok(r.ok, JSON.stringify(r)); assert.equal(r.solids[0].status, status)
    assert.ok(Math.abs(r.componentTotals[0] - total) < 1e-14)
  }
  const fixed = await synthetic(['A'], [product], [{ kh: 2, value: -2 }])
  assert.equal(solvePoint(fixed.system, fixed.input).ok, false)
  const saturated = await synthetic(['A'], [product], [{ kh: 2, value: -3 }])
  assert.equal(solvePoint(saturated.system, saturated.input).diagnostics[0].code, 'underdetermined-solid-inventory')
})
test('preparation diagnoses unsupported basis, missing constants, duplicate identities and units', async () => {
  assert.equal((await synthetic(['A', 'A'])).diagnostics[0].code, 'duplicate-component')
  assert.equal((await synthetic(['A'], [{ coefficients: [1], logBeta: null }])).ok, false)
  assert.equal((await synthetic(['A'], [], undefined, { unit: 'mol/L-solution' })).ok, false)
  assert.equal((await synthetic(['A'], [], undefined, { basisStatus: 'requires-redox-closure' })).ok, false)
  assert.equal((await synthetic(['A'], [{ coefficients: [1, 2], logBeta: 1 }])).ok, false)
  assert.equal((await synthetic(['A'], [{ coefficients: [1], logBeta: 1, phase: 'gas' }])).ok, false)
  assert.equal((await synthetic(['A'], [{ coefficients: [1], logBeta: 1, name: 'A' }])).ok, false)
  assert.equal((await synthetic(['A'], [], [])).ok, false)
  assert.equal((await synthetic(['H2O'], [], [{ kh: 1, value: 55.5 }])).ok, false)
})
test('failure diagnostics for nonconvergence, range errors, singularity and incompatible inputs', async () => {
  const p = await synthetic(['A'], [{ coefficients: [1], logBeta: 1 }])
  assert.equal(solvePoint(p.system, p.input, { maxIterations: 0 }).diagnostics[0].code, 'numerical-nonconvergence')
  for (const value of [-400, 400]) {
    const fixed = await synthetic(['A'], [], [{ kh: 2, value }]); const r = solvePoint(fixed.system, fixed.input)
    if(value<0){assert.equal(r.ok,true);assert.equal(r.logConcentrations[0],value);assert.equal(r.linearConcentrationStatus[0],'positive-underflow');assert.equal(r.logActivities[0],value)}
    else {assert.equal(r.ok,false);assert.equal(r.diagnostics[0].code,'overflow')}
  }
  const singular = await synthetic(['e-'], [], [{ kh: 1, value: 1 }])
  assert.equal(solvePoint(singular.system, singular.input).diagnostics[0].code, 'singular-or-ill-conditioned')
  assert.equal(solvePoint(structuredClone(p.system), p.input).ok, false)
  assert.equal((await createPointInput(p.system, { ...p.input, unit: 'mol/L-solution' })).ok, false)
  assert.equal((await createPointInput(p.system, { ...p.input, activityModel: 'SIT' })).ok, false)
})

test('signed electron total remains an algebraic balance with zero electron concentration', async () => {
  const p = await synthetic(['Fe 2+', 'e-'], [{ coefficients: [1, -1], logBeta: 0 }], [{ kh: 2, value: -3 }, { kh: 1, value: -2e-4 }])
  const r = solvePoint(p.system, p.input)
  assert.ok(r.ok, JSON.stringify(r)); assert.equal(r.freeComponentConcentrations[1], 0)
  assert.ok(Math.abs(r.concentrations[2] - 2e-4) < 1e-15)
  assert.ok(Math.abs(r.componentTotals[1] + 2e-4) < 1e-15)
})

test('preparation rejects multiple solids, false special roles and impossible positive-variable boundaries', async () => {
  const solids = [{ coefficients: [1], logBeta: 1, phase: 'solid' }, { coefficients: [1], logBeta: 2, phase: 'solid' }]
  assert.equal((await synthetic(['A'], solids)).ok, false)
  assert.equal((await synthetic(['A'], [], undefined, { components: [{ id: 'water', name: 'H2O', role: 'ordinary' }] })).ok, false)
  for (const value of [-1, 0]) {
    const p = await synthetic(['A'], [], [{ kh: 1, value }])
    assert.equal(solvePoint(p.system, p.input).diagnostics[0].code, 'inconsistent-or-boundary-total')
  }
})
