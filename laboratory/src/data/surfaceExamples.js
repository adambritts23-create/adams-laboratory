import { createWorkspaceSession } from '../session/laboratorySession.js'
import { createCalculationDefinition } from '../calculations/definition.js'
import { reconcileAutomaticSpecies } from '../thermodynamics/compatibility.js'
import { mixedCarbonateSolubilityExample } from './solubilityExample.js'

/** Independent inputs and a separately derived response; all constants come from the repository. */
export function independentSurfaceExample(repository, mixed = false) {
  const names = mixed ? ['Ca 2+', 'CO3 2-', 'Mg 2+', 'H+', 'H2O'] : ['CO3 2-', 'H+', 'H2O']
  const components = names.map(name => {
    const matches = repository.getComponents().filter(c => c.name === name)
    if (matches.length !== 1) throw new Error(`Surface example requires an unambiguous bundled component: ${name}`)
    return matches[0]
  })
  const session = mixed ? mixedCarbonateSolubilityExample(repository) : createWorkspaceSession(repository, { solidPhasePolicy: 'explicit' })
  if (!mixed) session.chemicalSystem = reconcileAutomaticSpecies({ ...session.chemicalSystem,
    selectedElements: ['C'], selectedComponents: components.map(c => c.id),
    enabledPhases: ['aqueous', 'liquid'], optionalSpecies: [], excludedSpecies: [],
  }, repository)
  const d = mixed ? session.calculationDefinition : createCalculationDefinition(session.chemicalSystem, repository)
  delete d.mixedSolubility
  if (mixed) d.gridMultiSolid = true
  const proton = components.find(c => c.name === 'H+'), carbonate = components.find(c => c.name === 'CO3 2-')
  d.componentConditions = d.componentConditions.filter(c => ![proton.id, carbonate.id].includes(c.componentId))
  d.activityModel = 'ideal'
  d.dimensions = 2
  d.independentVariables = [
    { componentId: proton.id, mode: 'LAV', quantity: 'pH', unit: 'dimensionless', range: { min: mixed ? 6 : 4, max: 12 }, points: mixed ? 13 : 9 },
    { componentId: carbonate.id, mode: 'LTV', quantity: 'total', unit: 'mol/kg-H2O', range: { min: mixed ? -2 : -6, max: mixed ? -1 : -2 }, points: 5 },
  ]
  const bicarbonate = session.chemicalSystem.selectedSpecies.map(id => repository.getSpeciesById(id)).find(s => s.name === 'HCO3-')
  if (!bicarbonate) throw new Error('The surface example requires supported bicarbonate formation data.')
  d.output = { ...d.output, type: mixed ? 'total-dissolved' : 'log-concentration', componentId: mixed ? components[0].id : carbonate.id }
  session.calculationDefinition = d
  session.visualizationState = { workspace: 'calculation', dimensions: 2, plot: { ...d.output, gridSeriesId: mixed ? 'total-dissolved' : bicarbonate.id, live: false } }
  return session
}
