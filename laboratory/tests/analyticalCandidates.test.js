import {selectedSystem} from './helpers/wetLabCalculationParity.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {loadWetLabIons} from '../src/calculations/wetLabIons.js'
import {inspectAnalyticalComponentCandidate,searchAnalyticalComponents} from '../src/calculations/analyticalCandidates.js'
import {inspectAnalyticalSystem} from '../src/calculations/analyticalSystemDiscovery.js'
import {prepareWetLabStocks,analyticalWetLabSetup} from '../src/calculations/wetLabSetup.js'
import {prepareWetLabScope,runTitration} from '../src/calculations/wetLabTitration.js'
import {preflightWetLab} from '../src/calculations/wetLabPreflight.js'
const repository=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json'))),start=performance.now(),catalog=await loadWetLabIons(repository),catalogMs=performance.now()-start
const H='component:H%2B',W='component:H2O',Ca='component:Ca%202%2B',CO3='component:CO3%202-',Cr='component:Cr%203%2B',Cit='component:cit%203-'
test('candidate universe is source components plus existing source-coordinate conveniences, never all products',async()=>{
 assert.ok(catalog.forms.length>166);assert.ok(catalog.candidates.length<200);assert.equal(await loadWetLabIons(repository),catalog)
 for(const c of catalog.forms.filter(f=>f.id.startsWith('component:'))){assert.ok(inspectAnalyticalComponentCandidate(catalog,c.id).selectable);assert.equal(inspectAnalyticalComponentCandidate(catalog,c.id).kind,'HYDRA component')}
 assert.equal(inspectAnalyticalComponentCandidate(catalog,'spana:2ac52a30213c9288:93877').selectable,false)
 assert.equal(inspectAnalyticalComponentCandidate(catalog,'component:e-').selectable,false)
})
test('source descriptions, element names and typographic formulas resolve exact source IDs without salts',()=>{
 for(const [query,id] of [['calcium',Ca],['Ca',Ca],['Ca2+',Ca],['carbonate',CO3],['CO3',CO3],['H+',H],['OH-','spana:2ac52a30213c9288:250448'],['acetate','component:CH3COO-'],['acetic acid','spana:2ac52a30213c9288:79298'],['borate','spana:2ac52a30213c9288:37016'],['cit3-',Cit],['Cr³⁺',Cr]])assert.ok(searchAnalyticalComponents(catalog,query).items.some(c=>c.id===id),query)
 assert.equal(searchAnalyticalComponents(catalog,'CaCl2').total,0);assert.equal(searchAnalyticalComponents(catalog,'HCl').total,0)
 assert.deepEqual(inspectAnalyticalComponentCandidate(catalog,Ca).coefficients,{[Ca]:1})
})
test('search operates on immutable data alone, bounded results, zero source queries or equilibrium input',()=>{
 const dataOnly=JSON.parse(JSON.stringify({candidates:catalog.candidates})),start=performance.now();for(let i=0;i<1000;i++)assert.ok(searchAnalyticalComponents(dataOnly,['Ca','H+','acetate',''][i%4]).items.length<=20)
 console.log(JSON.stringify({candidateCount:catalog.candidates.length,catalogMs,search1000Ms:performance.now()-start}));assert.equal(searchAnalyticalComponents(catalog,'',{limit:10000}).items.length,50)
})
test('Ca carbonate discovers real connected redox and calcite candidates, not a calcium approval refusal',async()=>{
 const selected=[H,W,Ca,CO3],d=inspectAnalyticalSystem(repository,selected);assert.equal(d,inspectAnalyticalSystem(repository,[...selected].reverse()));assert.ok(d.connectedRedox.length);assert.ok(d.solidCandidates.some(s=>/CaCO3/.test(s.name)));assert.ok(d.gasCandidates.length)
 const s=structuredClone(analyticalWetLabSetup);s.sample.contributions[0].sourceId=Ca;s.titrant.contributions[0].sourceId=CO3
 const p=await preflightWetLab(repository,s,selectedSystem(repository,[Ca,CO3]),0,catalog);assert.equal(p.status,'CONDITIONAL');assert.ok(!p.discovery)
 fs.writeFileSync('.local/component-discovery/calcium-carbonate.json',JSON.stringify(d,null,2))
})
test('Cr is a legitimate source input with mechanically derived redox capability',()=>{
 const c=inspectAnalyticalComponentCandidate(catalog,Cr);assert.equal(c.selectable,true);assert.equal(c.capabilities.connectedRedox,true);assert.match(c.currentLimit,/deferred/);assert.ok(inspectAnalyticalSystem(repository,[H,W,Cr]).connectedRedox.length)
})
test('citrate source charge is sufficient without optional atoms; accepted doses retain citrate inventory',async()=>{
 const c=inspectAnalyticalComponentCandidate(catalog,Cit);assert.equal(c.selectable,true);assert.equal(c.charge,-3);assert.equal(c.elementalMetadata,'optional / unavailable')
 const setup=structuredClone(analyticalWetLabSetup);setup.sample.contributions[0].sourceId=Cit
 const stocks=prepareWetLabStocks(setup,0,catalog),ctx=await prepareWetLabScope(repository,stocks,selectedSystem(repository,[Cit]),0),series=await runTitration(ctx,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,revision:0,additionVolumesMl:[0,25,50,100]})
 for(const state of series.states){assert.equal(state.status,'accepted-v0',JSON.stringify(state.diagnostics));const r=state.equilibrium.result;assert.equal(r.scientificValidation,'passed');assert.ok(r.speciesIds.includes(Cit));assert.ok(!r.speciesIds.includes('component:Na%2B'));assert.ok(!r.speciesIds.includes('component:Cl-'));assert.equal(state.analyticalMoles[Cit],.005)}
 fs.writeFileSync('.local/component-discovery/citrate.json',JSON.stringify(series.states.map(s=>({dose:s.titrantVolumeAddedMl,pH:s.pH,ids:s.equilibrium.result.speciesIds,residuals:s.equilibrium.result.residuals})),null,2))
})

test('browse catalogue exposes source products while analytical eligibility stays separate',()=>{
 const ids=new Set(catalog.browseForms.map(f=>f.id))
 for(const r of repository.getSpecies().filter(r=>r.role!=='solvent'))assert.ok(ids.has(r.id),r.name)
 const id='spana:2ac52a30213c9288:212927'
 assert.equal(catalog.forms.find(f=>f.id===id).name,'MnO4-')
 assert.equal(catalog.entries[id].charge,-1)
 assert.equal(inspectAnalyticalComponentCandidate(catalog,id).selectable,false)
 assert.equal(repository.getSpeciesById(id).logK,-122.5)
})
