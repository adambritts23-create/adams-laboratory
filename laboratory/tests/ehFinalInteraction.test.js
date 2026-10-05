import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {redoxWorkflowExample} from '../src/data/redoxWorkflowExample.js'
import {configureImposedEh,runImposedEh,commitImposedEh} from '../src/calculations/imposedEh.js'
import {deriveOutputs} from '../src/calculations/outputs.js'
import {selectedEquilibrium} from '../src/plots/resultSelection.js'
import {selectedLegendOrder} from '../src/plots/selectedLegendOrder.js'
import {legendReadout} from '../src/plots/legendReadout.js'
import {seriesColor,resultPackage} from '../src/plots/export.js'
import {componentPartitions} from '../src/beaker/componentPartition.js'
import {updateLaboratorySession} from '../src/session/laboratorySession.js'
import {redoxPresentation} from '../src/plots/redoxPresentation.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const session=redoxWorkflowExample(repo,'Fe')
session.calculationDefinition=configureImposedEh(session.calculationDefinition,session.chemicalSystem.selectedComponents.map(id=>repo.getComponentById(id)))
Object.assign(session.calculationDefinition.imposedEh,{total:.001,pH:0})
const run=await runImposedEh(session,repo),saved=commitImposedEh(session,run),componentId=run.system.components[0].id,metal='spana:2ac52a30213c9288:127500'
const derived=type=>deriveOutputs(run.system,run.sweep,{type,componentId})
const ordered=(d,index,state=selectedEquilibrium(saved,index))=>selectedLegendOrder(legendReadout(d,index,session.revision).rows,d,index,session.revision,state)
test('conserved basis inventory is Fe atom weighted across oxidation states; electron activity is not analytical total',()=>{
 const c=run.system.components.findIndex(c=>c.role==='electron')
 for(const index of [0,8,16]){const s=selectedEquilibrium(saved,index),p=componentPartitions(s)[0];assert.ok(p.ok);assert.ok(Math.abs(p.dissolvedAmount+p.solidAmount-.001)<=p.balanceTolerance);assert.notEqual(s.input.constraints[c].kh,1);assert.equal(s.components[0].name,'Fe');assert.equal(s.result,run.sweep.outcomes[index].result);assert.equal(s.input,run.sweep.outcomes[index].input)}
 const s=selectedEquilibrium(saved,0);assert.equal(s.redoxPresentation.suppliedAs,repo.getComponentById(run.request.componentId).name);assert.equal(s.redoxPresentation.carriers[metal].oxidationLabel,'Fe(0)');assert.equal(s.redoxPresentation.carriers[metal].distribution[0].count,1)
 const magnetite=run.system.products.find(p=>p.name==='Fe3O4(cr)');assert.equal(magnetite.coefficients[0],3);assert.deepEqual(s.redoxPresentation.carriers[magnetite.id].distribution,[{oxidationState:2,count:1},{oxidationState:3,count:2}]);assert.equal(s.redoxPresentation.carriers[magnetite.id].oxidationLabel,'Fe(II) / Fe(III)')
})
test('selected-sample ranking changes from metal to oxidized carrier without global maxima or rounded display values',()=>{
 const d=derived('total-fraction'),before=JSON.stringify(d),first=ordered(d,0),last=ordered(d,16)
 assert.equal(first[0].id,metal);assert.notEqual(last[0].id,metal);assert.equal(last[0].value,Math.max(...d.series.map(s=>s.points[16].value)))
 assert.equal(first.length,d.series.length);assert.equal(new Set(last.map(r=>r.id)).size,d.series.length);assert.equal(JSON.stringify(d),before)
 const logs=derived('log-concentration');assert.ok(ordered(logs,0).findIndex(r=>r.id===metal)<=1)
 const colors=new Map(d.series.map((s,i)=>[s.id,seriesColor(s.id,'dark',i)]));for(const r of last)assert.equal(colors.get(r.id),seriesColor(r.id,'dark',d.series.findIndex(s=>s.id===r.id)))
 const tiny={metadata:{revision:1,output:{type:'total-fraction'}},series:[{id:'a',points:[{value:1e-20,pointStatus:'converged'}]},{id:'b',points:[{value:2e-20,pointStatus:'converged'}]}]};assert.deepEqual(selectedLegendOrder([{id:'a',text:'<0.1%'},{id:'b',text:'<0.1%'}],tiny,0,1).map(r=>r.id),['b','a'])
})
test('focus, reference preference, view and endpoint selection retain exact accepted sweep identities',()=>{
 let s=updateLaboratorySession(saved,{type:'plotView',patch:{focusedSeriesId:metal,showWaterReferences:false}},repo)
 for(const index of [0,16,0]){assert.equal(s.visualizationState.plot.focusedSeriesId,metal);assert.equal(selectedEquilibrium(s,index).result,run.sweep.outcomes[index].result);ordered(derived('total-fraction'),index)}
 for(const type of ['total-fraction','aqueous-fraction','saturated-log-solubility','log-concentration']){s=updateLaboratorySession(s,{type:'plotView',patch:{type}},repo);assert.equal(s.lastPlot.sweep,run.sweep);assert.equal(s.revision,saved.revision)}
 s=updateLaboratorySession(s,{type:'plotView',patch:{focusedSeriesId:null,showWaterReferences:true}},repo);assert.equal(s.visualizationState.plot.focusedSeriesId,null);assert.equal(s.lastPlot.sweep,run.sweep)
 const code=fs.readFileSync('src/components/PlotWorkspace.jsx','utf8');assert.match(code,/showWaterReferences\?\?true/)
})
test('redox labels do not alter fractions or provenance and missing validated metadata cannot assign oxidation states',()=>{
 const d=derived('total-fraction'),read=legendReadout(d,0,session.revision,'Fe');assert.match(read.rows.find(r=>r.id===metal).text,/of total Fe$/);assert.doesNotMatch(read.rows.find(r=>r.id===metal).text,/Fe²/)
 const p=JSON.parse(resultPackage(run.system,run.sweep,d,d.series.map(s=>s.id),{redoxPresentation:run.redoxPresentation},session.revision));assert.equal(p.view.redoxPresentation.suppliedComponentId,run.request.componentId);assert.equal(p.system.components[0].name,run.system.components[0].name)
 assert.deepEqual(redoxPresentation(run.system,{},repo.getComponentById(run.request.componentId),'Fe').carriers,{})
})
test('supplied ferric form is preserved separately from canonical ferrous basis and elemental Fe conservation',async()=>{
 const s=structuredClone(session),ferric=repo.getComponents().find(c=>c.name==='Fe 3+');s.chemicalSystem.selectedComponents=s.chemicalSystem.selectedComponents.map(id=>id===run.request.componentId?ferric.id:id);s.calculationDefinition.imposedEh.componentId=ferric.id
 const r=await runImposedEh(s,repo);assert.ok(r.ok,r.reason);assert.equal(r.redoxPresentation.suppliedAs,'Fe 3+');assert.equal(r.redoxPresentation.label,'Fe');assert.equal(r.system.components[0].id,componentId);assert.deepEqual(r.sweep.outcomes.map(o=>o.result.concentrations),run.sweep.outcomes.map(o=>o.result.concentrations))
})
