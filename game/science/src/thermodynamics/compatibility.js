import { isSupportedFormationSource } from './formationSupport.js'

export const automaticSpeciesPolicy = 'repository-compatible-v1'
export const automaticSolidPolicy = 'automatic-compatible-solids-v1'
/** Ordinary aqueous scope only; an electron basis retains the existing explicit policy. */
export function usesAutomaticSolids(system, repository) {
  const components = system.selectedComponents.map(id => repository.getComponentById(id))
  return system.solidPhasePolicy === automaticSolidPolicy && system.enabledPhases.includes('aqueous')
    && components.some(c => c?.role === 'solvent') && !components.some(c => c?.role === 'electron')
}
const indexes = new WeakMap()
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value)
  }
  return value
}
function index(repository) {
  if (!indexes.has(repository)) {
    const catalog = freeze(repository.getSpecies())
    const records = catalog.map(species => {
      const terms = species.metadata.effectiveSourceReaction?.components
      const valid = Array.isArray(terms) && terms.some(t => t.coefficient !== 0) && terms.every(t => typeof t.name === 'string' && Number.isFinite(t.coefficient)) && new Set(terms.map(t => t.name)).size === terms.length
      return { species, valid, terms: valid ? terms.filter(t => t.coefficient !== 0) : [], supported: valid && Number.isFinite(species.logK) && isSupportedFormationSource(species, repository) }
    })
    indexes.set(repository, { catalog, records, components: repository.getComponents(), key: null, result: null })
  }
  return indexes.get(repository)
}
/** One immutable catalog per repository generation; no repeated full-dataset cloning. */
export function repositoryReactionCatalog(repository) { return index(repository).catalog }

/** Exact signed source terms, never formula/element inference or iterative reaction closure. */
export function discoverReactionSet(repository, system) {
  const cache = index(repository)
  const key = JSON.stringify([system.selectedComponents, system.enabledPhases, system.solvent?.speciesId, system.excludedSpecies ?? [], system.optionalSpecies ?? [], system.solidPhasePolicy])
  if (cache.key === key) return cache.result
  const chosen = cache.components.filter(c => system.selectedComponents.includes(c.id))
  const names = new Set(chosen.map(c => c.name)), special = new Set(chosen.filter(c => ['proton', 'solvent'].includes(c.role)).map(c => c.name))
  const proton = new Set(chosen.filter(c => c.role === 'proton').map(c => c.name))
  const automaticSolids = usesAutomaticSolids(system, repository)
  const rows = cache.records.map(({ species, terms, supported, valid }) => {
    const missing = terms.filter(t => !names.has(t.name)).map(t => t.name)
    const identity = species.role === 'solvent' || names.has(species.name)
    const compatible = identity || (valid && !missing.length)
    const eligible = !identity && compatible && supported && system.enabledPhases.includes(species.phase) && ['aqueous', 'solid'].includes(species.phase)
    const excluded = (system.excludedSpecies ?? []).includes(species.id)
    const included = eligible && (species.phase === 'aqueous' || automaticSolids ? !excluded : !excluded && (system.optionalSpecies ?? []).includes(species.id))
    const status = identity ? (species.role === 'solvent' ? 'Solvent identity' : 'Component / special identity')
      : !valid ? 'Unsupported or missing reaction terms'
        : !compatible ? `Missing component: ${missing.join(', ')}`
        : !['aqueous', 'solid'].includes(species.phase) ? 'Unsupported phase'
          : !supported ? 'Unsupported source formation data'
            : !system.enabledPhases.includes(species.phase) ? 'Disabled phase'
              : species.phase === 'solid' ? (excluded ? 'Explicitly excluded solid' : included ? (automaticSolids ? 'Compatible solid considered automatically' : 'Explicitly included solid') : 'Solid not selected under explicit policy')
                : excluded ? 'User-excluded from equilibrium' : 'Auto-included aqueous'
    return { species, missing, compatible, eligible, included, excluded, supported, status,
      acidBase: eligible && terms.some(t => proton.has(t.name)) && terms.every(t => special.has(t.name)) }
  })
  cache.key = key
  cache.result = freeze({ rows, automaticSolids, selectedSpecies: rows.filter(r => r.included).map(r => r.species.id),
    aqueousCount: rows.filter(r => r.included && r.species.phase === 'aqueous').length,
    solidCount: rows.filter(r => r.included && r.species.phase === 'solid').length,
    excludedCount: rows.filter(r => r.eligible && !r.included && r.species.phase === 'aqueous').length,
    gasCount: rows.filter(r => r.compatible && r.species.phase === 'gas').length })
  return cache.result
}
export function reconcileAutomaticSpecies(system, repository) {
  if (system.speciesPolicy !== automaticSpeciesPolicy) return system
  return { ...system, selectedSpecies: discoverReactionSet(repository, system).selectedSpecies }
}

/** Snapshot disclosure alongside the exact prepared inventory; never an alternative candidate list. */
export function phaseSelectionSummary(repository, system) {
  const set = discoverReactionSet(repository, system)
  const candidates = set.rows.filter(r => r.compatible && r.supported && r.species.phase === 'solid')
  return { policy: set.automaticSolids ? automaticSolidPolicy : 'explicit-legacy',
    compatible: candidates.map(r => ({ id: r.species.id, name: r.species.name })),
    includedIds: candidates.filter(r => system.selectedSpecies.includes(r.species.id)).map(r => r.species.id),
    excludedIds: candidates.filter(r => r.excluded || !system.enabledPhases.includes('solid')).map(r => r.species.id) }
}
