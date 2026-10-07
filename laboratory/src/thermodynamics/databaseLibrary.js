import { createRepository } from './repository.js'
import { repositoryFromSnapshot } from './snapshot.js'
import { createSpecies } from './schema.js'
import { userEquilibriumSpecies, userReferenceState, validateUserEquilibrium } from './userEquilibria.js'
import { sourceCharge } from './importers/spana/names.js'
import { periodicTable } from '../data/periodicTable.js'

const clean = name => name.replaceAll(/\s/g, '').replaceAll('−','-')
const symbols = new Set(periodicTable.map(e => e.symbol))
export const emptyLibrary = () => ({version:1, layers:[], disabled:[], choices:{}, preferNew:true, reviewConflicts:true})
export const repositoryData = r => ({species:r.getSpecies({includeDeprecated:true}),components:r.getComponents(),elements:r.getElements(),sources:r.getSources(),phases:r.getPhases()})
export const termsOf = s => s.metadata?.effectiveSourceReaction?.components ?? []
export function equation(s) {
 const term = t => `${Math.abs(t.coefficient)===1?'':Math.abs(t.coefficient)+' '}${t.name}`
 const terms=termsOf(s)
 if(!terms.length)return 'No explicit formation reaction'
 return `${terms.filter(t=>t.coefficient>0).map(term).join(' + ')||'∅'} ⇌ ${[s.name,...terms.filter(t=>t.coefficient<0).map(term)].join(' + ')}`
}
// Read only well-defined formula syntax. Ligand aliases, mineral names and isotopes remain unknown.
export function composition(name) {
 if(/^e\s*[-−]$/i.test(name))return {}
 let f=name.trim().replace(/\((aq|s|cr|am|c|g|l|a|vit|ppt)\)$/i,'')
 f=f.replace(/\s+\d+[+−-]$/,'').replace(/[+−-]\d+$/,'').replace(/[+−-]+$/,'').replaceAll(' ','')
 if(!f)return null
 let i=0
 const number=()=>{const m=f.slice(i).match(/^\d+/);if(!m)return 1;i+=m[0].length;return Number(m[0])}
 function group(end) {
  const atoms={}
  while(i<f.length&&f[i]!==end){
   if(f[i]==='('||f[i]==='['){const close=f[i++]==='('?')':']';const sub=group(close);if(!sub||f[i++]!==close)return null;const n=number();if(n<=0)return null;for(const [e,k] of Object.entries(sub))atoms[e]=(atoms[e]||0)+n*k}
   else {const m=f.slice(i).match(/^[A-Z][a-z]?/);if(!m||!symbols.has(m[0]))return null;i+=m[0].length;const n=number();if(n<=0)return null;atoms[m[0]]=(atoms[m[0]]||0)+n}
  }
  return atoms
 }
 const atoms=group(null)
 return atoms&&i===f.length&&Object.keys(atoms).length?atoms:null
}
export function balance(product, charge, terms) {
 const p=composition(product), totals={};let q=0,unknown=!p
 for(const t of terms){const atoms=composition(t.name);if(!atoms)unknown=true;else for(const [e,n] of Object.entries(atoms))totals[e]=(totals[e]||0)+n*t.coefficient;q+=sourceCharge(t.name)*t.coefficient}
 const residual={};if(!unknown)for(const e of new Set([...Object.keys(p),...Object.keys(totals)])){const n=(totals[e]||0)-(p[e]||0);if(Math.abs(n)>1e-8)residual[e]=n}
 return {atoms:unknown?'unknown':Object.keys(residual).length?'unbalanced':'balanced',charge:charge===null?'unknown':Math.abs(q-charge)>1e-8?'unbalanced':'balanced',residual,chargeResidual:charge===null?null:q-charge}
}
// Compare stoichiometric vectors; normalization is only for comparison, never storage.
export function reactionSignature(s) {
 if(!termsOf(s).length||!Number.isFinite(s.logK))return null
 const vector={};const key=(name,phase='aqueous')=>clean(name)+(phase==='aqueous'?'':`[${phase}]`)
 vector[key(s.name,s.phase)]=1
 for(const t of termsOf(s))vector[key(t.name)]=(vector[key(t.name)]||0)-t.coefficient
 const pairs=Object.entries(vector).filter(([,n])=>Math.abs(n)>1e-12).sort(([a],[b])=>a.localeCompare(b))
 if(!pairs.length)return null
 const factor=pairs[0][1]
 const convention=s.logKConvention?.startsWith('log10 formation constant')?'formation':s.logKConvention
 return {key:JSON.stringify([pairs.map(([k,n])=>[k,Number((n/factor).toPrecision(12))]),s.temperatureReference,s.pressureReference,convention]),logK:s.logK/factor}
}
export function libraryEntries(base, library) {
 const records=base.getSpecies({includeDeprecated:true})
 const sourceIds=new Set(records.filter(s=>s.role!=='solvent').map(s=>s.sourceDatabase))
 const name=base.getSources().filter(s=>sourceIds.has(s.id)).map(s=>s.name).join(' / ')||'Base database'
 const rows=records.map(record=>({key:`base|${record.id}`,layer:'base',name,record,order:0}))
 library.layers.forEach((layer,i)=>layer.data.species.forEach(record=>rows.push({key:`${layer.id}|${record.id}`,layer:layer.id,name:layer.name,record,order:i+1})))
 return rows.map(r=>({...r,enabled:!library.disabled.includes(r.key),signature:reactionSignature(r.record)}))
}
export function resolveLibrary(base, library) {
 const rows=libraryEntries(base,library), groups=new Map(),active=[],conflicts=[],statuses={}
 for(const row of rows){
  if(!row.enabled){statuses[row.key]='Disabled';continue}
  if(row.record.metadata?.editor?.supported===false){statuses[row.key]='Library only';continue}
  if(row.record.role==='solvent'){if(!active.some(a=>a.record.role==='solvent'))active.push(row);continue}
  const identity=JSON.stringify([clean(row.record.name),row.record.phase,row.record.charge])
  if(!groups.has(identity))groups.set(identity,[])
  groups.get(identity).push(row)
 }
 for(const [identity,group] of groups){
  if(group.every(r=>r.layer==='base')||group.every(r=>r.layer===group[0].layer&&r.record.metadata?.sourceFormat==='spana-java-binary')){active.push(...group);for(const r of group)statuses[r.key]='Active · original basis';continue}
  const baseSignatures=new Set(group.filter(r=>r.layer==='base').map(r=>r.signature?.key))
  const signatureKeys=new Set(group.map(r=>r.signature?.key))
  const incompatible=signatureKeys.size>1&&group.some(r=>r.layer!=='base'&&!baseSignatures.has(r.signature?.key))
  const buckets=new Map()
  if(incompatible)buckets.set(identity,group)
  else for(const row of group){const id=JSON.stringify([identity,row.signature?.key??row.key]);if(!buckets.has(id))buckets.set(id,[]);buckets.get(id).push(row)}
  for(const [id,alternatives] of buckets){
   if(alternatives.length===1){active.push(alternatives[0]);statuses[alternatives[0].key]='Active';continue}
   const signature=alternatives[0].signature
   const equivalent=signature&&alternatives.every(r=>r.signature?.key===signature.key)
   const duplicate=equivalent&&alternatives.every(r=>Math.abs(r.signature.logK-signature.logK)<1e-10&&JSON.stringify(r.record.temperatureModel)===JSON.stringify(alternatives[0].record.temperatureModel))
   const explicit=alternatives.find(r=>r.key===library.choices[id])
   const winner=explicit ?? (equivalent&&(!library.reviewConflicts||duplicate)?[...alternatives].sort((a,b)=>library.preferNew?b.order-a.order:a.order-b.order)[0]:null)
   conflicts.push({identity:id,rows:alternatives,kind:duplicate?'Duplicate':equivalent?'Different constants':'Different basis / conditions',winner:winner?.key??null})
   if(winner)active.push(winner)
   for(const row of alternatives)statuses[row.key]=row===winner?'Active':winner?'Alternative':'Needs choice'
  }
 }
 return {rows,active,conflicts,statuses}
}
export function compileLibrary(base, library) {
 const result=resolveLibrary(base,library),original=repositoryData(base)
 const selected=new Set(result.rows.filter(r=>r.enabled).map(r=>r.layer))
 const components=new Map(),sources=new Map(),elements=new Map()
 for(const layer of [{id:'base',data:original},...library.layers].filter(l=>selected.has(l.id)||l.data.species.length===0)){
  for(const c of layer.data.components){const prior=components.get(c.id);if(prior&&(prior.name!==c.name||prior.role!==c.role))throw Error(`Component identity conflict: ${c.id}`);components.set(c.id,prior??c)}
  for(const s of layer.data.sources)if(!sources.has(s.id))sources.set(s.id,s)
  for(const e of layer.data.elements)if(!elements.has(e.symbol))elements.set(e.symbol,e)
 }
 const species=result.active.map(r=>r.record)
 // Different unresolved alternatives are omitted, never silently passed to the solver.
 const repository=createRepository({...original,species,components:[...components.values()],sources:[...sources.values()],elements:[...elements.values()]})
 return {...result,repository}
}
export function addDatabase(base, library, snapshot, name, id) {
 const repo=snapshot.kind==='adams-spana-snapshot'?repositoryFromSnapshot(snapshot):snapshot.kind==='adams-reaction-database'&&snapshot.version===1?createRepository(snapshot.data):null
 if(!repo)throw Error('Choose a complete Spana snapshot or an exported reaction database.')
 const data=repositoryData(repo)
 const next={...library,layers:[...library.layers,{id,name,data}],disabled:[...library.disabled,...data.species.map(s=>`${id}|${s.id}`)]}
 compileLibrary(base,next)
 return next
}
export function setLayerEnabled(library,id,enabled) {
 const layer=library.layers.find(l=>l.id===id);if(!layer)throw Error('Collection not found')
 const keys=layer.data.species.filter(s=>!enabled||s.metadata?.editor?.supported!==false).map(s=>`${id}|${s.id}`)
 return {...library,disabled:enabled?library.disabled.filter(k=>!keys.includes(k)):[...new Set([...library.disabled,...keys])]}
}
export function selectDatabaseSources(base,library,ids) {
 const selected=new Set(ids),known=new Set(['base',...library.layers.map(l=>l.id)])
 if(!selected.size||[...selected].some(id=>!known.has(id)))throw Error('Select at least one loaded database.')
 return {...library,disabled:libraryEntries(base,library).filter(r=>!selected.has(r.layer)||r.record.metadata?.editor?.supported===false).map(r=>r.key)}
}
export function databaseCollections(base,library) {
 const rows=libraryEntries(base,library)
 return [{id:'base',name:rows.find(r=>r.layer==='base')?.name||'Base database'},...library.layers.map(l=>({id:l.id,name:l.name}))].map(c=>{
  const entries=rows.filter(r=>r.layer===c.id)
  return {...c,total:entries.length,enabled:entries.filter(r=>r.enabled&&r.record.metadata?.editor?.supported!==false).length}
 })
}
export function resetToSpana(base,library) {
 const isSpana=s=>s.role==='solvent'||s.metadata?.sourceFormat==='spana-java-binary'
 const layers=library.layers.map(l=>({...l,data:{...l.data,species:l.data.species.filter(isSpana)}})).filter(l=>l.data.species.some(s=>s.role!=='solvent'))
 return {...emptyLibrary(),layers,disabled:base.getSpecies().filter(s=>!isSpana(s)).map(s=>`base|${s.id}`)}
}
export function exportLibrary(base,library) {
 compileLibrary(base,library)
 return JSON.stringify({kind:'adams-database-library',version:1,base:repositoryData(base),library},null,2)
}
export function importLibrary(text) {
 const doc=JSON.parse(text)
 if(doc.kind!=='adams-database-library'||doc.version!==1||doc.library?.version!==1||!Array.isArray(doc.library.layers)||!Array.isArray(doc.library.disabled)||!doc.library.choices||typeof doc.library.preferNew!=='boolean')throw Error('Invalid database library file')
 const base=createRepository(doc.base)
 for(const layer of doc.library.layers){if(typeof layer.id!=='string'||typeof layer.name!=='string')throw Error('Invalid collection');createRepository(layer.data)}
 if(new Set(doc.library.layers.map(l=>l.id)).size!==doc.library.layers.length)throw Error('Duplicate collection identity')
 compileLibrary(base,doc.library)
 return {base,library:doc.library}
}
export function draftFromRecord(s) {
 return {name:s.name,phase:s.phase,charge:s.charge??'',logK:s.logK??'',temperature:s.temperatureReference??298.15,pressure:s.pressureReference??'',deltaH:s.temperatureModel?.parameters?.deltaH_kJ_per_mol??'',deltaCp:s.temperatureModel?.parameters?.deltaCp_J_per_mol_K??'',citation:s.citation??'',notes:s.notes?.join('\n')??'',terms:structuredClone(termsOf(s))}
}
export function createEditedRecord(draft,repository,id) {
 const numeric=(v,label,optional=false)=>{if(v===''||v==null){if(optional)return null;throw Error(`${label} is required`)}const n=Number(v);if(!Number.isFinite(n))throw Error(`${label} must be finite`);return n}
 const terms=draft.terms.filter(t=>t.name.trim()).map(t=>({name:t.name.trim(),coefficient:numeric(t.coefficient,'Coefficient')}))
 if(!draft.name.trim()||!terms.length||terms.some(t=>!t.coefficient)||new Set(terms.map(t=>t.name)).size!==terms.length)throw Error('Enter a product and distinct, nonzero reaction terms.')
 const charge=numeric(draft.charge,'Charge',true),logK=numeric(draft.logK,'log K'),temperature=numeric(draft.temperature,'Temperature'),pressure=numeric(draft.pressure,'Pressure',true)
 if(charge!==null&&!Number.isInteger(charge))throw Error('Charge must be an integer')
 if(temperature<=0||pressure!==null&&pressure<=0)throw Error('Temperature / pressure must be positive')
 const checked=balance(draft.name,charge,terms)
 if(checked.atoms==='unbalanced'||checked.charge==='unbalanced')throw Error('Reaction is unbalanced. Correct the atom / charge residuals before saving.')
 const now=new Date().toISOString(),components=repository.getComponents()
 const raw={schemaVersion:1,id,productId:draft.name.trim(),displayName:draft.name.trim(),phase:draft.phase,charge,terms:terms.map(t=>({componentId:components.find(c=>c.name===t.name)?.id??t.name,coefficient:t.coefficient})),logK,temperatureK:temperature,pressureBar:pressure,referenceState:userReferenceState,sourceType:'user-defined',citation:draft.citation.trim()||null,notes:draft.notes.trim()||null,createdAt:now,modifiedAt:now}
 const deltaH=numeric(draft.deltaH,'ΔH',true),deltaCp=numeric(draft.deltaCp,'ΔCp',true)
 const withoutProduct={...repository,getSpeciesIdentities:()=>[],getComponents:()=>components.filter(c=>clean(c.name)!==clean(raw.productId))}
 const diagnostics=validateUserEquilibrium(raw,withoutProduct)
 const supported=diagnostics.length===0&&checked.atoms==='balanced'&&checked.charge==='balanced'
 let record
 if(supported)record=userEquilibriumSpecies(raw,repository)
 else record=createSpecies({id,name:raw.productId,displayName:raw.productId,formula:raw.productId,phase:draft.phase,charge,elementalComposition:composition(raw.productId),logK,temperatureReference:temperature,pressureReference:pressure,logKConvention:'log10 formation constant for one named product from explicit signed source components',source:'Personal reaction library',sourceDatabase:'user-defined',sourceRecordId:id,citation:raw.citation,notes:raw.notes?[raw.notes]:[],qualityFlags:['user-defined-not-verified'],metadata:{sourceFormat:'database-editor-v1',effectiveSourceReaction:{product:raw.productId,components:terms}},provenance:{kind:'user-defined',sourceDatabase:'user-defined',sourceRecordId:id,original:{speciesName:raw.productId,reaction:terms,logK,citation:raw.citation},comments:[],qualityFlags:['user-defined-not-verified']}})
 record.temperatureModel=deltaH===null&&deltaCp===null?null:{type:'spana-deltaH-deltaCp',parameters:{deltaH_kJ_per_mol:deltaH,deltaCp_J_per_mol_K:deltaCp}}
 record.metadata.editor={balance:checked,supported,reason:supported?'Restricted formation solver at 298.15 K. Temperature parameters retained; no new temperature correction is enabled.':`Stored for review; not calculation-ready. ${diagnostics.map(d=>d.message).join(' ')} ${checked.atoms==='unknown'?'Atom balance cannot be verified.':''}`}
 return record
}
export function savePersonalRecord(base,library,record,layerId='personal') {
 const existing=library.layers.find(l=>l.id===layerId)
 const data=existing?structuredClone(existing.data):{...repositoryData(compileLibrary(base,library).repository),species:[],sources:[{id:'user-defined',name:'Personal reactions (unverified)'}]}
 data.species=[...data.species.filter(s=>s.id!==record.id),record]
 if(!data.sources.some(s=>s.id==='user-defined'))data.sources.push({id:'user-defined',name:'Personal reactions (unverified)'})
 createRepository(data)
 const layer={id:layerId,name:existing?.name??'Personal reactions',data}
 const next={...library,layers:[...library.layers.filter(l=>l.id!==layerId),layer],disabled:[...new Set([...library.disabled,`${layerId}|${record.id}`])]}
 compileLibrary(base,next);return next
}
