export function diagramIdentity(type) {
  if (type === 'surface') return 'surface'
  if (['total-fraction','aqueous-fraction', 'fraction'].includes(type)) return 'fraction'
  if (['saturated-log-solubility', 'log-solubility'].includes(type)) return 'solubility'
  if (['calculated-pH', 'calculated-redox'].includes(type)) return 'coordinate'
  if (type === 'pourbaix') return 'pourbaix'
  if (type === 'predominance') return 'predominance'
  if (type === 'relative-activity') return 'relative'
  return 'concentration'
}
