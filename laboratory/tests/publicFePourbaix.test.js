import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {createRepository} from '../src/thermodynamics/repository.js'
import {prepareFeCandidate} from '../src/analysis/prepareFeCandidate.js'
import {fePourbaixExample} from '../src/data/fePourbaixExample.js'
import {publicFeSetupReason} from '../src/calculations/fePublicSetup.js'
import {runPublicFePourbaix,commitPublicFeResult,publicFeSample} from '../src/calculations/publicFePourbaix.js'
import {diagramUnavailable,diagramType} from '../src/calculations/diagramSetup.js'
import {selectedEquilibrium} from '../src/plots/resultSelection.js'
import {fePourbaixSvg,feKeyboardIndex,feSampleIndex} from '../src/plots/fePourbaixView.js'
const repository=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const preparation=await prepareFeCandidate(repository),session=fePourbaixExample(repository,preparation)
const result=await runPublicFePourbaix(session,repository),accepted=commitPublicFeResult(session,result)
test('exact Fe setup enables the integrated public diagram and accepts all 2565 unchanged classifications',()=>{
 assert.equal(publicFeSetupReason(session,preparation,{axes:true}),null)
 assert.equal(diagramUnavailable('pourbaix',session.calculationDefinition,[],7,true,null),null)
 assert.equal(diagramType(session.calculationDefinition,session.visualizationState.plot),'pourbaix')
 assert.equal(result.ok,true);assert.equal(result.support.publicEnabled,true)
 const old=JSON.parse(gunzipSync(fs.readFileSync('docs/oxidation-state-fe-validation.json.gz')))
 const counts={};result.points.forEach((c,i)=>{counts[c.predominant]=(counts[c.predominant]??0)+1;assert.deepEqual(c.fractions,old.samples[i].classification.fractions)})
 assert.deepEqual(counts,{0:422,2:581,3:1473,6:89})
})
test('unsupported total, temperature, model, basis, carrier set, phase suppression and resolution reject',()=>{
 for(const mutate of [s=>{s.calculationDefinition.componentConditions[0].value=0.01},s=>{s.calculationDefinition.temperature.value=30},s=>{s.calculationDefinition.activityModel='nonideal'},s=>{s.chemicalSystem.selectedComponents[0]='component:Cu%202%2B'},s=>{s.chemicalSystem.selectedSpecies.pop()},s=>{s.chemicalSystem.excludedSpecies.push('spana:2ac52a30213c9288:134486')},s=>{s.calculationDefinition.enabledPhases=['aqueous']},s=>{s.calculationDefinition.independentVariables[0].points=29},s=>{s.calculationDefinition.componentConditions[1].value=-1}]){
 const s=structuredClone(session);mutate(s);assert.ok(publicFeSetupReason(s,preparation,{axes:true}));assert.equal(commitPublicFeResult(s,result),s)
 }
 assert.ok(publicFeSetupReason(session,null))
})
test('inspection and beaker use exactly the accepted input/result, including magnetite and ferrate',()=>{
 for(const index of [feSampleIndex(10,-0.6),feSampleIndex(14,1.2),0,1000]){
 const c=publicFeSample(result,index,0),state=selectedEquilibrium(accepted,index)
 assert.ok(state.ok,state.message);assert.equal(state.result,result.grid.outcomes[index].result);assert.equal(state.input,result.grid.outcomes[index].input);assert.equal(c.inputId,state.result.inputId)
 }
 const magnetite=publicFeSample(result,feSampleIndex(10,-0.6),0),parts=magnetite.carriers.filter(c=>c.id.endsWith(':134486'))
 assert.equal(parts[1].componentAmount,2*parts[0].componentAmount)
 assert.equal(magnetite.dominantThermodynamicCarriers[0].name,'Fe3O4(cr)')
 const ferrate=publicFeSample(result,feSampleIndex(14,1.2),0)
 assert.equal(ferrate.predominant,6);assert.equal(ferrate.waterWindow,'above-O2-reference');assert.equal(ferrate.dominantThermodynamicCarriers[0].name,'FeO4-2')
})
test('stale, forged, failed or unresolved records receive no public region or accepted beaker',()=>{
 assert.equal(publicFeSample(result,0,1),null);assert.equal(publicFeSample({...result},0,0),null)
 for(const status of ['failed','unavailable']){const copy={...result,points:[{status,predominant:3}]};assert.equal(fePourbaixSvg(copy,0,0),'');assert.equal(commitPublicFeResult(session,copy),session)}
 assert.equal(fePourbaixSvg(result,0,1),'');assert.equal(selectedEquilibrium({...accepted,revision:1},0).ok,false)
 assert.equal(commitPublicFeResult({...session,revision:1},result).lastPlot,null)
})
test('map cells are exact sampled classifications, retain FeVI, label water references and support keyboard selection',()=>{
 const svg=fePourbaixSvg(result,0,0)
 assert.equal((svg.match(/data-sample=/g)??[]).length,2565);assert.equal((svg.match(/data-state="6"/g)??[]).length,89)
 assert.match(svg,/Fe\(III\)/);assert.match(svg,/H₂ \/ O₂ references/)
 assert.equal(feKeyboardIndex(56,'ArrowRight'),56);assert.equal(feKeyboardIndex(57,'ArrowLeft'),57)
 assert.equal(feKeyboardIndex(0,'ArrowUp'),57);assert.equal(feKeyboardIndex(2564,'ArrowUp'),2564)
 assert.equal(feKeyboardIndex(100,'Home'),0);assert.equal(feKeyboardIndex(100,'End'),2564)
 assert.equal(feSampleIndex(14,1.2),2564)
})
