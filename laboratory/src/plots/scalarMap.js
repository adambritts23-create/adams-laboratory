import { concentrationDisplayRange } from './formatNumber.js'
/** View-only scalar map utilities. No numerical equilibrium code. */
export function scalarColor(value, min, max) {
  const t = min === max ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)))
  return `rgb(${[17 + 173 * t, 42 + 198 * t, 67 + 158 * t].map(Math.round).join(',')})`
}
export function colorRange(model, settings = {}) {
  const auto=concentrationDisplayRange(model.min,model.max,model.metadata?.output)
  const min = settings?.min ?? auto.min, max = settings?.max ?? auto.max
  const valid = Number.isFinite(min) && Number.isFinite(max) && (min < max || (min === max && settings?.min == null && settings?.max == null))
  return { min: valid ? min : model.min, max: valid ? max : model.max, error: valid || model.min === null ? null : 'Color minimum must be finite and smaller than maximum. Automatic range shown.' }
}
export function gridCellStatus(p) {
  if (p.pointStatus === 'converged') return Number.isFinite(p.value) ? 'value-available' : 'derived-unavailable'
  if (p.pointStatus === 'failed') return 'solver-failure'
  return p.runDisposition === 'cancelled' ? 'cancelled' : p.runDisposition === 'invalidated-stale' ? 'stale-invalidated' : 'not-run'
}
/** Piecewise linear triangles, fixed diagonal. Skip the entire quad if any corner is missing.
 * Contours are interpolated visualization, not independently solved equilibrium states.
 */
export function scalarContours(model, levels, excludedQuads = []) {
  if (!Array.isArray(levels) || levels.length > 20 || levels.some(v => !Number.isFinite(v))) return []
  const [nx, ny] = model.metadata.shape, segments = []
  for (let y = 0; y < ny - 1; y++) for (let x = 0; x < nx - 1; x++) {
    if (excludedQuads.includes(y * nx + x)) continue
    const quad = [y * nx + x, y * nx + x + 1, (y + 1) * nx + x + 1, (y + 1) * nx + x].map(i => model.points[i])
    if (quad.some(p => !Number.isFinite(p.value))) continue
    for (const level of [...new Set(levels)]) for (const indices of [[0, 1, 2], [0, 2, 3]]) {
      const triangle = indices.map(i => quad[i]), cross = []
      for (let i = 0; i < 3; i++) {
        const a = triangle[i], b = triangle[(i + 1) % 3]
        if ((a.value >= level) === (b.value >= level)) continue
        const f = (level - a.value) / (b.value - a.value)
        cross.push({ x: a.x + f * (b.x - a.x), y: a.y + f * (b.y - a.y) })
      }
      if (cross.length === 2 && (cross[0].x !== cross[1].x || cross[0].y !== cross[1].y)) segments.push({ level, from: cross[0], to: cross[1] })
    }
  }
  return segments
}

/** Boundaries between sampled cells with and without accepted F. Not phase boundaries. */
export function calculatedDomainEdges(model) {
  const [nx,ny]=model.metadata.shape,[xa,ya]=model.metadata.axes
  const dx=(xa.end-xa.start)/(nx-1),dy=(ya.end-ya.start)/(ny-1),edges=[]
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const p=model.points[y*nx+x],valid=gridCellStatus(p)==='value-available'
    if(x+1<nx){const q=model.points[y*nx+x+1];if(valid!==(gridCellStatus(q)==='value-available'))edges.push({from:{x:(p.x+q.x)/2,y:p.y-dy/2},to:{x:(p.x+q.x)/2,y:p.y+dy/2}})}
    if(y+1<ny){const q=model.points[(y+1)*nx+x];if(valid!==(gridCellStatus(q)==='value-available'))edges.push({from:{x:p.x-dx/2,y:(p.y+q.y)/2},to:{x:p.x+dx/2,y:(p.y+q.y)/2}})}
  }
  return edges
}
