import {searchComponentSystem} from '../thermodynamics/componentSearch.js'
import {constructEquilibrium} from '../thermodynamics/equilibriumConstructor.js'
import {repositoryReactionCatalog} from '../thermodynamics/compatibility.js'
import {createCalculationDefinition} from '../calculations/definition.js'
import {prepareRegisteredOxidation} from './registeredElementOxidation.js'
import {prepareWaterContext} from './registeredWaterContext.js'
import {identity,freeze} from '../solver/models.js'

const preparations=new WeakSet()
export const isDiscoveredRedox=value=>preparations.has(value)
const compare=(a,b)=>a<b?-1:a>b?1:0
// Source connectivity identifies a candidate family. It never assigns oxidation states.
export function sourceRedoxFamily(repository,componentId){
 const components=repository.getComponents(),byName=new Map(components.map(c=>[c.name,c])),seed=components.find(c=>c.id===componentId),electron=components.find(c=>c.role==='electron')
 if(seed?.role!=='basis-choice'||!electron)return {componentIds:[],bridges:[],reason:'Select a source component with electron-transfer reactions.'}
 const edges=repositoryReactionCatalog(repository).flatMap(r=>{
  const product=byName.get(r.name),terms=r.metadata?.effectiveSourceReaction?.components
  if(product?.role!=='basis-choice'||!terms?.some(t=>t.name===electron.name&&t.coefficient))return []
  return terms.filter(t=>t.coefficient&&byName.get(t.name)?.role==='basis-choice').map(t=>({from:byName.get(t.name).id,to:product.id,record:r}))
 })
 const reached=new Set([seed.id]);let changed=true
 while(changed){changed=false;for(const e of edges)if(reached.has(e.from)||reached.has(e.to)){for(const id of [e.from,e.to])if(!reached.has(id)){reached.add(id);changed=true}}}
 const rows=[...new Map(edges.filter(e=>reached.has(e.from)&&reached.has(e.to)).map(e=>[e.record.id,e.record])).values()].sort((a,b)=>compare(a.id,b.id))
 return {componentIds:[...reached].sort(compare),bridges:rows.map(r=>({id:r.id,name:r.name,reaction:r.metadata.effectiveSourceReaction,reference:r.provenance?.resolvedCitation??null}))}
}
export function redoxComponentChoices(repository){
 const components=repository.getComponents(),electron=components.find(c=>c.role==='electron')
 if(!electron)return []
 const bridgeNames=new Set(repositoryReactionCatalog(repository).filter(r=>r.metadata?.effectiveSourceReaction?.components?.some(t=>t.name===electron.name&&t.coefficient)).flatMap(r=>[r.name,...r.metadata.effectiveSourceReaction.components.map(t=>t.name)]))
 const options=new Map()
 for(const c of components.filter(c=>c.role==='basis-choice'&&bridgeNames.has(c.name)).sort((a,b)=>compare(a.id,b.id)))for(const a of c.associations)if(!options.has(a.element))options.set(a.element,{label:a.element,componentId:c.id})
 return [...options.values()].sort((a,b)=>compare(a.label,b.label))
}

/** Bounded automatic discovery: source graph -> unchanged compiler -> identity registry.
 * catalog contains curation/evidence only. Candidate enumeration never uses its carrier list.
 */
