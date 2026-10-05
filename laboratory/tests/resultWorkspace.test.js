import process from 'node:process'
import test,{mock} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
const point=await import('../src/solver/point.js');let solves=0
const instrumented=process.execArgv.includes('--experimental-test-module-mocks')
if(instrumented)mock.module('../src/solver/point.js',{namedExports:{...point,solvePoint:(...args)=>{solves++;return point.solvePoint(...args)}}})
const {automaticAuditSession,runAutomaticControl}=await import('../scripts/validation/automaticSolidsAudit.js')
const {createRepository}=await import('../src/thermodynamics/repository.js')
const {deriveOutputs}=await import('../src/calculations/outputs.js')
const {resultViewTransition,resultViewOptions,resultSession,sweepHeading}=await import('../src/plots/resultViews.js')
const {diagramTransition}=await import('../src/session/diagramNavigation.js')
const {selectedEquilibrium,selectionReducer}=await import('../src/plots/resultSelection.js')
const {workspaceMode}=await import('../src/plots/workspaceView.js')
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const control=await runAutomaticControl(repo,'Fe result workspace',automaticAuditSession(repo,['Fe 2+'],[.001],51))
const session=control.session,snapshot=session.lastPlot

test('51 Fe points: compatible result adapters perform zero solves and preserve exact selected and hover identities',t=>{
 assert.equal(control.sweep.counts.converged,51);if(instrumented)assert.ok(solves>=51)
 const count=solves,original=session.calculationDefinition,chosen=selectedEquilibrium(session,23).result
 let plot={type:'log-concentration',focusedSeriesId:'kept'},selection={pinned:23,hover:null}
 for(const type of ['total-fraction','aqueous-fraction','saturated-log-solubility','log-activity','log-concentration']){
  const next=resultViewTransition(snapshot,plot,type);assert.equal(next.ok,true);plot=next.plot
  const displayed=resultSession(session,plot),derived=deriveOutputs(snapshot.system,snapshot.sweep,plot)
  assert.equal(derived.ok,true);assert.equal(displayed.lastPlot,snapshot);assert.equal(displayed.calculationDefinition,original)
  assert.equal(displayed.lastPlot.sweep.outcomes,control.sweep.outcomes);assert.equal(selectedEquilibrium(displayed,selection.pinned).result,chosen)
  selection=selectionReducer(selection,{type:'hover',index:24,count:51});assert.equal(selectedEquilibrium(displayed,selection.hover).result,control.sweep.outcomes[24].result)
  selection=selectionReducer(selection,{type:'leave'});assert.equal(selection.pinned,23);assert.equal(plot.focusedSeriesId,'kept')
 }
 assert.equal(solves,count)
 if(instrumented)t.diagnostic(`Equilibrium solve count before/after result-view cycle: ${count}/${solves}`)
})
test('exact black-screen regression: rejected fraction without target has diagnostics but no metadata',()=>{
 const rejected=deriveOutputs(snapshot.system,snapshot.sweep,{type:'total-fraction',componentId:null})
 assert.equal(rejected.ok,false);assert.equal(rejected.metadata,undefined)
 assert.throws(()=>rejected?.metadata.output.type,TypeError)
 assert.equal(sweepHeading(rejected),'Output unavailable');assert.ok(rejected.diagnostics.length)
 assert.equal(sweepHeading(null),'Output unavailable')
})
test('collapse/reopen retains snapshot and selection; new definition transitions require setup without solving',()=>{
 const count=solves
 assert.equal(workspaceMode({mode:'setup',submission:{previous:null}},snapshot),'results')
 assert.equal(workspaceMode({mode:'setup',submission:null},snapshot),'setup')
 assert.equal(workspaceMode({mode:'results',submission:null},snapshot),'results')
 const components=session.chemicalSystem.selectedComponents.map(id=>repo.getComponentById(id))
 for(const id of ['surface','predominance','calculated-pH','pourbaix']){
  const transition=diagramTransition(session,id,components,{solidCount:1,automaticSolids:true})
  assert.equal(transition.kind,'setup');assert.match(transition.message,/Requires new calculation/)
  assert.equal(session.lastPlot,snapshot)
 }
 for(const v of resultViewOptions(snapshot).options){
  const next=resultViewTransition(snapshot,{},v.type)
  assert.equal(next.ok,v.available)
  if(next.ok)assert.doesNotThrow(()=>sweepHeading(deriveOutputs(snapshot.system,snapshot.sweep,next.plot)))
 }
 assert.equal(solves,count)
})
test('result workspace uses separate projection state and keeps its selection provider mounted',()=>{
 const source=fs.readFileSync('src/components/CalculationWorkspace.jsx','utf8')
 assert.match(source,/session=\{acceptedSession\}/);assert.match(source,/hidden=\{!snapshot\|\|!results\}/)
 assert.match(source,/Collapse results/);assert.match(source,/Reopen retained results/)
 assert.match(source,/scrollIntoView/)
 assert.match(fs.readFileSync('src/components/PlotWorkspace.jsx','utf8'),/sweepHeading\(derived\)/)
})

test('area result presentation retains the compact map and existing lazy inspector',()=>{
 const ui=fs.readFileSync('src/components/PredominanceArea.jsx','utf8')
 assert.match(ui,/inspectArea\(current,selected\)/);assert.match(ui,/hidden=\{!expanded\}/)
 assert.match(ui,/Collapse results/);assert.match(ui,/Reopen retained results/);assert.match(ui,/scrollIntoView/)
})
