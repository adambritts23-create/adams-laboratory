import {scientificPointTrace} from '../src/analysis/pointTrace.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {automaticAuditSession,runAutomaticControl} from '../scripts/validation/automaticSolidsAudit.js'
import {reconcileAutomaticSpecies} from '../src/thermodynamics/compatibility.js'
import {deriveOutputs} from '../src/calculations/outputs.js'
import {totalFractionState} from '../src/calculations/totalFractions.js'
import {aqueousFractionState} from '../src/calculations/aqueousFractions.js'
import {acceptedState} from '../src/beaker/acceptedState.js'
import {sedimentSegments} from '../src/beaker/scene.js'
import {prepareChemicalSystem,createPointInput} from '../src/solver/models.js'
import {solvePoint} from '../src/solver/point.js'
import {legendReadout} from '../src/plots/legendReadout.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const fe=await runAutomaticControl(repo,'Fe total 1',automaticAuditSession(repo,['Fe 3+'],[1],3))
const ca=await runAutomaticControl(repo,'Ca carbonate partition',automaticAuditSession(repo,['Ca 2+','CO3 2-'],[.1,.1],3))
test('total fractions close across aqueous plus accepted solids using each analytical component total',()=>{
 for(const c of [fe,ca])for(const component of c.system.components.filter(c=>c.role==='ordinary')){
  const d=deriveOutputs(c.system,c.sweep,{type:'total-fraction',componentId:component.id});assert.ok(d.ok,JSON.stringify(d));assert.equal(scientificPointTrace(c.system,c.sweep,d,d.series[0].id,0).plottedOutput.passed,true)
  for(let i=0;i<c.sweep.outcomes.length;i++){const o=c.sweep.outcomes[i],p=totalFractionState(c.system,o.input,o.result,component.id);assert.ok(p.ok,p.reason);assert.ok(Math.abs(d.series.reduce((s,r)=>s+r.points[i].value,0)-1)<=p.balanceTolerance/p.total);assert.ok(Math.abs(p.residual)<=p.balanceTolerance)}
 }
})
test('pH 0 Fe total 1: significant hematite, zero amorphous hydroxide, same exact dissolved solubility',()=>{
 const o=fe.sweep.outcomes[0],id=fe.system.components[0].id,p=totalFractionState(fe.system,o.input,o.result,id),solid=p.contributors.find(c=>c.name==='Fe2O3(cr)')
 assert.equal(p.total,1);assert.equal(p.totalDissolved,.8989408591996729);assert.equal(solid.amount,.0505295704001635);assert.equal(solid.coefficient,2);assert.equal(solid.fraction,.101059140800327)
 assert.equal(p.contributors.find(c=>c.name==='Fe(OH)3(am)').amount,0)
 const d=deriveOutputs(fe.system,fe.sweep,{type:'saturated-log-solubility',componentId:id});assert.equal(d.series[0].points[0].value,-.046268879310268275);assert.equal(d.series[0].points[0].linearValue,p.totalDissolved);assert.equal(d.series[0].points[0].solidId,solid.id)
 const state=acceptedState(fe.system,o.input,o.result);assert.equal(sedimentSegments(state)[0].id,solid.id);assert.ok(state.visual.bedHeight>0)
})
test('dissolved-only speciation is unchanged and total-fraction legend reports both denominators',()=>{
 const o=fe.sweep.outcomes[0],id=fe.system.components[0].id,a=aqueousFractionState(fe.system,o.result,id),d=deriveOutputs(fe.system,fe.sweep,{type:'aqueous-fraction',componentId:id}),t=deriveOutputs(fe.system,fe.sweep,{type:'total-fraction',componentId:id})
 assert.equal(a.ok,true);assert.ok(Math.abs(a.sumFractions-1)<1e-12)
 for(const c of a.contributors){assert.equal(d.series.find(s=>s.id===c.id).points[0].value,c.fraction);const p=t.series.find(s=>s.id===c.id).points[0];assert.equal(p.dissolvedFraction,c.fraction);assert.ok(Math.abs(p.value-c.fraction*.8989408591996729)<1e-15)}
 assert.match(legendReadout(t,0,fe.sweep.revision).rows.find(r=>r.id===id).text,/of total .*of dissolved/)
})
test('amorphous hydroxide alone is unsaturated at pH 0: no false precipitate or solubility',async()=>{
 const s=automaticAuditSession(repo,['Fe 3+'],[1],2),solid=repo.getSpecies().find(s=>s.name==='Fe(OH)3(am)')
 s.chemicalSystem=reconcileAutomaticSpecies({...s.chemicalSystem,solidPhasePolicy:'explicit',optionalSpecies:[solid.id]},repo);s.calculationDefinition.output.speciesIds=[...s.chemicalSystem.selectedSpecies]
 const c=await runAutomaticControl(repo,'am only',s),o=c.sweep.outcomes[0],state=acceptedState(c.system,o.input,o.result)
 assert.equal(o.result.dissolvedComponentAmounts[0],1);assert.equal(o.result.solids[0].amount,0);assert.equal(o.result.solids[0].status,'absent');assert.equal(state.visual.bedHeight,0);assert.deepEqual(sedimentSegments(state),[])
 assert.equal(deriveOutputs(c.system,c.sweep,{type:'saturated-log-solubility',componentId:c.system.components[0].id}).series[0].points[0].value,null)
})
test('accepted trace solid remains exact but is invisible; significant solid and saturated-zero behave distinctly',async()=>{
 const p=await prepareChemicalSystem({components:[{id:'A',name:'A',role:'ordinary'}],products:[{id:'solid',name:'A(s)',phase:'solid',coefficients:[1],logBeta:0,sourceRecord:{kind:'synthetic-mathematical-test'}}],basisStatus:'explicit-direct',temperatureC:25,pressureBar:1,unit:'mol/kg-H2O',sourceIdentity:{kind:'synthetic-mathematical-test'}});assert.ok(p.ok,JSON.stringify(p))
 for(const [total,visible]of [[1,false],[1+1e-8,false],[1.01,true]]){const i=await createPointInput(p.system,{constraints:[{componentId:'A',kh:1,value:total}],revision:0,unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,activityModel:'ideal'});assert.ok(i.ok);const r=solvePoint(p.system,i.input);assert.ok(r.ok,JSON.stringify(r));const state=acceptedState(p.system,i.input,r);assert.equal(state.visual.bedHeight>0,visible);assert.equal(sedimentSegments(state).length,visible?1:0);assert.equal(state.result,r);if(total===1+1e-8){assert.ok(state.solids[0].amount>0);assert.deepEqual(state.visual.hiddenSolidIds,['solid']);assert.equal(totalFractionState(p.system,i.input,r,'A').contributors.find(c=>c.id==='solid').amount,r.solids[0].amount)}}
})
test('total partitions reject forged states and retain stale result gaps',()=>{
 const o=fe.sweep.outcomes[0],id=fe.system.components[0].id
 assert.equal(totalFractionState(fe.system,o.input,{...o.result},id).ok,false)
 const d=deriveOutputs(fe.system,fe.sweep,{type:'total-fraction',componentId:id},{currentRevision:fe.sweep.revision+1});assert.ok(d.series.every(s=>s.points.every(p=>p.value===null)))
})
