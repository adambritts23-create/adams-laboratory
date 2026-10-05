/** A view of original grid samples, not a new calculation or interpolated sweep. */
export function extractSlice(derived, seriesId, direction, index) {
  const series=derived?.series.find(s=>s.id===seriesId),shape=derived?.metadata.shape
  if(!derived?.ok||!series||!shape||!['horizontal','vertical'].includes(direction)||!Number.isInteger(index)||index<0||index>=series.points.length)throw new Error('Choose an exact grid sample and slice direction.')
  const [nx,ny]=shape,ix=index%nx,iy=Math.floor(index/nx),horizontal=direction==='horizontal'
  const indices=Array.from({length:horizontal?nx:ny},(_,i)=>horizontal?iy*nx+i:i*nx+ix),fixedAxis=derived.metadata.axes[horizontal?1:0]
  const points=indices.map((gridIndex,index)=>{const p=series.points[gridIndex];return {...p,index,gridIndex,gridCoordinates:{x:p.x,y:p.y,ix:p.ix,iy:p.iy},x:horizontal?p.x:p.y,y:undefined}})
  return {ok:true,kind:'sampled-grid-slice',series:[{...series,points}],metadata:{...derived.metadata,axes:undefined,shape:undefined,axis:derived.metadata.axes[horizontal?0:1],slice:{direction,parentGridId:derived.metadata.gridId,indices,fixedAxis,fixedCoordinate:horizontal?series.points[index].y:series.points[index].x,semantics:'Exact existing sampled cells; unavailable cells remain gaps; no new equilibrium run.'}}}
}
