import { concentrationDisplayRange } from './formatNumber.js'
/** Pure view geometry and exact sample lookup. No chemistry or solver imports. */
export const plotBox = Object.freeze({ width: 1200, height: 560, left: 86, right: 1040, top: 36, bottom: 466 })
export function segments(points) {
  const runs = []; let run = []
  for (const p of points) {
    if (p.value === null || !Number.isFinite(p.value)) { if (run.length) runs.push(run); run = [] }
    else run.push(p)
  }
  if (run.length) runs.push(run)
  return runs
}
export function bounds(series, axis, logarithmic=false, output=null) {
  let min = Infinity, max = -Infinity
  for (const s of series) for (const p of s.points) if (Number.isFinite(p.value)) { min = Math.min(min,p.value); max = Math.max(max,p.value) }
  if (min === Infinity) { min = -1; max = 1 }
  ;({min,max}=concentrationDisplayRange(min,max,output))
  const pad = max === min ? Math.max(1, Math.abs(min) * 0.05) : (max - min) * 0.08
  min -= pad; max += pad
  if(logarithmic){min=Math.floor(min);max=Math.ceil(max)}
  const range=concentrationDisplayRange(min,max,output)
  return { xMin: axis.start, xMax: axis.end, yMin: range.min, yMax: range.max }
}
export function validView(view) { return Object.values(view).every(Number.isFinite) && view.xMin < view.xMax && view.yMin < view.yMax }
export function zoom(view, factor) {
  const x = (view.xMin + view.xMax) / 2, y = (view.yMin + view.yMax) / 2
  const next = { xMin: x - (x - view.xMin) * factor, xMax: x + (view.xMax - x) * factor, yMin: y - (y - view.yMin) * factor, yMax: y + (view.yMax - y) * factor }
  return validView(next) ? next : view
}
export function pan(view, dx, dy) { const next = { xMin: view.xMin + dx, xMax: view.xMax + dx, yMin: view.yMin + dy, yMax: view.yMax + dy }; return validView(next) ? next : view }
export function nearestIndex(coordinates, x) {
  let best = 0
  coordinates.forEach((v, i) => { if (Math.abs(v - x) < Math.abs(coordinates[best] - x)) best = i })
  return best
}
export function inspectPoint(derived, index) {
  return { index, x: derived.series[0]?.points[index]?.x ?? null, values: derived.series.map(s => ({ id: s.id, name: s.name, ...s.points[index] })) }
}
export function mapPoint(p, view, b = plotBox) {
  return { x: b.left + (p.x - view.xMin) / (view.xMax - view.xMin) * (b.right - b.left), y: b.bottom - (p.value - view.yMin) / (view.yMax - view.yMin) * (b.bottom - b.top) }
}

/** Integer decades for log values; fractional ticks only for a tightly zoomed view. */
export function axisTicks(min,max,{logarithmic=false,maxTicks=20}={}) {
  if(!Number.isFinite(min)||!Number.isFinite(max)||min===max)return []
  const lo=Math.min(min,max),hi=Math.max(min,max),span=hi-lo
  const raw=span/(logarithmic?maxTicks:6),power=10**Math.floor(Math.log10(raw))
  let step=[1,2,5,10].map(n=>n*power).find(n=>n>=raw)??power*10
  if(logarithmic&&span>=1)step=Math.max(1,Math.ceil(step))
  const start=Math.ceil(lo/step),end=Math.floor(hi/step)
  return Array.from({length:Math.min(100,Math.max(0,end-start+1))},(_,i)=>Number(((start+i)*step).toPrecision(12)))
}

/** Integer decade grid with labels spaced by physical height; bounded for extreme zooms. */
export function logGridTicks(min, max, pixelHeight = 430) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return []
  const span = max - min, capacity = Math.max(1, Math.floor(pixelHeight / 24))
  if (span < 1) return axisTicks(min, max, { logarithmic: true, maxTicks: capacity }).map(value => ({ value, major: true }))
  const gridStep = Math.max(1, Math.ceil(span / Math.max(1, Math.min(600, pixelHeight / 2))))
  const labelStep = Math.max(gridStep, Math.ceil(span / capacity / gridStep) * gridStep)
  const start = Math.ceil(min / gridStep), end = Math.floor(max / gridStep)
  return Array.from({ length: Math.min(601, Math.max(0, end - start + 1)) }, (_, i) => {
    const value = (start + i) * gridStep
    return { value, major: Math.abs(value % labelStep) < 1e-10 }
  })
}
