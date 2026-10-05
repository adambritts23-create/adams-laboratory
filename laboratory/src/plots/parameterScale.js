/** UI coordinates only; exact typed values are never clamped to the convenience bar. */
export const parameterToPosition = (value, logarithmic) => logarithmic ? Math.log10(value) : value
export const positionToParameter = (position, logarithmic) => logarithmic ? 10 ** position : position
export const numericParameter = text => text === '' ? null : Number(text)
export function parameterRange(condition) {
  const logarithmic = condition.mode === 'T'
  const position = parameterToPosition(condition.value, logarithmic)
  const min = logarithmic ? -12 : condition.quantity === 'pH' ? 0 : condition.quantity === 'Eh' ? -1 : -20
  const max = logarithmic ? 1 : condition.quantity === 'pH' ? 14 : condition.quantity === 'Eh' ? 1.5 : 20
  return { min: Number.isFinite(position) ? Math.min(min, Math.floor(position)) : min,
    max: Number.isFinite(position) ? Math.max(max, Math.ceil(position)) : max, position, logarithmic }
}
