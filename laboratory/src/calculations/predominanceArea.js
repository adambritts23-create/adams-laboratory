import {automaticBoundaries,boundaryComponents,normalizeAutomaticDefinition,rememberAutomaticConstruction} from './automaticBoundaries.js'
import {createSweepDefinition} from './sweep.js'
import {createCondition,toSourceInput} from './definition.js'
import {createGridDefinition,runGrid} from './grid.js'
import {constructEquilibrium} from '../thermodynamics/equilibriumConstructor.js'
import {discoverRedoxSystem} from '../analysis/redoxDiscovery.js'
import {redoxSupportCatalog} from '../analysis/redoxSupportCatalog.js'
import {searchComponentSystem} from '../thermodynamics/componentSearch.js'
import {classifyRegisteredPoint} from '../analysis/registeredElementOxidation.js'
import {acceptedState} from '../beaker/acceptedState.js'
import {componentBalanceTolerance} from '../solver/validationContract.js'
import {createPointInput,prepareChemicalSystem,freeze} from '../solver/models.js'
import {solvePoint} from '../solver/point.js'
import {carrierTieTolerance} from '../experimental/carrierPourbaix.js'

export const areaIdentity=session=>JSON.stringify([session.revision,session.chemicalSystem,session.calculationDefinition])
export function configureArea(definition,components){
 const d=structuredClone(definition),q=d.pourbaix,ordinary=components.find(c=>c.role==='basis-choice'),h=components.find(c=>c.role==='proton'),e=components.find(c=>c.role==='electron')
 for(const k of ['pourbaix','imposedEh','publicFePourbaix','mixedSolubility','solubilityComparison','gridMultiSolid'])delete d[k]
 d.predominanceArea={componentId:q?.componentId??ordinary?.id??'',interpretation:'carrier',phasePolicy:'solid-first'};d.dimensions=2
 if(q&&h&&e){d.independentVariables=[{...createCondition(h,'LAV','pH'),range:{min:q.pH.min,max:q.pH.max},points:q.pH.points},{...createCondition(e,'LAV','Eh'),range:{min:q.Eh.min,max:q.Eh.max},points:q.Eh.points}];d.componentConditions=components.filter(c=>c.id!==h.id&&c.id!==e.id).map(c=>({...createCondition(c,c.role==='solvent'?'LA':'T'),value:c.role==='solvent'?0:c.id===q.componentId?q.total:q.additionalTotals?.[c.id]??definition.componentConditions.find(x=>x.componentId===c.id)?.value}))}
 else {d.independentVariables=d.independentVariables.slice(0,2);for(const c of [h,e,...components.filter(c=>c.role==='basis-choice')].filter(Boolean)){if(d.independentVariables.length===2)break;if(d.independentVariables.some(a=>a.componentId===c.id))continue;const quantity=c.role==='proton'?'pH':c.role==='electron'?'Eh':'total';d.independentVariables.push({...createCondition(c,quantity==='total'?'TV':'LAV',quantity),range:quantity==='pH'?{min:0,max:14}:quantity==='Eh'?{min:-1,max:1.2}:{min:0.001,max:0.01},points:21})}d.componentConditions=d.componentConditions.filter(c=>!d.independentVariables.some(a=>a.componentId===c.componentId))}
 return d
}
/** Conventional imposed-potential setup, without inventing material totals. */
export function configureEhPhArea(definition,components) {
 const h=components.find(c=>c.role==='proton'),e=components.find(c=>c.role==='electron')
 if(!h||!e)throw Error('pH–Eh requires proton and electron coordinates.')
 const d=configureArea(definition,components)
 d.predominanceArea.componentId=definition.predominanceArea?.componentId??d.predominanceArea.componentId
 d.independentVariables=[[h,'pH',0,14],[e,'Eh',-1,1.2]].map(([c,quantity,min,max])=>{
  const previous=definition.independentVariables.find(a=>a.componentId===c.id&&a.quantity===quantity&&a.mode==='LAV')
  return previous?structuredClone(previous):{...createCondition(c,'LAV',quantity),range:{min,max},points:51}
 })
 d.componentConditions=components.filter(c=>c.id!==h.id&&c.id!==e.id).map(c=>{
  const fixed=definition.componentConditions.find(x=>x.componentId===c.id)
  return fixed?structuredClone(fixed):createCondition(c,c.role==='solvent'?'LA':'T')
 })
 return d
}
const reject=reason=>({ok:false,reason})
/** Definition/preparation only. Neither metadata nor formula parsing is needed for carrier maps. */
export async function prepareArea(session,repository,{sweep=false}={}){
 const originalSession=session,requestIdentity=areaIdentity(session)
 const uiComponents=boundaryComponents(session.chemicalSystem.selectedComponents.map(id=>repository.getComponentById(id)),repository)
 const automatic=session.calculationDefinition.automaticBoundaries||session.calculationDefinition.independentVariables.some(a=>uiComponents.find(c=>c.id===a.componentId)?.role==='electron'&&!session.chemicalSystem.selectedComponents.includes(a.componentId))
 const inferred=automatic?automaticBoundaries(session.calculationDefinition,uiComponents,repository):null
 if(inferred?.reason)return reject(inferred.reason)
 const e=uiComponents.find(c=>c.role==='electron')
 if(automatic)session={...session,calculationDefinition:normalizeAutomaticDefinition(session.calculationDefinition,uiComponents),chemicalSystem:{...session.chemicalSystem,selectedComponents:[...session.chemicalSystem.selectedComponents.filter(id=>id!==e?.id),...(inferred.redox?[e.id]:[])]}}
 const started=performance.now(),d=session.calculationDefinition,q=d.predominanceArea
 if(!q)return reject('Choose Predominance area.')
 const selected=session.chemicalSystem.selectedComponents.map(id=>repository.getComponentById(id)),main=selected.find(c=>c?.id===q.componentId&&c.role==='basis-choice')
 if(!main)return reject('Select a conserved source component for the region inventory.')
 const conditions=[...d.componentConditions,...d.independentVariables],electron=selected.find(c=>c.role==='electron'),proton=selected.find(c=>c.role==='proton')
 if(electron&&!['LA','LAV'].includes(conditions.find(c=>c.componentId===electron.id)?.mode))return reject('Calculated electron-balance diagrams are unavailable: differential validation did not establish reliable equivalence. Use imposed Eh/pe, or the separate validated physical Closed reagent mode.')
 const search=searchComponentSystem(repository,session.chemicalSystem.selectedComponents)
 if(!search.ok)return reject('HYDRA source search is unavailable.')
 let prepared,discovery=null,model=null,componentId=main.id
 if(electron){
  prepared=await discoverRedoxSystem(repository,{componentId:main.id,selectedComponents:session.chemicalSystem.selectedComponents,excludedSpecies:session.chemicalSystem.excludedSpecies??[],enabledPhases:d.enabledPhases.filter(p=>session.chemicalSystem.enabledPhases.includes(p))},redoxSupportCatalog)
  discovery=prepared.discovery
  if(!prepared.ok){if(!discovery?.canonicalEstablished)return reject(prepared.reason??'Source basis unavailable.')
   prepared=await constructEquilibrium(repository,{adapter:'source-imposed',options:{familyIds:[...new Set([...discovery.family.componentIds,...discovery.materialComponentIds])],basisIds:discovery.basisIds,candidateIds:discovery.includedCandidates.map(r=>r.id),excludedIds:session.chemicalSystem.excludedSpecies??[]}})
  }else model=prepared.model
  componentId=prepared.system?.components[0].id
 }else prepared=await constructEquilibrium(repository,{adapter:'ordinary',session,options:{grid:true}})
 if(!prepared.ok)return reject(prepared.reason??prepared.diagnostics?.map(r=>r.message).join(' ')??'Preparation unavailable.')
 // Analytical H/e balances are source coordinates, not supplied physical reagents.
 // Reuse identical products and Newton/phase acceptance; fixed-redox reference branding is unchanged.
 if(electron&&conditions.some(c=>[electron.id,proton?.id].includes(c.componentId)&&['T','TV','LTV'].includes(c.mode))){
  const analytical=await prepareChemicalSystem({...prepared.system,redoxPolicy:'analytical-proton-fixed-electron-v1'})
  if(!analytical.ok)return reject(analytical.diagnostics.map(d=>d.message).join(' '))
  prepared={...prepared,system:analytical.system}
 }
 const system=prepared.system,definition=structuredClone(d)
 // A new source basis has its own admitted output identities. This affects presentation only.
 definition.output={...definition.output,speciesIds:system.products.map(p=>p.id)}
 for(const c of [...definition.componentConditions,...definition.independentVariables])if(c.componentId===main.id)c.componentId=componentId
 // Source membership is a separate gate from bounded admission and identity-basis products.
 const names=new Set(search.products.map(p=>p.name)),basisNames=new Set(selected.map(c=>c.name))
 if(system.products.some(p=>!names.has(p.name)&&!basisNames.has(p.name)))return reject('An admitted product is outside the selected HYDRA database product scope.')
 const target=[...definition.componentConditions,...definition.independentVariables].find(c=>c.componentId===componentId)
 if(!target||!['T','TV','LTV'].includes(target.mode))return reject('Region inventory requires an analytical total for the chosen source component.')
 const grid=await (sweep?createSweepDefinition:createGridDefinition)(system,definition,session.revision)
 if(!grid.ok)return reject(grid.diagnostics.map(r=>r.message).join(' '))
 rememberAutomaticConstruction(system,originalSession)
 const interpretation=q.interpretation==='carrier'?'carrier':model?'oxidation-state':'carrier'
 if(q.interpretation==='oxidation-state'&&!model)return reject('No authoritative oxidation-state allocation is available for this admitted system.')
 return {ok:true,system,grid:grid.grid,sweep:grid.sweep,definition,model,interpretation,componentId,search,discovery,requestIdentity,timing:{preparationMs:performance.now()-started}}
}
export function areaClassification(prepared,outcome){
 const {system,componentId,model,interpretation}=prepared
 if(outcome.status!=='converged'||!acceptedState(system,outcome.input,outcome.result).ok)return {status:'gap',reason:'No accepted equilibrium.',region:null}
 const index=system.components.findIndex(c=>c.id===componentId),total=outcome.input.constraints[index]?.value
 if(!(total>0))return {status:'gap',reason:'A positive conserved total is required.',region:null}
 if(interpretation==='oxidation-state'){
  const c=classifyRegisteredPoint(model,system,outcome.input,outcome.result,{currentRevision:outcome.input.revision})
  return {status:c.status==='unavailable'?'gap':c.status,reason:c.reason,region:c.status==='classified'?{id:'oxidation:'+c.predominant,name:`Oxidation state ${c.predominant}`,phase:'oxidation-state'}:null,fractions:c.fractions,acceptedSolids:c.acceptedSolids?.map(s=>s.id)}
 }
 const carriers=[{...system.components[index],phase:'aqueous',coefficient:1,amount:outcome.result.concentrations[index]},...system.products.flatMap((p,j)=>p.coefficients[index]!==0?[{id:p.id,name:p.name,phase:p.phase,coefficient:p.coefficients[index],amount:p.phase==='solid'?outcome.result.solids.find(s=>s.id===p.id)?.amount??0:outcome.result.concentrations[system.components.length+j]}]:[])]
 if(carriers.some(c=>c.coefficient<0||!Number.isFinite(c.amount)||c.amount<0))return {status:'gap',reason:'Carrier allocation is unsupported.',region:null}
 const inventory=carriers.reduce((sum,c)=>sum+c.coefficient*c.amount,0),tolerance=componentBalanceTolerance(total,total)
 if(Math.abs(inventory-total)>tolerance||tolerance/total>carrierTieTolerance/4)return {status:'gap',reason:'Inventory closure or numerical resolution is insufficient.',region:null}
 const leaders=predominantSpecies(carriers,total,prepared.definition?.predominanceArea?.phasePolicy??'largest-inventory')
 return {status:leaders.length===1?'classified':'tie',region:leaders.length===1?{id:leaders[0].id,name:leaders[0].name,phase:leaders[0].phase}:null,acceptedSolids:outcome.result.solids.filter(s=>s.amount>0).map(s=>s.id)}
}
/** Predom.findTopSpecies: weight species by source-component coefficient.
 * With solids enabled, a present solid takes priority over dissolved species.
 * Unlike upstream's order-sensitive tie loop, retain explicit symmetric ties.
 */
