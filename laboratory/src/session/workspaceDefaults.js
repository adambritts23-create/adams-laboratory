import { createCalculationDefinition } from '../calculations/definition.js'

export const workspaceDefaultsPolicy = 'ordinary-aqueous-ux-v1'
/** Initial UI requests only. Never applied to an existing condition or loaded session. */
export function newComponentDefault(condition, component) {
  return component?.role === 'basis-choice' && condition.mode === 'T' && condition.value === null
    ? { ...condition, value: 1 } : condition
}
export function newWorkspaceDefinition(system, repository) {
  const definition = createCalculationDefinition(system, repository)
  definition.componentConditions = definition.componentConditions.map(c => newComponentDefault(c, repository.getComponentById(c.componentId)))
  const proton = system.selectedComponents.map(id => repository.getComponentById(id)).find(c => c?.role === 'proton')
  if (proton) {
    definition.componentConditions = definition.componentConditions.filter(c => c.componentId !== proton.id)
    definition.independentVariables = [{ componentId: proton.id, mode: 'LAV', quantity: 'pH', unit: 'dimensionless', range: { min: 0, max: 14 }, points: 51 }]
  }
  definition.dimensions = 1
  return definition
}
