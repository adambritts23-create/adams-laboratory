import {isRepositorySnapshot} from './repository.js'
const snapshotMetadata=new WeakMap()
import {identity,freeze} from '../solver/models.js'
import {networkComposition} from './networkComposition.js'
import {sourceCharge} from './importers/spana/names.js'
import {equilibriumSourceFingerprint} from './equilibriumNetwork.js'
export const sourceComponentMetadataVersion='medusa-component-coordinates-v1'
/** Source charge grammar, verified on all 168 pinned identities. Atoms are optional enhancements. */
export async function sourceComponentMetadata(repository){
 if(!isRepositorySnapshot(repository))return compileMetadata(repository)
 if(!snapshotMetadata.has(repository))snapshotMetadata.set(repository,compileMetadata(repository))
 return snapshotMetadata.get(repository)
}
async function compileMetadata(repository){
 const components=repository.getComponents(),reactions=repository.getSpecies()
 const fingerprint=await identity({components:[...components].sort((a,b)=>a.id.localeCompare(b.id)),reactions:[...reactions].sort((a,b)=>a.id.localeCompare(b.id))})
 if(fingerprint!==equilibriumSourceFingerprint)return freeze({ok:false,version:sourceComponentMetadataVersion,entries:{},diagnostics:[{code:'source-integrity',message:'Component metadata requires the unchanged audited MEDUSA source snapshot.'}]})
 const reviewed=await networkComposition(repository),entries={}
 for(const c of components){
  const charge=sourceCharge(c.name),m=reviewed.entries[c.id]
  if(m&&m.charge!==charge)return freeze({ok:false,entries:{},diagnostics:[{code:'source-charge-mismatch',message:'Reviewed and source charge disagree: '+c.id}]})
  entries[c.id]=m??{id:c.id,name:c.name,role:c.role==='basis-choice'?'ordinary':c.role==='solvent'?'water':c.role,phase:c.role==='solvent'?'liquid':'aqueous',charge,elementalStatus:'unavailable',sourceIdentity:{id:c.id,record:c.provenance,sourceFingerprint:fingerprint,chargeConvention:'eq-diagr Util.chargeOf; audited 168/168 source names',metadataVersion:sourceComponentMetadataVersion}}
 }
 return freeze({ok:true,version:sourceComponentMetadataVersion,sourceFingerprint:fingerprint,entries})
}
