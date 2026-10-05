import {repositoryReactionCatalog} from './compatibility.js'
import {freeze} from '../solver/models.js'
export const componentSearchVersion='hydra-component-search-v1'
/** Database membership, not equilibrium admission. Mirrors the pinned Java DBSearch
 * subset scan and catalog-restricted forward redox expansion. No inverse discovery.
 * H2O is implicit; H+ and e- must be supplied as system coordinates by the caller.
 * Catalog element associations are vocabulary links, never atom counts.
 */
export function searchComponentSystem(repository,selectedIds){
 const components=repository.getComponents(),byId=new Map(components.map(c=>[c.id,c])),byName=new Map(components.map(c=>[c.name,c]))
 if(!Array.isArray(selectedIds)||selectedIds.some(id=>!byId.has(id)))return freeze({ok:false,diagnostics:[{code:'unknown-source-component',message:'Select authoritative repository component identities.'}]})
 const initial=[...new Set(selectedIds)],names=new Set(initial.map(id=>byId.get(id).name)),electron=components.find(c=>c.role==='electron'),water=components.find(c=>c.role==='solvent'),redox=names.has(electron?.name)
 const associations=new Set(initial.flatMap(id=>(byId.get(id).associations??[]).map(a=>a.element))),possible=new Set(components.filter(c=>(c.associations??[]).some(a=>associations.has(a.element))).map(c=>c.name))
 const records=repositoryReactionCatalog(repository),terms=r=>r.metadata?.effectiveSourceReaction?.components
 const valid=r=>Array.isArray(terms(r))&&terms(r).every(t=>typeof t.name==='string'&&Number.isFinite(t.coefficient))
 const missing=r=>terms(r).filter(t=>t.name&&t.name!==water?.name&&Math.abs(t.coefficient)>0.0001&&!names.has(t.name)).map(t=>t.name)
 const isRedox=r=>terms(r).some(t=>t.name===electron?.name)
 const chosen=new Map(),expansions=[]
 for(let pass=0;pass<=components.length;pass++){
  for(const r of records){if(!valid(r)||missing(r).length)continue;if(redox&&isRedox(r)&&names.has(r.name))continue;chosen.set(r.name,r)}
  if(!redox)break
  const add=[...chosen.values()].filter(r=>isRedox(r)&&possible.has(r.name)&&!names.has(r.name))
  if(!add.length)break
  for(const r of add){names.add(r.name);expansions.push({componentId:byName.get(r.name).id,sourceId:r.id,pass})}
 }
 const products=[...chosen.values()],ids=new Set(products.map(r=>r.id))
 return freeze({ok:true,version:componentSearchVersion,selectedIds:initial,implicitWaterId:water?.id,redox,expandedComponentIds:[...names].map(n=>byName.get(n)?.id).filter(Boolean),expansions,products,aqueous:products.filter(r=>r.phase==='aqueous'),solids:products.filter(r=>r.phase==='solid'),gases:products.filter(r=>r.phase==='gas'),electronConnected:products.filter(isRedox),excluded:records.filter(r=>!ids.has(r.id)).map(r=>({id:r.id,reason:!valid(r)?'invalid-source-terms':missing(r).length?'missing-system-components':'selected-component-identity-or-replaced-source',missing:valid(r)?missing(r):[]})),convention:{membershipFloor:0.0001,redoxNSP:'enabled',solidFilter:'all',sourceSemantics:componentSearchVersion}})
}
