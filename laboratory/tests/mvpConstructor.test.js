import test from 'node:test'
import assert from 'node:assert/strict'
import {repo} from '../scripts/validation/nonRedoxPhysicalBenchmark.js'
import {nonRedoxScope} from '../src/thermodynamics/nonRedoxPhysical.js'
import {constructEquilibrium,equilibriumBoundaries,equilibriumConstruction} from '../src/thermodynamics/equilibriumConstructor.js'
import {prepareSessionPoint} from '../src/solver/prepareSession.js'
import {createWorkspaceSession} from '../src/session/laboratorySession.js'
test('MVP boundary contract distinguishes all six reservoir combinations',()=>{
 assert.equal(equilibriumBoundaries.length,6)
 assert.equal(equilibriumBoundaries.filter(b=>b.supported).length,5)
 assert.equal(equilibriumBoundaries.find(b=>b.hydrogen==='derived'&&b.electron==='imposed').supported,true)
})
test('MVP constructor preserves ordinary preparation and refuses unknown adapters',async()=>{
 const session=createWorkspaceSession(repo)
 const a=await prepareSessionPoint(session,repo),b=await constructEquilibrium(repo,{adapter:'ordinary',session})
 assert.deepEqual(b,a)
 if(b.ok)assert.equal(equilibriumConstruction(b).adapter,'ordinary')
 assert.equal((await constructEquilibrium(repo,{adapter:'invented'})).ok,false)
})
test('non-redox structural scope reuse respects immutable repository and exact support',()=>{
 const ids=['component:H%2B','component:CH3COO-','component:H2O'],a=nonRedoxScope(repo,ids)
 assert.equal(a,nonRedoxScope(repo,ids));assert.ok(Object.isFrozen(a))
 assert.notEqual(a,nonRedoxScope(repo,[...ids,'component:Na%2B']))
 const mutable={...repo};assert.notEqual(nonRedoxScope(mutable,ids),nonRedoxScope(mutable,ids))
})
import {calculationConstraints,changeCalculationConstraint} from '../src/calculations/equilibriumConstraints.js'
import {redoxWorkflowExample} from '../src/data/redoxWorkflowExample.js'
import {runCarrierPourbaix} from '../src/experimental/carrierPourbaix.js'
test('boundary UI transitions reset incompatible hydrogen coordinates and never reinterpret electron reagent',()=>{
 const s=createWorkspaceSession(repo),components=s.chemicalSystem.selectedComponents.map(id=>repo.getComponentById(id)),d=s.calculationDefinition
 const derived=changeCalculationConstraint(d,components,'hydrogen','derived');assert.ok(derived)
 assert.equal(calculationConstraints(derived,components).hydrogen,'derived')
 assert.equal(derived.componentConditions.find(c=>c.quantity==='total').value,null)
 assert.equal(changeCalculationConstraint(derived,components,'electron','imposed'),null)
 assert.equal(changeCalculationConstraint(d,components,'electron','derived',{closedAvailable:true}),null)
 const closed=changeCalculationConstraint(derived,components,'electron','derived',{closedAvailable:true});assert.ok(closed.generalClosed)
})
test('selected Cu/chloride source system uses independent total and retains real unavailable samples',async()=>{
 const s=redoxWorkflowExample(repo,'Cu');s.chemicalSystem.selectedComponents.push('component:Cl-')
 Object.assign(s.calculationDefinition.pourbaix,{pH:{min:2,max:10,points:3},Eh:{min:-.5,max:.5,points:3},additionalTotals:{'component:Cl-':.02}})
 const r=await runCarrierPourbaix(s,repo);assert.ok(r.ok,r.reason);assert.equal(r.grid.counts.requested,9)
 assert.equal(r.supportStatus,'experimental-unreviewed');assert.equal(r.discovery.inventoryComplete,false)
 const index=r.system.components.findIndex(c=>c.id==='component:Cl-');assert.ok(index>0)
 for(const o of r.grid.outcomes){assert.equal(o.input.constraints[index].value,.02)}
 assert.equal(r.points.filter(p=>p.status==='gap').length,r.grid.counts.failed)
 assert.ok(r.discovery.databaseSearch.products.length>r.discovery.includedCandidates.length)
})
