import fs from 'node:fs'
import { performance } from 'node:perf_hooks'
import { loadSnapshotFile } from '../src/components/databaseLoading.js'
import { validateDataset } from '../src/thermodynamics/validation.js'
import { createRepository } from '../src/thermodynamics/repository.js'
import { elementStates } from '../src/data/periodicTable.js'
import { composeUserChemistry } from '../src/thermodynamics/userComponents.js'
import { candidateSpecies } from '../src/chemistry/system.js'
import { createWorkspaceSession } from '../src/session/laboratorySession.js'
import { userReferenceState } from '../src/thermodynamics/userEquilibria.js'

// LOCAL DEVELOPMENT DATA MUST NOT BE ASSUMED REDISTRIBUTABLE.
// Reports timing/counts only, never the snapshot payload or source record constants.
const file = '.local/spana-components.json', bytes = fs.statSync(file).size
const loaded = await loadSnapshotFile({ size: bytes, name: 'configured snapshot', text: async () => fs.readFileSync(file, 'utf8') }, () => {})
const snapshot = JSON.parse(fs.readFileSync(file, 'utf8')), repository = loaded.repository, components = repository.getComponents()
const measure = (fn, n = 3) => { const times = []; for (let i = 0; i < n; i++) { const t = performance.now(); fn(); times.push(performance.now() - t) } return { runs: n, meanMs: times.reduce((a, b) => a + b) / n, minMs: Math.min(...times), maxMs: Math.max(...times) } }
const session = createWorkspaceSession(repository)
session.chemicalSystem.selectedElements = ['C']
session.chemicalSystem.selectedComponents = components.filter(c => ['H+', 'H2O', 'CO3 2-'].includes(c.name)).map(c => c.id)
const stamp = new Date().toISOString()
const custom = { schemaVersion: 1, id: 'user-component:perf-He', name: 'He', associations: [{ element: 'He', description: 'Explicit performance-test identity only' }], sourceType: 'user-defined', citation: null, notes: 'No thermodynamic data assigned.', createdAt: stamp, modifiedAt: stamp }
const original = snapshot.species.find(s => s.name === 'HCO3-')
const reaction = { schemaVersion: 1, id: 'user:performance-copy', productId: 'Bicarbonate performance copy', displayName: 'Bicarbonate performance copy', phase: original.phase, charge: null,
  terms: original.metadata.effectiveSourceReaction.components.filter(t => t.coefficient !== 0).map(t => ({ componentId: components.find(c => c.name === t.name).id, coefficient: t.coefficient })),
  logK: original.logK, temperatureK: 298.15, pressureBar: null, referenceState: userReferenceState, sourceType: 'user-defined', citation: original.citation,
  notes: 'Performance-only copy of retained source definition, not an independent thermodynamic assertion.', createdAt: stamp, modifiedAt: stamp }
const report = {
  snapshotBytes: bytes, speciesRecords: loaded.recordCount, importedRecords: loaded.importedRecordCount, solventRecords: loaded.solventRecordCount, componentForms: components.length,
  nodeFileLoading: loaded.timings,
  independentDatasetValidation: measure(() => validateDataset(snapshot.species, { elementSymbols: snapshot.elements.map(e => e.symbol), allowedPhases: repository.getPhases() })),
  repositoryConstructionIncludingValidationAndIsolation: measure(() => createRepository(snapshot)),
  elementAvailabilityFromCachedComponents: measure(() => elementStates(components), 100),
  carbonateCandidateFilteringIncludingReturnedCopies: measure(() => candidateSpecies(session.chemicalSystem, repository), 30),
  customComponentCollectionUpdateIncludingRepositoryIsolation: measure(() => composeUserChemistry(repository, [custom], [])),
  customReactionCollectionUpdateIncludingRepositoryIsolation: measure(() => composeUserChemistry(repository, [], [reaction])),
  combinedCustomCollectionUpdateIncludingRepositoryIsolation: measure(() => composeUserChemistry(repository, [custom], [reaction])),
  note: 'Node measurements on local hardware, not browser frame timings. Repository construction includes its required validation and structured-clone isolation. Dataset validation is measured independently; do not subtract timings as a precise decomposition.'
}
fs.writeFileSync('docs/phase8-2-performance.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