export async function discoverRedoxSystem(repository,{componentId,selectedComponents=[],excludedSpecies=[],enabledPhases=['aqueous','solid','liquid']}={},catalog=[]){
 const family=sourceRedoxFamily(repository,componentId),components=repository.getComponents(),records=repositoryReactionCatalog(repository)
 const familyNames=new Set(family.componentIds.map(id=>repository.getComponentById(id)?.name))
 const specials=components.filter(c=>['proton','electron','solvent'].includes(c.role))
 const allowed=new Set([...familyNames,...specials.map(c=>c.name)])
 const extra=selectedComponents.map(id=>repository.getComponentById(id)).filter(c=>c?.role==='basis-choice'&&!family.componentIds.includes(c.id))
 const materialNames=new Set([...familyNames,...extra.map(c=>c.name)])
 for(const c of extra)allowed.add(c.name)
 const rows=records.filter(r=>r.metadata?.effectiveSourceReaction?.components?.some(t=>t.coefficient&&materialNames.has(t.name)))
 const catalogMatches=catalog.filter(c=>family.componentIds.includes(c.registry.conservedComponent))
 const curated=!extra.length&&catalogMatches.length===1?catalogMatches[0]:null
 const report={componentId,family,carriers:[],includedCandidates:[],excludedCandidates:[],unsupportedCandidates:[],unresolvedCarriers:[],oxidationStates:[],metadataVersion:curated?.registry.version??null,canonicalEstablished:false,inventoryComplete:false}
 const fail=(reason,diagnostics=[])=>freeze({ok:false,status:'unsupported',reason,diagnostics,discovery:report,publicEnabled:false})
 if(!family.componentIds.length)return fail(family.reason)
 const search=searchComponentSystem(repository,[componentId,...extra.map(c=>c.id),...specials.map(c=>c.id)])
 if(!search.ok)return fail('HYDRA component-system discovery is unavailable.',search.diagnostics)
 report.databaseSearch={version:search.version,selectedIds:search.selectedIds,expandedComponentIds:search.expandedComponentIds,products:search.products.map(r=>({id:r.id,name:r.name,phase:r.phase})),scope:'Database membership; material family admission remains separately bounded.'}
 const discoveredNames=new Set(search.products.map(r=>r.name))
 const phases=enabledPhases.filter(p=>['aqueous','solid','liquid'].includes(p))
 const chemicalSystem={selectedComponents:[componentId,...specials.map(c=>c.id)],selectedSpecies:[],excludedSpecies:[],enabledPhases:phases,temperature:25,pressure:1}
 const draft={chemicalSystem,calculationDefinition:createCalculationDefinition(chemicalSystem,repository)}
 for(const r of rows){
  const terms=r.metadata.effectiveSourceReaction.components,entry={id:r.id,name:r.name,phase:r.phase,sourceReference:r.provenance?.resolvedCitation??null}
  if(terms.some(t=>t.coefficient&&!allowed.has(t.name))){report.excludedCandidates.push({...entry,reason:'requires-components-outside-selected-family'});continue}
  if(!discoveredNames.has(r.name)&&!familyNames.has(r.name)){report.excludedCandidates.push({...entry,reason:'outside-hydra-component-system'});continue}
  report.carriers.push(entry)
  if(excludedSpecies.includes(r.id)){report.excludedCandidates.push({...entry,reason:'explicit-user-exclusion'});continue}
  if(!phases.includes(r.phase)){report.excludedCandidates.push({...entry,reason:'disabled-or-unsupported-phase'});continue}
  if(terms.some(t=>!Number.isSafeInteger(t.coefficient))){
   const known=curated?.reference.excluded.find(x=>x.id===r.id&&x.reason==='unsupported-fractional-canonical-stoichiometry')
   if(known){report.unsupportedCandidates.push({...entry,reason:known.reason,excludedByReferenceScope:true});report.excludedCandidates.push({...entry,reason:known.reason});continue}
  }
  report.includedCandidates.push(entry)
 }
 report.unresolvedCarriers=report.includedCandidates.filter(r=>!curated?.registry.rows.some(m=>m.sourceSpeciesId===r.id)).map(r=>({...r,reason:'missing-authoritative-oxidation-metadata'}))
 // General algebra is the scientific gate. Legacy serialization below preserves
 // already validated immutable system identities, after coefficient agreement.
 const basisIds=[curated?.registry.conservedComponent??componentId,...['proton','electron','solvent'].map(role=>specials.find(c=>c.role===role)?.id),...extra.map(c=>c.id)]
 report.basisIds=basisIds;report.materialComponentIds=[componentId,...extra.map(c=>c.id)]
 const general=await constructEquilibrium(repository,{adapter:'source-imposed',options:{familyIds:[...family.componentIds,...extra.map(c=>c.id)],basisIds,candidateIds:report.includedCandidates.map(r=>r.id),excludedIds:excludedSpecies}})
 if(!general.ok)return fail('Source reaction-basis transformation is unavailable.',general.diagnostics)
 report.canonicalEstablished=true
 report.reactionBasisVersion=general.algebra.version
 report.algebraStatus='algebraically-supported'
 report.reactionRank=general.algebra.rank
 if(report.unsupportedCandidates.some(r=>!r.excludedByReferenceScope))return fail('Discovered carriers have unsupported fractional/nonstoichiometric source coefficients.')
 if(!curated||report.unresolvedCarriers.length)return fail(catalogMatches.length>1?'Ambiguous metadata registry identity.':`${report.unresolvedCarriers.length} discovered carriers lack authoritative oxidation-state allocations.`)
 if(await identity(curated.registry)!==curated.reference.metadataSha256)return fail('Oxidation metadata differs from its reviewed evidence pin.')
 // Preserve user exclusions in compiler input; an excluded bridge is never restored.
 draft.chemicalSystem.excludedSpecies=[...excludedSpecies]
 const prepared=await constructEquilibrium(repository,{adapter:'canonical-imposed',session:draft,options:{candidateSpeciesIds:report.includedCandidates.map(r=>r.id)}})
 if(!prepared.ok)return fail(prepared.diagnostics.map(d=>d.message).join(' '),prepared.diagnostics)
 for(const product of prepared.system.products){
  const transformed=general.system.products.find(p=>p.name===product.name)
  if(!transformed||transformed.logBeta!==product.logBeta||transformed.coefficients.some((n,i)=>n!==product.coefficients[i]))return fail('General transformation differs from the retained validated system.',[{code:'validated-representation-mismatch',id:product.id}])
 }
 const model=await prepareRegisteredOxidation(prepared.system,curated.registry),waterModel=await prepareWaterContext(repository)
 if(model.status!=='registered'||waterModel.status==='unavailable')return fail(model.reason??waterModel.reason)
 report.inventoryComplete=true;report.oxidationStates=[...new Set(model.inner.allocations.flatMap(r=>r.distribution.map(d=>d.oxidationState)))].sort((a,b)=>a-b)
 report.carrierCount=model.inner.allocations.length;report.solidCount=prepared.system.products.filter(r=>r.phase==='solid').length
 const value=freeze({...prepared,reactionBasis:general.algebra,model,waterModel,discovery:report,label:curated.label,reference:curated.reference,publicEnabled:false})
 preparations.add(value);return value
}
