// Offline capability audit only. Reduced candidate solves are NOT full-system results.
import fs from 'node:fs'
import { prepareChemicalSystem, createPointInput } from '../src/solver/models.js'
import { solvePoint } from '../src/solver/point.js'
const data = JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json', import.meta.url)))
export const basis = ['Ca 2+', 'CO3 2-', 'Mg 2+', 'H+', 'H2O']
export const totals = [0.1, 0.1, 0.001]
export const records = data.species.filter(s => s.role !== 'solvent' && !basis.includes(s.name) && s.metadata.effectiveSourceReaction?.components?.length && s.metadata.effectiveSourceReaction.components.every(c => c.coefficient === 0 || basis.includes(c.name)))
export const aqueous = records.filter(s => s.phase === 'aqueous')
export const solids = records.filter(s => s.phase === 'solid')
const coeff = s => basis.map(name => s.metadata.effectiveSourceReaction.components.find(c => c.name === name)?.coefficient ?? 0)
export const saturation = (s, logA) => s.logK + coeff(s).reduce((n, c, i) => n + c * logA[i], 0)
export function specification(selectedSolids) {
  return { components: basis.map((name, i) => ({ id: name, name, role: i === 3 ? 'proton' : i === 4 ? 'water' : 'ordinary' })),
    products: [...aqueous, ...selectedSolids].map(s => ({ id: s.id, name: s.name, phase: s.phase, logBeta: s.logK, coefficients: coeff(s), sourceRecord: s.provenance })),
    basisStatus: 'explicit-direct', temperatureC: 25, pressureBar: 1, unit: 'mol/kg-H2O', sourceIdentity: { databaseHash: aqueous[0].provenance.dbSha256, selectedRecords: [...aqueous, ...selectedSolids].map(s => s.id) } }
}
export function reconstruct(logA) {
  const amounts = aqueous.map(s => ({ name: s.name, id: s.id, coefficients: coeff(s), molality: 10 ** saturation(s, logA) }))
  const dissolved = totals.map((_, i) => 10 ** logA[i] + amounts.reduce((n, s) => n + s.coefficients[i] * s.molality, 0))
  return { amounts, dissolved, saturations: solids.map(s => ({ name: s.name, logSaturation: saturation(s, logA) })) }
}

/** Closed-form check for calcite + brucite at fixed pH, not a general multiphase solver. */
export function analyticalTwoSolid(pH) {
  const b = name => records.find(s => s.name === name).logK
  const logMg = -b('Mg(OH)2(cr)') - 2 * pH
  // Equal supplied Ca and carbonate totals; calcite removes one of each.
  // CaCO3(aq) and CaHCO3+ cancel in D_Ca - D_C. Remaining terms give C^2=K*A/B.
  const A = 1 + 10 ** (b('CaOH+') + pH)
  const B = 1 + 10 ** (b('CO2') - 2 * pH) + 10 ** (b('H2CO3') - 2 * pH) + 10 ** (b('HCO3-') - pH)
    + 10 ** (b('MgCO3') + logMg) + 10 ** (b('MgHCO3+') + logMg - pH)
  const logCarbonate = (-b('CaCO3(cr)') + Math.log10(A) - Math.log10(B)) / 2
  const logA = [-b('CaCO3(cr)') - logCarbonate, logCarbonate, logMg, -pH, 0]
  const check = reconstruct(logA)
  return { pH, logA, ...check, solidAmounts: { 'CaCO3(cr)': totals[0] - check.dissolved[0], 'Mg(OH)2(cr)': totals[2] - check.dissolved[2] } }
}

export async function auditMixedCarbonate() {
  const fullPreparation = await prepareChemicalSystem(specification(solids))
  const candidates = await Promise.all([null, ...solids].map(async solid => ({ solid, prepared: await prepareChemicalSystem(specification(solid ? [solid] : [])) })))
  const points = []
  for (let pH = 0; pH <= 14; pH += 0.5) {
    const attempts = []
    for (const { solid, prepared } of candidates) {
      if (!prepared.ok) throw new Error(JSON.stringify(prepared.diagnostics))
      const input = await createPointInput(prepared.system, { revision: 0, unit: 'mol/kg-H2O', temperatureC: 25, pressureBar: 1, activityModel: 'ideal',
        constraints: basis.map((componentId, i) => ({ componentId, kh: i < 3 ? 1 : 2, value: i < 3 ? totals[i] : i === 3 ? -pH : 0 })) })
      if (!input.ok) throw new Error(JSON.stringify(input.diagnostics))
      const result = solvePoint(prepared.system, input.input)
      if (!result.ok) { attempts.push({ candidate: solid?.name ?? 'aqueous-only', status: 'numerical-failure', diagnostics: result }); continue }
      const check = reconstruct(result.logActivities.slice(0, basis.length))
      const supersaturated = check.saturations.filter(s => s.logSaturation > result.saturationTolerance)
      const solidAmount = result.solids[0]?.amount ?? 0
      const balanceErrors = totals.map((t, i) => check.dissolved[i] + (solid ? coeff(solid)[i] * solidAmount : 0) - t)
      const massActionErrors = aqueous.map(s => {
        const j = prepared.system.products.findIndex(p => p.id === s.id)
        return Math.log10(result.concentrations[basis.length + j]) - saturation(s, result.logActivities)
      })
      attempts.push({ candidate: solid?.name ?? 'aqueous-only', status: supersaturated.length ? 'rejected-omitted-solid-supersaturation' : 'all-listed-solid-inequalities-satisfied',
        logA: result.logActivities.slice(0, basis.length), ...check, solidAmount, supersaturated, balanceErrors, maxMassActionError: Math.max(...massActionErrors.map(Math.abs)) })
    }
    points.push({ pH, attempts })
  }
  return { kind: 'offline-mixed-system-capability-audit', productionEquilibriumAvailable: false, basis, totals, fullPreparation,
    sourceRecords: records.map(s => ({ id: s.id, name: s.name, phase: s.phase, logK: s.logK, coefficients: coeff(s), provenance: s.provenance })), points,
    analyticalWitnesses: [10.5, 11, 12, 13, 14].map(analyticalTwoSolid) }
}
