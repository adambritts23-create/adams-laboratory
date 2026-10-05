import test from 'node:test'
import assert from 'node:assert/strict'
import { formatNumber } from '../src/plots/formatNumber.js'

test('display numbers remove binary tails and insignificant zeros without changing source values',()=>{
  const values=[13.719999999999999,1.0000000000000002,0,-0,0.001,1.234567890123e-12,1e12]
  const exact=JSON.stringify(values)
  assert.deepEqual(values.map(formatNumber),['13.72','1','0','0','0.001','1.23456789e-12','1e12'])
  assert.equal(JSON.stringify(values),exact)
  assert.equal(formatNumber(null),'Unavailable')
  assert.equal(formatNumber(NaN),'Unavailable')
  assert.equal(formatNumber(Infinity),'Unavailable')
  assert.equal(formatNumber(Number.MIN_VALUE),'5e-324')
})
