import {selectedSystem} from './helpers/wetLabCalculationParity.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {analyticalWetLabSetup,defaultWetLabSetup,prepareWetLabStocks} from '../src/calculations/wetLabSetup.js'
import {loadWetLabIons} from '../src/calculations/wetLabIons.js'
import {createWetLabExperience} from '../src/calculations/wetLabExperience.js'
import {createWetLabAnalysis,nearestWetLabPoint} from '../src/calculations/wetLabAnalysis.js'
import {prepareWetLabScope,runTitration} from '../src/calculations/wetLabTitration.js'
import {preflightWetLab} from '../src/calculations/wetLabPreflight.js'
import {dispenseVolume,mixSolutions} from '../src/calculations/wetLabSolutions.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json'))),catalog=await loadWetLabIons(repo)
const system=selectedSystem(repo,[]),H='component:H%2B',OH='spana:2ac52a30213c9288:250448',A='component:CH3COO-'
const setup=()=>{const s=structuredClone(analyticalWetLabSetup);s.sample.contributions[0].sourceId=OH;s.titrant.contributions[0].sourceId=H;for(const p of Object.values(s))p.contributions[0].concentrationMolPerL=1;return s}
function balances(q){assert.equal(q.result.scientificValidation,'passed');q.result.residuals.componentBalance.forEach((r,i)=>{if(Number.isFinite(r))assert.ok(Math.abs(r)<=q.result.residuals.componentBalanceLimits[i])});assert.ok(q.result.residuals.massActionLog.every(r=>Math.abs(r)<1e-8))}
test('analytical H and OH stocks retain signed coordinates, specified charge and no counterions',()=>{
 const s=prepareWetLabStocks(setup(),4,catalog);assert.equal(s.sample.preparationContract,'analytical-acid-base');assert.deepEqual(s.sample.moles,{protonEquivalent:-.05});assert.deepEqual(s.titrant.moles,{protonEquivalent:.1});assert.equal(s.sample.chargeEquivalents,-.05);assert.equal(s.titrant.chargeEquivalents,.1);assert.match(s.sample.chargeDisclosure,/countercharge unspecified/)
 const m=mixSolutions(s.sample,dispenseVolume(s.titrant,25).aliquot);assert.equal(m.volumeMl,75);assert.equal(m.moles.protonEquivalent,-.025);assert.equal(m.contributions.flatMap(r=>r.automaticAdditions).length,0)
 assert.throws(()=>mixSolutions(s.sample,prepareWetLabStocks(setup(),5,catalog).sample),/revision/)
})
test('production analytical titration matches every preceding audit dose and shares exact cached states across views',async()=>{
 const start=performance.now(),e=await createWetLabExperience(repo,{chemicalSystem:system,setup:setup(),revision:4}),elapsed=performance.now()-start,s=e.snapshot(),ref=JSON.parse(fs.readFileSync('docs/analytical-acid-base-audit-reference.json'))
 assert.equal(s.points.length,107);assert.equal(s.solveRuns,1)
 for(const point of s.points){const q=point.state.equilibrium,expected=ref.points.find(r=>r.doseMl===point.x);assert.ok(expected);assert.equal(point.state.status,'accepted-v0',JSON.stringify({dose:point.x,diagnostics:q.diagnostics}));balances(q);assert.ok(Math.abs(point.y-expected.pH)<1e-10);assert.deepEqual(q.result.speciesIds,[H,'component:H2O',OH]);assert.equal(point.state.totalVolumeMl,50+point.x)}
 const point=nearestWetLabPoint(s.points,50.009),selected=e.select(point).selected;assert.equal(selected,point.state)
 const analysis=createWetLabAnalysis(e),before=e.snapshot().solveRuns,viewStart=performance.now()
 for(let i=0;i<10;i++)for(const type of ['titration','log-concentration','log-activity','total-fraction','aqueous-fraction']){analysis.view(type);assert.equal(analysis.inspect(point),selected)}
 assert.equal(e.snapshot().selected,selected);assert.equal(e.snapshot().solveRuns,before);assert.equal(analysis.view('total-fraction').available,false)
 console.log(JSON.stringify({analyticalPreparationMs:elapsed,viewSwitchMs:performance.now()-viewStart,doses:107,seriesSolveRuns:before}))
 e.dispose();assert.throws(()=>e.select(point),/current/)
})
test('analytical nonzero charge admits; redox and explicit exclusions refuse for their real reasons',async()=>{
 const p=await preflightWetLab(repo,setup(),system,0,catalog);assert.equal(p.status,'CONDITIONAL',p.reason);assert.match(p.scope.reason,/countercharge unspecified/)
 const cr=setup();cr.sample.contributions[0].sourceId='component:Cr%203%2B';const admitted=await preflightWetLab(repo,cr,system,0,catalog);assert.equal(admitted.status,'CONDITIONAL',admitted.reason)
 const blocked=await preflightWetLab(repo,cr,{...system,excludedComponents:['component:Cr%203%2B']},0,catalog);assert.equal(blocked.status,'UNAVAILABLE')
 const excluded=await preflightWetLab(repo,setup(),{...system,excludedSpecies:[OH]},0,catalog);assert.equal(excluded.status,'UNAVAILABLE');assert.match(excluded.reason,/excluded/)
})
test('weak acetic acid uses source equilibrium, buffer speciation, fractions and closure',async()=>{
 const s=structuredClone(analyticalWetLabSetup)
 s.sample.contributions[0].sourceId='spana:2ac52a30213c9288:79298';s.titrant.contributions[0].sourceId=OH
 const e=await createWetLabExperience(repo,{chemicalSystem:selectedSystem(repo,[A]),setup:s}),points=e.snapshot().points,analysis=createWetLabAnalysis(e)
 const initial=points.find(p=>p.x===0),half=points.find(p=>p.x===25),eq=points.find(p=>p.x===50)
 assert.ok(initial.y>2.8&&initial.y<3);assert.ok(half.y>4.7&&half.y<4.8);assert.ok(eq.y>8.6&&eq.y<8.9)
 const acid=repo.getSpeciesById('spana:2ac52a30213c9288:79298');const q=half.state.equilibrium,ha=q.result.concentrations[q.result.speciesIds.indexOf(acid.id)],a=q.result.concentrations[q.result.speciesIds.indexOf(A)]
 assert.ok(Math.abs(half.y-(acid.logK+Math.log10(a/ha)))<1e-8)
 for(const p of points){assert.equal(p.state.status,'accepted-v0');balances(p.state.equilibrium)}
 for(const type of ['total-fraction','aqueous-fraction']){const v=analysis.view(type,A);assert.equal(v.available,true);for(let i=0;i<points.length;i++)assert.ok(Math.abs(v.series.reduce((n,s)=>n+(s.points[i].value??0),0)-1)<1e-8)}
 console.log(JSON.stringify({weakAcidPH:[initial.y,half.y,eq.y],doses:points.length}));e.dispose()
})
test('borate source chemistry admits without custom acid-base equations',async()=>{
 const s=structuredClone(analyticalWetLabSetup);s.sample.contributions[0].sourceId='component:B(OH)3';s.titrant.contributions[0].sourceId=OH
 const p=await preflightWetLab(repo,s,selectedSystem(repo,['component:B(OH)3']),0,catalog);assert.equal(p.status,'CONDITIONAL',p.reason);assert.ok(p.scope.reactions.includes('spana:2ac52a30213c9288:37016'))
})
test('physical stock neutrality and reviewed source contributions remain enforced',()=>{
 const p=prepareWetLabStocks(defaultWetLabSetup,0,catalog);assert.equal(p.sample.preparationContract,'physical');assert.equal(p.sample.chargeEquivalents,0);assert.ok(p.sample.moles.Cl>0);assert.ok(p.titrant.moles.Na>0)
 const physical=structuredClone(defaultWetLabSetup);physical.sample={volumeMl:50,contributions:[{id:'h',kind:'ionic',sourceId:H,concentrationMolPerL:1}]};assert.throws(()=>prepareWetLabStocks(physical,0,catalog),/counterions/)
})

