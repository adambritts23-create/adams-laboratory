import assert from 'node:assert/strict'
import { createCalculationDefinition } from '../src/calculations/definition.js'
import { componentRole } from '../src/chemistry/components.js'
import { componentBalanceTolerance } from '../src/solver/validationContract.js'

export function definitionFor(system, input) {
  const chemical = { selectedComponents: system.components.map(c => c.id), selectedSpecies: system.products.map(p => p.id), temperature: 25, pressure: 1, enabledPhases: ['aqueous', 'solid', 'liquid'] }
  const repository = { getComponentById: id => { const c = system.components.find(c => c.id === id); return { ...c, role: componentRole(c.name) } } }
  const d = createCalculationDefinition(chemical, repository)
  d.activityModel = 'ideal'
  d.componentConditions = input.constraints.map(c => ({ componentId: c.componentId, mode: c.kh === 1 ? 'T' : 'LA', quantity: c.kh === 1 ? 'total' : 'log-activity', unit: c.kh === 1 ? 'mol/kg-H2O' : 'dimensionless', value: c.value }))
  return d
}
export function vary(d, componentId, mode, min, max, points = 5, quantity = mode === 'LAV' ? 'log-activity' : 'total') {
  const copy = structuredClone(d)
  copy.componentConditions = copy.componentConditions.filter(c => c.componentId !== componentId)
  copy.independentVariables = [{ componentId, mode, quantity, unit: quantity === 'Eh' ? 'V-SHE' : mode === 'LAV' ? 'dimensionless' : 'mol/kg-H2O', range: { min, max }, points }]
  return copy
}

// Reconstruct from output amounts, coefficients and targets, not residual fields
// or the solver's convergence flag. This is mathematical verification, not oracle data.
export function reconstruct(system, input, result) {
  assert.ok(result.ok, JSON.stringify(result))
  const n = system.components.length
  const smallest = Math.min(1e-6, ...input.constraints.filter(c => c.kh === 1 && c.value !== 0).map(c => Math.abs(c.value)))
  system.components.forEach((component, i) => {
    const c = input.constraints[i]
    const amount = component.role === 'water' ? 0 : result.concentrations[i] + system.products.reduce((v, p, j) => v + p.coefficients[i] * result.concentrations[n + j], 0)
    if (c.kh === 1) assert.ok(Math.abs(amount - c.value) <= componentBalanceTolerance(c.value, smallest))
    else assert.equal(result.logActivities[i], c.value)
    if (!component.suppressed) assert.ok(Math.abs(Math.log10(result.concentrations[i]) - result.logActivities[i]) < 1e-10)
  })
  system.products.forEach((p, j) => {
    const log = p.logBeta + p.coefficients.reduce((v, coefficient, i) => v + coefficient * result.logActivities[i], 0)
    const amount = result.concentrations[n + j]
    if (p.phase === 'aqueous') assert.ok(Math.abs(Math.log10(amount) - log) < 1e-10)
    else { assert.ok(amount >= 0); assert.ok(amount > 0 ? Math.abs(log) <= 1e-12 : log <= 1e-12) }
  })
}
