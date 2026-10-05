import test from 'node:test'
import assert from 'node:assert/strict'
import {parityPoint,repo,ids,solidIds} from '../scripts/validation/wetLabSolidsBenchmark.js'
import {acceptedState} from '../src/beaker/acceptedState.js'
import {totalFractionState} from '../src/calculations/totalFractions.js'
import {aqueousFractionState} from '../src/calculations/aqueousFractions.js'
import {numericalValidationContract as tolerance} from '../src/solver/validationContract.js'
const points=await Promise.all([0,10,20,30,50].map(parityPoint))
export {points}
test('physical pure-solid states match ordinary Calculation and independent raw-source reference',()=>{
 for(const p of points){
  const r=p.physical.accepted,s=p.compiled.preparedSystemInput.system
  assert.ok(p.calculation.ok);assert.equal(p.physical.notDetermined.Eh.status,'not-determined')
  assert.ok(Math.abs(p.physical.derived.pH-p.reference.pH)<1e-9)
  for(const c of [...s.components,...s.products].filter(c=>c.role!=='water')){
   const i=r.speciesIds.indexOf(c.id),amount=r.concentrations[i],other=p.calculation.concentrations[p.calculation.speciesIds.indexOf(c.id)]
   assert.ok(Math.abs(amount-other)<tolerance.comparisonAbsoluteConcentrationTolerance+tolerance.comparisonRelativeConcentrationTolerance*Math.abs(amount),c.name)
   const target=(c.phase==='solid'?p.reference.phases:p.reference.carriers).find(q=>q.name===c.name)
   assert.ok(target,c.name);assert.ok(Math.abs(amount-target.amount)<tolerance.comparisonAbsoluteConcentrationTolerance+tolerance.comparisonRelativeConcentrationTolerance*Math.abs(target.amount),c.name)
  }
  assert.ok(p.physical.charge.ok);assert.ok(p.reference.maximumMassActionResidual<1e-10)
  r.residuals.componentBalance.forEach((b,i)=>{if(b!==null)assert.ok(Math.abs(b)<=r.residuals.componentBalanceLimits[i])})
  for(const solid of r.solids){assert.ok(solidIds.includes(solid.id));assert.ok(solid.amount>=0);assert.ok(solid.amount>0?Math.abs(solid.logSaturation)<=r.saturationTolerance:solid.logSaturation<=r.saturationTolerance);assert.ok(Math.abs(solid.logSaturation-p.reference.phases.find(q=>q.id===solid.id).logSaturation)<1e-9)}
  const f=totalFractionState(s,p.compiled.preparedSystemInput.input,r,ids.B),a=aqueousFractionState(s,r,ids.B)
  assert.ok(f.ok);assert.ok(a.ok);assert.ok(Math.abs(f.sumFractions-1)<1e-9);assert.ok(Math.abs(a.contributors.reduce((n,c)=>n+c.fraction,0)-1)<1e-9)
  assert.ok(Math.abs(f.totalDissolved-p.calculation.dissolvedComponentAmounts[p.calculationSystem.componentIndex[ids.B]])<1e-10)
 }
})
test('permitted phases remain exactly absent, then precipitate and redissolve without sediment leakage',()=>{
 for(const p of points){const {system,input}=p.compiled.preparedSystemInput,r=p.physical.accepted,inspection=acceptedState(system,input,r),present=[20,30].includes(p.v)
  assert.equal(inspection.visual.bedHeight>0,present)
  if(!present)assert.ok(r.solids.every(s=>s.amount===0))
  else {const solid=r.solids.find(s=>s.amount>0);assert.equal(solid.id,solidIds[1]);const f=totalFractionState(system,input,r,ids.B),c=f.contributors.find(c=>c.id===solid.id);assert.equal(c.coefficient,4);assert.equal(c.componentAmount,4*solid.amount);assert.ok(f.totalDissolved<f.total)}
 }
})

import {prepareWetLabStocks,solidWetLabSetup} from '../src/calculations/wetLabSetup.js'
import {prepareWetLabScope,runTitration} from '../src/calculations/wetLabTitration.js'
import {createWorkspaceSession} from '../src/session/laboratorySession.js'
import {createWetLabExperience} from '../src/calculations/wetLabExperience.js'
import {createWetLabAnalysis} from '../src/calculations/wetLabAnalysis.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork} from '../src/thermodynamics/equilibriumNetwork.js'
import {createRepository} from '../src/thermodynamics/repository.js'
import fs from 'node:fs'
const chemicalSystem=createWorkspaceSession(repo).chemicalSystem

