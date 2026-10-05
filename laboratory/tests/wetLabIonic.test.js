import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {repo} from '../scripts/validation/nonRedoxPhysicalBenchmark.js'
import {loadWetLabIons,balanceIonicPair,ionicCharge} from '../src/calculations/wetLabIons.js'
import {prepareWetLabStocks} from '../src/calculations/wetLabSetup.js'
import {preflightWetLab} from '../src/calculations/wetLabPreflight.js'
import {prepareWetLabScope,runTitration,solveMixedSolution} from '../src/calculations/wetLabTitration.js'
import {mixSolutions,dispenseVolume} from '../src/calculations/wetLabSolutions.js'
import {createWetLabAnalysis} from '../src/calculations/wetLabAnalysis.js'
const catalog=await loadWetLabIons(repo),system={enabledPhases:['aqueous','solid']}
const ion=(id,sourceId,c)=>({id,kind:'ionic',sourceId,concentrationMolPerL:c})
const cr=ion('cr','component:Cr%203%2B',.01),cl=ion('cl','component:Cl-',.03)
const setup=rows=>({sample:{volumeMl:50,contributions:rows},titrant:{reagent:'NaOH',volumeMl:100,concentrationMolPerL:.1}})
test('ionic chromium inventory equals reviewed bottle and supports dispense and N rows',()=>{
 const ionic=prepareWetLabStocks(setup([cr,cl]),4,catalog),reviewed=prepareWetLabStocks({...setup([]),sample:{volumeMl:50,reagent:'CrCl3',concentrationMolPerL:.01}},4)
 assert.deepEqual(ionic.sample.moles,reviewed.sample.moles)
 const three=prepareWetLabStocks(setup([cr,ion('na','component:Na%2B',.01),{...cl,concentrationMolPerL:.04}]),4,catalog)
 assert.equal(three.sample.contributions.length,3);assert.equal(three.sample.chargeEquivalents,0);assert.equal(three.sample.moles.Na,.0005)
 assert.equal(ionic.sample.chargeEquivalents,0)
 assert.equal(ionic.sample.contributions[0].composition.charge,3)
 assert.equal(ionic.sample.contributions[0].sourceId,cr.sourceId)
 assert.equal(ionic.sample.sourceFingerprint,reviewed.sample.sourceFingerprint)
 assert.equal(ionic.sample.preparationRevision,4)
 const n=prepareWetLabStocks(setup([cl,{...cr,concentrationMolPerL:.005},ion('cr2',cr.sourceId,.005)]),4,catalog)
 assert.deepEqual(n.sample.moles,ionic.sample.moles)
 const {aliquot,remainder}=dispenseVolume(n.sample,20)
 assert.deepEqual(mixSolutions(aliquot,remainder).moles,n.sample.moles)
 assert.throws(()=>mixSolutions(n.sample,prepareWetLabStocks(setup([cr,cl]),5,catalog).sample),/revision/)
})
test('authoritative two-row balance works in either order; unbalanced/unknown/forged metadata refuse',()=>{
 const a=balanceIonicPair([cr,{...cl,concentrationMolPerL:.01}],catalog)
 assert.equal(a[1].concentrationMolPerL,.03)
 assert.equal(balanceIonicPair([cl,{...cr,concentrationMolPerL:.02}],catalog)[1].concentrationMolPerL,.01)
 assert.equal(ionicCharge(a,catalog,50).balanced,true)
 assert.equal(ionicCharge([cr,{...cl,concentrationMolPerL:.01}],catalog,50).balanced,false)
 assert.throws(()=>prepareWetLabStocks(setup([cr]),0,catalog),/counterions/)
 assert.throws(()=>balanceIonicPair([cr,cr],catalog),/opposite/)
 assert.throws(()=>prepareWetLabStocks(setup([cr,cl]),0,{...catalog}),/metadata/)
 assert.throws(()=>prepareWetLabStocks(setup([{...cr,concentrationMolPerL:-1},cl]),0,catalog),/Nonnegative/)
})
test('mixed reviewed and ionic contributions retain a single physical preparation',()=>{
 const stocks=prepareWetLabStocks(setup([cr,cl,{id:'b',reagent:'B(OH)3',concentrationMolPerL:.001}]),0,catalog)
 assert.equal(stocks.sample.moles.boron,.00005)
 assert.equal(stocks.sample.contributions.length,3)
 assert.equal(stocks.sample.contributions[0].automaticAdditions.length,0)
})
test('Cu source preparation is conditional without atom metadata; exclusions respected',async()=>{
 const cu=catalog.forms.find(c=>c.id==='component:Cu%202%2B');assert.ok(cu)
 const unsupported=setup([ion('cu',cu.id,.01),{...cl,concentrationMolPerL:.02}])
 const p=await preflightWetLab(repo,unsupported,system,0,catalog)
 assert.equal(p.status,'CONDITIONAL',p.reason)
 const excluded=await preflightWetLab(repo,setup([cr,cl]),{...system,excludedComponents:[cr.sourceId]},0,catalog)
 assert.equal(excluded.status,'UNAVAILABLE');assert.match(excluded.reason,/excluded/)
})
test('non-chromium sodium chloride uses identical generic preparation and compiler route',async()=>{
 const s=setup([ion('na','component:Na%2B',.01),{...cl,concentrationMolPerL:.01}])
 const aqueous={enabledPhases:['aqueous']};const p=await preflightWetLab(repo,s,aqueous,2,catalog);assert.equal(p.status,'CONDITIONAL',p.reason)
 const context=await prepareWetLabScope(repo,p.stocks,aqueous,2)
 const q=await solveMixedSolution(context,p.stocks.sample,{revision:2})
 assert.equal(q.result.status,'converged')
})
test('ionic Cr titration matches all saved independent doses and existing shared analytical views',async()=>{
 const stocks=prepareWetLabStocks(setup([cr,cl]),3,catalog),context=await prepareWetLabScope(repo,stocks,system,3)
 const refs=JSON.parse(fs.readFileSync('docs/cr-reagent-independent-reference.json')).points
 const series=await runTitration(context,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,revision:3,additionVolumesMl:refs.map(p=>p.volumeMl)})
 for(const [i,state] of series.states.entries()){
  const ref=refs[i];assert.equal(state.status,'accepted-v0');assert.ok(Math.abs(state.pH-ref.reference.pH)<1e-8)
  assert.ok(Math.abs(state.equilibrium.derived.pe-ref.reference.pe)<1e-8)
  for(const c of ref.reference.carriers){const got=state.equilibrium.derived.carriers.find(a=>a.name===c.name);assert.ok(got);assert.ok(Math.abs(got.amount-c.amount)<1e-10)}
  assert.ok(Math.abs(state.equilibrium.derived.elements.Cr.solidBound-ref.solidCr)<1e-10)
 }
 const analysis=createWetLabAnalysis({snapshot:()=>({points:series.curve}),validate:p=>p.state})
 for(const type of ['total-fraction','aqueous-fraction']){
  const view=analysis.view(type,'element:Cr');assert.ok(view.available)
  for(let i=0;i<refs.length;i++)assert.ok(Math.abs(view.series.reduce((n,s)=>n+(s.points[i].value??0),0)-1)<1e-8)
 }
 assert.equal(analysis.inspect(series.curve[0]),series.states[0])
 assert.ok(analysis.view('log-concentration').series.some(s=>s.phase==='solid'))
})

