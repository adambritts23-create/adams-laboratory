import {matchesAutomaticConstruction} from '../calculations/automaticBoundaries.js'
import {isCurrentClosedReagentCalculation,closedReagentIds} from '../calculations/closedReagentSetup.js'
import {presentRedoxState} from './redoxPresentation.js'
import {isCurrentImposedEh} from '../calculations/imposedEh.js'
import {isSweepResult} from '../calculations/sweep.js'
import {isGridResult} from '../calculations/grid.js'
import {acceptedState} from '../beaker/acceptedState.js'
import {isCurrentUserPourbaix} from '../calculations/userPourbaix.js'
import {pourbaixSample} from '../calculations/boundedPourbaix.js'
import {isPublicFeResult,publicFeSample} from '../calculations/publicFePourbaix.js'
import {publicFeSetupReason} from '../calculations/fePublicSetup.js'
export function selectionReducer(state,action){
 if(action.type==='leave')return {...state,hover:null}
 if(!Number.isInteger(action.index)||action.index<0||action.index>=action.count)return state
 return action.type==='pin'?{pinned:action.index,hover:null}:action.type==='hover'?{...state,hover:action.index}:state
}
export function selectedEquilibrium(session,index=0){
 const snapshot=session.lastPoint??session.lastPlot
 if(!snapshot)return {ok:false,message:'Calculate a state to view the beaker.'}
 if(snapshot.comparison)return {ok:false,message:'Independent overlays contain separate equilibria; no single mixed state is assigned.'}
 const run=snapshot.grid??snapshot.sweep
 if(run&&!(snapshot.grid?isGridResult(run):isSweepResult(run)))return {ok:false,message:'This saved calculation must be recalculated before inspection.'}
 const outcome=run?.outcomes[index],result=run?outcome?.result:snapshot.result,input=run?outcome?.input:snapshot.input
 if((run?.revision??result?.revision)!==session.revision)return {ok:false,message:'Results belong to old conditions. Recalculate to view the current beaker.'}
 if(run&&(outcome?.status!=='converged'||outcome.scientificAcceptance!=='passed'))return {ok:false,message:'Equilibrium was not established for this point.',diagnostics:outcome?.diagnostics??[]}
 const closed=snapshot.closedReagents
 if(closed&&(!isCurrentClosedReagentCalculation(session,closed)||closed.sweep!==run||closed.system!==snapshot.system))return {ok:false,message:'This closed-reagent result is stale or belongs to a different scope.'}
 const imposed=snapshot.imposedEh
 if(imposed&&(!isCurrentImposedEh(session,imposed)||imposed.sweep!==run||imposed.system!==snapshot.system))return {ok:false,message:'This imposed-Eh result is stale or belongs to different conditions.'}
 const generic=snapshot.pourbaix
 if(generic&&(!isCurrentUserPourbaix(session,generic)||generic.grid!==run||!pourbaixSample(generic,index,session.revision)))return {ok:false,message:'This Pourbaix result is stale or belongs to different conditions.'}
 const publicFe=snapshot.publicFe
 if(publicFe){
  if(!isPublicFeResult(publicFe)||publicFe.grid!==run||!publicFeSample(publicFe,index,session.revision)||publicFeSetupReason(session,publicFe.preparation,{axes:true}))return {ok:false,message:'This Fe result is unavailable or belongs to a different validated scope.'}
 }else if(!generic&&!imposed&&!closed&&!matchesAutomaticConstruction(snapshot.system,session)&&(!snapshot.system?.components.every(c=>session.chemicalSystem.selectedComponents.includes(c.id))||!snapshot.system?.products.every(p=>session.chemicalSystem.selectedSpecies.includes(p.id))))return {ok:false,message:'This result belongs to different chemistry. Recalculate the current system.'}
 const state=acceptedState(snapshot.system,input,result)
 if(closed?.closed.generic&&state.ok)return {...state,automaticClosedInspection:outcome.closedAccepted.inspection,index,outcome}
 if(closed&&state.ok)return {...state,components:state.components.filter(c=>c.id===closedReagentIds.Fe).map(c=>({...c,name:'Fe'})),closedReagents:outcome.closedAccepted.inspection,suppliedPeroxide:outcome.coordinate,phaseMessage:'Reviewed aqueous-only closed scope. Solids and gases were excluded, not solved as absent phases.',index,outcome}
 if(imposed&&state.ok)return {...presentRedoxState(state,imposed.redoxPresentation),waterReferences:imposed.waterReferences,index,outcome,imposedEh:true,Eh:imposed.request.mode==='fixed'?(imposed.request.fixedEh??0):outcome.coordinate,fixedPH:imposed.request.mode==='fixed'?null:imposed.request.pH,phaseScope:imposed.scope}
 if(generic&&state.ok)return {...state,components:state.components.map(c=>({...c,name:c.id===generic.conservedComponent?generic.label:c.name})),index,outcome}
 if(publicFe&&state.ok)return {...state,components:state.components.map(c=>({...c,name:c.id===snapshot.system.components[0].id?'Fe':c.name})),index,outcome}
 return {...state,index,outcome}
}
