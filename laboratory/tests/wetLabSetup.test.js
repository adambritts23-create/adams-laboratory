import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {createWorkspaceSession} from '../src/session/laboratorySession.js'
import {defaultWetLabSetup,auditWetLabRecipes,prepareWetLabStocks,wetLabSampling,waterReactionId,wetLabSystemKey} from '../src/calculations/wetLabSetup.js'
import {createWetLabExperience} from '../src/calculations/wetLabExperience.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const system={...createWorkspaceSession(repo).chemicalSystem,selectedComponents:['component:H%2B','component:H2O','component:Na%2B','component:Cl-'],selectedSpecies:[waterReactionId]}
const setup=(sample={},titrant={})=>({sample:{...defaultWetLabSetup.sample,...sample},titrant:{...defaultWetLabSetup.titrant,...titrant}})
test('reviewed recipes activate intrinsic chemistry without manual System counterion selection',async()=>{
 const before=JSON.stringify(system),all=await auditWetLabRecipes(repo,system)
 assert.deepEqual(all.available.map(r=>r.id),['HCl','NaOH','CH3COOH','B(OH)3','CrCl3']);assert.equal(JSON.stringify(system),before)
 const withoutCl={...system,selectedComponents:system.selectedComponents.filter(id=>id!=='component:Cl-')}
 const a=await auditWetLabRecipes(repo,withoutCl);assert.ok(a.available.some(r=>r.id==='HCl'));assert.deepEqual(a.recipes[0].missing,['component:Cl-'])
 for(const bad of [{...system,excludedSpecies:[waterReactionId]},{...system,enabledPhases:['solid']},{...system,temperature:30}])assert.equal((await auditWetLabRecipes(repo,bad)).available.length,0)
 assert.equal((await auditWetLabRecipes(repo,createWorkspaceSession(repo).chemicalSystem)).available.length,5)
 const e=await createWetLabExperience(repo,{chemicalSystem:withoutCl});assert.equal(e.snapshot().selected.status,'accepted-v0');e.dispose()
})
test('source drift cannot create physical recipe availability',async()=>{
 const drift={...repo,getSpeciesById:id=>{const s=repo.getSpeciesById(id);return id===waterReactionId?{...s,logK:-14}:s}}
 const a=await auditWetLabRecipes(drift,system);assert.equal(a.available.length,0);assert.ok(a.recipes.every(r=>r.reasons.some(s=>s.includes('source changed'))))
})
test('editable sample and burette inputs move accepted equivalence through inventories alone',async()=>{
 const controls=[[setup(),50,100],[setup({volumeMl:25}),25,50],[setup({concentrationMolPerL:.05}),25,75],[setup({}, {concentrationMolPerL:.2}),25,75],[setup({concentrationMolPerL:.2}),100,150]]
 for(const [configuration,v,total] of controls){const e=await createWetLabExperience(repo,{chemicalSystem:system,setup:configuration,revision:8}),s=await e.setVolume(v)
  assert.ok(Math.abs(s.selected.pH-7.00075)<1e-9);assert.equal(s.selected.totalVolumeMl,total)
  assert.ok(Math.abs(s.selected.analyticalMoles.protonEquivalent)<1e-17)
  assert.equal(s.selected.revision,8);assert.equal(s.setupRevision,8);assert.equal(s.systemKey,wetLabSystemKey(system))
  assert.equal(s.selected.equilibrium.inspection.result,s.selected.equilibrium.result);assert.equal(e.reset().selected.totalVolumeMl,configuration.sample.volumeMl);e.dispose()
 }
})
test('reverse orientation is the same validated physical/point path',async()=>{
 const e=await createWetLabExperience(repo,{chemicalSystem:system,setup:setup({reagent:'NaOH'},{reagent:'HCl'})})
 const initial=e.snapshot().selected;assert.ok(initial.pH>12)
 const middle=(await e.setVolume(50)).selected,end=(await e.setVolume(100)).selected
 assert.ok(Math.abs(middle.pH-7.00075)<1e-9);assert.ok(end.pH<2);assert.equal(end.titrant.reagent,'HCl');e.dispose()
})
test('loaded volume controls capacity and sampling; insufficient titrant remains an honest partial experiment',async()=>{
 const e=await createWetLabExperience(repo,{chemicalSystem:system,setup:setup({}, {volumeMl:20})}),s=e.snapshot()
 assert.equal(s.capacityMl,20);assert.equal(s.points.at(-1).x,20);assert.ok(Math.abs(s.sampling.equivalenceMl-50)<1e-12);assert.equal(s.sampling.nearEquivalenceMl,null)
 assert.ok((await e.setVolume(20)).selected.pH<7);await assert.rejects(e.setVolume(20.01),{code:'invalid-volume'});e.dispose()
 const noEstimate=wetLabSampling(prepareWetLabStocks(setup({reagent:'HCl'},{reagent:'HCl',volumeMl:40})))
 assert.equal(noEstimate.equivalenceMl,null);assert.equal(noEstimate.coordinates.length,101);assert.equal(noEstimate.coordinates.at(-1),40)
})
test('all editable numeric fields refuse invalid values and arbitrary recipes',()=>{
 for(const part of ['sample','titrant'])for(const field of ['volumeMl','concentrationMolPerL'])for(const value of ['',-1,0,NaN,Infinity,null,'abc']){
  const d=setup();d[part][field]=value;assert.throws(()=>prepareWetLabStocks(d))
 }
 assert.throws(()=>prepareWetLabStocks(setup({reagent:'acetic-acid'})),{code:'unsupported-reagent'})
})
test('sampling retains dense region at moved equivalence and never determines pH',()=>{
 const s=wetLabSampling(prepareWetLabStocks(setup({volumeMl:25})))
 for(const v of [24.9,24.99,25,25.01,25.1])assert.ok(s.coordinates.includes(v))
 assert.equal(s.nearEquivalenceMl,24.99);assert.equal('pH' in s,false)
})
