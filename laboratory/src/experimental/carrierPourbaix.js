// Local research projection only. This module never grants public support or OS metadata.
import {preparePourbaixWorkflow,effectivePourbaixRequest,pourbaixRequestIdentity} from '../calculations/userPourbaix.js'
import {constructEquilibrium} from '../thermodynamics/equilibriumConstructor.js'
import {elementGridDefinition} from '../analysis/prepareElementCandidate.js'
import {createGridDefinition,runGrid} from '../calculations/grid.js'
import {acceptedState} from '../beaker/acceptedState.js'
import {componentBalanceTolerance} from '../solver/validationContract.js'

export const carrierTieTolerance=1e-8 // symmetric absolute fraction difference; no order-selected winner
export const carrierEligible=result=>!result?.ok&&result?.discovery?.canonicalEstablished===true&&result.discovery.inventoryComplete===false&&result.discovery.unresolvedCarriers.length>0
function carrierHue(id){
 let hash=2166136261
 for(const c of id){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619)}
 return (hash>>>0)%360
}
// Resolve neighboring hues deterministically over the sorted carrier identity set.
// A changed carrier set may change its palette; it never encodes oxidation state.
export function carrierColors(ids){
 const sorted=[...new Set(ids)].sort(),used=[],colors={}
 const separation=Math.min(32,180/Math.max(1,sorted.length))
 for(const id of sorted){let hue=carrierHue(id)
  for(let n=0;n<360&&used.some(h=>Math.min(Math.abs(h-hue),360-Math.abs(h-hue))<separation);n++)hue=(hue+137.508)%360
  used.push(hue);colors[id]=`hsl(${hue} 48% 55%)`
 }
 return colors
}

/** Rank source-basis component contributions, including aqueous and accepted solids.
 * Amounts remain in the source reaction normalization; no formula/OS inference.
 */
export function inspectCarrier(system,outcome,total){
 const base={pH:outcome.x,Eh:outcome.y,solverStatus:outcome.status,publicEnabled:false,supportStatus:'experimental-unreviewed',oxidationStateStatus:'unclassified / metadata pending',totalInventory:total}
 const state=outcome.status==='converged'&&outcome.scientificAcceptance==='passed'?acceptedState(system,outcome.input,outcome.result):{ok:false,message:'Equilibrium was not established for this point.'}
 if(!state.ok)return {...base,status:'gap',reason:state.message,diagnostics:outcome.diagnostics,carriers:[],dominant:null}
 const ordinary=system.components.findIndex(c=>c.role==='ordinary'),component=system.components[ordinary]
 const electron=system.components.findIndex(c=>c.role==='electron')
 const carriers=[{id:component.id,name:component.name,phase:'aqueous',amount:outcome.result.concentrations[ordinary],coefficient:1},...system.products.flatMap((p,j)=>{
  const coefficient=p.coefficients[ordinary]
  if(coefficient<=0)return []
  const amount=p.phase==='solid'?outcome.result.solids.find(s=>s.id===p.id)?.amount:outcome.result.concentrations[system.components.length+j]
  return [{id:p.id,name:p.name,phase:p.phase,amount,coefficient}]
 })].map(c=>({...c,contribution:c.amount*c.coefficient,fraction:c.amount*c.coefficient/total}))
 const inventory=carriers.reduce((s,c)=>s+c.contribution,0),residual=total-inventory,tolerance=componentBalanceTolerance(total,total)
 const detail={...base,pe:-outcome.result.logActivities[electron],carriers,inventory,residual,tolerance,dissolvedInventory:outcome.result.dissolvedComponentAmounts[ordinary],solids:state.solids,state}
 if(carriers.some(c=>!Number.isFinite(c.amount)||c.amount<0)||Math.abs(residual)>tolerance)return {...detail,status:'gap',reason:'Carrier inventory does not close within the existing component-balance tolerance.',dominant:null}
 const largest=Math.max(...carriers.map(c=>c.fraction)),leaders=carriers.filter(c=>largest-c.fraction<=carrierTieTolerance)
 return {...detail,status:leaders.length===1?'classified':'tie',dominant:leaders.length===1?leaders[0]:null,leaders}
}

export async function runCarrierPourbaix(session,repository,control={}){
 const readiness=await preparePourbaixWorkflow(session,repository)
 if(!carrierEligible(readiness))return {ok:false,publicEnabled:false,reason:'The local fallback requires constructible chemistry with incomplete oxidation-state metadata.'}
 const discovery=readiness.discovery,q=effectivePourbaixRequest(session,repository)
 const basisIds=discovery.basisIds??[q.componentId,...['proton','electron','solvent'].map(role=>repository.getComponents().find(c=>c.role===role)?.id)]
 const prepared=await constructEquilibrium(repository,{adapter:'source-imposed',options:{familyIds:[...new Set([...discovery.family.componentIds,...(discovery.materialComponentIds??[])])],basisIds,candidateIds:discovery.includedCandidates.map(r=>r.id),excludedIds:session.chemicalSystem.excludedSpecies??[]}})
 if(!prepared.ok)return {...prepared,publicEnabled:false,reason:'Generic source-basis preparation failed.'}
 const definition=await createGridDefinition(prepared.system,elementGridDefinition(prepared.system,q),session.revision)
 if(!definition.ok)return {...definition,publicEnabled:false,reason:'Experimental grid preparation failed.'}
 const grid=await runGrid(prepared.system,definition.grid,control)
 if(!grid.outcomes)return {...grid,ok:false,publicEnabled:false}
 const points=grid.outcomes.map(o=>inspectCarrier(prepared.system,o,q.total))
 return {ok:true,kind:'experimental-carrier-map',publicEnabled:false,supportStatus:'experimental-unreviewed',system:prepared.system,grid,points,request:q,requestIdentity:pourbaixRequestIdentity(session),discovery,omitted:prepared.omitted}
}
