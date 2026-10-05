import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { gridFixture, calculateGrid } from './phase8Helpers.js'
import { deriveGridOutputs } from '../src/calculations/outputs.js'
import { gridModel, gridPackage } from '../src/plots/gridView.js'
import { scientificSummary } from '../src/analysis/summary.js'
import { extractSlice } from '../src/analysis/slices.js'
import { prepareSurface, surfaceCoordinates, surfaceContours, surfaceRange, surfaceMarker, sliceGuide, surfaceFallbackMessage } from '../src/plots/surface3d.js'
import { updateLaboratorySession } from '../src/session/laboratorySession.js'
import { initializeSurfaceRenderer } from '../src/plots/surfaceLifecycle.js'

async function actual(type='log-concentration'){
  const {system,definition}=await gridFixture(),grid=await calculateGrid(system,definition),derived=deriveGridOutputs(system,grid,{type}),model=gridModel(derived)
  const summary=scientificSummary(system,grid,derived,model.series.id)
  return {system,grid,derived,model:{...model,analysis:summary.analysis},summary}
}
// Synthetic geometry-only layout. It is never submitted as equilibrium data.
function layout(nx=5,ny=3){const points=Array.from({length:nx*ny},(_,index)=>({index,ix:index%nx,iy:Math.floor(index/nx),x:index%nx,y:Math.floor(index/nx),value:index,pointStatus:'converged',linearValue:10**index}));return {points,min:0,max:nx*ny-1,series:{id:'geometry-only'},metadata:{shape:[nx,ny],axes:[{start:0,end:nx-1},{start:0,end:ny-1}]}}}

