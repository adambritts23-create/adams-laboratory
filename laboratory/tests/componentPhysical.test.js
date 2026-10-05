import test from 'node:test'
import assert from 'node:assert/strict'
import {repo,common,contribution} from '../scripts/validation/nonRedoxPhysicalBenchmark.js'
import {sourceComponentMetadata} from '../src/thermodynamics/sourceComponentMetadata.js'
import {preparePhysicalContributions} from '../src/thermodynamics/physicalPreparation.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork} from '../src/thermodynamics/equilibriumNetwork.js'
import {loadWetLabIons} from '../src/calculations/wetLabIons.js'
import {preflightWetLab} from '../src/calculations/wetLabPreflight.js'
const request=amounts=>({...common,boundary:'physical-preparation',preparation:{provenance:'Pinned component-coordinate regression',solventCoordinate:{convention:'explicit-solvent-mass-kg',modelSolventMassKg:1},contributions:Object.entries(amounts).map(([id,n],i)=>contribution(String(i),id,n))}})
const Li='component:Li%2B',A='component:CH3COO-',Na='component:Na%2B',N='component:NO3-',Cu='component:Cu%202%2B',Cl='component:Cl-'
test('all pinned source components carry source charge; unknown atoms remain absent',async()=>{
 const m=await sourceComponentMetadata(repo);assert.ok(m.ok);assert.equal(Object.keys(m.entries).length,repo.getComponents().length)
 for(const [id,charge] of [[N,-1],[Cu,2],[Li,1]]){assert.equal(m.entries[id].charge,charge);assert.equal(m.entries[id].elements,undefined);assert.equal(m.entries[id].sourceIdentity.sourceFingerprint,common.sourceFingerprint)}
 assert.deepEqual(m.entries[Cl].elements,{Cl:1})
})
test('nitrate admits conditioned source conservation; aqueous-only copper retains phase refusal',async()=>{
 const catalog=await loadWetLabIons(repo)
 for(const amounts of [{[Na]:.01,[N]:.01},{[Cu]:.01,[Cl]:.02}]){
  const q=request(amounts),p=await preparePhysicalContributions(repo,q.preparation);assert.ok(p.ok);assert.equal(p.physicalPreparation.charge.netCharge,0)
  for(const [id,n] of Object.entries(amounts))assert.equal(p.solverCoordinates.componentMoles[id],n)
  const c=await compileEquilibriumNetwork(repo,q);assert.equal(c.ok,true,JSON.stringify(c.diagnostics));const r=solveEquilibriumNetwork(c);if(Object.hasOwn(amounts,N)){assert.ok(r.ok);assert.equal(r.basisSelection.policy,'initial-conditioning-source-basis-v1');assert.equal(r.accepted.inspection.elementalMetadata,'unavailable')}else{assert.equal(r.ok,false);assert.equal(r.diagnostics[0].code,'relevant-solid-or-unresolved-phase')}
  const setup={sample:{volumeMl:50,contributions:Object.entries(amounts).map(([sourceId,concentrationMolPerL],i)=>({id:String(i),kind:'ionic',sourceId,concentrationMolPerL}))},titrant:{reagent:'NaOH',volumeMl:100,concentrationMolPerL:.1}}
  const preflight=await preflightWetLab(repo,setup,{enabledPhases:['aqueous']},0,catalog);assert.equal(preflight.status,'CONDITIONAL',preflight.reason)
 }
})
test('atomless lithium acetate closes component balances and mass action with the ordinary solver',async()=>{
 const c=await compileEquilibriumNetwork(repo,request({[Li]:.01,[A]:.01}));assert.ok(c.ok,JSON.stringify(c.diagnostics));assert.equal(c.boundary,'closed-physical-nonredox')
 const r=solveEquilibriumNetwork(c);assert.ok(r.ok,JSON.stringify(r.diagnostics));assert.ok(r.charge.ok);assert.equal(r.notDetermined.Eh.status,'not-determined')
 const {system,input}=c.preparedSystemInput
 for(const constraint of input.constraints.filter(x=>x.kh===1)){
  const k=system.componentIndex[constraint.componentId],n=r.accepted.concentrations[k]+system.products.reduce((sum,p,j)=>sum+p.coefficients[k]*r.accepted.concentrations[system.components.length+j],0)
  assert.ok(Math.abs(n-constraint.value)<1e-9)
 }
 for(const p of system.products){const i=r.accepted.speciesIds.indexOf(p.id);assert.ok(Math.abs(Math.log10(r.accepted.concentrations[i])-p.logBeta-p.coefficients.reduce((sum,n,k)=>sum+n*r.accepted.logActivities[k],0))<1e-9)}
 assert.equal(c.physicalPreparation?.contributions?.find(x=>x.sourceId===Li)?.elements,undefined)
 assert.equal(solveEquilibriumNetwork({...c}).ok,false)
 const revised=await compileEquilibriumNetwork(repo,{...request({[Li]:.01,[A]:.01}),revision:1});assert.notEqual(revised.preparedSystemInput.input.id,input.id)
})
test('charge, negative amounts, special identities and stale source/revision still refuse',async()=>{
 for(const amounts of [{[Na]:.01,[N]:.02},{[Cu]:-.01,[Cl]:.02},{'component:e-':.01},{'component:H2O':.01},{'component:invented':.01}])assert.equal((await preparePhysicalContributions(repo,request(amounts).preparation)).ok,false)
 for(const override of [{sourceFingerprint:'stale'},{revision:-1}])assert.equal((await compileEquilibriumNetwork(repo,{...request({[Li]:.01,[A]:.01}),...override})).ok,false)
 const changed={getComponents:()=>repo.getComponents().map(c=>c.id===Li?{...c,name:'Forged+'}:c),getSpecies:()=>repo.getSpecies()}
 assert.equal((await sourceComponentMetadata(changed)).diagnostics[0].code,'source-integrity');await assert.rejects(()=>loadWetLabIons(changed),/unchanged audited/)
})
