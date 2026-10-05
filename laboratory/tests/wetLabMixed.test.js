import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {createWorkspaceSession} from '../src/session/laboratorySession.js'
import {prepareSolution,dispenseVolume,mixSolutions,volumeConvention} from '../src/calculations/wetLabSolutions.js'
import {mixedWetLabSetup,prepareWetLabStocks} from '../src/calculations/wetLabSetup.js'
import {prepareWetLabScope,runTitration,solveMixedSolution} from '../src/calculations/wetLabTitration.js'
import {createWetLabExperience} from '../src/calculations/wetLabExperience.js'
import {createWetLabAnalysis} from '../src/calculations/wetLabAnalysis.js'
import {totalFractionState} from '../src/calculations/totalFractions.js'
import {aqueousFractionState} from '../src/calculations/aqueousFractions.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const chemicalSystem=createWorkspaceSession(repo).chemicalSystem
const reference=JSON.parse(fs.readFileSync('docs/mixed-solution-feasibility.json')).benchmark.filter(p=>[0,5,10,15,20,100].includes(p.volumeMl))
const stocks=prepareWetLabStocks(mixedWetLabSetup,7)
const A='component:CH3COO-',B='component:B(OH)3',cross='spana:2ac52a30213c9288:36848'

test('N physical contributions occupy one final volume and retain immutable source provenance',()=>{
 const s=stocks.sample
 assert.equal(s.volumeMl,50);assert.equal(s.modelSolventMassKg,.05)
 assert.equal(s.moles.acetate,.001);assert.equal(s.moles.boron,.001);assert.equal(s.totalPhysicalMoles,.002)
 assert.equal(s.chargeEquivalents,0);assert.equal(s.preparationRevision,7)
 for(const row of s.contributions){assert.ok(row.sourceId);assert.ok(row.provenance);assert.equal(row.metadataVersion,'network-composition-v2');assert.deepEqual(row.automaticAdditions,[]);assert.ok(Object.isFrozen(row))}
 const {aliquot,remainder}=dispenseVolume(s,20)
 assert.equal(aliquot.volumeMl,20);assert.equal(remainder.volumeMl,30)
 assert.equal(aliquot.moles.boron,.0004);assert.equal(aliquot.moles.acetate,.0004)
 const restored=mixSolutions(aliquot,remainder);assert.equal(restored.volumeMl,50);assert.equal(restored.moles.boron,.001)
 const mixed=mixSolutions(s,dispenseVolume(stocks.titrant,5).aliquot)
 assert.equal(mixed.volumeMl,55);assert.ok(Math.abs(mixed.moles.Na-.0005)<1e-18);assert.equal(mixed.moles.acetate,.001)
 assert.throws(()=>mixSolutions(s,prepareWetLabStocks(mixedWetLabSetup,8).sample),{code:'stale-preparation'})
})

test('invalid, duplicate and forged rows cannot define recipes or source identities',()=>{
 const request={...mixedWetLabSetup.sample,temperatureC:25,convention:volumeConvention.id}
 for(const volumeMl of [0,-1,NaN,Infinity])assert.throws(()=>prepareSolution({...request,volumeMl}))
 for(const concentrationMolPerL of [0,-1,NaN,Infinity])assert.throws(()=>prepareSolution({...request,contributions:[{...request.contributions[0],concentrationMolPerL}]}))
 for(const contributions of [[],[request.contributions[0],request.contributions[0]],[{...request.contributions[0],sourceId:B}],[{...request.contributions[0],reagent:'HNO3'}]])assert.throws(()=>prepareSolution({...request,contributions}))
 assert.throws(()=>dispenseVolume({...stocks.sample},1),{code:'forged-preparation'})
})

