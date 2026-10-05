import { chemicalLabel } from '../chemistry/format.js'
// Display only. Never substitute totals for free-species values.
export function seriesLabel(series,type){
  const name=chemicalLabel(series.name)
  if(['total-fraction','aqueous-fraction'].includes(type)&&series.phase==='aqueous')return `${name} (aq)`
  if(series.phase==='solid'&&type==='log-concentration')return `${name} · solid`
  if(series.kind==='free-component'&&['concentration','log-concentration','log-activity'].includes(type))return `Free ${name}`
  if(series.kind==='component-total')return `${name} component total`
  if(type==='log-solubility')return name.replace(' dissolved',' dissolved component amount')
  return name
}
export const logarithmicOutput=type=>['saturated-log-solubility','log-concentration','log-activity','log-solubility','log-total-dissolved'].includes(type)
