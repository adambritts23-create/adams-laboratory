// Verification-only: captured source records remain outside production imports.
import fs from 'node:fs'
import process from 'node:process'
import assert from 'node:assert/strict'
import { references, prepareReference } from '../tests/pointHelpers.js'
import { definitionFor, vary, reconstruct } from '../tests/phase6Helpers.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'

const measurements = []
for (const c of references.cases) {
  const started = performance.now()
  const { system, input } = await prepareReference(c)
  const preparationMs = performance.now() - started
  const index = c.id === 'redox' ? 1 : 0, constraint = input.constraints[index]
  const middle = constraint.kh === 1 ? Math.log10(constraint.value) : constraint.value
  for (const points of [51, 101, 501, 1001]) {
    const definitionStart = performance.now()
    const d = vary(definitionFor(system, input), constraint.componentId, constraint.kh === 1 ? 'LTV' : 'LAV', middle - 0.5, middle + 0.5, points)
    const s = await createSweepDefinition(system, d, 0); assert.ok(s.ok)
    const definitionMs = performance.now() - definitionStart
    const result = await runSweep(system, s.sweep)
    assert.equal(result.status, 'completed')
    result.outcomes.forEach(p => reconstruct(system, p.input, p.result))
    measurements.push({ case: c.id, points, preparationMs, definitionMs, ...result.timing, counts: result.counts,
      first: { coordinate: result.coordinates[0], concentrations: result.outcomes[0].result.concentrations },
      last: { coordinate: result.coordinates.at(-1), concentrations: result.outcomes.at(-1).result.concentrations } })
  }
}
fs.writeFileSync(new URL('../docs/phase6-performance.json', import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), runtime: process.version,
  note: 'Node local timings, not browser latency guarantees. Preparation is numerical preparation from retained fixture records, excluding full repository loading. One prepared system reused per case; default 20-point chunks. New sweep coordinates are invariant-checked, not new Java golden references.', measurements }, null, 2) + '\n')
console.table(measurements.map(({ case: name, points, preparationMs, solvingMs, inputPreparationMs, elapsedMs }) => ({ case: name, points, preparationMs, solvingMs, inputPreparationMs, elapsedMs })))
