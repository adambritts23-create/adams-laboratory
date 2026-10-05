// Synthetic structural counterexample, not thermodynamic data or a Java reference.
// Permanent standalone reproduction: now passes only when the defect is rejected.
import assert from 'node:assert/strict'
import { prepareChemicalSystem, createPointInput } from '../src/solver/models.js'
import { solvePoint } from '../src/solver/point.js'

const prepared = await prepareChemicalSystem({
  components: [{ id: 'e-', name: 'e-', role: 'electron' }],
  products: [],
  basisStatus: 'explicit-direct',
  temperatureC: 25, pressureBar: 1, unit: 'mol/kg-H2O',
  sourceIdentity: { kind: 'synthetic-structural-audit', description: 'No thermodynamic constants or products' },
})
assert.equal(prepared.ok, true)
const point = await createPointInput(prepared.system, {
  constraints: [{ componentId: 'e-', kh: 1, value: 0 }],
  revision: 0, temperatureC: 25, pressureBar: 1,
  unit: 'mol/kg-H2O', activityModel: 'ideal',
})
assert.equal(point.ok, true)
const result = solvePoint(prepared.system, point.input)
console.log(JSON.stringify(result, null, 2))

// Independently reconstructed equation: electron concentration is suppressed,
// there are no products, and the imposed total is zero. Thus r(x) = 0 - 0 = 0
// for EVERY electron log activity x, and dr/dx = 0. No unique x is determined.
// Returning the initial guess as a scientifically accepted activity is invalid.
assert.equal(result.ok, false,
  'Underdetermined electron activity must be rejected; zero balance residual alone cannot establish a determined equilibrium point.')
assert.equal(result.diagnostics[0].code, 'singular-or-ill-conditioned')
