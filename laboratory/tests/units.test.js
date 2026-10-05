import test from 'node:test'
import assert from 'node:assert/strict'
import { convertAmount } from '../src/calculations/units.js'
test('molarity prefixes scale within their own family and round trip without a physical conversion',()=>{
  for(const [unit,expected] of [['M',1],['mM',1000],['µM',1e6],['nM',1e9]]){
    const scaled=convertAmount(1,'M',unit)
    assert.equal(scaled.value,expected)
    assert.ok(Math.abs(convertAmount(scaled.value,unit,'M').value-1)<1e-15)
    assert.equal(scaled.canonical.unit,'mol/L-solution')
  }
  assert.equal(convertAmount(0.123,'mol/kg-H2O','mol/kg-H2O').value,0.123)
  assert.equal(convertAmount(2,'M','mol/L-solution').value,2)
})
test('molality never falls back to one-to-one molarity; malformed and overflowing values fail',()=>{
  for(const unit of ['M','mM','µM','nM'])for(const [from,to] of [['mol/kg-H2O',unit],[unit,'mol/kg-H2O']]){
    const r=convertAmount(1,from,to);assert.equal(r.ok,false);assert.equal(r.value,null);assert.equal(r.code,'physical-conversion-unavailable')
  }
  for(const [v,from,to] of [[Infinity,'M','mM'],[1,'unknown','M'],[1e308,'M','nM']])assert.equal(convertAmount(v,from,to).ok,false)
})
