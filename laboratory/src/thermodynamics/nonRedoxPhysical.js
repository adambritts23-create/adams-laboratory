import {repositoryReactionCatalog} from './compatibility.js'
import {isRepositorySnapshot} from './repository.js'
import {freeze} from '../solver/models.js'
import {isSupportedFormationSource} from './formationSupport.js'
import {componentBalanceTolerance} from '../solver/validationContract.js'

export const nonRedoxPhysicalVersion='non-redox-physical-v1'
const H='component:H%2B',W='component:H2O'
const fail=(code,message,details={})=>freeze({ok:false,status:'UNSUPPORTED',diagnostics:[{code,message}],...details})
const terms=r=>r.metadata?.effectiveSourceReaction?.components?.filter(t=>t.coefficient!==0)??[]

/** Source identities describe supplied formula-unit inventories, not equilibrium populations. */
export function nonRedoxCoordinates(repository,preparation,registry){
 if(!preparation||Object.keys(preparation).some(k=>!['contributions','solventCoordinate','provenance','counterionModel'].includes(k))||typeof preparation.provenance!=='string'||!preparation.provenance.trim())return fail('invalid-physical-preparation','Explicit contributions, solvent coordinate and preparation provenance required.')
 if(preparation.counterionModel!==undefined&&preparation.counterionModel!=='inert-background')return fail('invalid-counterion-model','Unknown counterion model.')
 const solvent=preparation.solventCoordinate
 if(!solvent||Object.keys(solvent).some(k=>!['convention','modelSolventMassKg','volumeMl'].includes(k))||!Number.isFinite(solvent.modelSolventMassKg)||solvent.modelSolventMassKg<=0)return fail('invalid-solvent-coordinate','Positive finite solvent coordinate required.')
 if(solvent.convention==='dilute-ideal-aqueous-volume-v0'){
  if(!Number.isFinite(solvent.volumeMl)||solvent.volumeMl<=0||solvent.modelSolventMassKg!==solvent.volumeMl/1000)return fail('invalid-solvent-coordinate','Use exactly one model kg H2O/L of final additive solution volume; this is not measured density.')
 }else if(solvent.convention!=='explicit-solvent-mass-kg'||solvent.volumeMl!==undefined)return fail('invalid-solvent-coordinate','Declare model volume convention or explicit solvent mass, without an implicit molarity conversion.')
 if(!Array.isArray(preparation.contributions)||!preparation.contributions.length||preparation.contributions.length>64)return fail('invalid-physical-preparation','Provide 1–64 source-bound physical contributions.')
 const byName=new Map(repository.getComponents().map(c=>[c.name,c])),coordinates={[H]:0},contributions=[],rowIds=new Set()
 for(const row of preparation.contributions){
  if(!row||Object.keys(row).some(k=>!['id','sourceId','moles','provenance'].includes(k))||typeof row.id!=='string'||!row.id||rowIds.has(row.id)||typeof row.provenance!=='string'||!row.provenance.trim()||!Number.isFinite(row.moles)||row.moles<0)return fail('invalid-physical-contribution','Unique row IDs, nonnegative finite physical moles and provenance are required.')
  rowIds.add(row.id)
  const component=repository.getComponentById(row.sourceId),product=repository.getSpeciesById(row.sourceId)
  if(component&&['proton','electron','solvent'].includes(component.role)&&component.id!==H)return fail('invalid-physical-contribution','Electron and solvent are not supplied solute inventories.')
  if(!component&&(!product||product.phase!=='aqueous'||!isSupportedFormationSource(product,repository)||!terms(product).length))return fail('unsupported-physical-identity','Supply a source component or directly represented aqueous source identity.',{sourceId:row.sourceId})
  const mapping=component?[{name:component.name,coefficient:1}]:terms(product)
  if(mapping.some(t=>byName.get(t.name)?.role==='electron'))return fail('redox-boundary-mismatch','Supplied identity requires an electron-bearing source transformation; use a validated redox boundary.',{sourceId:row.sourceId})
  const coefficients={},elements={};let charge=0,atomsKnown=true
  for(const t of mapping){const c=byName.get(t.name),m=c&&registry.entries[c.id]
   if(!m)return fail('missing-authoritative-component','Physical contribution requires source-bound component identity and charge.',{sourceId:row.sourceId,componentId:c?.id})
   if(!Number.isSafeInteger(t.coefficient)||Object.hasOwn(coefficients,c.id))return fail('invalid-physical-stoichiometry','Unique integer source coefficients required.')
   coefficients[c.id]=t.coefficient;charge+=t.coefficient*m.charge
   if(!m.elements)atomsKnown=false
   for(const [e,n] of Object.entries(m.elements??{}))elements[e]=(elements[e]??0)+t.coefficient*n
  }
  if((product&&charge!==product.charge)||atomsKnown&&(Object.values(elements).some(n=>!Number.isSafeInteger(n)||n<0)||!Object.values(elements).some(n=>n>0)))return fail('invalid-physical-stoichiometry','Source composition/charge cannot represent a physical supplied formula unit.')
  for(const [id,k] of Object.entries(coefficients))if(id!==W&&row.moles>0)coordinates[id]=(coordinates[id]??0)+row.moles*k
  contributions.push({...row,name:(component??product).name,charge,...(atomsKnown?{elements}:{elementalStatus:'unavailable'}),componentMoles:Object.fromEntries(Object.entries(coefficients).map(([id,k])=>[id,row.moles*k])),source:structuredClone((component??product).provenance)})
 }
 if(Object.entries(coordinates).some(([id,n])=>!Number.isFinite(n)||(id!==H&&n<0)))return fail('invalid-physical-coordinates','Only the internal proton-equivalent coordinate may be negative.')
 const netCharge=contributions.reduce((s,r)=>s+r.moles*r.charge,0),absoluteCharge=contributions.reduce((s,r)=>s+Math.abs(r.moles*r.charge),0),limit=128*Number.EPSILON*Math.max(1,absoluteCharge)
 if(!Number.isFinite(netCharge)||(preparation.counterionModel!=='inert-background'&&Math.abs(netCharge)>limit))return fail('unbalanced-preparation','Supplied physical inventory must be electroneutral; no counterions are inserted.',{netCharge,limit})
 const selectedIds=[H,...Object.keys(coordinates).filter(id=>id!==H&&coordinates[id]>0).sort(),W]
 if(selectedIds.length<=2)return fail('empty-physical-preparation','At least one positive conserved solute inventory is required.')
 const constraints=selectedIds.map(id=>({componentId:id,kh:id===W?2:1,value:id===W?0:coordinates[id]/solvent.modelSolventMassKg}))
 if(constraints.some(c=>!Number.isFinite(c.value)))return fail('invalid-physical-coordinates','Solvent conversion overflow.')
 return freeze({ok:true,version:nonRedoxPhysicalVersion,selectedIds,constraints,physicalPreparation:{...structuredClone(preparation),contributions,charge:{netCharge,...(preparation.counterionModel==='inert-background'?{inertCountercharge:-netCharge,totalCharge:0}:{}),limit,unit:'mol charge equivalents'}},solverCoordinates:{unit:'mol/kg-H2O',componentMoles:coordinates,constraints,meaning:'Internal conserved coordinates; signed proton equivalents are not physical negative H+ reagent.',water:'Unit activity; source water coefficient retained in contribution provenance, not a solute total.'}})
}

