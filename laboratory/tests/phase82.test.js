import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { Writable } from 'node:stream'
import { Buffer } from 'node:buffer'
import { developmentSourceMiddleware, developmentSourcePlugin, developmentSourceEndpoint } from '../scripts/development-source.js'
import { auditProductionArtifacts } from '../scripts/production-artifacts.js'
import { createDefaultSourceProvider } from '../src/components/defaultSource.js'
import { databaseStatus } from '../src/components/databaseLoading.js'
import { thermodynamicRepository as demo } from '../src/thermodynamics/index.js'
import { validateUserComponent, composeUserComponents, composeUserChemistry, exportUserChemistry, importUserChemistry } from '../src/thermodynamics/userComponents.js'
import { elementInteraction } from '../src/chemistry/elementInteraction.js'
import { elementStates } from '../src/data/periodicTable.js'
import { createLaboratorySession, createWorkspaceSession, updateLaboratorySession } from '../src/session/laboratorySession.js'
import { createCalculationDefinition } from '../src/calculations/definition.js'
import { prepareSessionPoint, prepareSessionStructure } from '../src/solver/prepareSession.js'
import { solvePoint } from '../src/solver/point.js'
import { parameterRange, parameterToPosition, positionToParameter, numericParameter } from '../src/plots/parameterScale.js'
import { placeCurveLabels } from '../src/plots/labels.js'
import { customFixture, component, stamp } from './phase82Helpers.js'

const snapshot = () => ({ kind: 'adams-spana-snapshot', artifactVersion: 1, complete: true, species: demo.getSpecies(), components: demo.getComponents(), elements: demo.getElements(), sources: demo.getSources(), diagnostics: [] })

test('default provider loads once, reports loading/validation and shares the validated repository across subscribers', async () => {
  let calls = 0
  const provider = createDefaultSourceProvider({ enabled: true, fetchSource: async () => { calls++; return new Response(JSON.stringify(snapshot())) } })
  const a = [], b = []
  const [first, second] = await Promise.all([provider(s => a.push(s)), provider(s => b.push(s))])
  assert.equal(calls, 1); assert.equal(first, second)
  assert.deepEqual(a, ['Loading thermodynamic source…', 'Loading database…', 'Validating…']); assert.deepEqual(b, a)
  assert.equal(first.recordCount, demo.getSpeciesIdentities().length); assert.equal(first.solventRecordCount, 1); assert.equal(first.importedRecordCount, 0)
  assert.match(databaseStatus(first, null), /Database ready/); assert.ok(first.timings.repositoryValidationMs >= 0)
  assert.equal(await provider(() => {}), first); assert.equal(calls, 1)
})
test('production default provider never requests a local source; transport and malformed-source failures are explicit', async () => {
  const absent = createDefaultSourceProvider({ enabled: false, fetchSource: () => assert.fail('Production must not fetch a default source') })
  assert.equal(await absent(() => assert.fail()), null)
  await assert.rejects(createDefaultSourceProvider({ enabled: true, fetchSource: async () => new Response('', { status: 503 }) })(() => {}), /source unavailable/)
  await assert.rejects(createDefaultSourceProvider({ enabled: true, fetchSource: async () => new Response('{}') })(() => {}), /complete/)
})

