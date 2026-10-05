import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {discoverGeneralClosed,prepareGeneralClosed,solveGeneralClosed} from '../src/thermodynamics/generalClosedReagents.js'
import {prepareClosedReagents,solveClosedReagents} from '../src/thermodynamics/closedReagents.js'
import {fePeroxideScope as scope} from '../src/thermodynamics/scopes/fePeroxide.js'
import {configureGeneralClosed} from '../src/calculations/generalClosedSetup.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const ids={P:'component:H2O2',H:'component:H%2B',W:'component:H2O',F:'component:Fe%202%2B',Cl:'component:Cl-',e:'component:e-'}
const request=amounts=>({amounts,description:'Independent conditional aqueous reagent control',revision:0,temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O'})
const audit=await discoverGeneralClosed(repo,[ids.P,ids.W]),q=request({[ids.P]:1e-6})
const prepared=await prepareGeneralClosed(repo,q,audit),control=solveGeneralClosed(prepared)
const expected=JSON.parse(fs.readFileSync('docs/general-closed-independent.json')).expected
test('general source discovery finds peroxide-only graph without a pair scope and retains gas candidates',()=>{
 assert.equal(audit.status,'CONDITIONAL');assert.equal(audit.included.length,6);assert.equal(audit.candidateGases.length,3);assert.equal(audit.reviewedScope,false);assert.equal(audit.scope.inventoryDomain,undefined);assert.equal(audit.families.length,4);assert.equal(audit.ordinary.length,2)
 assert.ok(audit.cancellations.every(c=>c.electronResidual===0));assert.ok(audit.cancellations.some(c=>c.electronMultiple>2));assert.ok(audit.conservation.some(c=>c.key==='H-2O'))
})
test('generic unbuffered peroxide agrees with independent raw-law scalar expectation',()=>{
 assert.ok(control.ok,JSON.stringify(control.diagnostics));assert.equal(control.status,'CONDITIONAL')
 assert.equal(control.accepted.inspection.pH,expected.pH);assert.equal(control.accepted.inspection.pe,expected.pe)
 const values=Object.fromEntries(control.accepted.inspection.carriers.map(c=>[c.name,c.amount]))
 for(const [name,key] of [['H+','H'],['OH-','OH'],['H2','H2'],['H2O2','H2O2'],['HO2-','HO2'],['O2','O2'],['O3','O3']])assert.ok(Math.abs(Math.log10(values[name]/expected[key]))<1e-10,`${name}: ${values[name]} vs ${expected[key]}`)
 assert.ok(control.accepted.closed.inspection.inventories.every(r=>r.ok));assert.ok(control.accepted.closed.inspection.nonRedoxReactions.every(r=>r.ok));assert.ok(control.accepted.closed.inspection.potentials.every(r=>r.ok))
})
test('excluded gases remain conditional at low dose and require unsupported inventory at high dose',async()=>{
 assert.ok(control.phaseDiagnostics.every(r=>r.classification==='excluded-conditionally'));assert.ok(control.gasFugacitySum<1)
 const high=solveGeneralClosed(await prepareGeneralClosed(repo,request({[ids.P]:.01}),audit))
 assert.equal(high.ok,false);assert.equal(high.status,'UNSUPPORTED');assert.equal(high.diagnostics[0].code,'gas-inventory-headspace-required');assert.ok(high.gasFugacitySum>1);assert.ok(high.phaseDiagnostics.some(r=>r.classification==='required-but-unsupported'))
})
test('reviewed Fe network, exclusions, input/result identity, algebra and explanation are exact',async()=>{
 const selection=[ids.F,ids.P,ids.H,ids.Cl,ids.W],a=await discoverGeneralClosed(repo,selection,{reviewedScope:true}),r=request({[ids.F]:1e-6,[ids.P]:2.5e-7,[ids.H]:.01,[ids.Cl]:.010002})
 assert.equal(a.included.length,24);assert.deepEqual(new Set(a.included.map(r=>r.id)),new Set(Object.keys(scope.reactions)))
 const old=await prepareClosedReagents(repo,r,scope),p=await prepareGeneralClosed(repo,r,a),oldResult=solveClosedReagents(old),newResult=solveGeneralClosed(p)
 assert.ok(newResult.ok,JSON.stringify(newResult.diagnostics));assert.deepEqual(a.excluded.map(r=>r.id),old.discovery.excluded.map(r=>r.id));assert.equal(p.prepared.prepared.input.id,old.prepared.input.id);assert.deepEqual(p.prepared.prepared.network,old.prepared.network);assert.deepEqual(newResult.accepted,oldResult)
})
test('unrestricted Fe chloride network includes counterion redox within audited expanded capacity',async()=>{
 const a=await discoverGeneralClosed(repo,[ids.F,ids.P,ids.H,ids.Cl,ids.W]);assert.equal(a.status,'CONDITIONAL');assert.ok(Object.keys(a.metadata).length>32);assert.ok(a.included.some(r=>r.id==='spana:2ac52a30213c9288:82236'));assert.ok(a.candidateSolids.some(r=>r.name==='Fe0.932O(cr)'));assert.equal(a.excluded.filter(r=>r.phase==='aqueous').length,0)
 assert.ok(a.componentRoles.find(r=>r.id===ids.Cl).roles.includes('redox-active'))
})
test('atomless source discovery is admitted; selected electron and inactive systems refuse',async()=>{
 const cu=await discoverGeneralClosed(repo,[ids.W,'component:Cu%202%2B']);assert.ok(cu.canCalculate);assert.equal(cu.metadata['component:Cu%202%2B'].elements,undefined)
 for(const [selection,code] of [[[ids.P,ids.e,ids.W],'conflicting-reservoir'],[[ids.H,ids.W],'no-connected-redox-family']]){const a=await discoverGeneralClosed(repo,selection);assert.equal(a.canCalculate,false);assert.ok(a.reasons.some(r=>r.code===code),JSON.stringify(a.reasons))}
})
test('source drift, forged audit, mismatched repository and reviewed-profile misuse cannot calculate',async()=>{
 const changed={...repo,getSpecies:()=>repo.getSpecies().map((r,i)=>i===0?{...r,logK:r.logK+.01}:r)}
 assert.equal((await discoverGeneralClosed(changed,[ids.P,ids.W])).reasons[0].code,'source-integrity')
 assert.equal((await prepareGeneralClosed(repo,q,{...audit})).ok,false);assert.equal((await prepareGeneralClosed(changed,q,audit)).ok,false);assert.equal((await discoverGeneralClosed(repo,[ids.P,ids.W],{reviewedScope:true})).canCalculate,false)
})
test('source row order preserves independent generic equilibrium',async()=>{
 const reversed={...repo,getSpecies:()=>[...repo.getSpecies()].reverse(),getComponents:()=>[...repo.getComponents()].reverse()},a=await discoverGeneralClosed(reversed,[ids.W,ids.P]),p=await prepareGeneralClosed(reversed,q,a),r=solveGeneralClosed(p)
 assert.ok(r.ok,JSON.stringify(r.diagnostics));assert.equal(r.accepted.inspection.pH,expected.pH);assert.equal(r.accepted.inspection.pe,expected.pe)
})
test('conflicting reservoirs, unsupported conditions, nonphysical or unbalanced recipes fail closed',async()=>{
 for(const r of [{...q,Eh:.2},{...q,temperatureC:35},{...q,activityModel:'Davies'},request({[ids.P]:-1}),request({[ids.P]:1e-6,[ids.H]:.01})])assert.equal((await prepareGeneralClosed(repo,r,audit)).ok,false)
 const a=await discoverGeneralClosed(repo,[ids.P,ids.H,ids.W]);assert.equal((await prepareGeneralClosed(repo,request({[ids.P]:1e-6,[ids.H]:.01}),a)).ok,false)
})
test('general point setup preserves ordinary settings and never turns fixed pH into supplied acid',()=>{
 const d={componentConditions:[{componentId:ids.H,mode:'LA',quantity:'pH',value:7},{componentId:ids.P,mode:'T',value:1e-6}],imposedEh:{pH:7},pourbaix:{},closedReagents:{}}
 const next=configureGeneralClosed(d,[repo.getComponentById(ids.H),repo.getComponentById(ids.P),repo.getComponentById(ids.W)])
 assert.equal(next.generalClosed.amounts[ids.H],0);assert.equal(next.generalClosed.amounts[ids.P],1e-6);assert.equal(next.generalClosed.amounts[ids.W],undefined);assert.equal(next.imposedEh,undefined);assert.equal(next.closedReagents,undefined);assert.deepEqual(next.generalClosed.ordinaryDefinition,d)
})
