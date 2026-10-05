import {normalizeAutomaticDefinition,boundaryComponents} from './automaticBoundaries.js'
import {fePeroxideScope} from '../thermodynamics/scopes/fePeroxide.js'
import {runClosedReagentSweep,runAutomaticClosedSweep} from './closedReagentSweep.js'
import {closedReagentPlot} from './closedReagentPlot.js'
import {freeze} from '../solver/models.js'
import {discoverGeneralClosed} from '../thermodynamics/generalClosedReagents.js'
export const closedReagentIds={Fe:'component:Fe%202%2B',peroxide:'component:H2O2',proton:'component:H%2B',chloride:'component:Cl-',water:'component:H2O'}
const ids=closedReagentIds,results=new WeakSet()
const identity=session=>JSON.stringify({chemicalSystem:session.chemicalSystem,definition:session.calculationDefinition})
export function closedReagentReason(session){
 const selected=session.chemicalSystem.selectedComponents
 if(selected.includes('component:e-'))return 'Closed redox derives Eh. Remove e⁻; it is reserved for imposed electron activity.'
 if(!Object.values(ids).every(id=>selected.includes(id))||selected.some(id=>!Object.values(ids).includes(id)))return 'Reviewed scope requires Fe²⁺, H₂O₂, H⁺, Cl⁻ and H₂O only. Select these actual reagent components; no e⁻.'
 if(session.chemicalSystem.excludedSpecies?.length||session.chemicalSystem.optionalSpecies?.length)return 'The reviewed closed scope does not support custom reaction exclusions or additions.'
 return null
}
export function configureClosedReagents(definition){
 const d=structuredClone(definition)
 for(const key of ['imposedEh','pourbaix','publicFePourbaix','mixedSolubility','gridMultiSolid','solubilityComparison'])delete d[key]
 d.dimensions=1;d.closedReagents={scopeVersion:fePeroxideScope.version,axis:{min:0,max:1e-6,points:21},ordinaryDefinition:structuredClone(definition)}
 return d
}
export async function runClosedReagentCalculation(session,repository,control={}){
 const reason=closedReagentReason(session),q=session.calculationDefinition.closedReagents
 if(reason||q?.scopeVersion!==fePeroxideScope.version)return {ok:false,reason:reason??'The reviewed closed-reagent scope is unavailable. No ordinary sweep was substituted.'}
 const discovery=await discoverGeneralClosed(repository,session.chemicalSystem.selectedComponents,{reviewedScope:true})
 if(!discovery.canCalculate)return {ok:false,reason:discovery.reasons.map(r=>r.message).join(' '),diagnostics:discovery.reasons}
 if(!q.axis||Object.keys(q.axis).some(k=>!['min','max','points'].includes(k)))return {ok:false,reason:'Specify only the supplied H₂O₂ range and sample count for this reviewed scope.'}
 const request={amounts:{[ids.Fe]:1e-6,[ids.peroxide]:2.5e-7,[ids.proton]:.01,[ids.chloride]:.010002},description:'Reviewed Step-5 acidic Fe(II)/H2O2 addition; internal electron exchange',revision:session.revision,temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O'}
 const closed=await runClosedReagentSweep(repository,request,fePeroxideScope,{reagentId:ids.peroxide,...q.axis},control)
 if(!closed.ok)return {...closed,reason:closed.diagnostics?.map(d=>d.message).join(' ')||'Closed reagent calculation was cancelled, stale or unavailable. No ordinary sweep was substituted.'}
 const view=closedReagentPlot(closed)
 if(!view.ok)return view
 const value=freeze({...view,closed,request,requestIdentity:identity(session)});results.add(value);return value
}
export const isCurrentClosedReagentCalculation=(session,value)=>results.has(value)&&value.sweep.revision===session.revision&&value.requestIdentity===identity(session)
export function commitClosedReagentCalculation(session,value){
 if(!isCurrentClosedReagentCalculation(session,value))return session
 return {...session,lastPoint:null,lastPlot:{system:value.system,sweep:value.sweep,closedReagents:value},sweepResult:value.sweep,gridResult:null,calculationResult:null,calculationStatus:value.sweep.status,pointRequest:null,sweepRequest:null,gridRequest:null,visualizationState:{...session.visualizationState,plot:{...session.visualizationState.plot,componentId:value.closed.generic?session.visualizationState.plot?.componentId:ids.Fe,visibleIds:null}}}
}

export async function runAutomaticClosedCalculation(session,repository,control={}){
 const components=boundaryComponents(session.chemicalSystem.selectedComponents.map(id=>repository.getComponentById(id)),repository)
 const effective={...session,calculationDefinition:normalizeAutomaticDefinition(session.calculationDefinition,components)}
 const closed=await runAutomaticClosedSweep(repository,effective,control)
 if(!closed.ok)return closed
 const view=closedReagentPlot(closed);if(!view.ok)return {...view,diagnostics:closed.outcomes.flatMap(o=>o.diagnostics)}
 const value=freeze({...view,closed,requestIdentity:identity(session)});results.add(value);return value
}
