import {redoxPresentation} from '../plots/redoxPresentation.js'
import {imposedEhWaterReferences} from '../analysis/imposedEhWaterReferences.js'
import {discoverRedoxSystem,redoxComponentChoices} from '../analysis/redoxDiscovery.js'
import {redoxSupportCatalog} from '../analysis/redoxSupportCatalog.js'
import {constructEquilibrium} from '../thermodynamics/equilibriumConstructor.js'
import {elementGridDefinition} from '../analysis/prepareElementCandidate.js'
import {createSweepDefinition,runSweep,isSweepResult} from './sweep.js'
import {freeze,identity} from '../solver/models.js'

const results=new WeakSet()
export const imposedEhIdentity=session=>JSON.stringify({chemicalSystem:session.chemicalSystem,definition:session.calculationDefinition})
export function configureImposedEh(definition,components=[]){
 const d=structuredClone(definition),ordinary=components.find(c=>c.role==='basis-choice')
 const total=d.componentConditions.find(c=>c.componentId===ordinary?.id&&c.mode==='T'&&c.unit==='mol/kg-H2O')?.value
 const pH=d.componentConditions.find(c=>c.quantity==='pH')?.value
 for(const key of ['pourbaix','publicFePourbaix','mixedSolubility','gridMultiSolid'])delete d[key]
 d.solubilityComparison=null;d.dimensions=1
 d.imposedEh??={componentId:ordinary?.id??'',total:Number.isFinite(total)&&total>0?total:0.001,pH:Number.isFinite(pH)?pH:7,Eh:{min:-2,max:2,points:17}}
 return d
}
export function effectiveImposedEh(session,repository){
 const q=session.calculationDefinition.imposedEh
 if(!q)return null
 return {...q,componentId:q.componentId||redoxComponentChoices(repository).find(c=>session.chemicalSystem.selectedElements.includes(c.label))?.componentId||''}
}
export async function prepareImposedEh(session,repository){
 const d=session.calculationDefinition,q=effectiveImposedEh(session,repository)
 const fail=reason=>({ok:false,reason})
 if(!q?.componentId)return fail('Select a redox element in System.')
 if(!session.chemicalSystem.selectedComponents.some(id=>repository.getComponentById(id)?.role==='electron'))return fail('Select e⁻ in System to impose electron activity.')
 if(q.mode!==undefined&&!['fixed','sweep'].includes(q.mode))return fail('Choose fixed Eh or an imposed Eh sweep.')
 if((q.mode==='fixed'?!Number.isFinite(q.fixedEh===undefined?0:q.fixedEh):!Number.isFinite(q.pH))||!Number.isFinite(q.total)||q.total<=0)return fail('Enter fixed pH and a positive analytical total.')
 if(!q.Eh)return fail('Enter the imposed Eh range and sampling.')
 const discovery=await discoverRedoxSystem(repository,{componentId:q.componentId,selectedComponents:session.chemicalSystem.selectedComponents,excludedSpecies:session.chemicalSystem.excludedSpecies??[],enabledPhases:d.enabledPhases.filter(p=>session.chemicalSystem.enabledPhases.includes(p))},redoxSupportCatalog)
 let prepared=discovery
 // Missing oxidation allocations do not prevent a carrier sweep. No OS is inferred.
 if(!discovery.ok){
  const report=discovery.discovery
  if(!report?.canonicalEstablished||report.inventoryComplete||!report.unresolvedCarriers.length)return discovery
  prepared=await constructEquilibrium(repository,{adapter:'source-imposed',options:{familyIds:report.family.componentIds,basisIds:[q.componentId,...['proton','electron','solvent'].map(role=>repository.getComponents().find(c=>c.role===role)?.id)],candidateIds:report.includedCandidates.map(r=>r.id),excludedIds:session.chemicalSystem.excludedSpecies??[]}})
  if(!prepared.ok)return {...prepared,reason:'Source reaction-basis preparation is unavailable.'}
 }
 const system=prepared.system
 const definition=elementGridDefinition(system,{total:q.total,pH:{min:q.pH,max:q.pH,points:2},Eh:q.Eh})
 definition.dimensions=1
 definition.componentConditions.push({componentId:definition.independentVariables[0].componentId,mode:'LA',quantity:'pH',unit:'dimensionless',value:q.pH})
 definition.independentVariables=definition.independentVariables.slice(1)
 if(q.mode==='fixed'){
  const proton=system.components.find(c=>c.role==='proton'),electron=system.components.find(c=>c.role==='electron'),range=q.pHRange??{min:0,max:14,points:51}
  definition.componentConditions=definition.componentConditions.filter(c=>c.componentId!==proton.id)
  definition.componentConditions.push({componentId:electron.id,mode:'LA',quantity:'Eh',unit:'V-SHE',value:q.fixedEh===undefined?0:q.fixedEh})
  definition.independentVariables=[{componentId:proton.id,mode:'LAV',quantity:'pH',unit:'dimensionless',range:{min:range.min,max:range.max},points:range.points}]
 }
 for(const key of ['temperature','pressure','activityModel','ionicStrength'])if(key in d)definition[key]=structuredClone(d[key])
 const scope={version:'imposed-eh-phase-scope-v1',systemId:system.id,included:system.products.filter(p=>p.phase==='solid').map(p=>p.id),discovery:discovery.discovery}
 definition.imposedEh={...q,boundaryCondition:'externally-imposed-electron-activity',phaseScope:scope,scientificStatus:'Internal integration evidence; not independently validated across this potential range. Carrier colors are not oxidation-state colors.'}
 const checked=await createSweepDefinition(system,definition,session.revision)
 if(!checked.ok)return {...checked,reason:checked.diagnostics.map(d=>d.message).join(' ')}
 const label=discovery.label??redoxComponentChoices(repository).find(c=>discovery.discovery?.family.componentIds.includes(c.componentId))?.label
 return {ok:true,redoxPresentation:redoxPresentation(system,discovery,repository.getComponentById(q.componentId),label),waterReferences:await imposedEhWaterReferences(repository,q,definition.temperature),system,definition,sweep:checked.sweep,request:q,requestIdentity:imposedEhIdentity(session),scope,phaseScopeId:await identity(scope),metadataPending:!discovery.ok}
}
export async function runImposedEh(session,repository,control={}){
 const p=await prepareImposedEh(session,repository)
 if(!p.ok)return p
 const sweep=await runSweep(p.system,p.sweep,control)
 if(!isSweepResult(sweep)||sweep.status==='invalidated-stale')return {ok:false,reason:'The imposed-Eh request was invalidated.'}
 const result=freeze({...p,sweep});results.add(result);return result
}
export function isCurrentImposedEh(session,result){return results.has(result)&&!!session.calculationDefinition.imposedEh&&result.sweep.revision===session.revision&&result.requestIdentity===imposedEhIdentity(session)}
export function commitImposedEh(session,result){
 if(!isCurrentImposedEh(session,result))return session
 return {...session,lastPoint:null,lastPlot:{system:result.system,sweep:result.sweep,imposedEh:result},sweepResult:result.sweep,gridResult:null,pointRequest:null,sweepRequest:null,gridRequest:null,calculationResult:null,calculationStatus:result.sweep.status,visualizationState:{...session.visualizationState,plot:{...session.visualizationState.plot,componentId:result.system.components[0].id,visibleIds:null}}}
}
export function imposedEhReadout(state){return `pH: ${state.pH.toFixed(2)} (${state.fixedPH===null?'varied':'fixed'}) · Eh: ${state.Eh>=0?'+':''}${state.Eh.toFixed(3)} V vs SHE (imposed)`}
