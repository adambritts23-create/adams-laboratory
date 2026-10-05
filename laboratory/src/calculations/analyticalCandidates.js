import {freeze} from '../solver/models.js'
import {wetLabRecipes,wetLabRecipeSources} from './wetLabSolutions.js'
// Normalization of typography only; no chemical formula interpretation.
export const componentSearchKey=text=>String(text??'').normalize('NFKC').toLowerCase().replace(/−/g,'-').replace(/\s+/g,'')
export function buildAnalyticalCandidates(repository,forms,entries,metadata){
 const elements=new Map(repository.getElements().map(e=>[e.symbol,e.name])),components=repository.getComponents(),byName=new Map(components.map(c=>[c.name,c])),byId=new Map(components.map(c=>[c.id,c])),buckets=new Map()
 // One structural pass over source laws. No graph expansion or equilibrium per candidate.
 for(const r of repository.getSpecies()){
  const terms=r.metadata?.effectiveSourceReaction?.components?.filter(t=>t.coefficient!==0)??[],ordinary=[...new Set(terms.map(t=>byName.get(t.name)).filter(c=>c?.role==='basis-choice').map(c=>c.id))]
  if(ordinary.length!==1)continue
  const bucket=buckets.get(ordinary[0])??[];bucket.push({id:r.id,phase:r.phase,electron:terms.some(t=>byName.get(t.name)?.role==='electron'),proton:terms.some(t=>byName.get(t.name)?.role==='proton')});buckets.set(ordinary[0],bucket)
 }
 const candidates=forms.map(form=>{
  const m=entries[form.id],basis=Object.keys(m?.coefficients??{[form.id]:1}),related=basis.flatMap(id=>buckets.get(id)??[]),sourceForms=basis.map(id=>byId.get(id)).filter(Boolean)
  const labels=Object.entries(wetLabRecipeSources).filter(([,id])=>id===form.id).map(([id])=>wetLabRecipes[id]?.label??id)
  const descriptions=sourceForms.flatMap(c=>c.associations.flatMap(a=>[a.description,a.element,elements.get(a.element)??'']))
  const references=basis.map(id=>metadata[id]?.sourceIdentity?.reference??'')
  const selectable=!!m&&Number.isFinite(m.charge)&&Object.values(m.coefficients).every(Number.isSafeInteger)
  const capabilities={aqueous:true,acidBase:related.some(r=>r.proton),connectedRedox:related.some(r=>r.phase==='aqueous'&&r.electron),solidsPossible:related.some(r=>r.phase==='solid'),gasPossible:related.some(r=>r.phase==='gas')}
  const currentLimit=!selectable?'Required source charge or supported stoichiometric metadata missing.':capabilities.connectedRedox?'Connected aqueous redox may require the deferred analytical-redox contract.':null
  return {id:form.id,label:form.name,selectable,kind:byId.has(form.id)?'HYDRA component':'Source-coordinate convenience',provenance:m?.source??form.provenance,coefficients:m?.coefficients,charge:m?.charge,elementalMetadata:basis.every(id=>metadata[id]?.elements)?'available':'optional / unavailable',capabilities,currentLimit,confidence:'General source identity; selection is not independent validation.',searchText:componentSearchKey([form.name,...labels,...descriptions,...references].join(' ')),common:byId.get(form.id)?.role==='proton'||!byId.has(form.id)}
 })
 return freeze(candidates)
}
export function inspectAnalyticalComponentCandidate(catalog,id){return catalog.candidates.find(c=>c.id===id)??{id,selectable:false,currentLimit:'Not an authoritative input component candidate. Species products are not automatically input coordinates.'}}
export function searchAnalyticalComponents(catalog,query,{limit=20}={}){
 const key=componentSearchKey(query),tokens=String(query??'').trim().split(/\s+/).map(componentSearchKey).filter(Boolean)
 const matches=catalog.candidates.filter(c=>!key||tokens.every(t=>c.searchText.includes(t)))
 matches.sort((a,b)=>(componentSearchKey(b.label)===key)-(componentSearchKey(a.label)===key)||(!key?Number(b.common)-Number(a.common):0)||a.label.localeCompare(b.label))
 return {total:matches.length,items:matches.slice(0,Math.max(1,Math.min(50,limit)))}
}
