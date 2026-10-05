import { createWorkspaceSession } from '../session/laboratorySession.js'
import { createCalculationDefinition } from '../calculations/definition.js'
import { reconcileAutomaticSpecies, repositoryReactionCatalog } from '../thermodynamics/compatibility.js'

/** Setup only: source records supply every constant; the normal solver computes the curve. */
export function magnesiumSolubilityExample(repository) {
  const components = ['Mg 2+', 'H+', 'H2O'].map(name => repository.getComponents().find(c => c.name === name))
  const candidates = repositoryReactionCatalog(repository).filter(s => s.name === 'Mg(OH)2(cr)' && s.phase === 'solid')
  if (components.some(c => !c) || candidates.length !== 1) throw new Error('This example requires unambiguous Mg 2+, H+, H2O and Mg(OH)2(cr) records. Load the bundled database.')
  const [magnesium, proton] = components, solid = candidates[0]
  const session = createWorkspaceSession(repository, { solidPhasePolicy: 'explicit' })
  session.chemicalSystem = reconcileAutomaticSpecies({ ...session.chemicalSystem,
    selectedElements: ['Mg'], selectedComponents: components.map(c => c.id),
    enabledPhases: ['aqueous', 'solid', 'liquid'], optionalSpecies: [solid.id], excludedSpecies: [],
  }, repository)
  if (!session.chemicalSystem.selectedSpecies.includes(solid.id)) throw new Error('The crystalline hydroxide lacks supported direct formation data in this database.')
  const definition = createCalculationDefinition(session.chemicalSystem, repository)
  definition.componentConditions = definition.componentConditions.filter(c => c.componentId !== proton.id).map(c => c.componentId === magnesium.id ? { ...c, value: 0.001 } : c)
  definition.independentVariables = [{ componentId: proton.id, mode: 'LAV', quantity: 'pH', unit: 'dimensionless', range: { min: 9, max: 12 }, points: 61 }]
  definition.dimensions = 1
  definition.output = { ...definition.output, type: 'saturated-log-solubility', componentId: magnesium.id }
  session.calculationDefinition = definition
  session.visualizationState = { workspace: 'calculation', dimensions: 2, plot: { type: 'saturated-log-solubility', componentId: magnesium.id, live: false } }
  return session
}

/** Explicit mixed-system opt-in; no embedded constants or independent overlays. */
export function mixedCarbonateSolubilityExample(repository) {
  const names = ['Ca 2+', 'CO3 2-', 'Mg 2+', 'H+', 'H2O']
  const components = names.map(name => {
    const matches = repository.getComponents().filter(c => c.name === name)
    if (matches.length !== 1) throw new Error('Mixed example requires an unambiguous bundled component: ' + name)
    return matches[0]
  })
  const candidates = repositoryReactionCatalog(repository).filter(s => s.phase === 'solid' && s.metadata.effectiveSourceReaction?.components?.length && s.metadata.effectiveSourceReaction.components.every(c => c.coefficient === 0 || names.includes(c.name)))
  if (candidates.length !== 10) throw new Error('Mixed example requires the audited ten compatible bundled pure solids.')
  const session = createWorkspaceSession(repository, { solidPhasePolicy: 'explicit' })
  session.chemicalSystem = reconcileAutomaticSpecies({ ...session.chemicalSystem, selectedElements: ['Ca','C','Mg'], selectedComponents: components.map(c=>c.id), enabledPhases:['aqueous','solid','liquid'], optionalSpecies:candidates.map(s=>s.id), excludedSpecies:[] },repository)
  if (!candidates.every(s=>session.chemicalSystem.selectedSpecies.includes(s.id))) throw new Error('An audited solid lacks supported direct formation data.')
  const d = createCalculationDefinition(session.chemicalSystem,repository)
  d.componentConditions = d.componentConditions.filter(c=>c.componentId!==components[3].id).map(c=>{
    const i=components.findIndex(k=>k.id===c.componentId)
    return i<3 ? {...c,value:[0.1,0.1,0.001][i]} : c
  })
  d.activityModel='ideal'
  d.dimensions=1
  d.independentVariables=[{componentId:components[3].id,mode:'LAV',quantity:'pH',unit:'dimensionless',range:{min:0,max:14},points:29}]
  d.mixedSolubility={componentIds:[components[0].id,components[2].id]}
  d.output={...d.output,type:'saturated-log-solubility',componentId:components[0].id}
  session.calculationDefinition=d
  session.visualizationState={workspace:'calculation',dimensions:2,plot:{type:'saturated-log-solubility',componentId:components[0].id,live:false}}
  return session
}
