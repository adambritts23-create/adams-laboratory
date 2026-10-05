import fs from 'node:fs'
import {repo} from './nonRedoxPhysicalBenchmark.js'
import {crRequest} from './sourceConservationRun.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork} from '../../src/thermodynamics/equilibriumNetwork.js'
import {createPointInput} from '../../src/solver/models.js'
import {solvePoint,closedSolidActivePolicy} from '../../src/solver/point.js'
import {peToEh} from '../../src/solver/redox.js'
import {deriveConservation,projectInventory} from './sourceConservationPrototype.js'
const c=await compileEquilibriumNetwork(repo,crRequest(10));if(!c.ok)throw Error(JSON.stringify(c))
const accepted=solveEquilibriumNetwork(c);if(!accepted.ok)throw Error(JSON.stringify(accepted))
const base=c.preparedSystemInput.prepared,n=base.network,waterId=n.water.id
const d=deriveConservation({species:n.sourceSpecies.filter(s=>s.phase!=='solid').map(s=>({id:s.id,charge:s.charge,role:s.role})),reactions:[...n.halves,...n.ordinaryReactions],electronId:n.electronId,waterId,basisIds:n.basisIds})
const targets=projectInventory(d,base.preparation.amounts,n.basisIds,waterId),original=base.input.constraints.map(x=>x.value)
const zeroIndex=base.input.constraints.findIndex(x=>x.componentId==='spana:2ac52a30213c9288:96242')
if(original[zeroIndex]!==0||targets[zeroIndex]!==1.214306433183765e-17)throw Error('Unexpected diagnostic baseline')
async function run(values){
 const point=await createPointInput(base.system,{...base.input,constraints:base.input.constraints.map((c,i)=>({...c,value:values[i]}))})
 const r=solvePoint(base.system,point.input,{...(base.initialLogActivities?{initialLogActivities:base.initialLogActivities}:{}),phaseSelection:closedSolidActivePolicy})
 const logs=Object.fromEntries(r.speciesIds.map((id,i)=>[id,id===waterId?r.logActivities[i]:Math.log10(r.concentrations[i])]))
 const half=n.halves[0],pe=-((half.productCoefficient??1)*logs[half.productId]-half.logK-half.terms.filter(t=>t.id!==n.electronId).reduce((v,t)=>v+t.coefficient*logs[t.id],0))/half.terms.find(t=>t.id===n.electronId).coefficient
 const reference=accepted.accepted.result,carriers=n.physical.map(s=>{const i=r.speciesIds.indexOf(s.id),amount=r.concentrations[i],expected=reference.concentrations[reference.speciesIds.indexOf(s.id)];return {id:s.id,name:s.name,phase:s.phase,amount,expected,difference:amount-expected,logRatio:amount>0&&expected>0?Math.log10(amount/expected):null}})
 return {targets:values,pH:-logs[n.protonId],pe,Eh:peToEh(pe),pHDifference:-logs[n.protonId]-accepted.accepted.inspection.pH,peDifference:pe-accepted.accepted.inspection.pe,EhDifference:peToEh(pe)-accepted.accepted.inspection.Eh,carriers,solids:r.solids,chargeResidual:n.physical.reduce((v,s)=>v+s.charge*r.concentrations[r.speciesIds.indexOf(s.id)],0),componentResiduals:r.residuals,scientificValidation:r.scientificValidation}
}
const corrected=[...targets];corrected[zeroIndex]=0
const report={originalTargets:original,baseline:{pH:accepted.accepted.inspection.pH,pe:accepted.accepted.inspection.pe,Eh:accepted.accepted.inspection.Eh,solids:accepted.accepted.result.solids,componentResiduals:accepted.accepted.result.residuals},failed:await run(targets),oneZero:await run(corrected)}
fs.writeFileSync('docs/exact-inventory-zero-diagnostic.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({baseline:report.baseline.pe,failed:report.failed.pe,oneZero:report.oneZero.pe,peDifference:report.oneZero.peDifference,maxLogRatio:Math.max(...report.oneZero.carriers.map(x=>Math.abs(x.logRatio??0)))},null,2))
