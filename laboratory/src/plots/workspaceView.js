import { comparisonOutputs } from '../calculations/independentSolubility.js'
import { conditionLines } from './export.js'
import { axisDisplayLabel } from './export.js'
import { displayNumber as formatNumber } from './formatNumber.js'

/** UI navigation only. An old snapshot cannot complete a newly submitted request. */
export function workspaceMode(navigation, snapshot) {
  if (!snapshot) return 'setup'
  if (navigation.mode === 'results') return 'results'
  return navigation.submission && snapshot !== navigation.submission.previous ? 'results' : 'setup'
}
export function calculatedConditions(snapshot) {
  if (!snapshot) return []
  if(snapshot.result)return ['Accepted single point · '+formatNumber(snapshot.system.temperatureC,'temperature')+' °C · ideal activities',...snapshot.input.constraints.map(c=>(snapshot.system.components.find(p=>p.id===c.componentId)?.name??c.componentId)+': '+(c.kh===1?'total':'log activity')+' = '+formatNumber(c.value,c.kh===1?'amount':'log'))]
  if (snapshot.comparison) {
    const c=snapshot.comparison, lines=conditionLines(comparisonOutputs(c).metadata)
    return ['Independent solutions · '+lines[0], `pH ${formatNumber(c.config.min)} to ${formatNumber(c.config.max)} · ${c.config.points} samples per solution`, ...lines.slice(1)]
  }
  const run = snapshot.grid ?? snapshot.sweep, d = run.definition.calculationDefinition
  const names = Object.fromEntries(snapshot.system.components.map(c => [c.id, c.name]))
  return [
    `${formatNumber(d.temperature.value,'temperature')} °C · ${formatNumber(d.pressure.value)} bar (declared) · ${d.activityModel} · I: ${d.ionicStrength.mode === 'automatic' ? 'not evaluated' : `${formatNumber(d.ionicStrength.value)} ${d.ionicStrength.unit} (declared)`}`,
    ...(run.definition.axes ?? [run.definition.axis]).map(a => `${axisDisplayLabel(a, names)}: ${formatNumber(a.range.min,a.quantity)} to ${formatNumber(a.range.max,a.quantity)} · ${a.points} samples`),
    ...run.definition.fixedConditions.map(c => `${names[c.componentId]}: ${c.mode === 'T' ? 'total' : c.quantity} = ${formatNumber(c.value,c.quantity)} ${c.unit}`),
  ]
}
