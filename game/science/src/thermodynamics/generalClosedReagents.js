import {isRepositorySnapshot} from './repository.js'
const discoveredSystems=new WeakMap()
import {inspectPointInitialization} from '../solver/point.js'
import {searchComponentSystem} from './componentSearch.js'
import {repositoryReactionCatalog} from './compatibility.js'
import {isSupportedFormationSource} from './formationSupport.js'
import {fePeroxideScope as reviewed} from './scopes/fePeroxide.js'
import {prepareClosedReagents,solveClosedReagents} from './closedReagents.js'
import {identity,freeze} from '../solver/models.js'
import {numericalValidationContract} from '../solver/validationContract.js'
import {compileClosedRedoxNetwork} from './closedRedoxNetwork.js'
import {sourceComponentMetadata} from './sourceComponentMetadata.js'
import {isPhysicalPreparation} from './physicalPreparation.js'
import {preparationCharge} from './reagentPreparation.js'

export const generalClosedVersion='source-closed-discovery-v2'
// Integrity of the already imported public repository; no constants duplicated.
const repositoryDigest='5fece8b93a3a1fa9a845c73a775c21d0a323dd3853aebb8cb5efdd664943f68c'
const integrity=new WeakMap(),audits=new WeakMap(),preparations=new WeakSet()
const special=[reviewed.electronId,reviewed.waterId,reviewed.protonId]
const reason=(code,message,ids=[])=>({code,message,ids})
const finish=(r,repository)=>{const value=freeze(r);audits.set(value,repository);return value}
const terms=r=>r.metadata?.effectiveSourceReaction?.components?.filter(t=>t.coefficient!==0)
const validTerms=r=>terms(r)?.length&&terms(r).every(t=>typeof t.name==='string'&&Number.isFinite(t.coefficient))&&new Set(terms(r).map(t=>t.name)).size===terms(r).length

// Pick free physical coordinates of the source-reaction matrix. Electron is
// eliminated first; supplied forms and water are preferred as free coordinates.
function physicalBasis(species,reactions,selected){
 const order=[...species].sort((a,b)=>{
  const priority=s=>s.role==='electron'?0:s.role==='water'?5:s.role==='proton'?4:selected.includes(s.id)?3:2
  return priority(a)-priority(b)||a.id.localeCompare(b.id)
 }),a=reactions.map(r=>order.map(s=>(r.productId===s.id?1:0)-(r.terms.find(t=>t.id===s.id)?.coefficient??0))),pivots=[]
 let rank=0
 for(let col=0;col<order.length&&rank<a.length;col++){
  let p=rank;for(let j=rank+1;j<a.length;j++)if(Math.abs(a[j][col])>Math.abs(a[p][col]))p=j
  if(Math.abs(a[p][col])<128*Number.EPSILON)continue
  ;[a[p],a[rank]]=[a[rank],a[p]];const d=a[rank][col];a[rank]=a[rank].map(n=>n/d)
  for(let j=rank+1;j<a.length;j++){const n=a[j][col];a[j]=a[j].map((v,k)=>v-n*a[rank][k])}
  pivots.push(col);rank++
 }
 return order.filter((s,i)=>!pivots.includes(i)).map(s=>s.id)
}

/** Discovery is independent of numerical convergence and of any reagent-pair gate.
 * Source names are exact repository identity keys, never chemical formula parsing.
 * Product composition is transported through authoritative signed source terms.
 */
