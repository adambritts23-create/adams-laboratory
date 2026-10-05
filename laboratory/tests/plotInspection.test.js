import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { references, prepareReference } from './pointHelpers.js'
import { definitionFor, vary } from './phase6Helpers.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { deriveOutputs } from '../src/calculations/outputs.js'
import { figureSvg } from '../src/plots/export.js'
import { bounds, plotBox } from '../src/plots/geometry.js'
import { updateLaboratorySession } from '../src/session/laboratorySession.js'

async function fixture() {
  const {system,input}=await prepareReference(references.cases.find(c=>c.id==='complexation'))
  const definition=await createSweepDefinition(system,vary(definitionFor(system,input),system.components[1].id,'LTV',-4,-2,3),0)
  const sweep=await runSweep(system,definition.sweep)
  return {system,sweep,derived:deriveOutputs(system,sweep,{type:'log-concentration'})}
}
test('retained sweep output-switch regression: rejected derivation has no series; analysis selection remains unavailable',async()=>{
  const {system,sweep}=await fixture()
  const rejected=deriveOutputs(system,sweep,{type:'total-dissolved',componentId:null})
  assert.equal(rejected.ok,false); assert.equal(rejected.series,undefined)
  // Exercise the actual selector expression which previously threw before rendering diagnostics.
  const expression=fs.readFileSync('src/components/PlotWorkspace.jsx','utf8').split('\n').find(l=>l.includes('const analysisId=')).split('const analysisId=')[1].trim()
  const select=new Function('derived','plot',`return ${expression}`)
  assert.equal(select(rejected,{}),undefined)
  const valid=deriveOutputs(system,sweep,{type:'total-dissolved',componentId:system.components[0].id})
  assert.equal(valid.ok,true);assert.equal(select(valid,{}),'total-dissolved')
  assert.equal(valid.series.length,1); assert.equal(valid.series[0].descriptor.quantity,'total-dissolved-component')
  assert.notEqual(valid.series[0].points[0].value,sweep.outcomes[0].result.concentrations[0])
})
test('focus and clear preserve membership, input, revision and all scientific point data',async()=>{
  const {system,sweep,derived}=await fixture(),before=JSON.stringify({system,sweep,derived})
  const session={revision:0,chemicalSystem:{selectedSpecies:system.products.map(p=>p.id)},lastPlot:{system,sweep},visualizationState:{plot:{}}}
  const focused=updateLaboratorySession(session,{type:'plotView',patch:{focusedSeriesId:system.components[0].id}},null)
  const cleared=updateLaboratorySession(focused,{type:'plotView',patch:{focusedSeriesId:null}},null)
  assert.equal(focused.chemicalSystem,session.chemicalSystem);assert.equal(focused.lastPlot,session.lastPlot);assert.equal(cleared.lastPlot,session.lastPlot);assert.equal(cleared.revision,0)
  const ids=derived.series.map(s=>s.id),view=bounds(derived.series,derived.metadata.axis,true)
  const normal=figureSvg(derived,ids,view),active=figureSvg(derived,ids,view,'dark',0,plotBox,ids[0])
  const points=s=>[...s.matchAll(/points="([^"]+)"/g)].map(m=>m[1])
  assert.deepEqual(points(normal),points(active));assert.match(active,/opacity="0.25"/);assert.match(active,/stroke-width="4"/)
  assert.equal(figureSvg(derived,ids,view,'dark',0,plotBox,null),normal)
  assert.equal(JSON.stringify({system,sweep,derived}),before)
})
test('expanded layout keeps mounted children, Escape/exit cleanup and actual responsive resize paths',()=>{
  const wrapper=fs.readFileSync('src/components/ExpandedPlot.jsx','utf8'),css=fs.readFileSync('src/App.css','utf8')
  assert.match(wrapper,/Exit expanded view/);assert.match(wrapper,/Escape/);assert.match(wrapper,/document.body.style.overflow = previous/)
  assert.equal((wrapper.match(/\{children\}/g)??[]).length,1);assert.doesNotMatch(wrapper,/createPortal|solvePoint|runGrid|runSweep/)
  assert.match(css,/\.expanded-plot \{ position: fixed; inset: 0/);assert.match(css,/@media \(max-width: 600px\)/)
  assert.match(fs.readFileSync('src/components/usePlotBox.js','utf8'),/closest\('\.expanded-plot'\)/)
  const renderer=fs.readFileSync('src/plots/threeSurfaceRenderer.js','utf8')
  assert.match(renderer,/ResizeObserver\(resize\)/);assert.match(renderer,/renderer.setSize\(w,h\);camera.aspect=w\/h;camera.updateProjectionMatrix\(\)/)
})
