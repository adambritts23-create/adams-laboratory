import { activityModels } from '../thermodynamics/schema.js'
import { candidateSpecies, solventElements } from './system.js'
import { getSystemCapabilities } from './components.js'
const finite = value => typeof value === 'number' && Number.isFinite(value)
const range = value => value && finite(value.min) && finite(value.max) && value.min < value.max

/** Structural and draft-input checks, not a proof of chemical completeness. */
export function validateChemicalSystem(system, repository) {
  const errors = []
  if (!system || typeof system !== 'object') return ['ChemicalSystem must be an object.']
  if (system.schemaVersion !== 1) errors.push('Unsupported ChemicalSystem version.')
  for (const key of ['selectedElements', 'selectedSpecies', 'analyticalComponents', 'enabledPhases']) {
    if (!Array.isArray(system[key])) errors.push(`${key} must be an array.`)
  }
  if (errors.length) return errors
  for (const key of ['selectedElements', 'selectedSpecies', 'enabledPhases']) if (new Set(system[key]).size !== system[key].length) errors.push(`${key} contains duplicates.`)
  const known = repository.getElements().map(e => e.symbol)
  if (system.selectedElements.some(s => !known.includes(s))) errors.push('Unknown selected element.')
  if (!Array.isArray(system.selectedComponents) || new Set(system.selectedComponents).size !== system.selectedComponents.length || system.selectedComponents.some(id => !repository.getComponentById(id))) errors.push('Unknown or duplicate source component selection.')
  const water = repository.getSpeciesById(system.solvent?.speciesId)
  if (!water || water.role !== 'solvent' || water.phase !== 'liquid' || system.solvent?.role !== 'solvent') errors.push('An explicit liquid solvent is required.')
  if (!system.enabledPhases.includes('liquid') || system.enabledPhases.some(p => !repository.getPhases().includes(p))) errors.push('Enabled phases must include the liquid solvent and use registered phases.')
  const candidates = candidateSpecies(system, repository)
  if (!system.selectedSpecies.length) errors.push('Select at least one solute species.')
  if (system.selectedSpecies.some(id => repository.getSpeciesById(id)?.elementalComposition === null)) errors.push('Imported selections lack product atom counts; analytical balances remain unresolved. No totals or solver results can be inferred from element links.')
  if (system.selectedSpecies.some(id => !candidates.some(s => s.id === id && s.role !== 'solvent'))) errors.push('Selected species contains an unknown, incompatible, disabled-phase or solvent record.')
  const implicit = solventElements(system, repository)
  const expected = new Set(system.selectedSpecies.flatMap(id => Object.keys(repository.getSpeciesById(id)?.elementalComposition ?? {})).filter(s => !implicit.includes(s)))
  const seen = new Set()
  for (const component of system.analyticalComponents) {
    if (!component || typeof component !== 'object') { errors.push('Invalid analytical component.'); continue }
    if (seen.has(component.element)) errors.push('Duplicate analytical total.')
    seen.add(component.element)
    if (component.kind !== 'element-total' || component.id !== `total:${component.element}` || !expected.has(component.element) || component.unit !== 'mol/L' || component.oxidationState !== null) errors.push('Unsupported analytical constraint; use an element total for a selected solute, excluding solvent H/O.')
    if (!finite(component.total) || component.total < 0) errors.push(`Enter a non-negative analytical total for ${component.element}.`)
  }
  if ([...expected].some(s => !seen.has(s))) errors.push('Missing analytical totals for selected solutes.')
  if (system.componentBasis !== null) errors.push('Component basis construction is not implemented; leave the basis unresolved.')
  if (!['fixed', 'range'].includes(system.pHMode)) errors.push('Choose fixed pH or pH range.')
  if (system.pHMode === 'fixed' && !finite(system.pHValue)) errors.push('Enter a finite fixed pH.')
  if (system.pHMode === 'range' && !range(system.pHRange)) errors.push('Enter a finite pH range with minimum less than maximum.')
  if (system.temperatureUnit !== 'C' || !finite(system.temperature) || system.temperature <= -273.15) errors.push('Temperature must be above −273.15 °C.')
  if (system.pressureUnit !== 'bar' || !finite(system.pressure) || system.pressure <= 0) errors.push('Pressure must be positive, in bar.')
  if (!['automatic', 'fixed'].includes(system.ionicStrengthMode)) errors.push('Choose automatic or fixed ionic strength.')
  if (system.ionicStrengthUnit !== 'mol/L') errors.push('Ionic strength unit must be mol/L.')
  if (system.ionicStrengthMode === 'fixed' && (!finite(system.fixedIonicStrength) || system.fixedIonicStrength < 0)) errors.push('Enter a non-negative fixed ionic strength.')
  if (system.activityModel !== null && !activityModels.includes(system.activityModel)) errors.push('Unknown activity model.')
  if (!['none', 'fixedEh', 'fixedPe', 'range'].includes(system.redoxMode)) errors.push('Unknown redox mode.')
  if (system.redoxMode !== 'none' && !getSystemCapabilities(system, repository).redox) errors.push('Redox control requires the source electron component in the chemical system.')
  if (['fixedEh', 'fixedPe'].includes(system.redoxMode) && !finite(system.redoxValue)) errors.push('Enter a finite redox value (future solver input).')
  if (system.redoxMode === 'range' && (!['Eh', 'pe'].includes(system.redoxRange?.quantity) || !range(system.redoxRange))) errors.push('Enter an ordered Eh or pe range (future solver input).')
  return errors
}
