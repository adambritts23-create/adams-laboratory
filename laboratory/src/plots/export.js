import {ehWaterReferenceSvg} from './ehWaterReferences.js'
import { placeCurveLabels } from './labels.js'
import { displayNumber as formatNumber } from './formatNumber.js'
import { plotBox, mapPoint, segments, axisTicks, logGridTicks } from './geometry.js'
import { chemicalLabel } from '../chemistry/format.js'
import { seriesLabel, logarithmicOutput } from './presentation.js'

const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
export function seriesColor(id, theme = 'dark', catalogIndex = null) {
  const palette = theme === 'light' ? ['#006b59', '#a14300', '#5348b9', '#aa2463', '#006faa', '#6c6b00'] : ['#6ee7c6', '#ffb86b', '#aaa0ff', '#ff95cb', '#75caff', '#dae978']
  return palette[(catalogIndex ?? [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0)) % palette.length]
}
export function conditionLines(metadata) {
  const c = metadata.conditions, ionic = c.ionicStrength
  return [`${formatNumber(c.temperature.value,'temperature')} ${c.temperature.unit} · ${formatNumber(c.pressure.value)} ${c.pressure.unit} (declared) · ${c.activityModel} · I: ${ionic.mode === 'automatic' ? 'not evaluated (automatic)' : `${formatNumber(ionic.value,'concentration')} ${ionic.unit} (declared)`}`,
    ...metadata.fixedConditions.map(f => `${metadata.componentNames[f.componentId]}: ${f.mode} ${f.quantity} = ${formatNumber(f.value,f.quantity)} ${f.unit}`), ...(metadata.slice ? [`Exact sampled slice: ${axisDisplayLabel(metadata.slice.fixedAxis,metadata.componentNames)} = ${formatNumber(metadata.slice.fixedCoordinate)}`] : [])]
}
export function figureConditionLines(metadata) {
  return [conditionLines(metadata)[0],...metadata.fixedConditions.map(f=>`${chemicalLabel(metadata.componentNames[f.componentId])}: ${f.mode==='T'?'component total':f.quantity==='log-activity'?'log activity':f.quantity} = ${formatNumber(f.value,f.quantity)} ${f.unit==='mol/kg-H2O'?'mol/kg H₂O':f.unit}`), ...(metadata.slice ? [conditionLines(metadata).at(-1)] : [])]
}
export function axisDisplayLabel(axis,names) {
  if(axis.suppliedReagent)return `Supplied ${chemicalLabel(names[axis.componentId])} (mol/kg H₂O)`
  if(axis.componentId==='component:H%2B'&&axis.quantity==='total')return 'Analytical H⁺ equivalent (mol/kg H₂O)'
  if(['pH','pe','Eh'].includes(axis.quantity))return `${axis.quantity} [${axis.unit}]`
  return `${chemicalLabel(names[axis.componentId])} ${axis.mode==='LTV'?'total (log₁₀, mol/kg H₂O)':axis.quantity==='total'?'total (mol/kg H₂O)':'log₁₀ activity'}`
}
/** SVG contains sampled straight segments only; undefined points split paths. */
export function figureSvg(derived, visibleIds, view, theme = 'dark', currentRevision = derived.metadata.revision, b = plotBox, focusedId = null, waterReferences = null) {
  const light = theme === 'light', bg = light ? '#fff' : '#11191e', fg = light ? '#17232c' : '#e5edf3', grid = light ? '#d5dee5' : '#35444d'
  const lines = figureConditionLines(derived.metadata), height = b.height + lines.length * 21
  const displayed = derived.series.filter(s => visibleIds.includes(s.id))
  const exportMetadata = { ...derived.metadata, currentRevision, stale: currentRevision !== derived.metadata.revision, visibleIds, view, ...(waterReferences?{waterReferences}:{}), imageIsCompleteReproducibilityPackage: false }
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${b.width} ${height}" role="img" aria-label="Scientific 1D equilibrium plot"><title>${escape(derived.metadata.output.label)}</title><metadata>${escape(JSON.stringify(exportMetadata))}</metadata><rect width="100%" height="100%" fill="${bg}"/><defs><clipPath id="plot-clip"><rect x="${b.left}" y="${b.top}" width="${b.right-b.left}" height="${b.bottom-b.top}"/></clipPath></defs><g font-family="system-ui,sans-serif" font-size="16" fill="${fg}">`
  for(const x of axisTicks(view.xMin,view.xMax)) {
    const px=mapPoint({x,value:0},view,b).x
    svg+=`<path d="M${px},${b.bottom}v-7" stroke="${fg}" stroke-width="0.8"/><text x="${px}" y="${b.bottom+25}" text-anchor="middle">${escape(formatNumber(x,derived.metadata.axis.quantity))}</text>`
  }
  const yTicks = logarithmicOutput(derived.metadata.output.type) ? logGridTicks(view.yMin,view.yMax,(b.bottom-b.top)*(b.pixelScale??1)*0.5) : axisTicks(view.yMin,view.yMax).map(value=>({value,major:true}))
  for(const {value:y,major} of yTicks) {
    const py=mapPoint({x:0,value:y},view,b).y
    svg+=`<path data-y-tick="${y}" data-major="${major}" d="M${b.left},${py}h${major?8:4}" stroke="${fg}" stroke-width="0.8"/>${major?`<path d="M${b.left+8},${py}H${b.right}" stroke="${grid}" stroke-opacity="0.45" stroke-width="0.6"/>`:''}${major?`<text x="${b.left-10}" y="${py+4}" text-anchor="end">${escape(formatNumber(y).replace('-', '−'))}</text>`:''}`
  }
  if(derived.metadata.axis.quantity==='Eh')svg+=ehWaterReferenceSvg(waterReferences,view,b,light)
  for (const change of derived.metadata.phaseChanges ?? []) {
    if(change.x < view.xMin || change.x > view.xMax) continue
    const px=mapPoint({x:change.x,value:view.yMin},view,b).x
    svg += `<path data-assemblage-sample="${change.index}" d="M${px-4},${b.bottom-2}L${px+4},${b.bottom-2}L${px},${b.bottom-9}Z" fill="${fg}" opacity="0.6"><title>${escape('Assemblage differs between sampled pH '+formatNumber(change.previousX)+' and '+formatNumber(change.x)+'; not an exact boundary')}</title></path>`
  }
  const anchors = []
  for (const series of displayed) {
    svg += `<g opacity="${focusedId && series.id !== focusedId ? 0.25 : 1}" data-focused="${series.id === focusedId}">`
    const color = seriesColor(series.id, theme, derived.series.findIndex(s => s.id === series.id))
    for (const run of segments(series.points)) {
      const points = run.map(p => mapPoint(p, view, b))
      svg += points.length === 1 ? `<circle clip-path="url(#plot-clip)" cx="${points[0].x}" cy="${points[0].y}" r="${series.id===focusedId?4:2.5}" fill="${color}"/>` : `<polyline clip-path="url(#plot-clip)" fill="none" stroke="${color}" stroke-width="${series.id===focusedId?4:2}" points="${points.map(p => `${p.x},${p.y}`).join(' ')}"/>`
    }
    const end = series.points.findLast(p => p.value !== null && p.x >= view.xMin && p.x <= view.xMax && p.value >= view.yMin && p.value <= view.yMax)
    if (end) anchors.push({ id: series.id, name: seriesLabel(series,derived.metadata.output.type), color, ...mapPoint(end,view,b) })
    svg += '</g>'
  }
  const labels = placeCurveLabels(focusedId ? anchors.filter(a=>a.id===focusedId) : anchors,b.top+10,b.bottom-10)
  if (anchors.length && !labels.length) svg += `<text x="${b.right+8}" y="${b.top+14}" font-size="12">Labels: see Shown species</text>`
  for (const label of labels) svg += `<path d="M${label.x},${label.y}L${b.right+5},${label.labelY}H${b.right+10}" stroke="${label.color}" fill="none" stroke-width="0.8"/><text x="${b.right+13}" y="${label.labelY+4}" fill="${label.color}" font-size="13">${escape(label.name)}</text>`
  const axis = derived.metadata.axis
  const concentration=derived.metadata.output.type==='log-concentration'
  const yTitle=concentration?'log Concentrations':derived.metadata.output.label
  const yUnit=concentration?null:derived.metadata.output.unit
  svg+=`<path d="M${b.left},${b.top}V${b.bottom}H${b.right}" stroke="${fg}" stroke-width="1" fill="none"/>`
  svg += `<text x="${(b.left+b.right)/2}" y="${b.bottom+49}" text-anchor="middle" font-size="22">${escape(axis.quantity==='pH'?'pH':axis.quantity==='pe'?'pe':axisDisplayLabel(axis,derived.metadata.componentNames))}</text><text transform="translate(24,${(b.top+b.bottom)/2}) rotate(-90)" text-anchor="middle" font-size="22"><tspan x="0" dy="${yUnit?-6:0}">${escape(yTitle)}</tspan>${yUnit?`<tspan x="0" dy="17" font-size="12">${escape(yUnit)}</tspan>`:''}</text><text x="${b.left}" y="21">${escape(`${derived.metadata.runStatus==='completed'?'Calculated':'Calculated with missing points'}${exportMetadata.stale ? ' · STALE — old conditions' : ''}`)}</text>`
  lines.forEach((line, i) => { svg += `<text x="${b.left}" y="${b.bottom+80+i*21}">${escape(line.replace(': T total',': total').replace(': LA log-activity',': log activity').replace(': LA pH',': pH').replace(': LA pe',': pe').replace(': LA Eh',': Eh'))}</text>` })
  return svg + '</g></svg>'
}
export function resultPackage(system, sweep, derived, visibleIds, view, currentRevision) {
  // Avoid serializing the same prepared network once per closed sample. Exact
  // inputs/results and generated inspection remain; the shared system is below.
  if(sweep.kind==='closed-reagent-view')sweep={...sweep,closed:{id:sweep.closed.id,scopeId:sweep.closed.scopeId,status:sweep.closed.status,counts:sweep.closed.counts,discovery:sweep.closed.discovery},outcomes:sweep.outcomes.map(o=>({index:o.index,coordinate:o.coordinate,transformed:o.transformed,input:o.input,result:o.result,status:o.status,scientificAcceptance:o.scientificAcceptance,diagnostics:o.diagnostics,closedInspection:o.closedAccepted?.inspection??null}))}

  if (!derived.ok || system.id !== derived.metadata.systemId || sweep.sweepId !== derived.metadata.sweepId) throw new Error('Mismatched export identities.')
  return JSON.stringify({ kind: 'adams-scientific-1d-export', schemaVersion: 1, currentRevision, stale: currentRevision !== sweep.revision, visibleIds, view, system, sweep, derived, scientificSummary:view.scientificSummary??null,
    warning: 'Source data and results are exported for inspection; importing calculated results as trusted state is unsupported. An SVG alone is not the complete numerical package.' }, null, 2)
}

