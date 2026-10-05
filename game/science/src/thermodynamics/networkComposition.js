import {componentMetadata} from './componentMetadata.js'
import {identity,freeze} from '../solver/models.js'
export const networkMetadataVersion='network-composition-v2'
const additions=[{id:'component:CH3COO-',name:'CH3COO-',charge:-1,elements:{C:2,H:3,O:2},digest:'8654b69735bd6a7443ea8d0628564b1cf4dafa98a3b42792bb33f29357cc9719',reference:'https://pubchem.ncbi.nlm.nih.gov/compound/175 — explicit acetate C2H3O2(-), accessed 2026-09-16; imported component identity pinned independently'}]
export async function networkComposition(repository){
 const original=await componentMetadata(repository),entries={...original.entries}
 for(const a of additions){const c=repository.getComponentById(a.id);if(c&&c.name===a.name&&await identity(c)===a.digest)entries[a.id]={id:a.id,name:a.name,charge:a.charge,elements:a.elements,role:'ordinary',phase:'aqueous',sourceIdentity:{id:a.id,reference:a.reference,componentSha256:a.digest,record:c.provenance}}}
 for(const a of physicalAdditions){const c=repository.getComponentById(a.id);if(c&&c.name===a.name&&await identity(c)===a.digest)entries[a.id]={id:a.id,name:a.name,charge:a.charge,elements:a.elements,role:'ordinary',phase:'aqueous',sourceIdentity:{id:a.id,reference:a.reference,componentSha256:a.digest,record:c.provenance,metadataVersion:networkMetadataVersion}}}
 return freeze({version:networkMetadataVersion,entries})
}
// Explicit composition curation, not runtime formula parsing. Constants stay in source records.
const physicalAdditions=[
 {id:'component:Na%2B',name:'Na+',charge:1,elements:{Na:1},digest:'8d27187b6d344dc61bee5dff9dddadbb380ce7be6f4cb33539cf1514f4e5bc48',reference:'Retained Reactions.elb sodium-ion identity, already pinned by wetLabTitration; NaOH/NaCl source stoichiometry (224689/223384). Explicit monatomic sodium(+1) composition.'},
 {id:'component:B(OH)3',name:'B(OH)3',charge:0,elements:{B:1,O:3,H:3},digest:'1273d92beb8eeb56b691b56cc695c987a6049ba3d33fae7ae1cad525ccefc2aa',reference:'Retained Reactions.elb boric-acid identity; H3BO3(cr) source 155572, CODATA (Cox, Wagman, Medvedev 1989), one B(OH)3 per formula unit. Explicit B1 H3 O3 neutral composition; borate law 37016 cites NIST SRD 46 v8.'},
]
