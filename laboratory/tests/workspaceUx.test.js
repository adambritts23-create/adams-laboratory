import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRepository } from '../src/thermodynamics/repository.js'
import { createWorkspaceSession, updateLaboratorySession, deserializeSession, serializeSession } from '../src/session/laboratorySession.js'
import { workspaceDefaultsPolicy } from '../src/session/workspaceDefaults.js'
import { automaticAuditSession, runAutomaticControl, auditAutomaticSolids } from '../scripts/validation/automaticSolidsAudit.js'
import { selectedEquilibrium, selectionReducer } from '../src/plots/resultSelection.js'
import { componentPartitions, partitionPercent } from '../src/beaker/componentPartition.js'
import { legendReadout } from '../src/plots/legendReadout.js'
import { diagramIdentity } from '../src/plots/diagramIdentity.js'
import { dragView, zoomViewAt, keyboardView } from '../src/plots/navigation.js'
import { deriveOutputs } from '../src/calculations/outputs.js'
import { selectDiagram } from '../src/calculations/diagramSetup.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { prepareChemicalSystem, createPointInput } from '../src/solver/models.js'
import { solvePoint } from '../src/solver/point.js'
import { acceptedState } from '../src/beaker/acceptedState.js'
const repo = createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const cases = await auditAutomaticSolids(repo), [, fe, ca, mixed] = cases
const ni = await runAutomaticControl(repo, 'Ni default total', automaticAuditSession(repo, ['Ni 2+'], [1]))
const stateAt = (c, pH) => selectedEquilibrium(c.session, c.sweep.outcomes.findIndex(o => o.coordinate === pH))
const change = (s, action) => updateLaboratorySession(s, action, repo)
function add(s, name, symbol) {
 s = change(s, { type: 'system', action: { type: 'toggleElement', symbol } })
 return change(s, { type: 'system', action: { type: 'toggleComponent', id: repo.getComponents().find(c => c.name === name).id } })
}
test('new workspace and New system default to log concentrations, pH 0–14 and ideal 25 C / 1 bar', () => {
 for (const s of [createWorkspaceSession(repo), change(ni.session, { type: 'newSystem' })]) {
  assert.equal(s.defaultsPolicy, workspaceDefaultsPolicy)
  assert.equal(s.visualizationState.plot.type, 'log-concentration')
  const d = s.calculationDefinition
  assert.equal(d.dimensions, 1); assert.equal(d.independentVariables[0].quantity, 'pH')
  assert.deepEqual(d.independentVariables[0].range, { min: 0, max: 14 })
  assert.equal(d.temperature.value, 25); assert.equal(d.pressure.value, 1); assert.equal(d.activityModel, 'ideal')
 }
})
test('new ordinary component rows get one mol/kg water while existing explicit totals survive additions and views', () => {
 let s = add(createWorkspaceSession(repo), 'Ni 2+', 'Ni')
 const condition = s.calculationDefinition.componentConditions.find(c => c.mode === 'T')
 assert.equal(condition.value, 1); assert.equal(condition.unit, 'mol/kg-H2O')
 const d = structuredClone(s.calculationDefinition); d.componentConditions.find(c => c.componentId === condition.componentId).value = 0.0037
 s = change(s, { type: 'calculation', definition: d }); s = add(s, 'Mg 2+', 'Mg')
 const next = selectDiagram(s.calculationDefinition, s.visualizationState.plot, 'aqueous-fraction', s.chemicalSystem.selectedComponents.map(id => repo.getComponentById(id)))
 s = change(s, { type: 'calculation', definition: next.definition })
 s = change(s, { type: 'workspace', workspace: 'calculation' }); s = change(s, { type: 'plotView', patch: { gridPinned: 20 } })
 assert.equal(s.calculationDefinition.componentConditions.find(c => c.componentId === condition.componentId).value, 0.0037)
 assert.equal(s.calculationDefinition.componentConditions.find(c => repo.getComponentById(c.componentId).name === 'Mg 2+').value, 1)
})
test('historical saved conditions and explicit examples are never overwritten by new defaults', () => {
 const original = structuredClone(mixed.session); delete original.defaultsPolicy
 const loaded = deserializeSession(serializeSession(original))
 assert.deepEqual(loaded.calculationDefinition, original.calculationDefinition)
 assert.deepEqual(loaded.chemicalSystem, original.chemicalSystem)
 assert.equal(loaded.defaultsPolicy, undefined)
})
test('diagram identities distinguish all requested families without changing series colors', () => {
 assert.deepEqual(['log-concentration','aqueous-fraction','saturated-log-solubility','surface','calculated-pH','pourbaix'].map(diagramIdentity), ['concentration','fraction','solubility','surface','coordinate','pourbaix'])
 const css = fs.readFileSync('src/App.css', 'utf8')
 assert.match(css, /input\[readonly\]/); assert.match(css, /:not\(\[readonly\]\):not\(:disabled\)/)
 assert.match(css, /:focus-visible/); assert.match(css, /plot-workspace.light/)
 assert.doesNotMatch(fs.readFileSync('src/plots/diagramIdentity.js', 'utf8'), /seriesColor|solvePoint/)
})
test('component forms retain distinct authoritative Fe identities, checkbox keyboard semantics and larger targets', () => {
 const forms = repo.getComponents().filter(c => ['Fe 2+', 'Fe 3+'].includes(c.name))
 assert.equal(forms.length, 2); assert.notEqual(forms[0].id, forms[1].id)
 let s = add(createWorkspaceSession(repo), 'Fe 2+', 'Fe')
 s = add(s, 'Fe 3+', 'Fe'); assert.ok(forms.every(c => s.chemicalSystem.selectedComponents.includes(c.id)))
 s = change(s, { type: 'system', action: { type: 'toggleSelectedElement', symbol: 'Fe' } })
 assert.ok(forms.every(c => !s.chemicalSystem.selectedComponents.includes(c.id)))
 const source = fs.readFileSync('src/components/ComponentSelector.jsx','utf8')
 assert.match(source, /type="checkbox"/); assert.match(source, /is-selected/); assert.match(source, /a.description/)
})
const derived = deriveOutputs(ni.system, ni.sweep, { type: 'log-concentration' })
test('live legend uses hover then pinned exact samples and retains raw precision and phase identity', () => {
 const before = JSON.stringify(derived), count = ni.sweep.outcomes.length
 let selection = { pinned: 0, hover: null }
 selection = selectionReducer(selection, { type: 'hover', index: 20, count })
 const hovering = legendReadout(derived, selection.hover ?? selection.pinned, 0)
 assert.equal(hovering.heading, 'Species at pH 10')
 const free = hovering.rows.find(r => r.id === ni.system.components[0].id)
 assert.equal(free.value, derived.series.find(s => s.id === free.id).points[20].value)
 assert.match(free.label, /\(aq\)$/); assert.ok(free.text.length < 12)
 selection = selectionReducer(selection, { type: 'leave' })
 assert.equal(legendReadout(derived, selection.hover ?? selection.pinned, 0).heading, 'Species at pH 0')
 assert.equal(JSON.stringify(derived), before)
})
test('legend reports unavailable for stale, missing and failed samples', async () => {
 assert.ok(legendReadout(derived, 20, 1).rows.every(r => r.value === null))
 assert.ok(legendReadout(derived, -1, 0).rows.every(r => r.value === null))
 const d = structuredClone(ni.session.calculationDefinition); d.independentVariables[0].range = { min: -400, max: -399 }; d.independentVariables[0].points = 2
 const sd = await createSweepDefinition(ni.system, d, 0), sweep = await runSweep(ni.system, sd.sweep)
 const failed = deriveOutputs(ni.system, sweep, { type: 'log-concentration' })
 assert.ok(legendReadout(failed, 0, 0).rows.every(r => r.value === null && r.text === 'Unavailable'))
 assert.deepEqual(componentPartitions(selectedEquilibrium({ ...ni.session, lastPlot: { system: ni.system, sweep } }, 0)), [])
})
test('legend focus wiring and detailed inspection remain; pan buttons removed from both ordinary renderers', () => {
 for (const file of ['ScientificPlot.jsx','GridPlot.jsx']) {
  const code = fs.readFileSync('src/components/'+file, 'utf8')
  assert.doesNotMatch(code, />Pan (left|right|up|down)</)
  assert.doesNotMatch(code, />\s*(Zoom in|Zoom out|Reset view)\s*</)
  for (const name of ['PlotExport','Export SVG','Export numerical JSON','usePlotGestures']) assert.ok(code.includes(name))
 }
 const code = fs.readFileSync('src/components/ScientificPlot.jsx','utf8')
 assert.match(code, /onFocus\(focus===s.id\?null:s.id\)/); assert.match(code, /Exact point inspection/)
 assert.doesNotMatch(code, /solvePoint|runSweep|prepareSession/)
})
test('direct navigation pans both axes and zooms at an anchor without mutating the scientific view', () => {
 const view = { xMin: 0, xMax: 14, yMin: -20, yMax: 0 }, before = JSON.stringify(view)
 assert.deepEqual(dragView(view, 100, 50, 700, 500), { xMin: -2, xMax: 12, yMin: -18, yMax: 2 })
 const z = zoomViewAt(view, 0.5, 0.25, 0.75)
 assert.equal(z.xMin + 0.25 * (z.xMax-z.xMin), 3.5)
 assert.equal(z.yMin + 0.75 * (z.yMax-z.yMin), -5)
 assert.ok(keyboardView(view, 'ArrowUp').yMin > view.yMin)
 assert.ok(keyboardView(view, '+').xMax < view.xMax)
 assert.equal(JSON.stringify(view), before)
})
test('Ni no-solid and 1:1 solid partitions use the supplied total and exact accepted amounts', () => {
 const no = componentPartitions(stateAt(ni, 0))[0], solid = componentPartitions(stateAt(ni, 10))[0]
 assert.ok(no.ok && solid.ok); assert.equal(no.solidFraction, 0); assert.equal(no.dissolvedFraction, 1)
 assert.equal(solid.solids[0].name, 'Ni(OH)2(cr)'); assert.equal(solid.solids[0].coefficient, 1)
 assert.equal(solid.solidAmount, 0.9999999881859974); assert.equal(solid.suppliedTotal, 1)
})
test('Fe2O3 partitions two Fe units per accepted solid formula unit', () => {
 const p = componentPartitions(stateAt(fe, 8.4))[0]
 assert.ok(p.ok); assert.equal(p.solids[0].coefficient, 2)
 assert.equal(p.solidAmount, 2 * 0.04999999999949872)
 assert.equal(p.dissolvedAmount, 1.0025643935663322e-12)
 assert.ok(Math.abs(p.solidFraction+p.dissolvedFraction-1) <= p.balanceTolerance/p.suppliedTotal)
})
test('multiple Ca solids allocate the same component total; neutral aqueous carbonate remains dissolved', () => {
 const p = componentPartitions(stateAt(ca, 14)).find(p => p.name === 'Ca 2+')
 assert.ok(p.ok); assert.equal(p.solids.length, 2)
 assert.equal(p.solidAmount, p.solids.reduce((n,s) => n+s.componentAmount,0))
 assert.ok(p.solids.every(s => s.name !== 'CaCO3'))
 assert.equal(p.dissolvedAmount, stateAt(ca, 14).components.find(c => c.name === p.name).totalDissolved)
})
test('mixed Ca/Mg partitions close at every accepted control sample under the original result tolerance', () => {
 for (const c of [ni, ...cases]) for (let i=0;i<c.sweep.outcomes.length;i++) {
  const state = selectedEquilibrium(c.session,i), before = JSON.stringify(state.result)
  for (const p of componentPartitions(state)) {
   assert.ok(p.ok, p.reason); assert.ok(Math.abs(p.residual) <= p.balanceTolerance)
   assert.ok(!['H+','H2O','e-'].includes(p.name))
  }
  assert.equal(JSON.stringify(state.result), before)
 }
 assert.equal(componentPartitions(stateAt(mixed, 14)).filter(p => ['Ca 2+','Mg 2+'].includes(p.name)).length, 2)
})
test('absent candidates and explicit exclusions contribute no solid allocation', async () => {
 assert.equal(componentPartitions(stateAt(ni,0))[0].solids.length,0)
 let s = automaticAuditSession(repo,['Ni 2+'],[1])
 for (const p of ni.candidates) s = change(s,{type:'system',action:{type:'toggleSpecies',id:p.id}})
 const excluded = await runAutomaticControl(repo,'Ni excluded',s)
 assert.equal(componentPartitions(stateAt(excluded,10))[0].solidFraction,0)
})
test('stale and forged states never acquire a component percentage', () => {
 assert.deepEqual(componentPartitions(selectedEquilibrium({ ...ni.session, revision: 1 },20)),[])
 assert.deepEqual(componentPartitions(structuredClone(stateAt(ni,10))),[])
})
test('activity-controlled and unresolved tiny analytical totals report partition unavailable', async () => {
 const prepared = await prepareChemicalSystem({components:[{id:'ni',name:'Ni 2+',role:'ordinary',phase:'aqueous'}],products:[],basisStatus:'explicit-direct',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{control:'no-products'}})
 for (const [kh,value] of [[2,-3],[1,1e-20]]) {
  const input = await createPointInput(prepared.system,{constraints:[{componentId:'ni',kh,value}],revision:0,unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,activityModel:'ideal'})
  const result = solvePoint(prepared.system,input.input), state = acceptedState(prepared.system,input.input,result)
  assert.ok(state.ok); assert.equal(componentPartitions(state)[0].ok,false)
 }
})
test('percentage display preserves small nonzero dissolved shares without rounding them to zero', () => {
 assert.equal(partitionPercent(0),'0%'); assert.equal(partitionPercent(1),'100%')
 assert.equal(partitionPercent(1e-8),'<0.1%'); assert.equal(partitionPercent(1-1e-8),'>99.9%')
 assert.equal(partitionPercent(null),'Unavailable')
})
