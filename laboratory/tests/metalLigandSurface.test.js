import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {validateMetal,calculateMetal} from '../scripts/validation/metalLigandSurface.js'
import {metalLigandSurfaceExample} from '../src/data/metalLigandSurfaceExample.js'
import {createRepository} from '../src/thermodynamics/repository.js'
import {prepareSessionPoint} from '../src/solver/prepareSession.js'
import {deriveGridOutputs} from '../src/calculations/outputs.js'
import {gridModel,gridPackage} from '../src/plots/gridView.js'
const evidence=await validateMetal()

test('Ni–ammonia grid agrees with independent two-balance bisection, with all compatible solids unsaturated',()=>{
 assert.equal(evidence.independent.length,561)
 assert.equal(evidence.system.solidRows.length,3)
 assert.equal(evidence.system.aqueousRows.length,14)
 for(const p of evidence.independent){
  assert.ok(Math.abs(p.z-evidence.model.points[p.index].value)<2e-9)
  assert.ok(p.saturations.every(s=>s.logSaturation<0))
 }
})
test('Ni–ammonia has a moving interior ridge and substantial mixed response, not a separable surface',()=>{
 const m=evidence.metrics,rows=[m.rows[0],m.rows[8],m.rows[16]]
 assert.ok(rows.every(r=>r.range>2))
 assert.ok(m.columns.every(c=>c.range>0.9))
 assert.ok(rows[0].peak.x-rows[2].peak.x>2)
 assert.ok(m.mixedDifference>6)
 assert.ok(m.contourSegments>100)
 assert.ok(m.normalizedContourAngleRange>30)
})
test('three rows, three columns and changed traversal preserve accepted chemistry exactly',()=>{
 assert.equal(evidence.slices.length,6)
 assert.deepEqual(evidence.traversals,['column-major','reverse-X','reverse-Y'])
})
test('selectable Ni example reproduces the audited grid and exact exported samples through existing preparation',async()=>{
 const repository=createRepository(JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json',import.meta.url))))
 const session=metalLigandSurfaceExample(repository),p=await prepareSessionPoint(session,repository,{grid:true})
 assert.ok(p.ok,JSON.stringify(p))
 assert.deepEqual(p.system.products.map(s=>[s.id,s.logBeta,s.coefficients]),evidence.system.products.map(s=>[s.id,s.logBeta,s.coefficients]))
 const grid=await calculateMetal({system:p.system,definition:session.calculationDefinition})
 const derived=deriveGridOutputs(p.system,grid,session.calculationDefinition.output),model=gridModel(derived,session.visualizationState.plot.gridSeriesId)
 assert.deepEqual(model.points.map(p=>p.value),evidence.model.points.map(p=>p.value))
 const exported=JSON.parse(gridPackage(p.system,grid,derived,{selectedSeries:model.series}))
 assert.deepEqual(exported.grid.outcomes,grid.outcomes)
 assert.deepEqual(exported.sampledOutput.cells.map(p=>p.value),model.points.map(p=>p.value))
})
