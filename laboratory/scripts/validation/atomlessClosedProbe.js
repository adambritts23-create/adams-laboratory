// Validation-only source discovery and preparation adapter; calls the existing solver.
import {repo} from './nonRedoxPhysicalBenchmark.js'
import {preparePhysicalContributions} from '../../src/thermodynamics/physicalPreparation.js'
import {sourceComponentMetadata} from '../../src/thermodynamics/sourceComponentMetadata.js'
import {repositoryReactionCatalog} from '../../src/thermodynamics/compatibility.js'
import {isSupportedFormationSource} from '../../src/thermodynamics/formationSupport.js'
import {transformReactionBasis} from '../../src/thermodynamics/reactionBasis.js'
import {prepareChemicalSystem,createPointInput} from '../../src/solver/models.js'
import {solvePoint} from '../../src/solver/point.js'
import {peToEh} from '../../src/solver/redox.js'
import {numericalValidationContract as limits} from '../../src/solver/validationContract.js'
import {deriveConservation,projectInventory,sourcePhysicalBasis} from './exactSourceConservation.js'
const E='component:e-',W='component:H2O',H='component:H%2B'
const terms=r=>r.metadata?.effectiveSourceReaction?.components?.filter(t=>t.coefficient!==0)
const fail=(code,details={})=>({ok:false,code,...details})
export async function probe(preparation){
 const physical=await preparePhysicalContributions(repo,preparation);if(!physical.ok)return physical
 const registry=await sourceComponentMetadata(repo);if(!registry.ok)return registry
 const byName=new Map(repo.getComponents().map(c=>[c.name,c])),rows=repositoryReactionCatalog(repo),selected=physical.selectedIds,metadata={},reached=new Set()
 const put=c=>{const m=registry.entries[c.id];metadata[c.id]={id:c.id,name:c.name,charge:m.charge,phase:c.role==='solvent'?'liquid':'aqueous',role:c.role==='solvent'?'water':c.role==='basis-choice'?'ordinary':c.role,sourceIdentity:{id:c.id,reference:'Pinned MEDUSA source charge and identity',record:c.provenance}};reached.add(c.name)}
 for(const id of new Set([...selected,E,W,H]))put(repo.getComponentById(id))
 const canonical=r=>byName.get(r.name)?.id??r.id
 let changed=true
 while(changed){changed=false;for(const r of rows){const ts=terms(r);if(r.phase!=='aqueous'||!ts?.length)continue
  const unknown=ts.filter(t=>!reached.has(t.name))
  if(metadata[canonical(r)]&&unknown.length===1&&byName.has(unknown[0].name)){put(byName.get(unknown[0].name));changed=true}
  if(!ts.every(t=>reached.has(t.name)))continue
  if(!metadata[canonical(r)]){const c=byName.get(r.name);if(c)put(c);else metadata[r.id]={id:r.id,name:r.name,charge:r.charge,phase:'aqueous',role:'ordinary',sourceIdentity:{id:r.id,reference:r.citation,record:r.provenance}};changed=true}
 }}
 const unresolved=rows.filter(r=>r.phase==='aqueous'&&metadata[canonical(r)]&&terms(r)?.some(t=>!reached.has(t.name)))
 if(unresolved.length)return fail('unresolved-source-connection',{ids:unresolved.map(r=>r.id)})
 const eligible=rows.filter(r=>terms(r)?.every(t=>reached.has(t.name))),admitted=eligible.filter(r=>r.phase==='aqueous'),excluded=eligible.filter(r=>r.phase!=='aqueous')
 const audit={sourceFingerprint:registry.sourceFingerprint,physicalAdmission:true,aqueousCount:admitted.length,excludedCount:excluded.length,sourceIds:admitted.map(r=>r.id),elementsUsed:false}
 if(eligible.some(r=>!isSupportedFormationSource(r,repo)))return fail('unsupported-source-law',{audit})
 if(eligible.some(r=>terms(r).some(t=>!Number.isSafeInteger(t.coefficient))))return fail('noninteger-source-requires-exactness-audit',{audit,ids:eligible.filter(r=>terms(r).some(t=>!Number.isSafeInteger(t.coefficient))).map(r=>r.id)})
 const reactions=admitted.map(r=>({id:r.id,productId:canonical(r),terms:terms(r).map(t=>({id:byName.get(t.name).id,coefficient:t.coefficient})),logK:r.logK,phase:'aqueous',unit:{kind:'ideal-molal-standard'},provenance:{reference:r.citation,record:r.provenance}}))
 const used=new Set([...selected,E,W,H,...reactions.flatMap(r=>[r.productId,...r.terms.map(t=>t.id)])]),species=[...used].map(id=>metadata[id])
 if(species.some(s=>!s))return fail('missing-source-identity',{audit})
 if(species.length>64||reactions.length>64)return fail('bounded-compiler-capacity',{audit,species:species.length,reactions:reactions.length})
 for(const r of reactions){const residual=metadata[r.productId].charge-r.terms.reduce((v,t)=>v+t.coefficient*metadata[t.id].charge,0);if(residual!==0)return fail('source-charge-inconsistent',{audit,id:r.id,residual})}
 const basisIds=sourcePhysicalBasis(species,reactions,selected)
 if(basisIds.includes(E)||!basisIds.includes(W)||basisIds.length>16)return fail('unsupported-physical-basis',{audit,basisIds})
 const algebra=transformReactionBasis({basisIds,componentIds:species.map(s=>s.id),reactions,attributes:Object.fromEntries(species.map(s=>[s.id,{charge:s.charge}])),...(species.length>32?{capacity:'closed-aqueous-64-v1'}:{})});if(!algebra.ok)return {...algebra,audit}
 let conservation
 try{conservation=deriveConservation({species:species.map(({id,role,charge})=>({id,role,charge})),reactions,electronId:E,waterId:W,basisIds})}catch(error){return fail('source-conservation-rank',{audit,message:error.message})}
 const targets=projectInventory(conservation,physical.amounts,basisIds,W),components=basisIds.map(id=>metadata[id]),physicalSpecies=species.filter(s=>![E,W].includes(s.id))
 const products=physicalSpecies.filter(s=>!basisIds.includes(s.id)).map(s=>({id:s.id,name:s.name,phase:'aqueous',charge:s.charge,coefficients:algebra.componentExpressions[s.id].coefficients,logBeta:algebra.componentExpressions[s.id].logK,sourceRecord:s.sourceIdentity}))
 const prepared=await prepareChemicalSystem({components,products,basisStatus:'explicit-direct',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{kind:'isolated-atomless-source-probe',fingerprint:registry.sourceFingerprint}});if(!prepared.ok)return {...prepared,audit}
 const point=await createPointInput(prepared.system,{constraints:basisIds.map((componentId,i)=>({componentId,kh:componentId===W?2:1,value:targets[i]})),revision:0,unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,activityModel:'ideal'});if(!point.ok)return {...point,audit}
 const result=solvePoint(prepared.system,point.input)
 const structural={...audit,basisIds,targets,conservationDimension:conservation.dimension,nullResidual:conservation.maxNullResidual}
 if(result.scientificValidation!=='passed')return fail('equilibrium-not-accepted',{audit:structural,result})
 const logs=Object.fromEntries(result.speciesIds.map((id,i)=>[id,id===W?result.logActivities[i]:Math.log10(result.concentrations[i])])),halves=reactions.filter(r=>r.terms.some(t=>t.id===E)),potentials=halves.map(r=>{const e=r.terms.find(t=>t.id===E).coefficient;return {id:r.id,pe:-(logs[r.productId]-r.logK-r.terms.filter(t=>t.id!==E).reduce((v,t)=>v+t.coefficient*logs[t.id],0))/e}}),pe=potentials[0].pe
 if(potentials.some(p=>!Number.isFinite(p.pe)||Math.abs(p.pe-pe)>2*limits.massActionLogResidualTolerance))return fail('half-reaction-potential-disagreement',{audit:structural,potentials})
 const closure=conservation.conservation.map(row=>{const total=conservation.physicalIds.reduce((v,id,i)=>v+row.weights[i]*(physical.amounts[id]??0),0),values=physicalSpecies.map(s=>row.weights[conservation.physicalIds.indexOf(s.id)]*result.concentrations[result.speciesIds.indexOf(s.id)]),residual=values.reduce((v,x)=>v+x,0)-total,limit=row.basisWeights.reduce((v,w,i)=>v+Math.abs(w)*result.residuals.componentBalanceLimits[i],0)+128*Number.EPSILON*Math.max(1,values.reduce((v,x)=>v+Math.abs(x),0));return {key:row.key,total,residual,limit,ok:Math.abs(residual)<=limit}})
 if(closure.some(r=>!r.ok))return fail('source-conservation-residual',{audit:structural,closure})
 const byNameLog=Object.fromEntries(species.filter(s=>s.id!==E).map(s=>[s.name,logs[s.id]]));byNameLog[metadata[E].name]=-pe
 const phaseDiagnostics=excluded.map(r=>({id:r.id,name:r.name,phase:r.phase,logActivity:r.logK+terms(r).reduce((v,t)=>v+t.coefficient*byNameLog[t.name],0)})),required=phaseDiagnostics.filter(r=>!Number.isFinite(r.logActivity)||r.phase==='solid'&&r.logActivity>limits.saturatedSolidLogActivityTolerance),gasSum=phaseDiagnostics.filter(r=>r.phase==='gas').reduce((v,r)=>v+10**r.logActivity,0)
 const candidate={pH:-logs[H],pe,Eh:peToEh(pe),carriers:physicalSpecies.map(s=>({id:s.id,name:s.name,amount:result.concentrations[result.speciesIds.indexOf(s.id)]})),closure,potentials,scientificValidation:result.scientificValidation}
 if(required.length||gasSum>1)return fail(required.length?'excluded-phase-required':'gas-headspace-required',{audit:structural,candidate,phaseDiagnostics,required,gasSum})
 return {ok:true,status:'CONDITIONAL',audit:structural,candidate,phaseDiagnostics,gasSum,elementalInterpretation:'unavailable'}
}