test('explicit counterions retain their source chemistry and unknown stock definitions cannot fall back',async()=>{
 const s=setup();s.sample.contributions.push({id:'na',kind:'component',sourceId:'component:Na%2B',concentrationMolPerL:.1})
 const stocks=prepareWetLabStocks(s,0,catalog),ctx=await prepareWetLabScope(repo,stocks,selectedSystem(repo,['component:Na%2B']),0),series=await runTitration(ctx,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,revision:0,additionVolumesMl:[0,50,100]})
 for(const q of series.states){assert.equal(q.status,'accepted-v0');assert.ok(q.equilibrium.result.speciesIds.includes('component:Na%2B'));assert.ok(q.equilibrium.result.speciesIds.includes('spana:2ac52a30213c9288:224689'));balances(q.equilibrium)}
 s.sample.contributions.push({id:'cl',kind:'component',sourceId:'component:Cl-',concentrationMolPerL:.1});const p=await preflightWetLab(repo,s,system,0,catalog);assert.equal(p.status,'CONDITIONAL',p.reason)
 s.sample.preparationContract='unknown';assert.throws(()=>prepareWetLabStocks(s,0,catalog),/Unknown stock definition/)
})



test('default preparation supplies acid in beaker and hydroxide in burette',()=>{assert.equal(analyticalWetLabSetup.sample.contributions[0].sourceId,H);assert.equal(analyticalWetLabSetup.titrant.contributions[0].sourceId,OH)})


test('wet-lab chromium selection prepares the full curve without changing global System',async()=>{
 const before=JSON.stringify(system),s=structuredClone(analyticalWetLabSetup)
 s.sample.contributions.push({id:'chromium',kind:'component',sourceId:'component:Cr%203%2B',concentrationMolPerL:.01})
 const e=await createWetLabExperience(repo,{chemicalSystem:system,setup:s})
 try{
  const points=e.snapshot().points
  assert.equal(points.length,101)
  for(const p of points){assert.equal(p.state.status,'accepted-v0',JSON.stringify(p.state.diagnostics));assert.ok(Number.isFinite(p.y));balances(p.state.equilibrium)}
  assert.ok(points[0].y<2)
  assert.ok(points.at(-1).y>11)
  assert.equal(JSON.stringify(system),before)
 }finally{e.dispose()}
})
