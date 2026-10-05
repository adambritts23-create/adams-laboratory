import {constructEquilibrium} from '../thermodynamics/equilibriumConstructor.js'
import {solveEquilibriumNetwork,equilibriumSourceFingerprint} from '../thermodynamics/equilibriumNetwork.js'
import {prepareClosedReagents,solveClosedReagents,isClosedReagentResult} from '../thermodynamics/closedReagents.js'
import {createSweepDefinition} from './sweep.js'
import {freeze,identity} from '../solver/models.js'
const results=new WeakSet()
export const isClosedReagentSweep=r=>results.has(r)
const fail=message=>freeze({ok:false,status:'invalid-closed-reagent-sweep',diagnostics:[{code:'invalid-closed-reagent-sweep',message}]})
/** Reuse existing TV axis rules; re-prepare closed inventories at every reagent dose.
 * No imposed potential, continuation state, interpolation or special titration logic.
 */
export async function runClosedReagentSweep(repository,request,scope,axis,{signal,isCurrent=()=>true}={}){
 const first=await prepareClosedReagents(repository,request,scope)
 if(!first.ok)return first
 const {system,input}=first.prepared
 if(!axis||axis.min<0||axis.max<0||!Object.hasOwn(request.amounts,axis.reagentId)||!system.components.some(c=>c.id===axis.reagentId&&c.role==='ordinary'))return fail('The supplied reagent axis must be an ordinary component of this admitted basis.')
 const definition={schemaVersion:1,output:{type:'log-concentration',speciesIds:system.products.map(p=>p.id)},componentConditions:system.components.filter(c=>c.id!==axis.reagentId).map(c=>{const k=input.constraints.find(k=>k.componentId===c.id);return {componentId:c.id,mode:k.kh===1?'T':'LA',quantity:k.kh===1?'total':'log-activity',unit:k.kh===1?'mol/kg-H2O':'dimensionless',value:k.value}}),independentVariables:[{componentId:axis.reagentId,mode:'TV',quantity:'total',unit:'mol/kg-H2O',range:{min:axis.min,max:axis.max},points:axis.points}],temperature:{value:25,unit:'C'},pressure:{value:1,unit:'bar'},ionicStrength:{mode:'automatic',value:null,unit:'mol/kg-H2O'},activityModel:'ideal',sampling:{strategy:'cartesian',maxPoints:10000},enabledPhases:['aqueous','liquid']}
 const d=await createSweepDefinition(system,definition,request.revision)
 if(!d.ok)return d
 const outcomes=[];let status='completed'
 for(const [index,coordinate] of d.sweep.coordinates.entries()){
  if(!isCurrent()){status='invalidated-stale';break}if(signal?.aborted){status='cancelled';break}
  const pointRequest={...request,amounts:{...request.amounts,[axis.reagentId]:coordinate}},prepared=await prepareClosedReagents(repository,pointRequest,scope)
  const accepted=prepared.ok?solveClosedReagents(prepared):prepared
  if(!isCurrent()){status='invalidated-stale';break}if(signal?.aborted){status='cancelled';break}
  outcomes.push(freeze({index,coordinate,status:accepted.ok?'accepted':'failed',accepted:accepted.ok?accepted:null,diagnostics:accepted.diagnostics??[],system:accepted.system??null,input:accepted.input??null,result:accepted.result??null}))
  await new Promise(resolve=>setTimeout(resolve,0))
 }
 const value=freeze({ok:status==='completed',kind:'closed-reagent-sweep',status,id:await identity({request,axis,scopeId:first.scopeId}),scopeId:first.scopeId,revision:request.revision,axis:{...axis,unit:'mol/kg-H2O',meaning:'Supplied reagent amount; Eh and pH are derived outputs'},coordinates:d.sweep.coordinates,outcomes,counts:{requested:d.sweep.coordinates.length,accepted:outcomes.filter(o=>o.accepted).length,failed:outcomes.filter(o=>!o.accepted).length},discovery:first.discovery})
 results.add(value);return value
}
export function inspectClosedReagentSample(sweep,index,{revision,scopeId}={}){
 if(!results.has(sweep)||sweep.status!=='completed'||revision!==sweep.revision||scopeId!==sweep.scopeId||!Number.isInteger(index))return fail('Stale, incomplete or unbranded reagent sweep cannot supply inspection.')
 const sample=sweep.outcomes[index]
 if(!sample||!isClosedReagentResult(sample.accepted))return fail('This sample has no accepted closed equilibrium; preserve the gap.')
 return freeze({ok:true,index,coordinate:sample.coordinate,accepted:sample.accepted,system:sample.system,input:sample.input,result:sample.result,inspection:sample.accepted.inspection})
}

