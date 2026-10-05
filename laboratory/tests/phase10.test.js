import test from 'node:test'
import assert from 'node:assert/strict'
import { references, prepareReference } from './pointHelpers.js'
import { definitionFor, vary } from './phase6Helpers.js'
import { gridFixture, calculateGrid } from './phase8Helpers.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { deriveOutputs, deriveGridOutputs } from '../src/calculations/outputs.js'
import { analyzeSamples } from '../src/analysis/samples.js'
import { scientificSummary, summaryText } from '../src/analysis/summary.js'
import { extractSlice } from '../src/analysis/slices.js'
import { gridModel, gridBounds, gridSvg, gridPackage } from '../src/plots/gridView.js'
import { segments } from '../src/plots/geometry.js'
import { componentBalanceTolerance } from '../src/solver/validationContract.js'
import { updateLaboratorySession } from '../src/session/laboratorySession.js'

async function fixture(name='complexation',mode='LTV',min=-6,max=-3){
  const {system,input}=await prepareReference(references.cases.find(c=>c.id===name))
  const d=vary(definitionFor(system,input),system.components[0].id,mode,min,max,5)
  const prepared=await createSweepDefinition(system,d,0);assert.ok(prepared.ok)
  return {system,sweep:await runSweep(system,prepared.sweep)}
}
// Pure sampled-analysis fixtures, not equilibrium states or thermodynamic data.
const samples=values=>values.map((value,index)=>({index,x:index,value,pointStatus:value===null?'failed':'converged',linearValue:value===null?null:10**value,linearUnit:'mol/kg-H2O'}))
test('total dissolved is the actual weighted aqueous sum, not a free species or copied input total',async()=>{
  const {system,sweep}=await fixture(),componentId=system.components[0].id,d=deriveOutputs(system,sweep,{type:'total-dissolved',componentId})
  assert.ok(d.ok);assert.ok(sweep.outcomes.every(p=>p.result.ok))
  sweep.outcomes.forEach((p,i)=>{
    const independentlySummed=p.result.concentrations[0]+system.products.reduce((s,r,j)=>s+(r.phase==='aqueous'?r.coefficients[0]*p.result.concentrations[system.components.length+j]:0),0)
    assert.ok(Math.abs(d.series[0].points[i].value-independentlySummed)<1e-15)
    const target=p.input.constraints[0].value
    assert.ok(Math.abs(d.series[0].points[i].value-target)<=componentBalanceTolerance(target,1e-6))
  })
  assert.ok(sweep.outcomes.some((p,i)=>d.series[0].points[i].value>p.result.concentrations[0]*1.1))
  const fixed=await fixture('fixed-activity','LAV',-7,-5),fd=deriveOutputs(fixed.system,fixed.sweep,{type:'total-dissolved',componentId:fixed.system.components[0].id})
  assert.ok(fd.series[0].points.every((p,i)=>p.value!==fixed.sweep.outcomes[i].input.constraints[0].value))
})
test('total dissolved excludes pure solid inventory and solid amount is independently selected',async()=>{
  const {system,sweep}=await fixture('precipitation','LTV',-8,-2),componentId=system.components[0].id
  const d=deriveOutputs(system,sweep,{type:'total-dissolved',componentId}),solid=deriveOutputs(system,sweep,{type:'solid-amount'})
  assert.ok(d.ok&&solid.ok);assert.equal(solid.series.length,1)
  let present=false
  sweep.outcomes.forEach((p,i)=>{assert.ok(p.result.ok);assert.equal(solid.series[0].points[i].value,p.result.solids[0].amount);if(p.result.solids[0].amount>0){present=true;assert.ok(d.series[0].points[i].value<p.result.componentTotals[0])}})
  assert.ok(present);assert.equal(solid.series[0].points[0].value,0)
})
test('log dissolved extrema retain underlying linear amounts; zero logs remain unavailable',async()=>{
  const {system,sweep}=await fixture(),componentId=system.components[0].id,d=deriveOutputs(system,sweep,{type:'log-total-dissolved',componentId}),linear=deriveOutputs(system,sweep,{type:'total-dissolved',componentId})
  d.series[0].points.forEach((p,i)=>{assert.equal(p.value,Math.log10(linear.series[0].points[i].value));assert.equal(p.linearValue,linear.series[0].points[i].value)})
  const s=scientificSummary(system,sweep,d,d.series[0].id);assert.equal(s.analysis.extrema.minimum.linearValue,Math.min(...linear.series[0].points.map(p=>p.value)))
  const f=await fixture('precipitation','LTV',-8,-2),logs=deriveOutputs(f.system,f.sweep,{type:'log-concentration'}).series.find(s=>s.phase==='solid')
  assert.equal(logs.points[0].value,null);assert.equal(logs.points[0].linearValue,0);assert.equal(logs.points[0].reason,'zero-log-undefined')
})
test('ordinary dissolved output rejects signed bookkeeping component inventories',async()=>{
  const {system,input}=await prepareReference(references.cases.find(c=>c.id==='acid-base')),d=vary(definitionFor(system,input),system.components[0].id,'LAV',-8,-6)
  const prepared=await createSweepDefinition(system,d,0),sweep=await runSweep(system,prepared.sweep)
  assert.equal(deriveOutputs(system,sweep,{type:'total-dissolved',componentId:system.components[0].id}).ok,false)
})
test('sampled extrema ignore even finite failed/unrun values and expose no-valid state',()=>{
  const p=samples([2,-100,100,3]);p[1].pointStatus='failed';p[2].pointStatus='not-run'
  const a=analyzeSamples(p);assert.equal(a.extrema.minimum.index,0);assert.equal(a.extrema.maximum.index,3);assert.equal(a.validCount,2)
  const none=analyzeSamples(samples([null,null]));assert.equal(none.status,'unavailable');assert.equal(none.extrema.minimum,null)
  assert.equal(analyzeSamples([]).valueCoverage,0)
})
test('disconnected valid regions use requested adjacency, never a diagonal bridge',()=>{
  const p=samples([1,null,2,null,3,null,4,null,5]),a=analyzeSamples(p,{shape:[3,3]})
  assert.equal(a.regions.count,5);assert.ok(a.regions.regions.every(r=>r.count===1))
  assert.equal(analyzeSamples(samples([1,2,null,3])).regions.count,2)
  assert.throws(()=>analyzeSamples(p,{shape:[2,2]}))
})
test('thresholds retain exact bracketing samples and equality, with no interpolation across gaps',()=>{
  const a=analyzeSamples(samples([0,2,null,0,1,2]),{threshold:1})
  assert.equal(a.threshold.brackets.length,1);assert.equal(a.threshold.brackets[0].from.index,0);assert.equal(a.threshold.brackets[0].to.index,1)
  assert.equal(a.threshold.exactSamples[0].index,4)
  assert.equal(analyzeSamples(samples([0,null,2]),{threshold:1}).threshold.brackets.length,0)
  assert.equal(analyzeSamples(samples([1,2]),{threshold:NaN}).threshold.status,'invalid')
  assert.equal(analyzeSamples(samples([0,2,0,2]),{shape:[2,2],threshold:1}).threshold.brackets.length,2)
})
test('exact horizontal/vertical slices preserve grid indices, values and failed gaps',async()=>{
  const {system,definition}=await gridFixture();definition.independentVariables[0]={...definition.independentVariables[0],mode:'TV',unit:'mol/kg-H2O',quantity:'total',range:{min:-1e-5,max:1e-5}}
  const grid=await calculateGrid(system,definition),d=deriveGridOutputs(system,grid,{type:'log-concentration'}),id=d.series[0].id
  for(const direction of ['horizontal','vertical']){
    const slice=extractSlice(d,id,direction,4)
    slice.series[0].points.forEach(p=>{const original=d.series[0].points[p.gridIndex];assert.equal(p.value,original.value);assert.equal(p.pointStatus,original.pointStatus);assert.equal(p.x,direction==='horizontal'?original.x:original.y)})
  }
  const row=extractSlice(d,id,'horizontal',4);assert.deepEqual(row.metadata.slice.indices,[3,4,5]);assert.equal(row.series[0].points[0].value,null)
  assert.ok(segments(row.series[0].points).every(segment=>segment.every(p=>p.value!==null)))
  assert.throws(()=>extractSlice(d,id,'horizontal',-1))
})
test('failure summaries use actual diagnostic codes and exclude failed extrema',async()=>{
  const {system,sweep}=await fixture('fixed-activity','TV',-1e-5,1e-5),d=deriveOutputs(system,sweep,{type:'total-dissolved',componentId:system.components[0].id}),s=scientificSummary(system,sweep,d,d.series[0].id)
  assert.equal(s.counts.failed,3);assert.equal(s.counts.calculated,2);assert.equal(s.counts.validValues,2)
  assert.equal(s.failures.reduce((n,g)=>n+g.count,0),3);assert.equal(s.failures[0].code,sweep.outcomes[0].diagnostics[0].code)
  assert.equal(s.analysis.extrema.minimum.index,3);assert.ok(summaryText(s).includes('3 states did not establish numerical equilibrium'))
})
test('ScientificResultSummary is deterministic, rejects forged inputs and exposes stale facts',async()=>{
  const {system,sweep}=await fixture(),d=deriveOutputs(system,sweep,{type:'total-dissolved',componentId:system.components[0].id}),id=d.series[0].id
  const a=scientificSummary(system,sweep,d,id),b=scientificSummary(system,sweep,d,id)
  assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(a.revision,0);assert.ok(a.sourceIdentity)
  assert.equal(scientificSummary(system,sweep,structuredClone(d),id).ok,false)
  assert.equal(scientificSummary(system,structuredClone(sweep),d,id).ok,false)
  const old=scientificSummary(system,sweep,d,id,{currentRevision:1});assert.equal(old.stale,true);assert.ok(summaryText(old).startsWith('OLD CONDITIONS'))
})
test('cancelled grids retain unrun counts, distinct masks, and unavailable extrema in exports',async()=>{
  const {system,definition}=await gridFixture(),c=new AbortController();c.abort()
  const grid=await calculateGrid(system,definition,0,{signal:c.signal}),d=deriveGridOutputs(system,grid,{type:'log-concentration'}),id=d.series[0].id,s=scientificSummary(system,grid,d,id)
  assert.equal(s.counts.cancelled,9);assert.equal(s.counts.unrun,9);assert.equal(s.counts.failed,0);assert.equal(s.analysis.extrema.minimum,null)
  const model={...gridModel(d,id),analysis:s.analysis},svg=gridSvg(model,gridBounds(d.metadata),'dark',0,null,undefined,{showMinimum:true})
  assert.ok(svg.includes('fill="url(#unrun-grid)"'));assert.ok(!svg.includes('data-extremum="minimum"'))
  const doc=JSON.parse(gridPackage(system,grid,d,{selectedSeries:model.series,scientificSummary:s}));assert.equal(doc.scientificSummary.counts.unrun,9);assert.equal(doc.sampledOutput.cells.length,9)
})
test('map extrema toggles preserve scientific revision and the accepted result',async()=>{
  const {system,definition}=await gridFixture(),grid=await calculateGrid(system,definition),d=deriveGridOutputs(system,grid,{type:'log-concentration'}),model=gridModel(d),s=scientificSummary(system,grid,d,model.series.id)
  const svg=gridSvg({...model,analysis:s.analysis},gridBounds(d.metadata),'dark',0,null,undefined,{showMinimum:true,showMaximum:true})
  assert.ok(svg.includes('data-extremum="minimum"'));assert.ok(svg.includes('data-extremum="maximum"'))
  const session={revision:0,lastPlot:{system,grid},visualizationState:{}},view=updateLaboratorySession(session,{type:'plotView',patch:{showMinimum:true,analysisThreshold:-6}})
  assert.equal(view.revision,0);assert.equal(view.lastPlot,session.lastPlot)
})

