import {buildAnalyticalCandidates} from './analyticalCandidates.js'

import {isRepositorySnapshot} from '../thermodynamics/repository.js'

import {sourceComponentMetadata} from '../thermodynamics/sourceComponentMetadata.js'

import {isSupportedFormationSource} from '../thermodynamics/formationSupport.js'

import {freeze} from '../solver/models.js'

const catalogs=new WeakSet(),catalogCache=new WeakMap()

/** Source-bound metadata, separate from selectable forms and solvability. */

export async function loadWetLabIons(repository){

 if(!isRepositorySnapshot(repository))return buildCatalog(repository)

 if(!catalogCache.has(repository))catalogCache.set(repository,buildCatalog(repository))

 return catalogCache.get(repository)

}

async function buildCatalog(repository){

 const registry=await sourceComponentMetadata(repository)

 if(!registry.ok)throw new Error(registry.diagnostics.map(d=>d.message).join(' '))

 const entries={...registry.entries}

 const forms=repository.getComponents().filter(c=>!['electron','solvent'].includes(c.role))

 const byName=new Map(repository.getComponents().map(c=>[c.name,c])),analyticalEntries={}

 for(const form of forms){const m=registry.entries[form.id];if(m)analyticalEntries[form.id]={id:form.id,name:form.name,charge:m.charge,coefficients:{[form.id]:1},source:m.sourceIdentity}}

 // Source-bound input conveniences, not equations or pKa values. All coefficients come from records.

 const aliases=['spana:2ac52a30213c9288:250448','spana:2ac52a30213c9288:79298','spana:2ac52a30213c9288:37016']

 for(const id of aliases){const r=repository.getSpeciesById(id),terms=r?.metadata?.effectiveSourceReaction?.components?.filter(t=>t.coefficient!==0)

  if(!r||r.phase!=='aqueous'||!isSupportedFormationSource(r,repository)||!terms?.length)continue

  if(terms.some(t=>!Number.isSafeInteger(t.coefficient)||!registry.entries[byName.get(t.name)?.id]||byName.get(t.name)?.role==='electron'))continue

  const coefficients=Object.fromEntries(terms.map(t=>[byName.get(t.name).id,t.coefficient]))

  const charge=terms.reduce((n,t)=>n+t.coefficient*registry.entries[byName.get(t.name).id].charge,0)

  if(charge===r.charge)analyticalEntries[id]={id,name:r.name,charge,coefficients,source:r.provenance}

 }

 // Dichromate is a supplied aqueous formula unit, not an extra equilibrium constant.

 const dichromate=repository.getSpeciesById('spana:2ac52a30213c9288:94892')

 if(dichromate&&isSupportedFormationSource(dichromate,repository)&&dichromate.phase==='aqueous'){

  const terms=dichromate.metadata?.effectiveSourceReaction?.components?.filter(t=>t.coefficient)

  if(terms?.every(t=>byName.has(t.name)&&entries[byName.get(t.name).id]&&Number.isSafeInteger(t.coefficient)&&byName.get(t.name).role!=='electron')){

   const charge=terms.reduce((sum,t)=>sum+t.coefficient*entries[byName.get(t.name).id].charge,0)

   if(charge===dichromate.charge){

    entries[dichromate.id]={id:dichromate.id,name:dichromate.name,charge,sourceIdentity:dichromate.provenance}

    forms.push({id:dichromate.id,name:dichromate.name,charge,role:'ordinary',associations:[{element:'Cr'},{element:'O'}]})

   }

  }

 }

 const analyticalInputForms=[...forms]
 // Expose source products without changing equilibrium laws or claiming solver admission.

 const species=repository.getSpecies().filter(r=>r.role!=='solvent')

 for(const r of species){

  if(forms.some(f=>f.id===r.id)||r.phase!=='aqueous'||!Number.isFinite(r.charge)||!isSupportedFormationSource(r,repository))continue

  const terms=r.metadata?.effectiveSourceReaction?.components?.filter(t=>t.coefficient)

  if(!terms?.length||!terms.every(t=>byName.has(t.name)&&Number.isSafeInteger(t.coefficient)))continue

  const charge=terms.reduce((n,t)=>n+t.coefficient*registry.entries[byName.get(t.name).id].charge,0)

  if(charge!==r.charge)continue

  entries[r.id]={id:r.id,name:r.name,charge:r.charge,sourceIdentity:r.provenance}

  forms.push({id:r.id,name:r.name,role:'ordinary',associations:(r.discoveryElements??[]).map(element=>({element}))})

 }

 const browseForms=[...forms,...species.filter(r=>!forms.some(f=>f.id===r.id)).map(r=>({id:r.id,name:r.name,phase:r.phase,role:'ordinary',associations:(r.discoveryElements??[]).map(element=>({element}))}))]

 const analyticalForms=Object.values(analyticalEntries).sort((a,b)=>a.name.localeCompare(b.name))

 const candidates=buildAnalyticalCandidates(repository,[...analyticalInputForms,...analyticalForms.filter(f=>!analyticalInputForms.some(c=>c.id===f.id))],analyticalEntries,registry.entries)

 const catalog=freeze({browseForms,candidates,forms,entries,version:registry.version,analyticalEntries,analyticalForms})

 catalogs.add(catalog);return catalog

}

export function ionicMetadata(catalog,sourceId){

 if(!catalogs.has(catalog))throw new Error('Authoritative ionic metadata is not loaded.')

 const form=catalog.forms.find(c=>c.id===sourceId),metadata=catalog.entries[sourceId]

 if(!form||!metadata||!Number.isFinite(metadata.charge))throw new Error('Missing authoritative component/charge metadata for '+(form?.name??sourceId)+'. Selection is allowed; physical preparation is unavailable.')

 return {form,metadata}

}

export function ionicCharge(rows,catalog,volumeMl){

 let charge=0,absolute=0

 for(const row of rows.filter(r=>r.kind==='ionic')){

  const {metadata}=ionicMetadata(catalog,row.sourceId),n=Number(row.concentrationMolPerL)*Number(volumeMl)/1000*metadata.charge

  if(!Number.isFinite(n)||Number(row.concentrationMolPerL)<0)throw new Error('Enter nonnegative finite ionic concentrations.')

  charge+=n;absolute+=Math.abs(n)

 }

 const tolerance=128*Number.EPSILON*Math.max(1,absolute)

 return {charge,tolerance,balanced:Math.abs(charge)<=tolerance}

}

export function balanceIonicPair(rows,catalog){

 const ions=rows.filter(r=>r.kind==='ionic')

 if(ions.length!==2)throw new Error('Countercharge balancing requires exactly two ionic rows.')

 const a=ionicMetadata(catalog,ions[0].sourceId).metadata.charge,b=ionicMetadata(catalog,ions[1].sourceId).metadata.charge

 if(a*b>=0)throw new Error('Choose two forms with opposite authoritative charges.')

 const concentration=-Number(ions[0].concentrationMolPerL)*a/b

 if(!Number.isFinite(concentration)||concentration<0)throw new Error('Enter a nonnegative first concentration.')

 return rows.map(r=>r.id===ions[1].id?{...r,concentrationMolPerL:concentration}:r)

}



export function analyticalMetadata(catalog,sourceId){

 if(!catalogs.has(catalog)||!catalog.analyticalEntries[sourceId])throw new Error('Source-bound analytical component metadata unavailable.')

 return catalog.analyticalEntries[sourceId]

}

