import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { surfaceCase, validateSurfaceCase, calculate } from '../scripts/validation/independentSurfaces.js'
import { analyticalTwoSolid } from './mixedCarbonateAudit.js'
import { createRepository } from '../src/thermodynamics/repository.js'
import { independentSurfaceExample } from '../src/data/surfaceExamples.js'
import { mixedCarbonateSolubilityExample } from '../src/data/solubilityExample.js'
import { prepareSessionPoint, prepareSessionStructure } from '../src/solver/prepareSession.js'
import { deriveGridOutputs } from '../src/calculations/outputs.js'
import { gridModel, gridPackage } from '../src/plots/gridView.js'
import { prepareSurface, surfaceContours } from '../src/plots/surface3d.js'
import { updateLaboratorySession } from '../src/session/laboratorySession.js'
const repository = createRepository(JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json', import.meta.url))))
const cases = await Promise.all([surfaceCase(), surfaceCase(true)])
const evidence = await Promise.all(cases.map(validateSurfaceCase))

test('independent carbonate axes produce analytical bicarbonate Z at all 45 points', () => {
  const e = evidence[0]
  assert.equal(e.grid.counts.converged, 45)
  assert.equal(e.comparisons.length, 45)
  assert.equal(e.system.products.find(p => p.id === e.seriesId).name, 'HCO3-')
  assert.equal(e.definition.independentVariables[1].componentId, 'CO3 2-')
  assert.ok(e.model.max - e.model.min > 6)
})
test('both independent 1D slice directions and all four traversal orders preserve exact states and Z', () => {
  for (const e of evidence) {
    assert.equal(e.slices.length, 6)
    assert.ok(e.slices.every(s => s.status === 'completed'))
    assert.deepEqual(e.traversal.map(t => t.mode), ['column-major','reversed-X','reversed-Y'])
    assert.ok(e.traversal.every(t => t.counts.converged === e.grid.counts.converged))
  }
})
test('mixed grid preserves Ca/Mg totals and matches independent calcite/brucite mass action', () => {
  const e = evidence[1]
  assert.equal(e.grid.counts.converged, 65)
  assert.equal(e.system.solidRows.length, 10)
  for (const pH of [10.5,11,12]) {
    const o = e.grid.outcomes.find(p => p.x === pH && p.y === -1), a = analyticalTwoSolid(pH)
    assert.ok(Math.abs(e.model.points[o.index].value - a.dissolved[0]) <= 4e-14 + 2e-10 * Math.abs(a.dissolved[0]))
    a.logA.forEach((v,i) => assert.ok(Math.abs(o.result.logActivities[i] - v) < 2e-10))
  }
})
test('new repository examples use ordinary grid preparation; multi-solid remains explicit and grid-only', async () => {
  for (const mixed of [false,true]) {
    const session = independentSurfaceExample(repository,mixed)
    const p = await prepareSessionPoint(session,repository,{grid:true})
    assert.ok(p.ok,JSON.stringify(p))
    const c = cases[Number(mixed)]
    assert.deepEqual(p.system.products.map(p => [p.id,p.logBeta,p.coefficients]), c.system.products.map(p => [p.id,p.logBeta,p.coefficients]))
    const g = await calculate({system:p.system,definition:session.calculationDefinition})
    const d = deriveGridOutputs(p.system,g,session.calculationDefinition.output)
    const actual = gridModel(d,session.visualizationState.plot.gridSeriesId)
    assert.deepEqual(actual.points.map(p=>p.value),evidence[Number(mixed)].model.points.map(p=>p.value))
    if (mixed) {
      assert.ok((await prepareSessionStructure(session,repository)).ok)
      const legacy = structuredClone(session); delete legacy.calculationDefinition.gridMultiSolid
      assert.equal((await prepareSessionPoint(legacy,repository,{grid:true})).ok,false)
      assert.ok((await prepareSessionPoint(session,repository,{sweep:true})).diagnostics.some(d=>d.code==='unsupported-grid-solid-policy'))
    }
  }
  assert.ok((await prepareSessionPoint(mixedCarbonateSolubilityExample(repository),repository,{grid:true})).diagnostics.some(d=>d.code==='unsupported-mixed-solubility'))
})
test('exact inspection and numerical export preserve independent inputs, response and full equilibrium provenance', () => {
  for (const e of evidence) {
    const exported = JSON.parse(gridPackage(e.system,e.grid,e.derived,{selectedSeries:e.model.series}))
    assert.deepEqual(exported.grid.outcomes,e.grid.outcomes)
    e.surface.samples.forEach((s,i)=>{
      assert.equal(s.x,e.grid.outcomes[i].x); assert.equal(s.y,e.grid.outcomes[i].y)
      assert.equal(s.z,e.model.points[i].value)
      assert.equal(exported.sampledOutput.cells[i].value,s.z)
    })
  }
})
test('cancelled and stale grids never create interpolated scientific values', async () => {
  const c=cases[0],controller=new AbortController();controller.abort()
  const grid=await calculate(c,c.definition,{signal:controller.signal}),d=deriveGridOutputs(c.system,grid,c.output)
  const surface=prepareSurface(gridModel(d,c.seriesId),grid.outcomes)
  assert.equal(surface.counts.valid,0);assert.equal(surface.triangles.length,0)
  assert.ok(surface.samples.every(p=>p.z===null&&p.state==='cancelled'))
  const stale=await calculate(c,c.definition,{isCurrent:()=>false})
  assert.equal(deriveGridOutputs(c.system,stale,c.output).ok,false)
  const session=independentSurfaceExample(repository)
  session.lastPlot={system:c.system,grid:evidence[0].grid}
  const edited=updateLaboratorySession(session,{type:'calculation',definition:session.calculationDefinition},repository)
  assert.equal(edited.lastPlot,session.lastPlot);assert.ok(edited.revision>session.revision)
})
test('failed or unavailable surface corners remove whole quads and keep exact surviving vertices', () => {
  for (const pointStatus of ['failed','converged']) {
    const m=structuredClone(evidence[0].model);m.points[10]={...m.points[10],pointStatus,value:null}
    const s=prepareSurface(m)
    assert.equal(s.samples[10].valid,false)
    assert.ok(s.triangles.every(t=>!t.includes(10)))
    assert.equal(s.samples[11].z,m.points[11].value)
  }
})
test('mixed phase-change intervals remain open and contours cannot bridge those unresolved intervals', () => {
  const e=evidence[1],s=e.surface
  assert.ok(s.transitionQuads.length>0);assert.ok(s.triangles.length>0)
  assert.equal(s.counts.valid,65)
  assert.ok(s.triangles.every(t=>!s.transitionQuads.includes(t[0])))
  assert.deepEqual(surfaceContours({...s,transitionQuads:Array.from({length:65},(_,i)=>i)},[.01]),[])
})
