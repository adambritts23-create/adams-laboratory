import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {redoxWorkflowExample} from '../src/data/redoxWorkflowExample.js'
import {configureArea,prepareArea,runArea} from '../src/calculations/predominanceArea.js'
import {prepareChemicalSystem} from '../src/solver/models.js'
const repository=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
let prepared

test('vanadium pH/Eh diagram keeps distinct VO(2+) and VO2(+) source species',async()=>{
 const session=redoxWorkflowExample(repository,'V')
 session.calculationDefinition.pourbaix.total=1
 session.calculationDefinition=configureArea(session.calculationDefinition,session.chemicalSystem.selectedComponents.map(id=>repository.getComponentById(id)))
 session.calculationDefinition.independentVariables[0].points=51
 session.calculationDefinition.independentVariables[1].points=21
 prepared=await prepareArea(session,repository)
 assert.ok(prepared.ok,prepared.reason)
 const ions=prepared.system.products.filter(p=>['VO 2+','VO2+'].includes(p.name))
 assert.equal(ions.length,2)
 assert.deepEqual(ions.map(p=>p.charge).sort(),[1,2])
 const result=await runArea(prepared)
 assert.equal(result.grid.counts.requested,1071)
 assert.equal(result.grid.counts.converged,1069)
 assert.equal(result.grid.counts.failed,2)
 assert.ok(result.points.filter(p=>p.solverStatus!=='converged').every(p=>p.status==='gap'&&p.region===null))
 assert.ok(new Set(result.points.map(p=>p.region?.name)).size>5)
})

test('same-charge aliases and duplicate IDs still fail the numerical boundary',async()=>{
 const spec=structuredClone(prepared.system)
 spec.products.push({...spec.products.find(p=>p.name==='VO 2+'),id:'alias-test',name:'VO2+'})
 const result=await prepareChemicalSystem({...spec,basisStatus:'explicit-direct'})
 assert.equal(result.ok,false)
 assert.ok(result.diagnostics.some(d=>d.code==='redundant-basis'))
 const repeated=structuredClone(prepared.system)
 repeated.products.push({...repeated.products[0],name:'different label'})
 assert.equal((await prepareChemicalSystem({...repeated,basisStatus:'explicit-direct'})).ok,false)
})
