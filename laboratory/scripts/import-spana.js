import process from 'node:process'
import { mkdir, writeFile, readFile, realpath } from 'node:fs/promises'
import { resolve, dirname, relative, isAbsolute } from 'node:path'
import { openSource, sha256 } from './spana-source.js'
import { convertSpana } from '../src/thermodynamics/importers/spana/convert.js'

const args = process.argv.slice(2), options = {}
for (let i = 0; i < args.length; i += 2) {
  if (!['--folder', '--archive', '--prefix', '--out'].includes(args[i]) || !args[i + 1]) throw new Error('Usage: npm run import:spana -- --archive PATH [--prefix Eq-Diagr/] [--out .local/spana.json] OR --folder PATH')
  options[args[i].slice(2)] = args[i + 1]
}
try {
  // Output is deliberately constrained to .local inside this project, never source/reference paths or public assets.
  const workspace = await realpath(process.cwd())
  const outputRoot = resolve(workspace, '.local'), output = resolve(options.out ?? '.local/spana.json')
  const outputRelative = relative(outputRoot, output)
  if (!outputRelative || outputRelative.startsWith('..') || isAbsolute(outputRelative) || !output.endsWith('.json')) throw new Error('Output must be a JSON file inside this project’s .local/ directory')
  await mkdir(outputRoot, { recursive: true })
  if (await realpath(outputRoot) !== outputRoot) throw new Error('.local must not be a symlink or redirected directory')
  if (dirname(output) !== outputRoot) throw new Error('Output must be directly inside .local (no nested or redirected directories)')
  try { await realpath(output); throw new Error('Output already exists. Choose another --out filename; no files are overwritten.') } catch (error) { if (error.code !== 'ENOENT') throw error }
  const source = await openSource(options)
  if (source.sourcePath === outputRoot || source.sourcePath.startsWith(outputRoot + '\\')) throw new Error('Source and output locations must be distinct')
  const db = await source.read('Reactions.db'), elb = await source.read('Reactions.elb')
  const refs = await source.read('References.txt', false), sit = await source.read('SIT-coefficients.dta', false)
  await source.read('LICENSE', false); await source.read('README.txt', false)
  const dbHash = sha256(db.bytes), sourceDatabase = `spana:${dbHash}`
  const artifact = convertSpana({ db: db.bytes, elb: elb.bytes, referencesText: refs?.bytes.toString('utf8') ?? '', sitText: sit?.bytes.toString('utf8') ?? null,
    context: { sourceDatabase, sourceFile: db.sourceFile, elbSourceFile: elb.sourceFile, referenceSourceFile: refs?.sourceFile ?? null, sitSourceFile: sit?.sourceFile ?? null, dbHash, importDate: new Date().toISOString() } })
  if (!artifact.complete) throw new Error(`Format/truncation failure; no dataset written: ${JSON.stringify(artifact.diagnostics)}`)
  if (source.archiveHash && sha256(await readFile(source.sourcePath)) !== source.archiveHash) throw new Error('Source archive changed during import')
  if (!source.archiveHash) for (const file of source.manifest) if (sha256(await readFile(file.sourceFile)) !== file.sha256) throw new Error(`Source file changed during import: ${file.name}`)
  artifact.inputManifest = source.manifest
  artifact.sourceArchiveSha256 = source.archiveHash
  artifact.sourceUnchangedDuringImport = true
  await writeFile(output, JSON.stringify(artifact, null, 2), { flag: 'wx' })
  process.stdout.write(JSON.stringify({ output, summary: artifact.summary, diagnostics: artifact.diagnostics.length, sourceUnchanged: true }, null, 2) + '\n')
} catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1 }
