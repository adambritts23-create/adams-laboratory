import {totalFractionState} from './totalFractions.js'
import {aqueousFractionState} from './aqueousFractions.js'
import {logConcentrationValue} from './outputs.js'
import {freeze} from '../solver/models.js'

/** Presentation only: original branded states/input/result references, no sweep or solver impersonation. */
export function createWetLabAnalysis(experience){
 const cache=new Map()
 function samples(){return experience.snapshot().points.map(point=>({point,state:experience.validate(point)}))}
 return Object.freeze({
  view(type,componentId=null){
   const rows=samples(),key=JSON.stringify([type,componentId,rows.map(r=>r.state.id)])
   if(cache.has(key))return cache.get(key)
   const components=[...new Map(rows.flatMap(({state})=>state.equilibrium.elementInventories?Object.keys(state.equilibrium.elementInventories).map(key=>[`element:${key}`,{id:`element:${key}`,name:key}]):(state.equilibrium.system?.components.filter(c=>c.role==='ordinary'&&!c.suppressed).map(c=>[c.id,c])??[]))).values()]
   const carrierIds=[...new Set(rows.flatMap(({state})=>state.equilibrium.result?.speciesIds??[]))].sort()
   const catalog=new Map(),values=rows.map(({state})=>{
    const {system,input,result}=state.equilibrium
    if(state.status!=='accepted-v0')return {reason:'equilibrium-unavailable',values:new Map()}
    if(type==='titration'){catalog.set('pH',{id:'pH',name:'pH',phase:'derived'});return {values:new Map([['pH',{value:state.pH,reason:null}]])}}
    if(type==='log-concentration'||type==='log-activity'){
     const carriers=[...system.components.map(c=>({...c,phase:c.role==='water'?'liquid':'aqueous'})),...system.products]
     return {values:new Map(carriers.flatMap((c,i)=>{if(!(c.phase==='aqueous'||type==='log-concentration'&&c.phase==='solid')||c.suppressed)return [];catalog.set(c.id,{id:c.id,name:c.name,phase:c.phase});return [[c.id,type==='log-activity'?{value:Number.isFinite(result.logActivities[i])?result.logActivities[i]:null,reason:Number.isFinite(result.logActivities[i])?null:'activity-unavailable'}:logConcentrationValue(system,result,i)]]}))}
    }
    if(state.equilibrium.elementInventories){
     const element=componentId?.startsWith('element:')?componentId.slice(8):null
     const inventory=state.equilibrium.conservedInventories.find(r=>r.key===element)
     const dissolved=state.equilibrium.elementInventories[element]?.dissolved
     const denominator=type==='total-fraction'?inventory?.total:dissolved
     if(!(denominator>0))return {reason:'no-positive-conserved-inventory',values:new Map()}
     return {values:new Map(state.equilibrium.elementCarriers.filter(c=>(c.elements[element]??0)>0&&(type==='total-fraction'||c.phase==='aqueous')).map(c=>{
      catalog.set(c.id,{id:c.id,name:c.name,phase:c.phase})
      const amount=c.amount*c.elements[element]
      return [c.id,{value:amount/denominator,reason:null,dissolvedFraction:c.phase==='aqueous'&&dissolved>0?amount/dissolved:null}]
     }))}
    }
    const fraction=type==='total-fraction'?totalFractionState(system,input,result,componentId):aqueousFractionState(system,result,componentId)
    if(!fraction.ok)return {reason:fraction.reason,values:new Map()}
    return {values:new Map(fraction.contributors.map(c=>{catalog.set(c.id,{id:c.id,name:c.name,phase:c.phase??'aqueous'});return [c.id,{value:c.fraction,reason:null,dissolvedFraction:type==='aqueous-fraction'?c.fraction:c.dissolvedFraction}]}))}
   })
   const series=[...catalog.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(c=>({...c,colorIndex:Math.max(0,carrierIds.indexOf(c.id)),points:rows.map(({point,state},i)=>({x:point.x,state,input:state.equilibrium.input,result:state.equilibrium.result,index:state.index,revision:state.revision,...(values[i].values.get(c.id)??{value:null,reason:values[i].reason??'carrier-absent-from-accepted-system'})}))}))
   const view=freeze({type,componentId,components,series,points:rows.map(r=>r.point),available:series.length>0,reason:series.length?null:'No valid positive ordinary-component denominator. Signed proton equivalents are not a positive material inventory.'})
   cache.set(key,view);return view
  },
  inspect(point){return experience.validate(point)},
 })
}

export function nearestWetLabPoint(points,x,{acceptedOnly=false}={}){
 const eligible=acceptedOnly?points.filter(p=>p.state.status==='accepted-v0'):points
 return eligible.length?eligible.reduce((a,b)=>Math.abs(b.x-x)<Math.abs(a.x-x)?b:a):null
}

