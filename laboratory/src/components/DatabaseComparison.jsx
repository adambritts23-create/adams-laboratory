import {useEffect,useMemo,useRef,useState} from 'react'
import {databaseCollections} from '../thermodynamics/databaseLibrary.js'
import {runDatabaseComparison,comparisonKey} from '../calculations/databaseComparison.js'
import {deriveOutputs} from '../calculations/outputs.js'
import ScientificPlot from './ScientificPlot.jsx'

function download(text,type,name){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export default function DatabaseComparison({base,library,repository,session}){
 const collections=useMemo(()=>databaseCollections(base,library),[base,library])
 const [first,setFirst]=useState('base'),[second,setSecond]=useState(''),[result,setResult]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const [selected,setSelected]=useState(''),[type,setType]=useState('log-concentration'),[component,setComponent]=useState('')
 const controller=useRef(null)
 useEffect(()=>{controller.current?.abort();setBusy(false);setResult(null);setError('')},[session.revision,library,repository])
 useEffect(()=>()=>controller.current?.abort(),[])
 const secondId=collections.some(c=>c.id===second)?second:collections.find(c=>c.id!==first)?.id??''
 async function run(){
  controller.current?.abort();const abort=new AbortController();controller.current=abort;setBusy(true);setError('');setResult(null)
  try{const r=await runDatabaseComparison({base,library,source:repository,session,collectionIds:[first,secondId]},{signal:abort.signal,isCurrent:()=>!abort.signal.aborted});if(!abort.signal.aborted){setResult(r);setSelected('');setType('log-concentration');setComponent(r.runs[0].system.components.find(c=>c.role==='ordinary')?.id??'')}}
  catch(e){if(!abort.signal.aborted)setError(e.message)}finally{if(controller.current===abort)setBusy(false)}
 }
 const views=useMemo(()=>result?.runs.map((r,i)=>type==='log-concentration'?r.derived:deriveOutputs(r.system,r.sweep,{type:'total-fraction',componentId:i===0?component:result.runs[1].componentIds[Object.keys(result.runs[0].componentIds).find(id=>result.runs[0].componentIds[id]===component)]},{currentRevision:result.revision})),[result,type,component])
 const options=useMemo(()=>[...new Map((views??[]).filter(v=>v.ok).flatMap(v=>v.series).map(s=>[comparisonKey(s),s])).entries()].sort((a,b)=>a[1].name.localeCompare(b[1].name)),[views])
 const key=options.some(([k])=>k===selected)?selected:options.find(([,s])=>s.name.includes('UO2'))?.[0]??options[0]?.[0]
 const overlay=useMemo(()=>{
  if(!result||views.some(v=>!v.ok)||!key)return null
  const series=views.flatMap((v,i)=>v.series.filter(s=>comparisonKey(s)===key).map(s=>({...s,id:`comparison:${i}:${s.id}`,name:`${s.name} · ${i===0?'A':'B'}`,lineStyle:i===1?'dashed':'solid'})))
  return {...views[0],series,metadata:{...views[0].metadata,databaseComparison:{runs:result.runs.map(r=>({name:r.name,sourceIdentity:r.sweep.sourceIdentity,conditions:r.sweep.definition.calculationDefinition,mappings:r.mappings})),note:'Independent database runs. Reaction differences are candidates, not causal attribution.'}}}
 },[result,views,key])
 return <details className="database-comparison card">
  <summary><strong>Compare databases on one graph</strong></summary>
  <p>Run the current pH sweep independently in two databases. Choose a species to overlay, or compare its fraction of an analytical component. The active database and normal results stay unchanged.</p>
  <div className="calculation-database-bar">
   <label>First database<select value={first} disabled={busy} onChange={e=>{setFirst(e.target.value);setResult(null)}}>{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <label>Second database<select value={secondId} disabled={busy} onChange={e=>{setSecond(e.target.value);setResult(null)}}>{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <button disabled={busy||!secondId||first===secondId} onClick={run}>{busy?'Comparing…':'Run comparison'}</button>
   {busy&&<button onClick={()=>{controller.current?.abort();setBusy(false);setError('Comparison cancelled.')}}>Cancel comparison</button>}
  </div>
  {collections.length<2&&<p>Load another collection with Combine / manage databases above, then return here.</p>}
  <small>Initial scope: ordinary, automatic-species, ideal 25 °C pH sweeps. Fixed analytical ammonia and carbonate totals can map between NH₃/NH₄⁺ and CO₃²⁻/HCO₃⁻ bases. Other missing components are reported, never silently removed.</small>
  {error&&<p role="alert">{error}</p>}
  {result&&<>
   <p>{result.runs.map(r=>`${r.name}: ${r.sweep.counts.converged}/${r.sweep.counts.requested} accepted points`).join(' · ')}. Failed points remain gaps.</p>
   <p><span style={{color:'#6ee7c6'}}>━━ A: {result.runs[0].name}</span><br/><span style={{color:'#ffb86b'}}>┄┄ B: {result.runs[1].name}</span></p><div className="calculation-database-bar"><label>Output<select value={type} onChange={e=>setType(e.target.value)}><option value="log-concentration">Log concentrations / solid amounts</option><option value="total-fraction" disabled={!component}>Total fractions</option></select></label>
   {type==='total-fraction'&&<label>Component<select value={component} onChange={e=>setComponent(e.target.value)}>{result.runs[0].system.components.filter(c=>c.role==='ordinary').map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
   <label>Species<select value={key??''} onChange={e=>setSelected(e.target.value)}>{options.map(([k,s])=><option key={k} value={k}>{s.name} · {s.phase}</option>)}</select></label></div>
   {views?.filter(v=>!v.ok).map((v,i)=><p role="alert" key={i}>{v.diagnostics.map(d=>d.message).join(' ')}</p>)}
   {overlay&&<>{overlay.series.length<2&&<p>This species is absent from one run’s output catalog. Absence is not plotted as zero.</p>}<ScientificPlot key={`${result.revision}:${type}:${component}:${key}`} derived={overlay} visibleIds={overlay.series.map(s=>s.id)} theme="dark" currentRevision={result.revision} onExport={(kind,svg)=>download(kind==='svg'?svg:JSON.stringify(result,null,2),kind==='svg'?'image/svg+xml':'application/json',`database-comparison.${kind}`)}/></>}
   <details><summary>Reaction differences in these systems ({result.differences.length})</summary><p>These are possible explanations, not proof of causation. Different reaction bases make raw log K values incomparable. A controlled reaction substitution would be needed to attribute a curve change to one reaction.</p>
    <div className="result-scroll"><table><thead><tr><th>Species / difference</th>{result.runs.map(r=><th key={r.id}>{r.name}</th>)}</tr></thead><tbody>{result.differences.map((d,i)=><tr key={i}><td>{d.name} · {d.phase}<br/>{d.status}</td>{['left','right'].map(side=><td key={side}>{d[side].length?d[side].map((r,j)=><div key={j}>{r.equation}<br/>log K {r.logK}<details><summary>Source</summary>{r.citation}</details></div>):'Not in selected reaction set'}</td>)}</tr>)}</tbody></table></div>
   </details>
  </>}
 </details>
}
