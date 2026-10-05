import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { customFixture } from './phase82Helpers.js'
import { composeUserChemistry } from '../src/thermodynamics/userComponents.js'
import { createRepository } from '../src/thermodynamics/repository.js'
import { repositoryFromSnapshot } from '../src/thermodynamics/snapshot.js'
import { automaticSpeciesPolicy, discoverReactionSet, reconcileAutomaticSpecies, repositoryReactionCatalog } from '../src/thermodynamics/compatibility.js'
import { createWorkspaceSession, createLaboratorySession, updateLaboratorySession } from '../src/session/laboratorySession.js'
import { createCalculationDefinition } from '../src/calculations/definition.js'
import { prepareSessionPoint, prepareSessionStructure } from '../src/solver/prepareSession.js'
import { solvePoint } from '../src/solver/point.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { vary } from './phase6Helpers.js'
import { logGridTicks } from '../src/plots/geometry.js'
import { parameterRange } from '../src/plots/parameterScale.js'
import { placeCurveLabels } from '../src/plots/labels.js'
import { logLandmarks } from '../src/plots/logLandmarks.js'
import { createSpecies } from '../src/thermodynamics/schema.js'
import { references } from './pointHelpers.js'

function custom() {
  const fixture = customFixture(), data = composeUserChemistry(fixture.base, fixture.components, [fixture.record])
  let session = createWorkspaceSession(data.repository, { solidPhasePolicy: 'explicit' })
  for (const c of fixture.components) {
    session = updateLaboratorySession(session, { type: 'system', action: { type: 'toggleElement', symbol: c.associations[0].element } }, data.repository)
    session = updateLaboratorySession(session, { type: 'system', action: { type: 'toggleComponent', id: c.id } }, data.repository)
  }
  return { ...fixture, ...data, session }
}
const toggle = (session, repository, type, id) => updateLaboratorySession(session, { type: 'system', action: { type, id } }, repository)

