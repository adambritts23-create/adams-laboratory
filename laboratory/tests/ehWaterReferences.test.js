import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {redoxWorkflowExample} from '../src/data/redoxWorkflowExample.js'
import {configureImposedEh,runImposedEh,commitImposedEh} from '../src/calculations/imposedEh.js'
import {imposedEhWaterReferences} from '../src/analysis/imposedEhWaterReferences.js'
import {prepareWaterContext,waterContext} from '../src/analysis/registeredWaterContext.js'
import {deriveOutputs} from '../src/calculations/outputs.js'
import {figureSvg,resultPackage} from '../src/plots/export.js'
import {bounds,plotBox} from '../src/plots/geometry.js'
import {seriesLabel} from '../src/plots/presentation.js'
import {selectedEquilibrium} from '../src/plots/resultSelection.js'
import {updateLaboratorySession} from '../src/session/laboratorySession.js'
import {auditFeMetal,ironMetalSourceId} from '../scripts/validation/feMetalEhAudit.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const session=redoxWorkflowExample(repo,'Fe')
session.calculationDefinition=configureImposedEh(session.calculationDefinition,session.chemicalSystem.selectedComponents.map(id=>repo.getComponentById(id)))
Object.assign(session.calculationDefinition.imposedEh,{total:.001,pH:0})
const run=await runImposedEh(session,repo),committed=commitImposedEh(session,run)
const d=deriveOutputs(run.system,run.sweep,{type:'log-concentration'}),ids=d.series.map(s=>s.id),view=bounds(d.series,d.metadata.axis,true,d.metadata.output)

test('Fe metal source mass action and Nernst independently reproduce disappearance and 50/50 transitions',async()=>{
 for(const total of [.001,1]){const a=await auditFeMetal(repo,run.system,total);assert.ok(a.atMinus2.metalFraction>.999999);assert.ok(a.atMinus2.dissolved<2e-52);assert.equal(a.source.id,ironMetalSourceId)}
})
test('Eh sweep references exactly reuse registered Pourbaix convention at pH 0 and 7',async()=>{
 assert.equal(run.waterReferences.status,'available');assert.deepEqual(run.waterReferences.references.map(r=>r.Eh),[0,1.228887591327141])
 const model=await prepareWaterContext(repo)
 for(const pH of [0,7]){const r=await imposedEhWaterReferences(repo,{pH},{value:25,unit:'C'});assert.deepEqual(r.references,waterContext(model,pH,0).waterReferences);assert.equal(r.referenceElectrode,'SHE')}
})
test('water annotations fail independently of equilibrium and do not apply to a pH axis',async()=>{
 assert.equal((await imposedEhWaterReferences(repo,{mode:'fixed',pH:0},{value:25,unit:'C'})).status,'unavailable')
 assert.equal((await imposedEhWaterReferences(repo,{pH:0},{value:30,unit:'C'})).status,'unavailable')
 const broken={...repo,getSpeciesById:id=>id==='spana:2ac52a30213c9288:151531'?undefined:repo.getSpeciesById(id)}
 const r=await imposedEhWaterReferences(broken,{pH:0},{value:25,unit:'C'});assert.equal(r.status,'unavailable');assert.ok(run.ok)
})
test('water toggle preserves exact sweep, selected samples, numerical curves and outside-window equilibria',()=>{
 assert.equal(run.sweep.counts.converged,17)
 let s=committed
 for(const showWaterReferences of [true,false,true]){s=updateLaboratorySession(s,{type:'plotView',patch:{showWaterReferences}},repo);assert.equal(s.lastPlot.sweep,run.sweep);assert.equal(s.revision,session.revision);for(const i of [0,8,16])assert.equal(selectedEquilibrium(s,i).result,run.sweep.outcomes[i].result)}
 const plain=figureSvg(d,ids,view),marked=figureSvg(d,ids,view,'dark',d.metadata.revision,plotBox,null,run.waterReferences)
 assert.doesNotMatch(plain,/data-water-reference=/);assert.equal((marked.match(/data-water-reference=/g)||[]).length,2);assert.match(marked,/Nominal water-stability window/)
 assert.deepEqual(marked.match(/<polyline[^>]*>/g),plain.match(/<polyline[^>]*>/g))
 const outside=figureSvg(d,ids,{...view,xMin:-2,xMax:-1},'light',d.metadata.revision,plotBox,null,run.waterReferences);assert.doesNotMatch(outside,/data-water-reference=/);assert.doesNotMatch(outside,/data-water-window=/)
 const p=JSON.parse(resultPackage(run.system,run.sweep,d,ids,{...view,waterReferences:run.waterReferences},session.revision));assert.deepEqual(p.view.waterReferences,run.waterReferences);assert.equal(JSON.stringify(p.sweep.outcomes),JSON.stringify(run.sweep.outcomes))
})
test('short metal label retains exact accepted formula-unit amount and units in output/export',()=>{
 const metal=d.series.find(s=>s.id===ironMetalSourceId);assert.equal(seriesLabel(metal,'log-concentration'),'Fe(cr) · solid');assert.equal(metal.points[0].linearValue,.001);assert.equal(metal.points[0].linearUnit,'mol/kg-H2O')
})
