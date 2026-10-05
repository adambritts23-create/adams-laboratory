import test from 'node:test'
import assert from 'node:assert/strict'
import { uraniumBasisAudit } from '../scripts/validation/generalBasisAudit.js'
import { numericalValidationContract } from '../src/solver/validationContract.js'

test('uranium dual-basis grid accepts every reference point with unchanged inventory criteria', async () => {
 const { summary } = await uraniumBasisAudit()
 for (const key of ['UVI', 'UV']) {
  const s = summary[key]
  assert.equal(s.points, 1025)
  assert.equal(s.failed.length,0)
  assert.equal(s.labelDisagreements, 0); assert.equal(s.solidDisagreements, 0)
  assert.ok(s.maxReferenceAmountDifference < numericalValidationContract.comparisonAbsoluteConcentrationTolerance)
  assert.equal(s.maxImplicitWaterDifference, 0)
  assert.equal(s.counts['UH3(cr)'],244)
 }
 assert.equal(summary.crossBasis.labelDisagreements, 0)
 assert.ok(summary.crossBasis.maxAmountDifference < numericalValidationContract.comparisonAbsoluteConcentrationTolerance)
})
