import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {benchmark,repo,ids,common,requestFor,contribution} from '../scripts/validation/nonRedoxPhysicalBenchmark.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork} from '../src/thermodynamics/equilibriumNetwork.js'
import {componentBalanceTolerance,numericalValidationContract as tolerance} from '../src/solver/validationContract.js'
import {acetateReference} from '../scripts/validation/acetateReference.js'
const states=await benchmark()
test('six independent physical mixtures reproduce all saved source-law carriers and derived pH',()=>{
 for(const {evidence:e,result,compiled} of states){
  assert.ok(Math.abs(e.pHError)<1e-9)
  for(const c of e.carriers){assert.ok(Number.isFinite(c.expected),c.name);assert.ok(c.absoluteError<=tolerance.comparisonAbsoluteConcentrationTolerance+tolerance.comparisonRelativeConcentrationTolerance*Math.abs(c.expected),c.name);assert.ok(c.logError<1e-9,c.name)}
  const smallest=Math.min(...e.balances.map(b=>Math.abs(b.expected)).filter(n=>n>0))
  for(const b of e.balances)assert.ok(Math.abs(b.residual)<=componentBalanceTolerance(b.expected,smallest))
  assert.ok(e.massAction.every(r=>Math.abs(r.residual)<tolerance.massActionLogResidualTolerance));assert.ok(result.charge.ok)
  assert.equal(result.notDetermined.Eh.status,'not-determined');assert.equal(result.notDetermined.pe.status,'not-determined');assert.ok(!Object.hasOwn(result.derived,'Eh'));assert.ok(!Object.hasOwn(result.derived,'pe'))
  assert.ok(!compiled.preparedSystemInput.system.components.some(c=>c.role==='electron'));assert.equal(result.boundary,'closed-physical-nonredox');assert.equal(result.status,'CONDITIONAL')
 }
})
test('nonnegative physical NaOH remains distinct from signed internal proton coordinates',()=>{
 const {compiled,result}=states.at(-1),physical=compiled.physicalPreparation
 assert.equal(physical.contributions.find(r=>r.id==='sodium-hydroxide').moles,.01)
 assert.ok(physical.contributions.every(r=>r.moles>=0));assert.equal(physical.charge.netCharge,0)
 assert.ok(Math.abs(compiled.solverCoordinates.componentMoles[ids.H]+.009)<1e-17)
 assert.equal(compiled.solverCoordinates.componentMoles[ids.Na],.01)
 assert.equal(physical.contributions.find(r=>r.id==='sodium-hydroxide').componentMoles[ids.W],.01)
 assert.equal(result.physicalPreparation,physical)
 assert.equal(states[0].compiled.inspection.selectedIds.includes(ids.Na),false)
})
test('one cross-family complex and 2/3/4-boron oligomers retain exact shared stoichiometry',()=>{
 for(const {compiled,result} of states){const s=compiled.preparedSystemInput.system,a=s.componentIndex[ids.A],b=s.componentIndex[ids.B],cross=s.products.find(p=>p.id==='spana:2ac52a30213c9288:36848')
  assert.equal(cross.coefficients[a],1);assert.equal(cross.coefficients[b],1);assert.equal(s.products.filter(p=>p.id===cross.id).length,1)
  assert.ok(result.accepted.concentrations[result.accepted.speciesIds.indexOf(cross.id)]>0)
  for(const [suffix,n] of [[38021,2],[38284,3],[38377,4]])assert.equal(s.products.find(p=>p.id===`spana:2ac52a30213c9288:${suffix}`).coefficients[b],n)
 }
})
test('ordinary phases/gas retain conditional diagnostics; electron-dependent phases are explicit and unevaluated',()=>{
 for(const {result} of states){assert.ok(result.phaseDiagnostics.filter(p=>p.phase==='solid').every(p=>p.logActivity<0));assert.ok(result.gasActivitySum>0&&result.gasActivitySum<1);assert.ok(result.phaseScope.outsideBoundary.some(p=>p.name==='B(cr)'));assert.ok(result.phaseScope.outsideBoundary.every(p=>!Object.hasOwn(p,'logActivity')))}
})
test('physical and boundary errors fail without repairing inputs or accepting caller-imposed coordinates',async()=>{
 const q=requestFor(5)
 for(const patch of [{constraints:[]},{amounts:{}},{selectedIds:[ids.H,ids.W]},{reviewedScope:true},{phases:['aqueous','gas']},{sourceFingerprint:'changed'},{revision:-1},{preparation:{...q.preparation,solventCoordinate:{...q.preparation.solventCoordinate,modelSolventMassKg:1}}}])assert.equal((await compileEquilibriumNetwork(repo,{...q,...patch})).ok,false)
 for(const moles of [-1,NaN,Infinity]){const bad=structuredClone(q);bad.preparation.contributions[0].moles=moles;assert.equal((await compileEquilibriumNetwork(repo,bad)).ok,false)}
 for(const sourceId of ['component:e-',ids.W,'unknown']){const bad=structuredClone(q);bad.preparation.contributions[0].sourceId=sourceId;assert.equal((await compileEquilibriumNetwork(repo,bad)).ok,false)}
 const charged=structuredClone(q);charged.preparation.contributions=[contribution('sodium',ids.Na,.001)];assert.equal((await compileEquilibriumNetwork(repo,charged)).diagnostics[0].code,'unbalanced-preparation')
 const duplicate=structuredClone(q);duplicate.preparation.contributions[1].id=duplicate.preparation.contributions[0].id;assert.equal((await compileEquilibriumNetwork(repo,duplicate)).ok,false)
 assert.equal(solveEquilibriumNetwork({...states[0].compiled}).ok,false)
})
test('redox-active Fe/peroxide preparation is refused, while original reviewed redox route remains valid',async()=>{
 const F='component:Fe%202%2B',P='component:H2O2',Cl='component:Cl-',saved=JSON.parse(fs.readFileSync('docs/closed-redox-step5-independent-points.json'))[1]
 const amounts={[F]:1e-6,[P]:saved.peroxideSupplied,[ids.H]:.01,[Cl]:.010002}
 const request={...common,preparation:{provenance:'Existing reviewed Fe/peroxide physical control',solventCoordinate:{convention:'explicit-solvent-mass-kg',modelSolventMassKg:1},contributions:Object.entries(amounts).map(([id,moles],i)=>contribution(String(i),id,moles))}}
 const refused=await compileEquilibriumNetwork(repo,request);assert.equal(refused.ok,false);assert.equal(refused.diagnostics[0].code,'redox-boundary-mismatch');assert.ok(refused.sourceIds.length)
 const c=await compileEquilibriumNetwork(repo,{...common,boundary:'closed-physical',selectedIds:[...Object.keys(amounts),ids.W],amounts,reviewedScope:true}),r=solveEquilibriumNetwork(c)
 assert.ok(r.ok);assert.ok(Math.abs(r.accepted.inspection.pH-saved.pH)<1e-9);assert.ok(Math.abs(r.accepted.inspection.pe-saved.pe)<1e-9)
})
test('simple acetic acid physical control agrees with established independent acid/base reference',async()=>{
 const q=requestFor(0);q.preparation.contributions=q.preparation.contributions.slice(0,1)
 const c=await compileEquilibriumNetwork(repo,q),r=solveEquilibriumNetwork(c);assert.ok(r.ok)
 const expected=acetateReference({acetateTotal:.02,protonTotal:.02,logAcidFormation:repo.getSpeciesById(ids.acid).logK,logWater:repo.getSpeciesById('spana:2ac52a30213c9288:250448').logK,logSodiumFormation:0,logNaOHFormation:0})
 assert.ok(Math.abs(r.derived.pH-expected.pH)<1e-9);assert.equal(c.inspection.included.length,2)
})
test('supersaturated solid or gas requirement withholds accepted aqueous physical result',async()=>{
 for(const [sourceId,moles] of [[ids.B,10],[ids.acid,10000]]){const q={...common,preparation:{provenance:'Explicit phase refusal control',solventCoordinate:{convention:'explicit-solvent-mass-kg',modelSolventMassKg:1},contributions:[contribution('solute',sourceId,moles)]}},c=await compileEquilibriumNetwork(repo,q),r=solveEquilibriumNetwork(c);assert.ok(c.ok);assert.equal(r.ok,false);assert.equal(r.diagnostics[0].code,'unsupported-phase-closure');assert.ok(!r.accepted);assert.ok(r.candidate.ok)}
})
test('physical provenance/revision affect identity, while reordered contributions preserve equilibrium',async()=>{
 const q=requestFor(15);q.preparation.contributions.reverse();q.revision=2
 const c=await compileEquilibriumNetwork(repo,q),r=solveEquilibriumNetwork(c);assert.ok(r.ok)
 assert.notEqual(c.preparedSystemInput.system.id,states[3].compiled.preparedSystemInput.system.id);assert.equal(c.preparedSystemInput.input.revision,2);assert.ok(Math.abs(r.derived.pH-states[3].result.derived.pH)<1e-9)
 const provenance=requestFor(15);provenance.preparation.provenance='Different actual preparation lineage'
 const p=await compileEquilibriumNetwork(repo,provenance);assert.notEqual(p.preparedSystemInput.system.id,states[3].compiled.preparedSystemInput.system.id)
})
