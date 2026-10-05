import { getSystemCapabilities } from './components.js'
import { automaticSpeciesPolicy, usesAutomaticSolids, discoverReactionSet, reconcileAutomaticSpecies } from '../thermodynamics/compatibility.js'
/** React-independent ChemicalSystem v1. Numbers use explicit units; blank inputs are null. */
export function createChemicalSystem(repository = null) {
  return {
    schemaVersion: 1, selectedElements: ['U', 'C'], selectedSpecies: [], analyticalComponents: [],
    selectedComponents: repository?.getComponents().filter(c => ['proton', 'solvent'].includes(c.role)).map(c => c.id) ?? [],
    componentBasis: null, solvent: { speciesId: 'water', role: 'solvent' },
    pHMode: 'range', pHValue: null, pHRange: { min: 0, max: 14 },
    temperature: 25, temperatureUnit: 'C', pressure: 1, pressureUnit: 'bar',
    ionicStrengthMode: 'automatic', fixedIonicStrength: null, ionicStrengthUnit: 'mol/L',
    activityModel: null, redoxMode: 'none', redoxValue: null,
    redoxRange: { quantity: 'pe', min: null, max: null },
    enabledPhases: ['aqueous', 'solid', 'gas', 'liquid'],
  }
}
export function solventElements(system, repository) {
  return Object.keys(repository.getSpeciesById(system.solvent?.speciesId)?.elementalComposition ?? {})
}
export function elementRemovalBlock(system, symbol, repository) {
  if (solventElements(system, repository).includes(symbol)) return `${symbol} is required by the current solvent and cannot be removed.`
  const required = (system.selectedComponents ?? []).map(id => repository.getComponentById(id)).find(c => c && c.role !== 'basis-choice' && c.associations.some(a => a.element === symbol))
  return required ? `${symbol} participates in the selected special component ${required.name}; remove or change that special component first.` : null
}
export function candidateSpecies(system, repository, filters = {}) {
  return repository.getSpecies({ ...filters, elements: system.selectedElements,
    components: repository.getComponents().length ? system.selectedComponents ?? [] : undefined,
    implicitElements: solventElements(system, repository), phases: system.enabledPhases })
}

// Analytical constraints are drafted from selected solutes, never declared an independent basis.
function reconcile(system, repository) {
  const candidates = candidateSpecies(system, repository)
  const selectedSpecies = system.selectedSpecies.filter(id => candidates.some(s => s.id === id && s.role !== 'solvent'))
  const implicit = solventElements(system, repository)
  const symbols = [...new Set(selectedSpecies.flatMap(id => Object.keys(repository.getSpeciesById(id).elementalComposition ?? {})))].filter(symbol => !implicit.includes(symbol)).sort()
  const analyticalComponents = symbols.map(element => system.analyticalComponents.find(c => c.element === element)
    ?? { id: `total:${element}`, kind: 'element-total', element, total: null, unit: 'mol/L', oxidationState: null })
  return { ...system, selectedSpecies, analyticalComponents, componentBasis: null }
}