/** General UI adapter: each source-total sample uses the existing closed constructor. */
export async function runAutomaticClosedSweep(repository,session,{signal,isCurrent=()=>true}={}){
 const d=session.calculationDefinition,axis=d.independentVariables[0]
 if(d.independentVariables.length!==1||!axis||axis.quantity!=='total'||!['TV','LTV'].includes(axis.mode))return fail('Closed composition currently requires one analytical-total axis.')
 if(!Number.isFinite(axis.range.min)||!Number.isFinite(axis.range.max)||axis.range.min>=axis.range.max||!Number.isInteger(axis.points)||axis.points<2||axis.points>10000)return fail('Use an increasing finite range and 2–10000 samples.')
 const rows=d.componentConditions.filter(c=>repository.getComponentById(c.componentId)?.role!=='solvent')
 if(rows.some(c=>c.mode!=='T'||!Number.isFinite(c.value)||c.unit!=='mol/kg-H2O')||axis.unit!=='mol/kg-H2O')return fail('Closed composition requires finite supplied totals in mol/kg H₂O; no fixed activities.')
 if(session.chemicalSystem.excludedSpecies?.length||session.chemicalSystem.optionalSpecies?.length)return fail('Custom reaction changes require a separately validated closed scope.')
 const amounts=Object.fromEntries(rows.map(c=>[c.componentId,c.value]))
 const coordinates=Array.from({length:axis.points},(_,i)=>i===0?axis.range.min:i===axis.points-1?axis.range.max:axis.range.min+(axis.range.max-axis.range.min)*i/(axis.points-1))
 const outcomes=[];let status='completed'
 for(const [index,coordinate] of coordinates.entries()){
  if(signal?.aborted||!isCurrent()){status='cancelled';break}
  const compiled=await constructEquilibrium(repository,{adapter:'physical',input:{boundary:'closed-physical',sourceFingerprint:equilibriumSourceFingerprint,selectedIds:session.chemicalSystem.selectedComponents.filter(id=>repository.getComponentById(id)?.role!=='electron'),amounts:{...amounts,[axis.componentId]:axis.mode==='LTV'?10**coordinate:coordinate},revision:session.revision,temperatureC:d.temperature.value,pressureBar:d.pressure.value,activityModel:d.activityModel,unit:axis.unit,solvent:'unit-water-activity',phases:d.enabledPhases.includes('solid')?['aqueous','pure-solids']:['aqueous']}})
  const solved=compiled.ok?solveEquilibriumNetwork(compiled):compiled,accepted=solved.ok?solved.accepted:null
  outcomes.push({index,coordinate,status:accepted?'accepted':'failed',accepted,system:accepted?.system??null,input:accepted?.input??null,result:accepted?.result??null,diagnostics:solved.diagnostics??[],phaseDiagnostics:solved.phaseDiagnostics??[]})
  // Structural preparation failure is shared by the entire definition; explain it once.
  if(!compiled.ok&&compiled.diagnostics?.some(d=>['unbalanced-preparation','unsupported-boundary-condition','network-structural-failure'].includes(d.code)))return {...compiled,reason:compiled.diagnostics?.map(d=>d.message).join(' ')}
  await new Promise(resolve=>setTimeout(resolve,0))
 }
 const value=freeze({ok:status==='completed',generic:true,kind:'closed-reagent-sweep',status,id:await identity({definition:d,revision:session.revision}),scopeId:'general-source-closed',revision:session.revision,axis:{reagentId:axis.componentId,min:axis.range.min,max:axis.range.max,points:axis.points,mode:axis.mode,unit:axis.unit},coordinates,outcomes,counts:{requested:coordinates.length,accepted:outcomes.filter(o=>o.accepted).length,failed:outcomes.filter(o=>!o.accepted).length},discovery:{status:'CONDITIONAL',phaseScope:d.enabledPhases}})
 results.add(value);return value
}