test('mixed Wet Lab reproduces saved independent carriers and all six pH controls; views/hover preserve identities',async t=>{
 const before=JSON.stringify(chemicalSystem),start=performance.now()
 const e=await createWetLabExperience(repo,{chemicalSystem,setup:mixedWetLabSetup,revision:7}),preparedMs=performance.now()-start
 assert.equal(JSON.stringify(chemicalSystem),before)
 const snapshot=e.snapshot(),analysis=createWetLabAnalysis(e)
 assert.equal(snapshot.points.length,101);assert.ok(snapshot.points.every(p=>p.state.status==='accepted-v0'))
 assert.equal(snapshot.scope.boundary,'closed-physical-nonredox')
 const evidence=[]
 for(const expected of reference){const p=snapshot.points.find(p=>p.x===expected.volumeMl);if(!p)continue
  const state=p.state,q=state.equilibrium
  assert.ok(Math.abs(state.pH-expected.pH)<1e-9)
  assert.equal(state.totalVolumeMl,50+p.x);assert.equal(state.titrantRemainingMl,100-p.x)
  assert.equal(state.analyticalMoles.acetate,.001);assert.equal(state.analyticalMoles.boron,.001)
  assert.equal(q.inspection.result,q.result);assert.equal(q.compilerResult.accepted,q.result)
  assert.equal(q.compilerResult.notDetermined.Eh.status,'not-determined');assert.ok(q.result.solids.every(s=>s.amount===0))
  const errors=[...q.system.components,...q.system.products].filter(c=>c.role!=='water'&&c.phase!=='solid').map(c=>{
   const actual=q.result.concentrations[q.result.speciesIds.indexOf(c.id)],target=expected.amounts[c.name]
   assert.ok(Number.isFinite(target),c.name);assert.ok(Math.abs(actual-target)<1e-10*Math.max(1,Math.abs(target)),c.name)
   assert.ok(Math.abs(Math.log10(actual/target))<1e-8,c.name)
   return Math.abs(actual-target)
  })
  evidence.push({mL:p.x,pH:state.pH,pHError:state.pH-expected.pH,maxCarrierError:Math.max(...errors),timing:q.compilerResult.timing})
 }
 assert.equal(evidence.length,6)
 for(const type of ['total-fraction','aqueous-fraction'])for(const family of [A,B]){
  const view=analysis.view(type,family);assert.ok(view.available);assert.ok(view.series.some(s=>s.id===cross))
  for(const p of snapshot.points){const q=p.state.equilibrium,expected=type==='total-fraction'?totalFractionState(q.system,q.input,q.result,family):aqueousFractionState(q.system,q.result,family)
   const values=view.series.map(s=>s.points.find(v=>v.state===p.state));assert.ok(Math.abs(values.reduce((n,v)=>n+(v.value??0),0)-1)<1e-8)
   for(const s of view.series){const v=s.points.find(v=>v.state===p.state);assert.equal(v.result,q.result);assert.equal(v.value,expected.contributors.find(c=>c.id===s.id)?.fraction??null)}
  }
 }
 const q=snapshot.points.find(p=>p.x===15).state.equilibrium
 for(const [suffix,n] of [[38021,2],[38284,3],[38377,4]])assert.equal(q.system.products.find(p=>p.id===`spana:2ac52a30213c9288:${suffix}`).coefficients[q.system.componentIndex[B]],n)
 assert.ok(analysis.view('log-concentration').series.some(s=>s.id===cross))
 e.select(snapshot.points[5]);const committed=e.snapshot().selected,interactionStart=performance.now()
 for(let i=0;i<1000;i++){const p=snapshot.points[i%101];assert.equal(e.preview(p).displayed,p.state);assert.equal(e.snapshot().selected,committed);analysis.view(i%2?'total-fraction':'aqueous-fraction',i%3?A:B)}
 const interactionMs=performance.now()-interactionStart
 assert.equal(e.clearPreview().displayed,committed);assert.equal(e.select(snapshot.points[15]).selected,snapshot.points[15].state)
 assert.equal(e.snapshot().solveRuns,1);e.dispose();assert.throws(()=>analysis.view('titration'))
 t.diagnostic(JSON.stringify({preparedMs,interactionMs,evidence}))
})

test('scope checks respect exclusions, refuse stale/forged stocks and do not fall back for chloride/borate',async()=>{
 await assert.rejects(prepareWetLabScope(repo,{...stocks,sample:{...stocks.sample}},chemicalSystem,7),{code:'invalid-preparation'})
 await assert.rejects(prepareWetLabScope(repo,stocks,chemicalSystem,8),{code:'invalid-preparation'})
 await assert.rejects(prepareWetLabScope(repo,stocks,{...chemicalSystem,excludedSpecies:[cross]},7),{code:'explicit-scope-exclusion'})
 const chloride=structuredClone(mixedWetLabSetup);chloride.titrant.contributions[0].reagent='HCl'
 await assert.rejects(prepareWetLabScope(repo,prepareWetLabStocks(chloride,7),chemicalSystem,7),{code:'unsupported-boundary'})
 const ctx=await prepareWetLabScope(repo,stocks,chemicalSystem,7)
 await assert.rejects(solveMixedSolution(ctx,stocks.sample,{revision:8}),{code:'stale-preparation'})
 await assert.rejects(runTitration(ctx,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,additionVolumesMl:[0],revision:7},{isCurrent:()=>false}),{code:'stale-titration'})
})

test('required phase closure stays an unavailable Wet Lab sample, never accepted aqueous fallback',async()=>{
 const setup=structuredClone(mixedWetLabSetup);setup.sample.contributions=[{id:'boric',reagent:'B(OH)3',concentrationMolPerL:10}]
 const s=prepareWetLabStocks(setup,3),ctx=await prepareWetLabScope(repo,s,{...chemicalSystem,enabledPhases:['aqueous']},3)
 const series=await runTitration(ctx,{analyteStock:s.sample,analyteVolumeMl:50,titrantStock:s.titrant,additionVolumesMl:[0],revision:3})
 assert.equal(series.states[0].status,'unavailable');assert.equal(series.curve[0].y,null)
 assert.ok(series.states[0].diagnostics.some(d=>d.code==='unsupported-phase-closure'));assert.equal(series.states[0].equilibrium.result,undefined)
})
