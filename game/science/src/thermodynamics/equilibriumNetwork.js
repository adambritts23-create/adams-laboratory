import {sourceComponentMetadata} from './sourceComponentMetadata.js'
import {preparePhysicalContributions} from './physicalPreparation.js'
import {prepareClosedPureSolids,solveClosedPureSolids} from './closedPureSolids.js'
import {discoverGeneralClosed,prepareGeneralClosed,solveGeneralClosed} from './generalClosedReagents.js'
import {repositoryReactionCatalog} from './compatibility.js'
import {isSupportedFormationSource} from './formationSupport.js'
import {transformReactionBasis} from './reactionBasis.js'
import {prepareChemicalSystem,createPointInput,identity,freeze} from '../solver/models.js'
import {solvePoint,closedSolidActivePolicy} from '../solver/point.js'
import {multiSolidPolicy} from '../solver/assemblages.js'
import {numericalValidationContract} from '../solver/validationContract.js'
import {nonRedoxCoordinates,nonRedoxScope,nonRedoxChargeCheck,nonRedoxPhysicalVersion} from './nonRedoxPhysical.js'
export const equilibriumNetworkVersion='source-equilibrium-network-v1'
export const equilibriumSourceFingerprint='5fece8b93a3a1fa9a845c73a775c21d0a323dd3853aebb8cb5efdd664943f68c'
const compilations=new WeakMap(),integrity=new WeakMap()
const fail=(code,message,details={})=>freeze({ok:false,status:'UNSUPPORTED',diagnostics:[{code,message}],...details})
const sourceTerms=r=>r.metadata?.effectiveSourceReaction?.components?.filter(t=>t.coefficient!==0)
/** Explicit boundary contract. No element, reagent-pair or display-formula branching. */
export async function compileEquilibriumNetwork(repository,request){
 const start=performance.now()
 if(!request||Object.keys(request).some(k=>!['boundary','selectedIds','amounts','constraints','revision','description','temperatureC','pressureBar','activityModel','unit','sourceFingerprint','phases','solvent','reviewedScope','exclusions','preparation','solidIds'].includes(k)))return fail('unsupported-boundary-condition','Unknown compiler input; no implicit reservoir or inventory interpretation.')
 if(request.solidIds!==undefined&&(!Array.isArray(request.solidIds)||!request.solidIds.length||new Set(request.solidIds).size!==request.solidIds.length||JSON.stringify(request.phases)!=='["aqueous","pure-solids"]'))return fail('invalid-solid-scope','Explicit solid source IDs require a unique nonempty list and pure-solid scope.')
 if(request.reviewedScope!==undefined&&typeof request.reviewedScope!=='boolean')return fail('invalid-scope-profile','Reviewed scope must be explicit true/false.')
 // The automatic physical entry discovers boundary from source connectivity.
 // Legacy explicit boundaries remain available for their existing scoped callers.
 if(request.boundary==='physical-preparation'){
  if(['amounts','constraints','selectedIds'].some(k=>request[k]!==undefined))return fail('conflicting-reservoir','Physical inventories alone determine the closed boundary.')
  const physical=await preparePhysicalContributions(repository,request.preparation)
  if(!physical.ok)return physical
  const scope=nonRedoxScope(repository,physical.selectedIds)
  if(!scope.ok&&scope.diagnostics[0].code!=='redox-boundary-mismatch')return scope
  if(scope.ok&&request.reviewedScope)return fail('reviewed-scope-mismatch','The explicit reviewed redox profile cannot be applied to a non-redox source graph.')
  const compiled=await compileEquilibriumNetwork(repository,{...request,boundary:scope.ok?'closed-physical-nonredox':'closed-physical'})
  return !compiled.ok&&!scope.ok?freeze({...compiled,sourceConnectivity:scope}):compiled
 }
 const {boundary}=request
 let {selectedIds}=request
 const nonRedox=boundary==='closed-physical-nonredox'
 if(request.solidIds!==undefined&&boundary!=='closed-physical')return fail('invalid-solid-scope','Explicit phase IDs currently apply only to the closed physical redox path.')
 if(!['closed-physical','closed-physical-nonredox','analytical-components'].includes(boundary))return fail('unsupported-boundary-condition','Explicit physical redox, physical non-redox or analytical boundary required; imposed grids retain their existing path.')
 if(boundary==='analytical-components'&&request.preparation!==undefined)return fail('unsupported-boundary-condition','Analytical constraints do not accept physical preparations.')
 if(boundary==='closed-physical'&&request.preparation!==undefined&&['amounts','constraints','selectedIds'].some(k=>request[k]!==undefined))return fail('conflicting-reservoir','Physical contributions determine source selection and inventory.')
 if(nonRedox&&['amounts','constraints','selectedIds','reviewedScope'].some(k=>request[k]!==undefined))return fail('conflicting-reservoir','Non-redox physical coordinates are derived only from supplied contributions, not caller constraints or selected inventories.')
 if(request.temperatureC!==25||request.pressureBar!==1||request.activityModel!=='ideal'||request.unit!=='mol/kg-H2O'||request.solvent!=='unit-water-activity'||!(['["aqueous"]',...((nonRedox||boundary==='closed-physical'&&!request.reviewedScope)?['["aqueous","pure-solids"]']:[])].includes(JSON.stringify(request.phases))))return fail('unsupported-boundary-condition','Ideal 25 C, declared 1 bar, mol/kg water, unit water activity and aqueous phase required.')
 if(request.sourceFingerprint!==equilibriumSourceFingerprint)return fail('source-integrity','Explicit source fingerprint does not match the supported imported snapshot.')
 if(!integrity.has(repository))integrity.set(repository,identity({components:[...repository.getComponents()].sort((a,b)=>a.id.localeCompare(b.id)),reactions:[...repository.getSpecies()].sort((a,b)=>a.id.localeCompare(b.id))}))
 if(await integrity.get(repository)!==request.sourceFingerprint)return fail('source-integrity','Source records or provenance changed.')
 const components=repository.getComponents(),rows=repositoryReactionCatalog(repository)
 if(new Set(components.map(c=>c.id)).size!==components.length||new Set(components.map(c=>c.name)).size!==components.length||new Set(rows.map(r=>r.id)).size!==rows.length)return fail('source-identity-collision','Ambiguous imported identity.')
 let physical=null,physicalScope=null,physicalRegistry=null
 if(boundary==='closed-physical'&&request.preparation!==undefined){
  physical=await preparePhysicalContributions(repository,request.preparation)
  if(!physical.ok)return physical
  selectedIds=physical.selectedIds
 }
 if(nonRedox){
  physicalRegistry=await sourceComponentMetadata(repository)
  if(!physicalRegistry.ok)return physicalRegistry
  physical=nonRedoxCoordinates(repository,request.preparation,physicalRegistry)
  if(!physical.ok)return physical
  selectedIds=physical.selectedIds
  physicalScope=nonRedoxScope(repository,selectedIds)
  if(!physicalScope.ok)return physicalScope
 }
 if(!Array.isArray(selectedIds)||!selectedIds.length||new Set(selectedIds).size!==selectedIds.length||selectedIds.some(id=>!repository.getComponentById(id)))return fail('invalid-component-identity','Select unique authoritative source component IDs.')
 if(request.exclusions?.length)return fail('unsupported-explicit-exclusion','General exclusions modify the validated network; use only the retained explicit reviewed profile in this phase.')
 const selected=selectedIds.map(id=>repository.getComponentById(id))
 if(selected.some(c=>c.role==='electron'))return fail('conflicting-reservoir','Selected electron denotes imposed activity; use the existing imposed-condition path.')
 if(!selected.some(c=>c.role==='solvent'))return fail('missing-solvent','Select the authoritative water solvent identity.')
 if(!Number.isInteger(request.revision)||request.revision<0)return fail('invalid-revision','A nonnegative calculation revision is required.')
 if(boundary==='closed-physical'){
  if(request.constraints)return fail('conflicting-reservoir','Closed physical compilation takes supplied amounts, not imposed activities.')
  const audit=await discoverGeneralClosed(repository,selectedIds,{reviewedScope:request.reviewedScope??false})
  if(!audit.canCalculate){
   const missing=physical&&audit.reasons.some(r=>r.code==='missing-conservation-metadata')
   return fail(missing?'unsupported-component-redox-conservation':'network-structural-failure','Source network cannot be compiled.',{diagnostics:missing?[{code:'unsupported-component-redox-conservation',message:'Physical component inventory and charge admitted. Connected closed-redox chemistry requires a conserved reaction-nullspace/proton-water basis; the current validated closed-redox compiler constructs it from reviewed elemental vectors, which are incomplete for this network. No electron reactions were suppressed.'},...audit.reasons]:audit.reasons,inspection:audit,...(physical?{physicalPreparation:physical.physicalPreparation,solverCoordinates:physical.solverCoordinates}: {})})
  }
  const compileMs=performance.now()-start,prepStart=performance.now()
  let prepared=await prepareGeneralClosed(repository,{amounts:physical?.amounts??request.amounts,description:request.description??'Source-derived physical inventory',revision:request.revision,temperatureC:25,pressureBar:1,activityModel:'ideal',unit:request.unit,...(physical?{physicalPreparation:physical.physicalPreparation}: {})},audit,physical??undefined)
  if(!prepared.ok)return prepared
  const solidClosure=request.phases.includes('pure-solids')
  if(solidClosure){prepared=await prepareClosedPureSolids(repository,prepared,request.solidIds);if(!prepared.ok)return prepared}
  const result=freeze({ok:true,version:equilibriumNetworkVersion,status:audit.status,boundary,...(physical?{physicalPreparation:physical.physicalPreparation,solverCoordinates:physical.solverCoordinates}:{}),sourceFingerprint:request.sourceFingerprint,inspection:{...audit,basisSelection:prepared.basisSelection??null,independentReactionRank:prepared.prepared.prepared.network.algebra.rank,networkSpeciesCount:prepared.prepared.prepared.network.sourceSpecies.length,boundary,pH:'derived',Eh:'derived',phaseScope:solidClosure?prepared.solidScope:{included:['aqueous'],excluded:audit.excluded},capacity:{aqueousSpecies:64,aqueousReactions:64,withSolids:128,basis:16}},preparedSystemInput:prepared.prepared,timing:{compileMs,prepareMs:performance.now()-prepStart}})
  compilations.set(result,{boundary,prepared,solidClosure});return result
 }
 if(request.amounts||request.reviewedScope)return fail('unsupported-boundary-condition','Analytical compilation requires explicit component constraints; no physical recipe/profile is implied.')
 const registry=physicalRegistry??await sourceComponentMetadata(repository),metadata={},names=new Map(selected.map(c=>[c.name,c]))
 if(!registry.ok)return registry
 const constraints=physical?.constraints??request.constraints
 for(const c of selected){if(!registry.entries[c.id]||!Number.isFinite(registry.entries[c.id].charge))return fail('missing-authoritative-composition','Required source charge metadata missing; elemental interpretation is optional.',{componentId:c.id});metadata[c.id]=registry.entries[c.id]}
 const solidClosure=nonRedox&&request.phases.includes('pure-solids')
 const included=[],excluded=[]
 for(const r of rows){
  const terms=sourceTerms(r)
  if(!terms?.length||terms.some(t=>!names.has(t.name)))continue
  if(new Set(terms.map(t=>t.name)).size!==terms.length||terms.some(t=>!Number.isFinite(t.coefficient))||!isSupportedFormationSource(r,repository))return fail('invalid-source-law','Relevant source law is invalid.',{sourceId:r.id})
  if(names.has(r.name))return fail('invalid-basis-rank','Selected basis is a dependent source product.',{sourceId:r.id})
  const record={id:r.id,name:r.name,phase:r.phase,reference:r.citation,provenance:r.provenance,terms,logK:r.logK,reason:'Every required source component is supplied.'}
  if(r.phase!=='aqueous'&&!(solidClosure&&r.phase==='solid')){excluded.push({...record,reason:'Phase outside requested inventory scope.'});continue}
  const elements={};let charge=0,atomsKnown=true
  for(const t of terms){const m=metadata[names.get(t.name).id];charge+=t.coefficient*m.charge;if(!m.elements)atomsKnown=false;for(const [e,n] of Object.entries(m.elements??{}))elements[e]=(elements[e]??0)+t.coefficient*n}
  for(const e of Object.keys(elements))if(elements[e]===0)delete elements[e]
  if((r.phase==='solid'&&charge!==0)||charge!==r.charge||(atomsKnown&&Object.values(elements).some(n=>!Number.isSafeInteger(n)||n<0)))return fail('invalid-conservation','Source transport fails elemental/charge allocation.',{sourceId:r.id})
  metadata[r.id]={id:r.id,name:r.name,...(atomsKnown?{elements}:{elementalStatus:'unavailable'}),charge,sourceIdentity:{id:r.id,reference:r.citation,record:r.provenance,derivation:'Signed source-law transport from pinned components'}};included.push(record)
 }
 // A known product with unresolved source requirements would require inverse basis closure.
 const reverse=rows.filter(r=>names.has(r.name)&&sourceTerms(r)?.some(t=>!names.has(t.name)))
 if(reverse.length)return fail('disconnected-source-network','Selected source product requires reverse closure beyond the direct analytical basis.',{sourceIds:reverse.map(r=>r.id)})
 if(!included.length)return fail('disconnected-source-network','No justified aqueous source laws; empty networks are not accepted.')
 if(nonRedox&&(selected.length>16||included.length>64||selected.length+included.length>64))return fail('unsupported-network-size','Physical non-redox scope is bounded to 16 components and 64 carriers/reactions.')
 const reactions=included.map(r=>({id:r.id,productId:r.id,terms:r.terms.map(t=>({id:names.get(t.name).id,coefficient:t.coefficient})),logK:r.logK,phase:r.phase,unit:{kind:'ideal-molal-standard'},provenance:{reference:r.reference,record:r.provenance}}))
 const algebra=transformReactionBasis({basisIds:selectedIds,componentIds:selectedIds,reactions,attributes:metadata})
 if(!algebra.ok)return algebra
 const compileMs=performance.now()-start,prepStart=performance.now()
 const prepared=await prepareChemicalSystem({...(solidClosure?{solidPolicy:multiSolidPolicy}:{}),components:selected.map(c=>({id:c.id,name:c.name,role:c.role==='solvent'?'water':c.role==='basis-choice'?'ordinary':c.role,phase:c.role==='solvent'?'liquid':'aqueous',source:c})),products:included.map(r=>({id:r.id,name:r.name,phase:r.phase,logBeta:r.logK,coefficients:selected.map(c=>r.terms.find(t=>t.name===c.name)?.coefficient??0),sourceRecord:r.provenance})),basisStatus:'explicit-direct',unit:request.unit,temperatureC:25,pressureBar:1,sourceIdentity:{compiler:equilibriumNetworkVersion,fingerprint:request.sourceFingerprint,selectedComponentIds:selectedIds,sourceReactionIds:included.map(r=>r.id),...(nonRedox?{boundary,adapterVersion:nonRedoxPhysicalVersion,metadataVersion:registry.version,physicalPreparation:physical.physicalPreparation,solverCoordinates:physical.solverCoordinates,revision:request.revision}: {})}})
 if(!prepared.ok)return prepared
 const point=await createPointInput(prepared.system,{constraints,revision:request.revision,unit:request.unit,temperatureC:25,pressureBar:1,activityModel:'ideal'})
 if(!point.ok)return point
 const result=freeze({ok:true,version:equilibriumNetworkVersion,status:excluded.length||physicalScope?.outsideBoundary.length?'CONDITIONAL':'SUPPORTED',boundary,sourceFingerprint:request.sourceFingerprint,...(nonRedox?{physicalPreparation:physical.physicalPreparation,solverCoordinates:physical.solverCoordinates,adapterVersion:nonRedoxPhysicalVersion}:{}),inspection:{selectedIds,included,excluded,metadata,metadataVersion:registry.version,algebra,independentReactionRank:included.length,unreachable:rows.filter(r=>sourceTerms(r)?.some(t=>!names.has(t.name))).map(r=>({sourceId:r.id,reason:'Missing source components',required:sourceTerms(r).filter(t=>!names.has(t.name)).map(t=>t.name)})),connectivity:included.map(r=>({sourceId:r.id,required:r.terms.map(t=>names.get(t.name).id)})),redoxCoupling:false,pH:constraints.find(c=>metadata[c.componentId]?.role==='proton')?.kh===2?'imposed':'derived',Eh:'not determined by this non-redox network',phaseScope:{included:request.phases,admitted:included.filter(r=>r.phase==='solid'),excluded,...(nonRedox?{outsideBoundary:physicalScope.outsideBoundary}: {})}},preparedSystemInput:{system:prepared.system,input:point.input},timing:{compileMs,prepareMs:performance.now()-prepStart}})
 compilations.set(result,{boundary,prepared,point,excluded,physical,metadata,solidClosure});return result
}
export function solveEquilibriumNetwork(compiled){
 const c=compilations.get(compiled);if(!c)return fail('unprepared-network','Use a successfully compiled, branded network.')
 const start=performance.now()
 if(c.boundary==='closed-physical'){const result=c.solidClosure?solveClosedPureSolids(c.prepared):solveGeneralClosed(c.prepared);return {...result,compilerVersion:equilibriumNetworkVersion,timing:{...compiled.timing,solveMs:performance.now()-start}}}
 const candidate=solvePoint(c.prepared.system,c.point.input,c.solidClosure?{phaseSelection:closedSolidActivePolicy}:{})
 if(candidate.scientificValidation!=='passed')return fail('equilibrium-not-accepted','Unchanged solver did not accept this point.',{candidate})
 const logs=Object.fromEntries(c.prepared.system.components.map((s,i)=>[s.name,candidate.logActivities[i]]))
 const phaseDiagnostics=c.excluded.map(r=>({...r,logActivity:r.logK+r.terms.reduce((n,t)=>n+t.coefficient*logs[t.name],0)}))
 const required=phaseDiagnostics.filter(r=>!Number.isFinite(r.logActivity)||(r.phase==='solid'&&r.logActivity>numericalValidationContract.saturatedSolidLogActivityTolerance)),gasSum=phaseDiagnostics.filter(r=>r.phase==='gas').reduce((n,r)=>n+10**r.logActivity,0)
 if(required.length||gasSum>1)return fail('unsupported-phase-closure','Aqueous candidate converged but excluded phase support is required.',{candidate,phaseDiagnostics})
 let physicalOutput={}
 if(c.physical){
  const charge=nonRedoxChargeCheck(c.prepared.system,c.point.input,candidate,c.metadata)
  if(!charge.ok)return fail('physical-charge-closure','Equilibrium charge exceeds propagated component-balance bounds; no ions were inserted.',{candidate,charge,phaseDiagnostics})
  const index=c.prepared.system.components.findIndex(s=>s.role==='proton')
  physicalOutput={boundary:c.boundary,adapterVersion:nonRedoxPhysicalVersion,physicalPreparation:compiled.physicalPreparation,solverCoordinates:compiled.solverCoordinates,derived:{pH:-candidate.logActivities[index]},notDetermined:{Eh:{status:'not-determined',reason:'No electron potential is determined by this non-redox boundary.'},pe:{status:'not-determined',reason:'No electron coordinate is solved.'}},charge,gasActivitySum:gasSum,phaseScope:compiled.inspection.phaseScope}
 }
 return freeze({ok:true,status:compiled.status,accepted:candidate,phaseDiagnostics,...physicalOutput,compilerVersion:equilibriumNetworkVersion,timing:{...compiled.timing,solveMs:performance.now()-start}})
}