export function predominantSpecies(carriers,total,policy='solid-first') {
 const solids=carriers.filter(c=>c.phase==='solid'&&c.coefficient*c.amount>0)
 const pool=policy==='aqueous-only'?carriers.filter(c=>c.phase==='aqueous'):policy==='solid-first'&&solids.length?solids:carriers
 if(!pool.length)return []
 const largest=Math.max(...pool.map(c=>c.coefficient*c.amount/total))
 return pool.filter(c=>largest-c.coefficient*c.amount/total<=carrierTieTolerance)
}
const results=new WeakSet()
export async function runArea(prepared,control={}){
 if(!prepared.ok)return prepared
 let regionEvaluations=0
 const grid=await runGrid(prepared.system,prepared.grid,{...control,projectOutcome:o=>{regionEvaluations++;return {index:o.index,ix:o.ix,iy:o.iy,x:o.x,y:o.y,solverStatus:o.status,...areaClassification(prepared,o)}}})
 if(!grid.outcomes)return reject('Grid execution unavailable.')
 const result=freeze({ok:true,kind:'predominance-area',prepared,grid,points:grid.outcomes,requestIdentity:prepared.requestIdentity,timing:{...prepared.timing,...grid.timing,fullSolves:grid.counts.converged+grid.counts.failed,regionEvaluations,boundaryEvaluations:0}})
 results.add(result);return result
}
/** Reconstruct the exact sampled input, not a graphical cell centre or interpolated state. */
export async function inspectArea(result,index){
 if(!results.has(result)||!Number.isInteger(index)||index<0||index>=result.points.length)return reject('Unknown accepted map sample.')
 const p=result.points[index],{system,grid}=result.prepared
 if(p.solverStatus!=='converged')return reject('This sampled point has no accepted equilibrium; no inspection solve is substituted.')
 const started=performance.now(),constraints=[...grid.fixedConditions.map(c=>({componentId:c.componentId,...toSourceInput(c,c.value,25)})),...grid.axes.map((a,i)=>({componentId:a.componentId,...toSourceInput(a,i===0?p.x:p.y,25)}))]
 const input=await createPointInput(system,{constraints,revision:grid.revision,unit:system.unit,temperatureC:25,pressureBar:1,activityModel:'ideal'})
 if(!input.ok)return reject('Inspection input unavailable.')
 const solved=solvePoint(system,input.input),state=acceptedState(system,input.input,solved),classification=areaClassification(result.prepared,{status:solved.ok?'converged':'failed',input:input.input,result:solved})
 if(classification.status!==p.status||classification.region?.id!==p.region?.id)return reject('Inspection differs from the retained region; no quantitative state is presented.')
 return {ok:state.ok,state,input:input.input,result:solved,classification,index,x:p.x,y:p.y,elapsedMs:performance.now()-started}
}
