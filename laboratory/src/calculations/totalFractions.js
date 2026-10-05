import {aqueousFractionScope,aqueousFractionState} from './aqueousFractions.js'
import {acceptedState} from '../beaker/acceptedState.js'
import {componentPartitions} from '../beaker/componentPartition.js'

export function totalFractionScope(system,componentId){
 const scope=aqueousFractionScope(system,componentId)
 if(!scope.ok)return scope
 if(system.products.some(p=>p.coefficients[scope.index]<0))return {ok:false,reason:'signed-component-inventory-unsupported'}
 return {...scope,contributors:[...scope.contributors.map(c=>({...c,phase:'aqueous'})),...system.products.filter(p=>p.phase==='solid'&&p.coefficients[scope.index]>0).map(p=>({id:p.id,name:p.name,phase:'solid',kind:'reaction-product',coefficient:p.coefficients[scope.index]}))]}
}
/** Accepted analytical inventory only. Never normalize an incomplete partition to one. */
export function totalFractionState(system,input,result,componentId){
 const scope=totalFractionScope(system,componentId)
 if(!scope.ok)return scope
 const partition=componentPartitions(acceptedState(system,input,result)).find(p=>p.id===componentId)
 if(!partition?.ok)return {ok:false,reason:partition?.reason??'accepted-equilibrium-required'}
 const aqueous=aqueousFractionState(system,result,componentId)
 const contributors=scope.contributors.map(c=>{
  const amount=c.phase==='solid'?result.solids.find(s=>s.id===c.id)?.amount:result.concentrations[c.speciesIndex]
  const componentAmount=c.coefficient*amount
  return {...c,amount,componentAmount,fraction:componentAmount/partition.suppliedTotal,dissolvedFraction:c.phase==='aqueous'&&aqueous.ok?aqueous.contributors.find(a=>a.id===c.id)?.fraction:null}
 })
 const allocated=contributors.reduce((s,c)=>s+c.componentAmount,0),residual=allocated-partition.suppliedTotal
 if(contributors.some(c=>!Number.isFinite(c.componentAmount)||c.componentAmount<0)||Math.abs(residual)>partition.balanceTolerance)return {ok:false,reason:'total-carrier-inventory-does-not-close'}
 return {ok:true,reason:null,contributors,total:partition.suppliedTotal,totalDissolved:partition.dissolvedAmount,sumFractions:allocated/partition.suppliedTotal,residual,balanceTolerance:partition.balanceTolerance}
}