test('surface conversion retains exact sampled X/Y/Z, identities, linear amount and triangle topology',async()=>{
  const {grid,model}=await actual(),s=prepareSurface(model)
  assert.equal(s.triangles.length,8);assert.equal(s.samples.length,grid.outcomes.length)
  s.samples.forEach((p,i)=>{assert.equal(p.x,grid.outcomes[i].x);assert.equal(p.y,grid.outcomes[i].y);assert.equal(p.z,model.points[i].value);assert.equal(p.linearValue,model.points[i].linearValue);assert.equal(p.index,i)})
  assert.equal(s.metadata.gridId,grid.gridId);assert.deepEqual(s.triangles[0],[0,1,4]);assert.deepEqual(s.triangles[1],[0,4,3])
})
test('any unavailable corner removes the whole quad, even if the other three corners are valid',()=>{
  for(const status of ['failed','not-run','converged']){const m=layout(2,2);m.points[0].pointStatus=status;m.points[0].value=null;const s=prepareSurface(m);assert.equal(s.triangles.length,0);assert.equal(s.edges.length,0)}
  const m=layout(2,2);m.points[0].pointStatus='failed';assert.equal(prepareSurface(m).triangles.length,0)
})
test('disconnected valid regions never receive triangles or wire edges across a missing column',()=>{
  const m=layout();for(const p of m.points)if(p.ix===2){p.value=null;p.pointStatus='failed'}
  const s=prepareSurface(m);assert.equal(s.triangles.length,8)
  assert.ok(s.triangles.every(t=>t.every(i=>s.samples[i].ix<2)||t.every(i=>s.samples[i].ix>2)))
  assert.ok(s.edges.every(e=>e.every(i=>s.samples[i].ix<2)||e.every(i=>s.samples[i].ix>2)))
  assert.ok(surfaceContours(s,[3,7,11]).every(e=>!(e.from.x<2&&e.to.x>2)&&!(e.to.x<2&&e.from.x>2)))
})
test('manual Z range and aspect normalize/clamp no scientific values, invalid ranges recover to auto',async()=>{
  const {model}=await actual(),s=prepareSurface(model),before=JSON.stringify(s.samples)
  const v=surfaceCoordinates(s,{zRange:{min:-3,max:-2},aspect:'cube'})
  assert.deepEqual(v.dimensions,[2,2,2]);assert.equal(JSON.stringify(s.samples),before)
  assert.ok(v.position(s.samples[0]).every(Number.isFinite));assert.ok(surfaceRange(s,{min:5,max:1}).error)
  assert.deepEqual(surfaceRange({...s,min:null,max:null},null),{min:0,max:1,error:null})
  assert.ok(surfaceRange({...s,min:0,max:0}).max>surfaceRange({...s,min:0,max:0}).min)
})
test('surface extrema are the Phase 10 sampled coordinates, never recomputed from geometry',async()=>{
  const {model,summary}=await actual(),s=prepareSurface(model)
  for(const key of ['minimum','maximum']){const p=surfaceMarker(s,key);assert.equal(p.index,summary.analysis.extrema[key].index);assert.equal(p.z,summary.analysis.extrema[key].value)}
  const none=prepareSurface({...model,analysis:null});assert.equal(surfaceMarker(none,'minimum'),null)
})
test('linear/log output changes preserve original grid and zero/non-log values remain gaps',async()=>{
  const {system,grid}=await actual(),linear=deriveGridOutputs(system,grid,{type:'concentration'}),log=deriveGridOutputs(system,grid,{type:'log-concentration'})
  const a=prepareSurface(gridModel(linear)),b=prepareSurface(gridModel(log))
  b.samples.forEach((p,i)=>{assert.equal(p.linearValue,a.samples[i].z);assert.equal(p.z,Math.log10(a.samples[i].z))})
  const m=layout(2,2);m.points[0].value=null;m.points[0].linearValue=0;m.points[0].reason='zero-log-undefined';const s=prepareSurface(m);assert.equal(s.samples[0].linearValue,0);assert.equal(s.samples[0].valid,false);assert.equal(s.triangles.length,0)
})
test('slice guides align exactly with existing row/column and never select an arbitrary coordinate',async()=>{
  const {derived,model}=await actual(),s=prepareSurface(model)
  for(const direction of ['horizontal','vertical']){const guide=sliceGuide(s,direction,4),slice=extractSlice(derived,model.series.id,direction,4);assert.equal(guide.coordinate,slice.metadata.slice.fixedCoordinate);assert.equal(guide.visualizationOnly,true)}
  assert.equal(sliceGuide(s,'horizontal',-1),null)
})
test('visualization/camera/color/aspect changes retain calculation, revision and pin in session',async()=>{
  const {system,grid}=await actual(),initial={revision:grid.revision,lastPlot:{system,grid},visualizationState:{}}
  let session=initial
  for(const patch of [{visualizationMode:'3d'},{gridPinned:4},{surfaceCamera:{position:[3,2,3],target:[0,0,0]}},{surfaceAspect:'cube',surfaceZRange:{min:-7,max:-2}},{surfaceContours:true},{visualizationMode:'2d'}])session=updateLaboratorySession(session,{type:'plotView',patch})
  assert.equal(session.lastPlot,initial.lastPlot);assert.equal(session.revision,initial.revision);assert.equal(session.visualizationState.plot.gridPinned,4)
})
test('cancelled grid has holes and its complete statuses survive numerical export with camera state',async()=>{
  const {system,definition}=await gridFixture(),c=new AbortController();c.abort();const grid=await calculateGrid(system,definition,0,{signal:c.signal}),d=deriveGridOutputs(system,grid,{type:'log-concentration'}),model=gridModel(d),s=prepareSurface(model)
  assert.equal(s.triangles.length,0);assert.ok(s.samples.every(p=>p.state==='cancelled'&&!p.valid))
  const doc=JSON.parse(gridPackage(system,grid,d,{selectedSeries:model.series,visualization:'3d',camera:{position:[3,2,3]},pinned:4}));assert.equal(doc.grid.outcomes.length,9);assert.equal(doc.view.pinned,4)
})
test('stale surfaces preserve original conditions and expose different current revision',async()=>{
  const {system,grid,derived,model}=await actual(),s=prepareSurface(model),summary=scientificSummary(system,grid,derived,model.series.id,{currentRevision:grid.revision+1})
  assert.equal(summary.stale,true);assert.equal(s.metadata.revision,grid.revision);assert.equal(s.metadata.fixedConditions,derived.metadata.fixedConditions)
})
test('malformed grid topology is rejected and renderer fallback leaves scientific alternatives explicit',()=>{
  const m=layout();m.points[0].ix=1;assert.throws(()=>prepareSurface(m))
  assert.ok(surfaceFallbackMessage.includes('2D Map'));assert.ok(surfaceFallbackMessage.includes('numerical export'))
  for(const name of ['surface3d.js','threeSurfaceRenderer.js','surfaceFigure.js'])assert.ok(!/from\s+['"][^'"]*(?:solver|calculations)/.test(fs.readFileSync(`src/plots/${name}`,'utf8')))
})

test('renderer capability failure is caught without modifying or discarding the grid',async()=>{
  const {grid}=await actual(),before=JSON.stringify(grid),errors=[]
  const engine=initializeSurfaceRenderer(()=>{throw new Error('WebGL2 unavailable')},null,{onFailure:e=>errors.push(e)})
  assert.equal(engine,null);assert.deepEqual(errors,['WebGL2 unavailable']);assert.equal(JSON.stringify(grid),before)
  const available={dispose(){}};assert.equal(initializeSurfaceRenderer(()=>available,null,{}),available)
})
