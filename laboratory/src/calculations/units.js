/** Quantity-family scaling only. No density or dilute-solution approximation. */
export const amountUnits = Object.freeze({
  'mol/kg-H2O': { family: 'molality', exponent: 0, label: 'mol/kg H₂O' },
  'mol/L-solution': { family: 'molarity', exponent: 0, label: 'mol/L solution' },
  M: { family: 'molarity', exponent: 0, label: 'M' },
  mM: { family: 'molarity', exponent: -3, label: 'mM' },
  'µM': { family: 'molarity', exponent: -6, label: 'µM' },
  nM: { family: 'molarity', exponent: -9, label: 'nM' },
})
export function convertAmount(value, from, to) {
  const a = amountUnits[from], b = amountUnits[to]
  const fail = (code, message) => ({ ok: false, value: null, code, message, from, to })
  if (!a || !b || !Number.isFinite(value)) return fail('invalid-unit-value', 'Known units and a finite value are required.')
  if (a.family !== b.family) return fail('physical-conversion-unavailable', 'Molarity requires supported solvent mass per solution volume; density/composition information is unavailable.')
  const converted = from === to ? value : value * 10 ** (a.exponent-b.exponent),canonical=value*10**a.exponent
  if (!Number.isFinite(converted) || !Number.isFinite(canonical) || (value !== 0 && (converted === 0 || canonical === 0))) return fail('unit-range-error', 'Scaling exceeds the representable range.')
  return { ok: true, value: converted, canonical: { value: canonical, unit: a.family === 'molarity' ? 'mol/L-solution' : from }, displayUnit: to, family: a.family }
}
