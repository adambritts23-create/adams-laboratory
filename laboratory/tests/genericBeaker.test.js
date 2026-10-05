import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {createWorkspaceSession,updateLaboratorySession} from '../src/session/laboratorySession.js'
import {reconcileAutomaticSpecies} from '../src/thermodynamics/compatibility.js'
import {createCalculationDefinition} from '../src/calculations/definition.js'
import {mixedCarbonateSolubilityExample,magnesiumSolubilityExample} from '../src/data/solubilityExample.js'
import {calculateBeakerPoint,beakerPHControl,beakerPointJSON} from '../src/beaker/currentPoint.js'
import {prepareSessionPoint} from '../src/solver/prepareSession.js'
import {solvePoint} from '../src/solver/point.js'
import {editFixedCondition,editAxis} from '../src/calculations/setupEditing.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
function ordinary(name,symbol){const s=createWorkspaceSession(repo);s.chemicalSystem=reconcileAutomaticSpecies({...s.chemicalSystem,selectedElements:[symbol],selectedComponents:repo.getComponents().filter(c=>[name,'H+','H2O'].includes(c.name)).map(c=>c.id)},repo);s.calculationDefinition=createCalculationDefinition(s.chemicalSystem,repo);s.calculationDefinition.componentConditions=s.calculationDefinition.componentConditions.map(c=>({...c,value:c.mode==='T'?0.1:c.quantity==='pH'?7:0}));return s}
test('generic Ca-only aqueous Beaker exactly matches direct point solves and never introduces other components',async()=>{
 const s=ordinary('Ca 2+','Ca'),before=JSON.stringify(s)
 for(const pH of [3,7,11.234]){const state=await calculateBeakerPoint(s,repo,pH);assert.ok(state.ok,JSON.stringify(state));assert.equal(state.category,'aqueous');assert.equal(state.visual.bedHeight,0);assert.deepEqual(state.components.map(c=>c.name),['Ca 2+']);const direct=structuredClone(s);direct.calculationDefinition.componentConditions.find(c=>c.quantity==='pH').value=pH;const prepared=await prepareSessionPoint(direct,repo);assert.ok(prepared.ok);assert.deepEqual(state.result.concentrations,solvePoint(prepared.system,prepared.input).concentrations);assert.equal(state.input.constraints.find(c=>c.kh===1).value,0.1);assert.equal(state.pH,pH);assert.deepEqual(JSON.parse(beakerPointJSON(state)).result.concentrations,state.result.concentrations)}
 assert.equal(JSON.stringify(s),before)
})
test('second ordinary aqueous chemistry is generic, with exact component weighting',async()=>{
 const state=await calculateBeakerPoint(ordinary('Mg 2+','Mg'),repo,10);assert.ok(state.ok);assert.deepEqual(state.components.map(c=>c.name),['Mg 2+']);const c=state.components[0];assert.ok(c.contributors.some(a=>a.coefficient===4));assert.equal(c.contributors.reduce((n,a)=>n+a.weightedMolality,0),c.totalDissolved)
})
test('generic single-solid and explicit multi-solid states reuse accepted inventories',async()=>{
 const single=await calculateBeakerPoint(magnesiumSolubilityExample(repo),repo,11);assert.ok(single.ok);assert.equal(single.category,'one-solid');assert.ok(single.visual.bedHeight>0)
 const mixed=mixedCarbonateSolubilityExample(repo),multi=await calculateBeakerPoint(mixed,repo,10.5);assert.ok(multi.ok);assert.equal(multi.category,'multiple-solids');assert.deepEqual(multi.solids,multi.result.solids.filter(s=>s.amount>0))
 const removed=updateLaboratorySession(mixed,{type:'system',action:{type:'toggleSelectedElement',symbol:'Mg'}},repo),ca=await calculateBeakerPoint(removed,repo,10.5);assert.ok(ca.ok,JSON.stringify(ca));assert.ok(!ca.components.some(c=>c.name.includes('Mg')));assert.ok(!ca.allSolids.some(c=>c.name.includes('Mg')))
})
test('unsupported requests and uncontrolled axes return scientific diagnostics, never substitute an example',async()=>{
 const s=ordinary('Ca 2+','Ca');s.calculationDefinition.activityModel='Davies';const failed=await calculateBeakerPoint(s,repo,7);assert.equal(failed.ok,false);assert.equal(failed.visual,null);assert.ok(failed.diagnostics.some(d=>d.code==='unsupported-activity-model'))
 s.calculationDefinition.activityModel='ideal';s.calculationDefinition.independentVariables=[{componentId:s.calculationDefinition.componentConditions.find(c=>c.mode==='T').componentId,mode:'LTV',quantity:'total',range:{min:-3,max:-1},points:5}];assert.equal((await calculateBeakerPoint(s,repo,7)).reason,'unfixed-beaker-coordinate');assert.equal((await calculateBeakerPoint(ordinary('Ca 2+','Ca'),repo,'')).reason,'invalid-beaker-pH')
})
test('fixed pH control uses the current basis and no fixture constraints',()=>{const s=ordinary('Ca 2+','Ca');assert.equal(beakerPHControl(s,repo).initial,7);assert.equal(beakerPHControl(s,repo).controllable,true);s.calculationDefinition.componentConditions.find(c=>c.quantity==='pH').mode='T';assert.equal(beakerPHControl(s,repo).controllable,false)})
test('compact total and axis edits preserve exact values, advanced options and unrelated controls',()=>{
 const s=magnesiumSolubilityExample(repo),d=s.calculationDefinition;d.extraAdvanced={preserved:true};const before=JSON.stringify(d),condition=d.componentConditions.find(c=>c.mode==='T'),edited=editFixedCondition(d,{...condition,value:0.003044375889})
 assert.equal(edited.componentConditions.find(c=>c.componentId===condition.componentId).value,0.003044375889);assert.equal(edited.independentVariables,d.independentVariables);assert.equal(edited.extraAdvanced,d.extraAdvanced)
 const axis=editAxis(edited,0,{range:{min:3.7666633424514,max:13},points:31});assert.equal(axis.independentVariables[0].range.min,3.7666633424514);assert.equal(axis.independentVariables[0].points,31);assert.equal(axis.componentConditions,edited.componentConditions);assert.equal(JSON.stringify(d),before)
})
