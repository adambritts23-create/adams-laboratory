const snapshots=new WeakSet()
export const isRepositorySnapshot=repository=>snapshots.has(repository)
import { validateDataset } from './validation.js'
import { phases as defaultPhases } from './schema.js'
import { componentRole } from '../chemistry/components.js'

export function speciesElements(species) {
  return species.elementalComposition === null ? species.discoveryElements : Object.keys(species.elementalComposition)
}
export function isElementCompatible(species, selectedElements, implicitElements = []) {
  const allowed = new Set([...selectedElements, ...implicitElements])
  const symbols = speciesElements(species)
  return symbols !== null && symbols.every(symbol => allowed.has(symbol))
}
export function matchesOxidationStates(species, filters = {}) {
  return Object.entries(filters).every(([symbol, selected]) => {
    if (!selected.length || !(speciesElements(species) ?? []).includes(symbol)) return true
    const states = species.oxidationStates?.[symbol]
    return !states ? selected.includes('unknown') : states.some(state => selected.includes(state.value))
  })
}

/** Synchronous snapshot repository contract. Backend adapters load a validated snapshot first. */
export function createRepository({ species, elements, sources, components = [], phases = defaultPhases }) {
  const diagnostics = validateDataset(species, { elementSymbols: elements.map(e => e.symbol), allowedPhases: phases })
  if (diagnostics.some(d => d.severity === 'error')) {
    const error = new Error(`Invalid thermodynamic dataset: ${diagnostics.map(d => `${d.recordId}.${d.path}: ${d.message}`).join('; ')}`)
    error.diagnostics = diagnostics
    throw error
  }
  if (!Array.isArray(sources) || sources.some(s => !s || typeof s.id !== 'string' || !s.id.trim() || typeof s.name !== 'string' || !s.name.trim()) || new Set(sources.map(s => s.id)).size !== sources.length) {
    throw new Error('Source registry requires unique IDs and non-empty names.')
  }
  if (species.some(s => !sources.some(source => source.id === s.sourceDatabase))) throw new Error('Every species sourceDatabase must exist in the source registry.')
  if (!Array.isArray(components) || components.some(c => !c || typeof c.id !== 'string' || !c.id || typeof c.name !== 'string' || !c.name || !['electron', 'proton', 'solvent', 'basis-choice'].includes(c.role) || !Array.isArray(c.associations) || c.associations.some(a => !a || typeof a.element !== 'string' || typeof a.description !== 'string')) || new Set(components.map(c => c.id)).size !== components.length) throw new Error('Invalid or duplicate source component identities.')
  if (components.some(c => c.role !== componentRole(c.name))) throw new Error('Component role must match its explicit source identity; redox capability cannot be assigned arbitrarily.')
  // Isolate source and callers from mutations, including original provenance snapshots.
  const snapshot = structuredClone({ species, elements, sources, components, phases })
  const copy = (value) => structuredClone(value)
  function getSpecies({ elements: selected, components: componentIds, sourceDatabase, implicitElements = [], phases: enabled, oxidationStates = {}, text = '', includeDeprecated = false, role } = {}) {
    const query = text.trim().toLocaleLowerCase()
    const componentNames = componentIds && new Set(snapshot.components.filter(c => componentIds.includes(c.id)).map(c => c.name))
    return copy(snapshot.species.filter(s => (includeDeprecated || !s.deprecated)
      && (!selected || isElementCompatible(s, selected, implicitElements))
      && (!sourceDatabase || s.sourceDatabase === sourceDatabase)
      && (!componentNames || s.role === 'solvent' || (s.metadata.effectiveSourceReaction?.components && s.metadata.effectiveSourceReaction.components.every(c => c.coefficient === 0 || componentNames.has(c.name))))
      && (!enabled || enabled.includes(s.phase)) && (!role || s.role === role)
      && matchesOxidationStates(s, oxidationStates)
      && `${s.id} ${s.name} ${s.displayName} ${s.formula}`.toLocaleLowerCase().includes(query)))
  }
  const repository=Object.freeze({
    getElements: () => copy(snapshot.elements), getSources: () => copy(snapshot.sources), getPhases: () => copy(snapshot.phases),
    getDiagnostics: () => copy(diagnostics),
    getSpeciesIdentities: () => copy(snapshot.species.map(({ id, name }) => ({ id, name }))),
    getComponents: () => copy(snapshot.components.filter(c => !c.deprecated)),
    getComponentById: id => copy(snapshot.components.find(c => c.id === id && !c.deprecated) ?? null),
    getComponentsByElement: symbol => copy(snapshot.components.filter(c => !c.deprecated && c.associations.some(a => a.element === symbol))),
    getSpeciesByComponents: (components, options = {}) => getSpecies({ ...options, components }),
    getSpeciesBySource: sourceDatabase => getSpecies({ sourceDatabase }),
    getSpecies, getSpeciesById: id => copy(snapshot.species.find(s => s.id === id) ?? null),
    getSpeciesByElements: (elements, options = {}) => getSpecies({ ...options, elements }),
    getSpeciesByPhase: phase => getSpecies({ phases: [phase] }),
    getSpeciesByOxidationState: (symbol, value) => getSpecies().filter(s => (speciesElements(s) ?? []).includes(symbol) && matchesOxidationStates(s, { [symbol]: [value] })),
  })
  snapshots.add(repository)
  return repository
}