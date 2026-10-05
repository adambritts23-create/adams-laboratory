import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRepository } from '../src/thermodynamics/repository.js'
import { auditAutomaticSolids, runAutomaticControl, automaticAuditSession } from '../scripts/validation/automaticSolidsAudit.js'
import { selectedEquilibrium } from '../src/plots/resultSelection.js'
import { componentPartitions } from '../src/beaker/componentPartition.js'
import { precipitateVisual } from '../src/beaker/visual.js'
import { sedimentSegments } from '../src/beaker/scene.js'
import { updateLaboratorySession } from '../src/session/laboratorySession.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const controls=await auditAutomaticSolids(repo),[,fe,ca,mixed]=controls
const ni=await runAutomaticControl(repo,'Ni visual',automaticAuditSession(repo,['Ni 2+'],[1]))
const at=(c,pH)=>selectedEquilibrium(c.session,c.sweep.outcomes.findIndex(o=>o.coordinate===pH))

test('aqueous-only accepted state draws no candidate sediment, while Ni precipitate has its exact phase and amount',()=>{
  const aqueous=at(ni,0),solid=at(ni,10)
  assert.ok(aqueous.allSolids.length>0);assert.deepEqual(sedimentSegments(aqueous),[])
  const bed=sedimentSegments(solid)
  assert.equal(bed.length,1);assert.equal(bed[0].name,'Ni(OH)2(cr)');assert.equal(bed[0].amount,solid.solids[0].amount)
  assert.ok(solid.visual.bedHeight>0)
})

test('accepted inventory display is monotonic and bounded, explicitly not physical volume',()=>{
  let previous=0
  for(const amount of [0,1e-30,1e-12,1e-6,0.001,0.01,0.1,1,100,1e100]) {
    const v=precipitateVisual([{amount}])
    assert.ok(v.bedHeight>=previous&&v.bedHeight<=56);previous=v.bedHeight
    assert.match(v.mapping,/not thermodynamic data or calibrated volume/)
  }
  assert.equal(precipitateVisual([]).bedHeight,0)
})

test('multiple Ca solids have distinct amount-proportional pattern areas, not physical volume or density order',()=>{
  const state=at(ca,14),before=JSON.stringify(state),segments=sedimentSegments(state)
  assert.equal(segments.length,2);assert.notEqual(segments[0].pattern,segments[1].pattern)
  assert.ok(Math.abs(segments[0].width/segments[1].width-state.solids[0].amount/state.solids[1].amount)<1e-10)
  assert.deepEqual(segments.map(s=>[s.id,s.amount]),state.solids.map(s=>[s.id,s.amount]))
  assert.equal(JSON.stringify(state),before)
  assert.equal(sedimentSegments(at(mixed,14)).length,3)
})

test('Fe2O3 visual amount and coefficient-two partition remain separate unchanged authorities',()=>{
  const state=at(fe,8.4),before=JSON.stringify(componentPartitions(state)),solid=sedimentSegments(state)[0]
  assert.equal(solid.name,'Fe2O3(cr)');assert.equal(solid.amount,0.04999999999949872)
  const p=componentPartitions(state)[0];assert.equal(p.solids[0].coefficient,2)
  assert.equal(p.solids[0].componentAmount,2*solid.amount)
  assert.equal(JSON.stringify(componentPartitions(state)),before)
})

test('excluded Ni phase never appears in the display, even if another supported solid replaces it',async()=>{
  const present=at(ni,10).solids[0]
  const session=updateLaboratorySession(ni.session,{type:'system',action:{type:'toggleSpecies',id:present.id}},repo)
  const excluded=await runAutomaticControl(repo,'Ni excluded visual',session)
  for(const outcome of excluded.sweep.outcomes){const state=at(excluded,outcome.coordinate);assert.ok(sedimentSegments(state).every(s=>s.id!==present.id))}
})

test('stale and unavailable selected states never retain a previous precipitate display',()=>{
  const stale={...ni.session,revision:ni.session.revision+1}
  assert.deepEqual(sedimentSegments(selectedEquilibrium(stale,20)),[])
  assert.deepEqual(sedimentSegments({ok:false,solids:at(ni,10).solids}),[])
  assert.deepEqual(sedimentSegments(undefined),[])
})

test('sample-to-sample display uses original results and preserves all partition values',()=>{
  const before=JSON.stringify(ni.sweep)
  for(let i=0;i<ni.sweep.outcomes.length;i++){
    const state=selectedEquilibrium(ni.session,i),partition=JSON.stringify(componentPartitions(state))
    const segments=sedimentSegments(state)
    assert.equal(state.result,ni.sweep.outcomes[i].result)
    assert.equal(segments.length,state.solids.length)
    assert.equal(JSON.stringify(componentPartitions(state)),partition)
  }
  assert.equal(JSON.stringify(ni.sweep),before)
})

test('refined drawing exposes keyboard phase inspection and does not render liquid for unavailable states',()=>{
  const ui=fs.readFileSync('src/components/BeakerDrawing.jsx','utf8')
  assert.match(ui,/state.ok \|\| liquid.physical/);assert.match(ui,/segments.length>0/)
  assert.match(ui,/tabIndex: 0/);assert.match(ui,/\['Enter', ' '\]/)
  assert.match(ui,/data-exact-amount=\{s.amount\}/)
  assert.doesNotMatch(ui,/solvePoint|runSweep|density|Math.random/)
})

test('partition gauge uses the existing computed partition, with labels and reduced-motion support',()=>{
  const ui=fs.readFileSync('src/components/ComponentPartition.jsx','utf8'),css=fs.readFileSync('src/components/InteractiveBeaker.css','utf8')
  assert.match(ui,/partitions = componentPartitions\(state\)/)
  assert.match(ui,/p.solidFraction/);assert.match(ui,/Dissolved<\/span><span>Solid phases/)
  assert.match(css,/@media\(prefers-reduced-motion:reduce\).*transition:none/)
})

test('Calculation retains one sticky Plot action, readonly conditions and collapsed advanced sections',()=>{
  const ui=fs.readFileSync('src/components/CalculationWorkspace.jsx','utf8'),css=fs.readFileSync('src/App.css','utf8')
  assert.equal((ui.match(/'Plot diagram'/g)||[]).length,1)
  assert.match(css,/\.graph-first \.setup-title \{ position:sticky; top:0/)
  assert.match(ui,/aria-label="Temperature"[^>]*readOnly/);assert.match(ui,/aria-label="Pressure"[^>]*readOnly/)
  assert.match(ui,/aria-label="Calculation conditions"/)
  assert.doesNotMatch(ui,/<details[^>]*open[^>]*><summary>Advanced/)
  assert.match(fs.readFileSync('src/components/FixedCondition.jsx','utf8'),/type="number".*onChange/)
})

test('observer portrait is separate decorative content, while header media remains intact',()=>{
  const ui=fs.readFileSync('src/components/ObserverPortrait.jsx','utf8')
  assert.doesNotMatch(ui,/session|ResultSelectionContext|solvePoint|onCalculate/)
  assert.doesNotMatch(ui,/object-fit/) // fitting is stylesheet-owned
})
