import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {repo} from '../scripts/validation/fePeroxideChecks.js'
import {closedReagentExample} from '../src/data/closedReagentExample.js'
import {runClosedReagentCalculation,commitClosedReagentCalculation,closedReagentIds as ids,closedReagentReason} from '../src/calculations/closedReagentSetup.js'
import {closedReagentPlot} from '../src/calculations/closedReagentPlot.js'
import {deriveOutputs} from '../src/calculations/outputs.js'
import {selectedEquilibrium,selectionReducer} from '../src/plots/resultSelection.js'
import {diagramTransition} from '../src/session/diagramNavigation.js'
import {updateLaboratorySession} from '../src/session/laboratorySession.js'
import {axisDisplayLabel,resultPackage} from '../src/plots/export.js'
import {isSweepResult} from '../src/calculations/sweep.js'
const session=closedReagentExample(repo),run=await runClosedReagentCalculation(session,repo),accepted=commitClosedReagentCalculation(session,run)
const evidence=JSON.parse(fs.readFileSync('docs/closed-redox-step5-validation.json'))
test('Closed UI path exactly reproduces every Step-5 broad-sweep carrier and derived potential',()=>{
 assert.ok(run.ok);assert.equal(run.closed.counts.accepted,21)
 for(const [i,o] of run.closed.outcomes.entries()){const ref=evidence.sweep.samples[i];assert.equal(o.accepted.inspection.pH,ref.pH);assert.equal(o.accepted.inspection.Eh,ref.Eh);for(const c of ref.carriers)assert.equal(o.accepted.inspection.carriers.find(s=>s.id===c.id).amount,c.amount);assert.equal(run.sweep.outcomes[i].result,o.result);assert.equal(run.sweep.outcomes[i].input,o.input)}
})
test('Closed adapter is branded, preserves identity, and rejects forged or incomplete runs',()=>{
 assert.ok(isSweepResult(run.sweep));assert.equal(isSweepResult({...run.sweep}),false);assert.equal(closedReagentPlot({...run.closed}).ok,false)
 assert.equal(commitClosedReagentCalculation(session,{...run}),session)
})
test('All three views reuse the sweep and preserve total/dissolved denominators',()=>{
 const components=session.chemicalSystem.selectedComponents.map(id=>repo.getComponentById(id))
 for(const type of ['log-concentration','total-fraction','aqueous-fraction']){const transition=diagramTransition(accepted,type,components);assert.equal(transition.kind,'reuse');assert.equal(transition.definitionChanged,false);const d=deriveOutputs(run.system,run.sweep,{type,componentId:ids.Fe});assert.ok(d.ok);if(type!=='log-concentration')for(let i=0;i<21;i++)assert.ok(Math.abs(d.series.reduce((n,s)=>n+s.points[i].value,0)-1)<1e-10)}
})
test('Selected endpoint/hover/pin use exact closed objects and expose derived pH/Eh/net reaction',()=>{
 for(const i of [0,5,20]){const s=selectedEquilibrium(accepted,i);assert.ok(s.ok);assert.equal(s.result,run.closed.outcomes[i].result);assert.equal(s.input,run.closed.outcomes[i].input);assert.equal(s.closedReagents,run.closed.outcomes[i].accepted.inspection);assert.deepEqual(s.solids,[]);assert.equal(s.components[0].name,'Fe');assert.equal(s.components.length,1)}
 const hover=selectionReducer({pinned:0,hover:null},{type:'hover',index:5,count:21});assert.equal(hover.hover,5);const pinned=selectionReducer(hover,{type:'pin',index:20,count:21});assert.deepEqual(pinned,{pinned:20,hover:null});assert.equal(selectionReducer(pinned,{type:'leave'}).pinned,20)
})
test('Changed addition/setup/chemistry and restored ordinary mode invalidate closed inspection and commit',()=>{
 for(const mutate of [s=>s.calculationDefinition.closedReagents.axis.max=9e-7,s=>s.chemicalSystem.selectedComponents.push('component:e-'),s=>s.calculationDefinition=s.calculationDefinition.closedReagents.ordinaryDefinition]){const altered={...accepted,chemicalSystem:structuredClone(accepted.chemicalSystem),calculationDefinition:structuredClone(accepted.calculationDefinition)};mutate(altered);assert.equal(selectedEquilibrium(altered,5).ok,false);assert.equal(commitClosedReagentCalculation(altered,run),altered)}
 const changed=updateLaboratorySession(accepted,{type:'calculation',definition:{...accepted.calculationDefinition,closedReagents:{...accepted.calculationDefinition.closedReagents,axis:{min:0,max:8e-7,points:9}}}},repo);assert.equal(selectedEquilibrium(changed,5).ok,false)
})
test('Unsupported reagent selection, electron and changed source never fall back to ordinary sweep',async()=>{
 for(const modify of [s=>s.chemicalSystem.selectedComponents.push('component:e-'),s=>s.chemicalSystem.selectedComponents=s.chemicalSystem.selectedComponents.filter(id=>id!==ids.peroxide),s=>s.chemicalSystem.excludedSpecies=['any']]){const s=structuredClone(session);modify(s);assert.ok(closedReagentReason(s));assert.equal((await runClosedReagentCalculation(s,repo)).ok,false)}
 const changed={...repo,getSpecies:q=>repo.getSpecies(q).map(r=>r.id.endsWith(':152743')?{...r,logK:r.logK+.1}:r)};assert.equal((await runClosedReagentCalculation(session,changed)).ok,false)
})
test('Out-of-scope samples remain gaps in views and Beaker; cancellation/stale never commits',async()=>{
 const s=structuredClone(session);s.calculationDefinition.closedReagents.axis={min:0,max:2e-6,points:3};const r=await runClosedReagentCalculation(s,repo);assert.ok(r.ok);assert.equal(r.sweep.outcomes[2].status,'failed');const state=commitClosedReagentCalculation(s,r);assert.equal(selectedEquilibrium(state,2).ok,false);for(const type of ['log-concentration','total-fraction','aqueous-fraction'])assert.ok(deriveOutputs(r.system,r.sweep,{type,componentId:ids.Fe}).series.every(x=>x.points[2].value===null))
 assert.equal((await runClosedReagentCalculation(session,repo,{isCurrent:()=>false})).ok,false)
 const controller=new AbortController();controller.abort();assert.equal((await runClosedReagentCalculation(session,repo,{signal:controller.signal})).ok,false)
})
test('Supplied axis and residual species labels remain distinct in output/export',()=>{
 const d=deriveOutputs(run.system,run.sweep,{type:'log-concentration'});assert.match(axisDisplayLabel(d.metadata.axis,d.metadata.componentNames),/^Supplied/);assert.match(d.series.find(s=>s.id===ids.peroxide).name,/Residual equilibrium/)
 const json=JSON.parse(resultPackage(run.system,run.sweep,d,d.series.map(s=>s.id),{},session.revision));assert.equal(JSON.stringify(json.sweep.outcomes[5].result),JSON.stringify(run.sweep.outcomes[5].result));assert.equal(JSON.stringify(json.sweep.outcomes[5].closedInspection),JSON.stringify(run.closed.outcomes[5].accepted.inspection));assert.equal(json.sweep.outcomes[5].closedAccepted,undefined)
})
