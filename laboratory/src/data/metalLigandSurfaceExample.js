import { createWorkspaceSession } from '../session/laboratorySession.js'
import { createCalculationDefinition } from '../calculations/definition.js'
import { reconcileAutomaticSpecies, repositoryReactionCatalog } from '../thermodynamics/compatibility.js'

/** Closed aqueous ammonia inventory, ideal 25 °C reference; all compatible pure solids considered. */
export function metalLigandSurfaceExample(repository) {
  const names = ['Ni 2+', 'NH3', 'H+', 'H2O']
  const components = names.map(name => {
    const matches = repository.getComponents().filter(c => c.name === name)
    if (matches.length !== 1) throw new Error(`Ni–ammonia example requires an unambiguous bundled component: ${name}`)
    return matches[0]
  })
  const solids = repositoryReactionCatalog(repository).filter(s => s.phase === 'solid' && s.metadata.effectiveSourceReaction?.components?.length && s.metadata.effectiveSourceReaction.components.every(c => c.coefficient === 0 || names.includes(c.name)))
  if (solids.length !== 3) throw new Error('Ni–ammonia example requires the three audited hydroxide/oxide solids.')
  const session = createWorkspaceSession(repository, { solidPhasePolicy: 'explicit' })
  session.chemicalSystem = reconcileAutomaticSpecies({ ...session.chemicalSystem,
    selectedElements: ['Ni', 'N'], selectedComponents: components.map(c => c.id),
    enabledPhases: ['aqueous', 'solid', 'liquid'], optionalSpecies: solids.map(s => s.id), excludedSpecies: [],
  }, repository)
  if (!solids.every(s => session.chemicalSystem.selectedSpecies.includes(s.id))) throw new Error('An audited Ni solid lacks direct formation data.')
  const species = session.chemicalSystem.selectedSpecies.map(id => repository.getSpeciesById(id)).find(s => s.name === 'Ni(NH3)2+2')
  if (!species) throw new Error('The audited Ni(NH3)2+2 reaction is unavailable.')
  const d = createCalculationDefinition(session.chemicalSystem, repository)
  d.activityModel = 'ideal'
  d.dimensions = 2
  d.gridMultiSolid = true
  d.componentConditions = [
    { componentId: components[0].id, mode: 'T', quantity: 'total', unit: 'mol/kg-H2O', value: 1e-10 },
    { componentId: components[3].id, mode: 'LA', quantity: 'log-activity', unit: 'dimensionless', value: 0 },
  ]
  d.independentVariables = [
    { componentId: components[2].id, mode: 'LAV', quantity: 'pH', unit: 'dimensionless', range: { min: 6.5, max: 10 }, points: 33 },
    { componentId: components[1].id, mode: 'LTV', quantity: 'total', unit: 'mol/kg-H2O', range: { min: -2, max: 0 }, points: 17 },
  ]
  d.output = { ...d.output, type: 'log-concentration', componentId: components[0].id }
  session.calculationDefinition = d
  session.visualizationState = { workspace: 'calculation', dimensions: 2, plot: { ...d.output, gridSeriesId: species.id, live: false, visualizationMode: '3d', responseMode: 'surface-floor' } }
  return session
}
