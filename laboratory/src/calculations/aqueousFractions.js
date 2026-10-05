import { isPrepared } from '../solver/models.js'
import { isSuccessfulPointResult } from '../solver/point.js'
import { numericalValidationContract } from '../solver/validationContract.js'

// Output eligibility only: no change to equilibrium acceptance or solver tolerances.
export const aqueousFractionNumerics = Object.freeze({ minimumDissolvedAmount: numericalValidationContract.sourceAbsoluteBalanceFloor, sumTolerance: 1e-12 })
const sum = values => { let total=0, correction=0; for(const value of values){const y=value-correction,t=total+y;correction=(t-total)-y;total=t} return total }
export function aqueousFractionScope(system, componentId) {
  if(!isPrepared(system)) return {ok:false,reason:'prepared-system-required'}
  const index=system.components.findIndex(c=>c.id===componentId), component=system.components[index]
  if(!component || component.suppressed || component.role!=='ordinary') return {ok:false,reason:'ordinary-component-required'}
  if(system.aqueousRows.some(j=>system.products[j].coefficients[index]<0)) return {ok:false,reason:'signed-aqueous-inventory-unsupported'}
  const contributors=[{id:component.id,name:component.name,coefficient:1,speciesIndex:index,kind:'free-component'},...system.aqueousRows.filter(j=>system.products[j].coefficients[index]>0).map(j=>({id:system.products[j].id,name:system.products[j].name,coefficient:system.products[j].coefficients[index],speciesIndex:system.components.length+j,kind:'reaction-product'}))].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)
  return {ok:true,index,component,contributors}
}
/** Pure normalization of selected aqueous contributions; never include solid amounts. */
export function normalizeAqueousContributions(contributors) {
  const rows=contributors.map(c=>({...c,weightedMolality:c.coefficient*c.molality}))
  const unavailable=reason=>({ok:false,reason,totalDissolved:null,sumFractions:null,contributors:rows.map(c=>({...c,fraction:null}))})
  if(!rows.length || rows.some(c=>!Number.isFinite(c.coefficient)||c.coefficient<=0||!Number.isFinite(c.molality)||c.molality<0||!Number.isFinite(c.weightedMolality))) return unavailable('invalid-aqueous-contribution')
  const totalDissolved=sum(rows.map(c=>c.weightedMolality))
  if(!Number.isFinite(totalDissolved)) return unavailable('nonfinite-dissolved-total')
  if(totalDissolved<=aqueousFractionNumerics.minimumDissolvedAmount) return {...unavailable('dissolved-total-below-fraction-resolution'),totalDissolved}
  const normalized=rows.map(c=>({...c,fraction:c.weightedMolality/totalDissolved})), sumFractions=sum(normalized.map(c=>c.fraction))
  if(normalized.some(c=>!Number.isFinite(c.fraction)||c.fraction<0||c.fraction>1)||Math.abs(sumFractions-1)>aqueousFractionNumerics.sumTolerance) return {...unavailable('aqueous-fraction-normalization-failed'),totalDissolved}
  return {ok:true,reason:null,totalDissolved,sumFractions,contributors:normalized}
}
export function aqueousFractionState(system, result, componentId) {
  const scope=aqueousFractionScope(system,componentId)
  if(!scope.ok) return scope
  if(!isSuccessfulPointResult(result)||result.systemId!==system.id) return {ok:false,reason:'accepted-equilibrium-required'}
  return normalizeAqueousContributions(scope.contributors.map(c=>({...c,molality:result.concentrations[c.speciesIndex]})))
}