test('all-failed current 1D sweeps replace old snapshots with inspectable unavailable analysis',async()=>{
  const {system,sweep}=await fixture('fixed-activity','TV',-1e-5,-1e-6)
  const session={revision:0,lastPlot:{marker:'older'},visualizationState:{}}
  const pending=updateLaboratorySession(session,{type:'beginSweep',system,systemId:system.id,sweepId:sweep.sweepId,revision:0})
  const next=updateLaboratorySession(pending,{type:'sweepResult',result:sweep})
  assert.equal(next.lastPlot.sweep,sweep)
  const d=deriveOutputs(system,sweep,{type:'concentration'}),s=scientificSummary(system,sweep,d,d.series[0].id)
  assert.equal(s.analysis.status,'unavailable');assert.equal(s.counts.failed,5)
})

test('calculated-domain overlay uses only differing adjacent sampled availability',async()=>{
  const {calculatedDomainEdges}=await import('../src/plots/scalarMap.js')
  const {system,definition}=await gridFixture();definition.independentVariables[0]={...definition.independentVariables[0],mode:'TV',quantity:'total',unit:'mol/kg-H2O',range:{min:-1e-5,max:1e-5}}
  const grid=await calculateGrid(system,definition),d=deriveGridOutputs(system,grid,{type:'log-concentration'}),model=gridModel(d)
  const edges=calculatedDomainEdges(model);assert.equal(edges.length,3)
  assert.ok(edges.every(e=>e.from.x===5e-6&&e.to.x===5e-6))
  const svg=gridSvg(model,gridBounds(d.metadata),'dark',0,null,undefined,{showDomainBoundary:true})
  assert.ok(svg.includes('data-domain-boundary="sample-availability"'))
})