export function updateChemicalSystem(system, action, repository) {
  const explicitToggle=action.type==='toggleSelectedElement'
  if(explicitToggle) action={...action,type:'toggleElement'}
  if (system.speciesPolicy === automaticSpeciesPolicy) {
    if (action.type === 'toggleElement') {
      if (elementRemovalBlock(system, action.symbol, repository) || !repository.getElements().some(e => e.symbol === action.symbol)) return system
      if (!system.selectedElements.includes(action.symbol)) return { ...system, selectedElements: [...system.selectedElements, action.symbol] }
      if(!explicitToggle) return system
      const selectedComponents = system.selectedComponents.filter(id => {
        const c = repository.getComponentById(id)
        return c && (c.role !== 'basis-choice' || !c.associations.some(a => a.element === action.symbol))
      })
      const next=reconcileAutomaticSpecies({ ...system, selectedElements: system.selectedElements.filter(s => s !== action.symbol), selectedComponents }, repository)
      const compatible=new Set(discoverReactionSet(repository,next).rows.filter(r=>r.compatible).map(r=>r.species.id))
      return {...next,optionalSpecies:(next.optionalSpecies??[]).filter(id=>compatible.has(id)),excludedSpecies:(next.excludedSpecies??[]).filter(id=>compatible.has(id))}
    }
    if (action.type === 'toggleSpecies') {
      const row = discoverReactionSet(repository, system).rows.find(r => r.species.id === action.id)
      if (!row?.eligible) return system
      const field = row.species.phase === 'aqueous' || usesAutomaticSolids(system, repository) ? 'excludedSpecies' : 'optionalSpecies', ids = system[field] ?? []
      return reconcileAutomaticSpecies({ ...system, [field]: ids.includes(action.id) ? ids.filter(id => id !== action.id) : [...ids, action.id] }, repository)
    }
    if (action.type === 'toggleComponent') {
      const c = repository.getComponentById(action.id)
      if (!c || c.role === 'solvent') return system
      const removing = system.selectedComponents.includes(action.id)
      if (!removing && c.role === 'basis-choice' && !c.associations.every(a => [...system.selectedElements, ...solventElements(system, repository)].includes(a.element))) return system
      const next = { ...system, selectedComponents: removing ? system.selectedComponents.filter(id => id !== action.id) : [...system.selectedComponents, action.id] }
      if (!getSystemCapabilities(next, repository).redox) { next.redoxMode = 'none'; next.redoxValue = null; next.redoxRange = { quantity: 'pe', min: null, max: null } }
      return reconcileAutomaticSpecies(next, repository)
    }
    if (action.type === 'togglePhase') {
      if (action.phase === 'liquid' || !repository.getPhases().includes(action.phase)) return system
      return reconcileAutomaticSpecies({ ...system, enabledPhases: system.enabledPhases.includes(action.phase) ? system.enabledPhases.filter(p => p !== action.phase) : [...system.enabledPhases, action.phase] }, repository)
    }
    const next = updateManualSystem(system, action, repository)
    return next === system ? system : reconcileAutomaticSpecies(next, repository)
  }
  return updateManualSystem(system, action, repository)
}
function updateManualSystem(system, action, repository) {
  switch (action.type) {
    case 'toggleElement': {
      if (elementRemovalBlock(system, action.symbol, repository) || !repository.getElements().some(e => e.symbol === action.symbol)) return system
      const selectedElements = system.selectedElements.includes(action.symbol) ? system.selectedElements.filter(s => s !== action.symbol) : [...system.selectedElements, action.symbol]
      const selectedComponents = (system.selectedComponents ?? []).filter(id => { const c = repository.getComponentById(id); return c && (c.role !== 'basis-choice' || c.associations.filter(a => /^[A-Z][a-z]?$/.test(a.element)).every(a => selectedElements.includes(a.element) || solventElements(system, repository).includes(a.element))) })
      return reconcile({ ...system, selectedElements, selectedComponents }, repository)
    }
    case 'toggleComponent': {
      const c = repository.getComponentById(action.id)
      if (!c || c.role === 'solvent') return system
      const available = c.role !== 'basis-choice' || c.associations.every(a => [...system.selectedElements, ...solventElements(system, repository)].includes(a.element))
      if (!available) return system
      const selectedComponents = system.selectedComponents.includes(c.id) ? system.selectedComponents.filter(id => id !== c.id) : [...system.selectedComponents, c.id]
      const next = { ...system, selectedComponents }
      if (!getSystemCapabilities(next, repository).redox) { next.redoxMode = 'none'; next.redoxValue = null; next.redoxRange = { quantity: 'pe', min: null, max: null } }
      return reconcile(next, repository)
    }
    case 'toggleSpecies': {
      if (!candidateSpecies(system, repository).some(s => s.id === action.id && s.role !== 'solvent')) return system
      const selectedSpecies = system.selectedSpecies.includes(action.id) ? system.selectedSpecies.filter(id => id !== action.id) : [...system.selectedSpecies, action.id]
      return reconcile({ ...system, selectedSpecies }, repository)
    }
    case 'togglePhase': {
      if (action.phase === 'liquid' || !repository.getPhases().includes(action.phase)) return system
      const enabledPhases = system.enabledPhases.includes(action.phase) ? system.enabledPhases.filter(p => p !== action.phase) : [...system.enabledPhases, action.phase]
      return reconcile({ ...system, enabledPhases }, repository)
    }
    case 'total': return { ...system, analyticalComponents: system.analyticalComponents.map(c => c.id === action.id ? { ...c, total: action.value } : c) }
    case 'field': {
      if (action.field === 'redoxMode' && action.value !== 'none' && !getSystemCapabilities(system, repository).redox) return system
      const editable = ['pHMode', 'pHValue', 'pHRange', 'temperature', 'pressure', 'ionicStrengthMode', 'fixedIonicStrength', 'activityModel', 'redoxMode', 'redoxValue', 'redoxRange']
      return editable.includes(action.field) ? { ...system, [action.field]: action.value } : system
    }
    default: return system
  }
}
