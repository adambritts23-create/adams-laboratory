/** Executes only the isolated official Java reference. Never called by the web app. */
import fs from 'node:fs'
import process from 'node:process'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
if (fs.existsSync('tests/fixtures/eq-diagr/references.json') && !process.argv.includes('--replace-golden')) throw new Error('Golden references already exist. Explicitly pass --replace-golden only when deliberately regenerating official reference data; never to fit a production solver.')
const root = path.resolve('.local/phase4-reference')
const java = process.env.PHASE4_JAVA ?? 'C:/Program Files/JetBrains/PyCharm 2025.3.3/jbr/bin/java.exe'
const snapshot = JSON.parse(fs.readFileSync('.local/spana-components.json', 'utf8'))
const cases = [
  { id: 'acid-base', components: ['H+', 'H2O'], species: ['OH-'], conditions: ['LA,-7', 'LA,0'] },
  { id: 'complexation', components: ['Ag+', 'Cl-'], species: ['AgCl'], conditions: ['T,0.00001', 'T,0.001'] },
  { id: 'precipitation', components: ['Ag+', 'Cl-'], species: ['AgCl', 'AgCl(s)'], conditions: ['T,0.001', 'T,0.001'] },
  { id: 'redox', components: ['Fe 2+', 'e-'], species: ['Fe 3+'], conditions: ['T,0.00001', 'LA,-13'] },
  { id: 'fixed-activity', components: ['Ag+', 'Cl-'], species: ['AgCl'], conditions: ['LA,-6', 'LA,-3'] },
]
const destination = path.resolve('tests/fixtures/eq-diagr')
fs.mkdirSync(destination, { recursive: true })
const versionRun = spawnSync(java, ['-version'], { encoding: 'utf8' })
if (versionRun.status !== 0) throw new Error('Unable to execute Java')
const javaVersion = versionRun.stdout + versionRun.stderr
const results = []
for (const item of cases) {
  const records = item.species.map(name => {
    const found = snapshot.species.filter(s => s.name === name)
    if (found.length !== 1) throw new Error(`Expected unique source reaction ${name}`)
    const record = found[0]
    if (Object.keys(record.componentStoichiometry).some(c => !item.components.includes(c))) throw new Error('Unresolved source basis')
    return record
  })
  const solidCount = records.filter(s => s.phase === 'solid').length
  const input = [`${item.components.length}, ${records.length - solidCount}, ${solidCount}, 0`, ...item.components,
    ...records.map(s => `${s.name}, ${s.logK}, ${item.components.map(c => s.componentStoichiometry[c] ?? 0).join(', ')}`),
    '1', ...item.conditions, ''].join('\n')
  const runDir = path.join(root, item.id)
  fs.mkdirSync(runDir, { recursive: true })
  const inputPath = path.join(runDir, `${item.id}.dat`)
  fs.writeFileSync(inputPath, input)
  const args = ['-Djava.awt.headless=true', '-cp', path.join(root, 'classes'), 'ec.EC', inputPath, '-m=-1', '-t=25', '-tol=1e-10', '-d=3']
  const stdout = execFileSync(java, args, { cwd: runDir, encoding: 'utf8', timeout: 30000 })
  if (!stdout.includes('Calculated 1 points') || !stdout.includes('All Done')) throw new Error(`EC did not finish ${item.id}`)
  const probes = ['1e-10', '1e-12'].map(tolerance => {
    const probeArgs = ['-Djava.awt.headless=true', '-cp', path.join(root, 'classes'), 'ReferenceProbe', inputPath, tolerance]
    const raw = execFileSync(java, probeArgs, { cwd: runDir, encoding: 'utf8', timeout: 30000 })
    const values = JSON.parse(raw)
    if (values.errFlags !== 0) throw new Error('Reference solver did not converge')
    return { tolerance: Number(tolerance), command: { executable: java, args: probeArgs }, raw, values }
  })
  const outputs = Object.fromEntries(fs.readdirSync(runDir).filter(n => n !== `${item.id}.dat`).map(n => [n, fs.readFileSync(path.join(runDir, n), 'utf8')]))
  results.push({ ...item, input, inputSha256: hash(input), javaCommand: { executable: java, args }, stdout, outputs, probes,
    sourceRecords: records.map(s => ({ id: s.id, name: s.name, logK: s.logK, coefficients: s.componentStoichiometry, provenance: s.provenance })),
    assumptions: { temperatureC: 25, pressureBar: 1, activityModel: 'ideal', ionicStrength: 'not evaluated by ideal EC path', concentrationUnit: 'mol/kg-H2O', chargeBalance: 'not imposed; open fixed activities or omitted spectator ions as stated by constraints', restrictedSpeciesSet: true } })
}
const manifest = { schemaVersion: 1, sourceRevision: snapshot.sourceRevision, javaVersion,
  ecSourceSha256: hash(fs.readFileSync(path.join(root, 'EC.java'))),
  probeSourceSha256: hash(fs.readFileSync('scripts/ReferenceProbe.java')),
  librarySources: fs.readdirSync(path.join(root, 'library/src'), { recursive: true }).filter(n => n.endsWith('.java')).map(n => ({ path: n.replaceAll('\\', '/'), sha256: hash(fs.readFileSync(path.join(root, 'library/src', n))) })),
  generatedAt: new Date().toISOString(), warning: 'Official Java outputs for restricted benchmark systems; not Adam’s Laboratory results or full database predictions.', cases: results }
fs.writeFileSync(path.join(destination, 'references.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(`Captured ${results.length} official EC cases in tests/fixtures/eq-diagr/references.json`)
