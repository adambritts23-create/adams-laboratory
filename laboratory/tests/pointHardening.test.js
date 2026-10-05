import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareChemicalSystem, createPointInput } from '../src/solver/models.js'
import { solvePoint } from '../src/solver/point.js'
import { role } from './pointHelpers.js'
import { reconstruct } from './phase6Helpers.js'

// Synthetic mathematical constants: never source data or official reference values.
async function fixture(name, products, total) {
  const p = await prepareChemicalSystem({ components: [{ id: name, name, role: role(name) }], products: products.map((p, i) => ({ id: `P${i}`, name: `P${i}`, phase: 'aqueous', sourceRecord: { kind: 'synthetic-mathematical-test' }, ...p })), basisStatus: 'explicit-direct', temperatureC: 25, pressureBar: 1, unit: 'mol/kg-H2O', sourceIdentity: { kind: 'synthetic-mathematical-test' } })
  assert.ok(p.ok)
  const i = await createPointInput(p.system, { constraints: [{ componentId: name, kh: 1, value: total }], revision: 0, unit: p.system.unit, temperatureC: 25, pressureBar: 1, activityModel: 'ideal' })
  assert.ok(i.ok); return { system: p.system, input: i.input }
}
test('analytical dilution and representable trace amounts over 297 orders of magnitude', async () => {
  for (const exponent of [-3, -9, -30, -100, -250, -300]) {
    const p = await fixture('A', [{ logBeta: 0, coefficients: [1] }], 10 ** exponent)
    const r = solvePoint(p.system, p.input); reconstruct(p.system, p.input, r)
    assert.ok(Math.abs(r.concentrations[0] / (10 ** exponent / 2) - 1) < 1e-12)
    assert.deepEqual(solvePoint(p.system, p.input), r)
  }
})
test('analytical single-solid onset below, at, and just above saturation', async () => {
  for (const offset of [-1e-8, 0, 1e-8]) {
    const total = 1e-3 * (1 + offset)
    const p = await fixture('A', [{ phase: 'solid', logBeta: 3, coefficients: [1] }], total)
    const r = solvePoint(p.system, p.input); reconstruct(p.system, p.input, r)
    assert.equal(r.solids[0].status, offset < 0 ? 'absent' : offset > 0 ? 'present' : 'saturated-zero-amount')
    assert.ok(Math.abs(r.solids[0].amount - Math.max(0, total - 1e-3)) < 1e-15)
  }
})
test('signed proton balances independently match the stable quadratic root', async () => {
  for (const total of [-1e-3, -1e-9, 0, 1e-9, 1e-3]) {
    const p = await fixture('H+', [{ logBeta: -14, coefficients: [-1] }], total)
    const r = solvePoint(p.system, p.input); reconstruct(p.system, p.input, r)
    const root = Math.sqrt(total * total + 4e-14)
    const expected = total >= 0 ? (total + root) / 2 : 2e-14 / (root - total)
    assert.ok(Math.abs(r.concentrations[0] / expected - 1) < 1e-11)
  }
})
test('awkward initial estimate thirty decades from the analytical free concentration', async () => {
  const p = await fixture('A', [{ logBeta: 30, coefficients: [1] }], 1e-3)
  const r = solvePoint(p.system, p.input); reconstruct(p.system, p.input, r)
  assert.ok(Math.abs(r.concentrations[0] / (1e-3 / (1 + 1e30)) - 1) < 1e-11)
  assert.ok(r.iterations > 30)
})
test('incomplete boundaries reject, while extreme formation constants retain positive logs and exact inventory', async () => {
  for (const spec of [null, {}, { components: [null], products: [null] }]) assert.equal((await prepareChemicalSystem(spec)).ok, false)
  for (const logBeta of [-400, 400]) {
    const p = await fixture('A', [{ logBeta, coefficients: [1] }], 1e-3)
    const r = solvePoint(p.system, p.input)
    assert.equal(r.ok, true)
    assert.ok(Math.abs(r.componentTotals[0]-1e-3)<1e-14)
    assert.equal(r.linearConcentrationStatus[logBeta<0?1:0],'positive-underflow')
    assert.equal(r.logConcentrations[1],r.logActivities[0]+logBeta)
    assert.ok(r.residuals.massActionLog.every(v=>v===null||Math.abs(v)<=1e-10))
  }
})
