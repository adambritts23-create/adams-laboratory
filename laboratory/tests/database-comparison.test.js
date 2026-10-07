import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {emptyLibrary,addDatabase} from '../src/thermodynamics/databaseLibrary.js'
import {importPsiNagra,PSI_ID} from '../src/thermodynamics/importers/psinagra/index.js'
import {createCalculationDefinition} from '../src/calculations/definition.js'
import {selectedSystem} from './helpers/wetLabCalculationParity.js'
import {runDatabaseComparison,comparisonSession,reactionDifferences} from '../src/calculations/databaseComparison.js'
import {deriveOutputs} from '../src/calculations/outputs.js'
const path=new URL('../.local/psinagra/psinagra2020_v2-1.dat',import.meta.url)
test('independent database overlays preserve totals and isolate source runs',{skip:!fs.existsSync(path)},async()=>{
 const base=createRepository(JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json',import.meta.url))))
 const psi=await importPsiNagra(fs.readFileSync(path)),target=createRepository(psi.data)
 const chemical=selectedSystem(base,['component:UO2%202%2B','component:NH3','component:CO3%202-'],['aqueous','liquid'])
 const d=createCalculationDefinition(chemical,base)
 d.componentConditions=d.componentConditions.filter(c=>c.componentId!=='component:H%2B').map(c=>({...c,value:c.componentId==='component:H2O'?0:.001}))
 d.independentVariables=[{componentId:'component:H%2B',mode:'LAV',quantity:'pH',unit:'dimensionless',range:{min:3,max:7},points:5}]
 const session={chemicalSystem:chemical,calculationDefinition:d,revision:1}
 const mapped=comparisonSession(session,base,target)
 assert.ok(mapped.mappings.some(m=>m.from==='NH3'&&m.to==='NH4+'))
 assert.ok(mapped.mappings.some(m=>m.from==='CO3 2-'&&m.to==='HCO3-'))
 assert.deepEqual(mapped.snapshot.calculationDefinition.componentConditions.map(c=>c.value),d.componentConditions.map(c=>c.value))
 const lib=addDatabase(base,emptyLibrary(),psi,'PSI',PSI_ID),before=JSON.stringify({lib,session})
 const result=await runDatabaseComparison({base,library:lib,source:base,session,collectionIds:['base',PSI_ID]})
 assert.equal(JSON.stringify({lib,session}),before)
 for(const r of result.runs){assert.equal(r.sweep.counts.converged,5);assert.equal(r.derived.ok,true);const fractions=deriveOutputs(r.system,r.sweep,{type:'total-fraction',componentId:r.componentIds['component:UO2%202%2B']},{currentRevision:1});assert.equal(fractions.ok,true);for(let i=0;i<5;i++)assert.ok(Math.abs(fractions.series.reduce((sum,s)=>sum+(s.points[i].value??0),0)-1)<1e-6)}
 assert.deepEqual(result.runs[0].sweep.coordinates,result.runs[1].sweep.coordinates)
 assert.notDeepEqual(result.runs[0].sweep.sourceIdentity,result.runs[1].sweep.sourceIdentity)
 assert.ok(result.differences.length>0)
 const invalid=structuredClone(session);invalid.calculationDefinition.independentVariables[0].quantity='total'
 assert.throws(()=>comparisonSession(invalid,base,target),/imposed-pH/)
 const free=structuredClone(session);free.calculationDefinition.componentConditions.find(c=>c.componentId==='component:NH3').mode='LA'
 assert.throws(()=>comparisonSession(free,base,target),/compatible component/)
})
test('reaction comparison distinguishes constants from incompatible bases',()=>{
 const record=(name,k,component)=>({name,phase:'aqueous',charge:0,logK:k,metadata:{effectiveSourceReaction:{components:[{name:component,coefficient:1}]}}})
 assert.equal(reactionDifferences([record('X',1,'A')],[record('X',2,'A')])[0].status,'Different log K')
 assert.equal(reactionDifferences([record('X',1,'A')],[record('X',2,'B')])[0].status,'Different reaction basis')
 assert.equal(reactionDifferences([record('X',1,'A')],[record('X',1,'A')]).length,0)
})