export async function discoverGeneralClosed(repository,selectedIds,{reviewedScope=false}={}){
 if(!isRepositorySnapshot(repository))return discover(repository,selectedIds,{reviewedScope})
 if(!discoveredSystems.has(repository))discoveredSystems.set(repository,new Map())
 const cache=discoveredSystems.get(repository),key=JSON.stringify({selectedIds,reviewedScope})
 if(!cache.has(key)){
  if(cache.size>=32)cache.delete(cache.keys().next().value)
  cache.set(key,discover(repository,selectedIds,{reviewedScope}))
 }
 return cache.get(key)
}
async function discover(repository,selectedIds,{reviewedScope}){
 const report={version:generalClosedVersion,status:'UNSUPPORTED',canCalculate:false,reasons:[],selectedIds:[...selectedIds],included:[],excluded:[],candidateSolids:[],candidateGases:[],families:[],ordinary:[],metadata:{},scope:null,reviewedScope:false}
 if(selectedIds.includes(reviewed.electronId)){report.reasons.push(reason('conflicting-reservoir','Selected e⁻ denotes imposed activity; closed redox requires no selected electron.'));return finish(report,repository)}
 if(!integrity.has(repository))integrity.set(repository,identity({components:[...repository.getComponents()].sort((a,b)=>a.id.localeCompare(b.id)),reactions:[...repository.getSpecies()].sort((a,b)=>a.id.localeCompare(b.id))}).then(h=>h===repositoryDigest))
 if(!await integrity.get(repository)){report.reasons.push(reason('source-integrity','The imported repository differs from the pinned source snapshot.'));return finish(report,repository)}
 const components=repository.getComponents(),byName=new Map(components.map(c=>[c.name,c])),catalog=repositoryReactionCatalog(repository)
 if(new Set(selectedIds).size!==selectedIds.length||selectedIds.some(id=>!repository.getComponentById(id))){report.reasons.push(reason('ambiguous-source-identity','Selected forms must be unique imported component identities.'));return finish(report,repository)}
 const registry=await sourceComponentMetadata(repository)
 if(!registry.ok){report.reasons.push(...registry.diagnostics);return finish(report,repository)}
 report.metadataVersion=registry.version
 const initial=[...new Set([...selectedIds,...special])],search=searchComponentSystem(repository,initial)
 if(!search.ok){report.reasons.push(...search.diagnostics);return finish(report,repository)}
 const vocabulary=new Set(search.expandedComponentIds.map(id=>repository.getComponentById(id).name))
 vocabulary.add(repository.getComponentById(reviewed.waterId).name)
 // Retain redundant source equalities for cycle checking, but never expand vocabulary by inverse traversal.
 if(search.products.some(r=>terms(r)?.some(t=>!vocabulary.has(t.name)))){report.reasons.push(reason('source-membership-precision','A HYDRA membership-floor term is unresolved; exact production equations cannot discard it.'));return finish(report,repository)}
 const rows=catalog.filter(r=>validTerms(r)&&terms(r).every(t=>vocabulary.has(t.name)))
 report.componentSearch={version:search.version,selectedIds:initial,expandedComponentIds:search.expandedComponentIds,productIds:search.products.map(r=>r.id),expansions:search.expansions}
 const metadata={},reached=new Set()
 for(const id of initial){
  // Reuse independently curated identity metadata, not the reviewed pair's domain.
  const entry=registry.entries[id],m=entry?{...entry,sourceIdentity:{...entry.sourceIdentity,reference:entry.sourceIdentity.reference??'Pinned MEDUSA component identity and official charge'}}:null
  if(!m){report.reasons.push(reason('missing-conservation-metadata','No source-bound elemental/charge allocation for this supplied form.',[id]));continue}
  metadata[id]=m;reached.add(m.name)
 }
 if(report.reasons.length)return finish(report,repository)
 const canonical=r=>byName.get(r.name)?.id??r.id
 const policy=reviewedScope?reviewed.excludedReactionIds:[]
 let changed=true
 while(changed){changed=false;for(const r of rows){
  if(r.phase!=='aqueous'||policy.includes(r.id)||!validTerms(r))continue
  const unknown=terms(r).filter(t=>!reached.has(t.name)),product=metadata[canonical(r)]
  if(unknown.length===1&&product&&byName.has(unknown[0].name)){
   const absent=unknown[0],component=byName.get(absent.name),elements={...product.elements};let charge=product.charge,atomsKnown=Boolean(product.elements)
   for(const t of terms(r).filter(t=>t!==absent)){const m=metadata[byName.get(t.name)?.id];if(!m)continue;charge-=t.coefficient*m.charge;if(!m.elements)atomsKnown=false;for(const [e,n] of Object.entries(m.elements??{}))elements[e]=(elements[e]??0)-t.coefficient*n}
   charge/=absent.coefficient;for(const e of Object.keys(elements)){elements[e]/=absent.coefficient;if(elements[e]===0)delete elements[e]}
   if((!atomsKnown||Object.keys(elements).length&&Object.values(elements).every(n=>Number.isSafeInteger(n)&&n>=0))&&charge===(registry.entries[component.id]?.charge??component.charge)){metadata[component.id]={id:component.id,name:component.name,...(atomsKnown?{elements}:{elementalStatus:'unavailable'}),charge,phase:'aqueous',role:'ordinary',sourceIdentity:{id:r.id,reference:r.citation,record:r.provenance,derivation:'Inverse source coefficient/charge transport; elemental transport only when complete'}};reached.add(component.name);changed=true}
  }
  if(!terms(r).every(t=>reached.has(t.name)))continue
  const id=canonical(r)
  if(!metadata[id]){
   const elements={},sources=terms(r).map(t=>({t,m:metadata[byName.get(t.name)?.id]}))
   if(sources.some(s=>!s.m))continue
   const atomsKnown=sources.every(({m})=>m.elements!==undefined)
   for(const {t,m} of sources)for(const [element,count] of Object.entries(m.elements??{}))elements[element]=(elements[element]??0)+t.coefficient*count
   for(const e of Object.keys(elements))if(elements[e]===0)delete elements[e]
   const charge=sources.reduce((n,{t,m})=>n+t.coefficient*m.charge,0)
   if((atomsKnown&&(Object.values(elements).some(n=>!Number.isSafeInteger(n)||n<0)||!Object.keys(elements).length))||charge!==r.charge){report.reasons.push(reason('ambiguous-conservation-basis','Source stoichiometry does not establish a nonnegative integer composition and matching charge.',[r.id]));continue}
   metadata[id]={id,name:r.name,...(atomsKnown?{elements}:{elementalStatus:'unavailable'}),charge,phase:'aqueous',role:'ordinary',sourceIdentity:{id:r.id,reference:r.citation,record:r.provenance,derivation:'Source coefficient/charge transport; elemental transport only when complete',parents:sources.map(({m})=>m.id)}}
  }
  if(byName.has(r.name)&&!reached.has(r.name)){reached.add(r.name);changed=true}
 }}
 const eligible=rows.filter(r=>validTerms(r)&&terms(r).every(t=>reached.has(t.name)))
 const unresolvedInverse=rows.filter(r=>r.phase==='aqueous'&&!policy.includes(r.id)&&validTerms(r)&&metadata[canonical(r)]&&!terms(r).every(t=>reached.has(t.name)))
 if(unresolvedInverse.length)report.reasons.push(reason('unresolved-reverse-source-connection','A known product has a source representation whose remaining component identities cannot be closed safely.',unresolvedInverse.map(r=>r.id)))
 const missingRows=rows.filter(r=>!validTerms(r)&&r.componentIds?.some(id=>selectedIds.includes(id)))
 if(missingRows.length)report.reasons.push(reason('missing-source-reaction-metadata','Potentially relevant source records lack usable integer reaction metadata.',missingRows.map(r=>r.id)))
 const admitted=eligible.filter(r=>r.phase==='aqueous'&&!policy.includes(r.id))
 if(reviewedScope&&(admitted.length!==Object.keys(reviewed.reactions).length||admitted.some(r=>!reviewed.reactions[r.id])))report.reasons.push(reason('reviewed-scope-mismatch','The discovered network does not match the preserved reviewed profile.'))
 for(const r of eligible){
  if(!isSupportedFormationSource(r,repository))report.reasons.push(reason('unsupported-source-reaction','Compatible source law lacks supported standard-state metadata.',[r.id]))
  const row={id:r.id,name:r.name,phase:r.phase,reference:r.citation,terms:terms(r),logK:r.logK}
  if(r.phase==='aqueous'&&!policy.includes(r.id))report.included.push({...row,classification:'admitted'})
  else {const excluded={...row,classification:'excluded-conditionally',reason:policy.includes(r.id)?'Reviewed scope-specific counterion-redox exclusion':'Aqueous-only model; no solid or gas inventory solver in this path'};report.excluded.push(excluded);if(r.phase==='solid')report.candidateSolids.push(excluded);if(r.phase==='gas')report.candidateGases.push(excluded)}
 }
 const reactions=admitted.map(r=>({id:r.id,productId:canonical(r),terms:terms(r).map(t=>({id:byName.get(t.name)?.id,coefficient:t.coefficient})),logK:r.logK,phase:'aqueous',unit:{kind:'ideal-molal-standard'},provenance:{reference:r.citation,record:r.provenance}}))
 const used=new Set([...initial,...reactions.flatMap(r=>[r.productId,...r.terms.map(t=>t.id)])])
 for(const id of used)if(!metadata[id])report.reasons.push(reason('missing-conservation-metadata','Discovered carrier has no validated composition.',[id]))
 const halves=admitted.filter(r=>terms(r).some(t=>byName.get(t.name)?.id===reviewed.electronId))
 for(const r of halves){const id=canonical(r),atoms=metadata[id]?.elements??{};report.families.push({sourceId:r.id,productId:id,elementKeys:Object.keys(atoms),elementalMetadataAvailable:Boolean(metadata[id]?.elements),electronCoefficient:terms(r).find(t=>byName.get(t.name)?.id===reviewed.electronId).coefficient})}
 report.redoxFamilies=Object.values(report.families.reduce((all,r)=>{const key=r.elementalMetadataAvailable?(r.elementKeys.filter(e=>!['H','O'].includes(e)).sort().join('+')||'H/O'):'Unlabelled source family';(all[key]??={conservedElements:key,sourceIds:[],electronCounts:[]}).sourceIds.push(r.sourceId);all[key].electronCounts.push(r.electronCoefficient);return all},{}))
 report.componentRoles=selectedIds.filter(id=>!special.includes(id)).map(id=>({id,roles:[...new Set(admitted.filter(r=>terms(r).some(t=>byName.get(t.name)?.id===id)||canonical(r)===id).map(r=>halves.includes(r)?'redox-active':terms(r).filter(t=>!special.includes(byName.get(t.name)?.id)).length>1?'complexing':'ordinary acid/base or association'))],phaseForming:report.excluded.some(r=>r.terms.some(t=>byName.get(t.name)?.id===id))}))
 for(const r of admitted.filter(r=>!halves.includes(r))){const ts=terms(r),ordinaryTerms=ts.filter(t=>!special.includes(byName.get(t.name)?.id));report.ordinary.push({id:r.id,name:r.name,category:ordinaryTerms.length>1?'complexation':ts.some(t=>byName.get(t.name)?.id===reviewed.waterId)?'proton/water or hydrolysis':'acid/base or ordinary association',classificationBasis:'Source participation only; detailed mechanistic subtype not inferred from formula'})}
 // A water-only reaction graph must not make every inert reagent look redox-active.
 const active=selectedIds.filter(id=>!special.includes(id)).some(id=>halves.some(r=>canonical(r)===id||terms(r).some(t=>byName.get(t.name)?.id===id)))
 if(!halves.length||!active)report.reasons.push(reason('no-connected-redox-family','No supplied reagent participates in the discovered electron-bearing network.'))
 report.metadata=metadata
 if(report.reasons.length)return finish(report,repository)
 const basis=reviewedScope?reviewed.bases[0]:physicalBasis([...used].map(id=>metadata[id]),reactions,selectedIds)
 if(basis.includes(reviewed.electronId))report.reasons.push(reason('disconnected-redox-family','The electron cannot be eliminated from the physical preparation basis.'))
 if(used.size>64||reactions.length>64)report.reasons.push(reason('bounded-compiler-capacity','Discovered chemistry exceeds the validated 64-species/64-reaction closed compiler capacity; it cannot be truncated.'))
 if(report.reasons.length)return finish(report,repository)
 const closure=compileClosedRedoxNetwork({mode:'closed-redox',conservationMethod:'source-exact-v1',temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O',species:[...used].map(id=>metadata[id]),reactions,basisIds:basis,electronId:reviewed.electronId,solvent:{kind:'fixed-water-activity',speciesId:reviewed.waterId,logActivity:0}})
 if(!closure.ok){report.reasons.push(...closure.diagnostics);return finish(report,repository)}
 report.conservation=closure.conservation;report.conservationPhysicalIds=closure.physical.map(s=>s.id);report.conservationBasisIds=closure.basisIds;report.cancellations=closure.cancellations;report.cycleChecks=closure.algebra.cycleChecks
 const componentDigests=Object.fromEntries(await Promise.all([...used].filter(id=>repository.getComponentById(id)).map(async id=>[id,await identity(repository.getComponentById(id))])))
 report.scope=reviewedScope?reviewed:{version:generalClosedVersion,componentSystemIds:initial,status:'conditional-source-closure',description:'Complete discovered aqueous source graph; explicitly excluded phases require diagnostic review. Oxidation-state coloring is not inferred.',electronId:reviewed.electronId,waterId:reviewed.waterId,protonId:reviewed.protonId,metadata,bases:[basis],excludedReactionIds:[],componentDigests,reactions:Object.fromEntries(await Promise.all(admitted.map(async r=>[r.id,{digest:await identity(r),canonicalId:canonical(r)}])))}
 report.reviewedScope=reviewedScope;report.status=report.excluded.length?'CONDITIONAL':'SUPPORTED';report.canCalculate=true
 if(report.excluded.length)report.reasons.push(reason('excluded-phase-scope','Only the explicitly disclosed aqueous conditional model may be calculated. Excluded phases are checked after equilibrium.'))
 return finish(report,repository)
}

export async function prepareGeneralClosed(repository,request,audit,physical){
 if(audits.get(audit)!==repository||!audit.canCalculate)return {ok:false,status:'UNSUPPORTED',diagnostics:audit?.reasons??[reason('unreviewed-scope','Discover and audit the source graph first.')]}
 if(physical!==undefined&&(!isPhysicalPreparation(physical,repository)||JSON.stringify(request.amounts)!==JSON.stringify(physical.amounts)||JSON.stringify(audit.selectedIds)!==JSON.stringify(physical.selectedIds)))return {ok:false,status:'UNSUPPORTED',diagnostics:[reason('invalid-physical-preparation','Use the source-bound physical preparation and its exact selection and amounts.')] }
 if(!physical&&Object.keys(request.amounts??{}).some(id=>!audit.selectedIds.includes(id)))return {ok:false,status:'UNSUPPORTED',diagnostics:[reason('changed-reagent-selection','The actual recipe differs from the audited selection.')]}
 const charge=preparationCharge(request.amounts??{},audit.metadata)
 if(!charge.ok)return {ok:false,status:'UNSUPPORTED',diagnostics:[{code:charge.code,message:charge.message}],preparationCharge:charge}
 // Zero amounts only make algebraically discovered source component identities
 // available to the existing forward compiler; they add no physical inventory.
 const completeRequest=audit.reviewedScope?request:{...request,amounts:{...Object.fromEntries(Object.keys(audit.metadata).filter(id=>repository.getComponentById(id)&&!special.includes(id)).map(id=>[id,0])),...request.amounts}}
 let prepared=await prepareClosedReagents(repository,completeRequest,audit.scope)
 if(!prepared.ok)return {...prepared,status:'UNSUPPORTED'}
 let basisSelection=null
 // Preserve every successful original preparation/solve, including historical seeds.
 // Only a failed initial conditioning gate plus failed unchanged solve permits basis inspection.
 const original=prepared.prepared,initial=inspectPointInitialization(original.system,original.input,original.initialLogActivities??undefined)
 if(!audit.reviewedScope&&!initial.ok&&initial.code==='singular-or-ill-conditioned'&&!solveClosedReagents(prepared).ok){
  const candidates=[],basis=original.network.basisIds,n=original.network
  for(let i=0;i<basis.length;i++){
   if(audit.selectedIds.includes(basis[i])||special.includes(basis[i]))continue
   for(const species of [...n.physical].sort((a,b)=>a.id.localeCompare(b.id))){
    if(basis.includes(species.id)||special.includes(species.id)||n.algebra.componentExpressions[species.id].coefficients[i]===0)continue
    const exchanged=basis.map((id,k)=>k===i?species.id:id),p=await prepareClosedReagents(repository,completeRequest,{...audit.scope,bases:[exchanged]})
    if(!p.ok)continue
    const b=p.prepared,check=inspectPointInitialization(b.system,b.input,b.initialLogActivities??undefined)
    if(check.ok)candidates.push({prepared:p,basis:exchanged,pivotRatio:check.pivotRatio})
   }
  }
  candidates.sort((a,b)=>b.pivotRatio-a.pivotRatio||a.basis.join('|').localeCompare(b.basis.join('|')))
  if(candidates.length){const best=candidates[0];prepared=best.prepared;basisSelection={policy:'initial-conditioning-source-basis-v1',originalBasis:basis,selectedBasis:best.basis,originalFailure:initial,pivotRatio:best.pivotRatio,admissibleCandidates:candidates.length,selection:'Largest initial Newton pivot ratio; source-ID order breaks ties. No candidate equilibrium was used for selection.'}}
 }
 const value=freeze({ok:true,prepared,audit,basisSelection});preparations.add(value);return value
}
export function solveGeneralClosed(prepared){
 if(!preparations.has(prepared))return {ok:false,status:'UNSUPPORTED',diagnostics:[reason('unprepared-closed-reagents','Use the current audited preparation.')]}
 const accepted=solveClosedReagents(prepared.prepared)
 if(!accepted.ok)return accepted
 const logs=Object.fromEntries(accepted.inspection.carriers.map(c=>[c.name,Math.log10(c.amount)]));logs[reviewed.metadata[reviewed.electronId].name]=-accepted.inspection.pe;logs[reviewed.metadata[reviewed.waterId].name]=0
 const diagnostics=prepared.audit.excluded.map(r=>({...r,logActivity:r.logK+r.terms.reduce((n,t)=>n+t.coefficient*logs[t.name],0),meaning:r.phase==='solid'?'Hypothetical pure-solid log saturation ratio':r.phase==='gas'?'Hypothetical normalized gas log fugacity':'Excluded aqueous log molality; not accepted inventory'}))
 // Apply the existing saturation tolerance; never change the underlying solve.
 const required=diagnostics.filter(r=>!Number.isFinite(r.logActivity)||(r.phase==='solid'&&r.logActivity>numericalValidationContract.saturatedSolidLogActivityTolerance))
 const gasSum=diagnostics.filter(r=>r.phase==='gas').reduce((n,r)=>n+10**r.logActivity,0)
 for(const r of diagnostics)if(required.includes(r)||(r.phase==='gas'&&gasSum>prepared.prepared.request.pressureBar))r.classification='required-but-unsupported';else if(r.phase==='solid')r.classification='excluded-with-validated-irrelevance-at-this-aqueous-state'
 if(required.length||gasSum>prepared.prepared.request.pressureBar)return freeze({ok:false,status:'UNSUPPORTED',diagnostics:[reason(required.length?'relevant-solid-or-unresolved-phase':'gas-inventory-headspace-required','An excluded phase requires a broader inventory/phase model.',diagnostics.filter(r=>r.classification==='required-but-unsupported').map(r=>r.id))],phaseDiagnostics:diagnostics,gasFugacitySum:gasSum,candidate:accepted,basisSelection:prepared.basisSelection})
 return freeze({ok:true,status:prepared.audit.status,accepted,audit:prepared.audit,basisSelection:prepared.basisSelection,phaseDiagnostics:diagnostics,gasFugacitySum:gasSum})
}
