import {validateOutputRequest} from '../calculations/outputDescriptors.js'
import {isSweepResult} from '../calculations/sweep.js'
import {isPrepared} from '../solver/models.js'

export const resultViews=[
 {type:'log-concentration',label:'Log concentrations',kind:'same-data'},
 {type:'total-fraction',label:'Total fractions',kind:'adapter',component:true},
 {type:'aqueous-fraction',label:'Aqueous speciation',kind:'adapter',component:true},
 {type:'saturated-log-solubility',label:'Log solubility',kind:'adapter',component:true},
 {type:'log-activity',label:'Log activities',kind:'same-data'},
 {type:'relative-log-activity',label:'Relative activities',unavailable:'Validation pending'},
]
export function resultViewOptions(snapshot,plot={}){
 if(!isPrepared(snapshot?.system)||!isSweepResult(snapshot?.sweep))return {components:[],options:[]}
 const components=snapshot.system.components.filter(c=>c.role==='ordinary'&&!c.suppressed)
 const componentId=components.some(c=>c.id===plot.componentId)?plot.componentId:components.length===1?components[0].id:null
 const d=snapshot.sweep.definition.calculationDefinition
 const options=resultViews.map(view=>{
  const request={type:view.type,...(view.component?{componentId}:{})}
  const unavailable=view.unavailable??(d.mixedSolubility&&!view.component?'This mixed-system adapter supports fractions and saturated solubility only.':null)
  const check=unavailable?{ok:false,diagnostics:[{message:unavailable}]}:validateOutputRequest(snapshot.system,request,{definition:d})
  return {...view,request,available:check.ok,reason:check.diagnostics.map(d=>d.message).join(' ')}
 })
 return {components,componentId,options}
}
/** Result projection state is separate from the draft calculation definition. No solve route. */
export function resultViewTransition(snapshot,plot,type){
 const option=resultViewOptions(snapshot,plot).options.find(x=>x.type===type)
 if(!option?.available)return {ok:false,kind:'unavailable',reason:option?.reason??'No compatible accepted sweep.'}
 return {ok:true,kind:option.kind,plot:{...plot,...option.request,visibleIds:null,yRange:null,colorRange:null}}
}
export function resultSession(session,plot){return {...session,visualizationState:{...session.visualizationState,plot}}}
/** Rejected output requests contain diagnostics, not metadata. */
export function sweepHeading(derived){
 if(!derived?.ok)return 'Output unavailable'
 return derived.metadata.output.type==='total-fraction'?'Total component partition':derived.metadata.output.type==='aqueous-fraction'?'Aqueous speciation':derived.metadata.phaseChanges?'Mixed-system solubility':'Species curves'
}
