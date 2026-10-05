import test from 'node:test'
import assert from 'node:assert/strict'
import { auditResponse, responseMatrix } from '../scripts/validation/responseAudit.js'
import { responseDisplay, responseModes, nearestFloorSample, floorChemicalCoordinates } from '../src/plots/responseSurface.js'
import { prepareSurface, surfaceCoordinates, surfaceContours } from '../src/plots/surface3d.js'
import { gridPackage } from '../src/plots/gridView.js'
const evidence=await Promise.all([auditResponse(false),auditResponse(true)])

test('full numerical matrices have explicit X/Y orientation and retain every exact Z',()=>{
  for(const e of evidence){const m=e.matrix;for(const p of e.model.points){assert.equal(m.z[p.iy][p.ix],p.value);assert.equal(m.x[p.ix],p.x);assert.equal(m.y[p.iy],p.y)}
    const bad=structuredClone(e.model);bad.points[1].iy=1;assert.throws(()=>responseMatrix(bad))}
})
test('mixed sensitivity is predominantly carbonate-driven but has genuine nonzero pH response',()=>{
  const m=evidence[1].matrix
  assert.ok(m.alongY.adjacent.median>0.018);assert.ok(m.alongX.adjacent.median<0.00002)
  assert.equal(m.alongX.effectivelyDuplicateLines,0);assert.equal(m.alongY.effectivelyDuplicateLines,0)
  assert.ok(m.alongX.ranges.every(r=>r.range>0.004));assert.ok(m.alongY.ranges.every(r=>r.range>0.07))
})
test('carbonate demonstration has substantial two-axis sensitivity, beyond numerical noise',()=>{
  const m=evidence[0].matrix
  assert.ok(m.alongX.ranges.every(r=>r.range>2.34));assert.ok(m.alongY.ranges.every(r=>r.range>3.99))
  assert.equal(m.alongX.adjacent.aboveOnePercentOfGlobalSpan,35);assert.equal(m.alongY.adjacent.aboveOnePercentOfGlobalSpan,36)
  assert.equal(m.alongX.effectivelyDuplicateLines,0);assert.equal(m.alongY.effectivelyDuplicateLines,0)
})
test('reciprocal low/middle/high traces retain actual fixed activities and analytical totals at solver entry',()=>{
  for(const e of evidence){const t=e.representativeTraces
    assert.equal(new Set(t.slice(0,3).map(p=>p.x)).size,1);assert.equal(new Set(t.slice(0,3).map(p=>p.y)).size,3)
    assert.equal(new Set(t.slice(3).map(p=>p.y)).size,1);assert.equal(new Set(t.slice(3).map(p=>p.x)).size,3)
    for(const p of t){const c=id=>p.input.constraints.find(c=>c.componentId===id)
      assert.equal(c('H+').value,-p.x);assert.equal(c('CO3 2-').value,10**p.y);assert.equal(c('H2O').value,0)
      assert.equal(p.result.ok,true);if(c('Ca 2+')){assert.equal(c('Ca 2+').value,.1);assert.equal(c('Mg 2+').value,.001)}}}
})
test('independent points, all reciprocal slices and five traversal orders reproduce equilibrium and Z',()=>{
  for(const e of evidence){assert.equal(e.verification.independentSliceCount,6);assert.equal(e.verification.maxSliceZDifference,0);assert.equal(e.verification.maxPointStateDifference,0)
    assert.deepEqual(e.verification.traversals,['row-major','column-major','reversed-X','reversed-Y','both-reversed']);assert.equal(e.verification.maxTraversalStateDifference,0)}
})
test('display presets never transform scientific Z and floor contours are the intended default',()=>{
  assert.equal(responseModes.length,5);assert.equal(responseDisplay().baseContours,true);assert.equal(responseDisplay().samples,false)
  assert.equal(responseDisplay({responseMode:'contours'}).style,'contours')
  assert.equal(responseDisplay({responseMode:'surface-floor-samples'}).samples,true)
  for(const [mode] of responseModes){const e=evidence[0],s=prepareSurface(e.model,e.grid.outcomes),c=surfaceCoordinates(s,responseDisplay({responseMode:mode}));for(const p of s.samples)assert.equal(c.position(p)[1],(p.z-c.range.min)/(c.range.max-c.range.min)*c.dimensions[2])}
})
test('floor projection inverses the actual X/Y axes and snaps only to exact requested samples',()=>{
  for(const e of evidence){const s=e.surface,c=surfaceCoordinates(s)
    for(const p of s.samples){const world=c.position(p),chemical=floorChemicalCoordinates(s,c.dimensions,world[0],world[2]),hit=nearestFloorSample(s,chemical.x,chemical.y)
      assert.equal(hit.index,p.index);assert.equal(hit.source,'floor-projection');assert.equal(hit.exactVertex,false);assert.equal(hit.z,undefined)}
    const hit=nearestFloorSample(s,s.samples[0].x+.02,s.samples[0].y+.01);assert.equal(hit.index,0);assert.equal(hit.exactXY,false)}
})
test('surface and floor contours share the exact same Z and gap mask',()=>{
  const e=evidence[1],s=e.surface,levels=[.01,.03,.05,.07,.09],contours=surfaceContours(s,levels)
  assert.ok(contours.length>0);assert.ok(contours.every(c=>levels.includes(c.level)))
  assert.equal(s.transitionQuads.length,6)
  assert.deepEqual(surfaceContours({...s,transitionQuads:Array.from({length:65},(_,i)=>i)},levels),[])
  const m=structuredClone(e.model);m.points.forEach(p=>{p.value=null;p.pointStatus='failed'})
  const missing=prepareSurface(m,e.grid.outcomes);assert.equal(missing.triangles.length,0);assert.deepEqual(surfaceContours(missing,levels),[])
  assert.equal(nearestFloorSample(missing,m.points[0].x,m.points[0].y).index,0);assert.equal(missing.samples[0].z,null)
})
test('new display modes and inspection origins do not change full-precision numerical exports',()=>{
  const e=evidence[1],json=JSON.parse(gridPackage(e.system,e.grid,e.derived,{selectedSeries:e.model.series,settings:responseDisplay({responseMode:'surface-floor-samples'})}))
  assert.deepEqual(json.grid.outcomes,e.grid.outcomes);assert.deepEqual(json.sampledOutput.cells.map(p=>p.value),e.model.points.map(p=>p.value))
})
