import test from 'node:test'
import assert from 'node:assert/strict'
import { references } from './pointHelpers.js'
import { createSpecies } from '../src/thermodynamics/schema.js'
import { createRepository } from '../src/thermodynamics/repository.js'
import { composeUserEquilibria, validateUserEquilibrium, exportUserEquilibria, importUserEquilibria, userReferenceState } from '../src/thermodynamics/userEquilibria.js'
import { createLaboratorySession, updateLaboratorySession } from '../src/session/laboratorySession.js'
import { createCalculationDefinition } from '../src/calculations/definition.js'
import { prepareSessionPoint } from '../src/solver/prepareSession.js'
import { solvePoint } from '../src/solver/point.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { deriveOutputs,deriveGridOutputs } from '../src/calculations/outputs.js'
import { calculateGrid,vary as varyGrid } from './phase8Helpers.js'
import { vary, reconstruct } from './phase6Helpers.js'
import { demoSpecies, demoSource } from '../src/data/species.js'

function fixture() {
  const source = references.cases.find(c => c.id === 'fixed-activity').sourceRecords[0]
  const imported = createSpecies({ id: source.id, name: source.name, formula: source.name, displayName: source.name, phase: 'aqueous', charge: 0,
    elementalComposition: null, logK: source.logK, temperatureReference: 298.15,
    logKConvention: 'log10 formation constant for one named product from signed components',
    sourceDatabase: source.provenance.sourceDatabase, sourceRecordId: source.provenance.sourceRecordId, provenance: source.provenance,
    metadata: { sourceFormat: 'spana-java-binary', effectiveSourceReaction: source.provenance.originalReaction } })
  const base = createRepository({ species: [imported], elements: [{ symbol: 'Ag' }, { symbol: 'Cl' }],
    components: ['Ag+', 'Cl-'].map((name, i) => ({ id: name, name, role: 'basis-choice', associations: [{ element: i ? 'Cl' : 'Ag', description: 'Explicit source association' }] })),
    sources: [{ id: imported.sourceDatabase, name: 'Official fixture source' }] })
  // Same retained source constant/coefficients; a distinct testing product identity
  // prevents catalog ambiguity. This copy is explicitly user-defined, not curated.
  const raw = { schemaVersion: 1, id: 'user:equivalence', productId: 'UserAgClTest', displayName: 'User AgCl equivalence test', phase: 'aqueous', charge: null,
    terms: [{ componentId: 'Ag+', coefficient: 1 }, { componentId: 'Cl-', coefficient: 1 }], logK: source.logK,
    temperatureK: 298.15, pressureBar: null, referenceState: userReferenceState, sourceType: 'user-defined',
    citation: source.provenance.resolvedCitation, notes: 'Source constant copied for path equivalence; no independent verification claimed.', createdAt: '2026-09-06T00:00:00Z', modifiedAt: '2026-09-06T00:00:00Z' }
  const session = createLaboratorySession(base)
  session.chemicalSystem.selectedComponents = ['Ag+', 'Cl-']
  session.chemicalSystem.selectedSpecies = [imported.id]
  session.calculationDefinition = createCalculationDefinition(session.chemicalSystem, base)
  session.calculationDefinition.activityModel = 'ideal'
  session.calculationDefinition.componentConditions = ['Ag+', 'Cl-'].map((componentId, i) => ({ componentId, mode: 'LA', quantity: 'log-activity', unit: 'dimensionless', value: i ? -3 : -6 }))
  return { base, raw, session }
}

