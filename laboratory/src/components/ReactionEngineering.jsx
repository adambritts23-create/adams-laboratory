import {useEffect,useMemo,useRef,useState} from 'react'
import {batchSource,createBatchSample,addBatchReagent,equilibrateBatch,filterBatch,batchBalance,equilibriumBalance,importWetLabBatch} from '../calculations/batchExperiment.js'
import './ReactionEngineering.css'

const number=n=>Number(n).toLocaleString('en-US',{maximumSignificantDigits:5})
export default function ReactionEngineering({repository,incoming,blocked,databaseName}){
 const [samples,setSamples]=useState([]),[selected,setSelected]=useState(''),[source,setSource]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[balance,setBalance]=useState(null)
 const [name,setName]=useState('Sample 1'),[volume,setVolume]=useState('100'),[rows,setRows]=useState([{id:'component:H%2B',value:'0'}])
 const imported=useRef(null),generation=useRef(0)
 const components=useMemo(()=>repository.getComponents().filter(c=>!['solvent','electron'].includes(c.role)),[repository])
 const sample=samples.find(s=>s.id===selected),compatible=!!sample&&sample.sourceFingerprint===source?.fingerprint&&source.repository===repository&&!blocked
 useEffect(()=>{let current=true;generation.current++;setSource(null);batchSource(repository).then(fingerprint=>{if(current)setSource({repository,fingerprint})}).catch(e=>{if(current)setError(e.message)});return()=>{current=false;generation.current++}},[repository])
 function retain(nodes){setSamples(s=>[...s,...nodes]);setSelected(nodes[0].id)}
 useEffect(()=>{if(!incoming||imported.current===incoming)return;imported.current=incoming;importWetLabBatch(incoming.state,incoming.repository).then(s=>{retain([{...s,sourceName:incoming.databaseName}]);setError('');setBalance(null)}).catch(e=>setError(e.message))},[incoming])
 function entered(){
  if(blocked||source?.repository!==repository)throw Error('Select a supported database first.')
  const moles={};for(const row of rows){if(row.value.trim()==='')throw Error('Enter each concentration.');const n=Number(row.value.replace(',','.'))*Number(volume.replace(',','.'))/1000;moles[row.id]=(moles[row.id]??0)+n}
  return createBatchSample({name,moles,volumeMl:Number(volume.replace(',','.')),sourceFingerprint:source.fingerprint,sourceName:databaseName},repository)
 }
 function create(add=false){try{const stock=entered();if(add){if(!compatible)throw Error('Select a sample from the active database.');const next=addBatchReagent(sample,stock);setSamples(s=>[...s,stock,next]);setSelected(next.id);setBalance({label:'Addition balance',rows:batchBalance([sample,stock],[next])})}else{retain([stock]);setBalance(null)}setError('')}catch(e){setError(e.message)}}
 async function equilibrate(){const token=generation.current;setBusy(true);setError('');try{const next=await equilibrateBatch(sample,repository);if(token===generation.current){retain([next]);setBalance({label:'Equilibrium inventory balance',rows:equilibriumBalance(next)})}}catch(e){if(token===generation.current)setError(e.message)}finally{setBusy(false)}}
 function filter(){try{const products=filterBatch(sample);retain(products);setBalance({label:'Filtrate + retained solids balance',rows:batchBalance([sample],products)});setError('')}catch(e){setError(e.message)}}
 function save(){const payload={kind:'adams-batch-history',version:1,convention:'Ideal 25 C, additive volumes, 1 model kg H2O/L; signed proton coordinates; ideal filtration',samples:samples.map(({equilibrium,...s})=>({...s,equilibrium:equilibrium?{pH:s.pH,solids:equilibrium.result.solids,sourceSystemId:equilibrium.system.id}:null}))};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='batch-experiment-history.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <section className="reaction-engineering">
  <header><div><h2>Reaction Engineering · Batch</h2><p>Prepare → equilibrate → filter → continue with either product</p></div><button onClick={save} disabled={!samples.length}>Export history</button></header>
  <p className="engineering-assumptions">Perfect mixing and instantaneous equilibrium · 25 °C · ideal activities. No kinetics. Volumes add; 1 L solution is treated as 1 model kg H₂O. Component balances below are not a full density or solvent-water mass balance.</p>
  <div className="engineering-layout"><aside>
   <h3>Samples and history</h3>
   {!samples.length&&<p>Create a sample, or send an accepted beaker from Wet Lab.</p>}
   <ol>{samples.map((s,i)=><li key={s.id}><button aria-pressed={selected===s.id} onClick={()=>{setSelected(s.id);setBalance(null)}}><strong>{i+1}. {s.name}</strong><small>{s.operation} · {number(s.volumeMl)} mL{s.parents.length?` · from ${s.parents.map(id=>samples.findIndex(p=>p.id===id)+1).join(' + ')}`:''}</small></button></li>)}</ol>
  </aside><main>
   <section className="engineering-sample"><h3>{sample?.name??'No sample selected'}</h3>
    {sample&&<><p>{sample.kind} · {number(sample.volumeMl)} mL{Number.isFinite(sample.pH)&&sample.equilibrium?` · pH ${sample.pH.toFixed(2)}`:''}</p>
     {!compatible&&<p role="status">This sample uses {sample.sourceName??'its original database'}. Switch back to that source to continue.</p>}
     <div className="engineering-actions"><button disabled={!compatible||busy||sample.volumeMl===0} onClick={equilibrate}>{busy?'Calculating…':'Equilibrate'}</button><button disabled={!compatible||busy||!sample.equilibrium} onClick={filter}>Filter into two samples</button></div>
     {sample.kind==='solids'&&<p>Add water or a reagent solution below to resuspend these solids.</p>}
     {sample.equilibrium&&<p>Accepted equilibrium · {sample.equilibrium.result.solids.filter(s=>s.amount>0).length} precipitated phases</p>}
     {sample.inventory?.solids?.length>0&&<table><thead><tr><th>Retained / precipitated phase</th><th>Amount / mol</th><th>Mass / g</th></tr></thead><tbody>{sample.inventory.solids.map(s=><tr key={s.id}><td>{s.name}</td><td>{number(s.moles)}</td><td>{s.massG==null?'Unavailable':number(s.massG)}</td></tr>)}</tbody></table>}
     <table><thead><tr><th>Conserved component</th><th>Amount / mol</th><th>In solids / %</th></tr></thead><tbody>{Object.entries(sample.moles).map(([id,n])=>{const i=sample.equilibrium?.system.components.findIndex(c=>c.id===id);const solid=i>=0?sample.equilibrium.result.solids.reduce((a,s)=>a+s.amount*sample.modelSolventMassKg*sample.equilibrium.system.products.find(p=>p.id===s.id).coefficients[i],0):null;return <tr key={id}><td>{components.find(c=>c.id===id)?.name??id}</td><td>{number(n)}</td><td>{n>0&&solid!==null&&components.find(c=>c.id===id)?.role!=='proton'?number(100*solid/n):'—'}</td></tr>})}</tbody></table>
    </>}
   </section>
   <fieldset disabled={busy||blocked||source?.repository!==repository}><legend>New sample / reagent solution</legend>
    <div className="engineering-fields"><label>Name<input aria-label="Batch sample name" value={name} onChange={e=>setName(e.target.value)}/></label><label>Volume / mL<input aria-label="Batch volume" value={volume} onChange={e=>setVolume(e.target.value)}/></label></div>
    <p>Analytical component concentrations in mol/L. Countercharge is unspecified. Negative H⁺ represents added base; an empty composition creates model water.</p>
    {rows.map((row,i)=><div className="engineering-fields" key={i}><label>Component<select aria-label={`Batch component ${i+1}`} value={row.id} onChange={e=>setRows(rows.map((r,j)=>i===j?{...r,id:e.target.value}:r))}>{components.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>mol/L<input aria-label={`Batch concentration ${i+1}`} value={row.value} onChange={e=>setRows(rows.map((r,j)=>i===j?{...r,value:e.target.value}:r))}/></label><button onClick={()=>setRows(rows.filter((_,j)=>i!==j))}>Remove</button></div>)}
    <div className="engineering-actions"><button onClick={()=>setRows([...rows,{id:components[0]?.id,value:'0'}])}>Add component</button><button onClick={()=>create()}>Create separate sample</button><button disabled={!compatible} onClick={()=>create(true)}>Add to selected sample</button></div>
   </fieldset>
   {balance&&<section><h3>{balance.label}</h3><table><thead><tr><th>Component</th><th>In / mol</th><th>Out / mol</th><th>Residual / mol</th></tr></thead><tbody>{balance.rows.map(r=><tr key={r.id}><td>{components.find(c=>c.id===r.id)?.name??r.id}</td><td>{number(r.before)}</td><td>{number(r.after)}</td><td>{number(r.residual)}</td></tr>)}</tbody></table></section>}
   <p role="alert">{error}</p>
   <details><summary>Scope and separation assumptions</summary><p>Ideal filtration removes all accepted solids into one dry product; all solution goes to the filtrate. No retained liquid, washing, entrainment, gas exchange or rates. Compatible source phases are enabled for new samples; imported Wet Lab phase exclusions are retained. Signed proton equivalents are a reaction-basis coordinate, not free hydrogen concentration. Each operation creates a new history entry; old samples remain available for alternative branches. History is retained while this page is open; export it before closing. CSTR and semibatch flow models are future additions.</p></details>
  </main></div>
 </section>
}
