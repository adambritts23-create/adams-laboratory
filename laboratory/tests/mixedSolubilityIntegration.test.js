import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {mixedCarbonateSolubilityExample} from '../src/data/solubilityExample.js'
import {prepareSessionPoint} from '../src/solver/prepareSession.js'
import {createSweepDefinition,runSweep} from '../src/calculations/sweep.js'
import {deriveOutputs} from '../src/calculations/outputs.js'
import {validateOutputRequest} from '../src/calculations/outputDescriptors.js'
import {resultPackage,figureSvg} from '../src/plots/export.js'
import {bounds,segments} from '../src/plots/geometry.js'
import {updateLaboratorySession} from '../src/session/laboratorySession.js'
const repository=createRepository(JSON.parse(fs.readFileSync(new URL('../public/data/thermodynamic-default.json',import.meta.url))))
const evidence=JSON.parse(fs.readFileSync(new URL('../docs/multisolid-validation.json',import.meta.url)))
const session=mixedCarbonateSolubilityExample(repository)
const p=await prepareSessionPoint(session,repository,{sweep:true}); assert.ok(p.ok,JSON.stringify(p))
const {system}=p
const request={type:'saturated-log-solubility',...session.calculationDefinition.mixedSolubility}
const sd=await createSweepDefinition(system,session.calculationDefinition,session.revision); assert.ok(sd.ok,JSON.stringify(sd))
const sweep=await runSweep(system,sd.sweep), derived=deriveOutputs(system,sweep,request)
const close=(a,b)=>assert.ok(Math.abs(a-b)<=4e-14+2e-10*Math.abs(b),a+' vs '+b)
test('mixed example explicitly opts into one shared pH sweep and preserves the legacy gate',async()=>{
 assert.equal(system.solidPolicy,'bounded-multisolid-v1'); assert.equal(system.solidRows.length,10); assert.equal(system.aqueousRows.length,11)
 assert.equal(validateOutputRequest(system,request).ok,true); assert.equal(sweep.counts.converged,29); assert.equal(derived.series.length,2)
 const legacy=structuredClone(session); delete legacy.calculationDefinition.mixedSolubility
 const r=await prepareSessionPoint(legacy,repository,{sweep:true}); assert.equal(r.ok,false); assert.ok(r.diagnostics.some(d=>d.code==='unsupported-solid-assemblage'))
 assert.equal((await prepareSessionPoint(session,repository,{grid:true})).ok,false)
})
test('plotted mixed Ca and Mg points agree with prior evidence across all sampled phase regions',()=>{
 assert.ok(derived.ok)
 assert.deepEqual(derived.series.map(s=>s.points.filter(p=>p.value!==null).length),[18,9])
 for(const pH of [0,5,5.5,9.5,10,10.5,12,13.5,14]){
  const index=pH*2, expected=evidence.points[index]
  for(const [k,ci] of [[0,0],[1,2]]){
   const point=derived.series[k].points[index],trace=point.trace
   assert.equal(trace.inputId,sweep.outcomes[index].input.id)
   close(trace.weightedDissolvedTotal,expected.independentReconstruction.dissolved[ci])
   close(trace.contributors.reduce((n,c)=>n+c.weightedMolality,0),trace.weightedDissolvedTotal)
   const saturated=trace.solids.some(s=>['present','saturated-zero-amount'].includes(s.status)&&system.products.find(p=>p.id===s.id).coefficients[system.components.findIndex(c=>c.id===trace.componentId)]>0)
   if(saturated) close(point.value,Math.log10(expected.independentReconstruction.dissolved[ci]))
   else {assert.equal(point.value,null);assert.equal(point.reason,'relevant-solid-not-saturated')}
   assert.deepEqual(trace.activeAssemblage.slice().sort(),expected.solids.filter(s=>s.amount>0).map(s=>s.name).sort())
  }
 }
 const mg=derived.series[1].points[24].trace
 assert.equal(mg.contributors.find(c=>c.name==='Mg4(OH)4+4').coefficient,4)
 assert.ok(derived.series[0].points[24].trace.contributors.some(c=>c.name==='CaCO3'))
 assert.deepEqual(derived.metadata.phaseChanges.map(c=>c.x),[5.5,10,14])
})
test('mixed traces, exact export, focus and discrete markers use the existing plot machinery',()=>{
 const ids=derived.series.map(s=>s.id),view=bounds(derived.series,derived.metadata.axis,true)
 const json=JSON.parse(resultPackage(system,sweep,derived,ids,view,session.revision))
 assert.deepEqual(json.sweep.outcomes[28].result.concentrations,sweep.outcomes[28].result.concentrations)
 assert.deepEqual(json.derived.series[1].points[28].trace,derived.series[1].points[28].trace)
 const svg=figureSvg(derived,ids,view,'dark',session.revision,undefined,ids[1])
 assert.ok(svg.includes('data-assemblage-sample="28"'));assert.ok(svg.includes('data-focused="true"'));assert.ok(svg.includes('opacity="0.25"'))
 const old={...session,lastPlot:{system,sweep}}
 const edited=updateLaboratorySession(old,{type:'calculation',definition:{...session.calculationDefinition,componentConditions:session.calculationDefinition.componentConditions.map(c=>({...c}))}},repository)
 assert.equal(edited.lastPlot.sweep,sweep);assert.ok(edited.revision>sweep.revision)
 assert.equal(JSON.parse(resultPackage(system,sweep,derived,ids,view,edited.revision)).stale,true)
})
test('cancelled mixed samples remain null and do not create phase markers across missing states',async()=>{
 const controller=new AbortController();controller.abort()
 const cancelled=await runSweep(system,sd.sweep,{signal:controller.signal})
 const gaps=deriveOutputs(system,cancelled,request)
 assert.ok(gaps.series.every(s=>s.points.every(p=>p.value===null&&p.trace.weightedDissolvedTotal===null)))
 assert.ok(gaps.series.every(s=>segments(s.points).length===0));assert.equal(gaps.metadata.phaseChanges.length,0)
})

