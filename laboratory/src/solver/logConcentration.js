/** Binary64 materialization, not a scientific concentration cutoff. */
export const minimumNormal = 2 ** -1022
export const logTracePolicy = 'positive-log-concentration-v1'
export function linearFromLog(log) {
  const value = 10 ** log
  if (!Number.isFinite(log) || !Number.isFinite(value)) throw new Error('overflow')
  return value
}
/** Factor before exponentiating so an unrepresentable concentration can still
 * have a representable weighted inventory or normalized derivative. */
export function factoredTrace(log, factors, divisor = 1) {
  if (factors.some(n => n === 0)) return 0
  if (!(divisor > 0) || !Number.isFinite(divisor) || factors.some(n => !Number.isFinite(n))) throw new Error('overflow')
  let sign = 1, exponent = log - Math.log10(divisor)
  for (const n of factors) { sign *= Math.sign(n); exponent += Math.log10(Math.abs(n)) }
  return sign * linearFromLog(exponent)
}
export const concentrationStatus = (linear, positive) => !positive ? 'exact-zero' : linear === 0 ? 'positive-underflow' : linear < minimumNormal ? 'positive-subnormal' : 'finite-positive'
export function positiveLogSum(logs) {
  if (!logs.length) return null
  const largest = Math.max(...logs)
  return largest + Math.log10(logs.reduce((sum, log) => sum + 10 ** (log - largest), 0))
}
