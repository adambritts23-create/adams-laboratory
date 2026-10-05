import { thermodynamicRepository } from '../src/thermodynamics/index.js'
import { createRepository } from '../src/thermodynamics/repository.js'
import { references } from './pointHelpers.js'
import { userReferenceState } from '../src/thermodynamics/userEquilibria.js'
export const stamp = '2026-09-06T00:00:00Z'
export function component(name = 'Ag+', symbol = 'Ag') {
  return { schemaVersion: 1, id: `user-component:${symbol}`, name, associations: [{ element: symbol, description: 'Explicit test association' }],
    sourceType: 'user-defined', citation: 'Path equivalence with retained official reference', notes: 'Test source identity; no new constant.', createdAt: stamp, modifiedAt: stamp }
}
export function customFixture() {
  const water = thermodynamicRepository.getSpeciesById('water')
  const base = createRepository({ species: [water], elements: [{ symbol: 'H' }, { symbol: 'O' }], sources: thermodynamicRepository.getSources() })
  const source = references.cases.find(c => c.id === 'fixed-activity').sourceRecords[0]
  const components = [component(), component('Cl-', 'Cl')]
  const record = { schemaVersion: 1, id: 'user:AgCl-path', productId: 'AgCl', displayName: 'AgCl', phase: 'aqueous', charge: null,
    terms: components.map(c => ({ componentId: c.id, coefficient: 1 })), logK: source.logK, temperatureK: 298.15, pressureBar: null,
    referenceState: userReferenceState, sourceType: 'user-defined', citation: source.provenance.resolvedCitation,
    notes: 'Same actual source logK and signed terms as the unchanged fixed-activity reference. Only source pathway differs.', createdAt: stamp, modifiedAt: stamp }
  return { base, components, record }
}
