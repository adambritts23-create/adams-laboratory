import test from 'node:test'
import assert from 'node:assert/strict'
import { gridFixture, calculateGrid, vary } from './phase8Helpers.js'
import { carbonateGrid } from './phase9Helpers.js'
import { deriveGridOutputs, dissolvedOutputValue } from '../src/calculations/outputs.js'
import { outputGroups, validateOutputRequest } from '../src/calculations/outputDescriptors.js'
import { cellDiagnostic, gridDiagnostics } from '../src/analysis/gridDiagnostics.js'
import { scientificSummary } from '../src/analysis/summary.js'
import { extractSlice } from '../src/analysis/slices.js'
import { gridModel, gridPackage } from '../src/plots/gridView.js'
import { prepareSurface } from '../src/plots/surface3d.js'
import { createGridDefinition } from '../src/calculations/grid.js'

async function partial() {
  const f=await gridFixture('complexation',5)
  f.definition=vary(f.definition,f.system.components[0].id,'TV',-1e-6,1e-6,5)
  const grid=await calculateGrid(f.system,f.definition),derived=deriveGridOutputs(f.system,grid,{type:'total-dissolved',componentId:f.system.components[0].id})
  return {...f,grid,derived,series:derived.series[0]}
}
test('carbonate total descriptor is shared by scalar map, surface, summary and exported exact cells',async()=>{
  const {system,definition,carbonate}=await carbonateGrid(),grid=await calculateGrid(system,definition)
  const d=deriveGridOutputs(system,grid,{type:'total-dissolved',componentId:carbonate.id}),series=d.series[0],model=gridModel(d),summary=scientificSummary(system,grid,d,series.id)
  assert.equal(grid.counts.failed,0);assert.equal(summary.counts.validValues,35)
  assert.equal(series.descriptor.quantity,'total-dissolved-component');assert.equal(model.series.descriptor,series.descriptor)
  assert.equal(prepareSurface({...model,analysis:summary.analysis}).series.descriptor,series.descriptor)
  assert.equal(summary.output.descriptor,series.descriptor)
  const doc=JSON.parse(gridPackage(system,grid,d,{selectedSeries:series}))
  assert.equal(doc.sampledOutput.cells.length,35);assert.equal(doc.sampledOutput.cells[0].requestedOutputStatus,'AVAILABLE')
  assert.equal(doc.sampledOutput.cells[0].requestedOutputValue,series.points[0].value)
})
test('safe complexation dissolved sum uses actual coefficients and excludes free/supplied substitutions',async()=>{
  const {system,definition}=await gridFixture('complexation'),grid=await calculateGrid(system,definition),componentId=system.components[0].id
  const d=deriveGridOutputs(system,grid,{type:'total-dissolved',componentId})
  grid.outcomes.forEach((o,i)=>{assert.equal(o.status,'converged');const sum=o.result.freeComponentConcentrations[0]+system.aqueousRows.reduce((s,j)=>s+system.products[j].coefficients[0]*o.result.concentrations[system.components.length+j],0);assert.ok(Math.abs(sum-d.series[0].points[i].value)<1e-15)})
  assert.ok(d.series[0].points.some((p,i)=>p.value>grid.outcomes[i].result.freeComponentConcentrations[0]*1.1))
  const supplied=deriveGridOutputs(system,grid,{type:'analytical-total',componentId});assert.ok(supplied.series[0].points.every(p=>p.value===null&&p.reason==='activity-controlled-component-has-no-supplied-total'))
})
test('dissolved logs never floor zero, log negative sums or turn unavailable values into numbers',()=>{
  assert.equal(dissolvedOutputValue(0).value,0);assert.equal(dissolvedOutputValue(0,true).reason,'zero-log-undefined')
  for(const log of [false,true]){assert.equal(dissolvedOutputValue(-1,log).reason,'negative-dissolved-total-in-source-basis');assert.equal(dissolvedOutputValue(null,log).reason,'unavailable-dissolved-total');assert.equal(dissolvedOutputValue(NaN,log).value,null)}
  assert.equal(dissolvedOutputValue(1e-200,true).value,-200)
})
test('shared selector catalog and stable descriptors distinguish free, individual and component inventories',async()=>{
  assert.ok(outputGroups['Component totals'].includes('total-dissolved'));assert.ok(outputGroups['Component totals'].includes('analytical-total'))
  const {system,definition}=await gridFixture(),grid=await calculateGrid(system,definition),d=deriveGridOutputs(system,grid,{type:'concentration'})
  assert.equal(d.series.find(s=>s.kind==='free-component').descriptor.quantity,'free-component')
  assert.equal(d.series.find(s=>s.kind==='reaction-product').descriptor.quantity,'individual-species')
  assert.equal(new Set(d.series.map(s=>s.descriptor.id)).size,d.series.length)
  const again=deriveGridOutputs(system,grid,{type:'concentration'});assert.deepEqual(d.series.map(s=>s.descriptor),again.series.map(s=>s.descriptor))
})
test('normalization preserves uncertainty and raw/attempt evidence rather than inventing causes',()=>{
  const roots={'numerical-nonconvergence':'FAILED_NONCONVERGENCE','singular-or-ill-conditioned':'FAILED_SINGULAR_OR_UNDERDETERMINED','inconsistent-or-boundary-total':'FAILED_INVALID_STATE','unsupported-basis-transformation':'FAILED_UNSUPPORTED_CHEMISTRY','invalid-constraint':'INVALID_INPUT','unknown':'FAILED_UNCLASSIFIED','no-consistent-solid-assemblage':'FAILED_UNCLASSIFIED'}
  for(const [code,expected]of Object.entries(roots)){const diagnostics=[{code,message:'Reported diagnostic'}],attempts=[{code:'numerical-nonconvergence',iteration:7,residualNorm:0.25}];const d=cellDiagnostic({status:'failed',diagnostics,result:{attempts}},null,{unit:'test units'});assert.equal(d.normalizedDiagnosticCategory,expected);assert.equal(d.rawDiagnostic,diagnostics);assert.equal(d.attempts,attempts);assert.equal(d.iterations,null)}
})
test('calculated unavailable, failed and cancelled are independent statuses even with misleading finite F',()=>{
  const d=cellDiagnostic({status:'converged',scientificAcceptance:'passed'},{value:null,reason:'zero-log-undefined'})
  assert.equal(d.normalizedDiagnosticCategory,'CALCULATED_OUTPUT_UNAVAILABLE');assert.equal(d.requestedOutputStatus,'UNAVAILABLE')
  for(const status of ['failed','not-run']){const x=cellDiagnostic({status},{value:123});assert.equal(x.requestedOutputValue,null);assert.equal(x.requestedOutputStatus,'NOT_CALCULATED')}
  assert.equal(cellDiagnostic({status:'not-run'},null).normalizedDiagnosticCategory,'CANCELLED_OR_UNRUN')
})
test('preflight rejects missing/excluded/incompatible F before a grid while retaining signed component algebra',async()=>{
  const {system,definition}=await gridFixture(),valid={type:'concentration',seriesId:system.components[0].id}
  assert.equal(validateOutputRequest(system,valid,{requireSeries:true}).ok,true)
  for(const request of [{...valid,seriesId:'missing'},{type:'solid-amount',seriesId:system.components[0].id},{type:'total-dissolved',componentId:'absent'},{type:'calculated-pH'},{type:'unknown'}])assert.equal(validateOutputRequest(system,request,{requireSeries:true}).ok,false)
  assert.equal(validateOutputRequest(system,{type:'analytical-total',componentId:system.components[0].id},{definition}).ok,false)
  // Descriptor policy only: signed coefficients are not rewritten or inferred from formulas.
  const signed={...system,products:[{coefficients:[-1,1]}]};assert.equal(validateOutputRequest(signed,{type:'total-dissolved',componentId:system.components[0].id}).ok,true)
  assert.equal(validateOutputRequest(signed,{type:'fraction',componentId:system.components[0].id}).ok,false)
  const invalid=structuredClone(definition);invalid.independentVariables[1].componentId=invalid.independentVariables[0].componentId
  assert.equal((await createGridDefinition(system,invalid,0)).ok,false)
})
test('real partial complexation grid keeps failures, exact coverage, extrema, slices and surface holes',async()=>{
  const {system,grid,derived,series}=await partial(),d=gridDiagnostics(grid,series),summary=scientificSummary(system,grid,derived,series.id)
  assert.equal(grid.counts.failed,15);assert.equal(grid.counts.converged,10)
  assert.equal(d.countsByCategory.FAILED_INVALID_STATE,15);assert.equal(d.countsByCategory.CALCULATED,10)
  assert.equal(d.axes[1][0].calculated,0);assert.equal(d.axes[1][4].calculated,5)
  assert.ok(summary.analysis.extrema.minimum.index>=15)
  const slice=extractSlice(derived,series.id,'vertical',0);assert.equal(slice.series[0].points.filter(p=>p.value===null).length,3)
  assert.equal(prepareSurface(gridModel(derived)).triangles.length,8)
  const json=JSON.parse(gridPackage(system,grid,derived,{selectedSeries:series,scientificSummary:summary}))
  assert.equal(json.sampledOutput.cells[0].normalizedDiagnosticCategory,'FAILED_INVALID_STATE');assert.ok(json.sampledOutput.cells[0].rawDiagnostic.length)
  assert.deepEqual(json.grid.outcomes[0].diagnostics,grid.outcomes[0].diagnostics)
})
test('cancelled grid preserves exact unrun coordinates and no accepted output or surface',async()=>{
  const {system,definition}=await gridFixture(),controller=new AbortController();controller.abort()
  const grid=await calculateGrid(system,definition,0,{signal:controller.signal}),derived=deriveGridOutputs(system,grid,{type:'concentration'}),d=gridDiagnostics(grid,derived.series[0])
  assert.equal(d.countsByCategory.CANCELLED_OR_UNRUN,9);assert.equal(d.calculatedRanges,null);assert.equal(prepareSurface(gridModel(derived)).triangles.length,0)
})
test('supplied total remains the requested constraint instead of recomputed dissolved amount',async()=>{
  const {system,grid}=await partial(),componentId=system.components[0].id,d=deriveGridOutputs(system,grid,{type:'analytical-total',componentId})
  assert.equal(d.series[0].descriptor.quantity,'supplied-analytical-total')
  grid.outcomes.forEach((o,i)=>{if(o.status==='converged')assert.equal(d.series[0].points[i].value,o.input.constraints[0].value)})
})
