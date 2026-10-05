import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {prepareWetLab,runTitration} from '../src/calculations/wetLabTitration.js'
import {prepareStockSolution,volumeConvention} from '../src/calculations/wetLabSolutions.js'
import {acetateSource} from '../src/calculations/acetateSource.js'
import {acetateReference,acetateDoses} from '../scripts/validation/acetateReference.js'
import {acetateSession} from './acetateHelpers.js'
import {prepareSessionPoint} from '../src/solver/prepareSession.js'
import {solvePoint} from '../src/solver/point.js'
import {createSweepDefinition,runSweep} from '../src/calculations/sweep.js'
import {deriveOutputs} from '../src/calculations/outputs.js'
import {createWetLabExperience} from '../src/calculations/wetLabExperience.js'
import {createWetLabAnalysis} from '../src/calculations/wetLabAnalysis.js'
import {auditWetLabRecipes} from '../src/calculations/wetLabSetup.js'
const raw=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')),repo=createRepository(raw),ctx=await prepareWetLab(repo,{acetate:true})
const H='component:H%2B',A=acetateSource.component,Na='component:Na%2B'
const row=n=>raw.species.find(s=>s.id.endsWith(':'+n)),constants={logAcidFormation:row(79298).logK,logSodiumFormation:row(220132).logK,logNaOHFormation:row(224689).logK,logWater:row(250448).logK}
const species={h:H,a:A,n:Na,ha:row(79298).id,pair:row(220132).id,naoh:row(224689).id,oh:row(250448).id}
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t,`${a} versus ${b}`)
const amount=(r,id)=>{const i=r.speciesIds.indexOf(id);return i<0?0:r.concentrations[i]}
const compare=(r,ref)=>{for(const [key,id] of Object.entries(species)){const actual=amount(r,id),expected=ref[key];near(actual,expected,Math.max(1e-14,expected*2e-8))}}
const stock=(reagent,volumeMl)=>prepareStockSolution({reagent,volumeMl,concentrationMolPerL:.1,temperatureC:25,convention:volumeConvention.id})
const series=await runTitration(ctx,{analyteStock:stock('CH3COOH',50),analyteVolumeMl:50,titrantStock:stock('NaOH',100),additionVolumesMl:acetateDoses,revision:1})
const session=acetateSession(repo),prepared=await prepareSessionPoint(session,repo,{sweep:true});assert.ok(prepared.ok,JSON.stringify(prepared))
const def=await createSweepDefinition(prepared.system,session.calculationDefinition,session.revision);assert.ok(def.ok,JSON.stringify(def))
const sweep=await runSweep(prepared.system,def.sweep)
test('reviewed acetate source identities and physical acid recipe are explicit',async()=>{
 assert.equal(ctx.version,'wet-lab-acetate-v1');assert.equal(constants.logAcidFormation,4.757)
 assert.deepEqual(row(79298).componentStoichiometry,{'H+':1,'CH3COO-':1})
 const acid=stock('CH3COOH',50);near(acid.moles.acetate,.005);near(acid.moles.protonEquivalent,.005);assert.equal(acid.moles.Na,0)
 const audit=await auditWetLabRecipes(repo,session.chemicalSystem);assert.ok(audit.recipes.find(r=>r.id==='CH3COOH').available)
 const excluded={...session.chemicalSystem,excludedSpecies:[acetateSource.acid]};assert.equal((await auditWetLabRecipes(repo,excluded)).recipes.find(r=>r.id==='CH3COOH').available,false)
})
test('signed analytical composition sweep agrees with independent balances without spectators',()=>{
 assert.equal(sweep.outcomes.length,81)
 for(const p of sweep.outcomes){assert.equal(p.result.scientificValidation,'passed');const ref=acetateReference({...constants,acetateTotal:.5,protonTotal:p.coordinate});compare(p.result,ref);assert.ok(!p.result.speciesIds.includes(Na));near(amount(p.result,A)+amount(p.result,acetateSource.acid),.5)}
})
test('same accepted composition sweep supplies logs and unchanged acetate fractions',()=>{
 for(const type of ['log-concentration','total-fraction','aqueous-fraction']){const output=deriveOutputs(prepared.system,sweep,{type,componentId:A});assert.ok(output.ok,JSON.stringify(output.diagnostics))}
 assert.equal(deriveOutputs(prepared.system,sweep,{type:'aqueous-fraction',componentId:H}).ok,false)
})
test('all fifteen physical doses satisfy independent simultaneous source laws and inventories',()=>{
 for(const s of series.states){assert.equal(s.status,'accepted-v0');const V=s.totalVolumeMl/1000,C=.005/V,N=.1*s.titrantVolumeAddedMl/1000/V,B=C-N,ref=acetateReference({...constants,acetateTotal:C,sodiumTotal:N,protonTotal:B});compare(s.equilibrium.result,ref);near(s.pH,ref.pH,2e-8);near(ref.a+ref.ha+ref.pair,C);near(ref.n+ref.pair+ref.naoh,N);near(ref.h-ref.oh+ref.ha-ref.naoh,B);near(ref.h+ref.n-ref.oh-ref.a,0)}
 assert.ok(series.states[0].pH>2&&series.states[0].pH<3);assert.ok(series.states.find(s=>s.titrantVolumeAddedMl===50).pH>8)
})
test('equivalent Calculation and Wet Lab analytical states use the same admitted reactions',async()=>{
 for(const s of series.states){const V=s.totalVolumeMl/1000,calc=acetateSession(repo,{sweep:false,acetateTotal:.005/V,protonTotal:s.analyticalMoles.protonEquivalent/V,sodiumTotal:s.analyticalMoles.Na? s.analyticalMoles.Na/V:null}),p=await prepareSessionPoint(calc,repo);assert.ok(p.ok,JSON.stringify(p));const r=solvePoint(p.system,p.input);assert.equal(r.scientificValidation,'passed');for(const id of s.equilibrium.result.speciesIds)near(amount(r,id),amount(s.equilibrium.result,id),1e-10)}
})
test('acetate views preview exact accepted samples without solving or committing on hover',async()=>{
 const chemicalSystem=acetateSession(repo,{sodiumTotal:.1}).chemicalSystem,setup={sample:{reagent:'CH3COOH',concentrationMolPerL:.1,volumeMl:50},titrant:{reagent:'NaOH',concentrationMolPerL:.1,volumeMl:100}},e=await createWetLabExperience(repo,{chemicalSystem,setup}),a=createWetLabAnalysis(e),points=e.snapshot().points,p=v=>points.find(p=>p.x===v)
 e.select(p(10));e.preview(p(25));assert.equal(e.snapshot().selected,p(10).state);assert.equal(e.snapshot().displayed,p(25).state)
 for(const type of ['titration','log-concentration','total-fraction','aqueous-fraction']){const v=a.view(type,A);assert.ok(v.available);assert.equal(v,a.view(type,A));for(const s of v.series)for(const p of s.points)assert.equal(p.result,p.state.equilibrium.result)}
 assert.equal(e.clearPreview().displayed,p(10).state);e.select(p(25));assert.equal(e.snapshot().selected,p(25).state);assert.equal(e.snapshot().solveRuns,1);e.dispose()
})
