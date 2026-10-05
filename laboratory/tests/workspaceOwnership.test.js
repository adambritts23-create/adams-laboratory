import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {createWorkspaceSession,updateLaboratorySession} from '../src/session/laboratorySession.js'
import {elementRemovalBlock} from '../src/chemistry/system.js'
import {mixedCarbonateSolubilityExample} from '../src/data/solubilityExample.js'
import {metalLigandSurfaceExample} from '../src/data/metalLigandSurfaceExample.js'
import {beakerSupport,calculateCurrentBeaker,beakerState} from '../src/beaker/equilibriumBeaker.js'
import {prepareSessionPoint} from '../src/solver/prepareSession.js'
import {createSweepDefinition,runSweep} from '../src/calculations/sweep.js'
import {deriveOutputs} from '../src/calculations/outputs.js'
import {resultPackage} from '../src/plots/export.js'
import {bounds} from '../src/plots/geometry.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const update=(s,a)=>updateLaboratorySession(s,a,repo)
const toggle=(s,symbol)=>update(s,{type:'system',action:{type:'toggleSelectedElement',symbol}})
const names=s=>s.chemicalSystem.selectedComponents.map(id=>repo.getComponentById(id).name)
const load=()=>update(createWorkspaceSession(repo),{type:'loadExample',session:mixedCarbonateSolubilityExample(repo),id:'beaker',label:'Ca–carbonate–Mg'})

test('ordinary UI element toggle removes forms, incompatible phases and downstream component selections',()=>{
 const s=load(),mg=repo.getComponents().find(c=>c.name==='Mg 2+').id
 s.lastPlot={system:{old:true}};s.visualizationState.plot={componentId:mg,gridSeriesId:mg};s.analysisState.requests=[{componentId:mg}]
 const next=toggle(s,'Mg')
 assert.ok(!names(next).includes('Mg 2+'));assert.ok(!next.chemicalSystem.selectedElements.includes('Mg'))
 for(const id of [...next.chemicalSystem.selectedSpecies,...next.chemicalSystem.optionalSpecies]) assert.ok(!repo.getSpeciesById(id).name.includes('Mg'))
 assert.ok(!next.calculationDefinition.componentConditions.some(c=>c.componentId===mg))
 assert.ok(!next.calculationDefinition.mixedSolubility.componentIds.includes(mg))
 assert.equal(next.lastPlot,null);assert.equal(next.sweepResult,null);assert.deepEqual(next.analysisState.requests,[])
 assert.ok(!JSON.stringify(next.visualizationState).includes(mg))
 const discovery=toggle(next,'Mg');assert.ok(discovery.chemicalSystem.selectedElements.includes('Mg'));assert.ok(!names(discovery).includes('Mg 2+'))
})
test('required solvent elements cannot be removed and have explicit explanations',()=>{
 const s=load();for(const element of ['H','O']){assert.match(elementRemovalBlock(s.chemicalSystem,element,repo),/required by the current solvent/);assert.equal(toggle(s,element),s)}
})
test('tabs change only view state and explicit example load synchronizes authoritative chemistry',()=>{
 let s=load();assert.equal(s.loadedExample.label,'Ca–carbonate–Mg');assert.ok(names(s).includes('Mg 2+'))
 const chemistry=s.chemicalSystem,definition=s.calculationDefinition,revision=s.revision
 for(const workspace of ['calculation','beaker','system']){s=update(s,{type:'workspace',workspace});assert.equal(s.chemicalSystem,chemistry);assert.equal(s.calculationDefinition,definition);assert.equal(s.revision,revision)}
})
test('unsupported current Ca/carbonate chemistry never substitutes a beaker example',async()=>{
 const s=toggle(load(),'Mg');assert.equal(beakerSupport(s,repo).ok,false)
 const result=await calculateCurrentBeaker(s,repo);assert.equal(result.reason,'unsupported-current-beaker-system');assert.equal(result.visual,null);assert.equal(result.system,undefined)
 assert.ok(!names(s).includes('Mg 2+'))
})
test('New and Reset isolate prior examples without resurrecting metals or ligands',()=>{
 let s=update(load(),{type:'loadExample',session:metalLigandSurfaceExample(repo),id:'ni',label:'Ni–ammonia'})
 assert.ok(names(s).some(n=>n.includes('Ni')))
 s=update(s,{type:'newSystem'});assert.ok(names(s).every(n=>['H2O','H+'].includes(n)));assert.deepEqual(s.chemicalSystem.selectedElements,[]);assert.equal(s.loadedExample,undefined)
 const ca=toggle(load(),'Mg'),reset=update(ca,{type:'resetCalculation'})
 assert.deepEqual(reset.chemicalSystem,ca.chemicalSystem);assert.equal(reset.lastPlot,null);assert.equal(reset.calculationDefinition.mixedSolubility,undefined);assert.ok(!names(reset).includes('Mg 2+'))
})
test('explicit shared beaker session preserves every one of the 29 accepted exact pH states',async()=>{
 const s=load(),snapshot=await calculateCurrentBeaker(s,repo);assert.ok(snapshot.ok);assert.equal(snapshot.revision,s.revision)
 assert.equal(snapshot.sweep.outcomes.length,29)
 for(let i=0;i<29;i++){const point=beakerState(snapshot,i/2,s.revision);assert.ok(point.ok);assert.equal(point.result,snapshot.sweep.outcomes[i].result)}
 const edited=structuredClone(s);edited.calculationDefinition.componentConditions.find(c=>c.mode==='T').value*=2
 assert.equal(beakerSupport(edited,repo).ok,false)
})
test('Ca/carbonate recalculation and exact numerical export contain no removed Mg component or species',async()=>{
 const s=toggle(load(),'Mg'),prepared=await prepareSessionPoint(s,repo,{sweep:true});assert.ok(prepared.ok,JSON.stringify(prepared.diagnostics))
 const def=await createSweepDefinition(prepared.system,s.calculationDefinition,s.revision);assert.ok(def.ok)
 const sweep=await runSweep(prepared.system,def.sweep),derived=deriveOutputs(prepared.system,sweep,{type:'saturated-log-solubility',...s.calculationDefinition.mixedSolubility})
 assert.ok(derived.ok);assert.equal(derived.series.length,1);assert.ok(sweep.counts.converged>0)
 const exported=resultPackage(prepared.system,sweep,derived,derived.series.map(s=>s.id),bounds(derived.series,derived.metadata.axis,true),s.revision)
 const fields=JSON.stringify(JSON.parse(exported),(key,value)=>key.endsWith('Base64')?undefined:value)
 assert.doesNotMatch(fields, /(?:^|[^A-Za-z0-9])(Mg|Ni|Mn)(?:[^a-zA-Z0-9]|$)/)
})
test('Mn development control is dev-gated inside collapsed diagnostics, outside ordinary header',()=>{
 const source=fs.readFileSync('src/App.jsx','utf8')
 assert.ok(!source.slice(source.indexOf('<header>'),source.indexOf('</header>')).includes('Mn'))
 assert.ok(source.includes('import.meta.env.DEV&&<details><summary>Development diagnostics</summary>'))
 assert.ok(source.includes('diagnostic&&<MnDiagnostic/>'))
})
