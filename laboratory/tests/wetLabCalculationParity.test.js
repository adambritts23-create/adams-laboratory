import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {loadWetLabIons} from '../src/calculations/wetLabIons.js'
import {prepareWetLabStocks,analyticalWetLabSetup} from '../src/calculations/wetLabSetup.js'
import {prepareWetLabScope,runTitration} from '../src/calculations/wetLabTitration.js'
import {selectedSystem,compareDose} from './helpers/wetLabCalculationParity.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json'))),catalog=await loadWetLabIons(repo),H='component:H%2B',OH='spana:2ac52a30213c9288:250448'
const cases=[['strong',[],[OH],[H]],['acetate',['component:CH3COO-'],['component:CH3COO-'],[H]],['weak',['component:CH3COO-'],['spana:2ac52a30213c9288:79298'],[OH]],['citrate',['component:cit%203-'],['component:cit%203-'],[H]],['phosphate',['component:PO4%203-'],['component:PO4%203-'],[H]],['acetate-formate',['component:CH3COO-','component:HCOO-'],['component:CH3COO-','component:HCOO-'],[H]],['carbonate',['component:CO3%202-'],['component:CO3%202-'],[H]],['calcium-carbonate',['component:Ca%202%2B','component:CO3%202-'],['component:Ca%202%2B'],['component:CO3%202-']]]
for(const [name,ids,sample,titrant] of cases)test('Wet Lab equals independently constructed Calculation: '+name,async()=>{
 const chemical=selectedSystem(repo,ids),setup=structuredClone(analyticalWetLabSetup)
 for(const [part,inputs] of [['sample',sample],['titrant',titrant]])setup[part].contributions=inputs.map((sourceId,i)=>({id:String(i),kind:'component',sourceId,concentrationMolPerL:name==='calcium-carbonate'?.01:.1}))
 const stocks=prepareWetLabStocks(setup,0,catalog),context=await prepareWetLabScope(repo,stocks,chemical),series=await runTitration(context,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,additionVolumesMl:[0,25,50,100],revision:0}),evidence=[]
 for(const state of series.states)evidence.push(await compareDose(repo,chemical,state))
 if(name!=='calcium-carbonate')assert.ok(series.states.every(s=>s.equilibrium.ok),JSON.stringify(evidence))
 fs.writeFileSync('.local/system-wetlab-parity/'+name+'.json',JSON.stringify({chemical,evidence},null,2))
})

test('authoritative System is mandatory; explicit electron System and outside stock coordinates refuse',async()=>{
 const stocks=prepareWetLabStocks(analyticalWetLabSetup,0,catalog)
 await assert.rejects(()=>prepareWetLabScope(repo,stocks,{enabledPhases:['aqueous','solid']}),/System/)
 const electron=repo.getComponents().find(c=>c.role==='electron').id
 await assert.rejects(()=>prepareWetLabScope(repo,stocks,selectedSystem(repo,[electron])),/without e/)
 const outside=structuredClone(analyticalWetLabSetup);outside.sample.contributions[0].sourceId='component:CO3%202-'
 await assert.rejects(()=>prepareWetLabScope(repo,prepareWetLabStocks(outside,0,catalog),selectedSystem(repo,[])),/System first/)
})
