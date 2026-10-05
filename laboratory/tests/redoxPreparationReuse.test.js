import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {loadWetLabIons} from '../src/calculations/wetLabIons.js'
import {prepareWetLabStocks} from '../src/calculations/wetLabSetup.js'
import {prepareWetLabScope,runTitration} from '../src/calculations/wetLabTitration.js'
import {prepareClosedReagents,solveClosedReagents} from '../src/thermodynamics/closedReagents.js'
import {reprepareClosedRedox} from '../src/solver/closedRedox.js'
import {repo as ironRepo,scope,reagentRequest,ids} from '../scripts/validation/fePeroxideChecks.js'

const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const part=(sourceId,volumeMl)=>({preparationContract:'simplified-redox',volumeMl,contributions:[{id:'metal',kind:'ionic',sourceId,concentrationMolPerL:.0001},{id:'acid',kind:'ionic',sourceId:'component:H%2B',concentrationMolPerL:.1}]})
const stocks=prepareWetLabStocks({sample:part('spana:2ac52a30213c9288:94892',50),titrant:part('component:Cu%2B',400)},1,await loadWetLabIons(repo))
const volumes=[0,100,296,300,304,392,400]

test('cached copper/dichromate doses exactly reproduce uncached source preparation, including precipitation',async()=>{
 // An unbranded adapter deliberately takes the full source verification path.
 const cold={...repo},system={enabledPhases:['aqueous','solid']}
 const warmContext=await prepareWetLabScope(repo,stocks,system,1)
 const coldContext=await prepareWetLabScope(cold,stocks,system,1)
 const run=context=>runTitration(context,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,revision:1,additionVolumesMl:volumes})
 const warm=await run(warmContext),reference=await run(coldContext)
 for(const [i,s] of warm.states.entries()){
  const e=s.equilibrium,c=reference.states[i].equilibrium
  assert.equal(s.status,'accepted-v0');assert.equal(c.ok,true)
  assert.deepEqual(e.result,c.result)
  assert.deepEqual(e.conservedInventories,c.conservedInventories)
  assert.deepEqual(e.inertCountercharge,c.inertCountercharge)
  assert.equal(e.pH,c.pH);assert.equal(e.derived.Eh,c.derived.Eh)
 }
 const e=warm.states[5].equilibrium,carriers=e.elementCarriers.filter(c=>c.id.includes('Cu')||c.name.startsWith('Cu'))
 const total=carriers.reduce((sum,c)=>sum+c.amount,0)
 const fraction=name=>carriers.find(c=>c.name===name).amount/total
 assert.ok(Math.abs(fraction('Cu 2+')-.81709)<.00001)
 assert.ok(Math.abs(fraction('Cu+')-.13113)<.00001)
 assert.ok(Math.abs(fraction('Cu(cr)')-.051782)<.00001)
 assert.ok(Math.abs((fraction('Cu 2+')-fraction('Cu(cr)'))*39.2-30)<.00001)
})

test('template reuse revalidates charge and inputs, preserves basis selection and independent revision identities',async()=>{
 const first=await prepareClosedReagents(ironRepo,reagentRequest(),scope)
 const request={...reagentRequest(),revision:42,description:'New dose history'}
 const again=await prepareClosedReagents(ironRepo,request,scope)
 assert.equal(again.prepared.system,first.prepared.system)
 assert.notEqual(again.requestId,first.requestId)
 assert.equal(again.prepared.input.revision,42)
 assert.equal(solveClosedReagents(again).ok,true)
 const alternate=await prepareClosedReagents(ironRepo,{...request,basisIndex:1},scope)
 assert.deepEqual(alternate.prepared.network.basisIds,scope.bases[1])
 assert.notEqual(alternate.prepared.system,first.prepared.system)
 const unbalanced={...request,amounts:{...request.amounts,[ids.Cl]:0}}
 assert.equal((await prepareClosedReagents(ironRepo,unbalanced,scope)).diagnostics[0].code,'reagent-inventory-outside-scope')
 assert.equal((await reprepareClosedRedox(first.prepared,{...first.prepared.preparation,amounts:unbalanced.amounts})).diagnostics[0].code,'unbalanced-preparation')
 assert.equal((await reprepareClosedRedox({...first.prepared},first.prepared.preparation)).ok,false)
 assert.equal((await reprepareClosedRedox(first.prepared,{...first.prepared.preparation,amounts:{unknown:1}})).ok,false)
})
