/** Explicit eq-diagr Util name conventions; no oxidation-state inference. */
export function sourcePhase(name) {
  if (/\(g\)$/i.test(name)) return 'gas'
  if (/\(l\)$/i.test(name) || name === 'H2O') return 'liquid'
  if (/\((s|a|c|cr|am|vit|ppt)\)$/i.test(name)) return 'solid'
  return 'aqueous' // eq-diagr default convention, not an independent mineral identification.
}
export function sourceCharge(name) {
  const trimmed = name.trimEnd()
  const match = trimmed.match(/([+\-\u2013\u2212])(\d{1,2})$/)
  if (match && match.index > 0) return (match[1] === '+' ? 1 : -1) * Number(match[2])
  const tail = trimmed.match(/([+\-\u2013\u2212])$/)
  if (!tail || tail.index === 0) return 0
  const sign = tail[1], direction = sign === '+' ? 1 : -1
  const magnitude = trimmed.slice(0, -1).match(/ (\d{1,2})$/)
  if (magnitude) return direction * Number(magnitude[1])
  let count = 0
  for (let i = trimmed.length - 1; i >= 0 && trimmed[i] === sign; i--) count++
  return direction * count
}
export function effectiveComponents(raw) {
  const components = raw.components.filter(c => c.name.trim())
  if (raw.layout === 'six-slot' && !components.some(c => c.name === 'H+' || c.name === 'H +') && Math.abs(raw.protonCount) > 0.00001) {
    return [...components, { name: 'H+', coefficient: raw.protonCount }]
  }
  return components
}