test('automatic membership requires every explicit nonzero component and ignores discovery elements', () => {
  const { repository, session, record, components } = custom()
  assert.deepEqual(session.chemicalSystem.selectedSpecies, [record.id])
  const discovery = updateLaboratorySession(session, { type: 'system', action: { type: 'toggleElement', symbol: 'Ag' } }, repository)
  assert.equal(discovery.revision, session.revision); assert.deepEqual(discovery.chemicalSystem.selectedSpecies, [record.id])
  const removed = toggle(discovery, repository, 'toggleComponent', components[0].id)
  assert.deepEqual(removed.chemicalSystem.selectedSpecies, [])
  assert.deepEqual(discoverReactionSet(repository, removed.chemicalSystem).rows.find(r => r.species.id === record.id).missing, ['Ag+'])
})
test('exclusion changes science and retains stale plots; visibility leaves membership and revision untouched; restoration is explicit', () => {
  const { repository, session, record } = custom()
  session.lastPlot = { retained: true }; session.calculationResult = { old: true }
  const hidden = updateLaboratorySession(session, { type: 'plotView', patch: { visibleIds: [] } }, repository)
  assert.equal(hidden.revision, session.revision); assert.equal(hidden.chemicalSystem, session.chemicalSystem)
  const excluded = toggle(hidden, repository, 'toggleSpecies', record.id)
  assert.equal(excluded.revision, session.revision + 1); assert.equal(excluded.lastPlot, session.lastPlot); assert.equal(excluded.calculationResult, null)
  assert.deepEqual(excluded.chemicalSystem.excludedSpecies, [record.id]); assert.deepEqual(excluded.chemicalSystem.selectedSpecies, [])
  assert.deepEqual(toggle(excluded, repository, 'toggleSpecies', record.id).chemicalSystem.selectedSpecies, [record.id])
})
test('repository generation invalidates immutable caches and re-derives membership on source edit/removal', () => {
  const { base, components, record, repository, session } = custom()
  const before = discoverReactionSet(repository, session.chemicalSystem)
  assert.equal(before, discoverReactionSet(repository, session.chemicalSystem)); assert.ok(Object.isFrozen(repositoryReactionCatalog(repository)[0]))
  const replacement = composeUserChemistry(base, components, [{ ...record, notes: 'Explicit source edit' }]).repository
  const next = updateLaboratorySession(session, { type: 'sources', repository: replacement }, repository)
  assert.notEqual(discoverReactionSet(replacement, next.chemicalSystem), before)
  assert.equal(next.revision, session.revision + 1); assert.deepEqual(next.chemicalSystem.selectedSpecies, [record.id])
  const empty = composeUserChemistry(base, components, []).repository
  assert.deepEqual(updateLaboratorySession(next, { type: 'sources', repository: empty }, replacement).chemicalSystem.selectedSpecies, [])
})
test('solids require deliberate inclusion and multiple choices retain the existing typed preparation rejection', async () => {
  const { base, components, record, session } = custom()
  const records = [{ ...record, phase: 'solid' }, { ...record, id: 'user:second-solid', productId: 'Second test solid', phase: 'solid' }]
  const { repository } = composeUserChemistry(base, components, records)
  let next = updateLaboratorySession(session, { type: 'sources', repository }, repository)
  assert.deepEqual(next.chemicalSystem.selectedSpecies, [])
  for (const r of records) next = toggle(next, repository, 'toggleSpecies', r.id)
  const prepared = await prepareSessionStructure(next, repository)
  assert.equal(prepared.ok, false); assert.ok(prepared.diagnostics.some(d => d.code === 'unsupported-solid-assemblage'))
})
test('automatic and legacy explicit custom membership produce identical prepared science and point results', async () => {
  const { repository, session, record } = custom()
  const manual = createLaboratorySession(repository)
  manual.chemicalSystem.selectedComponents = [...session.chemicalSystem.selectedComponents]; manual.chemicalSystem.selectedSpecies = [record.id]
  for (const s of [session, manual]) {
    s.revision = 0; s.calculationDefinition = createCalculationDefinition(s.chemicalSystem, repository)
    s.calculationDefinition.componentConditions = s.chemicalSystem.selectedComponents.map((componentId, i) => ({ componentId, mode: 'LA', quantity: 'log-activity', unit: 'dimensionless', value: i ? -3 : -6 }))
  }
  const a = await prepareSessionPoint(session, repository), b = await prepareSessionPoint(manual, repository)
  assert.ok(a.ok); assert.ok(b.ok); assert.deepEqual(a.system, b.system)
  assert.deepEqual(solvePoint(a.system, a.input).concentrations, solvePoint(b.system, b.input).concentrations)
})
test('automatic policy survives new/reset and deliberate exclusions survive temporary component removal', () => {
  const { repository, session, record, components } = custom()
  let next = toggle(session, repository, 'toggleSpecies', record.id)
  next = toggle(next, repository, 'toggleComponent', components[1].id); next = toggle(next, repository, 'toggleComponent', components[1].id)
  assert.deepEqual(next.chemicalSystem.selectedSpecies, []); assert.deepEqual(next.chemicalSystem.excludedSpecies, [record.id])
  assert.deepEqual(updateLaboratorySession(next, { type: 'resetCalculation' }, repository).chemicalSystem, next.chemicalSystem)
  const fresh = updateLaboratorySession(next, { type: 'newSystem' }, repository)
  assert.equal(fresh.chemicalSystem.speciesPolicy, automaticSpeciesPolicy); assert.deepEqual(fresh.chemicalSystem.excludedSpecies, [])
})
test('imported and user-defined formation records use identical component compatibility, independent of product names', () => {
  const { repository, session, record } = custom(), source = references.cases.find(c => c.id === 'fixed-activity').sourceRecords[0]
  const imported = createSpecies({ id: source.id, name: 'Imported path test', displayName: 'Imported path test', formula: 'arbitrary display', phase: 'aqueous', charge: 0, elementalComposition: null,
    logK: source.logK, temperatureReference: 298.15, logKConvention: 'log10 formation constant for one named product from signed components',
    sourceDatabase: source.provenance.sourceDatabase, sourceRecordId: source.provenance.sourceRecordId, provenance: source.provenance,
    metadata: { sourceFormat: 'spana-java-binary', effectiveSourceReaction: source.provenance.originalReaction } })
  const combined = createRepository({ species: [...repository.getSpecies(), imported], components: repository.getComponents(), elements: repository.getElements(), sources: [...repository.getSources(), { id: imported.sourceDatabase, name: 'Retained official fixture' }] })
  const full = discoverReactionSet(combined, session.chemicalSystem)
  assert.deepEqual(full.selectedSpecies, [record.id, imported.id])
  const partial = discoverReactionSet(combined, { ...session.chemicalSystem, selectedComponents: session.chemicalSystem.selectedComponents.slice(1) })
  assert.deepEqual(partial.rows.find(r => r.species.id === record.id).missing, partial.rows.find(r => r.species.id === imported.id).missing)
  assert.equal(partial.selectedSpecies.length, 0)
})
test('unavailable thermodynamic values and disabled aqueous phase never create automatic equilibrium products', () => {
  const { repository, session, record } = custom()
  const disabled = toggle(session, repository, 'togglePhase', 'unused')
  assert.equal(disabled, session)
  const chemical = { ...session.chemicalSystem, enabledPhases: ['solid', 'liquid'] }
  assert.deepEqual(discoverReactionSet(repository, chemical).selectedSpecies, [])
  const s = repository.getSpeciesById(record.id)
  const unsupported = createRepository({ species: [{ ...s, logK: null }], components: repository.getComponents(), elements: repository.getElements(), sources: repository.getSources() })
  assert.deepEqual(discoverReactionSet(unsupported, session.chemicalSystem).selectedSpecies, [])
  assert.match(discoverReactionSet(unsupported, session.chemicalSystem).rows[0].status, /Unsupported source/)
})
test('integer log grid preserves -3 as a minor landmark and varies label density with pixel height', () => {
  const tall = logGridTicks(-14, 2, 600), short = logGridTicks(-14, 2, 220)
  assert.equal(tall.length, 17); assert.ok(tall.every(t => t.major)); assert.equal(short.length, 17)
  assert.ok(short.some(t => t.value === -3)); assert.ok(short.filter(t => t.major).length < tall.length)
  assert.ok(logGridTicks(-300, 300, 200).length <= 101); assert.ok(logGridTicks(-3.1, -2.9, 200).length > 0)
  const bar = parameterRange({ mode: 'T', value: 0.001 })
  assert.equal(bar.position, -3); assert.ok(logGridTicks(bar.min, bar.max, 220).some(t => t.value === -3))
  const landmarks = logLandmarks(bar.min, bar.max, bar.position)
  assert.ok(landmarks.some(t => t.value === -3 && t.major)); assert.ok(!landmarks.find(t => t.value === -2).major)
})
test('crowded direct labels fall back before offsets become ambiguous', () => {
  assert.deepEqual(placeCurveLabels(Array.from({ length: 8 }, (_, i) => ({ id: String(i), x: 100, y: 100 })), 0, 500), [])
  const labels = placeCurveLabels([{ id: 'a', x: 1, y: 100 }, { id: 'b', x: 2, y: 102 }], 0, 500)
  assert.equal(labels.length, 2); assert.equal(labels[1].labelY - labels[0].labelY, 19)
})

