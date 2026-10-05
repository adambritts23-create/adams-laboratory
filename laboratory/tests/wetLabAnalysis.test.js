import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {createWorkspaceSession} from '../src/session/laboratorySession.js'
import {createWetLabExperience} from '../src/calculations/wetLabExperience.js'
import {createWetLabAnalysis,nearestWetLabPoint} from '../src/calculations/wetLabAnalysis.js'
import {defaultWetLabSetup} from '../src/calculations/wetLabSetup.js'
import {totalFractionState} from '../src/calculations/totalFractions.js'
import {aqueousFractionState} from '../src/calculations/aqueousFractions.js'
import {logConcentrationValue} from '../src/calculations/outputs.js'
import {solubilityApplicability} from '../src/calculations/solubility.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const chemicalSystem={...createWorkspaceSession(repo).chemicalSystem,selectedComponents:['component:H%2B','component:H2O','component:Na%2B','component:Cl-'],selectedSpecies:['spana:2ac52a30213c9288:250448']}
const make=setup=>createWetLabExperience(repo,{chemicalSystem,setup:setup??defaultWetLabSetup})
test('preview is transient, click selects exact state and pointer traversal never solves',async()=>{
 const e=await make(),points=e.snapshot().points,p=v=>points.find(p=>p.x===v)
 e.select(p(25));const actual=e.snapshot().selected
 for(const v of [0,25,49.99,50,50.01,100]){const s=e.preview(p(v));assert.equal(s.selected,actual);assert.equal(s.displayed,p(v).state);assert.equal(s.preview,p(v).state);assert.equal(s.solveRuns,1)}
 assert.equal(e.clearPreview().displayed,actual);e.preview(p(50.01));const s=e.select(p(50.01));assert.equal(s.preview,null);assert.equal(s.selected,p(50.01).state)
 assert.equal(e.reset().preview,null);e.dispose()
})
test('analytical views preserve original identities and cache without solver calls in both orientations',async()=>{
 for(const reverse of [false,true]){
 const setup=structuredClone(defaultWetLabSetup);if(reverse){setup.sample.reagent='NaOH';setup.titrant.reagent='HCl'}
 const e=await make(setup),a=createWetLabAnalysis(e),committed=e.snapshot().selected
 for(const type of ['titration','log-concentration','total-fraction','aqueous-fraction']){
 const view=a.view(type,'component:Cl-');assert.equal(view,a.view(type,'component:Cl-'))
 for(const s of view.series)for(const p of s.points){assert.equal(p.input,p.state.equilibrium.input);assert.equal(p.result,p.state.equilibrium.result);assert.equal(p.revision,p.state.revision)}
 assert.equal(e.snapshot().selected,committed);assert.equal(e.snapshot().solveRuns,1)
 }
 e.dispose()
 }
})
test('fractions reuse unchanged ordinary-component contracts with no proton denominator',async()=>{
 const e=await make(),a=createWetLabAnalysis(e)
 for(const type of ['total-fraction','aqueous-fraction']){
 assert.equal(a.view(type,'component:H%2B').available,false)
 for(const id of ['component:Cl-','component:Na%2B']){
 const view=a.view(type,id);assert.equal(view.available,true)
 for(const row of view.series)for(const p of row.points){const q=p.state.equilibrium,expected=type==='total-fraction'?totalFractionState(q.system,q.input,q.result,id):aqueousFractionState(q.system,q.result,id);assert.equal(p.value,expected.ok?expected.contributors.find(c=>c.id===row.id).fraction:null)}
 }
 }
 assert.equal(a.view('total-fraction','component:Na%2B').series[0].points[0].value,null)
 e.dispose()
})
test('log series retains actual admitted carriers, retained logs and absent-carrier gaps',async()=>{
 const e=await make(),v=createWetLabAnalysis(e).view('log-concentration')
 assert.equal(v.series.length,4)
 for(const row of v.series)for(const p of row.points){const q=p.state.equilibrium,i=q.result.speciesIds.indexOf(row.id);assert.equal(p.value,i<0?null:logConcentrationValue(q.system,q.result,i).value)}
 assert.equal(v.series.find(s=>s.id==='component:Na%2B').points[0].value,null);e.dispose()
})
test('adapter and preview refuse forged, foreign and stale points even after caching',async()=>{
 const e=await make(),other=await make(),a=createWetLabAnalysis(e),p=e.snapshot().points[0];a.view('titration')
 for(const point of [{...p},other.snapshot().points[0]]){assert.throws(()=>a.inspect(point));assert.throws(()=>e.preview(point))}
 e.dispose();assert.throws(()=>a.view('titration'));assert.throws(()=>a.inspect(p));assert.throws(()=>e.clearPreview());other.dispose()
})
test('custom experiment coordinates and nearest-X selection do not assume default equivalence',async()=>{
 const setup=structuredClone(defaultWetLabSetup);setup.sample.volumeMl=25
 const e=await make(setup),v=createWetLabAnalysis(e).view('log-concentration')
 assert.ok(v.points.some(p=>p.x===24.99));assert.equal(nearestWetLabPoint(v.points,24.991).x,24.99)
 for(const s of v.series)assert.deepEqual(s.points.map(p=>p.x),v.points.map(p=>p.x))
 const q=e.snapshot().selected.equilibrium;assert.equal(solubilityApplicability(q.system,'component:Cl-').ok,false);e.dispose()
})
test('repeated hover/view inspection reuses derived cache and performs zero new solve runs',async t=>{
 const e=await make(),a=createWetLabAnalysis(e),points=e.snapshot().points
 const views=['titration','log-concentration','total-fraction','aqueous-fraction'].map(type=>a.view(type,'component:Cl-'))
 const started=performance.now()
 for(let i=0;i<1000;i++){const point=points[i%points.length];e.preview(point);assert.equal(a.view(views[i%4].type,'component:Cl-'),views[i%4]);assert.equal(a.inspect(point),point.state)}
 t.diagnostic(`1000 cached preview/view operations: ${(performance.now()-started).toFixed(2)} ms; solveRuns=${e.snapshot().solveRuns}`)
 assert.equal(e.snapshot().solveRuns,1);e.dispose()
})
