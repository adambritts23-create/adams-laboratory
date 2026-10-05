import {fePeroxideScope} from '../src/thermodynamics/scopes/fePeroxide.js'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { auditProductionArtifacts } from './production-artifacts.js'
import {feOxidationMetadata} from '../src/analysis/feOxidationMetadata.js'
import {cuOxidationMetadata} from '../src/analysis/cuOxidationMetadata.js'
import {cuPourbaixCandidate} from '../src/analysis/cuPourbaixContract.js'
import {fePourbaixCandidate} from '../src/analysis/fePourbaixContract.js'

const root = fileURLToPath(new URL('../', import.meta.url)), src = path.join(root, 'src')
const visited = new Set(), external = new Set()
function visit(file) {
  if (visited.has(file)) return
  assert.ok(file.startsWith(src + path.sep), `Production import escapes src: ${file}`)
  assert.ok(!/\.test\.|fixtures|ReferenceProbe|HaltaFall/i.test(file))
  visited.add(file)
  if (!/\.[jt]sx?$/.test(file)) return
  const code = fs.readFileSync(file, 'utf8')
  const dynamic=[...code.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)]
  assert.equal((code.match(/\bimport\s*\(/g)||[]).length,dynamic.length,'Only statically named dynamic imports may enter the production graph.')
  for (const match of [...code.matchAll(/\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/g),...dynamic]) {
    const target = match[1]
    if (target.startsWith('.')) visit(path.resolve(path.dirname(file), target.split('?')[0]))
    else external.add(target)
  }
}
visit(path.join(src, 'main.jsx'))
assert.deepEqual([...external].sort(), ['react', 'react-dom/client', 'three', 'three/addons/controls/OrbitControls.js', 'three/addons/environments/RoomEnvironment.js', 'three/addons/exporters/GLTFExporter.js', 'three/addons/geometries/RoundedBoxGeometry.js', 'three/addons/loaders/GLTFLoader.js', 'three/addons/utils/BufferGeometryUtils.js'])
const config = fs.readFileSync(path.join(root, 'vite.config.js'), 'utf8')
assert.ok(config.includes("base: '/adambritts-site/laboratory/'"))
const bundleFiles = fs.readdirSync(path.join(root, 'dist/assets')).filter(f => f.endsWith('.js'))
function artifacts(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? artifacts(file) : [{ name: path.relative(path.join(root, 'dist'), file), content: fs.readFileSync(file) }]
  })
}
const localSnapshot = path.join(root, '.local/spana-components.json')
const hashes = fs.existsSync(localSnapshot) ? [...new Set(JSON.parse(fs.readFileSync(localSnapshot, 'utf8')).species.map(s => s.provenance?.dbSha256).filter(Boolean))] : []
const approvedAssets = ['public-data-manifest.json','public-artwork-manifest.json','public-adam-media-manifest.json','public-adam-portrait-manifest.json','public-adam-studio-manifest.json','public-adam-observer-manifest.json','public-wet-lab-preparation-manifest.json','public-intro-manifest.json'].map(name => JSON.parse(fs.readFileSync(path.join(root,'scripts',name),'utf8')))
approvedAssets.push(...JSON.parse(fs.readFileSync(path.join(root,'scripts/public-intro-gallery-manifest.json'),'utf8')))
approvedAssets.push(...JSON.parse(fs.readFileSync(path.join(root,'scripts/public-apartment-manifest.json'),'utf8')))
const closedMetadata=JSON.parse(fs.readFileSync(path.join(root,'scripts/closed-reagent-metadata-manifest.json'),'utf8'))
approvedAssets.push(...JSON.parse(fs.readFileSync(path.join(root,'scripts/public-materials-manifest.json'),'utf8')))
assert.equal(closedMetadata.version,fePeroxideScope.version)
const boundary = auditProductionArtifacts(artifacts(path.join(root, 'dist')), hashes, approvedAssets,[{value:fePeroxideScope,sha256:closedMetadata.sha256},{value:feOxidationMetadata,sha256:fePourbaixCandidate.metadataSha256},{value:cuOxidationMetadata,sha256:cuPourbaixCandidate.metadataSha256}])
assert.ok(bundleFiles.length > 0)
for (const file of bundleFiles) {
  const code = fs.readFileSync(path.join(root, 'dist/assets', file), 'utf8')
  assert.ok(!/ReferenceProbe|haltaCalc|c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7|aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960/.test(code), 'Oracle implementation/fixture marker found in bundle.')
}
assert.ok(visited.has(path.join(src,'experimental','carrierPourbaix.js')), 'Experimental carrier pipeline must be included in the audited production graph.')
const bundledCode=bundleFiles.map(file=>fs.readFileSync(path.join(root,'dist/assets',file),'utf8')).join('\n')
for(const marker of ['Calculate experimental carrier map','EXPERIMENTAL / UNREVIEWED','they do not indicate oxidation states or real compound colors','Gaps are not interpolated.','unclassified / metadata pending'])assert.ok(bundledCode.includes(marker), `Missing experimental carrier mode or disclosure: ${marker}`)
console.log(JSON.stringify({ boundary, sourceModulesAndAssets: [...visited].map(f => path.relative(root, f)).sort(), external: [...external], bundleFiles, viteBase: '/adambritts-site/laboratory/', status: 'passed' }, null, 2))
