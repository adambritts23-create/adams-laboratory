import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRepository } from '../src/thermodynamics/repository.js'
import { independentSurfaceExample } from '../src/data/surfaceExamples.js'
import { updateLaboratorySession } from '../src/session/laboratorySession.js'
import { editAxis } from '../src/calculations/setupEditing.js'
import { chemicalLabel } from '../src/chemistry/format.js'
const axis=fs.readFileSync('src/components/AxisControls.jsx','utf8'),workspace=fs.readFileSync('src/components/CalculationWorkspace.jsx','utf8'),app=fs.readFileSync('src/App.jsx','utf8')
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
test('axis grouping: fieldset labels retain variable, range, samples and native unit controls together',()=>{
  assert.match(axis,/<fieldset[^>]+data-axis-role=.*<legend>\{axisName\} axis<\/legend>/)
  for(const token of ["axisName+' quantity'", "axisName+' component'", "axisName+' scale'",'value={axis.range.min', 'value={axis.range.max','value={axis.points}','edit({points:Number(e.target.value)})','AmountUnitSelect'])assert.ok(axis.includes(token),token)
  assert.match(axis,/log₁₀ scale/);assert.match(axis,/linear scale/);assert.match(axis,/pH · dimensionless/)
})
test('axis grouping: dimensionality controls fieldset count and surface response heading without fake bounds',()=>{
  // The established graph-first layout renders Y beside the preview and X below it.
  assert.match(workspace,/dimensions===2&&<AxisControls index=\{1\}/)
  assert.match(workspace,/<\/section><AxisControls index=\{0\}/)
  assert.match(workspace,/dimensions===2\?'Z \/ Response':'Diagram output'/)
  assert.match(workspace,/dimensions===2&&<>\s*<SurfaceResponseControls/)
  assert.match(workspace,/range: automatic from data/)
  assert.doesNotMatch(workspace,/Z minimum|Z maximum/)
})
test('axis grouping: editing Y retains X and the fixed inventory while changing only selected bounds',()=>{
  const d=independentSurfaceExample(repo,true).calculationDefinition
  const before=structuredClone(d),next=editAxis(d,1,{range:{min:-3,max:-1},points:7})
  assert.deepEqual(d,before);assert.deepEqual(next.independentVariables[0],d.independentVariables[0])
  assert.deepEqual(next.componentConditions,d.componentConditions)
  assert.equal(next.independentVariables[1].points,7)
  assert.deepEqual(next.independentVariables[1].range,{min:-3,max:-1})
  assert.ok(!next.componentConditions.some(c=>c.componentId===next.independentVariables[1].componentId))
})
test('axis grouping: 2D/3D view and workspace navigation retain the scientific definition',()=>{
  const s=independentSurfaceExample(repo)
  let next=updateLaboratorySession(s,{type:'plotView',patch:{visualizationMode:'3d'}},repo)
  assert.equal(next.visualizationState.plot.visualizationMode,'3d')
  assert.deepEqual(next.calculationDefinition,s.calculationDefinition)
  next=updateLaboratorySession(next,{type:'plotView',patch:{visualizationMode:'2d'}},repo)
  assert.equal(next.visualizationState.plot.visualizationMode,'2d')
  assert.deepEqual(next.calculationDefinition,s.calculationDefinition)
  for(const workspace of ['system','calculation']){
    next=updateLaboratorySession(next,{type:'workspace',workspace},repo)
    assert.equal(next.visualizationState.workspace,workspace);assert.deepEqual(next.calculationDefinition,s.calculationDefinition)
  }
})
test('axis grouping: navigation semantics and component identities stay separate from display labels',()=>{
  assert.equal((app.match(/className="workspace-primary"/g)||[]).length,5)
  assert.match(app,/aria-pressed=\{session.visualizationState.workspace === 'wet-lab'\}/)
  assert.equal((app.match(/className="workspace-secondary"/g)||[]).length,2)
  assert.match(app,/aria-pressed=\{session.visualizationState.workspace === 'system'\}/)
  assert.match(app,/reset\('newSystem'\)/);assert.match(app,/reset\('resetCalculation'\)/)
  assert.match(app,/<strong>Current system<\/strong>/)
  assert.match(app,/filter\(Boolean\)\.map\(chemicalLabel\)\.join/)
  assert.equal(chemicalLabel('Fe 3+'),'Fe³⁺');assert.equal(chemicalLabel('H2O'),'H₂O')
})
