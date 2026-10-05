/** Declarative requests only: this module does not calculate equilibrium. */
import { massConditionInput } from './massConcentration.js'
export const outputTypes = ['total-fraction', 'aqueous-fraction', 'saturated-log-solubility', 'analytical-total', 'concentration', 'total-dissolved', 'log-total-dissolved', 'solid-amount', 'predominance', 'fraction', 'log-solubility', 'log-concentration', 'relative-log-activity', 'calculated-redox', 'calculated-pH', 'log-activity', 'hydrogen-affinity']
export const conditionModes = Object.freeze({ T: { hur: 1, kh: 1, varied: false }, TV: { hur: 2, kh: 1, varied: true }, LTV: { hur: 3, kh: 1, varied: true }, LA: { hur: 4, kh: 2, varied: false }, LAV: { hur: 5, kh: 2, varied: true } })
export const concentrationUnits = ['mol/kg-H2O', 'mol/L-solution']
export const activityModels = ['unspecified', 'ideal', 'Davies', 'SIT', 'simplified-HKF']

export function createCalculationDefinition(system, repository) {
  return {
    schemaVersion: 1, output: { type: 'log-concentration', speciesIds: [...system.selectedSpecies], componentId: null, referenceSpeciesId: null, redoxQuantity: 'pe' },
    componentConditions: (system.selectedComponents ?? []).map(id => {
      const component = repository.getComponentById(id)
      const total=component?.role==='basis-choice'
      return { componentId: id, mode: total?'T':'LA', quantity: total?'total':component?.role === 'proton' ? 'pH' : 'log-activity', unit: total?'mol/kg-H2O':'dimensionless', value: component?.role === 'solvent' ? 0 : null }
    }),
    independentVariables: [],
    temperature: { value: system.temperature, unit: 'C' }, pressure: { value: system.pressure, unit: 'bar' },
    ionicStrength: { mode: 'automatic', value: null, unit: 'mol/kg-H2O' }, activityModel: 'ideal',
    enabledPhases: [...system.enabledPhases], sampling: { strategy: 'cartesian', maxPoints: 10000 },
  }
}

export function createCondition(component, mode = 'T', quantity = null) {
  const total = ['T', 'TV', 'LTV'].includes(mode)
  return { componentId: component.id, mode, quantity: quantity ?? (total ? 'total' : 'log-activity'),
    unit: total ? 'mol/kg-H2O' : quantity === 'Eh' ? 'V-SHE' : 'dimensionless',
    ...(conditionModes[mode]?.varied ? { range: { min: null, max: null }, points: 51 } : { value: component.role === 'solvent' ? 0 : null }) }
}

/** Input coordinate transformation, not a solver or concentration/activity conversion. */
export function toSourceInput(condition, coordinate, temperatureC) {
  const spec = conditionModes[condition.mode]
  if (condition.massInput) { massConditionInput(condition); if (coordinate !== condition.value) throw new Error('Mass conversion applies only to its declared fixed value.') }
  if (!spec || !Number.isFinite(coordinate)) throw new Error('A valid condition and finite coordinate are required.')
  if (spec.kh === 1 && condition.unit !== 'mol/kg-H2O') throw new Error('Molarity cannot be passed as molality; solvent mass per solution volume is required.')
  if (condition.quantity === 'Eh' && (!Number.isFinite(temperatureC) || temperatureC <= -273.15)) throw new Error('Eh conversion requires a valid temperature.')
  // EC.tablePrint physical constants; Spana.MainFrame uses older rounded R/F values.
  const value = condition.quantity === 'pH' || condition.quantity === 'pe' ? -coordinate
    : condition.quantity === 'Eh' ? -coordinate / (8.31446261815324 * Math.LN10 * (temperatureC + 273.15) / Number('96485.3321233100184'))
      : condition.mode === 'LTV' ? 10 ** coordinate : coordinate
  if (!Number.isFinite(value) || (condition.mode === 'LTV' && value === 0)) throw new Error('Input coordinate is outside the representable range.')
  return { hur: spec.hur, kh: spec.kh, field: spec.kh === 1 ? 'tot' : 'logA', value }
}

