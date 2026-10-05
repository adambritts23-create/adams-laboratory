import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {redoxWorkflowExample} from '../src/data/redoxWorkflowExample.js'
import {configureImposedEh,runImposedEh,prepareImposedEh,commitImposedEh,imposedEhReadout} from '../src/calculations/imposedEh.js'
import {deriveOutputs} from '../src/calculations/outputs.js'
import {aqueousFractionState} from '../src/calculations/aqueousFractions.js'
import {totalFractionState} from '../src/calculations/totalFractions.js'
import {selectedEquilibrium,selectionReducer} from '../src/plots/resultSelection.js'
import {solveFixedRedox} from '../src/solver/redox.js'
import {diagramTransition} from '../src/session/diagramNavigation.js'
import {updateLaboratorySession,createWorkspaceSession} from '../src/session/laboratorySession.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const session=redoxWorkflowExample(repo,'Fe')
session.calculationDefinition=configureImposedEh(session.calculationDefinition,session.chemicalSystem.selectedComponents.map(id=>repo.getComponentById(id)))
session.calculationDefinition.imposedEh.total=.001
session.visualizationState.plot={type:'log-concentration',live:false}
const run=await runImposedEh(session,repo),committed=commitImposedEh(session,run),id=run.system.components[0].id
const output=type=>deriveOutputs(run.system,run.sweep,{type,componentId:id})
test('imposed Fe control: 17 independent accepted equilibria exactly match fixed-Eh solves',async()=>{
 assert.ok(run.ok,run.reason);assert.deepEqual(run.sweep.counts,{requested:17,converged:17,failed:0,notRun:0})
 assert.equal(run.system.redoxPolicy,'fixed-electron-v1')
 for(const o of run.sweep.outcomes){const fixed=await solveFixedRedox(run.system,{pH:7,Eh:o.coordinate,totals:{[id]:.001},revision:session.revision});assert.ok(fixed.ok);assert.deepEqual(o.result.concentrations,fixed.result.concentrations);assert.deepEqual(o.result.solids,fixed.result.solids);assert.equal(o.input.constraints.find(c=>c.componentId===run.system.components.find(c=>c.role==='electron').id).kh,2)}
 assert.doesNotMatch(fs.readFileSync('src/calculations/imposedEh.js','utf8'),/import .*closedRedox/)
})
test('total partition closes and dissolved speciation uses the unchanged normalization at every Eh',()=>{
 const total=output('total-fraction'),aqueous=output('aqueous-fraction');assert.ok(total.ok);assert.ok(aqueous.ok)
 for(const [i,o] of run.sweep.outcomes.entries()){
  const t=totalFractionState(run.system,o.input,o.result,id),a=aqueousFractionState(run.system,o.result,id)
  assert.ok(t.ok);assert.ok(Math.abs(total.series.reduce((s,c)=>s+c.points[i].value,0)-1)<=t.balanceTolerance/t.total)
  for(const series of aqueous.series)assert.equal(series.points[i].value,a.ok?a.contributors.find(c=>c.id===series.id).fraction:null)
 }
 assert.ok(total.series.some(s=>s.phase==='solid'));assert.ok(output('log-concentration').series.some(s=>s.phase==='solid'))
})
test('accepted saturation keeps 13 defined solubilities and four genuine gaps; mixed overlay stays pH-only',()=>{
 const d=output('saturated-log-solubility');assert.ok(d.ok);assert.equal(d.series[0].points.filter(p=>p.value!==null).length,13)
 assert.equal(deriveOutputs(run.system,run.sweep,{type:'saturated-log-solubility',componentIds:[id]}).ok,false)
})
test('sample endpoints, hover and keyboard index navigation share exact Beaker equilibrium identities',()=>{
 for(const index of [0,8,16]){const state=selectedEquilibrium(committed,index);assert.ok(state.ok);assert.equal(state.result,run.sweep.outcomes[index].result);assert.equal(state.input,run.sweep.outcomes[index].input);assert.equal(state.Eh,run.sweep.coordinates[index]);assert.match(imposedEhReadout(state),/pH: 7.00 \(fixed\).*V vs SHE \(imposed\)/)}
 let selection={pinned:0,hover:null};selection=selectionReducer(selection,{type:'hover',index:16,count:17});assert.equal(selection.hover,16);selection=selectionReducer(selection,{type:'pin',index:16,count:17});assert.equal(selection.pinned,16);assert.equal(selection.hover,null)
})
test('all four compatible view switches reuse the same branded sweep without scientific revision changes',()=>{
 const components=session.chemicalSystem.selectedComponents.map(id=>repo.getComponentById(id))
 let s=committed
 for(const type of ['total-fraction','aqueous-fraction','saturated-log-solubility','log-concentration']){const transition=diagramTransition(s,type,components,{solidCount:7,automaticSolids:true});assert.equal(transition.kind,'reuse',transition.message);assert.equal(transition.definitionChanged,false);s=updateLaboratorySession(s,{type:'plotView',patch:transition.plot},repo);assert.equal(s.lastPlot.sweep,run.sweep);assert.equal(s.revision,session.revision);assert.ok(selectedEquilibrium(s,16).ok)}
})
test('invalid ranges, samples and conditions fail the existing sweep rules',async()=>{
 for(const patch of [{Eh:{min:2,max:-2,points:17}},{Eh:{min:0,max:0,points:17}},{Eh:{min:-2,max:2,points:1}},{Eh:{min:-2,max:2,points:2.5}},{Eh:{min:-2,max:2,points:10001}},{pH:null},{total:0},{mode:'fixed',fixedEh:null},{mode:'invalid'}]){const s=structuredClone(session);Object.assign(s.calculationDefinition.imposedEh,patch);assert.equal((await prepareImposedEh(s,repo)).ok,false)}
 const s=structuredClone(session);s.calculationDefinition.activityModel='Davies';assert.equal((await prepareImposedEh(s,repo)).ok,false)
})
test('fixed pH, Eh range, phase scope, forged results and stale requests cannot reuse inspection',async()=>{
 for(const change of [d=>d.imposedEh.pH=8,d=>d.imposedEh.Eh.max=1]){const s=structuredClone(session);change(s.calculationDefinition);assert.equal(commitImposedEh(s,run),s);assert.equal(selectedEquilibrium({...committed,calculationDefinition:s.calculationDefinition},0).ok,false);const revised=updateLaboratorySession(committed,{type:'calculation',definition:s.calculationDefinition},repo);assert.equal(selectedEquilibrium(revised,0).ok,false)}
 const s={...committed,chemicalSystem:{...committed.chemicalSystem,excludedSpecies:['different-scope']}};assert.equal(selectedEquilibrium(s,0).ok,false)
 assert.equal(commitImposedEh(session,structuredClone(run)),session)
 assert.equal((await runImposedEh(session,repo,{isCurrent:()=>false})).ok,false)
})
test('electron tile selection is a special-condition route, not an element or conserved inventory',()=>{
 const s=createWorkspaceSession(repo),electron=repo.getComponents().find(c=>c.role==='electron'),next=updateLaboratorySession(s,{type:'system',action:{type:'toggleComponent',id:electron.id}},repo)
 assert.deepEqual(next.chemicalSystem.selectedElements,s.chemicalSystem.selectedElements);assert.ok(next.calculationDefinition.imposedEh);assert.equal(next.visualizationState.plot.type,'log-concentration')
 assert.ok(next.calculationDefinition.componentConditions.filter(c=>c.componentId===electron.id).every(c=>c.mode==='LA'))
 const tile=fs.readFileSync('src/components/ElementSelector.jsx','utf8');assert.match(tile,/gridRow:1,gridColumn:4/);assert.match(tile,/onElectron\(electron.id\)/)
})
test('fixed imposed Eh configuration varies pH using the same fixed-electron preparation',async()=>{
 const s=structuredClone(session);Object.assign(s.calculationDefinition.imposedEh,{mode:'fixed',fixedEh:.35,pHRange:{min:6,max:8,points:3}})
 const r=await runImposedEh(s,repo);assert.ok(r.ok,r.reason);assert.equal(r.sweep.counts.converged,3);assert.equal(r.sweep.definition.axis.quantity,'pH');const state=selectedEquilibrium(commitImposedEh(s,r),0);assert.ok(state.ok);assert.match(imposedEhReadout(state),/pH: 6.00 \(varied\).*\+0.350 V vs SHE \(imposed\)/)
})
