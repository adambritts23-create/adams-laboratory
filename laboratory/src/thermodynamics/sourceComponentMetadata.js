import {isRepositorySnapshot,createRepository} from './repository.js'
const snapshotMetadata=new WeakMap()
import {identity,freeze} from '../solver/models.js'
import {networkComposition} from './networkComposition.js'
import {sourceCharge} from './importers/spana/names.js'
import {equilibriumSourceFingerprint} from './equilibriumNetwork.js'
import {PSI_ID,PSI_SHA256,supportedPsiRecord} from './importers/psinagra/index.js'
import {composition} from './databaseLibrary.js'
import {supportedCombinedRecord} from './spanaPreferred.js'
import {supportedLiteratureRecord,supportedLiteratureComponent,URANIUM_LITERATURE_ID} from './uraniumLiterature.js'
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
 const supplements=reactions.filter(s=>s.metadata?.sourceFormat==='spana-preferred-psi-v1')
 if(supplements.length&&supplements.every(s=>supportedCombinedRecord(s,repository))){
  const core=createRepository({species:reactions.filter(s=>s.metadata?.sourceFormat!=='spana-preferred-psi-v1'),components,elements:repository.getElements(),sources:repository.getSources()})
  const checked=await sourceComponentMetadata(core)
  if(checked.ok)return freeze({...checked,version:'spana-preferred-coordinates-v1',sourceFingerprint:fingerprint,entries:Object.fromEntries(Object.entries(checked.entries).map(([id,m])=>[id,{...m,sourceIdentity:{...m.sourceIdentity,sourceFingerprint:fingerprint}}]))})
 }
 if(reactions.some(s=>s.sourceDatabase===PSI_ID)&&reactions.every(s=>s.role==='solvent'||supportedPsiRecord(s)||supportedLiteratureRecord(s,repository))&&components.every(c=>(c.provenance?.dbSha256===PSI_SHA256&&composition(c.name)!==null)||supportedLiteratureComponent(c))){
  const entries=Object.fromEntries(components.map(c=>[c.id,{id:c.id,name:c.name,role:c.role==='basis-choice'?'ordinary':c.role==='solvent'?'water':c.role,phase:c.role==='solvent'?'liquid':'aqueous',charge:sourceCharge(c.name),elements:composition(c.name),elementalStatus:'available',sourceIdentity:{id:c.id,record:c.provenance,sourceFingerprint:fingerprint,metadataVersion:'psinagra-component-coordinates-v1'}}]))
  return freeze({ok:true,version:'psinagra-component-coordinates-v1',sourceFingerprint:fingerprint,entries})
 }
 if(reactions.some(s=>s.sourceDatabase===URANIUM_LITERATURE_ID)&&reactions.filter(s=>s.sourceDatabase===URANIUM_LITERATURE_ID).every(s=>supportedLiteratureRecord(s,repository))){
  const core=createRepository({species:reactions.filter(s=>s.sourceDatabase!==URANIUM_LITERATURE_ID),components:components.filter(c=>!supportedLiteratureComponent(c)),elements:repository.getElements(),sources:repository.getSources().filter(s=>s.id!==URANIUM_LITERATURE_ID)})
  const checked=await sourceComponentMetadata(core)
  if(checked.ok&&checked.sourceFingerprint===equilibriumSourceFingerprint){
   const entries=Object.fromEntries(Object.entries(checked.entries).map(([id,m])=>[id,{...m,sourceIdentity:{...m.sourceIdentity,sourceFingerprint:fingerprint}}]))
   return freeze({ok:true,version:'medusa-with-uranium-literature-v1',sourceFingerprint:fingerprint,entries})
  }
 }
 if(fingerprint!==equilibriumSourceFingerprint)return freeze({ok:false,version:sourceComponentMetadataVersion,entries:{},diagnostics:[{code:'source-integrity',message:'Component metadata requires a supported Spana or PSI/Nagra collection. Mixed or edited source reactions need a separate audit.'}]})
 const reviewed=await networkComposition(repository),entries={}
 for(const c of components){
  const charge=sourceCharge(c.name),m=reviewed.entries[c.id]
  if(m&&m.charge!==charge)return freeze({ok:false,entries:{},diagnostics:[{code:'source-charge-mismatch',message:'Reviewed and source charge disagree: '+c.id}]})
  entries[c.id]=m??{id:c.id,name:c.name,role:c.role==='basis-choice'?'ordinary':c.role==='solvent'?'water':c.role,phase:c.role==='solvent'?'liquid':'aqueous',charge,elementalStatus:'unavailable',sourceIdentity:{id:c.id,record:c.provenance,sourceFingerprint:fingerprint,chargeConvention:'eq-diagr Util.chargeOf; audited 168/168 source names',metadataVersion:sourceComponentMetadataVersion}}
 }
 return freeze({ok:true,version:sourceComponentMetadataVersion,sourceFingerprint:fingerprint,entries})
}
