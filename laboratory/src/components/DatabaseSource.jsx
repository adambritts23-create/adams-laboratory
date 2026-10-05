import { useState, useEffect, useRef } from 'react'
import { loadSnapshotFile,databaseStatus } from './databaseLoading.js'
import { loadDefaultSource } from './defaultSource.js'
export default function DatabaseSource({active,onLoad,onDemo}){
  const [error,setError]=useState(null),[stage,setStage]=useState(null)
  const generation=useRef(0), receive=useRef(onLoad)
  useEffect(()=>{receive.current=onLoad},[onLoad])
  useEffect(()=>{
    const token=++generation.current
    let mounted=true
    const current=()=>mounted&&token===generation.current
    loadDefaultSource(value=>{if(current())setStage(value)}).then(value=>{if(current()&&value)receive.current(value)})
      .catch(failure=>{if(current())setError(failure.message)})
      .finally(()=>{if(current())setStage(null)})
    return ()=>{mounted=false}
  },[])
  async function load(event){
    const input=event.target,file=input.files?.[0];if(!file)return
    const token=++generation.current
    setError(null)
    try{const value=await loadSnapshotFile(file,setStage);if(token===generation.current)onLoad({...value,origin:'manual'})}catch(failure){setError(`Database not changed: ${failure.message.slice(0,1200)}`)}finally{setStage(null);input.value=''}
  }
  return <details className="database-disclosure" open={!active||!!stage||!!error}>
    <summary><span className={active?'database-ready':''} role="status">{databaseStatus(active,stage)}</span>{active&&<span className="database-name"> · {active.name}</span>}</summary>
    <section className="database-source" aria-label="Database source">
      {!active&&!stage&&<p>Choose a thermodynamic source to explore database-backed chemistry, or define your own components and reactions below.</p>}
      <label>Replace base database<input type="file" accept=".json,application/json" disabled={!!stage} onChange={load}/></label>
      {active&&<button className="secondary" onClick={onDemo}>Use demo database</button>}
      <small>{active?.origin==='default'?'Using bundled/default database.':active?'Using manually supplied database.':'Default database loads automatically.'} Replace base database starts a new draft. To add reactions alongside the current source, use the Database tab. Save your library before replacing the base.</small>
      {active?.origin==='default'&&<p>Thermodynamic records imported from the Spana/MEDUSA/DataBase ecosystem associated with Ignasi Puigdomenech. Original record citations and source fingerprints are retained; these data were not authored by Adam.</p>}
      {error&&<p role="alert">{error}</p>}
      {active&&<details><summary>Import report and source fingerprints</summary><p>{active.recordCount} application species records: {active.importedRecordCount} imported records; {active.solventRecordCount} solvent identities. {active.componentCount} component forms. Source redistribution permission is not established by loading a file.</p><pre>{JSON.stringify({summary:active.summary,inputManifest:active.inputManifest,loadedAt:active.loadedAt,timings:active.timings},null,2)}</pre><p>{active.diagnostics.length} import diagnostics retained; first 20:</p><pre>{JSON.stringify(active.diagnostics.slice(0,20),null,2)}</pre></details>}
    </section>
  </details>
}
