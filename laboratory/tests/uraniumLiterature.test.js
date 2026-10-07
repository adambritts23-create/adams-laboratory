import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {AUC_CONDITIONAL_LOG_KSP,uraniumLiteratureRecords,withUraniumLiterature,supportedLiteratureRecord,updateUraniumTrials} from '../src/thermodynamics/uraniumLiterature.js'
import {importPsiNagra,PSI_ID} from '../src/thermodynamics/importers/psinagra/index.js'
import {balance,emptyLibrary,addDatabase,selectDatabaseSources,compileLibrary} from '../src/thermodynamics/databaseLibrary.js'
import {createRepository} from '../src/thermodynamics/repository.js'
import {loadWetLabIons} from '../src/calculations/wetLabIons.js'
import {analyticalWetLabSetup,prepareWetLabStocks} from '../src/calculations/wetLabSetup.js'
import {prepareWetLabScope,runTitration} from '../src/calculations/wetLabTitration.js'
import {selectedSystem,compareDose} from './helpers/wetLabCalculationParity.js'
import {constructEquilibrium} from '../src/thermodynamics/equilibriumConstructor.js'
import {createCalculationDefinition} from '../src/calculations/definition.js'
import {solvePoint} from '../src/solver/point.js'
import {repositoryFromSnapshot} from '../src/thermodynamics/snapshot.js'
import {sourceComponentMetadata} from '../src/thermodynamics/sourceComponentMetadata.js'

test('literature reactions balance and use the stated direction and selected water basis',()=>{
 const records=uraniumLiteratureRecords(-14.0013)
 for(const s of records){const b=balance(s.formula,s.charge,s.metadata.effectiveSourceReaction.components);assert.equal(b.atoms,'balanced',s.name);assert.equal(b.charge,'balanced',s.name)}
 assert.equal(records.find(s=>s.sourceRecordId==='studtite').logK,2.7)
 assert.equal(records.find(s=>s.sourceRecordId==='mono-peroxo').logK,28.1-4*14.0013)
 assert.equal(records.find(s=>s.sourceRecordId==='di-peroxo').logK,36.8-6*14.0013)
 assert.equal(records.find(s=>s.sourceRecordId==='hydroperoxide').logK,-11.6)
 assert.equal(records.filter(s=>s.logK===null).length,4)
 assert.equal(records[4].logK,-AUC_CONDITIONAL_LOG_KSP)
 assert.equal(records[4].provenance.literatureOriginal.logK,null) // Source reports solubility, not log K.
 assert.equal(records[4].metadata.literature.estimatedConditionalLogKsp,AUC_CONDITIONAL_LOG_KSP)
 const trial=uraniumLiteratureRecords(-14.0013,{auc:20})[4]
 assert.equal(trial.logK,20);assert.equal(trial.provenance.original.logK,20);assert.equal(trial.provenance.literatureOriginal.logK,null)
 assert.ok(trial.qualityFlags.includes('experimental-user-constant'))
 assert.throws(()=>uraniumLiteratureRecords(-14,{auc:NaN}),/finite/)
})

test('Spana extension translates AUC and ADU into its own basis and supports Wet Lab',async()=>{
 const base=repositoryFromSnapshot(JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json',import.meta.url))))
 const data={species:base.getSpecies(),components:base.getComponents(),sources:base.getSources(),elements:base.getElements()}
 const doc=withUraniumLiterature({kind:'adams-reaction-database',version:1,data}),layer='spana-literature-test'
 assert.equal(doc.data.species.length,data.species.length+8) // Spana already supplies HO2-.
 assert.deepEqual(doc.data.species.slice(0,data.species.length),data.species)
 let lib=selectDatabaseSources(base,addDatabase(base,emptyLibrary(),doc,'Spana extension',layer),[layer])
 lib=updateUraniumTrials(lib,layer,{auc:20,'adu-nominal':10})
 const repo=compileLibrary(base,lib).repository
 for(const id of ['auc','adu-nominal','studtite'])assert.ok(supportedLiteratureRecord(repo.getSpeciesById('literature:uranium:'+id),repo),id)
 const terms=repo.getSpeciesById('literature:uranium:auc').metadata.effectiveSourceReaction.components
 assert.ok(terms.some(t=>t.name==='NH3'&&t.coefficient===4))
 assert.ok(terms.some(t=>t.name==='CO3 2-'&&t.coefficient===3))
 assert.equal((await sourceComponentMetadata(repo)).ok,true)
 const cat=await loadWetLabIons(repo)
 assert.ok(cat.analyticalForms.some(f=>f.id==='feed:UF6-hydrolysed'))
 const setup=structuredClone(analyticalWetLabSetup)
 setup.sample.contributions=[{...setup.sample.contributions[0],sourceId:'feed:UF6-hydrolysed',concentrationMolPerL:.001}]
 setup.titrant.contributions[0].sourceId=cat.analyticalForms.find(r=>r.name==='OH-').id
 const stocks=prepareWetLabStocks(setup,1,cat),chemical=selectedSystem(repo,['component:UO2%202%2B','component:F-'],['aqueous','liquid'])
 const context=await prepareWetLabScope(repo,stocks,chemical,1)
 const series=await runTitration(context,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,revision:1,additionVolumesMl:[0,1]})
 for(const state of series.states){assert.equal(state.status,'accepted-v0',JSON.stringify(state.diagnostics));await compareDose(repo,chemical,state)}
})