/** Conservative aqueous connectivity screen. Hypothetical electron-dependent phases are disclosed separately. */
const scopeCache=new WeakMap()
export function nonRedoxScope(repository,selectedIds){
 if(!isRepositorySnapshot(repository))return inspectNonRedoxScope(repository,selectedIds)
 let cache=scopeCache.get(repository);if(!cache){cache=new Map();scopeCache.set(repository,cache)}
 const key=JSON.stringify(selectedIds)
 if(cache.has(key))return cache.get(key)
 const result=inspectNonRedoxScope(repository,selectedIds)
 if(cache.size>=32)cache.delete(cache.keys().next().value)
 cache.set(key,result);return result
}
function inspectNonRedoxScope(repository,selectedIds){
 const all=repository.getComponents(),byName=new Map(all.map(c=>[c.name,c])),selected=new Set(selectedIds.map(id=>repository.getComponentById(id).name)),reached=new Set(selected)
 const rows=(isRepositorySnapshot(repository)?repositoryReactionCatalog(repository):repository.getSpecies()).filter(r=>terms(r).length)
 let changed=true
 while(changed){changed=false;for(const r of rows)if(r.phase==='aqueous'&&terms(r).every(t=>reached.has(t.name))&&!reached.has(r.name)){reached.add(r.name);changed=true}}
 const electronName=all.find(c=>c.role==='electron')?.name
 const connected=rows.filter(r=>terms(r).some(t=>t.name===electronName)&&terms(r).every(t=>t.name===electronName||reached.has(t.name))&&
  (terms(r).some(t=>!['proton','solvent','electron'].includes(byName.get(t.name)?.role)&&reached.has(t.name))||selected.has(r.name)))
 const redox=connected.filter(r=>r.phase==='aqueous')
 // A selected product with an electron-bearing inverse law is also redox-active.
 for(const r of rows)if(r.phase==='aqueous'&&selected.has(r.name)&&terms(r).some(t=>t.name===electronName)&&!redox.includes(r))redox.push(r)
 if(redox.length)return fail('redox-boundary-mismatch','Connected aqueous electron-transfer chemistry requires an appropriate validated closed-redox boundary; no reactions were suppressed or rerouted.',{sourceIds:redox.map(r=>r.id)})
 const further=rows.filter(r=>r.phase==='aqueous'&&terms(r).every(t=>reached.has(t.name))&&terms(r).some(t=>!selected.has(t.name)))
 if(further.length)return fail('unsupported-ordinary-basis-closure','Reachable ordinary chemistry requires further basis closure; it cannot be silently omitted by this direct-boundary adapter.',{sourceIds:further.map(r=>r.id)})
 return freeze({ok:true,outsideBoundary:connected.filter(r=>r.phase!=='aqueous').map(r=>({id:r.id,name:r.name,phase:r.phase,terms:terms(r),reason:'Electron-dependent non-aqueous chemistry outside the declared aqueous non-redox boundary; activity not determined without potential.'}))})
}

export function nonRedoxChargeCheck(system,input,result,metadata){
 const species=[...system.components,...system.products],contributions=species.filter(s=>s.role!=='water').map(s=>({id:s.id,charge:metadata[s.id].charge,amount:result.concentrations[result.speciesIds.indexOf(s.id)]}))
 const netCharge=contributions.reduce((n,c)=>n+c.charge*c.amount,0)
 const totals=input.constraints.filter(c=>c.kh===1).map(c=>Math.abs(c.value)).filter(n=>n>0),smallest=Math.min(...totals)
 // Charge is a linear combination of conserved component balances; propagate those existing bounds.
 const limit=system.components.reduce((s,c,i)=>s+(input.constraints[i].kh===1?Math.abs(metadata[c.id].charge)*componentBalanceTolerance(input.constraints[i].value,smallest):0),0)
 return freeze({ok:Number.isFinite(netCharge)&&Math.abs(netCharge)<=limit,netCharge,limit,unit:'mol charge equivalents/kg H2O',contributions})
}
