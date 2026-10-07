import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {importPsiNagra} from '../src/thermodynamics/importers/psinagra/index.js'
import {createRepository} from '../src/thermodynamics/repository.js'
import {selectedSystem} from './helpers/wetLabCalculationParity.js'
import {createCalculationDefinition} from '../src/calculations/definition.js'
import {constructEquilibrium} from '../src/thermodynamics/equilibriumConstructor.js'
import {withUraniumLiterature,AUC_CONDITIONAL_LOG_KSP} from '../src/thermodynamics/uraniumLiterature.js'
import {solvePoint} from '../src/solver/point.js'
const path=new URL('../.local/psinagra/psinagra2020_v2-1.dat',import.meta.url)
test('PSI ammonium-carbonate-uranyl sweep retains accepted points beyond pH 3',{skip:!fs.existsSync(path)},async()=>{
 const doc=await importPsiNagra(fs.readFileSync(path)),repo=createRepository(withUraniumLiterature(doc).data)
 const chemical=selectedSystem(repo,['component:NH4%2B','component:HCO3-','component:UO2%202%2B'])
 assert.ok(chemical.selectedSpecies.includes('literature:uranium:auc'))
 assert.ok(Math.abs(repo.getSpeciesById('literature:uranium:auc').logK-(-9.1401-AUC_CONDITIONAL_LOG_KSP))<1e-12)
 const d=createCalculationDefinition(chemical,repo)
 for(let i=0;i<=50;i++){
  const pH=14*i/50
  d.componentConditions=d.componentConditions.map(c=>({...c,value:c.componentId==='component:H%2B'?pH:c.componentId==='component:H2O'?0:1}))
  const p=await constructEquilibrium(repo,{adapter:'ordinary',session:{chemicalSystem:chemical,calculationDefinition:d,revision:1}})
  assert.equal(p.ok,true,JSON.stringify(p.diagnostics))
  const r=solvePoint(p.system,p.input)
  assert.equal(r.ok,true,JSON.stringify({pH,diagnostics:r.diagnostics,attempts:r.attempts}))
 }
})
