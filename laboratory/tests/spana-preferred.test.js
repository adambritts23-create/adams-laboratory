import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {importPsiNagra} from '../src/thermodynamics/importers/psinagra/index.js'
import {combineSpanaPreferred,supportedCombinedRecord} from '../src/thermodynamics/spanaPreferred.js'
import {sourceComponentMetadata} from '../src/thermodynamics/sourceComponentMetadata.js'
import {withUraniumLiterature} from '../src/thermodynamics/uraniumLiterature.js'
import {loadWetLabIons} from '../src/calculations/wetLabIons.js'
import {batchSource,createBatchSample,equilibrateBatch} from '../src/calculations/batchExperiment.js'
import {emptyLibrary,addDatabase,selectDatabaseSources,compileLibrary} from '../src/thermodynamics/databaseLibrary.js'
const path=new URL('../.local/psinagra/psinagra2020_v2-1.dat',import.meta.url)
test('Spana preference preserves primary records and supplements a supported Wet Lab basis',{skip:!fs.existsSync(path)},async()=>{
 const core=JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json',import.meta.url)))
 const primary=withUraniumLiterature({kind:'adams-reaction-database',version:1,data:core}).data
 const psi=await importPsiNagra(fs.readFileSync(path))
 const combined=combineSpanaPreferred(primary,psi.data),base=createRepository(core)
 const lib=addDatabase(base,emptyLibrary(),combined,'Combined','combined')
 const repo=compileLibrary(base,selectDatabaseSources(base,lib,['combined'])).repository
 assert.ok(combined.report.added>100);assert.ok(combined.report.preferred>100)
 for(const s of primary.species.filter(s=>s.metadata?.editor?.supported!==false))assert.deepEqual(repo.getSpeciesById(s.id),s)
 assert.deepEqual(repo.getComponents(),primary.components)
 const supplements=repo.getSpecies().filter(s=>s.metadata?.combined)
 for(const s of supplements)assert.ok(supportedCombinedRecord(s,repo),s.name)
 const rebased=supplements.find(s=>s.metadata.combined.conversions.some(c=>c.component==='HCO3-'))
 assert.ok(rebased);assert.notEqual(rebased.logK,rebased.metadata.combined.original.logK)
 assert.equal(supportedCombinedRecord({...rebased,logK:rebased.logK+1},repo),false)
 assert.equal((await sourceComponentMetadata(repo)).ok,true)
 const ions=await loadWetLabIons(repo)
 assert.ok(ions.analyticalForms.some(f=>f.name==='NH3'))
 const sourceFingerprint=await batchSource(repo)
 const sample=createBatchSample({name:'Mixed database test',volumeMl:100,sourceFingerprint,moles:{'component:Ag%2B':.0001,'component:Cl-':.0001,'component:H%2B':.0001}},repo)
 assert.equal((await equilibrateBatch(sample,repo)).equilibrium.ok,true)
})
