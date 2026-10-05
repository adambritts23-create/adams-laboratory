import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {componentMetadata} from '../src/thermodynamics/componentMetadata.js'
import {prepareReagent,mixPreparations,preparationCharge} from '../src/thermodynamics/reagentPreparation.js'
import {discoverGeneralClosed,prepareGeneralClosed,solveGeneralClosed} from '../src/thermodynamics/generalClosedReagents.js'
import {compileClosedRedoxNetwork} from '../src/thermodynamics/closedRedoxNetwork.js'
import {transformReactionBasis} from '../src/thermodynamics/reactionBasis.js'
import {independentEu} from '../scripts/validation/openClosedIndependent.js'
import {closedReagentExample} from '../src/data/closedReagentExample.js'
import {configureGeneralClosed} from '../src/calculations/generalClosedSetup.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const reg=await componentMetadata(repo),Eu='component:Eu%203%2B',Cl='component:Cl-',H='component:H%2B',Fe='component:Fe%202%2B',P='component:H2O2',W='component:H2O'
const request=amounts=>({amounts,description:'Open general source control',revision:0,temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O'})
const amounts={[Eu]:1e-6,[Cl]:.010003,[H]:.01},audit=await discoverGeneralClosed(repo,[...Object.keys(amounts),W]),prepared=await prepareGeneralClosed(repo,request(amounts),audit),result=solveGeneralClosed(prepared)
test('coverage distinguishes discovery associations from reviewed conservation metadata',()=>{
 assert.equal(reg.coverage.length,168);assert.deepEqual(reg.entries[Eu].elements,{Eu:1});assert.deepEqual(reg.entries['component:CrO4%202-'].elements,{Cr:1,O:4});assert.equal(reg.entries['component:Cu%202%2B'],undefined);assert.ok(reg.coverage.filter(c=>!c.canAllocate).every(c=>c.reason.includes('reviewed')))
})
test('component provenance drift cannot retain reviewed recipe identity',async()=>{
 const changed={...repo,getComponentById:id=>{const c=repo.getComponentById(id);return id===Eu?{...c,provenance:{...c.provenance,sourceFile:'changed'}}:c}}
 assert.equal((await componentMetadata(changed)).entries[Eu],undefined);assert.equal((await prepareReagent(changed,{recipeId:'europium-chloride',molality:1e-6,solventMassKg:1})).ok,false)
})
test('bare charged components report exact countercharge and never receive invented ions',()=>{
 const a=preparationCharge({[Fe]:.001},reg.entries);assert.equal(a.ok,false);assert.equal(a.netCharge,.002);assert.equal(a.missingCountercharge,-.002);assert.equal(a.contributions.length,1);assert.match(a.message,/None is added/)
})
test('neutral physical reagents and solvent-mass mixing conserve introduced atom and charge inventories',async()=>{
 const a=await prepareReagent(repo,{recipeId:'ferrous-chloride',molality:.001,solventMassKg:2}),b=await prepareReagent(repo,{recipeId:'hydrochloric-acid',molality:.01,solventMassKg:1}),m=mixPreparations([a,b]);assert.ok(m.ok);assert.equal(m.solventMassKg,3);assert.equal(m.moles[Fe],.002);assert.equal(m.moles[Cl],.014);assert.equal(m.amounts[H],.01/3);assert.ok(preparationCharge(m.amounts,reg.entries).ok);assert.equal(mixPreparations([{...a}]).ok,false)
})
test('stock contract refuses volume assumptions, missing counterion metadata, invalid amounts and electron inventory',async()=>{
 for(const q of [{recipeId:'ferrous-chloride',molality:1,volumeL:1},{recipeId:'unknown',molality:1,solventMassKg:1},{recipeId:'hydrogen-peroxide',molality:-1,solventMassKg:1}])assert.equal((await prepareReagent(repo,q)).ok,false)
 assert.equal(preparationCharge({'component:e-':1},reg.entries).ok,false)
})
test('new metal uses complete general graph and matches all independent raw-law concentrations',()=>{
 assert.ok(result.ok,JSON.stringify(result.diagnostics));assert.equal(audit.reviewedScope,false);assert.equal(audit.included.length,24);assert.ok(audit.componentRoles.find(c=>c.id===Cl).roles.includes('redox-active'))
 const expected=independentEu();assert.ok(Math.abs(result.accepted.inspection.pH-expected.pH)<1e-10);assert.ok(Math.abs(result.accepted.inspection.pe-expected.pe)<1e-10)
 assert.equal(result.accepted.inspection.carriers.length,Object.keys(expected.carriers).length)
 for(const c of result.accepted.inspection.carriers)assert.ok(Math.abs(Math.log10(c.amount/expected.carriers[c.name]))<1e-9,c.name)
 assert.ok(result.accepted.closed.inspection.inventories.every(c=>c.ok));assert.equal(result.status,'CONDITIONAL')
})
test('source charge-label collisions retain separate exact carriers and inspection formulas',()=>{
 const carriers=result.accepted.inspection.carriers;assert.ok(carriers.find(c=>c.name==='EuCl 2+'));assert.ok(carriers.find(c=>c.name==='EuCl2+'));assert.notEqual(carriers.find(c=>c.name==='EuCl 2+').id,carriers.find(c=>c.name==='EuCl2+').id)
})
test('reviewed example is explicit; identical bare selections use untruncated general chemistry',async()=>{
 const example=closedReagentExample(repo);assert.ok(example.calculationDefinition.closedReagents)
 const a=await discoverGeneralClosed(repo,example.chemicalSystem.selectedComponents);assert.equal(a.reviewedScope,false);assert.equal(a.included.length,32)
 const config=configureGeneralClosed(example.calculationDefinition,example.chemicalSystem.selectedComponents.map(id=>repo.getComponentById(id)));assert.ok(config.generalClosed);assert.equal(config.closedReagents,undefined);assert.equal(config.generalClosed.ordinaryDefinition.closedReagents,undefined)
 const p=await prepareGeneralClosed(repo,request({[Fe]:1e-6,[P]:2.5e-7,[Cl]:.010002,[H]:.01}),a);assert.ok(solveGeneralClosed(p).ok)
})
test('larger Fe Eu network solves without concentration pruning',async()=>{
 const am={[Fe]:1e-6,[Eu]:1e-6,[Cl]:.010005,[H]:.01},a=await discoverGeneralClosed(repo,[...Object.keys(am),W]);assert.ok(Object.keys(a.metadata).length>32);assert.equal(a.excluded.filter(c=>c.phase==='aqueous').length,0);const p=await prepareGeneralClosed(repo,request(am),a);assert.ok(solveGeneralClosed(p).ok)
})
test('Fe chromate counterions expose excluded precipitation rather than falsely accepting a converged aqueous state',async()=>{
 const am={[Fe]:6e-6,'component:CrO4%202-':2e-6,'component:K%2B':2e-6,[Cl]:.010012,[H]:.010002},a=await discoverGeneralClosed(repo,[...Object.keys(am),W]);assert.ok(a.canCalculate);const r=solveGeneralClosed(await prepareGeneralClosed(repo,request(am),a));assert.equal(r.ok,false);assert.equal(r.diagnostics[0].code,'relevant-solid-or-unresolved-phase');assert.ok(r.candidate.ok);assert.ok(!r.accepted)
})
test('capacity extension is bounded and does not widen ordinary basis limits',()=>{
 const q={mode:'closed-redox',temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O',species:Array(65).fill({}),reactions:[{},{}],basisIds:['a']};assert.equal(compileClosedRedoxNetwork(q).ok,false)
 assert.equal(transformReactionBasis({basisIds:['a'],componentIds:Array.from({length:33},(_,i)=>String(i)),reactions:[]}).diagnostics[0].code,'reaction-size-limit')
 assert.equal(transformReactionBasis({basisIds:['a'],componentIds:['a'],reactions:[],capacity:'unlimited'}).ok,false)
 const components=['b',...Array.from({length:33},(_,i)=>`x${i}`)],rows=components.slice(1).map(id=>({id,productId:id,terms:[{id:'b',coefficient:1}],logK:0,phase:'aqueous',unit:{kind:'ideal-molal-standard'},provenance:{reference:'Synthetic structural failure control'}})),base={basisIds:['b'],componentIds:components,reactions:rows,capacity:'closed-aqueous-64-v1'}
 assert.ok(transformReactionBasis(base).ok)
 assert.equal(transformReactionBasis({...base,reactions:rows.slice(1)}).ok,false)
 assert.equal(transformReactionBasis({...base,reactions:[...rows,{...rows[0],id:'contradiction',logK:1}]}).ok,false)
})
