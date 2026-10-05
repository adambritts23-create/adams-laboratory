import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {redoxWorkflowExample} from '../src/data/redoxWorkflowExample.js'
import {configureArea,prepareArea,runArea,predominantSpecies,configureEhPhArea} from '../src/calculations/predominanceArea.js'
// Rules traced to retained Predom.java findTopSpecies, lines 2431–2475.
const carriers=[{id:'dissolved',phase:'aqueous',coefficient:1,amount:.8},{id:'solid',phase:'solid',coefficient:2,amount:.1}]
test('Spana phase priority differs deliberately from largest total inventory',()=>{
 assert.equal(predominantSpecies(carriers,1,'solid-first')[0].id,'solid')
 assert.equal(predominantSpecies(carriers,1,'largest-inventory')[0].id,'dissolved')
 assert.equal(predominantSpecies(carriers,1,'aqueous-only')[0].id,'dissolved')
 assert.equal(predominantSpecies([carriers[0],{...carriers[1],amount:0}],.8)[0].id,'dissolved')
})
test('stoichiometry weights dissolved species and solid ties are order independent',()=>{
 const rows=[{id:'one',phase:'aqueous',coefficient:1,amount:.4},{id:'two',phase:'aqueous',coefficient:2,amount:.3}]
 assert.equal(predominantSpecies(rows,1)[0].id,'two')
 const solids=[{id:'a',phase:'solid',coefficient:1,amount:.5},{id:'b',phase:'solid',coefficient:2,amount:.25}]
 assert.deepEqual(predominantSpecies(solids,1).map(x=>x.id).sort(),predominantSpecies([...solids].reverse(),1).map(x=>x.id).sort())
 assert.equal(predominantSpecies(solids,1).length,2)
})
const repository=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json','utf8')))
for(const label of ['Fe','Cr'])test(`${label}: ordinary Eh-pH defaults to species regions, including without oxidation metadata`,async()=>{
 const session=redoxWorkflowExample(repository,label)
 session.calculationDefinition=configureArea(session.calculationDefinition,session.chemicalSystem.selectedComponents.map(id=>repository.getComponentById(id)))
 assert.equal(session.calculationDefinition.predominanceArea.interpretation,'carrier')
 assert.equal(session.calculationDefinition.predominanceArea.phasePolicy,'solid-first')
 session.calculationDefinition.independentVariables.forEach(a=>a.points=3)
 const prepared=await prepareArea(session,repository)
 assert.ok(prepared.ok,prepared.reason)
 assert.equal(prepared.interpretation,'carrier')
 if(label==='Cr')assert.equal(prepared.model,null)
 const result=await runArea(prepared)
 assert.equal(result.grid.counts.converged,9)
 assert.ok(result.points.some(p=>p.region))
 assert.ok(result.points.every(p=>!p.region?.id.startsWith('oxidation:')))
})

test('pH–Eh shortcut preserves fixed material totals and does not invent a removed total',()=>{
 const s=redoxWorkflowExample(repository,'Fe'),components=s.chemicalSystem.selectedComponents.map(id=>repository.getComponentById(id))
 const d=configureArea(s.calculationDefinition,components),next=configureEhPhArea(d,components)
 assert.deepEqual(next.independentVariables.map(a=>a.quantity),['pH','Eh'])
 assert.ok(next.independentVariables.every(a=>a.mode==='LAV'))
 const material=components.find(c=>c.role==='basis-choice')
 assert.deepEqual(next.componentConditions.find(c=>c.componentId===material.id),d.componentConditions.find(c=>c.componentId===material.id))
 d.componentConditions=d.componentConditions.filter(c=>c.componentId!==material.id)
 assert.equal(configureEhPhArea(d,components).componentConditions.find(c=>c.componentId===material.id).value,null)
})
