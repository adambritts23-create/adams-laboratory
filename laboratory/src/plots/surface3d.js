import { concentrationDisplayRange } from './formatNumber.js'
import { gridCellStatus, scalarContours } from './scalarMap.js'
/** Exact sampled geometry topology. Floating-point normalization is renderer-only. */
export function prepareSurface(model, outcomes = null) {
  const [nx,ny]=model.metadata.shape??[]
  if(!Number.isInteger(nx)||!Number.isInteger(ny)||nx<2||ny<2||nx*ny!==model.points.length)throw new Error('Surface requires the complete requested grid lattice.')
  const samples=model.points.map((p,index)=>{
    if(p.index!==index||p.ix!==index%nx||p.iy!==Math.floor(index/nx)||!Number.isFinite(p.x)||!Number.isFinite(p.y))throw new Error('Surface grid orientation or coordinates are invalid.')
    return {...p,z:p.value,state:gridCellStatus(p),valid:p.pointStatus==='converged'&&Number.isFinite(p.value)}
  })
  const triangles=[],edges=new Set(),transitionQuads=[]
  for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
    const q=[y*nx+x,y*nx+x+1,(y+1)*nx+x+1,(y+1)*nx+x]
    if(!q.every(i=>samples[i].valid))continue
    // A phase change is not proof of a discontinuity. Conservatively leave its interval unresolved.
    if(outcomes && new Set(q.map(i=>JSON.stringify((outcomes[i]?.result?.solids??[]).filter(s=>s.amount>0).map(s=>s.id??s.name).sort()))).size>1){transitionQuads.push(q[0]);continue}
    triangles.push([q[0],q[1],q[2]],[q[0],q[2],q[3]])
    for(let i=0;i<4;i++)edges.add([q[i],q[(i+1)%4]].sort((a,b)=>a-b).join(':'))
  }
  return {samples,triangles,transitionQuads,edges:[...edges].map(e=>e.split(':').map(Number)),metadata:model.metadata,series:model.series,min:model.min,max:model.max,extrema:model.analysis?.extrema??{},counts:{samples:samples.length,valid:samples.filter(p=>p.valid).length,triangles:triangles.length},semantics:'Exact sampled vertices. Two triangles only for a quad with four accepted finite values. Quads spanning different sampled active solid assemblages are omitted when equilibrium outcomes are supplied; their continuity and boundary location remain unresolved. Polygon interiors are visualization interpolation, never new equilibrium points.'}
}
export function surfaceRange(surface,manual){
  let auto=surface.min===null?{min:0,max:1}:surface.min===surface.max?{min:surface.min-Math.max(1,Math.abs(surface.min)*0.05),max:surface.max+Math.max(1,Math.abs(surface.max)*0.05)}:{min:surface.min,max:surface.max}
  auto=concentrationDisplayRange(auto.min,auto.max,surface.metadata?.output)
  const min=manual?.min??auto.min,max=manual?.max??auto.max
  return Number.isFinite(min)&&Number.isFinite(max)&&min<max?{min,max,error:null}:{...auto,error:'Z minimum must be smaller than maximum; automatic range shown.'}
}
export function surfaceCoordinates(surface,options={}){
  const [x,y]=surface.metadata.axes,range=surfaceRange(surface,options.zRange)
  const spans=[Math.abs(x.end-x.start),Math.abs(y.end-y.start),range.max-range.min],largest=Math.max(...spans)
  const dimensions=options.aspect==='data'?spans.map(s=>2*s/largest):options.aspect==='cube'?[2,2,2]:[2,2,1.5]
  const position=(p,z=p.z)=>[( (p.x-x.start)/(x.end-x.start)-0.5)*dimensions[0],(z-range.min)/(range.max-range.min)*dimensions[2],(0.5-(p.y-y.start)/(y.end-y.start))*dimensions[1]]
  return {range,dimensions,position}
}
export function surfaceContours(surface,levels){
  return scalarContours({metadata:surface.metadata,points:surface.samples.map(p=>({...p,value:p.valid?p.z:null}))},levels,surface.transitionQuads)
}
export function surfaceMarker(surface,key){const e=surface.extrema[key];return e&&surface.samples[e.index]?.valid?surface.samples[e.index]:null}
export function sliceGuide(surface,direction,index){
  if(!Number.isInteger(index)||index<0||index>=surface.samples.length||!['horizontal','vertical'].includes(direction))return null
  const p=surface.samples[index]
  return {direction,index,coordinate:direction==='horizontal'?p.y:p.x,axis:direction==='horizontal'?'Y':'X',visualizationOnly:true}
}
export const surfaceFallbackMessage='3D rendering is unavailable on this device. Use 2D Map; exact inspection, analysis, slices and numerical export remain available.'
