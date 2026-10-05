import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {createRepository} from '../src/thermodynamics/repository.js'
import {redoxWorkflowExample} from '../src/data/redoxWorkflowExample.js'
import {runUserPourbaix,preparePourbaixWorkflow,commitUserPourbaix,isCurrentUserPourbaix,configurePourbaixDefinition} from '../src/calculations/userPourbaix.js'
import {discoverRedoxSystem,sourceRedoxFamily} from '../src/analysis/redoxDiscovery.js'
import {redoxSupportCatalog} from '../src/analysis/redoxSupportCatalog.js'
import {selectedEquilibrium} from '../src/plots/resultSelection.js'
import {exportPourbaix} from '../src/calculations/boundedPourbaix.js'
import {pourbaixPresentation} from '../src/plots/pourbaixPresentation.js'
import {pourbaixSvg} from '../src/plots/pourbaixView.js'
const repository=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const sessions={},results={}
for(const label of ['Fe','Cu']){sessions[label]=redoxWorkflowExample(repository,label);results[label]=await runUserPourbaix(sessions[label],repository)}
for(const [label,counts] of [['Fe',{0:422,2:581,3:1473,6:89}],['Cu',{0:1179,1:156,2:1230}]])test(label+' discovered full grid exactly preserves independently accepted fractions and topology',()=>{
 const r=results[label];assert.ok(r.ok,r.reason);const old=JSON.parse(gunzipSync(fs.readFileSync(label==='Fe'?'docs/oxidation-state-fe-validation.json.gz':'docs/cu-pourbaix-samples.json.gz'))),actual={}
 r.points.forEach((p,i)=>{actual[p.predominant]=(actual[p.predominant]??0)+1;assert.deepEqual(p.fractions,(label==='Fe'?old.samples[i].classification:old.export.points[i]).fractions);assert.equal(p.unresolvedInventory,0)})
 assert.deepEqual(actual,counts);assert.equal(r.support.scientificStatus,'reference-validated');assert.equal(r.grid.counts.converged,2565)
})
test('element-only System selection discovers its family without manually selecting redox forms',async()=>{
 const s=structuredClone(sessions.Fe);s.chemicalSystem.selectedComponents=s.chemicalSystem.selectedComponents.filter(id=>repository.getComponentById(id).role!=='basis-choice');delete s.calculationDefinition.pourbaix;s.calculationDefinition=configurePourbaixDefinition(s.calculationDefinition)
 const p=await preparePourbaixWorkflow(s,repository);assert.ok(p.ok,p.reason);assert.equal(p.preparation.system.id,results.Fe.system.id);assert.equal(p.referenceMatch,true)
})
test('source family closure is independent of starting form and explicit registry identity covers every included carrier',async()=>{
 for(const label of ['Fe','Cu']){const q=sessions[label].calculationDefinition.pourbaix,f=sourceRedoxFamily(repository,q.componentId);for(const id of f.componentIds){assert.deepEqual(sourceRedoxFamily(repository,id),f);const p=await discoverRedoxSystem(repository,{componentId:id},redoxSupportCatalog);assert.ok(p.ok,p.reason);assert.equal(p.system.id,results[label].system.id)}}
})
test('missing, ambiguous and changed metadata fail closed with no test-only fallback',async()=>{
 const q=sessions.Cu.calculationDefinition.pourbaix
 for(const catalog of [[],[redoxSupportCatalog[1],redoxSupportCatalog[1]],redoxSupportCatalog.map(c=>c.label==='Cu'?{...c,registry:{...c.registry,rows:c.registry.rows.slice(1)}}:c)]){const p=await discoverRedoxSystem(repository,{componentId:q.componentId},catalog);assert.equal(p.ok,false);assert.equal(p.status,'unsupported')}
 const unknown=await discoverRedoxSystem(repository,{componentId:'unknown'},redoxSupportCatalog);assert.equal(unknown.ok,false)
})
test('user total and ranges change the actual grid and cannot inherit reference validation',async()=>{
 const s=structuredClone(sessions.Cu);s.calculationDefinition.pourbaix={...s.calculationDefinition.pourbaix,total:.002,pH:{min:2,max:12,points:5},Eh:{min:-1.005715,max:1.005715,points:5}}
 const r=await runUserPourbaix(s,repository);assert.ok(r.ok,r.reason);assert.equal(r.support.scientificStatus,'calculated-internally-verified');assert.equal(r.support.referenceContractVersion,null);assert.equal(r.points.length,25);assert.ok(r.points.every(p=>p.totalInventory===.002));assert.equal(r.points[0].pH,2);assert.equal(r.points.at(-1).pH,12)
})
test('phase suppression is disclosed and cannot retain the default reference claim',async()=>{
 const s=structuredClone(sessions.Cu);s.chemicalSystem.excludedSpecies=[results.Cu.contract.includedSolids[0]];s.calculationDefinition.pourbaix.pH.points=3;s.calculationDefinition.pourbaix.Eh.points=3
 const p=await preparePourbaixWorkflow(s,repository);assert.ok(p.ok,p.reason);assert.equal(p.referenceMatch,false);assert.equal(p.contract.includedSolids.length,3);assert.ok(p.preparation.discovery.excludedCandidates.some(r=>r.id===s.chemicalSystem.excludedSpecies[0]));const r=await runUserPourbaix(s,repository);assert.ok(r.ok,r.reason);assert.equal(r.support.scientificStatus,'calculated-internally-verified')
})
test('invalid totals, ranges, oversized grids, nonideal conditions and extra analytical components fail explicitly',async()=>{
 for(const mutate of [s=>s.calculationDefinition.pourbaix.total=1e-10,s=>s.calculationDefinition.pourbaix.total=0,s=>s.calculationDefinition.pourbaix.Eh.min=2,s=>s.calculationDefinition.pourbaix.pH.points=1000,s=>s.calculationDefinition.activityModel='davies',s=>s.chemicalSystem.selectedComponents.push(sessions.Fe.calculationDefinition.pourbaix.componentId)]){const s=structuredClone(sessions.Cu);mutate(s);assert.equal((await preparePourbaixWorkflow(s,repository)).ok,false)}
})
test('uranium discovery resolves fractional reaction algebra but keeps unresolved allocations unavailable',async()=>{
 const p=await preparePourbaixWorkflow(redoxWorkflowExample(repository,'U'),repository);assert.equal(p.ok,false);assert.equal(p.status,'unsupported');assert.equal(p.discovery.family.componentIds.length,4);assert.ok(p.discovery.family.bridges.length);assert.equal(p.discovery.algebraStatus,'algebraically-supported');assert.equal(p.discovery.unsupportedCandidates.length,0);assert.ok(p.discovery.unresolvedCarriers.length);assert.equal(p.discovery.inventoryComplete,false)
})
test('stale, cancelled or forged results cannot enter the shared plot and beaker',async()=>{
 const s=sessions.Cu,r=results.Cu,committed=commitUserPourbaix(s,r);assert.ok(selectedEquilibrium(committed,1000).ok);assert.equal(isCurrentUserPourbaix(s,structuredClone(r)),false);const changed=structuredClone(s);changed.calculationDefinition.pourbaix.total=.002;assert.equal(commitUserPourbaix(changed,r),changed);assert.equal(isCurrentUserPourbaix({...s,revision:s.revision+1},r),false);assert.equal((await runUserPourbaix(s,repository,{isCurrent:()=>false})).ok,false)
})
test('generic map and numerical export retain actual element, source scope, total denominator and status',()=>{
 for(const label of ['Fe','Cu']){const s=sessions[label],r=results[label],view=pourbaixPresentation(r),svg=pourbaixSvg(r,1000,s.revision,view),data=exportPourbaix(r,s.revision);assert.ok(svg.includes(label+'('));assert.equal(data.label,label);assert.equal(data.discovery.inventoryComplete,true);assert.equal(data.support.scientificStatus,'reference-validated');assert.equal(data.points[1000].totalInventory,r.contract.total)}
})
test('generic discovery contains no element-specific branches or oxidation-state name parsing',()=>{
 const source=fs.readFileSync('src/analysis/redoxDiscovery.js','utf8');assert.doesNotMatch(source,/\b(?:Fe|Cu|Mn|U)\b/);assert.doesNotMatch(source,/\.match\(|\.matchAll\(|RegExp/)
 for(const label of ['Fe','Cu']){const r=results[label];assert.ok(r.points.some(p=>p.waterWindow==='above-O2-reference'));assert.ok(r.points.some(p=>p.waterWindow==='below-H2-reference'));assert.ok(r.points.every(p=>p.carriers.every(c=>c.id===r.system.components[0].id||r.system.products.some(product=>product.id===c.id))))}
})

// Integration checks reuse the grids above; no additional reference campaign.
import {pourbaixReadiness,pourbaixScientificLabel,pourbaixCarrierDetails} from '../src/plots/pourbaixExperience.js'
import {pourbaixKeyboardIndex} from '../src/plots/pourbaixView.js'
test('experience readiness distinguishes constructible metadata-pending chemistry from unsupported and checked results',async()=>{
 const u=await preparePourbaixWorkflow(redoxWorkflowExample(repository,'U'),repository)
 assert.match(pourbaixReadiness(u).label,/CHEMISTRY CONSTRUCTIBLE.*METADATA PENDING/)
 assert.equal(u.ok,false);assert.equal(u.publicEnabled,false)
 assert.equal(pourbaixReadiness({ok:false,reason:'bad input'}).label,'UNSUPPORTED')
 assert.equal(pourbaixScientificLabel('reference-validated'),'REFERENCE VALIDATED')
 assert.equal(pourbaixScientificLabel('calculated-internally-verified'),'CALCULATED / INTERNALLY VERIFIED')
 assert.equal(pourbaixScientificLabel('unknown'),'UNSUPPORTED')
})
test('carrier details preserve within-state chemistry and count mixed-valence atoms once per carrier',()=>{
 const r=results.Fe,forms=new Map()
 for(const p of r.points){const d=pourbaixCarrierDetails(p);assert.ok(Math.abs(d.all.reduce((sum,c)=>sum+c.fraction,0)-1)<1e-8);if(p.predominant===3&&d.dominant[0])forms.set(d.dominant[0].id,d.dominant[0].name)}
 assert.ok(forms.size>1)
 const p=r.points.find(p=>p.carriers.some(c=>c.id===r.system.products.find(q=>q.name==='Fe3O4(cr)').id&&c.componentAmount>0)),d=pourbaixCarrierDetails(p)
 const id=r.system.products.find(q=>q.name==='Fe3O4(cr)').id
 assert.equal(d.all.filter(c=>c.id===id).length,1)
 assert.equal(d.all.find(c=>c.id===id).componentAmount,p.carriers.filter(c=>c.id===id).reduce((sum,c)=>sum+c.componentAmount,0))
})
test('keyboard inspection reuses the same accepted input and result for plot and beaker',()=>{
 const r=results.Fe,s=commitUserPourbaix(sessions.Fe,r),index=pourbaixKeyboardIndex(r.contract,1457,'ArrowRight'),p=r.points[index],beaker=selectedEquilibrium(s,index)
 assert.ok(beaker.ok);assert.equal(beaker.input.id,p.inputId);assert.equal(beaker.result,r.grid.outcomes[index].result)
 assert.equal(s.lastPlot.pourbaix,r);assert.equal(r.grid,results.Fe.grid)
})