test('user-defined record reaches the same preparation, point and sweep path as equivalent imported data', async () => {
  const { base, raw, session } = fixture()
  const original = await prepareSessionPoint(session, base); assert.ok(original.ok)
  const importedResult = solvePoint(original.system, original.input)
  const repository = composeUserEquilibria(base, [raw])
  session.chemicalSystem.selectedSpecies = [raw.id]
  session.calculationDefinition.output.speciesIds = [raw.id]
  const prepared = await prepareSessionPoint(session, repository); assert.ok(prepared.ok, JSON.stringify(prepared))
  const result = solvePoint(prepared.system, prepared.input)
  reconstruct(prepared.system, prepared.input, result)
  assert.deepEqual(result.concentrations, importedResult.concentrations)
  // Analytical mass action using the actual retained constant, not an invented golden.
  assert.ok(Math.abs(result.concentrations[2] / (10 ** raw.logK * 1e-6 * 1e-3) - 1) < 1e-13)
  assert.equal(prepared.system.products[0].sourceRecord.kind, 'user-defined')
  assert.notEqual(prepared.system.id, original.system.id)
  const d = vary(session.calculationDefinition, 'Ag+', 'LAV', -7, -5)
  const application = await prepareSessionPoint({ ...session, calculationDefinition: d }, repository, { sweep: true })
  assert.ok(application.ok)
  const s = await createSweepDefinition(application.system, d, session.revision)
  assert.ok(s.ok, JSON.stringify(s))
  const sweep = await runSweep(application.system, s.sweep)
  assert.equal(sweep.status, 'completed')
  sweep.outcomes.forEach(p => reconstruct(application.system, p.input, p.result))
  const plotted = deriveOutputs(application.system, sweep, { type: 'log-concentration' })
  assert.ok(plotted.ok)
  const customSeries = plotted.series.find(series => series.id === raw.id)
  assert.equal(customSeries.provenance, 'user-defined')
  customSeries.points.forEach((point, i) => assert.equal(point.value, Math.log10(sweep.outcomes[i].result.concentrations[2])))
  const gridDefinition=varyGrid(d,'Cl-','LAV',-4,-2,3)
  const gridPreparation=await prepareSessionPoint({...session,calculationDefinition:gridDefinition},repository,{grid:true})
  assert.ok(gridPreparation.ok)
  const grid=await calculateGrid(gridPreparation.system,gridDefinition,session.revision)
  const gridOutput=deriveGridOutputs(gridPreparation.system,grid,{type:'log-concentration'})
  assert.ok(gridOutput.ok)
  const gridSeries=gridOutput.series.find(s=>s.id===raw.id)
  assert.equal(gridSeries.provenance,'user-defined')
  gridSeries.points.forEach((p,i)=>assert.equal(p.value,Math.log10(grid.outcomes[i].result.concentrations[2])))
  const removed = updateLaboratorySession({ ...session, chemicalSystem: { ...session.chemicalSystem, selectedElements: ['Ag', 'Cl'] }, calculationDefinition: d, sweepResult: sweep, lastPlot: { system: application.system, sweep } }, { type: 'system', action: { type: 'toggleSpecies', id: raw.id } }, repository)
  assert.equal(removed.chemicalSystem.selectedSpecies.includes(raw.id), false)
  assert.equal(removed.revision, session.revision + 1)
  assert.equal(removed.sweepResult, null)
  assert.equal(removed.lastPlot.sweep.revision, session.revision)
})
test('custom validation rejects malformed science, unknown components, references and collisions', () => {
  const { base, raw } = fixture()
  for (const patch of [{ logK: NaN }, { logK: Infinity }, { logK: null }, { terms: [] }, { terms: [...raw.terms, raw.terms[0]] }, { terms: [{ componentId: 'new-component', coefficient: 1 }] }, { terms: [{ componentId: 'Ag+', coefficient: Infinity }] }, { phase: 'gas' }, { temperatureK: 300 }, { pressureBar: 2 }, { referenceState: 'molar' }, { productId: 'AgCl' }, { productId: 'Ag+' }, { id: '' }, { productId: '' }]) {
    assert.ok(validateUserEquilibrium({ ...raw, ...patch }, base).length)
    assert.throws(() => composeUserEquilibria(base, [{ ...raw, ...patch }]))
  }
  assert.throws(() => composeUserEquilibria(base, [raw, raw]))
  assert.deepEqual(validateUserEquilibrium(raw, base), [])
})
test('source-only interchange preserves raw values and provenance and rejects calculated results', () => {
  const { base, raw } = fixture()
  const json = exportUserEquilibria([raw], base)
  assert.deepEqual(importUserEquilibria(json, base), [raw])
  const doc = JSON.parse(json); doc.calculationResult = { ok: true }
  assert.throws(() => importUserEquilibria(JSON.stringify(doc), base))
  assert.throws(() => importUserEquilibria(JSON.stringify({ kind: 'adams-user-equilibria', schemaVersion: 2, records: [raw] }), base))
  const invalid = JSON.parse(json); invalid.records[0].logK = null
  assert.throws(() => importUserEquilibria(JSON.stringify(invalid), base))
  const repository = composeUserEquilibria(base, [raw])
  const record = repository.getSpeciesById(raw.id)
  assert.deepEqual(record.metadata.rawUserRecord, raw)
  record.logK = 999
  assert.equal(repository.getSpeciesById(raw.id).logK, raw.logK)
})
test('custom preparation rejects unselected basis and tampered normalized values', async () => {
  const { base, raw, session } = fixture(), repository = composeUserEquilibria(base, [raw])
  session.chemicalSystem.selectedSpecies = [raw.id]; session.calculationDefinition.output.speciesIds = [raw.id]
  const tampered = { ...repository, getSpeciesById: id => { const s = repository.getSpeciesById(id); if (id === raw.id) s.logK += 1; return s } }
  assert.equal((await prepareSessionPoint(session, tampered)).ok, false)
  session.chemicalSystem.selectedComponents = ['Ag+']
  session.calculationDefinition.componentConditions.pop()
  assert.equal((await prepareSessionPoint(session, repository)).diagnostics[0].code, 'unsupported-basis-transformation')
})
test('source edits invalidate previous results and increment scientific revision', () => {
  const { base, raw, session } = fixture(), repository = composeUserEquilibria(base, [raw])
  const next = updateLaboratorySession({ ...session, calculationResult: { marker: 'old' }, sweepResult: { marker: 'old' } }, { type: 'sources', repository }, base)
  assert.equal(next.revision, session.revision + 1); assert.equal(next.calculationResult, null); assert.equal(next.sweepResult, null)
})

test('user solvent terms preserve signs and use explicit water composition for discovery, not XX', () => {
  const water = demoSpecies.find(s => s.id === 'water')
  const base = createRepository({ species: [water], sources: [demoSource], elements: [{ symbol: 'H' }, { symbol: 'O' }],
    components: [{ id: 'H+', name: 'H+', role: 'proton', associations: [{ element: 'H', description: 'proton' }] }, { id: 'H2O', name: 'H2O', role: 'solvent', associations: [{ element: 'XX', description: 'water pseudo-element' }] }] })
  const { raw } = fixture()
  const source = references.cases.find(c => c.id === 'acid-base').sourceRecords[0]
  const user = { ...raw, terms: [{ componentId: 'H+', coefficient: -1 }, { componentId: 'H2O', coefficient: 1 }], logK: source.logK }
  const repo = composeUserEquilibria(base, [user])
  assert.deepEqual(repo.getSpeciesById(user.id).discoveryElements, ['H', 'O'])
  assert.deepEqual(repo.getSpeciesById(user.id).metadata.rawUserRecord, user)
  assert.deepEqual(importUserEquilibria(exportUserEquilibria([user], base), base), [user])
  assert.throws(() => composeUserEquilibria(base, [{ ...user, calculationResult: { ok: true } }]))
})
