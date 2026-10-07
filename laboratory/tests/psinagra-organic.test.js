import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {importPsiNagra,supportedPsiRecord} from '../src/thermodynamics/importers/psinagra/index.js'
import {createRepository} from '../src/thermodynamics/repository.js'
import {sourceComponentMetadata} from '../src/thermodynamics/sourceComponentMetadata.js'
import {selectedSystem} from './helpers/wetLabCalculationParity.js'
import {createCalculationDefinition} from '../src/calculations/definition.js'
import {constructEquilibrium} from '../src/thermodynamics/equilibriumConstructor.js'
import {solvePoint} from '../src/solver/point.js'
import {loadWetLabIons} from '../src/calculations/wetLabIons.js'

const path=new URL('../.local/psinagra/psinagra2020_v2-1.dat',import.meta.url)
test('organic PSI collection retains native data and solves uranyl ligand systems',{skip:!fs.existsSync(path)},async()=>{
 const bytes=fs.readFileSync(path),core=await importPsiNagra(bytes),doc=await importPsiNagra(bytes,{includeOrganic:true})
 const repo=createRepository(doc.data)
 assert.equal(doc.report.imported-core.report.imported,104)
 for(const original of core.data.species){const actual=repo.getSpeciesById(original.id);assert.equal(actual.logK,original.logK);assert.deepEqual(actual.provenance,original.provenance);assert.deepEqual(actual.metadata.effectiveSourceReaction,original.metadata.effectiveSourceReaction)}
 for(const s of doc.data.species.filter(s=>s.role!=='solvent'))assert.ok(supportedPsiRecord(s),s.name)
 assert.equal((await sourceComponentMetadata(repo)).ok,true)
 const cat=await loadWetLabIons(repo)
 for(const ligand of ['(C6H5O7) 3-','(C2O4) 2-','(C10H12N2O8) 4-']){
  const id=`component:${encodeURIComponent(ligand)}`
  assert.ok(cat.analyticalForms.some(f=>f.name===ligand),ligand)
  const chemical=selectedSystem(repo,['component:UO2%202%2B',id],['aqueous','liquid'])
  const d=createCalculationDefinition(chemical,repo)
  d.componentConditions=d.componentConditions.map(c=>({...c,value:c.componentId==='component:H%2B'?5.3:c.componentId==='component:H2O'?0:c.componentId===id?0.01:0.001}))
  const p=await constructEquilibrium(repo,{adapter:'ordinary',session:{chemicalSystem:chemical,calculationDefinition:d,revision:1}})
  assert.equal(p.ok,true,JSON.stringify(p.diagnostics))
  assert.ok(p.system.products.some(s=>s.name?.includes('UO2')&&s.name.includes(ligand.split(')')[0].slice(1))),ligand)
  const r=solvePoint(p.system,p.input)
  assert.equal(r.ok,true,JSON.stringify(r.diagnostics))
 }
})
