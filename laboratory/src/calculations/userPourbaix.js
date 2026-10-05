import {discoverRedoxSystem,isDiscoveredRedox,redoxComponentChoices} from '../analysis/redoxDiscovery.js'
import {redoxSupportCatalog} from '../analysis/redoxSupportCatalog.js'
import {elementGridDefinition} from '../analysis/prepareElementCandidate.js'
import {runBoundedPourbaix,isPourbaixResult} from './boundedPourbaix.js'
import {createGridDefinition} from './grid.js'
import {componentBalanceTolerance} from '../solver/validationContract.js'
import {oxidationTieTolerance} from '../analysis/oxidationInventory.js'
import {identity} from '../solver/models.js'

export function configurePourbaixDefinition(definition,components=[]){
 const d=structuredClone(definition),ordinary=components.find(c=>c.role==='basis-choice'),total=d.componentConditions.find(c=>c.componentId===ordinary?.id&&c.mode==='T'&&c.quantity==='total'&&c.unit==='mol/kg-H2O')?.value
 delete d.predominanceArea;delete d.imposedEh;delete d.publicFePourbaix;delete d.mixedSolubility;delete d.solubilityComparison;delete d.gridMultiSolid
 d.pourbaix=d.pourbaix??{componentId:ordinary?.id??'',total:Number.isFinite(total)&&total>0?total:0.001,pH:{min:0,max:14,points:57},Eh:{min:-1,max:1.2,points:45}}
 d.dimensions=2
 return d
}
export function effectivePourbaixRequest(session,repository){
 const q=session.calculationDefinition.pourbaix
 if(!q)return null
 if(q.componentId){const additionalTotals=Object.fromEntries(session.chemicalSystem.selectedComponents.filter(id=>id!==q.componentId&&repository.getComponentById(id)?.role==='basis-choice').map(id=>[id,q.additionalTotals?.[id]??session.calculationDefinition.componentConditions.find(c=>c.componentId===id&&c.mode==='T')?.value]));return {...q,additionalTotals}}
 const choices=redoxComponentChoices(repository),selected=session.chemicalSystem.selectedElements
 return {...q,componentId:choices.find(c=>selected.includes(c.label))?.componentId??''}
}
export const pourbaixRequestIdentity=session=>JSON.stringify({chemicalSystem:session.chemicalSystem,calculationDefinition:session.calculationDefinition})
export function pourbaixInputReason(d,q){
 if(!q?.componentId)return 'Select a redox component. Choose an element in System or load a redox example.'
 if(d.temperature.value!==25||d.pressure.value!==1||d.activityModel!=='ideal'||d.ionicStrength.unit!=='mol/kg-H2O'||(d.ionicStrength.mode==='fixed'&&d.ionicStrength.value!==0))return 'This calculation supports Ideal activity at 25 °C and 1 bar declared, with automatic or fixed-zero ionic strength.'
 if(!Number.isFinite(q.total)||q.total<=0)return 'Enter a positive analytical total in mol/kg H₂O.'
 if(componentBalanceTolerance(q.total,q.total)/q.total>oxidationTieTolerance/4)return 'This total is too small for the existing inventory-resolution and tie tolerances. Increase the total; tolerances are not relaxed.'
 for(const key of ['pH','Eh']){const a=q[key];if(!a||!Number.isFinite(a.min)||!Number.isFinite(a.max)||a.min>=a.max||!Number.isInteger(a.points)||a.points<2)return `Enter an increasing ${key} range and at least two integer samples.`}
 if(q.pH.points*q.Eh.points>10000)return 'The existing grid limit is 10,000 points. Reduce sampling.'
 return null
}
export async function preparePourbaixWorkflow(session,repository){
 const q=effectivePourbaixRequest(session,repository),d=session.calculationDefinition
 const reason=pourbaixInputReason(d,q)
 if(reason)return {ok:false,status:'unsupported',reason}
 const discovery=await discoverRedoxSystem(repository,{componentId:q.componentId,selectedComponents:session.chemicalSystem.selectedComponents,excludedSpecies:session.chemicalSystem.excludedSpecies??[],enabledPhases:d.enabledPhases.filter(p=>session.chemicalSystem.enabledPhases.includes(p))},redoxSupportCatalog)
 if(!discovery.ok)return discovery
 const ref=discovery.reference,actualSolids=discovery.system.products.filter(p=>p.phase==='solid').map(p=>p.id)
 const phaseScopeVersion=JSON.stringify(actualSolids)===JSON.stringify(ref.includedSolids)&&!(session.chemicalSystem.excludedSpecies??[]).length?ref.phaseScopeVersion:'discovered-phase-scope:'+await identity({systemId:discovery.system.id,included:actualSolids,excluded:discovery.discovery.excludedCandidates})
 const contract={...ref,version:'user-selected-pourbaix-v1',systemId:discovery.system.id,total:q.total,
  pH:{...q.pH,step:(q.pH.max-q.pH.min)/(q.pH.points-1)},Eh:{...q.Eh,step:(q.Eh.max-q.Eh.min)/(q.Eh.points-1),reference:'SHE'},
  includedSolids:actualSolids,excluded:discovery.discovery.excludedCandidates.filter(r=>r.reason!=='requires-components-outside-selected-family'),phaseScopeVersion,
  claim:'User-selected conditions; scientific status requires accepted equilibrium at every requested point.'}
 const definition=elementGridDefinition(discovery.system,contract)
 const grid=await createGridDefinition(discovery.system,definition,session.revision)
 if(!grid.ok)return {ok:false,status:'unsupported',reason:grid.diagnostics.map(d=>d.message).join(' '),discovery:discovery.discovery}
 const matches=discovery.system.id===ref.systemId&&q.total===ref.total&&['pH','Eh'].every(k=>['min','max','points'].every(v=>q[k][v]===ref[k][v]))&&phaseScopeVersion===ref.phaseScopeVersion
 return {ok:true,preparation:discovery,contract,definition,request:q,requestIdentity:pourbaixRequestIdentity(session),referenceMatch:matches,readiness:matches?'Reference conditions matched; awaiting calculation checks.':'Not independently benchmarked at these conditions; awaiting internal calculation checks.'}
}
export async function runUserPourbaix(session,repository,control={}){
 const p=await preparePourbaixWorkflow(session,repository)
 if(!p.ok)return p
 if(!isDiscoveredRedox(p.preparation))return {ok:false,reason:'Unaccepted redox discovery.'}
 return runBoundedPourbaix(p.preparation,p.definition,session.revision,p.contract,control,{referenceContract:p.preparation.reference,discovery:p.preparation.discovery,requestIdentity:p.requestIdentity,label:p.preparation.label,referenceAllowed:p.referenceMatch})
}
export function isCurrentUserPourbaix(session,result){return isPourbaixResult(result)&&!!session.calculationDefinition.pourbaix&&result.grid.revision===session.revision&&result.requestIdentity===pourbaixRequestIdentity(session)}
export function commitUserPourbaix(session,result){
 if(!isCurrentUserPourbaix(session,result))return session
 return {...session,lastPoint:null,lastPlot:{system:result.system,grid:result.grid,pourbaix:result},gridResult:result.grid,sweepResult:null,gridRequest:null,sweepRequest:null,pointRequest:null,calculationResult:null,calculationStatus:'completed'}
}
