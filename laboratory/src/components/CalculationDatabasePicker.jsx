import {useEffect,useMemo,useRef,useState} from 'react'
import {addDatabase,databaseCollections,resolveLibrary,selectDatabaseSources,repositoryData} from '../thermodynamics/databaseLibrary.js'
import {importPsiNagra,PSI_ID,PSI_NAME,PSI_ORGANIC_ID,PSI_ORGANIC_NAME} from '../thermodynamics/importers/psinagra/index.js'
import {withUraniumLiterature,URANIUM_LITERATURE_ID,SPANA_URANIUM_ID} from '../thermodynamics/uraniumLiterature.js'
import './CalculationDatabasePicker.css'
import UraniumReactionTrials from './UraniumReactionTrials.jsx'
import {combineSpanaPreferred,COMBINED_ID,COMBINED_NAME} from '../thermodynamics/spanaPreferred.js'

export default function CalculationDatabasePicker({base,library,onChange,onReview}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[report,setReport]=useState(null)
 const dialog=useRef(null),file=useRef(null)
 const collections=useMemo(()=>databaseCollections(base,library),[base,library])
 const active=collections.filter(c=>c.enabled),psi=active.some(c=>[PSI_ID,PSI_ORGANIC_ID].includes(c.id))
 const [includeOrganic,setIncludeOrganic]=useState(false)
 const [combinedReport,setCombinedReport]=useState(null)
 async function combinePreferred(){setBusy(true);setError('');try{
  let psi=library.layers.find(l=>l.id===PSI_ORGANIC_ID)??library.layers.find(l=>l.id===PSI_ID)
  if(!psi){const response=await fetch(`${import.meta.env.BASE_URL}data/psinagra-local.dat`);if(!response.ok||response.headers.get('content-type')?.includes('text/html'))throw Error('Import the official PSI/Nagra file first using the control below.');psi=await importPsiNagra(await response.arrayBuffer())}
  const spana=library.layers.find(l=>l.id===SPANA_URANIUM_ID)?.data??withUraniumLiterature({kind:'adams-reaction-database',version:1,data:repositoryData(base)}).data
  const doc=combineSpanaPreferred(spana,psi.data)
  const clean={...library,layers:library.layers.filter(l=>l.id!==COMBINED_ID),disabled:library.disabled.filter(k=>!k.startsWith(COMBINED_ID+'|'))}
  onChange(selectDatabaseSources(base,addDatabase(base,clean,doc,COMBINED_NAME,COMBINED_ID),[COMBINED_ID]));setCombinedReport(doc.report)
 }catch(e){setError(e.message)}finally{setBusy(false)}}
 const literatureLayer=library.layers.find(l=>active.some(c=>c.id===l.id)&&l.data.sources.some(s=>s.id===URANIUM_LITERATURE_ID))
 const trials=literatureLayer?.data.species.filter(s=>s.metadata?.literature?.trialFormationLogK!==undefined)??[]
 useEffect(()=>{if(open)dialog.current.showModal()},[open])
 function choose(ids){try{onChange(selectDatabaseSources(base,library,ids));setError('')}catch(e){setError(e.message)}}
 function loadSpana(){try{
  const doc=withUraniumLiterature({kind:'adams-reaction-database',version:1,data:repositoryData(base)})
  onChange(selectDatabaseSources(base,addDatabase(base,library,doc,'Spana + uranium literature',SPANA_URANIUM_ID),[SPANA_URANIUM_ID]));setError('')
 }catch(e){setError(e.message)}}
 async function load(bytes,organic=includeOrganic){
  const id=organic?PSI_ORGANIC_ID:PSI_ID,name=organic?PSI_ORGANIC_NAME:PSI_NAME
  const doc=withUraniumLiterature(await importPsiNagra(bytes,{includeOrganic:organic}))
  const next=library.layers.some(l=>l.id===id)?library:addDatabase(base,library,doc,`${name} + uranium literature`,id)
  onChange(selectDatabaseSources(base,next,[id]));setReport(doc.report)
 }
 async function local(organic=false){setBusy(true);setError('');try{
  const response=await fetch(`${import.meta.env.BASE_URL}data/psinagra-local.dat`)
  if(!response.ok||response.headers.get('content-type')?.includes('text/html'))throw Error('Select the official psinagra2020_v2-1.dat file below. PSI/Nagra is not bundled with this website.')
  await load(await response.arrayBuffer(),organic)
 }catch(e){setError(e.message)}finally{setBusy(false)}}
 const conflicts=open?resolveLibrary(base,library).conflicts.filter(c=>!c.winner).length:0
 return <>
  <div className="calculation-database-bar">
   <label htmlFor="active-calculation-database">Database</label>
   <select id="active-calculation-database" aria-label="Active calculation and Wet Lab database" value={active.length===1?active[0].id:''} onChange={e=>choose([e.target.value])}>
    {active.length!==1&&<option value="" disabled>{active.length} databases combined</option>}
    {collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
   </select>
   <button onClick={()=>setOpen(true)} aria-label="Choose calculation database">Combine / manage databases</button>
   <span>Shared by Calculation and Wet Lab</span>
  </div>
  {psi&&<p className="database-scope-note">PSI/Nagra · ideal approximation at 25 °C and 1 bar. Acid/base Wet Lab supported; physical/redox Wet Lab and SIT corrections are not enabled.</p>}
  {!literatureLayer&&active.length===1&&active[0].id==='base'&&<div className="database-scope-note"><button onClick={loadSpana}>Enable AUC · provisional estimate</button> <span>Loads Spana + uranium reactions for Calculation and Wet Lab.</span></div>}
  {literatureLayer&&<div className="database-scope-note"><button onClick={()=>setOpen(true)}>Test AUC / ADU / peroxide / UF₆</button> <span className="experimental-warning">Literature extension{trials.length?` · ${trials.length} unverified trial constants active`:' · AUC uses a provisional estimate · ADU and metastudtite need trial constants'}</span></div>}
  {open&&<dialog className="calculation-database-dialog" ref={dialog} onCancel={()=>setOpen(false)}>
   <header><h2>Choose database</h2><button aria-label="Close database selector" onClick={()=>setOpen(false)}>Close</button></header>
   <p>Applies to Calculation and Wet Lab. Changing the source clears affected results so they can be recalculated.</p>
   <button disabled={busy} onClick={combinePreferred}>{busy?'Preparing database…':'Combine · prefer Spana'}</button>
   <p>Retains Spana and its uranium extension, adds eligible PSI/Nagra-only reactions, and converts their equations to the Spana basis. No averaging of constants. Ideal, 25 °C; supplementary chemistry is provisional. Rebuild this option after changing either source.</p>
   {combinedReport&&<details><summary>Combination: {combinedReport.added} added · {combinedReport.preferred} Spana matches retained · {combinedReport.omitted.length} omitted</summary><p>Unmapped or ambiguous coordinates remain excluded.</p><ul>{combinedReport.omitted.map((r,i)=><li key={i}>{r.name}: {r.reason}</li>)}</ul></details>}
   <div className="database-choices">{collections.map(c=><div key={c.id}><div><strong>{c.name}</strong><small>{c.total.toLocaleString()} records{c.enabled?' · in use':''}</small></div><div className="database-choice-actions"><button disabled={busy||active.length===1&&!!c.enabled} onClick={()=>choose([c.id])}>Use only this</button>{c.enabled?<button disabled={busy||active.length===1} onClick={()=>choose(active.filter(a=>a.id!==c.id).map(a=>a.id))}>Remove from mix</button>:<button disabled={busy} onClick={()=>choose([...active.map(a=>a.id),c.id])}>Combine</button>}</div></div>)}</div>
   <p>Combining keeps the original collections separate. Use only this returns to one source; Remove from mix excludes a source without deleting it. Different constants or reaction bases require an explicit choice.</p>
   <button onClick={()=>{setOpen(false);onReview()}}>Review reactions and conflicts{conflicts?` (${conflicts})`:''}</button>
   {active.length>1&&<p className="experimental-warning">Mixed-source Wet Lab chemistry is not yet supported. Select Use only this for a supported Wet Lab collection. Calculation requires resolved conflicts and compatible reaction bases.</p>}
   {!collections.some(c=>c.id===PSI_ID)&&<button disabled={busy} onClick={()=>local(false)}>{busy?'Importing PSI/Nagra…':'Load PSI/Nagra 2020'}</button>}
   {!collections.some(c=>c.id===PSI_ORGANIC_ID)&&<button disabled={busy} onClick={()=>local(true)}>Load PSI/Nagra + organic complexes</button>}
   <p>Organic collection: citrate (C₆H₅O₇³⁻), oxalate (C₂O₄²⁻) and EDTA (C₁₀H₁₂N₂O₈⁴⁻), including source actinide complexes and competing ions. CDTA and isosaccharinate are not included. Spana already contains uranyl acetate; search for UO2(CH3COO).</p>
   {!collections.some(c=>c.id===SPANA_URANIUM_ID)&&<button disabled={busy} onClick={loadSpana}>Load Spana + uranium reactions</button>}
   {literatureLayer&&<UraniumReactionTrials key={literatureLayer.id} layer={literatureLayer} library={library} onChange={onChange}/>}
   <details><summary>Import the official PSI/Nagra file</summary><p>Download the PHREEQC v2-1 release from <a href="https://www.psi.ch/en/les/database" target="_blank" rel="noreferrer">PSI</a>, unzip it, and select <code>psinagra2020_v2-1.dat</code>. Choose whether to include citrate, oxalate and EDTA below. Isosaccharinate and methane remain excluded. Imports stay in this session; use Database → Save to keep a copy.</p><label><input type="checkbox" checked={includeOrganic} onChange={e=>setIncludeOrganic(e.target.checked)}/> Include organic complexes</label><input ref={file} type="file" accept=".dat" aria-label="Import PSI/Nagra core database" disabled={busy} onChange={async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;setBusy(true);setError('');try{if(f.size>10*1024*1024)throw Error('Expected the core .dat file, smaller than 10 MB.');await load(await f.arrayBuffer())}catch(e){setError(e.message)}finally{setBusy(false)}}}/></details>

   {report&&<p role="status">Imported {report.imported} equilibrium records and {report.identities} source identities. Added {report.literatureReactions??0} literature reactions and {report.referenceOnly??0} reference-only entries. Excluded {report.excludedOrganic} organic reactions; {report.rejected.length} unsupported formulas omitted.</p>}
   {conflicts>0&&<p role="alert">{conflicts} conflicts must be resolved before calculating.</p>}
   {error&&<p role="alert">{error}</p>}
   <footer><button onClick={()=>setOpen(false)}>Return to experiment</button></footer>
  </dialog>}
 </>
}
