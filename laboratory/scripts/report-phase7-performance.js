// Verification-only; no fixture imports enter the application graph.
import fs from 'node:fs'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import assert from 'node:assert/strict'
import { references, prepareReference } from '../tests/pointHelpers.js'
import { definitionFor, vary } from '../tests/phase6Helpers.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { deriveOutputs } from '../src/calculations/outputs.js'
import { bounds } from '../src/plots/geometry.js'
import { figureSvg } from '../src/plots/export.js'

const measurements = []
for (const source of references.cases) {
  const { system, input } = await prepareReference(source)
  const constraint = input.constraints[source.id === 'redox' ? 1 : 0]
  const middle = constraint.kh === 1 ? Math.log10(constraint.value) : constraint.value
  for (const count of [51, 101, 501, 1001]) {
    const definition = await createSweepDefinition(system, vary(definitionFor(system, input), constraint.componentId, constraint.kh === 1 ? 'LTV' : 'LAV', middle - 0.5, middle + 0.5, count), 0)
    assert.ok(definition.ok)
    const sweep = await runSweep(system, definition.sweep)
    assert.equal(sweep.counts.converged, count)
    const start = performance.now(), derived = deriveOutputs(system, sweep, { type: 'log-concentration' })
    const transformationMs = performance.now() - start
    assert.ok(derived.ok)
    assert.ok(derived.series.every(s => s.points.length === count))
    const visible = derived.series.map(s => s.id), view = bounds(derived.series, derived.metadata.axis)
    const renderStart = performance.now()
    let svg
    for (let i = 0; i < 10; i++) svg = figureSvg(derived, visible, view)
    measurements.push({ case: source.id, points: count, series: visible.length, ...sweep.timing, transformationMs, svgGenerationMeanMs: (performance.now() - renderStart) / 10, svgBytes: Buffer.byteLength(svg), counts: sweep.counts })
  }
}
fs.writeFileSync(new URL('../docs/phase7-performance.json', import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), runtime: process.version, note: 'Local Node timings; SVG string generation is measured separately from solving and transformation. This is not browser paint/compositor latency. Ten renderer iterations; full sample sequences retained, no decimation. New coordinates use the existing validated sweep, not new Java oracle fixtures.', measurements }, null, 2) + '\n')
console.table(measurements.map(({ case: name, points, solvingMs, elapsedMs, transformationMs, svgGenerationMeanMs }) => ({ case: name, points, solvingMs, elapsedMs, transformationMs, svgGenerationMeanMs })))
