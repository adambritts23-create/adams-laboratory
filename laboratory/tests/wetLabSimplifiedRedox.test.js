import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {loadWetLabIons} from '../src/calculations/wetLabIons.js'
import {simplifiedRedoxWetLabSetup,prepareWetLabStocks} from '../src/calculations/wetLabSetup.js'
import {prepareWetLabScope,runTitration} from '../src/calculations/wetLabTitration.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const catalog=await loadWetLabIons(repo)
const stocks=prepareWetLabStocks(simplifiedRedoxWetLabSetup,1,catalog)
const context=await prepareWetLabScope(repo,stocks,{enabledPhases:['aqueous','solid']},1)
const volumes=[0,25,49,50,51,75,100]
const series=await runTitration(context,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,revision:1,additionVolumesMl:volumes})
const concentration=(s,id)=>{const r=s.equilibrium.result;return r.concentrations[r.speciesIds.indexOf(id)]}

test('automatic inert countercharge is explicit and physical stocks still reject missing counterions',()=>{
 assert.equal(stocks.sample.preparationContract,'simplified-redox')
 assert.ok(Math.abs(stocks.sample.inertCounterchargeMoles+.00506)<1e-14)
 assert.ok(Math.abs(stocks.titrant.inertCounterchargeMoles+.00998)<1e-14)
 const physical=structuredClone(simplifiedRedoxWetLabSetup)
 for(const part of Object.values(physical))part.preparationContract='physical'
 assert.throws(()=>prepareWetLabStocks(physical,1,catalog),/counterions|charge/i)
})

test('dichromate/iron doses satisfy charge, inventory and source equilibrium checks',()=>{
 for(const [i,s] of series.states.entries()){
  assert.equal(s.status,'accepted-v0',JSON.stringify(s.diagnostics))
  assert.ok(s.equilibrium.conservedInventories.every(r=>r.ok))
  assert.equal(s.equilibrium.inertCountercharge.ok,true)
  const expected=(-.00506-.0000998*volumes[i])/((50+volumes[i])/1000)
  assert.ok(Math.abs(s.equilibrium.inertCountercharge.background-expected)<1e-10)
  assert.ok(Number.isFinite(s.equilibrium.derived.Eh))
 }
 assert.ok(series.states[4].equilibrium.derived.Eh-series.states[2].equilibrium.derived.Eh>.2)
})

test('acidic iron(II) is oxidized by dichromate at six irons per dichromate before equivalence',()=>{
 const s=series.states[1]
 const feRemaining=concentration(s,'component:Fe%202%2B')*.075
 assert.ok(Math.abs(feRemaining-15e-6)<1e-10)
 const cr3=concentration(s,'component:Cr%203%2B')*.075
 assert.ok(cr3>4.9e-6&&cr3<5.01e-6)
 // Free-species quotient independently combines the source half-reactions:
 // 2*76.35 - 14.54 - 6*13.051 = 59.854.
 const log=id=>Math.log10(concentration(s,id))
 const logQ=2*log('component:Cr%203%2B')+6*log('component:Fe%203%2B')-log('spana:2ac52a30213c9288:94892')-14*log('component:H%2B')-6*log('component:Fe%202%2B')
 assert.ok(Math.abs(logQ-59.854)<1e-6,`logQ=${logQ}`)
})
import {prepareSolution,dispenseVolume,mixSolutions,volumeConvention} from '../src/calculations/wetLabSolutions.js'

test('countercharge follows aliquots with either sign and mixed contracts are refused',()=>{
 const anion=prepareSolution({counterionModel:'inert-background',volumeMl:100,temperatureC:25,convention:volumeConvention.id,preparationRevision:1,contributions:[{id:'anion',kind:'ionic',sourceId:'component:Cl-',concentrationMolPerL:.02}]},catalog)
 assert.equal(anion.inertCounterchargeMoles,.002)
 const {aliquot,remainder}=dispenseVolume(anion,25)
 assert.equal(aliquot.inertCounterchargeMoles,.0005)
 assert.ok(Math.abs(remainder.inertCounterchargeMoles-.0015)<1e-16)
 assert.ok(Math.abs(mixSolutions(stocks.sample,aliquot).inertCounterchargeMoles-(-.00506+.0005))<1e-14)
 const physical=prepareSolution({volumeMl:10,temperatureC:25,convention:volumeConvention.id,preparationRevision:1,contributions:[{id:'acid',reagent:'HCl',concentrationMolPerL:.1}]},catalog)
 assert.throws(()=>mixSolutions(stocks.sample,physical),/separate/)
 assert.throws(()=>prepareSolution({counterionModel:'anything-else'},catalog),/counterion model/)
})