const path=new URL('../.local/psinagra/psinagra2020_v2-1.dat',import.meta.url)
test('PSI plus literature supports Calculation, Wet Lab and experimental constants',{skip:!fs.existsSync(path)},async t=>{
 const core=await importPsiNagra(fs.readFileSync(path)),base=createRepository(core.data),doc=withUraniumLiterature(core)
 let lib=selectDatabaseSources(base,addDatabase(base,emptyLibrary(),doc,'PSI plus literature',PSI_ID),[PSI_ID])
 const repo=compileLibrary(base,lib).repository,cat=await loadWetLabIons(repo)
 await t.test('unverified constants stay absent until supplied and tampered records are rejected',()=>{
  assert.ok(repo.getSpeciesById('literature:uranium:auc').qualityFlags.includes('provisional-solubility-estimate'))
  for(const s of repo.getSpecies().filter(s=>s.id.startsWith('literature:'))){assert.ok(supportedLiteratureRecord(s,repo),s.name);s.logK++;assert.equal(supportedLiteratureRecord(s,repo),false)}
  const next=updateUraniumTrials(lib,PSI_ID,{auc:20}),trialRepo=compileLibrary(base,next).repository
  assert.ok(supportedLiteratureRecord(trialRepo.getSpeciesById('literature:uranium:auc'),trialRepo))
  assert.equal(compileLibrary(base,updateUraniumTrials(next,PSI_ID,{})).repository.getSpeciesById('literature:uranium:auc').logK,repo.getSpeciesById('literature:uranium:auc').logK)
 })
 await t.test('AUC responds to reagent excess and obeys its provisional mass-action equation',async()=>{
  const chemical=selectedSystem(repo,['component:UO2%202%2B','component:NH4%2B','component:HCO3-'])
  const d=createCalculationDefinition(chemical,repo)
  d.componentConditions=d.componentConditions.map(c=>({...c,value:c.componentId==='component:H%2B'?7.84:c.componentId==='component:H2O'?0:c.componentId==='component:UO2%202%2B'?1:10}))
  const p=await constructEquilibrium(repo,{adapter:'ordinary',session:{chemicalSystem:chemical,calculationDefinition:d,revision:1}})
  assert.equal(p.ok,true)
  const r=solvePoint(p.system,p.input);assert.equal(r.ok,true,JSON.stringify(r.diagnostics))
  const solid=r.solids.find(s=>s.id==='literature:uranium:auc')
  assert.ok(solid?.amount>.998&&solid.amount<1,JSON.stringify(r.solids))
  const loga=name=>r.logActivities[p.system.components.findIndex(c=>c.name===name)]
  assert.ok(Math.abs(4*loga('NH4+')+loga('UO2 2+')+3*loga('HCO3-')-3*loga('H+')+repo.getSpeciesById('literature:uranium:auc').logK)<1e-7)
 })
 await t.test('studtite precipitates with balanced U/peroxide inventories and its dissolution law',async()=>{
  const ids=['component:UO2%202%2B','component:H2O2'],chemical=selectedSystem(repo,ids)
  // Isolate the literature phase for an independent solubility-law check.
  chemical.selectedSpecies=chemical.selectedSpecies.filter(id=>repo.getSpeciesById(id)?.phase!=='solid'||id==='literature:uranium:studtite')
  chemical.solidPhasePolicy='manual'
  const d=createCalculationDefinition(chemical,repo)
  d.componentConditions=d.componentConditions.map(c=>({...c,value:c.componentId==='component:H%2B'?3:c.componentId==='component:H2O'?0:.001}))
  const p=await constructEquilibrium(repo,{adapter:'ordinary',session:{chemicalSystem:chemical,calculationDefinition:d,revision:1}})
  assert.equal(p.ok,true,JSON.stringify(p.diagnostics))
  const r=solvePoint(p.system,p.input);assert.equal(r.ok,true,JSON.stringify(r.diagnostics))
  const u=r.logActivities[p.system.components.findIndex(c=>c.id===ids[0])],peroxide=r.logActivities[p.system.components.findIndex(c=>c.id===ids[1])]
  assert.ok(Math.abs(u+peroxide+6+2.7)<1e-6,JSON.stringify({u,peroxide,solids:r.solids}))
  assert.ok(r.solids.some(s=>s.amount>0),JSON.stringify(r.solids))
 })
 await t.test('UF6 feed transports 1 U, 6 F, 4 proton equivalents and agrees with Calculation',async()=>{
  const setup=structuredClone(analyticalWetLabSetup)
  setup.sample.contributions=[{...setup.sample.contributions[0],sourceId:'feed:UF6-hydrolysed',concentrationMolPerL:.001}]
  setup.titrant.contributions[0].sourceId=cat.analyticalForms.find(r=>r.name==='OH-').id
  const stocks=prepareWetLabStocks(setup,1,cat),U='component:UO2%202%2B',F='component:F-'
  assert.equal(stocks.sample.moles[U],.00005);assert.ok(Math.abs(stocks.sample.moles[F]-.0003)<1e-15)
  const chemical=selectedSystem(repo,[U,F],['aqueous','liquid'])
  const context=await prepareWetLabScope(repo,stocks,chemical,1)
  const series=await runTitration(context,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,revision:1,additionVolumesMl:[0,1]})
  for(const state of series.states){assert.equal(state.status,'accepted-v0',JSON.stringify(state.diagnostics));await compareDose(repo,chemical,state)}
 })
})
