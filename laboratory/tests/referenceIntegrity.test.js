import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { parseDb } from '../src/thermodynamics/importers/spana/binary.js'
import { componentBalanceTolerance, numericalValidationContract as contract } from '../src/solver/validationContract.js'

const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/eq-diagr/references.json', import.meta.url)))
const hash = b => createHash('sha256').update(b).digest('hex')
test('reference inputs retain exact raw source constants and coefficient order', () => {
  assert.equal(fixture.cases.length, 5)
  assert.equal(fixture.sourceRevision, 'c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7')
  assert.equal(fixture.probeSourceSha256, hash(fs.readFileSync(new URL('../scripts/ReferenceProbe.java', import.meta.url))))
  for (const c of fixture.cases) {
    assert.equal(hash(c.input), c.inputSha256)
    for (const record of c.sourceRecords) {
      const raw = parseDb(Buffer.from(record.provenance.original.raw.rawBase64, 'base64')).records[0]
      assert.equal(raw.name, record.name); assert.equal(raw.logK, record.logK)
      assert.deepEqual(Object.fromEntries(raw.components.filter(x => x.coefficient !== 0).map(x => [x.name, x.coefficient])), record.coefficients)
      assert.ok(c.input.includes(`${record.name}, ${record.logK}, ${c.components.map(name => record.coefficients[name] ?? 0).join(', ')}`))
    }
  }
})
test('official Java captures successful finite outputs at both requested tolerances', () => {
  for (const c of fixture.cases) {
    assert.match(c.stdout, /Calculated 1 points/)
    assert.ok(Object.keys(c.outputs).some(n => n.endsWith('.csv')))
    assert.equal(c.assumptions.concentrationUnit, 'mol/kg-H2O')
    for (const probe of c.probes) {
      assert.deepEqual(JSON.parse(probe.raw), probe.values)
      assert.equal(probe.values.errFlags, 0)
      assert.equal(probe.values.concentration.length, c.components.length + c.species.length)
      for (const key of ['concentration', 'logActivity', 'total', 'dissolved']) assert.ok(probe.values[key].every(Number.isFinite))
      assert.ok(probe.values.concentration.every(x => x >= 0))
    }
    const first = c.probes[0].values, tighter = c.probes[1].values
    for (let i = 0; i < first.logActivity.length; i++) assert.ok(Math.abs(first.logActivity[i] - tighter.logActivity[i]) <= contract.comparisonLogActivityTolerance)
  }
})
test('reference outputs independently satisfy source mass action and specified component balances', () => {
  for (const c of fixture.cases) {
    const values = c.probes[1].values
    for (let j = 0; j < c.sourceRecords.length; j++) {
      const r = c.sourceRecords[j]
      const formedLogActivity = r.logK + c.components.reduce((sum, name, i) => sum + (r.coefficients[name] ?? 0) * values.logActivity[i], 0)
      assert.ok(Math.abs(formedLogActivity - values.logActivity[c.components.length + j]) <= contract.massActionLogResidualTolerance)
    }
    for (let i = 0; i < c.components.length; i++) {
      if (!c.conditions[i].startsWith('T,')) continue
      const total = Number(c.conditions[i].slice(2))
      const reconstructed = values.concentration[i] + c.sourceRecords.reduce((sum, r, j) => sum + (r.coefficients[c.components[i]] ?? 0) * values.concentration[c.components.length + j], 0)
      const min = Math.min(...c.conditions.filter(x => x.startsWith('T,')).map(x => Math.abs(Number(x.slice(2)))).filter(x => x > 0))
      assert.ok(Math.abs(reconstructed - total) <= componentBalanceTolerance(total, min), `${c.id} component ${i}`)
    }
  }
  const solid = fixture.cases.find(c => c.id === 'precipitation').probes[1].values
  assert.ok(solid.concentration.at(-1) > 0)
  assert.ok(Math.abs(solid.logActivity.at(-1)) <= contract.saturatedSolidLogActivityTolerance)
})