test('Wet Lab independent physical doses preserve point parity and inventory lineage',async()=>{
 const stocks=prepareWetLabStocks(solidWetLabSetup,4),scope=await prepareWetLabScope(repo,stocks,chemicalSystem,4)
 const series=await runTitration(scope,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,additionVolumesMl:points.map(p=>p.v),revision:4})
 for(const state of series.states){const p=points.find(p=>p.v===state.titrantVolumeAddedMl),q=state.equilibrium
  assert.equal(state.status,'accepted-v0');assert.ok(Math.abs(state.pH-p.physical.derived.pH)<1e-10);assert.equal(state.totalVolumeMl,50+p.v)
  assert.equal(state.mixture.moles.boron,stocks.sample.moles.boron);assert.equal(q.inspection.result,q.result);assert.equal(q.inspection.input,q.input)
  for(const solid of q.result.solids)assert.ok(Math.abs(solid.amount-p.physical.accepted.solids.find(s=>s.id===solid.id).amount)<1e-12)
 }
})
test('source candidate ordering preserves physical result; gas and redox stay refused',async()=>{
 const raw=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json'));raw.species.reverse()
 const c=await compileEquilibriumNetwork(createRepository(raw),points[2].request),r=solveEquilibriumNetwork(c)
 assert.ok(r.ok);assert.equal(r.derived.pH,points[2].physical.derived.pH)
 for(const solid of r.accepted.solids)assert.equal(solid.amount,points[2].physical.accepted.solids.find(s=>s.id===solid.id).amount)
 const gas=structuredClone(points[2].request);gas.preparation.contributions=[{id:'acid',sourceId:'spana:2ac52a30213c9288:79298',moles:10000,provenance:'Gas refusal control'}]
 const gc=await compileEquilibriumNetwork(repo,gas),gr=solveEquilibriumNetwork(gc);assert.equal(gr.ok,false);assert.equal(gr.diagnostics[0].code,'unsupported-phase-closure')
 const redox=structuredClone(points[2].request);redox.preparation.contributions=[{id:'Fe',sourceId:'component:Fe%202%2B',moles:1e-6,provenance:'Redox refusal control'},{id:'Cl',sourceId:'component:Cl-',moles:.010002,provenance:'Intrinsic counterion control'},{id:'H',sourceId:ids.H,moles:.01,provenance:'Acid control'}]
 const rc=await compileEquilibriumNetwork(repo,redox);assert.equal(rc.ok,false);assert.equal(rc.diagnostics[0].code,'redox-boundary-mismatch')
})
test('cached hover crosses phase transition and restores exact commitment without solving',async()=>{
 const engine=await createWetLabExperience(repo,{chemicalSystem,setup:solidWetLabSetup,revision:8}),snapshot=engine.snapshot(),analysis=createWetLabAnalysis(engine)
 assert.ok(snapshot.points.every(p=>p.state.status==='accepted-v0'))
 const absent=snapshot.points.find(p=>p.x===10),present=snapshot.points.find(p=>p.x===20)
 engine.select(absent);const runs=engine.snapshot().solveRuns
 const preview=engine.preview(present);assert.equal(preview.selected,absent.state);assert.equal(preview.displayed,present.state);assert.ok(preview.displayed.equilibrium.inspection.visual.bedHeight>0)
 const total=analysis.view('total-fraction',ids.B),aqueous=analysis.view('aqueous-fraction',ids.B)
 assert.ok(total.series.some(s=>s.phase==='solid'));assert.ok(aqueous.series.every(s=>s.phase!=='solid'))
 const logs=analysis.view('log-concentration')
 assert.ok(logs.series.some(s=>s.phase==='aqueous'));assert.ok(logs.series.some(s=>s.phase==='solid'))
 for(const series of logs.series.filter(s=>s.phase==='solid'))for(const point of [absent,present]){
  const plotted=series.points.find(p=>p.state===point.state),result=point.state.equilibrium.result,solid=result.solids.find(s=>s.id===series.id)
  assert.equal(plotted.result,result)
  if(solid.amount>0)assert.ok(Math.abs(plotted.value-Math.log10(solid.amount))<1e-12)
  else assert.equal(plotted.value,null)
 }
 for(const view of [total,aqueous]){const values=view.series.map(s=>s.points.find(p=>p.state===present.state));assert.ok(Math.abs(values.reduce((n,p)=>n+(p.value??0),0)-1)<1e-9);assert.ok(values.every(p=>p.result===present.state.equilibrium.result))}
 assert.equal(engine.clearPreview().displayed,absent.state);assert.equal(engine.snapshot().displayed.equilibrium.inspection.visual.bedHeight,0);assert.equal(engine.snapshot().solveRuns,runs)
 engine.dispose();assert.throws(()=>engine.preview(present));
})
