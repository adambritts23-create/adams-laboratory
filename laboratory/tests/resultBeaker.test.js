import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {mixedCarbonateSolubilityExample,magnesiumSolubilityExample} from '../src/data/solubilityExample.js'
import {independentSurfaceExample} from '../src/data/surfaceExamples.js'
import {prepareSessionPoint} from '../src/solver/prepareSession.js'
import {solvePoint} from '../src/solver/point.js'
import {createSweepDefinition,runSweep} from '../src/calculations/sweep.js'
import {createGridDefinition,runGrid} from '../src/calculations/grid.js'
import {deriveGridOutputs} from '../src/calculations/outputs.js'
import {gridModel} from '../src/plots/gridView.js'
import {prepareSurface} from '../src/plots/surface3d.js'
import {selectedEquilibrium,selectionReducer} from '../src/plots/resultSelection.js'
import {updateLaboratorySession,deserializeSession,serializeSession} from '../src/session/laboratorySession.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const session=mixedCarbonateSolubilityExample(repo),prepared=await prepareSessionPoint(session,repo,{sweep:true}),definition=await createSweepDefinition(prepared.system,session.calculationDefinition,session.revision),sweep=await runSweep(prepared.system,definition.sweep)
session.lastPlot={system:prepared.system,sweep}
test('1D selected result is the exact Calculation input/result object, with exact dissolved totals',()=>{
 for(const index of [0,14,21,28]){const state=selectedEquilibrium(session,index),outcome=sweep.outcomes[index];assert.ok(state.ok);assert.equal(state.result,outcome.result);assert.equal(state.input,outcome.input);for(const c of state.components){const i=prepared.system.components.findIndex(x=>x.id===c.id);assert.equal(c.totalDissolved,outcome.result.dissolvedComponentAmounts[i])}}
})
test('aqueous, calcite, two-solid and three-solid Beaker states come only from accepted amounts',()=>{
 const states=[0,14,21,28].map(index=>selectedEquilibrium(session,index));assert.deepEqual(states.map(s=>s.solids.length),[0,1,2,3]);assert.equal(states[0].visual.bedHeight,0);assert.ok(states[1].solids.some(s=>s.name==='CaCO3(cr)'));for(const s of states.slice(1)){assert.ok(s.visual.bedHeight>0);assert.deepEqual(s.solids,s.result.solids.filter(p=>p.amount>0))}
})
test('hover, pin and leave use one selection; invalid/noninteger mesh coordinates cannot select chemistry',()=>{
 let state={pinned:0,hover:null};state=selectionReducer(state,{type:'hover',index:21,count:29});assert.equal(state.hover,21);state=selectionReducer(state,{type:'pin',index:21,count:29});assert.deepEqual(state,{pinned:21,hover:null});assert.equal(selectionReducer(state,{type:'pin',index:21.5,count:29}),state);state=selectionReducer(state,{type:'hover',index:0,count:29});assert.deepEqual(selectionReducer(state,{type:'leave'}),{pinned:21,hover:null})
})
test('stale, unrun, failed, forged and wrong-chemistry states cannot become a Beaker equilibrium',async()=>{
 assert.equal(selectedEquilibrium({...session,revision:session.revision+1},14).ok,false)
 const controller=new AbortController();controller.abort();const cancelled=await runSweep(prepared.system,definition.sweep,{signal:controller.signal});assert.equal(selectedEquilibrium({...session,lastPlot:{system:prepared.system,sweep:cancelled}},0).ok,false)
 assert.equal(selectedEquilibrium({...session,lastPlot:structuredClone(session.lastPlot)},0).ok,false)
 const removed=updateLaboratorySession(session,{type:'system',action:{type:'toggleSelectedElement',symbol:'Mg'}},repo);assert.equal(selectedEquilibrium(removed,21).ok,false)
 assert.equal(selectedEquilibrium({...session,chemicalSystem:{...session.chemicalSystem,selectedComponents:[]}},21).ok,false)
 const failedSession=magnesiumSolubilityExample(repo);failedSession.calculationDefinition.independentVariables[0].range={min:-400,max:-399};failedSession.calculationDefinition.independentVariables[0].points=2;const p=await prepareSessionPoint(failedSession,repo,{sweep:true}),d=await createSweepDefinition(p.system,failedSession.calculationDefinition,0),run=await runSweep(p.system,d.sweep);assert.ok(run.outcomes.every(p=>p.status!=='converged'));failedSession.lastPlot={system:p.system,sweep:run};assert.equal(selectedEquilibrium(failedSession,0).message,'Equilibrium was not established for this point.')
})
test('2D grid and 3D exact sampled vertex resolve to the same stored equilibrium, without new solves',async()=>{
 const s=independentSurfaceExample(repo,true);s.calculationDefinition.independentVariables.forEach(a=>a.points=3);const p=await prepareSessionPoint(s,repo,{grid:true}),d=await createGridDefinition(p.system,s.calculationDefinition,s.revision),grid=await runGrid(p.system,d.grid);s.lastPlot={system:p.system,grid};const derived=deriveGridOutputs(p.system,grid,{type:'total-dissolved',componentId:s.calculationDefinition.output.componentId}),surface=prepareSurface(gridModel(derived),grid.outcomes)
 for(const sample of surface.samples.filter(p=>p.valid)){const fromMap=selectedEquilibrium(s,sample.index),fromVertex=selectedEquilibrium(s,sample.index);assert.ok(fromMap.ok);assert.equal(fromMap.result,grid.outcomes[sample.index].result);assert.equal(fromVertex.result,fromMap.result);assert.equal(fromVertex.input,grid.outcomes[sample.index].input)}
})
test('single point stores its original prepared context and immediately supplies the Beaker',async()=>{
 let s=magnesiumSolubilityExample(repo);const axis=s.calculationDefinition.independentVariables[0];s.calculationDefinition.independentVariables=[];s.calculationDefinition.componentConditions.push({componentId:axis.componentId,mode:'LA',quantity:'pH',unit:'dimensionless',value:11});const p=await prepareSessionPoint(s,repo);assert.ok(p.ok);s=updateLaboratorySession(s,{type:'beginPoint',revision:s.revision,systemId:p.system.id,inputId:p.input.id,system:p.system,input:p.input},repo);const result=solvePoint(p.system,p.input);s=updateLaboratorySession(s,{type:'pointResult',result},repo);const state=selectedEquilibrium(s);assert.ok(state.ok);assert.equal(state.result,result);assert.equal(state.input,p.input);assert.equal(state.system,p.system);assert.equal(deserializeSession(serializeSession(s)).lastPoint,null)
})
test('production Beaker presentation has no solver, pH controller or example dependency; navigation is Calculation only',()=>{
 const ui=fs.readFileSync('src/components/InteractiveBeaker.jsx','utf8');assert.doesNotMatch(ui,/calculateBeaker|solvePoint|beakerPHControl|onLoadExample/);const app=fs.readFileSync('src/App.jsx','utf8');assert.ok(!app.includes('>Interactive Beaker</button>'));assert.ok(ui.includes('ResultSelectionContext'));assert.ok(fs.readFileSync('src/components/PlotWorkspace.jsx','utf8').includes('<InteractiveBeaker/>'))
})
