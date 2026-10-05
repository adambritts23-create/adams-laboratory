/** Report production solver comparisons. Does not regenerate or modify Java golden data. */
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { references, prepareReference } from '../tests/pointHelpers.js'
import { solvePoint } from '../src/solver/point.js'
import { numericalValidationContract as contract } from '../src/solver/validationContract.js'

const goldenHash = createHash('sha256').update(fs.readFileSync('tests/fixtures/eq-diagr/references.json')).digest('hex')
const cases = [], sections = ['# Phase 5 numerical benchmark comparison', '', `Unchanged golden SHA-256: \`${goldenHash}\`.`, '', 'All concentration, total, dissolved and solid amounts use mol/kg H₂O. Logs are base 10. Relative difference is unavailable when the reference is zero; absolute comparison still applies. Full arrays, inputs, IDs and residuals are in phase5-benchmarks.json.', '']
for (const c of references.cases) {
  const { system, input } = await prepareReference(c), start = performance.now()
  const actual = solvePoint(system, input), elapsedMs = performance.now() - start
  if (!actual.ok) throw new Error(`${c.id}: ${JSON.stringify(actual)}`)
  const official = c.probes[1].values, comparisons = []
  const mappings = { concentrations: 'concentration', logActivities: 'logActivity', componentTotals: 'total', dissolvedComponentAmounts: 'dissolved', logActivityCoefficients: 'logActivityCoefficient' }
  for (const [quantity, key] of Object.entries(mappings)) actual[quantity].forEach((value, i) => {
    const expected = official[key][i], absoluteDifference = Math.abs(value - expected)
    const limit = quantity.startsWith('log') ? contract.comparisonLogActivityTolerance : contract.comparisonAbsoluteConcentrationTolerance + contract.comparisonRelativeConcentrationTolerance * Math.abs(expected)
    comparisons.push({ quantity, index: i, identity: quantity === 'componentTotals' || quantity === 'dissolvedComponentAmounts' ? c.components[i] : [...c.components, ...c.species][i], official: expected, actual: value, absoluteDifference, relativeDifference: expected === 0 ? null : absoluteDifference / Math.abs(expected), limit, pass: absoluteDifference <= limit })
  })
  if (comparisons.some(c => !c.pass)) throw new Error(`Regression failure in ${c.id}`)
  const repeatedStart = performance.now()
  for (let i = 0; i < 100; i++) if (!solvePoint(system, input).ok) throw new Error('Nondeterministic solve failure')
  const meanMs = (performance.now() - repeatedStart) / 100
  cases.push({ id: c.id, input, preparedSystemId: system.id, sourceInput: c.input, official, actual, comparisons, pass: true, firstSolveMs: elapsedMs, meanOf100SolveMs: meanMs })
  sections.push(`## ${c.id} — PASS`, '', 'Exact source input:', '', '```text', c.input.trim(), '```', '', `Iterations: ${actual.iterations}. Maximum absolute balance residual: ${Math.max(0, ...actual.residuals.componentBalance.filter(x => x !== null).map(Math.abs))}. Maximum absolute mass-action log residual: ${Math.max(0, ...actual.residuals.massActionLog.filter(x => x !== null).map(Math.abs))}.`, '', '| Quantity / identity | Official | Adam’s solver | Absolute difference | Relative difference | Limit | Pass |', '| --- | ---: | ---: | ---: | ---: | ---: | --- |')
  for (const row of comparisons) sections.push(`| ${row.quantity} / ${row.identity} | ${row.official.toPrecision(17)} | ${row.actual.toPrecision(17)} | ${row.absoluteDifference.toExponential(8)} | ${row.relativeDifference?.toExponential(8) ?? 'n/a (zero)'} | ${row.limit.toExponential(8)} | ${row.pass} |`)
  sections.push('', `Solids: ${JSON.stringify(actual.solids)}.`, '', `First solve: ${elapsedMs.toFixed(3)} ms; mean of 100 repeated fixed-input solves: ${meanMs.toFixed(3)} ms. These are local observations, not a performance guarantee or sweep implementation.`, '')
}
fs.writeFileSync('docs/phase5-benchmarks.json', JSON.stringify({ schemaVersion: 1, goldenSha256: goldenHash, contract, cases }, null, 2) + '\n')
fs.writeFileSync('docs/phase5-benchmarks.md', sections.join('\n'))
console.log(cases.map(c => ({ case: c.id, pass: c.pass, iterations: c.actual.iterations, maxAbsoluteConcentrationDifference: Math.max(...c.comparisons.filter(r => r.quantity === 'concentrations').map(r => r.absoluteDifference)), maxLogActivityDifference: Math.max(...c.comparisons.filter(r => r.quantity === 'logActivities').map(r => r.absoluteDifference)), meanMs: c.meanOf100SolveMs })))
