import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {prepareStockSolution,volumeConvention,dispenseVolume,mixSolutions} from '../src/calculations/wetLabSolutions.js'
import {prepareWetLab,runTitration,selectTitrationState,solveMixedSolution} from '../src/calculations/wetLabTitration.js'
import {strongAcidBaseReference,benchmarkAdditions} from '../scripts/validation/wetLabReference.js'
const raw=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')),repo=createRepository(raw)
const context=await prepareWetLab(repo),logKw=raw.species.find(s=>s.id==='spana:2ac52a30213c9288:250448').logK
const stock=(reagent,volumeMl=100)=>prepareStockSolution({reagent,volumeMl,concentrationMolPerL:.1,temperatureC:25,convention:volumeConvention.id})
const acid=stock('HCl',50),base=stock('NaOH'),request={analyteStock:acid,analyteVolumeMl:50,titrantStock:base,additionVolumesMl:benchmarkAdditions,revision:3}
const series=await runTitration(context,request)
const near=(a,b,t=1e-14)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`)
test('18 independent acid/water/base controls agree without a production titration formula',()=>{
 assert.equal(series.states.length,18)
 for(const s of series.states){const r=strongAcidBaseReference(s.titrantVolumeAddedMl,logKw)
  assert.equal(s.status,'accepted-v0');near(s.pH,r.pH,1e-9)
  assert.equal(s.equilibrium.result.scientificValidation,'passed')
  assert.ok(s.equilibrium.system.components.every(c=>c.role!=='electron'))
  assert.deepEqual(s.equilibrium.result.solids,[])
  const result=s.equilibrium.result
  result.residuals.componentBalance.forEach((r,i)=>{if(r!==null)assert.ok(Math.abs(r)<=result.residuals.componentBalanceLimits[i])})
 }
 near(series.states[9].pH,-logKw/2,1e-12)
 assert.equal(series.states[9].analyticalMoles.protonEquivalent,0)
})
test('volume and counterion moles are conserved before/at/after equivalence',()=>{
 for(const s of series.states){const v=s.titrantVolumeAddedMl
  assert.equal(s.totalVolumeMl,50+v);assert.equal(s.titrantRemainingMl,100-v)
  near(s.analyticalMoles.Cl,.005);near(s.analyticalMoles.Na,.1*v/1000)
  near(s.analyticalMoles.protonEquivalent,.005-.1*v/1000)
  near(s.analyticalMoles.protonEquivalent+s.analyticalMoles.Na-s.analyticalMoles.Cl,0)
  assert.equal(s.mixture.modelSolventMassKg,(50+v)/1000)
  assert.equal(s.mixture.measuredSolventMassKg,null)
 }
 for(const [v,total] of [[0,50],[25,75],[50,100],[100,150]])assert.equal(series.states.find(s=>s.titrantVolumeAddedMl===v).totalVolumeMl,total)
})
test('curve, selected point and Beaker retain the same exact equilibrium object',()=>{
 for(const [i,p] of series.curve.entries()){
  const s=selectTitrationState(series,i,{seriesId:series.id,revision:3})
  assert.equal(s,p.state);assert.equal(p.y,s.pH);assert.equal(p.x,s.titrantVolumeAddedMl)
  assert.equal(s.equilibrium.inspection.result,s.equilibrium.result)
  assert.equal(s.equilibrium.inspection.input,s.equilibrium.input)
  assert.equal(s.equilibrium.inspection.pH,s.pH);assert.ok(Object.isFrozen(s.mixture.moles))
 }
})
test('each dose is independently reproducible, including reordered and duplicate totals',async()=>{
 const another=await runTitration(context,{...request,additionVolumesMl:[100,0,50,50,49.99]})
 for(const s of another.states){const original=series.states.find(p=>p.titrantVolumeAddedMl===s.titrantVolumeAddedMl)
  assert.equal(s.pH,original.pH);assert.deepEqual(s.analyticalMoles,original.analyticalMoles)
  const rerun=await solveMixedSolution(context,s.mixture,{revision:3});assert.deepEqual(rerun.result,original.equilibrium.result)
 }
 assert.notEqual(another.states[2].id,another.states[3].id)
})
test('dispensing returns conserved aliquot and finite remainder without mutating the stock',()=>{
 const a=dispenseVolume(base,.01),b=dispenseVolume(a.remainder,.1),c=dispenseVolume(b.remainder,1)
 assert.equal(base.volumeMl,100)
 const restored=mixSolutions(a.aliquot,b.aliquot,c.aliquot,c.remainder)
 near(restored.volumeMl,100);for(const k of Object.keys(base.moles))near(restored.moles[k],base.moles[k])
 const all=dispenseVolume(base,100);assert.equal(all.remainder.volumeMl,0)
 assert.throws(()=>dispenseVolume(all.remainder,.01),{code:'invalid-dispense'})
})
test('mix two entire beakers uses the same physical and equilibrium preparation',async()=>{
 const mixed=mixSolutions(acid,base),s=series.states.at(-1),r=await solveMixedSolution(context,mixed,{revision:3})
 assert.deepEqual(mixed.moles,s.analyticalMoles);assert.equal(mixed.volumeMl,150);assert.equal(r.pH,s.pH)
})
test('invalid concentrations, volumes, conventions and arbitrary recipes are refused',()=>{
 const valid={reagent:'HCl',volumeMl:50,concentrationMolPerL:.1,temperatureC:25,convention:volumeConvention.id}
 for(const concentrationMolPerL of [0,-1,NaN,Infinity])assert.throws(()=>prepareStockSolution({...valid,concentrationMolPerL}),{code:'invalid-stock'})
 for(const volumeMl of [0,-1,NaN,Infinity])assert.throws(()=>prepareStockSolution({...valid,volumeMl}),{code:'invalid-stock'})
 assert.throws(()=>prepareStockSolution({...valid,convention:'density-one'}),{code:'incompatible-convention'})
 assert.throws(()=>prepareStockSolution({...valid,temperatureC:30}),{code:'incompatible-convention'})
 for(const reagent of ['H+', {components:{protonEquivalent:1}},'constructor','NaCl'])assert.throws(()=>prepareStockSolution({...valid,reagent}),{code:'unsupported-reagent'})
 assert.throws(()=>prepareStockSolution({...valid,recipe:{charge:1}}),{code:'invalid-stock'})
 for(const v of [-.01,101,NaN,Infinity])assert.throws(()=>dispenseVolume(base,v),{code:'invalid-dispense'})
})
test('forged preparations, mismatched selections and stale runs cannot provide a current result',async()=>{
 assert.throws(()=>dispenseVolume({...base},1),{code:'forged-preparation'})
 assert.throws(()=>mixSolutions(acid,{...base}),{code:'incompatible-preparation'})
 for(const [s,i,r] of [[{...series},0,3],[series,-1,3],[series,18,3],[series,0,4]])assert.throws(()=>selectTitrationState(s,i,{seriesId:series.id,revision:r}),{code:'stale-or-mismatched-state'})
 assert.throws(()=>selectTitrationState(series,0,{seriesId:'other',revision:3}),{code:'stale-or-mismatched-state'})
 await assert.rejects(runTitration(context,request,{isCurrent:()=>false}),{code:'stale-titration'})
 let count=0;await assert.rejects(runTitration(context,request,{isCurrent:()=>++count<2}),{code:'stale-titration'})
 await assert.rejects(solveMixedSolution({...context},series.states[0].mixture),{code:'invalid-preparation'})
})
test('changed thermodynamic provenance fails preparation instead of silently reusing benchmark evidence',async()=>{
 const drift={...repo,getSpeciesById:id=>({...repo.getSpeciesById(id),logK:-14})}
 await assert.rejects(prepareWetLab(drift),{code:'source-identity-mismatch'})
})
test('fractional additions and changed analytical quantities are not snapped to nominal equivalence',async()=>{
 const r=await runTitration(context,{...request,analyteVolumeMl:25,additionVolumesMl:[.0137,24.99,25,25.01]})
 assert.equal(r.states[0].titrantVolumeAddedMl,.0137);near(r.states[2].pH,7.00075,1e-12)
 assert.ok(r.states[1].pH<7&&r.states[3].pH>7)
 await assert.rejects(runTitration(context,{...request,additionVolumesMl:[0,101]}),{code:'invalid-dispense'})
 await assert.rejects(runTitration(context,{...request,analyteVolumeMl:0}),{code:'invalid-analyte'})
})
