import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {repo} from '../scripts/validation/nonRedoxPhysicalBenchmark.js'
import {searchComponentSystem} from '../src/thermodynamics/componentSearch.js'
import {prepareChemicalSystem,createPointInput} from '../src/solver/models.js'
import {solvePoint,closedSolidActivePolicy} from '../src/solver/point.js'
import {sourceSolidPolicy} from '../src/solver/assemblages.js'
import {physical,ids} from '../scripts/validation/networkBenchmarks.js'
import {closedPureSolidIds} from '../src/thermodynamics/closedPureSolids.js'
const reference=JSON.parse(fs.readFileSync('docs/hydra-search-reference.json'))
test('seven component-system searches match independently executed pinned Java names exactly',()=>{
 for(const c of reference.cases){const q=searchComponentSystem(repo,c.selected);assert.ok(q.ok);assert.deepEqual(q.products.map(r=>r.name).sort(),c.products,c.name);for(const r of q.products)assert.deepEqual(r.metadata.effectiveSourceReaction,repo.getSpeciesById(r.id).metadata.effectiveSourceReaction)}
})
test('water is implicit, electron expands vocabulary only through admitted redox products',()=>{
 const c=reference.cases[0],a=searchComponentSystem(repo,c.selected),b=searchComponentSystem(repo,[...c.selected,'component:H2O'])
 assert.deepEqual(a.products.map(r=>r.id),b.products.map(r=>r.id));assert.equal(a.expansions.length,0);assert.equal(a.solids[0].name,'Fe(OH)2(cr)');assert.ok(!a.products.some(r=>r.name==='Fe 3+'))
 const redox=searchComponentSystem(repo,reference.cases[1].selected);assert.ok(redox.expansions.some(x=>x.componentId==='component:Fe%203%2B'));assert.ok(redox.electronConnected.length);assert.equal(searchComponentSystem(repo,['invented']).ok,false)
})
const amounts={[ids.F]:6e-6,'component:CrO4%202-':2e-6,'component:K%2B':2e-6,[ids.Cl]:.010012,[ids.H]:.010002}
test('general 76-source Fe/chromate closes all 21 candidates without subset enumeration',async()=>{
 const r=await physical(amounts,{phases:['aqueous','pure-solids']}),a=r.result.accepted;assert.ok(r.result.ok,JSON.stringify(r.result.diagnostics));assert.equal(r.result.solidScope.admitted.length,21);assert.equal(r.compiled.inspection.networkSpeciesCount,76);assert.equal(a.system.solidPolicy,sourceSolidPolicy);assert.equal(a.result.phaseSelection.history.length,2)
 for(const s of a.result.solids){assert.ok(s.amount>=0);assert.ok(s.amount>0?Math.abs(s.logSaturation)<=a.result.saturationTolerance:s.logSaturation<=a.result.saturationTolerance)}
 const restricted=await physical(amounts,{phases:['aqueous','pure-solids'],solidIds:closedPureSolidIds});assert.ok(restricted.result.ok);assert.notEqual(a.system.id,restricted.result.accepted.system.id);assert.equal(a.inspection.pH,restricted.result.accepted.inspection.pH);assert.equal(a.inspection.pe,restricted.result.accepted.inspection.pe)
 assert.equal(solvePoint(a.system,a.input).diagnostics[0].code,'active-policy-required')
 const invalid=await physical(amounts,{phases:['aqueous','pure-solids'],solidIds:['unknown']});assert.equal(invalid.compiled.diagnostics[0].code,'invalid-solid-scope')
})
async function manySolids(count){
 const components=[{id:'a',name:'A',role:'ordinary'},{id:'b',name:'B',role:'ordinary'}],products=Array.from({length:count},(_,i)=>({id:'s'+String(i).padStart(3,'0'),name:'Phase '+i,phase:'solid',coefficients:i===1?[0,1]:[1,0],logBeta:i<2?3:-10-i,sourceRecord:{kind:'synthetic-capacity-control'}}))
 const p=await prepareChemicalSystem({components,products,solidPolicy:sourceSolidPolicy,basisStatus:'explicit-direct',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{kind:'synthetic-capacity-control'}})
 if(!p.ok)return p
 const q=await createPointInput(p.system,{constraints:components.map(c=>({componentId:c.id,kh:1,value:.01})),revision:0,unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,activityModel:'ideal'})
 return solvePoint(p.system,q.input,{phaseSelection:closedSolidActivePolicy})
}
test('active policy solves two simultaneous solids above 64 and retains existing 128-product bound',async()=>{
 for(const n of [63,64,65,80,128]){const r=await manySolids(n);assert.ok(r.ok,JSON.stringify(r.diagnostics));assert.equal(r.solids.length,n);assert.equal(r.solids.filter(s=>s.amount>0).length,2);assert.ok(r.solids.slice(0,2).every(s=>Math.abs(s.amount-.009)<1e-12));assert.equal(r.phaseSelection.history.length,3)}
 const r=await manySolids(129);assert.equal(r.ok,false);assert.ok(r.diagnostics.some(d=>d.code==='unsupported-size'))
})
import {compileEquilibriumNetwork,solveEquilibriumNetwork} from '../src/thermodynamics/equilibriumNetwork.js'
import {request} from '../scripts/validation/exactConservationRun.js'
import {prepareClosedRedox,solveClosedRedox} from '../src/solver/closedRedox.js'
test('nitrate conditioning selection preserves exact inventory and agrees with an independent basis solve',async()=>{
 const c=await compileEquilibriumNetwork(repo,request({'component:Na%2B':.01,'component:NO3-':.01})),r=solveEquilibriumNetwork(c);assert.ok(r.ok,JSON.stringify(r.diagnostics));assert.equal(r.basisSelection.policy,'initial-conditioning-source-basis-v1');assert.equal(r.accepted.inspection.elementalMetadata,'unavailable');assert.ok(r.gasFugacitySum<1);assert.ok(r.accepted.closed.inspection.inventories.every(v=>v.ok))
 const p=c.preparedSystemInput.prepared,n=p.network,basis=[...n.basisIds];basis[0]='component:H2O2'
 const alternative=await prepareClosedRedox({mode:'closed-redox',conservationMethod:'source-exact-v1',sourceFingerprint:n.sourceFingerprint,temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O',species:n.sourceSpecies,reactions:[...n.halves,...n.ordinaryReactions],basisIds:basis,electronId:n.electronId,solvent:{kind:'fixed-water-activity',speciesId:n.water.id,logActivity:0},preparation:p.preparation}),a=solveClosedRedox(alternative)
 assert.ok(a.ok,JSON.stringify(a.diagnostics));assert.ok(Math.abs(a.inspection.pH-r.accepted.inspection.pH)<1e-10);assert.ok(Math.abs(a.inspection.pe-r.accepted.inspection.pe)<1e-10)
 for(const carrier of r.accepted.inspection.carriers){const i=a.result.speciesIds.indexOf(carrier.id);assert.ok(i>=0);assert.ok(Math.abs(Math.log10(carrier.amount/a.result.concentrations[i]))<1e-9,carrier.name)}
})
