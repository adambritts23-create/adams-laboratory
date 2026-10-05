import test,{mock} from 'node:test'
import assert from 'node:assert/strict'
import process from 'node:process'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'


const instrumented=process.execArgv.includes('--experimental-test-module-mocks');let solves=0
if(instrumented){const original=await import('../src/solver/point.js');mock.module('../src/solver/point.js',{namedExports:{...original,solvePoint:(...args)=>{solves++;return original.solvePoint(...args)}}})}
const {automaticAuditSession}=await import('../scripts/validation/automaticSolidsAudit.js')
const {prepareSessionPoint}=await import('../src/solver/prepareSession.js')
const {createGridDefinition,runGrid}=await import('../src/calculations/grid.js')
const {deriveGridOutputs,deriveOutputs}=await import('../src/calculations/outputs.js')
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const session=automaticAuditSession(repo,['Ag+','Cl-'],[.001,.001],5),d=session.calculationDefinition
const cl=repo.getComponents().find(c=>c.name==='Cl-').id,ag=repo.getComponents().find(c=>c.name==='Ag+').id
d.dimensions=2;d.independentVariables[0].range={min:0,max:12};d.independentVariables.push({componentId:cl,quantity:'total',mode:'LTV',unit:'mol/kg-H2O',range:{min:-8,max:-1},points:8});d.componentConditions=d.componentConditions.filter(c=>c.componentId!==cl);const output={type:'saturated-log-solubility',componentId:ag}
const prepared=await prepareSessionPoint(session,repo,{grid:true});if(!prepared.ok)throw Error(JSON.stringify(prepared));const def=await createGridDefinition(prepared.system,d,session.revision);if(!def.ok)throw Error(JSON.stringify(def));const grid=await runGrid(prepared.system,def.grid);const derived=deriveGridOutputs(prepared.system,grid,output);
const {saturatedLogSolubility}=await import('../src/calculations/solubility.js')
const {createSweepDefinition,runSweep}=await import('../src/calculations/sweep.js')
const {gridModel}=await import('../src/plots/gridView.js')
const {prepareSurface}=await import('../src/plots/surface3d.js')
const {selectedEquilibrium}=await import('../src/plots/resultSelection.js')
const {precipitateVisual}=await import('../src/beaker/visual.js')
const {sedimentSegments,liquidVisual}=await import('../src/beaker/scene.js')
session.lastPlot={system:prepared.system,grid}
test('Ag/Cl surface uses the exact 1D saturation helper, including genuine gaps and phase changes',()=>{
 assert.equal(grid.counts.converged,40);assert.equal(derived.ok,true)
 const points=derived.series[0].points;assert.ok(points.some(p=>p.value===null));assert.ok(points.some(p=>p.value!==null))
 for(const o of grid.outcomes)assert.equal(points[o.index].value,saturatedLogSolubility(prepared.system,o.result,ag).value)
})
test('independently executed 1D pH slices agree with the Ag solubility surface',async()=>{
 for(const row of [0,4,7]){
 const one=structuredClone(d);one.dimensions=1;one.independentVariables=[one.independentVariables[0]];one.componentConditions.push({componentId:cl,mode:'T',quantity:'total',unit:'mol/kg-H2O',value:10**grid.coordinates[1][row]})
 const def=await createSweepDefinition(prepared.system,one,session.revision);assert.equal(def.ok,true)
 const sweep=await runSweep(prepared.system,def.sweep),view=deriveOutputs(prepared.system,sweep,output)
 assert.equal(view.ok,true)
 view.series[0].points.forEach((p,i)=>assert.equal(p.value,derived.series[0].points[row*5+i].value))
 }
})
test('2D/3D and visual selection reuse exact accepted states without new solves',t=>{
 const count=solves;if(instrumented)assert.ok(count>=40)
 const before=JSON.stringify(grid),start=performance.now()
 for(let cycle=0;cycle<20;cycle++){
 const model=gridModel(deriveGridOutputs(prepared.system,grid,output)),surface=prepareSurface(model,grid.outcomes)
 assert.ok(surface)
 for(let i=0;i<40;i++){const state=selectedEquilibrium(session,i);assert.equal(state.result,grid.outcomes[i].result);sedimentSegments(state);liquidVisual(50+i,150)}
 }
 assert.equal(solves,count);assert.equal(JSON.stringify(grid),before)
 t.diagnostic('20 map/surface and 800 selected-state visual projections: '+(performance.now()-start).toFixed(1)+' ms; instrumented='+instrumented+'; solve count '+count+' → '+solves)
 assert.equal(selectedEquilibrium({...session,revision:session.revision+1},4).ok,false)
})
test('sediment mapping is monotonic, bounded, threshold-preserving and phase-amount weighted',()=>{
 let previous=0;for(const amount of [0,1e-30,1e-12,1e-11,1e-6,.001,.01,1,100]){const v=precipitateVisual([{id:'a',amount}]);assert.ok(v.bedHeight>=previous&&v.bedHeight<=56);previous=v.bedHeight}
 assert.equal(precipitateVisual([{amount:1e-12}]).bedHeight,0);assert.ok(precipitateVisual([{amount:1e-11}]).bedHeight<2.001)
 const solids=[{id:'a',amount:.001},{id:'b',amount:.003}],state={ok:true,solids,visual:precipitateVisual(solids)},segments=sedimentSegments(state)
 assert.equal(segments[1].width/segments[0].width,3);assert.equal(segments.reduce((n,s)=>n+s.width,0),178)
 assert.deepEqual(sedimentSegments({...state,ok:false}),[])
})
test('Wet Lab fill follows accepted additive volume with fixed capacity, not chemistry or phase appearance',()=>{
 assert.equal(liquidVisual(50,150).fraction,1/3);assert.equal(liquidVisual(100,150).fraction,2/3);assert.equal(liquidVisual(150,150).fraction,1)
 assert.equal(liquidVisual(0,150).fraction,0);assert.equal(liquidVisual().physical,false)
 assert.ok(liquidVisual(100,150).top<liquidVisual(50,150).top)
 const wet=fs.readFileSync('src/components/WetLab.jsx','utf8');assert.match(wet,/state=\{state.equilibrium.inspection/);assert.match(wet,/volumeMl=\{volume\}/)
 const drawing=fs.readFileSync('src/components/BeakerDrawing.jsx','utf8');assert.doesNotMatch(drawing,/solvePoint|runGrid|runSweep|componentPartitions|Math.random/)
})

