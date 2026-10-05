import {acceptedState} from './acceptedState.js'
import {prepareSessionPoint} from '../solver/prepareSession.js'
import {createPointInput} from '../solver/models.js'
import {solvePoint,isSuccessfulPointResult} from '../solver/point.js'
import {toSourceInput} from '../calculations/definition.js'

const unavailable=(reason,message,diagnostics=[])=>({ok:false,reason,message:'This system cannot currently be evaluated in Interactive Beaker. '+message,diagnostics,visual:null})
export function beakerPHControl(session,repository){
 const proton=session.chemicalSystem.selectedComponents.map(id=>repository.getComponentById(id)).find(c=>c?.role==='proton')
 const d=session.calculationDefinition,axis=d.independentVariables.find(c=>c.componentId===proton?.id),fixed=d.componentConditions.find(c=>c.componentId===proton?.id),c=axis??fixed
 const controllable=!!proton&&!!c&&['LA','LAV'].includes(c.mode)&&['pH','log-activity'].includes(c.quantity)
 const value=axis?null:c?.quantity==='pH'?c.value:c?.quantity==='log-activity'?-c.value:null
 return {controllable,componentId:proton?.id,initial:value??(axis?.quantity==='pH'?Math.max(axis.range.min,Math.min(axis.range.max,7)):7),min:axis?.quantity==='pH'?axis.range.min:0,max:axis?.quantity==='pH'?axis.range.max:14}
}
/** One accepted current-session point. No fixture, species rules or new equilibrium model. */
export async function calculateBeakerPoint(session,repository,pH=null){
 try{
  const d=session.calculationDefinition,control=beakerPHControl(session,repository)
  if(d.solubilityComparison)return unavailable('independent-overlays-not-one-state','Independent-system overlays are not a single equilibrium. Disable comparison in Calculation.')
  if(d.independentVariables.some(a=>a.componentId!==control.componentId)||d.independentVariables.length>1)return unavailable('unfixed-beaker-coordinate','Fix the non-pH swept variables in Calculation before inspecting a single Beaker state; no total is selected implicitly.')
  if(pH!==null&&(!control.controllable||pH===''||!Number.isFinite(Number(pH))))return unavailable('invalid-beaker-pH','Choose a finite pH only when proton activity is controlled.')
  const prepared=await prepareSessionPoint(session,repository,{sweep:d.independentVariables.length===1})
  if(!prepared.ok)return unavailable('beaker-preparation-failed',prepared.diagnostics.map(x=>x.message).join(' '),prepared.diagnostics)
  const constraints=[]
  for(const c of prepared.system.components){
   let condition=d.componentConditions.find(f=>f.componentId===c.id)
   if(c.id===control.componentId&&control.controllable){condition={componentId:c.id,mode:'LA',quantity:'pH',unit:'dimensionless',value:pH===null?control.initial:Number(pH)}}
   if(!condition)return unavailable('missing-beaker-condition','Enter a fixed condition for '+c.name+' in Calculation.')
   const mapped=toSourceInput(condition,condition.value,d.temperature.value)
   constraints.push({componentId:c.id,kh:mapped.kh,value:mapped.value})
  }
  const input=await createPointInput(prepared.system,{constraints,revision:session.revision,unit:'mol/kg-H2O',temperatureC:d.temperature.value,pressureBar:d.pressure.value,activityModel:d.activityModel})
  if(!input.ok)return unavailable('beaker-input-failed',input.diagnostics.map(x=>x.message).join(' '),input.diagnostics)
  const result=solvePoint(prepared.system,input.input)
  if(!isSuccessfulPointResult(result))return unavailable('beaker-equilibrium-failed','No accepted equilibrium at this pH. Inspect the solver diagnostics.',[...(result.diagnostics??[]),...(result.attempts??[])])
  return acceptedState(prepared.system,input.input,result)
 }catch(error){return unavailable('beaker-request-failed',error.message)}
}
export function beakerPointJSON(state){if(!state?.ok||!isSuccessfulPointResult(state.result))throw Error('An accepted current equilibrium is required.');return JSON.stringify(state,null,2)}
