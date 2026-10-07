import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {formationFromPhreeqc,importPsiNagra,supportedPsiRecord,PSI_ID,PSI_SHA256} from '../src/thermodynamics/importers/psinagra/index.js'
import {createRepository} from '../src/thermodynamics/repository.js'
import {emptyLibrary,addDatabase,selectDatabaseSources,compileLibrary} from '../src/thermodynamics/databaseLibrary.js'
import {loadWetLabIons} from '../src/calculations/wetLabIons.js'
import {analyticalWetLabSetup,prepareWetLabStocks} from '../src/calculations/wetLabSetup.js'
import {prepareWetLabScope,runTitration} from '../src/calculations/wetLabTitration.js'
import {mixSolutions} from '../src/calculations/wetLabSolutions.js'
import {selectedSystem,compareDose} from './helpers/wetLabCalculationParity.js'

test('PHREEQC parsing distinguishes positive ions from addition signs and reverses dissolution',()=>{
 const water=formationFromPhreeqc('H2O = OH- + H+',-14)
 assert.equal(water.logK,-14);assert.deepEqual(water.components,[{name:'H2O',coefficient:1},{name:'H+',coefficient:-1}])
 const hydrolysis=formationFromPhreeqc('UO2+2 + H2O = UO2OH+ + H+',-5)
 assert.equal(hydrolysis.name,'UO2OH+');assert.deepEqual(hydrolysis.components,[{name:'UO2 2+',coefficient:1},{name:'H2O',coefficient:1},{name:'H+',coefficient:-1}])
 const mineral=formationFromPhreeqc('CaF2 = Ca+2 + 2 F-',-10,'Fluorite')
 assert.equal(mineral.logK,10);assert.equal(mineral.name,'Fluorite(s)');assert.deepEqual(mineral.components,[{name:'Ca 2+',coefficient:1},{name:'F-',coefficient:2}])
})
test('unrecognized source file is rejected, never imported as another version',async()=>{
 await assert.rejects(importPsiNagra(new TextEncoder().encode('SOLUTION_SPECIES\nH2O = OH- + H+\n-log_k -14')),/checksum/)
})

const path=new URL('../.local/psinagra/psinagra2020_v2-1.dat',import.meta.url)
const available=fs.existsSync(path)
test('official local PSI/Nagra import and calculation integration',{skip:!available},async t=>{
 const doc=await importPsiNagra(fs.readFileSync(path)),repo=createRepository(doc.data),cat=await loadWetLabIons(repo)
 await t.test('every admitted reaction balances; organic and unsupported records are accounted for',()=>{
  assert.equal(doc.report.totalReactions,1393);assert.equal(doc.report.imported,1155);assert.equal(doc.report.identities,55);assert.equal(doc.report.excludedOrganic,123);assert.equal(doc.report.rejected.length,60)
  assert.equal(doc.report.imported+doc.report.identities+doc.report.excludedOrganic+doc.report.rejected.length,doc.report.totalReactions)
  for(const s of repo.getSpecies().filter(s=>s.role!=='solvent')){assert.equal(supportedPsiRecord(s),true,s.name);assert.equal(/Cit|Edta|Isa|Oxa|CH4/.test(s.name),false)}
  const altered=repo.getSpecies().find(s=>s.name==='OH-');altered.logK+=1;assert.equal(supportedPsiRecord(altered),false)
  assert.equal(doc.report.sha256,PSI_SHA256)
 })
 await t.test('carbonate substitution carries its equilibrium constant into uranyl complex formation',()=>{
  const calcite=repo.getSpecies().find(s=>s.name==='UO2(CO3)3 4-')
  assert.ok(calcite.metadata.psi.expansion.some(b=>b.name==='CO3 2-'))
  assert.ok(calcite.metadata.effectiveSourceReaction.components.some(t=>t.name==='HCO3-'))
  assert.equal(calcite.metadata.effectiveSourceReaction.components.some(t=>t.name==='CO3 2-'),false)
  const raw=calcite.provenance.original.logK,carbonate=calcite.metadata.psi.expansion.find(b=>b.name==='CO3 2-')
  assert.ok(Math.abs(calcite.logK-(raw+3*carbonate.logK))<1e-10)
 })
 await t.test('switching isolates component registries and leaves the original database intact',()=>{
  const base=createRepository(JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json',import.meta.url))))
  let lib=addDatabase(base,emptyLibrary(),doc,'PSI/Nagra',PSI_ID)
  lib=selectDatabaseSources(base,lib,[PSI_ID]);const active=compileLibrary(base,lib).repository
  assert.deepEqual(active.getComponents(),repo.getComponents());assert.equal(active.getSpecies().some(s=>s.metadata.sourceFormat==='spana-java-binary'),false)
  assert.equal(base.getSpecies().length,4445)
  const restored=compileLibrary(base,selectDatabaseSources(base,lib,['base'])).repository
  assert.deepEqual(restored.getComponents(),base.getComponents());assert.equal(restored.getSpecies().some(s=>s.sourceDatabase===PSI_ID),false)
 })
 await t.test('acid/base Wet Lab uses PSI water equilibrium and agrees with Calculation at each dose',async()=>{
  const setup=structuredClone(analyticalWetLabSetup);setup.titrant.contributions[0].sourceId=cat.analyticalForms.find(r=>r.name==='OH-').id
  const stocks=prepareWetLabStocks(setup,1,cat),chemical=selectedSystem(repo,[],['aqueous','liquid'])
  const context=await prepareWetLabScope(repo,stocks,chemical,1)
  const series=await runTitration(context,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,revision:1,additionVolumesMl:[0,25,50,75,100]})
  const pKw=-repo.getSpecies().find(s=>s.name==='OH-').logK
  for(const state of series.states){
   assert.equal(state.status,'accepted-v0');assert.equal(state.mixture.sourceFingerprint,cat.sourceFingerprint)
   await compareDose(repo,chemical,state)
   const net=(.005-.0001*state.titrantVolumeAddedMl)/(state.totalVolumeMl/1000),kw=10**-pKw
   const h=net>=0?(net+Math.sqrt(net*net+4*kw))/2:2*kw/(Math.sqrt(net*net+4*kw)-net)
   assert.ok(Math.abs(state.pH+Math.log10(h))<1e-7)
  }
  assert.equal(series.states[2].pH,7.00065)
  const base=createRepository(JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json',import.meta.url))))
  const old=prepareWetLabStocks(analyticalWetLabSetup,1,await loadWetLabIons(base))
  assert.throws(()=>mixSolutions(stocks.sample,old.sample),/different databases/)
 })
})
