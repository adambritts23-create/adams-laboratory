import {isRepositorySnapshot} from '../thermodynamics/repository.js'
import {freeze} from '../solver/models.js'
const cache=new WeakMap()
import {nonRedoxScope} from '../thermodynamics/nonRedoxPhysical.js'
import {repositoryReactionCatalog} from '../thermodynamics/compatibility.js'
/** Actual selected system only. Structural possibilities are never saturation/presence claims. */
export function inspectAnalyticalSystem(repository,selectedIds){
 const key=JSON.stringify([...selectedIds].sort()),snap=isRepositorySnapshot(repository);if(snap&&!cache.has(repository))cache.set(repository,new Map());if(snap&&cache.get(repository).has(key))return cache.get(repository).get(key)
 const names=new Set(selectedIds.map(id=>repository.getComponentById(id)?.name)),connectivity=nonRedoxScope(repository,selectedIds)
 const direct=repositoryReactionCatalog(repository).filter(r=>{const t=r.metadata?.effectiveSourceReaction?.components?.filter(c=>c.coefficient!==0);return t?.length&&t.every(c=>names.has(c.name))}).map(r=>({id:r.id,name:r.name,phase:r.phase}))
 const result=freeze({selectedIds,connectivity,aqueous:direct.filter(r=>r.phase==='aqueous'),solidCandidates:direct.filter(r=>r.phase==='solid'),gasCandidates:direct.filter(r=>r.phase==='gas'),connectedRedox:(connectivity.diagnostics?.[0]?.code==='redox-boundary-mismatch'?(connectivity.sourceIds??[]):[]).map(id=>{const r=repository.getSpeciesById(id);return {id,name:r?.name}}),phaseRequirement:'Candidate presence is structural; required phase closure is determined at the requested composition.'});if(snap)cache.get(repository).set(key,result);return result
}
