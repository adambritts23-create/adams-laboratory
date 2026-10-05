/** View-only choices; no transformation of scientific Z. */
export const responseModes = Object.freeze([
  ['surface-floor','Surface + floor contours'],
  ['surface-samples','Surface + samples'],
  ['surface-wireframe','Surface + wireframe'],
  ['surface-floor-samples','Surface + floor contours + samples'],
  ['contours','Contours only'],
])
export function responseDisplay(settings = {}) {
  const mode = responseModes.some(([id])=>id===settings.responseMode) ? settings.responseMode : 'surface-floor'
  return {mode,style:mode==='contours'?'contours':mode==='surface-wireframe'?'surface-mesh':'surface',samples:mode.endsWith('samples'),baseContours:mode.includes('floor')||mode==='contours'}
}
/** A floor click identifies the nearest requested sample, including explicitly missing samples.
 * No interpolated Z is returned. A missing sample remains unavailable in inspection. */
export function nearestFloorSample(surface, x, y) {
  if(!Number.isFinite(x)||!Number.isFinite(y))return null
  const [xa,ya]=surface.metadata.axes,dx=Math.abs(xa.end-xa.start),dy=Math.abs(ya.end-ya.start)
  if(!dx||!dy)return null
  let index=null,best=Infinity
  for(const p of surface.samples){const distance=((p.x-x)/dx)**2+((p.y-y)/dy)**2;if(distance<best){best=distance;index=p.index}}
  return index===null?null:{index,source:'floor-projection',exactVertex:false,exactXY:best===0,clickedX:x,clickedY:y,snapped:true}
}
export function floorChemicalCoordinates(surface, dimensions, worldX, worldZ) {
  const [xa,ya]=surface.metadata.axes,[sx,sy]=dimensions
  return {x:xa.start+(worldX/sx+.5)*(xa.end-xa.start),y:ya.start+(.5-worldZ/sy)*(ya.end-ya.start)}
}
