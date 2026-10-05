import test from 'node:test'
import assert from 'node:assert/strict'
import { auditMixedCarbonate, totals } from './mixedCarbonateAudit.js'
import { componentBalanceTolerance } from '../src/solver/validationContract.js'

const audit = await auditMixedCarbonate()
test('full mixed Ca-carbonate-Mg candidate set remains typed unsupported; low-pH diagnostic states satisfy all solid inequalities', () => {
  assert.equal(audit.fullPreparation.ok, false)
  assert.ok(audit.fullPreparation.diagnostics.some(d => d.code === 'unsupported-solid-assemblage'))
  for (const point of audit.points.filter(p => p.pH <= 9.5)) {
    const candidate = point.attempts.find(a => a.candidate === 'CaCO3(cr)')
    assert.equal(candidate.status, 'all-listed-solid-inequalities-satisfied')
    assert.ok(candidate.maxMassActionError < 1e-10)
    candidate.balanceErrors.forEach((e, i) => assert.ok(Math.abs(e) <= componentBalanceTolerance(totals[i], 0.001)))
    assert.equal(candidate.solidAmount > 0, point.pH >= 5.5)
  }
})
test('no zero/one-solid assemblage is feasible at alkaline sampled mixed-system points despite numerical convergence', () => {
  for (const point of audit.points.filter(p => p.pH >= 10)) {
    assert.ok(point.attempts.every(a => a.status === 'rejected-omitted-solid-supersaturation'))
    assert.ok(point.attempts.every(a => a.supersaturated.length > 0))
  }
  const p12 = audit.points.find(p => p.pH === 12).attempts.find(a => a.candidate === 'CaCO3(cr)')
  assert.ok(p12.supersaturated.find(s => s.name === 'Mg(OH)2(cr)').logSaturation > 3)
})
test('independent calcite-brucite closed form establishes coexistence but rejects its own pH14 assemblage', () => {
  for (const witness of audit.analyticalWitnesses.filter(p => p.pH <= 13)) {
    assert.ok(Object.values(witness.solidAmounts).every(n => n > 0))
    assert.ok(witness.saturations.every(s => s.logSaturation <= 1e-8))
    for (const name of ['CaCO3(cr)', 'Mg(OH)2(cr)']) assert.ok(Math.abs(witness.saturations.find(s => s.name === name).logSaturation) < 1e-10)
    assert.ok(Math.abs(witness.dissolved[0] - witness.dissolved[1]) < 1e-12)
    assert.ok(Math.abs(witness.dissolved[0] + witness.solidAmounts['CaCO3(cr)'] - 0.1) < 1e-12)
    assert.ok(Math.abs(witness.dissolved[2] + witness.solidAmounts['Mg(OH)2(cr)'] - 0.001) < 1e-13)
    const tetramer = witness.amounts.find(s => s.name === 'Mg4(OH)4+4')
    assert.equal(tetramer.coefficients[2], 4)
  }
  const rejected = audit.analyticalWitnesses.find(p => p.pH === 14)
  assert.ok(rejected.saturations.find(s => s.name === 'Ca(OH)2(cr)').logSaturation > 0.28)
})
