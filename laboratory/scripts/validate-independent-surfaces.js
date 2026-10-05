import fs from 'node:fs'
import { gzipSync } from 'node:zlib'
import { surfaceCase, validateSurfaceCase } from './validation/independentSurfaces.js'

// Offline evidence, never imported by the browser. Regeneration reruns the point solver and all slices/orders.
for (const mixed of [false, true]) {
  const evidence = await validateSurfaceCase(await surfaceCase(mixed))
  const name = mixed ? 'mixed' : 'carbonate'
  fs.writeFileSync(new URL(`../docs/independent-surface-${name}.json.gz`,import.meta.url),gzipSync(JSON.stringify(evidence)))
  console.log(name, evidence.grid.counts, evidence.surface.counts,
    'unresolved phase-change quads:',evidence.surface.transitionQuads.length,
    'maximum comparison difference:',Math.max(...evidence.comparisons.map(p=>Math.abs(p.expected-p.actual))))
}
