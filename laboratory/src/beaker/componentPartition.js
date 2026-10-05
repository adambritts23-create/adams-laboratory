import { isPrepared, isPointInput } from '../solver/models.js'
import { isSuccessfulPointResult } from '../solver/point.js'

/** Read-only allocation of a supplied component total. No equilibrium calculation. */
export function componentPartitions(state) {
  if (!state?.ok) return []
  const { system, input, result } = state
  if (!isPrepared(system) || !isPointInput(input) || !isSuccessfulPointResult(result)
    || result.systemId !== system.id || result.inputId !== input.id) return []
  return system.components.flatMap((component, index) => {
    if (component.role !== 'ordinary') return []
    const total = input.constraints[index], limit = result.residuals.componentBalanceLimits[index]
    const row = { id: component.id, name: component.name, suppliedTotal: total.value }
    const unavailable = reason => [{ ...row, ok: false, reason }]
    if (total.kh !== 1) return unavailable('Activity-controlled component; no supplied analytical total.')
    if (!Number.isFinite(total.value) || !(total.value > limit) || !Number.isFinite(limit)) return unavailable('Analytical total is below the existing balance resolution.')
    if (system.products.some(p => !Number.isFinite(p.coefficients[index]) || p.coefficients[index] < 0)) return unavailable('Signed source-component inventory has no nonnegative phase partition.')
    const solids = []
    for (const solid of result.solids.filter(s => s.amount > 0)) {
      const product = system.products.find(p => p.id === solid.id && p.phase === 'solid')
      if (!product) return unavailable('Accepted solid source stoichiometry unavailable.')
      const coefficient = product.coefficients[index]
      if (coefficient > 0) solids.push({ id: solid.id, name: solid.name, amount: solid.amount, coefficient,
        componentAmount: coefficient * solid.amount, fraction: coefficient * solid.amount / total.value })
    }
    const solidAmount = solids.reduce((n, s) => n + s.componentAmount, 0), dissolvedAmount = result.dissolvedComponentAmounts[index]
    const residual = dissolvedAmount + solidAmount - total.value
    if (![solidAmount, dissolvedAmount, residual].every(Number.isFinite) || dissolvedAmount < 0 || solidAmount < 0
      || Math.abs(residual) > limit || Math.abs(result.residuals.componentBalance[index]) > limit) return unavailable('Component balance cannot support a reliable percentage at the accepted tolerance.')
    return [{ ...row, ok: true, solids, solidAmount, dissolvedAmount, solidFraction: solidAmount / total.value,
      dissolvedFraction: dissolvedAmount / total.value, residual, balanceTolerance: limit }]
  })
}
export function partitionPercent(fraction) {
  if (!Number.isFinite(fraction)) return 'Unavailable'
  if (fraction > 0 && fraction < 0.001) return '<0.1%'
  if (fraction > 0.999 && fraction < 1) return '>99.9%'
  const rounded = Number((fraction * 100).toFixed(1))
  return `${rounded === 100 && fraction !== 1 ? '≈' : ''}${rounded}%`
}