export function validateCalculationDefinition(definition, system, repository, { allowDescending = false } = {}) {
  const errors = []
  if (!definition || definition.schemaVersion !== 1) return ['Unsupported CalculationDefinition version.']
  const selected = new Set(system.selectedComponents ?? [])
  const components = [...selected].map(id => repository.getComponentById(id)).filter(Boolean)
  const hasRole = role => components.some(c => c.role === role)
  if (!outputTypes.includes(definition.output?.type)) errors.push('Unknown calculated output quantity.')
  if (['calculated-redox'].includes(definition.output?.type) && !hasRole('electron')) errors.push('Calculated redox requires an electron component.')
  if (['calculated-pH', 'hydrogen-affinity'].includes(definition.output?.type) && !hasRole('proton')) errors.push('This output requires a proton component.')
  if (!Array.isArray(definition.componentConditions) || !Array.isArray(definition.independentVariables)) return [...errors, 'Condition and independent-variable arrays are required.']
  const conditions = [...definition.componentConditions, ...definition.independentVariables]
  const seen = new Set()
  for (const condition of conditions) {
    if (!condition || typeof condition !== 'object') { errors.push('Invalid condition.'); continue }
    const component = repository.getComponentById(condition.componentId)
    if (condition.massInput) {
      try { massConditionInput(condition); if (component?.name !== condition.massInput.original.componentName) errors.push('Mass conversion component identity changed; reapply its composition.') }
      catch (error) { errors.push(error.message) }
    }
    if (!selected.has(condition.componentId) || !component) errors.push('A condition refers to an unselected component.')
    if (seen.has(condition.componentId)) errors.push('A component cannot have multiple simultaneous conditions.')
    seen.add(condition.componentId)
    const mode = conditionModes[condition.mode]
    if (!mode) { errors.push('Unknown source condition mode.'); continue }
    if (mode.varied !== definition.independentVariables.includes(condition)) errors.push('Varied conditions belong in independentVariables; fixed conditions belong in componentConditions.')
    const total = mode.kh === 1
    if (total && (condition.quantity !== 'total' || !concentrationUnits.includes(condition.unit))) errors.push('Totals require an explicit concentration unit and total quantity.')
    if (!total && !['log-activity', 'pH', 'pe', 'Eh'].includes(condition.quantity)) errors.push('LA/LAV requires a log-activity coordinate.')
    if (!total && condition.unit !== (condition.quantity === 'Eh' ? 'V-SHE' : 'dimensionless')) errors.push('Activity coordinate unit does not match its quantity.')
    if (condition.quantity === 'pH' && component?.role !== 'proton') errors.push('pH requires the selected proton component.')
    if (['pe', 'Eh'].includes(condition.quantity) && component?.role !== 'electron') errors.push('pe/Eh requires the selected electron component.')
    if (component?.role === 'solvent' && (condition.mode !== 'LA' || condition.quantity !== 'log-activity' || condition.value !== 0)) errors.push('This phase supports solvent water only as LA=0; nonideal water requires the future activity model.')
    const values = mode.varied ? [condition.range?.min, condition.range?.max] : [condition.value]
    if (values.some(v => !Number.isFinite(v))) errors.push('All condition values must be finite.')
    if (mode.varied && (!(allowDescending ? condition.range?.min !== condition.range?.max : condition.range?.min < condition.range?.max) || !Number.isInteger(condition.points) || condition.points < 2)) errors.push(allowDescending ? 'A grid axis requires distinct finite endpoints and at least two points.' : 'A sweep requires increasing bounds and at least two points.')
    // Signed component-basis totals are permitted (e.g. proton/electron totals).
    if (condition.mode === 'LTV' && values.some(v => !Number.isFinite(10 ** v) || 10 ** v === 0)) errors.push('Log-total bounds exceed the representable range.')
  }
  for (const id of selected) if (!seen.has(id)) errors.push('Each selected component requires exactly one condition.')
  if (!selected.size) errors.push('Explicit source components are required for a calculation definition.')
  if (!Number.isFinite(definition.temperature?.value) || definition.temperature.unit !== 'C' || definition.temperature.value <= -273.15) errors.push('Temperature requires degrees Celsius above absolute zero.')
  if (!Number.isFinite(definition.pressure?.value) || definition.pressure.unit !== 'bar' || definition.pressure.value <= 0) errors.push('Pressure requires a positive value in bar.')
  const ionic = definition.ionicStrength
  if (!ionic || !['automatic', 'fixed'].includes(ionic.mode) || !concentrationUnits.includes(ionic.unit) || (ionic.mode === 'fixed' && (!Number.isFinite(ionic.value) || ionic.value < 0))) errors.push('Invalid ionic strength definition or unit.')
  if (!activityModels.includes(definition.activityModel)) errors.push('Unknown activity model.')
  if (!Array.isArray(definition.enabledPhases) || definition.enabledPhases.some(p => !system.enabledPhases.includes(p)) || !definition.enabledPhases.includes('liquid')) errors.push('Calculation phases must belong to the system and include solvent liquid.')
  if (!Array.isArray(definition.output?.speciesIds) || definition.output.speciesIds.some(id => !system.selectedSpecies.includes(id))) errors.push('Output species must belong to the selected system.')
  if (['total-fraction', 'aqueous-fraction', 'saturated-log-solubility', 'fraction', 'log-solubility', 'predominance'].includes(definition.output?.type) && !selected.has(definition.output.componentId)) errors.push('This output requires a selected target component.')
  if (definition.output?.type === 'relative-log-activity' && !system.selectedSpecies.includes(definition.output.referenceSpeciesId)) errors.push('Relative activity requires a selected reference species.')
  if (definition.output?.type === 'predominance' && definition.independentVariables.length !== 2) errors.push('Predominance requires two independent variables.')
  const points = definition.independentVariables.reduce((n, axis) => n * axis?.points, 1)
  if (definition.sampling?.strategy !== 'cartesian' || !Number.isInteger(definition.sampling.maxPoints) || definition.sampling.maxPoints < 1 || points > definition.sampling.maxPoints || !Number.isFinite(points)) errors.push('Sampling exceeds its explicit point budget or has an invalid policy.')
  return [...new Set(errors)]
}