const localPath = '.local/spana-components.json'
test('real local carbonate: auto acid/base membership equals explicit four-product pH sweep at all 51 points', { skip: !fs.existsSync(localPath) && 'Local licensed snapshot unavailable; portable equivalence still runs' }, async () => {
  const repository = repositoryFromSnapshot(JSON.parse(fs.readFileSync(localPath, 'utf8')))
  let session = createWorkspaceSession(repository, { solidPhasePolicy: 'explicit' })
  session = updateLaboratorySession(session, { type: 'system', action: { type: 'toggleElement', symbol: 'C' } }, repository)
  const carbonate = repository.getComponents().find(c => c.name === 'CO3 2-'), proton = repository.getComponents().find(c => c.role === 'proton')
  session = toggle(session, repository, 'toggleComponent', carbonate.id)
  const set = discoverReactionSet(repository, session.chemicalSystem)
  assert.deepEqual(set.rows.filter(r => r.included).map(r => r.species.name), ['CO2', 'H2CO3', 'HCO3-', 'OH-'])
  assert.equal(set.rows.find(r => r.species.name === 'OH-').acidBase, true)
  assert.equal(set.rows.find(r => r.species.name === 'CO2(g)').eligible, false)
  assert.ok(!set.selectedSpecies.includes('water'))
  const withoutH = toggle(session, repository, 'toggleComponent', proton.id)
  assert.equal(discoverReactionSet(repository, withoutH.chemicalSystem).rows.find(r => r.species.name === 'OH-').included, false)
  // Explicit, independently enumerated old-workflow membership. No copied auto list.
  const manual = createLaboratorySession(repository)
  manual.chemicalSystem.selectedComponents = [...session.chemicalSystem.selectedComponents]
  manual.chemicalSystem.selectedSpecies = ['CO2', 'H2CO3', 'HCO3-', 'OH-'].map(name => repositoryReactionCatalog(repository).find(s => s.name === name).id)
  const outcomes = []
  for (const s of [manual, session]) {
    s.revision = 0; s.calculationDefinition = createCalculationDefinition(s.chemicalSystem, repository)
    s.calculationDefinition.componentConditions.find(c => c.componentId === carbonate.id).value = 0.001
    s.calculationDefinition = vary(s.calculationDefinition, proton.id, 'LAV', 0, 14, 51, 'pH')
    const p = await prepareSessionPoint(s, repository, { sweep: true }); assert.ok(p.ok, JSON.stringify(p))
    const d = await createSweepDefinition(p.system, s.calculationDefinition, 0); assert.ok(d.ok, JSON.stringify(d))
    const result = await runSweep(p.system, d.sweep); assert.equal(result.counts.converged, 51)
    outcomes.push({ system: p.system, results: result.outcomes.map(o => ({ input: o.input, concentrations: o.result.concentrations, logActivities: o.result.logActivities, status: o.status })) })
  }
  assert.deepEqual(outcomes[0], outcomes[1])
  // Explicit Ca term dependencies: element discovery alone cannot introduce them.
  const calcium = repository.getComponents().find(c => c.name === 'Ca 2+')
  const caSystem = reconcileAutomaticSpecies({ ...session.chemicalSystem, selectedComponents: [...session.chemicalSystem.selectedComponents, calcium.id] }, repository)
  const added = discoverReactionSet(repository, caSystem).rows.filter(r => r.included && !set.selectedSpecies.includes(r.species.id))
  assert.ok(added.length > 0); assert.ok(added.every(r => r.species.metadata.effectiveSourceReaction.components.some(t => t.name === calcium.name && t.coefficient !== 0)))
  // Same dataset with misleading discovery/formula metadata cannot change compatibility.
  const changed = createRepository({ species: repositoryReactionCatalog(repository).map(s => ({ ...s, formula: 'unrelated label', name: s.name === 'OH-' ? 'Renamed acid base test identity' : s.name })), components: repository.getComponents(), elements: repository.getElements(), sources: repository.getSources() })
  assert.deepEqual(discoverReactionSet(changed, session.chemicalSystem).selectedSpecies, set.selectedSpecies)
  assert.equal(discoverReactionSet(changed, session.chemicalSystem).rows.find(r => r.species.name === 'Renamed acid base test identity').acidBase, true)
  const redox = set.rows.find(r => r.species.name === 'C(cr)')
  assert.ok(redox.missing.includes('e-')); assert.equal(redox.included, false)
  assert.ok(!session.chemicalSystem.selectedComponents.includes(repository.getComponents().find(c => c.role === 'electron').id))
})
