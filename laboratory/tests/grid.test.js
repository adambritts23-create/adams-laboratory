import test from 'node:test'
import assert from 'node:assert/strict'
import { gridFixture, calculateGrid, vary } from './phase8Helpers.js'
import { createGridDefinition, runGrid } from '../src/calculations/grid.js'
import { deriveGridOutputs, deriveOutputs } from '../src/calculations/outputs.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { toSourceInput } from '../src/calculations/definition.js'
import { solvePoint } from '../src/solver/point.js'
import { definitionFor, reconstruct } from './phase6Helpers.js'
import { updateLaboratorySession,serializeSession,deserializeSession } from '../src/session/laboratorySession.js'
import { gridModel,gridSvg,gridPackage,gridBounds,exactGridIndex,navigateGrid } from '../src/plots/gridView.js'
import fs from 'node:fs'

test('grid retains x-fast Cartesian order, descending axes, identities and exact unchanged point solves',async()=>{
  const {system,definition}=await gridFixture()
  definition.independentVariables[0].range={min:-5,max:-7}
  const grid=await calculateGrid(system,definition)
  assert.deepEqual(grid.coordinates,[[-5,-6,-7],[-4,-3,-2]])
  assert.deepEqual(grid.shape,[3,3]);assert.equal(grid.counts.converged,9)
  for(const p of grid.outcomes){assert.equal(p.x,grid.coordinates[0][p.ix]);assert.equal(p.y,grid.coordinates[1][p.iy]);assert.deepEqual(p.result,solvePoint(system,p.input));reconstruct(system,p.input,p.result)}
  assert.equal(new Set(grid.outcomes.map(p=>p.pointId)).size,9)
  assert.equal(new Set(grid.outcomes.map(p=>p.input.id)).size,9)
  assert.ok(Object.isFrozen(grid.outcomes))
})
test('pH × pe/Eh grids reuse the existing signs and temperature conversion',async()=>{
  const {system,input}=await gridFixture('pH-redox')
  for(const quantity of ['pe','Eh']){
    let d=vary(definitionFor(system,input),'H+','LAV',6,8,3,'pH')
    d=vary(d,'e-','LAV',quantity==='pe'?10:0.5,quantity==='pe'?14:0.8,3,quantity)
    const grid=await calculateGrid(system,d)
    assert.equal(grid.status,'completed')
    for(const p of grid.outcomes){assert.equal(p.transformed[0].value,-p.x);assert.equal(p.transformed[1].value,toSourceInput(d.independentVariables[1],p.y,25).value)}
    for(const [type,redoxQuantity] of [['calculated-pH',null],['calculated-redox','pe'],['calculated-redox','Eh']]){
      const derived=deriveGridOutputs(system,grid,{type,redoxQuantity});assert.ok(derived.ok)
      derived.series[0].points.forEach((p,i)=>assert.ok(Math.abs(p.value-(type==='calculated-pH'?grid.outcomes[i].x:redoxQuantity==='pe'?-grid.outcomes[i].transformed[1].value:grid.outcomes[i].transformed[1].value/toSourceInput({mode:'LA',quantity:'Eh',unit:'V-SHE'},1,25).value))<1e-12))
    }
  }
})
test('grid output equals 1D output at matching accepted coordinates with unchanged units and formulas',async()=>{
  const {system,definition}=await gridFixture(),grid=await calculateGrid(system,definition)
  const d=structuredClone(definition),y=d.independentVariables.pop();d.componentConditions.push({...y,mode:'LA',value:grid.coordinates[1][0]})
  const s=await createSweepDefinition(system,d,0);assert.ok(s.ok)
  const sweep=await runSweep(system,s.sweep)
  for(const type of ['log-concentration','log-activity','fraction','log-solubility']){
    const request={type,componentId:system.components[0].id},a=deriveGridOutputs(system,grid,request),b=deriveOutputs(system,sweep,request)
    assert.ok(a.ok&&b.ok);assert.deepEqual(a.metadata.output,b.metadata.output)
    a.series.forEach((series,j)=>series.points.slice(0,3).forEach((p,i)=>assert.equal(p.value,b.series[j].points[i].value)))
  }
  assert.equal(deriveGridOutputs(system,structuredClone(grid),{type:'log-activity'}).ok,false)
  const other=await gridFixture('precipitation');assert.equal(deriveGridOutputs(other.system,grid,{type:'log-activity'}).ok,false)
})
test('failed grid coordinates retain typed diagnostics and null derived values',async()=>{
  const {system,definition}=await gridFixture();definition.independentVariables[0]={...definition.independentVariables[0],mode:'TV',quantity:'total',unit:'mol/kg-H2O',range:{min:-1e-5,max:1e-5}}
  const grid=await calculateGrid(system,definition),d=deriveGridOutputs(system,grid,{type:'log-concentration'})
  assert.equal(grid.counts.requested,9);assert.ok(grid.counts.failed>0&&grid.counts.converged>0)
  for(const p of grid.outcomes.filter(p=>p.status==='failed')){assert.ok(p.diagnostics[0].code);assert.ok(d.series.every(s=>s.points[p.index].value===null))}
})
test('grid cancellation and superseded generation retain all unrun coordinates',async()=>{
  const {system,definition}=await gridFixture('fixed-activity',11)
  const controller=new AbortController(),pending=calculateGrid(system,definition,0,{signal:controller.signal,chunkSize:1})
  setTimeout(()=>controller.abort(),0)
  const r=await pending;assert.equal(r.status,'cancelled');assert.equal(r.counts.requested,121);assert.ok(r.counts.notRun>0)
  const stale=await calculateGrid(system,definition,0,{isCurrent:()=>false})
  assert.equal(stale.status,'invalidated-stale');assert.equal(stale.counts.notRun,121)
  assert.equal(deriveGridOutputs(system,stale,{type:'log-activity'}).ok,false)
})
test('grid rejects malformed dimensions, excessive allocation, unsupported physical models and forged definitions',async()=>{
  const {system,definition}=await gridFixture()
  for(const edit of [d=>d.independentVariables.pop(),d=>d.independentVariables.push(d.independentVariables[0]),d=>{d.independentVariables[0].range.max=d.independentVariables[0].range.min},d=>{d.activityModel='SIT'},d=>{d.temperature.value=30},d=>{d.independentVariables.forEach(a=>a.points=101);d.sampling.maxPoints=1e6}]){const d=structuredClone(definition);edit(d);assert.equal((await createGridDefinition(system,d,0)).ok,false)}
  const d=await createGridDefinition(system,definition,0);assert.equal((await runGrid(system,structuredClone(d.grid))).ok,false)
})
test('grid session commits reject stale and forged identities and retain the older snapshot on edits',async()=>{
  const {system,definition}=await gridFixture(),grid=await calculateGrid(system,definition)
  const session={schemaVersion:1,revision:0,chemicalSystem:{},calculationDefinition:definition,analysisState:{},visualizationState:{}}
  const pending=updateLaboratorySession(session,{type:'beginGrid',system,systemId:system.id,gridId:grid.gridId,revision:0})
  assert.equal(updateLaboratorySession(pending,{type:'gridResult',result:structuredClone(grid)}),pending)
  const stale={...pending,revision:1};assert.equal(updateLaboratorySession(stale,{type:'gridResult',result:grid}),stale)
  const wrong={...pending,gridRequest:{...pending.gridRequest,gridId:'other'}};assert.equal(updateLaboratorySession(wrong,{type:'gridResult',result:grid}),wrong)
  const committed=updateLaboratorySession(pending,{type:'gridResult',result:grid});assert.equal(committed.lastPlot.grid,grid)
  const visible=updateLaboratorySession(committed,{type:'plotView',patch:{gridSeriesId:'other'}});assert.equal(visible.revision,0);assert.equal(visible.gridResult,grid)
  const edited=updateLaboratorySession(visible,{type:'calculation',definition},{getSources:()=>[]});assert.equal(edited.gridResult,null);assert.equal(edited.lastPlot.grid,grid);assert.equal(edited.revision,1)
  assert.equal(deserializeSession(serializeSession(committed)).gridResult,null)
})
test('grid view, exact inspection and export preserve units, gaps and identities without chemistry imports',async()=>{
  const {system,definition}=await gridFixture(),grid=await calculateGrid(system,definition),derived=deriveGridOutputs(system,grid,{type:'log-concentration'})
  const model=gridModel(derived),view=gridBounds(derived.metadata)
  assert.equal(exactGridIndex(model,-6.1,-3.1),4)
  assert.equal(navigateGrid(view,0.5).xMin,-6.5)
  const svg=gridSvg(model,view,'dark',1,4)
  assert.ok(svg.includes('mol/kg-H2O'));assert.ok(svg.includes(grid.gridId));assert.ok(svg.includes('OLD conditions'))
  const doc=JSON.parse(gridPackage(system,grid,derived,{view,currentRevision:1,stale:true}))
  assert.equal(doc.grid.outcomes.length,9);assert.equal(doc.derived.metadata.output.unit,derived.metadata.output.unit);assert.equal(doc.grid.definition.axes[0].unit,'dimensionless')
  assert.throws(()=>gridPackage(system,{...grid,gridId:'wrong'},derived,{}))
  const controller=new AbortController();controller.abort()
  const cancelled=await calculateGrid(system,definition,0,{signal:controller.signal}),gaps=deriveGridOutputs(system,cancelled,{type:'log-concentration'}),gm=gridModel(gaps)
  assert.ok(gridSvg(gm,view).includes('url(#missing-grid)'))
  assert.ok(JSON.parse(gridPackage(system,cancelled,gaps,{})).derived.series[0].points.every(p=>p.value===null))
  for(const file of ['../src/components/GridPlot.jsx','../src/plots/gridView.js'])assert.ok(!/from\s+['"][^'"]*(?:solver|calculations)/.test(fs.readFileSync(new URL(file,import.meta.url),'utf8')))
})
