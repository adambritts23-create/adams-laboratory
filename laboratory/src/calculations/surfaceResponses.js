import { discoverReactionSet, usesAutomaticSolids } from '../thermodynamics/compatibility.js'
import { sourcePhase } from '../thermodynamics/importers/spana/names.js'

/** UI eligibility only. The existing prepared-system output preflight remains authoritative. */
export function surfaceResponses(chemicalSystem, definition, repository) {
  const components = chemicalSystem.selectedComponents.map(id => repository.getComponentById(id)).filter(Boolean)
  const selected = new Set(chemicalSystem.selectedSpecies)
  const products = discoverReactionSet(repository, chemicalSystem).rows
    .filter(r => selected.has(r.species.id) && r.eligible && definition.enabledPhases.includes(r.species.phase)).map(r => r.species)
  const ordinary = components.filter(c => c.role === 'basis-choice' && sourcePhase(c.name) === 'aqueous')
  const species = [
    ...components.filter(c => !['solvent', 'electron'].includes(c.role) && sourcePhase(c.name) === 'aqueous').map(c => ({ id: c.id, name: c.name, phase: 'aqueous', free: true })),
    ...products.filter(p => p.phase === 'aqueous').map(p => ({ id: p.id, name: p.name, phase: p.phase })),
  ]
  const solids = products.filter(p => p.phase === 'solid')
  const coefficient = (p, c) => p.metadata.effectiveSourceReaction.components.find(t => t.name === c.name)?.coefficient ?? 0
  const solubilityComponents = ordinary.filter(c =>
    (definition.gridMultiSolid || usesAutomaticSolids(chemicalSystem, repository) ? solids.some(s => coefficient(s, c) > 0) : solids.length === 1 && coefficient(solids[0], c) > 0)
    && products.every(p => coefficient(p, c) >= 0))
  const choices = []
  const add = (type, label, group, target, targets) => { if (!target || targets.length) choices.push({ type, label, group, target, targets }) }
  add('concentration', 'Species concentration', 'Aqueous species', 'species', species)
  add('log-concentration', 'Species log concentration', 'Aqueous species', 'species', species)
  add('log-activity', 'Species log activity', 'Aqueous species', 'species', species)
  add('total-dissolved', 'Total dissolved component', 'Dissolved component', 'component', ordinary)
  add('log-total-dissolved', 'Log total dissolved component', 'Dissolved component', 'component', ordinary)
  add('solid-amount', 'Solid amount', 'Solid / solubility', 'solid', solids)
  add('saturated-log-solubility', 'Log solubility at saturation', 'Solid / solubility', 'component', solubilityComponents)
  const proton = components.find(c => c.role === 'proton')
  if (proton && !definition.independentVariables.some(a => a.componentId === proton.id)
    && definition.componentConditions.some(c => c.componentId === proton.id && c.mode === 'T')) {
    add('calculated-pH', 'Calculated pH', 'Calculated coordinate', null, [])
  }
  return choices
}

export function selectSurfaceResponse(choice, plot) {
  const key = choice.target === 'component' ? 'componentId' : 'gridSeriesId'
  const retained = choice.targets.some(t => t.id === plot[key]) ? plot[key] : null
  return { type: choice.type, componentId: null, gridSeriesId: null,
    ...(choice.target ? { [key]: retained ?? (choice.targets.length === 1 ? choice.targets[0].id : null) } : {}),
    visibleIds: null, classify: false, colorRange: null, surfaceZRange: null, yRange: null }
}
