import test from 'node:test'
import assert from 'node:assert/strict'
import { references, prepareReference } from './pointHelpers.js'
import { definitionFor, vary } from './phase6Helpers.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { deriveOutputs } from '../src/calculations/outputs.js'
import { bounds, segments, inspectPoint, nearestIndex, zoom, pan, validView } from '../src/plots/geometry.js'
import { conditionLines, figureSvg, resultPackage } from '../src/plots/export.js'
import { updateLaboratorySession, deserializeSession, serializeSession } from '../src/session/laboratorySession.js'
import fs from 'node:fs'

export async function outputFixture(name='fixed-activity', mode='LAV', min=-7, max=-5, index=0, quantity, count=5) {
  const {system,input} = await prepareReference(references.cases.find(c=>c.id===name))
  const d = vary(definitionFor(system,input),system.components[index].id,mode,min,max,count,quantity)
  const definition = await createSweepDefinition(system,d,0)
  assert.ok(definition.ok)
  return {system,sweep:await runSweep(system,definition.sweep)}
}
test('derived log concentration and log activity preserve source units and raw values',async()=>{
  const {system,sweep}=await outputFixture()
  for(const type of ['log-concentration','log-activity']){
    const d=deriveOutputs(system,sweep,{type});assert.ok(d.ok)
    d.series.forEach((s,j)=>s.points.forEach((p,i)=>assert.equal(p.value,type==='log-concentration'?Math.log10(sweep.outcomes[i].result.concentrations[j]):sweep.outcomes[i].result.logActivities[j])))
    assert.ok(d.metadata.output.unit.includes(type==='log-concentration'?'mol/kg-H2O':'activity'))
  }
})
test('nonnegative component fractions sum to one including solids; dissolved output excludes solid inventory',async()=>{
  const {system,sweep}=await outputFixture('precipitation','LTV',-8,-2)
  const fraction=deriveOutputs(system,sweep,{type:'fraction',componentId:system.components[0].id})
  const dissolved=deriveOutputs(system,sweep,{type:'log-solubility',componentId:system.components[0].id})
  assert.ok(fraction.ok && dissolved.ok)
  assert.equal(fraction.metadata.output.componentId,system.components[0].id)
  assert.ok(fraction.metadata.output.label.includes(system.components[0].name))
  assert.equal(dissolved.metadata.output.componentId,system.components[0].id)
  sweep.outcomes.forEach((p,i)=>{
    assert.equal(p.status,'converged')
    assert.ok(Math.abs(fraction.series.reduce((v,s)=>v+s.points[i].value,0)-1)<1e-10)
    assert.equal(dissolved.series[0].points[i].value,Math.log10(p.result.dissolvedComponentAmounts[0]))
  })
  const amount=deriveOutputs(system,sweep,{type:'log-concentration'}), activity=deriveOutputs(system,sweep,{type:'log-activity'})
  const solid=system.products.find(p=>p.phase==='solid').id
  assert.equal(amount.series.find(s=>s.id===solid).points[0].reason,'zero-log-undefined')
  assert.equal(activity.series.find(s=>s.id===solid).points[0].reason,'absent-solid-activity-unavailable')
  assert.equal(activity.series.find(s=>s.id===solid).points.at(-1).value,0)
})
test('pH and pe/Eh derived values follow independently checked signs and units',async()=>{
  const acid=await outputFixture('acid-base','LAV',6,8,0,'pH')
  const ph=deriveOutputs(acid.system,acid.sweep,{type:'calculated-pH'})
  assert.deepEqual(ph.series[0].points.map(p=>p.value),acid.sweep.coordinates)
  const special=deriveOutputs(acid.system,acid.sweep,{type:'log-concentration'})
  assert.equal(special.series[1].points[0].value,null)
  assert.equal(deriveOutputs(acid.system,acid.sweep,{type:'fraction',componentId:acid.system.components[0].id}).ok,false)
  const redox=await outputFixture('redox','LAV',0.5,0.9,1,'Eh')
  for(const redoxQuantity of ['pe','Eh']){
    const d=deriveOutputs(redox.system,redox.sweep,{type:'calculated-redox',redoxQuantity})
    assert.equal(d.metadata.output.unit,redoxQuantity==='Eh'?'V-SHE':'dimensionless')
    const svg=figureSvg(d,d.series.map(s=>s.id),bounds(d.series,d.metadata.axis))
    assert.ok(svg.includes('Eh [V-SHE]'))
    assert.ok(svg.includes(d.metadata.output.unit))
    d.series[0].points.forEach((p,i)=>{
      const expected=redoxQuantity==='Eh'?redox.sweep.coordinates[i]:redox.sweep.coordinates[i]*Number('96485.3321233100184')/(8.31446261815324*Math.LN10*298.15)
      assert.ok(Math.abs(p.value-expected)<1e-13)
    })
  }
})
test('unsupported requests and untrusted or stale result objects cannot create scientific series',async()=>{
  const {system,sweep}=await outputFixture()
  for(const request of [{type:'predominance'},{type:'relative-log-activity'},{type:'hydrogen-affinity'},{type:'calculated-pH'},{type:'fraction',componentId:'missing'}]) assert.equal(deriveOutputs(system,sweep,request).ok,false)
  assert.equal(deriveOutputs(system,structuredClone(sweep),{type:'log-activity'}).ok,false)
  const stale=await runSweep(system,sweep.definition,{isCurrent:()=>false})
  assert.equal(deriveOutputs(system,stale,{type:'log-activity'}).ok,false)
})
test('failed and not-run samples stay gaps; geometry never joins separated runs',async()=>{
  const {system,sweep}=await outputFixture('fixed-activity','TV',-1e-5,1e-5)
  const d=deriveOutputs(system,sweep,{type:'log-concentration'})
  assert.equal(d.series[0].points[2].value,null)
  assert.equal(d.series[0].points[2].reason,'failed')
  assert.equal(d.series[0].points.length,5)
  assert.deepEqual(segments([{x:0,value:1},{x:1,value:null},{x:2,value:2}]).map(r=>r.map(p=>p.x)),[[0],[2]])
  // Renderer-only synthetic gap layout: no fabricated equilibrium fixture.
  const layout={...d,series:[{...d.series[0],points:[{x:0,value:1},{x:1,value:null},{x:2,value:2}]}]}
  const svg=figureSvg(layout,[layout.series[0].id],{xMin:0,xMax:2,yMin:0,yMax:3})
  assert.equal((svg.match(/<circle /g)??[]).length,2)
  assert.equal((svg.match(/<polyline /g)??[]).length,0)
  const controller=new AbortController();controller.abort()
  const cancelled=await runSweep(system,sweep.definition,{signal:controller.signal})
  assert.ok(deriveOutputs(system,cancelled,{type:'log-activity'}).series.every(s=>s.points.every(p=>p.value===null)))
})
test('exact pinned lookup, numeric axis geometry, pan and zoom do not interpolate chemistry',async()=>{
  const {system,sweep}=await outputFixture('acid-base','LAV',6,8,0,'pH')
  const d=deriveOutputs(system,sweep,{type:'log-concentration'})
  const i=nearestIndex(sweep.coordinates,7.1), lookup=inspectPoint(d,i)
  assert.equal(lookup.x,7);assert.equal(lookup.values[0].value,d.series[0].points[2].value)
  const view=bounds(d.series,d.metadata.axis)
  assert.equal(view.xMin,6);assert.equal(view.xMax,8)
  assert.ok(validView(zoom(view,0.5)));assert.equal(pan(view,1,0).xMin,7)
  assert.equal(validView({...view,xMax:5}),false)
})
test('plot visibility leaves revision and chemistry untouched; scientific edits retain clearly old plot identity',async()=>{
  const {system,sweep}=await outputFixture()
  const session={schemaVersion:1,revision:0,chemicalSystem:{temperature:25,pressure:1},calculationDefinition:sweep.definition.calculationDefinition,visualizationState:{},analysisState:{}}
  const pending=updateLaboratorySession(session,{type:'beginSweep',system,systemId:system.id,sweepId:sweep.sweepId,revision:0})
  const committed=updateLaboratorySession(pending,{type:'sweepResult',result:sweep})
  const hidden=updateLaboratorySession(committed,{type:'plotView',patch:{visibleIds:[]}})
  assert.equal(hidden.revision,0);assert.equal(hidden.sweepResult,sweep);assert.equal(hidden.chemicalSystem,committed.chemicalSystem)
  const edited=updateLaboratorySession(hidden,{type:'calculation',definition:sweep.definition.calculationDefinition},{getSources:()=>[]})
  assert.equal(edited.sweepResult,null);assert.equal(edited.lastPlot.sweep.revision,0);assert.equal(edited.revision,1)
  assert.equal(updateLaboratorySession(edited,{type:'sweepResult',result:sweep}),edited)
  assert.equal(deserializeSession(serializeSession(committed)).lastPlot,null)
})
test('figure and numerical exports retain actual conditions, identities, visibility, units and gap reasons',async()=>{
  const {system,sweep}=await outputFixture('acid-base','LAV',6,8,0,'pH')
  const d=deriveOutputs(system,sweep,{type:'log-concentration'}), visible=d.series.map(s=>s.id), view=bounds(d.series,d.metadata.axis)
  const svg=figureSvg(d,visible,view,'light',1)
  assert.ok(svg.includes('STALE'));assert.ok(svg.includes('pH'));assert.ok(svg.includes(sweep.sweepId));assert.ok(svg.includes('not evaluated (automatic)'))
  assert.ok(conditionLines(d.metadata).some(l=>l.includes('H2O: LA')))
  const json=JSON.parse(resultPackage(system,sweep,d,visible,view,1))
  assert.equal(json.stale,true);assert.deepEqual(json.visibleIds,visible);assert.equal(json.derived.series[1].points[0].value,null)
  assert.equal(json.sweep.method.version,'1.0.1');assert.equal(json.system.id,system.id)
})
test('renderer geometry and SVG modules do not import preparation or numerical solvers',()=>{
  for(const file of ['../src/plots/geometry.js','../src/plots/export.js','../src/components/ScientificPlot.jsx']){
    const text=fs.readFileSync(new URL(file,import.meta.url),'utf8')
    assert.ok(!/from\s+['"][^'"]*(?:solver|calculations)/.test(text))
  }
})
