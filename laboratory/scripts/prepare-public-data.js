import fs from 'node:fs'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { repositoryFromSnapshot } from '../src/thermodynamics/snapshot.js'

// Only machine-specific archive locations change. All scientific/provenance fields remain.
export function publicSnapshot(value) {
  if (typeof value === 'string' && /^[A-Z]:[\\/]/i.test(value)) {
    const separator = value.indexOf('!')
    if (separator < 0) throw Error('Unreviewed absolute path in snapshot.')
    return value.slice(separator + 1)
  }
  if (Array.isArray(value)) return value.map(publicSnapshot)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, publicSnapshot(v)]))
  return value
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = JSON.parse(fs.readFileSync('.local/spana-components.json', 'utf8'))
  const snapshot = publicSnapshot(source)
  repositoryFromSnapshot(snapshot)
  const content = JSON.stringify(snapshot)
  fs.mkdirSync('public/data', { recursive: true })
  fs.writeFileSync('public/data/thermodynamic-default.json', content)
  fs.writeFileSync('scripts/public-data-manifest.json', JSON.stringify({ file: 'data/thermodynamic-default.json', bytes: Buffer.byteLength(content), sha256: createHash('sha256').update(content).digest('hex'), records: snapshot.species.length, components: snapshot.components.length }, null, 2) + '\n')
}
