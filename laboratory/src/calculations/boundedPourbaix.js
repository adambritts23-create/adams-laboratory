import {createGridDefinition,runGrid} from './grid.js'
import {freeze} from '../solver/models.js'
import {assessPourbaixCandidate,inspectRegisteredPoint} from '../analysis/pourbaixContract.js'
const results=new WeakSet()
export const isPourbaixResult=value=>results.has(value)
// Common orchestration. This brands a bounded scientific result, never a public UI capability.
export async function runBoundedPourbaix(preparation,definition,revision,contract,control={},context={}){
 if(!preparation?.ok)return {ok:false,reason:preparation?.reason??'unsupported-preparation'}
 const {system,model,waterModel}=preparation
 if(control.isCurrent&&!control.isCurrent())return {ok:false,reason:'Calculation superseded.'}
 const d=await createGridDefinition(system,definition,revision)
 if(!d.ok)return {ok:false,reason:'unsupported-grid-definition'}
 const grid=await runGrid(system,d.grid,control),options={currentRevision:revision,waterModel}
 const support=assessPourbaixCandidate(model,system,grid,options,contract)
 if(!support.eligible)return {ok:false,reason:support.reason,grid}
 const points=grid.outcomes.map(o=>inspectRegisteredPoint(model,system,o.input,o.result,{...options,status:o.status},contract))
 const reference=assessPourbaixCandidate(model,system,grid,options,context.referenceContract??contract)
 const referenceValidated=context.referenceAllowed!==false&&reference.eligible
 const scientificSupport={...support,scientificStatus:referenceValidated?'reference-validated':'calculated-internally-verified',referenceContractVersion:referenceValidated?(context.referenceContract??contract).version:null,claim:referenceValidated?'Exact independently matched reference conditions; all calculation checks passed.':'All internal equilibrium and inventory checks passed; these exact conditions are not independently benchmarked.'}
 const value=freeze({ok:true,schemaVersion:'bounded-oxidation-pourbaix-v1',conservedComponent:model.inner.reference.componentId,system,grid,preparation,contract,points,support:scientificSupport,discovery:context.discovery??null,requestIdentity:context.requestIdentity??null,label:context.label??null})
 results.add(value);return value
}
export function pourbaixSample(result,index,currentRevision){
 if(!results.has(result)||currentRevision!==result.grid.revision||!Number.isInteger(index))return null
 const p=result.points[index],o=result.grid.outcomes[index]
 return o?.status==='converged'&&['classified','tie'].includes(p?.status)&&p.inputId===o.input.id?p:null
}
export function exportPourbaix(result,currentRevision){
 if(!results.has(result)||currentRevision!==result.grid.revision)return null
 return freeze({schemaVersion:result.schemaVersion,conservedComponent:result.conservedComponent,contract:result.contract,support:result.support,discovery:result.discovery,label:result.label,gridId:result.grid.gridId,systemId:result.system.id,revision:currentRevision,shape:result.grid.shape,points:result.points})
}
