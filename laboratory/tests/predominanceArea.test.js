import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {createRepository} from '../src/thermodynamics/repository.js'
import {redoxWorkflowExample} from '../src/data/redoxWorkflowExample.js'
import {configureArea,prepareArea,runArea,inspectArea,areaClassification,areaIdentity} from '../src/calculations/predominanceArea.js'
import {runGrid,isGridResult} from '../src/calculations/grid.js'
const repository=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
function example(label,small=false){const s=redoxWorkflowExample(repository,label);if(label==='Cr'){s.calculationDefinition.pourbaix.total=1;s.calculationDefinition.pourbaix.Eh.max=1}s.calculationDefinition=configureArea(s.calculationDefinition,s.chemicalSystem.selectedComponents.map(id=>repository.getComponentById(id)));s.calculationDefinition.predominanceArea.interpretation='auto';s.calculationDefinition.predominanceArea.phasePolicy='largest-inventory';if(small)s.calculationDefinition.independentVariables.forEach(a=>a.points=3);return s}
for(const [label,counts] of [['Fe',{0:422,2:581,3:1473,6:89}],['Cu',{0:1179,1:156,2:1230}]])test(`${label} compact area preserves exact reference fractions, topology and lazy sample`,async()=>{
 const s=example(label),p=await prepareArea(s,repository);assert.ok(p.ok,p.reason);const r=await runArea(p),old=JSON.parse(gunzipSync(fs.readFileSync(label==='Fe'?'docs/oxidation-state-fe-validation.json.gz':'docs/cu-pourbaix-samples.json.gz'))),actual={}
 for(const [i,point] of r.points.entries()){const ref=label==='Fe'?old.samples[i].classification:old.export.points[i];assert.deepEqual(point.fractions,ref.fractions);const state=Number(point.region.id.split(':')[1]);actual[state]=(actual[state]??0)+1;assert.equal(point.input,undefined);assert.equal(point.result,undefined)}
 assert.deepEqual(actual,counts);assert.equal(r.grid.counts.converged,2565);assert.equal(isGridResult(r.grid),false)
 for(const index of [0,1457,2564]){const inspected=await inspectArea(r,index);assert.ok(inspected.ok);assert.deepEqual(inspected.classification.fractions,r.points[index].fractions);assert.deepEqual(inspected.classification.acceptedSolids,r.points[index].acceptedSolids)}
 assert.equal((await inspectArea(structuredClone(r),0)).ok,false)
})
test('Cr retains 2565 accepted points and eight carriers without oxidation metadata, identical to full grid',async()=>{
 const p=await prepareArea(example('Cr'),repository),r=await runArea(p),full=await runGrid(p.system,p.grid);assert.equal(p.model,null);assert.equal(p.interpretation,'carrier');assert.equal(r.grid.counts.converged,2565);assert.equal(new Set(r.points.map(x=>x.region.id)).size,8)
 assert.deepEqual(r.points.map(x=>({status:x.status,region:x.region,acceptedSolids:x.acceptedSolids})),full.outcomes.map(o=>areaClassification(p,o)))
 for(const index of [0,1400,2564]){const inspect=await inspectArea(r,index);assert.equal(inspect.input.id,full.outcomes[index].input.id);assert.deepEqual(inspect.result,full.outcomes[index].result)}
})
test('generic analytical axes, serialization and XY transpose preserve sampled science',async()=>{
 const s=example('Cu',true),original=await runArea(await prepareArea(s,repository));s.calculationDefinition.independentVariables.reverse();const transposed=await runArea(await prepareArea(s,repository));for(const p of original.points)assert.deepEqual(p.region,transposed.points[p.ix*3+p.iy].region)
 const q=s.calculationDefinition,main=q.predominanceArea.componentId,old=q.independentVariables[0];q.independentVariables[0]={componentId:main,mode:'LTV',quantity:'total',unit:'mol/kg-H2O',range:{min:-4,max:-2},points:3};q.componentConditions=q.componentConditions.filter(c=>c.componentId!==main);q.componentConditions.push({componentId:old.componentId,mode:'LA',quantity:'Eh',unit:'V-SHE',value:0})
 const p=await prepareArea(JSON.parse(JSON.stringify(s)),repository);assert.ok(p.ok,p.reason);assert.equal((await runArea(p)).grid.counts.converged,9)
 // Eh x total with fixed pH, using the same source preparation.
 const h=q.independentVariables[1];q.independentVariables[1]={...old};q.componentConditions=q.componentConditions.filter(c=>c.componentId!==old.componentId);q.componentConditions.push({componentId:h.componentId,mode:'LA',quantity:'pH',unit:'dimensionless',value:7});assert.ok((await prepareArea(s,repository)).ok)
})
test('uncomputed and invalid samples are gaps; stale identity and mixed reservoir guard are explicit',async()=>{
 const s=example('Fe',true),p=await prepareArea(s,repository),controller=new AbortController();controller.abort();const r=await runArea(p,{signal:controller.signal});assert.equal(r.grid.counts.notRun,9);assert.ok(r.points.every(x=>x.status==='gap'));assert.equal((await inspectArea(r,0)).ok,false)
 assert.equal((await runArea(p,{isCurrent:()=>false})).grid.status,'invalidated-stale');const id=areaIdentity(s);s.calculationDefinition.independentVariables[0].range.max=12;assert.notEqual(areaIdentity(s),id)
 Object.assign(s.calculationDefinition.independentVariables[0],{quantity:'total',mode:'TV',unit:'mol/kg-H2O'});assert.equal((await prepareArea(s,repository)).system.redoxPolicy,'analytical-proton-fixed-electron-v1')
})
import {createWorkspaceSession} from '../src/session/laboratorySession.js'
import {createCalculationDefinition,createCondition} from '../src/calculations/definition.js'
import {searchComponentSystem} from '../src/thermodynamics/componentSearch.js'
test('two distinct material-total axes use HYDRA ordinary chemistry, without an oxidation or atom registry',async()=>{
 const s=createWorkspaceSession(repository),c=['Ca 2+','Cl-','H+','H2O'].map(name=>repository.getComponents().find(c=>c.name===name)),search=searchComponentSystem(repository,c.map(c=>c.id))
 s.chemicalSystem={...s.chemicalSystem,selectedComponents:c.map(c=>c.id),selectedSpecies:search.products.filter(p=>['aqueous','solid'].includes(p.phase)).map(p=>p.id),enabledPhases:['aqueous','solid','liquid'],temperature:25,pressure:1}
 const d=createCalculationDefinition(s.chemicalSystem,repository);d.dimensions=2;d.predominanceArea={componentId:c[0].id,interpretation:'carrier'};d.independentVariables=c.slice(0,2).map(c=>({...createCondition(c,'LTV','total'),range:{min:-3,max:-2},points:3}));d.componentConditions=d.componentConditions.filter(x=>!c.slice(0,2).some(c=>c.id===x.componentId)).map(x=>({...x,value:x.quantity==='pH'?7:0}));s.calculationDefinition=d
 const p=await prepareArea(s,repository);assert.ok(p.ok,p.reason);assert.equal(p.model,null);assert.deepEqual(p.search.products.map(p=>p.id),search.products.map(p=>p.id));assert.equal((await runArea(p)).grid.counts.converged,9)
 // An injected unrelated database product cannot be admitted by the calculation.
 s.chemicalSystem.selectedSpecies.push(repository.getSpecies().find(x=>x.name==='Fe3O4(cr)').id);assert.equal((await prepareArea(s,repository)).ok,false)
})
