import fs from 'node:fs'
import assert from 'node:assert/strict'
import {repo,common,contribution} from './nonRedoxPhysicalBenchmark.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork} from '../../src/thermodynamics/equilibriumNetwork.js'
import {createPointInput} from '../../src/solver/models.js'
import {solvePoint,closedSolidActivePolicy} from '../../src/solver/point.js'
import {deriveConservation,projectInventory} from './exactSourceConservation.js'
import {rank} from './sourceConservationPrototype.js'
export const request=amounts=>({...common,boundary:'physical-preparation',preparation:{provenance:'Isolated source-conservation parity experiment',solventCoordinate:{convention:'explicit-solvent-mass-kg',modelSolventMassKg:1},contributions:Object.entries(amounts).map(([id,m],i)=>contribution(String(i),id,m))}})
export const crRequest=v=>{const q=request({'component:Cr%203%2B':.0005,'component:Cl-':.0015,'spana:2ac52a30213c9288:224689':v*.0001});return {...q,phases:['aqueous','pure-solids'],preparation:{...q.preparation,solventCoordinate:{convention:'dilute-ideal-aqueous-volume-v0',volumeMl:50+v,modelSolventMassKg:(50+v)/1000}}}}
export const refs=JSON.parse(fs.readFileSync('docs/cr-reagent-independent-reference.json')).points
export async function experiment(q,reference=null,variant=0){
 const compiled=await compileEquilibriumNetwork(repo,q);assert.ok(compiled.ok,JSON.stringify(compiled.diagnostics))
 const accepted=solveEquilibriumNetwork(compiled);assert.ok(accepted.ok,JSON.stringify(accepted.diagnostics))
 const base=compiled.preparedSystemInput.prepared,n=base.network,waterId=n.water.id
 let species=n.sourceSpecies.filter(s=>s.phase!=='solid').map(s=>({id:s.id,charge:s.charge,role:s.role})),reactions=[...n.halves,...n.ordinaryReactions]
 if(variant===4)reactions.reverse()
 if(variant===5)species.reverse()
 if(variant===6)reactions=[...reactions,{...reactions[0],id:reactions[0].id+':redundant'}]
 const d=deriveConservation({species,reactions,electronId:n.electronId,waterId,basisIds:n.basisIds})
 const originalRows=n.conservation.map(r=>d.physicalIds.map(id=>id===waterId?0:r.weights[n.physical.findIndex(s=>s.id===id)]))
 assert.equal(rank(originalRows),d.dimension);assert.equal(rank([...originalRows,...d.conservation.map(r=>r.weights)]),d.dimension)
 const values=projectInventory(d,base.preparation.amounts,n.basisIds,waterId,variant)
 const point=await createPointInput(base.system,{...base.input,constraints:base.input.constraints.map((c,i)=>({...c,value:values[i]}))});assert.ok(point.ok)
 const result=solvePoint(base.system,point.input,{...(base.initialLogActivities?{initialLogActivities:base.initialLogActivities}:{}),...(base.solidClosure?{phaseSelection:closedSolidActivePolicy}:{})})
 assert.equal(result.scientificValidation,'passed',JSON.stringify(result))
 const baseline=accepted.accepted.result,inspection=accepted.accepted.inspection
 const logs=Object.fromEntries(result.speciesIds.map((id,i)=>[id,id===waterId?result.logActivities[i]:Math.log10(result.concentrations[i])]))
 const pH=-logs[n.protonId],r=n.halves[0],pe=-((r.productCoefficient??1)*logs[r.productId]-r.logK-r.terms.filter(t=>t.id!==n.electronId).reduce((v,t)=>v+t.coefficient*logs[t.id],0))/r.terms.find(t=>t.id===n.electronId).coefficient
 assert.ok(Math.abs(pH-inspection.pH)<1e-8,'pH parity');assert.ok(Math.abs(pe-inspection.pe)<1e-8,'pe parity')
 const errors=result.speciesIds.map((id,i)=>Math.abs(result.concentrations[i]-baseline.concentrations[baseline.speciesIds.indexOf(id)]));assert.ok(Math.max(...errors)<1e-10,'carrier parity');const maxLogRatio=Math.max(...result.concentrations.map((v,i)=>v>0&&baseline.concentrations[i]>0?Math.abs(Math.log10(v/baseline.concentrations[i])):0));assert.ok(maxLogRatio<1e-8,'trace log parity');assert.ok(values.every((v,i)=>base.input.constraints[i].value!==0||v===0),'structural zeros')
 assert.deepEqual(result.solids.filter(s=>s.amount>0).map(s=>s.id),baseline.solids.filter(s=>s.amount>0).map(s=>s.id))
 for(const solid of result.solids){const prior=baseline.solids.find(s=>s.id===solid.id);assert.ok(Math.abs(solid.amount-prior.amount)<1e-10);assert.ok(Math.abs(solid.logSaturation-prior.logSaturation)<1e-8)}
 const closure=d.conservation.map(row=>{
  const total=d.physicalIds.reduce((v,id,i)=>v+row.weights[i]*(base.preparation.amounts[id]??0),0)
  const terms=n.physical.map(s=>{const weight=s.phase==='solid'?row.basisWeights.reduce((v,w,i)=>v+w*s.coefficients[i],0):row.weights[d.physicalIds.indexOf(s.id)];return weight*result.concentrations[result.speciesIds.indexOf(s.id)]})
  const residual=terms.reduce((v,x)=>v+x,0)-total,limit=row.basisWeights.reduce((v,w,i)=>v+Math.abs(w)*result.residuals.componentBalanceLimits[i],0)+128*Number.EPSILON*Math.max(1,terms.reduce((v,x)=>v+Math.abs(x),0));assert.ok(Math.abs(residual)<=limit,'source inventory closure');return {key:row.key,total,residual,limit}
 })
 if(reference){assert.ok(Math.abs(pH-reference.reference.pH)<1e-8,'saved pH');assert.ok(Math.abs(pe-reference.reference.pe)<1e-8,'saved pe');for(const c of reference.reference.carriers){const s=n.physical.find(s=>s.name===c.name);assert.ok(s,c.name);assert.ok(Math.abs(result.concentrations[result.speciesIds.indexOf(s.id)]-c.amount)<1e-10,c.name);if(c.amount>0)assert.ok(Math.abs(Math.log10(result.concentrations[result.speciesIds.indexOf(s.id)]/c.amount))<1e-7,'saved trace '+c.name)}}
 return {carriers:n.physical.map(s=>({id:s.id,name:s.name,amount:result.concentrations[result.speciesIds.indexOf(s.id)]})),sourceMassActionResiduals:[...n.halves,...n.ordinaryReactions].map(r=>({id:r.id,residual:(r.productCoefficient??1)*logs[r.productId]-r.logK-r.terms.reduce((v,t)=>v+t.coefficient*(t.id===n.electronId?-pe:logs[t.id]),0)})),pH,pe,variant,maxLogRatio,pHDifference:pH-inspection.pH,peDifference:pe-inspection.pe,dimension:d.dimension,maxNullResidual:d.maxNullResidual,maxCarrierDifference:Math.max(...errors),maxTargetDifference:Math.max(...values.map((v,i)=>Math.abs(v-base.input.constraints[i].value))),closure,solids:result.solids,referenceDose:reference?.volumeMl,elementalSpanMatches:true}
}
