import {fePeroxideScope} from './scopes/fePeroxide.js'
import {freeze,identity} from '../solver/models.js'

export const componentMetadataVersion='closed-component-metadata-v1'
// Explicit identity curation, never a formula parser or an element-association count.
// Full repository integrity remains an independent discovery prerequisite.
const seeds=[
 ['component:Eu%203%2B','Eu 3+',3,{Eu:1},'b17706253d61091ee3f5bdb4e283bbf703b5ace874075515d60562588f52959d','85Bar/Par: Standard Potentials in Aqueous Solution (1985), source Eu(III)/Eu(II) record 120483; PubChem CID 24809 europium(3+) trichloride'],
 ['component:K%2B','K+',1,{K:1},'45e27a06c5a37bc7a8140cc4aa1f6403b56e8f7fcbd14ea67dd541dee5b47c4b','PubChem CID 24597, dipotassium chromate; explicit potassium ion identity'],
 ['component:CrO4%202-','CrO4 2-',-2,{Cr:1,O:4},'f40d759b0963996bc96579ae503cb34eaae6b9784ee8dcb7d8cc0e930530b7b6','PubChem CID 24597 potassium chromate: two K+ and CrO4(2-); explicit chromate identity'],
 ['component:Cr%203%2B','Cr 3+',3,{Cr:1},'dc36f4a028736ccddc32d1683c2c05f45d3d0809265310aba2afb5b8e56a8481','Imported chromic ion identity; explicit reviewed monatomic Cr(III) assignment'],
 ['component:Cr%202%2B','Cr 2+',2,{Cr:1},'802b0092a0003371706160e0a4e1ef0b7e8ae05b8350e7327831b8c8d0704431','Imported chromous ion identity; explicit reviewed monatomic Cr(II) assignment'],
]
export async function componentMetadata(repository){
 const entries={}
 for(const [id,m] of Object.entries(fePeroxideScope.metadata))if(repository.getComponentById(id)&&await identity(repository.getComponentById(id))===fePeroxideScope.componentDigests[id])entries[id]=m
 for(const [id,name,charge,elements,digest,reference] of seeds){
  const c=repository.getComponentById(id)
  if(c&&c.name===name&&await identity(c)===digest)entries[id]={id,name,charge,elements,role:'ordinary',phase:'aqueous',sourceIdentity:{id,reference,record:c.provenance,componentSha256:digest,metadataVersion:componentMetadataVersion}}
 }
 const coverage=repository.getComponents().map(c=>({id:c.id,name:c.name,status:entries[c.id]?'SUPPORTED':c.associations?.length?'PARTIAL':'REQUIRES_REVIEW',canAllocate:!!entries[c.id],reason:entries[c.id]?'Reviewed source-bound composition and charge; equilibrium scope requires separate network audit.':c.associations?.length?'Source element links aid discovery only; reviewed atom counts and charge allocation are missing.':'No reviewed conservation identity.'}))
 return freeze({version:componentMetadataVersion,entries,coverage})
}
