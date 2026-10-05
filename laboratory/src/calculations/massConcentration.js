import { atomicWeights, atomicWeightSource } from '../data/atomicWeights.js'
const unavailable = message => ({ ok: false, state: 'unavailable', code: 'mass-conversion-unavailable', value: null, message })

/** Composition is explicit atom-count metadata for this component, never a parsed label. */
export function componentMolarMass(composition) {
  if (typeof composition?.source !== 'string' || !composition.source.trim() || !composition.atoms || typeof composition.atoms !== 'object' || Array.isArray(composition.atoms)) return unavailable('Explicit atom counts and their composition source are required.')
  const entries = Object.entries(composition.atoms)
  if (!entries.length || entries.some(([element, count]) => !Object.hasOwn(atomicWeights, element) || !Number.isInteger(count) || count <= 0 || count > 10000)) return unavailable('Positive integer atom counts with supported sourced atomic weights are required.')
  const value = entries.reduce((sum, [element, count]) => sum + atomicWeights[element] * count, 0)
  return { ok: true, value, unit: 'g/mol', composition: structuredClone(composition), atomicWeightSource, convention: 'CIAAW abridged normal-material atomic weights 2024; not isotope-specific' }
}
export function convertMassInput(input) {
  const mass = componentMolarMass(input?.composition)
  if (!mass.ok) return mass
  if (input.unit !== 'g/L' || typeof input.componentId !== 'string' || !input.componentId || typeof input.componentName !== 'string' || !input.componentName.trim() || !Number.isFinite(input.value) || input.value < 0) return unavailable('A nonnegative finite g/L value and explicit component identity are required.')
  const molarity = input.value / mass.value
  if (!Number.isFinite(molarity) || (input.value !== 0 && molarity === 0)) return unavailable('Mass conversion exceeds numeric range.')
  const basis = input.basis
  if (basis?.kind === 'approximate') return unavailable('Approximate dilute-solution conversion is not implemented.')
  if (basis?.kind !== 'solvent-mass-per-solution-volume' || !Number.isFinite(basis.kgWaterPerL) || basis.kgWaterPerL <= 0 || typeof basis.source !== 'string' || !basis.source.trim() || basis.constantAcrossConditions !== true) return { ...unavailable('Supply measured/defined kg H₂O per L solution and its source, valid across this calculation. Density alone is insufficient.'), molarMass: mass, molarity: { value: molarity, unit: 'mol/L-solution' } }
  const value = molarity / basis.kgWaterPerL
  if (!Number.isFinite(value) || (input.value !== 0 && value === 0)) return unavailable('Solver-basis conversion exceeds numeric range.')
  return { ok: true, state: 'defined', value, unit: 'mol/kg-H2O', original: structuredClone(input), molarMass: mass, molarity: { value: molarity, unit: 'mol/L-solution' }, basis: structuredClone(basis), approximate: false,
    warnings: ['Defined relative to declared composition, conventional molar mass and supplied solvent-mass basis; no density or dilute approximation inferred.'] }
}
export function massConditionInput(condition) {
  const conversion = convertMassInput(condition.massInput?.original)
  if (!conversion.ok || condition.mode !== 'T' || condition.unit !== 'mol/kg-H2O' || conversion.original.componentId !== condition.componentId || conversion.value !== condition.value || JSON.stringify(conversion) !== JSON.stringify(condition.massInput)) throw new Error('Mass-input provenance does not match this fixed component total; reapply a valid conversion. g/L axes are not supported.')
  return conversion
}
