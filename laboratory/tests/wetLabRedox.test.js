import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {loadWetLabIons} from '../src/calculations/wetLabIons.js'
import {redoxWetLabSetup,prepareWetLabStocks} from '../src/calculations/wetLabSetup.js'
import {prepareWetLabScope,runTitration} from '../src/calculations/wetLabTitration.js'
import {createWetLabAnalysis} from '../src/calculations/wetLabAnalysis.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const stocks=prepareWetLabStocks(redoxWetLabSetup,1,await loadWetLabIons(repo))
const context=await prepareWetLabScope(repo,stocks,{enabledPhases:['aqueous']},1)
const volumes=[0,25,49,50,51,75,100]
const series=await runTitration(context,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,revision:1,additionVolumesMl:volumes})
test('same Wet Lab mixing path derives redox titration through equivalence and excess',()=>{
 assert.equal(context.scope.boundary,'closed-physical')
 for(const [i,s] of series.states.entries()){
  assert.equal(s.status,'accepted-v0',JSON.stringify(s.diagnostics))
  assert.equal(s.totalVolumeMl,50+volumes[i])
  assert.ok(Math.abs(s.analyticalMoles['component:Fe%202%2B']-5e-8)<1e-20)
  assert.ok(Math.abs(s.analyticalMoles['component:Ce%204%2B']-volumes[i]*1e-9)<1e-20)
  assert.ok(s.equilibrium.conservedInventories.every(r=>r.ok))
  assert.ok(Number.isFinite(s.equilibrium.derived.Eh))
  if(i)assert.ok(s.equilibrium.derived.Eh>series.states[i-1].equilibrium.derived.Eh)
 }
 assert.ok(series.states[4].equilibrium.derived.Eh-series.states[2].equilibrium.derived.Eh>.1)
})
test('Eh and pH graphs share exact accepted doses without recalculating chemistry',()=>{
 const analysis=createWetLabAnalysis({snapshot:()=>({points:series.curve}),validate:p=>p.state})
 const eh=analysis.view('redox-titration'),ph=analysis.view('titration')
 assert.ok(eh.available);assert.equal(eh.series[0].id,'Eh')
 for(const [i,p] of eh.series[0].points.entries()){
  assert.equal(p.state,series.states[i])
  assert.equal(p.result,ph.series[0].points[i].result)
  assert.equal(p.value,series.states[i].equilibrium.derived.Eh)
 }
 assert.equal(analysis.view('redox-titration'),eh)
})
test('ordinary acid-base states do not acquire an invented Eh curve',()=>{
 const state={id:'nonredox',status:'accepted-v0',pH:7,equilibrium:{}}
 const point={x:0,state}
 const analysis=createWetLabAnalysis({snapshot:()=>({points:[point]}),validate:p=>p.state})
 assert.equal(analysis.view('redox-titration').available,false)
 assert.equal(analysis.view('titration').series[0].points[0].value,7)
})