function request(middleware, patch = {}) {
  return new Promise((resolve, reject) => {
    const chunks = [], headers = {}, res = new Writable({ write(chunk, encoding, done) { chunks.push(Buffer.from(chunk)); done() } })
    res.setHeader = (k, v) => { headers[k] = v }; res.statusCode = 200
    res.on('finish', () => resolve({ status: res.statusCode, headers, body: Buffer.concat(chunks).toString() })); res.on('error', reject)
    middleware({ url: developmentSourceEndpoint, method: 'GET', headers: { host: '127.0.0.1:5173' }, socket: { remoteAddress: '127.0.0.1' }, ...patch }, res, () => resolve({ next: true }))
  })
}
test('development middleware serves only the configured local file to loopback, without caching or arbitrary path access', async () => {
  const middleware = developmentSourceMiddleware('package.json')
  const result = await request(middleware)
  assert.equal(result.body, fs.readFileSync('package.json', 'utf8')); assert.equal(result.headers['Cache-Control'], 'no-store')
  assert.equal((await request(middleware, { method: 'HEAD' })).body, '')
  assert.equal((await request(middleware, { method: 'POST' })).status, 405)
  assert.equal((await request(middleware, { socket: { remoteAddress: '192.168.1.9' } })).status, 403)
  assert.equal((await request(middleware, { headers: { host: 'evil.example' } })).status, 403)
  assert.equal((await request(middleware, { headers: { host: '127.0.0.1:5173', origin: 'https://evil.example' } })).status, 403)
  assert.deepEqual(await request(middleware, { url: `${developmentSourceEndpoint}/../../.env.local` }), { next: true })
  assert.equal((await request(developmentSourceMiddleware(null))).status, 404)
  assert.equal((await request(developmentSourceMiddleware('missing-source.json'))).status, 503)
  assert.equal(developmentSourcePlugin('package.json').apply, 'serve')
})
test('production artifact audit rejects local paths, dataset copies, source fingerprints and embedded oversized payloads', () => {
  assert.ok(auditProductionArtifacts([{ name: 'assets/app.js', content: 'const app=true' }]).localSourceAbsent)
  for (const file of [{ name: 'spana-components.json', content: '{}' }, { name: 'assets/app.js', content: 'C:\\Users\\adamb\\private.json' }, { name: 'assets/app.js', content: '__development_source' }, { name: 'assets/app.js', content: 'a'.repeat(2 * 1024 * 1024) }]) assert.throws(() => auditProductionArtifacts([file]))
  assert.throws(() => auditProductionArtifacts([{ name: 'data.txt', content: 'retained-local-hash' }], ['retained-local-hash']))
  assert.throws(() => auditProductionArtifacts([{ name: 'assets/source.gz', content: 'compressed data' }]))
})
test('available and unavailable element clicks both expose custom entry; discovery never infers a component', () => {
  const { base, components } = customFixture(), repo = composeUserComponents(base, components)
  const available = elementInteraction('Ag', repo.getComponents()), unavailable = elementInteraction('He', repo.getComponents())
  assert.equal(available.discover, true); assert.equal(available.customEntry, true); assert.deepEqual(available.formIds, [components[0].id])
  assert.equal(unavailable.available, false); assert.equal(unavailable.discover, false); assert.equal(unavailable.customEntry, true)
  assert.equal(elementInteraction('Ag', repo.getComponents(), ['Ag']).discover, false)
  assert.equal(elementStates(repo.getComponents()).find(e => e.symbol === 'He').state, 'unavailable')
})
test('custom component validation accepts explicit ordinary associations but rejects unsupported roles, malformed metadata and ambiguity', () => {
  const { base } = customFixture(), raw = component()
  assert.deepEqual(validateUserComponent(raw, base), [])
  for (const patch of [{ name: '' }, { id: 'source:x' }, { name: 'H+' }, { name: 'e-' }, { name: 'H2O' }, { name: 'Ag(s)' }, { name: 'He(g)' }, { associations: [] }, { associations: [{ element: 'XX', description: '' }] }, { associations: [raw.associations[0], raw.associations[0]] }, { createdAt: '' }, { charge: 1 }, { calculationResult: {} }]) assert.ok(validateUserComponent({ ...raw, ...patch }, base).length)
  const repo = composeUserComponents(base, [raw])
  assert.ok(validateUserComponent({ ...raw, id: 'user-component:other', name: 'Ag +' }, repo).some(d => d.code === 'identity-collision'))
  assert.throws(() => composeUserComponents(base, [raw, raw]))
})
test('custom component and equilibrium coexist with source data, preserving provenance without invented logK or implicit selection', () => {
  const { base, components, record } = customFixture(), before = base.getSpecies()
  const data = composeUserChemistry(base, components, [record])
  assert.deepEqual(base.getSpecies(), before)
  assert.equal(data.repository.getComponentById(components[0].id).provenance.kind, 'user-defined')
  assert.deepEqual(data.repository.getComponentById(components[0].id).metadata.rawUserComponent, components[0])
  assert.deepEqual(data.repository.getSpeciesById(record.id).metadata.rawUserRecord, record)
  assert.equal(data.repository.getSpeciesById(record.id).logK, record.logK)
  assert.deepEqual(createLaboratorySession(data.repository).chemicalSystem.selectedSpecies, [])
  assert.throws(() => composeUserChemistry(base, components, [{ ...record, logK: null }]), /invalid-logK/)
  assert.throws(() => composeUserChemistry(base, components, [{ ...record, productId: 'Ag+' }]), /identity-collision/)
  assert.throws(() => composeUserChemistry(base, components.slice(1), [record]), /unknown-component/)
})
test('custom-only versioned interchange preserves raw values, rejects result injection, and rejects missing dependencies', () => {
  const { base, components, record } = customFixture()
  const json = exportUserChemistry(base, components, [record])
  assert.deepEqual(importUserChemistry(json, base), { components, records: [record] })
  assert.ok(!json.includes('"water"')); assert.ok(!json.includes('"calculationResult"'))
  assert.throws(() => importUserChemistry(JSON.stringify({ ...JSON.parse(json), calculationResult: {} }), base))
  assert.throws(() => importUserChemistry(JSON.stringify({ ...JSON.parse(json), components: [] }), base), /unknown-component/)
})
test('explicit custom basis reaches unchanged preparation and point solver with the retained official formation constant', async () => {
  const { base, components, record } = customFixture(), { repository } = composeUserChemistry(base, components, [record])
  const session = createLaboratorySession(repository)
  session.chemicalSystem.selectedComponents = components.map(c => c.id); session.chemicalSystem.selectedSpecies = [record.id]
  session.calculationDefinition = createCalculationDefinition(session.chemicalSystem, repository)
  assert.ok((await prepareSessionStructure(session, repository)).ok)
  assert.equal((await prepareSessionPoint(session, repository)).ok, false, 'Blank conditions must remain incomplete')
  session.calculationDefinition.componentConditions = components.map((c, i) => ({ componentId: c.id, mode: 'LA', quantity: 'log-activity', unit: 'dimensionless', value: i ? -3 : -6 }))
  const prepared = await prepareSessionPoint(session, repository); assert.ok(prepared.ok, JSON.stringify(prepared))
  const result = solvePoint(prepared.system, prepared.input); assert.ok(result.ok)
  assert.ok(Math.abs(result.concentrations[2] / (10 ** record.logK * 1e-6 * 1e-3) - 1) < 1e-13)
})
test('structural handoff reports the actual multiple-solid preparation diagnostic without substituting numeric constraints', async () => {
  const { base, components, record } = customFixture()
  const records = [{ ...record, phase: 'solid' }, { ...record, id: 'user:second', productId: 'AgCl second test identity', phase: 'solid' }]
  const { repository } = composeUserChemistry(base, components, records), session = createLaboratorySession(repository)
  session.chemicalSystem.selectedComponents = components.map(c => c.id); session.chemicalSystem.selectedSpecies = records.map(r => r.id)
  session.calculationDefinition = createCalculationDefinition(session.chemicalSystem, repository)
  const before = structuredClone(session), result = await prepareSessionStructure(session, repository)
  assert.equal(result.ok, false); assert.ok(result.diagnostics.some(d => d.code === 'unsupported-solid-assemblage')); assert.deepEqual(session, before)
})
test('custom edits and removals invalidate current results, preserve stale plots and reconcile removed component conditions', () => {
  const { base, components, record } = customFixture(), { repository } = composeUserChemistry(base, components, [record])
  const session = createLaboratorySession(repository)
  session.chemicalSystem.selectedComponents = components.map(c => c.id); session.chemicalSystem.selectedSpecies = [record.id]
  session.calculationDefinition = createCalculationDefinition(session.chemicalSystem, repository)
  session.lastPlot = { marker: 'old accepted snapshot' }; session.calculationResult = { marker: 'old' }
  const edit = composeUserChemistry(base, components, [{ ...record, notes: 'Explicit edit context', modifiedAt: stamp }])
  const next = updateLaboratorySession(session, { type: 'sources', repository: edit.repository }, repository)
  assert.equal(next.revision, session.revision + 1); assert.equal(next.calculationResult, null); assert.equal(next.lastPlot, session.lastPlot)
  const removed = updateLaboratorySession(next, { type: 'sources', repository: base }, repository)
  assert.deepEqual(removed.chemicalSystem.selectedComponents, []); assert.deepEqual(removed.chemicalSystem.selectedSpecies, []); assert.deepEqual(removed.calculationDefinition.componentConditions, [])
  const view = updateLaboratorySession(next, { type: 'plotView', patch: { hiddenIds: [record.id] } }, repository)
  assert.equal(view.revision, next.revision); assert.equal(view.lastPlot, next.lastPlot)
})
test('New system retains the repository and custom collection while Reset calculation retains selected chemistry and clears results', () => {
  const { base, components, record } = customFixture(), { repository } = composeUserChemistry(base, components, [record]), session = createLaboratorySession(repository)
  session.chemicalSystem.selectedComponents = components.map(c => c.id); session.chemicalSystem.selectedSpecies = [record.id]
  session.lastPlot = { marker: 'prior' }
  const reset = updateLaboratorySession(session, { type: 'resetCalculation' }, repository)
  assert.deepEqual(reset.chemicalSystem, session.chemicalSystem); assert.equal(reset.lastPlot, null); assert.equal(reset.revision, session.revision + 1)
  const fresh = updateLaboratorySession(session, { type: 'newSystem' }, repository)
  assert.deepEqual(fresh.chemicalSystem.selectedSpecies, []); assert.deepEqual(fresh.chemicalSystem.selectedElements, []); assert.equal(fresh.lastPlot, null)
  assert.equal(repository.getSpeciesById(record.id).id, record.id); assert.equal(repository.getComponents().length, 2)
  assert.deepEqual(createWorkspaceSession(repository).chemicalSystem.selectedElements, [])
})
test('parameter bars map positive totals logarithmically and keep exact numeric entry outside convenience ranges', () => {
  assert.equal(parameterToPosition(0.001, true), -3); assert.equal(positionToParameter(-3, true), 0.001)
  assert.equal(positionToParameter(7, false), 7)
  assert.equal(numericParameter('0.0012345678901234567'), Number('0.0012345678901234567'))
  assert.equal(numericParameter(''), null); assert.equal(numericParameter('0'), 0)
  const range = parameterRange({ mode: 'T', value: 1e-20 }); assert.equal(range.min, -20); assert.equal(range.position, -20)
})
test('direct curve labels avoid collisions, retain exact anchors and use legend fallback for crowded series', () => {
  const anchors = [{ id: 'a', x: 99, y: 98 }, { id: 'b', x: 100, y: 98 }, { id: 'c', x: 100, y: 99 }], copy = structuredClone(anchors)
  const placed = placeCurveLabels(anchors, 0, 100)
  assert.equal(placed.length, 3); assert.ok(placed.every(p => p.labelY >= 0 && p.labelY <= 100))
  for (let i = 1; i < placed.length; i++) assert.ok(placed[i].labelY - placed[i - 1].labelY >= 19)
  assert.deepEqual(anchors, copy); assert.deepEqual(placed.map(({ id, x, y }) => ({ id, x, y })), anchors)
  assert.deepEqual(placeCurveLabels(Array.from({ length: 9 }, (_, i) => ({ id: String(i), x: i, y: i })), 0, 500), [])
})
