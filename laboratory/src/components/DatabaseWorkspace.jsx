import {useMemo,useRef,useState} from 'react'
import {databaseCollections,selectDatabaseSources,libraryEntries,resolveLibrary,equation,balance,addDatabase,setLayerEnabled,resetToSpana,exportLibrary,importLibrary,repositoryData,draftFromRecord,createEditedRecord,savePersonalRecord} from '../thermodynamics/databaseLibrary.js'
import {sourceCharge} from '../thermodynamics/importers/spana/names.js'
import {periodicTable} from '../data/periodicTable.js'
import './DatabaseWorkspace.css'
import DatabaseCandidates from './DatabaseCandidates.jsx'
const fresh=()=>({name:'',phase:'aqueous',charge:'',logK:'',temperature:298.15,pressure:'',deltaH:'',deltaCp:'',citation:'',notes:'',terms:Array.from({length:6},()=>({name:'',coefficient:1}))})
const newId=()=>crypto.randomUUID()
function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export default function DatabaseWorkspace({base,library,onChange,onReset,onRestore,repository}) {
 const [query,setQuery]=useState(''),[phase,setPhase]=useState('all'),[showDisabled,setShowDisabled]=useState(true),[onlyAdded,setOnlyAdded]=useState(false),[page,setPage]=useState(0)
 const [draft,setDraft]=useState(null),[editing,setEditing]=useState(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[saved,setSaved]=useState(null),[selected,setSelected]=useState(null)
 const [confirmReset,setConfirmReset]=useState(false),[component,setComponent]=useState(null)
 const [ionQuery,setIonQuery]=useState('')
 const fileHandle=useRef(null)
 const result=useMemo(()=>resolveLibrary(base,library),[base,library])
 const collections=useMemo(()=>databaseCollections(base,library),[base,library])
 const activeCollections=collections.filter(c=>c.enabled>0)
 const choices=useMemo(()=>{
  const byName=new Map()
  for(const c of repository.getComponents())byName.set(c.name,{name:c.name,basis:true,elements:c.associations.map(a=>a.element)})
  for(const row of libraryEntries(base,library))if(!byName.has(row.record.name))byName.set(row.record.name,{name:row.record.name,basis:false,elements:row.record.discoveryElements??Object.keys(row.record.elementalComposition??{})})
  return [...byName.values()].map(c=>({...c,search:[c.name,...c.elements.flatMap(s=>[s,periodicTable.find(e=>e.symbol===s)?.name??''])].join(' ').toLowerCase()})).sort((a,b)=>a.name.localeCompare(b.name))
 },[base,library,repository])
 const filtered=useMemo(()=>result.rows.filter(r=>(showDisabled||r.enabled)&&(!onlyAdded||r.layer!=='base')&&(phase==='all'||r.record.phase===phase)&&[r.record.name,r.record.displayName,equation(r.record),r.record.citation,r.name].join(' ').toLowerCase().includes(query.toLowerCase())),[result,query,phase,showDisabled,onlyAdded])
 const lastPage=Math.max(0,Math.ceil(filtered.length/60)-1),current=Math.min(page,lastPage)
 const patch=(key,value)=>setDraft({...draft,[key]:value})
 const attempt=fn=>{try{fn()}catch(e){setMessage(e.message)}}
 const commit=next=>{onChange(next);setMessage('Library updated. Affected calculations must be run again. Save the library to keep these changes.')}
 const toggle=row=>{
  if(!row.enabled&&row.record.metadata?.editor?.supported===false){setMessage(row.record.metadata.editor.reason);return}
  attempt(()=>commit({...library,disabled:row.enabled?[...library.disabled,row.key]:library.disabled.filter(k=>k!==row.key)}))
 }
 const edit=(row,duplicate=false)=>{const loaded=draftFromRecord(row.record);while(loaded.terms.length<6)loaded.terms.push({name:'',coefficient:1});setDraft(loaded);setEditing(!duplicate&&row.layer!=='base'&&row.record.provenance.kind==='user-defined'?{id:row.record.id,layer:row.layer}:null);setMessage(row.layer==='base'?'Changes create a personal alternative; the original remains intact.':'');document.getElementById('reaction-editor')?.scrollIntoView()}
 const saveRecord=()=>attempt(()=>{const record=createEditedRecord(draft,repository,editing?.id??`user:${newId()}`);commit(savePersonalRecord(base,library,record,editing?.layer??'personal'));setDraft(null);setEditing(null);setMessage('Reaction saved, initially disabled. Review it and enable it when ready.')})
 async function openFile(event){const file=event.target.files?.[0];event.target.value='';if(!file)return;setBusy(true);try{
  if(file.size>100*1024*1024)throw Error('File exceeds 100 MB.')
  const text=await file.text(),doc=JSON.parse(text)
  if(doc.kind==='adams-database-library'){const restored=importLibrary(text);onRestore(restored.base,restored.library);setSaved(restored.library);fileHandle.current=null;setMessage('Saved library opened, including enabled states and conflict choices.')}
  else {const next=addDatabase(base,library,doc,file.name,newId());commit(next);setMessage(`${next.layers.at(-1).data.species.length} records added, initially disabled. Review the collection before enabling it.`)}
 }catch(e){setMessage(`Database unchanged: ${e.message}`)}finally{setBusy(false)}}
 async function save(as=false){try{
  const text=exportLibrary(base,library)
  if(window.showSaveFilePicker){if(as||!fileHandle.current)fileHandle.current=await window.showSaveFilePicker({suggestedName:'Adams-Laboratory-Library.json',types:[{description:'Database library',accept:{'application/json':['.json']}}]});const stream=await fileHandle.current.createWritable();await stream.write(text);await stream.close()}
  else download(text,'Adams-Laboratory-Library.json')
  setSaved(library);setMessage('Library saved with original records, additions, disabled states and conflict choices.')
 }catch(e){if(e.name!=='AbortError')setMessage(`Save failed: ${e.message}`)}}
 const checked=draft?balance(draft.name,draft.charge===''?null:Number(draft.charge),draft.terms.filter(t=>t.name).map(t=>({...t,coefficient:Number(t.coefficient)}))):null
 const rowView=row=><><strong>{row.record.name}</strong> · {row.record.phase}<br/>{equation(row.record)}<br/>log K: {row.record.logK??'—'} · {row.record.temperatureReference??'?'} K · {row.record.pressureReference??'?'} bar<br/><small>{row.name} · {row.record.citation||'No reference supplied'}</small></>
 return <main className="database-workspace">
  <section className="card db-source-selection" aria-label="Active databases">
   <h2>Databases used for calculations</h2>
   <p><strong>{activeCollections.map(c=>c.name).join(' + ')||'No active database'}</strong></p>
   <label>Switch to one database<select aria-label="Switch database" value={activeCollections.length===1?activeCollections[0].id:''} onChange={e=>e.target.value&&attempt(()=>commit(selectDatabaseSources(base,library,[e.target.value])))}><option value="" disabled>Combined / no selection</option>{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <p className="hint">To combine loaded databases, select more than one below. Switching enables supported records in your selection. Original records and alternatives remain intact.</p>
   {collections.map(c=><label className="db-source-row" key={c.id}><input type="checkbox" checked={c.enabled>0} onChange={e=>attempt(()=>commit(selectDatabaseSources(base,library,e.target.checked?[...activeCollections.map(a=>a.id),c.id]:activeCollections.filter(a=>a.id!==c.id).map(a=>a.id))))}/><span>{c.name}</span><small>{c.enabled} enabled / {c.total} records</small></label>)}
   <p>{result.active.length} selected records · {result.conflicts.filter(c=>!c.winner).length} unresolved conflicts. Record selection does not certify compatibility of activity models or reference states.</p>
  </section>
  <section className="card"><div className="db-heading"><div><h2>Database</h2><p>Browse reactions, keep source alternatives, and choose what calculations may use.</p></div><span className="badge">{saved===library?'Saved':'Save changes to a file'}</span></div>
   <div className="db-toolbar"><label className="db-file">Open / add database<input aria-label="Open or add database" type="file" accept=".json" disabled={busy} onChange={openFile}/></label><button onClick={()=>save()}>Save</button><button onClick={()=>save(true)}>Save as…</button><button onClick={()=>attempt(()=>download(JSON.stringify({kind:'adams-reaction-database',version:1,data:repositoryData(repository)},null,2),'Active-Reactions.json'))}>Export active database</button><button onClick={()=>{setDraft(fresh());setEditing(null)}}>Add reaction</button><button onClick={()=>setComponent({name:'',elements:'',citation:''})}>Add component</button></div>
   <p className="hint">Open a reaction database to add it alongside existing records. Opening a saved library restores that library. New entries start disabled. Save preserves the full library; Export active database contains only the current calculation selection.</p>
   <label className="db-check"><input type="checkbox" checked={!!library.reviewConflicts} onChange={e=>attempt(()=>commit({...library,reviewConflicts:e.target.checked}))}/>Require an explicit choice when constants disagree</label>
   <label className="db-check"><input type="checkbox" disabled={!!library.reviewConflicts} checked={library.preferNew} onChange={e=>attempt(()=>commit({...library,preferNew:e.target.checked}))}/>Prefer new data for equivalent reactions (explicit choices take priority)</label>
   <p role="status" className="notice">{busy?'Reading and validating database…':message||`${result.rows.length} records · ${result.active.length} active · ${result.conflicts.length} duplicate / conflict groups`}</p>
   <details><summary>Loaded collections and reset</summary><p>Base: {base.getSpeciesIdentities().length} records. Originals are preserved when you edit a reaction.</p>{library.layers.map(l=><div className="db-collection" key={l.id}><strong>{l.name}</strong> · {l.data.species.length} records<button onClick={()=>attempt(()=>commit(setLayerEnabled(library,l.id,true)))}>Enable collection</button><button onClick={()=>attempt(()=>commit(setLayerEnabled(library,l.id,false)))}>Disable collection</button><button onClick={()=>attempt(()=>commit({...library,layers:library.layers.filter(p=>p.id!==l.id)}))}>Remove collection</button></div>)}
    <button className="db-danger" onClick={()=>setConfirmReset(true)}>Remove all non-Spana additions</button>{confirmReset&&<div className="notice">Remove personal and other non-Spana records? Spana originals remain. Your saved files are untouched.<button onClick={()=>attempt(()=>{onReset(resetToSpana(base,library));setConfirmReset(false);setDraft(null)})}>Remove additions</button><button onClick={()=>setConfirmReset(false)}>Cancel</button></div>}
   </details>
  </section>
  <DatabaseCandidates/>
  {component&&<section className="card"><h2>New component</h2><label>Name / formula<input value={component.name} onChange={e=>setComponent({...component,name:e.target.value})}/></label><label>Element symbols (space-separated)<input value={component.elements} onChange={e=>setComponent({...component,elements:e.target.value})}/></label><label>Reference<input value={component.citation} onChange={e=>setComponent({...component,citation:e.target.value})}/></label><button onClick={()=>attempt(()=>{
   const name=component.name.trim(),els=component.elements.trim().split(/\s+/)
   if(!name||choices.some(c=>c.name===name)||!els.length||els.some(e=>!periodicTable.some(p=>p.symbol===e))||['H+','e-','H2O'].includes(name))throw Error('Use a unique ordinary component and valid element symbols. Existing proton/electron/water identities should be reused.')
   const data={...repositoryData(base),species:[],components:[{id:`user-component:${newId()}`,name,role:'basis-choice',associations:els.map(element=>({element,description:'User-entered association'})),provenance:{kind:'user-defined',citation:component.citation}}]}
   for(const symbol of els)if(!data.elements.some(e=>e.symbol===symbol))data.elements.push({symbol,name:periodicTable.find(e=>e.symbol===symbol).name})
   commit({...library,layers:[...library.layers,{id:newId(),name:`Component: ${name}`,data}]});setComponent(null)
  })}>Save component</button><button onClick={()=>setComponent(null)}>Cancel</button></section>}
  <section id="reaction-editor" hidden={!draft} className="card spana-editor">
   {draft&&<><h2>{editing?'Edit reaction:':'New reaction:'}</h2>
    <details className="spana-search"><summary>Search ions / elements</summary><label>Filter species<input type="search" placeholder="Ce, cerium, carbonate…" value={ionQuery} onChange={e=>setIonQuery(e.target.value)}/></label></details>
    <div className="spana-terms">{draft.terms.map((term,i)=><div className="spana-term" key={i}>
     <input aria-label={`Coefficient ${i+1}`} type="number" step="any" value={term.name?term.coefficient:term.coefficient===1?'':term.coefficient} onChange={e=>patch('terms',draft.terms.map((t,j)=>j===i?{...t,coefficient:e.target.value}:t))}/>
     <IonPicker index={i} value={term.name} choices={choices.filter(c=>c.search.includes(ionQuery.toLowerCase()))} onChange={name=>patch('terms',draft.terms.map((t,j)=>j===i?{...t,name,coefficient:t.coefficient||1}:t))}/><span aria-hidden="true">+</span>
    </div>)}</div>
    <div className="spana-product"><span aria-hidden="true">⇌</span><input aria-label="Product formula" placeholder="Product formula" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value,charge:sourceCharge(e.target.value)??''})}/></div>
    <div className="spana-balance" role="status" aria-live="polite" data-invalid={checked.atoms==='unbalanced'||checked.charge==='unbalanced'}>
     <p>{checked.charge==='balanced'?'Reaction is charge balanced':checked.charge==='unbalanced'?'Reaction is NOT charge balanced':'Charge balance not yet verified'}</p>
     <p>{checked.atoms==='balanced'?'Atoms are balanced':checked.atoms==='unbalanced'?'Atoms are NOT balanced':'Atom balance not yet verified'}</p>
     {checked.atoms==='unbalanced'&&<small>Atom residual: {JSON.stringify(checked.residual)}</small>}
    </div>
    <div className="spana-constants">
     <label htmlFor="reaction-logk">log K° ({Number(draft.temperature)===298.15?'25°C':`${draft.temperature} K`}) =</label><input id="reaction-logk" type="number" step="any" value={draft.logK} onChange={e=>patch('logK',e.target.value)}/><span/>
     <label htmlFor="reaction-dh">ΔH° =</label><input id="reaction-dh" type="number" step="any" value={draft.deltaH} onChange={e=>patch('deltaH',e.target.value)}/><span>kJ/mol</span>
     <label htmlFor="reaction-dcp">ΔCₚ° =</label><input id="reaction-dcp" type="number" step="any" value={draft.deltaCp} onChange={e=>patch('deltaCp',e.target.value)}/><span>J/(K mol)</span>
    </div>
    <details className="spana-options"><summary>Phase, charge and reference conditions · {draft.phase}</summary><div className="db-fields">
     <label>Phase<select value={draft.phase} onChange={e=>patch('phase',e.target.value)}>{['aqueous','solid','gas','liquid'].map(v=><option key={v}>{v}</option>)}</select></label>
     <label>Charge (blank = unknown)<input type="number" step="1" value={draft.charge} onChange={e=>patch('charge',e.target.value)}/></label>
     <label>Reference temperature / K<input type="number" step="any" value={draft.temperature} onChange={e=>patch('temperature',e.target.value)}/></label>
     <label>Reference pressure / bar<input type="number" step="any" value={draft.pressure} onChange={e=>patch('pressure',e.target.value)}/></label>
    </div><button onClick={()=>patch('terms',[...draft.terms,{name:'',coefficient:1},{name:'',coefficient:1}])}>Add two more terms</button><p>Signed coefficients form one unit of product. Negative coefficients put terms on the product side. Blank rows are ignored. Temperature parameters are stored; the current custom solver uses its supported 298.15 K reference state.</p></details>
    <div className="spana-notes"><label htmlFor="reaction-comment">Comment:</label><input id="reaction-comment" value={draft.notes} onChange={e=>patch('notes',e.target.value)}/><label htmlFor="reaction-reference">Reference(s):</label><input id="reaction-reference" value={draft.citation} onChange={e=>patch('citation',e.target.value)}/></div>
    <div className="spana-actions"><button onClick={()=>setDraft(null)}>Cancel</button><button disabled={!draft.name||draft.logK===''||checked.atoms==='unbalanced'||checked.charge==='unbalanced'} onClick={saveRecord}>Save reaction</button></div>
   </>}
  </section>
  <details className="card" open={result.conflicts.some(c=>!c.winner)}><summary>Conflicts and duplicate reactions ({result.conflicts.length})</summary><p>Identical duplicate reactions are deduplicated. Different constants require review unless automatic preference is enabled. Different bases or conditions always require a choice. Unresolved alternatives block calculations until resolved or disabled.</p>{result.conflicts.map(c=><section className="db-conflict" key={c.identity}><h3>{c.rows[0].record.name} · {c.kind}</h3><select aria-label={`Choose version of ${c.rows[0].record.name}`} value={library.choices[c.identity]??''} onChange={e=>attempt(()=>commit({...library,choices:{...library.choices,[c.identity]:e.target.value}}))}><option value="">Use preference / unresolved if incompatible</option>{c.rows.map(r=><option key={r.key} value={r.key}>{r.name} · log K {r.record.logK} · {r.record.temperatureReference} K</option>)}</select><div className="db-alternatives">{c.rows.map(r=><div key={r.key}>{rowView(r)}<p>{c.winner===r.key?'Selected':'Alternative'} <button onClick={()=>toggle(r)}>Disable</button></p></div>)}</div></section>)}</details>
  <section className="card"><div className="db-toolbar"><label>Search reactions / references<input type="search" placeholder="Formula, component or reference" value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}/></label><label>Phase<select value={phase} onChange={e=>{setPhase(e.target.value);setPage(0)}}>{['all','aqueous','solid','gas','liquid'].map(v=><option key={v}>{v}</option>)}</select></label><label className="db-check"><input type="checkbox" checked={showDisabled} onChange={e=>setShowDisabled(e.target.checked)}/>Show disabled</label><label className="db-check"><input type="checkbox" checked={onlyAdded} onChange={e=>setOnlyAdded(e.target.checked)}/>Added records only</label></div>
   <p>{filtered.length} matching records · Page {current+1} / {lastPage+1}</p><div className="db-table"><table><thead><tr><th>Enabled</th><th>Reaction</th><th>log K</th><th>T / K</th><th>Source / status</th><th>Actions</th></tr></thead><tbody>{filtered.slice(current*60,current*60+60).map(r=><tr key={r.key}><td><input aria-label={`Enable ${r.record.name} from ${r.name}`} type="checkbox" checked={r.enabled} disabled={r.record.role==='solvent'} onChange={()=>toggle(r)}/></td><td><strong>{r.record.name} <small>({r.record.phase})</small></strong><br/>{r.record.displayName&&r.record.displayName!==r.record.name&&<small>{r.record.displayName}<br/></small>}{equation(r.record)}</td><td>{r.record.logK??'—'}</td><td>{r.record.temperatureReference??'—'}</td><td>{r.name}<br/><small>{r.record.metadata?.editor?.supported===false?'Library only':result.statuses[r.key]??'Identity'}</small></td><td><button onClick={()=>edit(r)}>Edit</button><button onClick={()=>edit(r,true)}>Duplicate</button><button onClick={()=>setSelected(r)}>Details</button></td></tr>)}</tbody></table></div><button disabled={current===0} onClick={()=>setPage(current-1)}>Previous</button><button disabled={current===lastPage} onClick={()=>setPage(current+1)}>Next</button>
  </section>
  {selected&&<section className="card"><h2>Record details</h2>{rowView(selected)}<p>{selected.record.logKConvention}</p><p>{selected.record.metadata?.editor?.reason}</p><details><summary>Original record and provenance</summary><pre>{JSON.stringify(selected.record,null,2)}</pre></details><button onClick={()=>setSelected(null)}>Close details</button></section>}
 </main>
}
function IonPicker({index,value,choices,onChange}) {
 return <select aria-label={`Reaction component ${index+1}`} value={value} onChange={e=>onChange(e.target.value)}><option value=""></option>{value&&!choices.some(c=>c.name===value)&&<option value={value}>{value}</option>}{choices.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select>
}
