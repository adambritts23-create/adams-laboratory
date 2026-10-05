import assert from 'node:assert/strict'
import { surfaceCase, validateSurfaceCase, calculate } from './independentSurfaces.js'
import { deriveGridOutputs } from '../../src/calculations/outputs.js'

const median = values => { const a=[...values].sort((a,b)=>a-b),i=Math.floor(a.length/2);return a.length ? a.length%2?a[i]:(a[i-1]+a[i])/2 : null }
const equivalent = (a,b) => a===b || Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=4e-14+2e-10*Math.max(Math.abs(a),Math.abs(b))
/** Offline descriptive statistics. Meaningful-effect threshold is separate from solver acceptance. */
export function responseMatrix(model) {
  const [nx,ny]=model.metadata.shape
  assert.equal(model.points.length,nx*ny)
  const x=model.points.slice(0,nx).map(p=>p.x),y=Array.from({length:ny},(_,iy)=>model.points[iy*nx].y)
  model.points.forEach((p,i)=>{assert.equal(p.index,i);assert.equal(p.ix,i%nx);assert.equal(p.iy,Math.floor(i/nx));assert.equal(p.x,x[p.ix]);assert.equal(p.y,y[p.iy])})
  const rows=Array.from({length:ny},(_,iy)=>model.points.slice(iy*nx,(iy+1)*nx).map(p=>p.pointStatus==='converged'&&Number.isFinite(p.value)?p.value:null))
  const columns=Array.from({length:nx},(_,ix)=>rows.map(r=>r[ix]))
  const valid=rows.flat().filter(Number.isFinite),span=Math.max(...valid)-Math.min(...valid)
  const range=a=>{const v=a.filter(Number.isFinite);if(!v.length)return {valid:0,range:null};const min=Math.min(...v),max=Math.max(...v),range=max-min;return {valid:v.length,min,max,range,rangeOverMaxAbs:range/Math.max(Math.abs(min),Math.abs(max),Number.MIN_VALUE),fractionOfGlobalSpan:span?range/span:0}}
  const axis=lines=>{const deltas=lines.flatMap(a=>a.slice(1).flatMap((v,i)=>Number.isFinite(v)&&Number.isFinite(a[i])?[Math.abs(v-a[i])]:[]));const duplicatePairs=[],effectiveDuplicatePairs=[]
    for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;j++){if(lines[i].some(v=>!Number.isFinite(v))||lines[j].some(v=>!Number.isFinite(v)))continue;if(lines[i].every((v,k)=>v===lines[j][k]))duplicatePairs.push([i,j]);if(lines[i].every((v,k)=>equivalent(v,lines[j][k])))effectiveDuplicatePairs.push([i,j])}
    return {ranges:lines.map(range),adjacent:{count:deltas.length,max:deltas.length?Math.max(...deltas):null,median:median(deltas),aboveOnePercentOfGlobalSpan:deltas.filter(d=>span>0&&d>0.01*span).length},duplicatePairs,effectiveDuplicatePairs,duplicateLines:lines.length-new Set(lines.map(a=>JSON.stringify(a))).size,effectivelyDuplicateLines:lines.reduce((n,a,i)=>n+(a.every(Number.isFinite)&&lines.slice(0,i).some(b=>b.every(Number.isFinite)&&a.every((v,k)=>equivalent(v,b[k])))?1:0),0),effectivelyFlatLines:lines.map((a,i)=>a.every(Number.isFinite)&&a.every(v=>equivalent(v,a[0]))?i:null).filter(i=>i!==null)} }
  return {order:'Z[iy][ix]; rows hold fixed Y, columns hold fixed X',x,y,z:rows,global:range(valid),alongX:axis(rows),alongY:axis(columns),policy:{effectiveEquality:'abs(a-b) <= 4e-14 + 2e-10 * max(abs(a),abs(b)); existing analytical comparison criterion',substantialVariation:'Descriptive screen: adjacent difference > 1% of global Z span. Not a thermodynamic acceptance tolerance.',relativeVariation:'range/max(abs(Z)); signed logarithmic outputs also report range/global span, not a molality relative error.'}}
}

export async function auditResponse(mixed) {
  const c=await surfaceCase(mixed),e=await validateSurfaceCase(c),matrix=responseMatrix(e.model)
  // Additional fifth traversal, deliberately outside the previous four-order helper.
  const reversed=structuredClone(c.definition)
  for(const a of reversed.independentVariables)[a.range.min,a.range.max]=[a.range.max,a.range.min]
  const grid=await calculate(c,reversed),series=deriveGridOutputs(c.system,grid,c.output).series.find(s=>s.id===c.seriesId)
  const fields=['ok','status','concentrations','logActivities','componentTotals','dissolvedComponentAmounts','solids','residuals']
  for(const o of grid.outcomes){const original=e.grid.outcomes.find(p=>p.x===o.x&&p.y===o.y);for(const field of fields)assert.deepEqual(o.result[field],original.result[field]);assert.equal(series.points[o.index].value,e.model.points[original.index].value)}
  const [nx,ny]=e.grid.shape,ix=Math.floor(nx/2),iy=Math.floor(ny/2)
  const indices=[...[0,Math.floor(ny/2),ny-1].map(y=>y*nx+ix),...[0,Math.floor(nx/2),nx-1].map(x=>iy*nx+x)]
  const traces=indices.map(index=>({index,x:e.grid.outcomes[index].x,y:e.grid.outcomes[index].y,z:e.model.points[index].value,system:e.system,input:e.grid.outcomes[index].input,result:e.grid.outcomes[index].result}))
  return {...e,matrix,representativeTraces:traces,verification:{standalonePoints:e.grid.outcomes.length,independentSliceCount:e.slices.length,maxPointStateDifference:0,maxSliceStateDifference:0,maxSliceZDifference:0,maxTraversalStateDifference:0,maxTraversalZDifference:0,traversals:['row-major',...e.traversal.map(t=>t.mode),'both-reversed'],explanation:'Previous helper compares fresh independently constructed point inputs and 1D slices with exact array equality; this audit additionally compares both-reversed states and Z exactly.'}}
}
