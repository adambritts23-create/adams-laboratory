import { multiSolidPolicy } from '../solver/assemblages.js'
import { isPrepared } from '../solver/models.js'
import { isSuccessfulPointResult } from '../solver/point.js'

/** Conditional saturation solubility in the selected source component basis. */
export function solubilityApplicability(system, componentId) {
  const reject = reason => ({ ok: false, reason })
  if (!isPrepared(system)) return reject('prepared-system-required')
  const index = system.components.findIndex(c => c.id === componentId)
  if (index < 0 || system.components[index].suppressed || system.components[index].role !== 'ordinary') return reject('ordinary-component-required')
  if (system.products.some(p => p.coefficients[index] < 0)) return reject('signed-component-inventory-is-not-solubility')
  const solids = system.products.filter(p => p.phase === 'solid')
  const relevant = solids.filter(s=>s.coefficients[index]>0)
  if (system.solidPolicy === multiSolidPolicy ? !relevant.length : solids.length !== 1 || !(solids[0].coefficients[index] > 0)) return reject('one-relevant-pure-solid-required')
  const contributors = [{ id: componentId, name: system.components[index].name, coefficient: 1 }, ...system.products.filter(p => p.phase === 'aqueous' && p.coefficients[index] > 0).map(p => ({ id: p.id, name: p.name, coefficient: p.coefficients[index] }))]
  return { ok: true, index, solidId: relevant[0].id, solidName: relevant.map(s=>s.name).join(' / '), solidIds: relevant.map(s=>s.id), contributors }
}

export function saturatedLogSolubility(system, result, componentId) {
  const gap = reason => ({ value: null, linearValue: null, reason })
  const scope = solubilityApplicability(system, componentId)
  if (!scope.ok) return gap(scope.reason)
  if (!isSuccessfulPointResult(result) || result.systemId !== system.id) return gap('accepted-equilibrium-required')
  const solid = result.solids.find(s => scope.solidIds.includes(s.id) && ['present','saturated-zero-amount'].includes(s.status))
  if (!solid || !['present', 'saturated-zero-amount'].includes(solid.status)) return gap('relevant-solid-not-saturated')
  if (!Number.isFinite(solid.logSaturation) || Math.abs(solid.logSaturation) > result.saturationTolerance) return gap('solid-saturation-not-established')
  const amount = result.dissolvedComponentAmounts[scope.index]
  if(Number.isFinite(result.dissolvedComponentLogAmounts?.[scope.index]))return {value:result.dissolvedComponentLogAmounts[scope.index],linearValue:amount,reason:null,solidId:solid.id,numericalRepresentation:result.numericalRepresentation.version}
  if (!(amount > 0) || !Number.isFinite(amount)) return gap(amount === 0 ? 'zero-log-undefined' : 'invalid-dissolved-inventory')
  return { value: Math.log10(amount), linearValue: amount, reason: null, solidId: solid.id }
}
