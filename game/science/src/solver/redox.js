/** Bounded externally imposed SHE potential. No redox closure or map classification. */
import { createPointInput, freeze, rejected, diagnostic } from './models.js'
import { solvePoint } from './point.js'
import { toSourceInput } from '../calculations/definition.js'
export const fixedElectronPolicy = 'fixed-electron-v1'
// Reuse the existing source-aligned conversion; do not duplicate physical constants.
export function ehToPe(Eh, temperatureC = 25) {
  if (!Number.isFinite(Eh) || !Number.isFinite(temperatureC) || temperatureC <= -273.15) return null
  try { return -toSourceInput({ quantity: 'Eh', mode: 'LA' }, Eh, temperatureC).value }
  catch { return null }
}
export function peToEh(pe, temperatureC = 25) {
  const factor = ehToPe(1, temperatureC)
  return Number.isFinite(pe) && Number.isFinite(factor) && factor > 0 ? pe / factor : null
}
export async function solveFixedRedox(system, { pH, Eh, totals, revision = 0, temperatureC = 25 } = {}) {
  if (system?.redoxPolicy !== fixedElectronPolicy) return rejected(diagnostic('unsupported-redox-policy', 'Prepare an explicit fixed-electron-v1 system.'))
  const pe = ehToPe(Eh, temperatureC)
  if (!Number.isFinite(pH) || !Number.isFinite(pe)) return rejected(diagnostic('invalid-redox-coordinate', 'Finite pH and Eh in volts vs SHE are required.'))
  const preparation = await createPointInput(system, { revision, temperatureC, pressureBar: 1, unit: system.unit, activityModel: 'ideal',
    constraints: system.components.map(c => ({ componentId: c.id, kh: c.role === 'ordinary' ? 1 : 2,
      value: c.role === 'ordinary' ? totals?.[c.id] : c.role === 'proton' ? -pH : c.role === 'electron' ? -pe : 0 })) })
  if (!preparation.ok) return preparation
  const input = preparation.input, result = solvePoint(system, input)
  const contributions = result.ok ? system.components.flatMap((c, i) => c.role !== 'ordinary' ? [] : [{ componentId: c.id,
    aqueous: [{ speciesId: c.id, coefficient: 1, molality: result.concentrations[i], weightedMolality: result.concentrations[i] },
      ...system.aqueousRows.filter(j => system.products[j].coefficients[i] !== 0).map(j => ({ speciesId: system.products[j].id,
        coefficient: system.products[j].coefficients[i], molality: result.concentrations[system.components.length+j],
        weightedMolality: system.products[j].coefficients[i]*result.concentrations[system.components.length+j] }))],
    dissolvedMolality: result.dissolvedComponentAmounts[i], analyticalTotal: result.componentTotals[i] }]) : null
  return freeze({ ok: result.ok, kind: 'fixed-redox-point', system, input, result,
    coordinates: { pH, pe, Eh, referenceElectrode: 'SHE', potentialUnit: 'V', temperatureC, logProtonActivity: -pH, logElectronActivity: -pe },
    electronSemantics: 'Externally controlled intensive activity; suppressed free concentration and signed component bookkeeping are not an electron inventory.',
    contributions, classification: null, classificationReason: 'Restricted equilibrium foundation only; no validated complete Pourbaix classification.',
    diagnostics: result.diagnostics })
}
