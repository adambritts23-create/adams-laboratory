import {feOxidationMetadata} from './feOxidationMetadata.js'
import {cuOxidationMetadata} from './cuOxidationMetadata.js'
import {fePourbaixCandidate} from './fePourbaixContract.js'
import {cuPourbaixCandidate} from './cuPourbaixContract.js'
// Scientific curation and independently accepted evidence, not discovery rules.
export const redoxSupportCatalog=Object.freeze([
 {label:'Fe',registry:feOxidationMetadata,reference:fePourbaixCandidate},
 {label:'Cu',registry:cuOxidationMetadata,reference:cuPourbaixCandidate}
])
