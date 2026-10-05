import {useEffect,useRef,useState,useId} from 'react'
import {runCarrierPourbaix,carrierColors} from '../experimental/carrierPourbaix.js'
import {pourbaixKeyboardIndex} from '../plots/pourbaixView.js'
import {ResultSelectionContext} from './ResultSelectionContext.js'
import InteractiveBeaker from './InteractiveBeaker.jsx'
import './ExperimentalCarrierPourbaix.css'

const number=value=>Number.isFinite(value)?Number(value.toPrecision(7)).toString():'unavailable'
export default function ExperimentalCarrierPourbaix({session,repository}){
 const [result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[pinned,setPinned]=useState(0),[hover,setHover]=useState(null),controller=useRef(null),pattern=useId()
 useEffect(()=>()=>controller.current?.abort(),[])
 async function calculate(){
  controller.current?.abort();const current=new AbortController();controller.current=current
  setBusy(true);setResult(null);setError('');setPinned(0);setHover(null)
  try{const value=await runCarrierPourbaix(session,repository,{signal:current.signal});if(!current.signal.aborted){if(value.ok)setResult(value);else setError(value.reason??'Calculation unavailable.')}}
  catch(e){if(!current.signal.aborted)setError(e.message)}
  finally{if(!current.signal.aborted)setBusy(false)}
 }
 const index=hover??pinned,point=result?.points[index],q=result?.request
 const pin=i=>{if(Number.isInteger(i)&&i>=0&&i<result.points.length){setPinned(i);setHover(null)}}
 const locate=e=>{const box=e.currentTarget.getBoundingClientRect(),x=(e.clientX-box.left)/box.width*900,y=(e.clientY-box.top)/box.height*650;if(x<68||x>868||y<38||y>596)return null;return Math.round((596-y)/558*(q.Eh.points-1))*q.pH.points+Math.round((x-68)/800*(q.pH.points-1))}
 const colors=result?[...new Map(result.points.flatMap((p,i)=>p.dominant?[[p.dominant.id,{...p.dominant,index:i}]]:[])).values()].sort((a,b)=>a.id.localeCompare(b.id)):[]
 const palette=carrierColors(colors.map(c=>c.id))
 const x=v=>68+(v-q.pH.min)/(q.pH.max-q.pH.min)*800,y=v=>596-(v-q.Eh.min)/(q.Eh.max-q.Eh.min)*558
 return <section className="experimental-carrier" aria-label="Experimental carrier map">
  <h3>EXPERIMENTAL / UNREVIEWED</h3>
  <p>This map shows dominant calculated carriers, not reviewed oxidation-state predominance. Oxidation-state allocation metadata is incomplete. No independent validation is claimed.</p>
  <p>Ranked by contribution to the conserved source-basis inventory, across solution and solids. Acid-base carriers remain separate. Colors identify carriers only; they do not indicate oxidation states or real compound colors.</p>
  <button type="button" disabled={busy} onClick={calculate}>{busy?'Calculating experimental carrier map…':'Calculate experimental carrier map'}</button>
  {busy&&<button type="button" onClick={()=>{controller.current?.abort();setBusy(false);setError('Cancelled; no completed map retained.')}}>Cancel experimental calculation</button>}
  {error&&<p role="alert">{error}</p>}
  {result&&<>
   <p role="status">{result.grid.counts.converged} / {result.grid.counts.requested} equilibria accepted · {result.grid.counts.failed} solver failures · {result.points.filter(p=>p.status==='gap').length} map gaps · {result.points.filter(p=>p.status==='tie').length} ties · {colors.length} unique dominant carriers.</p>
   <p>Chemical construction passed. Equilibrium checks passed only at accepted samples. Gaps are not interpolated. Gray: unavailable; hatched: tied carrier contributions (fraction tolerance 10⁻⁸).</p>
   <svg className="experimental-carrier-map" viewBox="0 0 900 650" role="img" aria-label="Experimental carrier predominance map; arrow keys select adjacent samples" tabIndex="0" onPointerMove={e=>setHover(locate(e))} onPointerLeave={()=>setHover(null)} onClick={e=>{const i=locate(e);if(i!==null)pin(i)}} onKeyDown={e=>{const next=pourbaixKeyboardIndex(q,index,e.key);if(next!==null){e.preventDefault();pin(next)}}}>
    <defs><pattern id={pattern} width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#52616b"/><path d="M0 0L8 8" stroke="#fff"/></pattern></defs>
    <rect x="68" y="38" width="800" height="558" fill="#343b43"/>
    {result.points.map((p,i)=>{const dx=(q.pH.max-q.pH.min)/(q.pH.points-1)/2,dy=(q.Eh.max-q.Eh.min)/(q.Eh.points-1)/2,left=x(Math.max(q.pH.min,p.pH-dx)),right=x(Math.min(q.pH.max,p.pH+dx)),top=y(Math.min(q.Eh.max,p.Eh+dy)),bottom=y(Math.max(q.Eh.min,p.Eh-dy));return <rect key={i} data-sample={i} data-carrier={p.dominant?.id} x={left} y={top} width={right-left} height={bottom-top} fill={p.dominant?palette[p.dominant.id]:p.status==='tie'?`url(#${pattern})`:'#343b43'}/>})}
    {[0,.25,.5,.75,1].map(t=><g key={t} fill="currentColor" fontSize="15"><text x={68+800*t} y="620" textAnchor="middle">{number(q.pH.min+(q.pH.max-q.pH.min)*t)}</text><text x="60" y={600-558*t} textAnchor="end">{number(q.Eh.min+(q.Eh.max-q.Eh.min)*t)}</text></g>)}
    <text x="468" y="645" fill="currentColor" textAnchor="middle">pH</text><text transform="translate(18 317) rotate(-90)" fill="currentColor" textAnchor="middle">Eh / V vs SHE</text>
    <circle cx={x(point.pH)} cy={y(point.Eh)} r="6" fill="none" stroke="#fff" strokeWidth="3"/><circle cx={x(point.pH)} cy={y(point.Eh)} r="8" fill="none" stroke="#111"/>
   </svg>
   <div className="experimental-carrier-legend" aria-label="Carrier legend">{colors.map(c=><button type="button" key={c.id} onClick={()=>pin(c.index)}><span style={{background:palette[c.id]}} aria-hidden="true"/>{c.name} · {c.phase}</button>)}</div>
   <section aria-label="Experimental carrier inspection"><h4>Exact sample · experimental carrier inspection</h4>
    <label>Carrier map sample<input type="number" min="0" max={result.points.length-1} value={index} onChange={e=>pin(Number(e.target.value))}/></label>
    <p>pH {number(point.pH)} · Eh {number(point.Eh)} V vs SHE · pe {number(point.pe)} · solver: {point.solverStatus}</p>
    <p>Support: EXPERIMENTAL / UNREVIEWED. Oxidation state: {point.oxidationStateStatus}.</p>
    {point.dominant?<><p><strong>{point.dominant.name}</strong> · {point.dominant.phase}</p><p>Exact source identity: <code>{point.dominant.id}</code></p><p>Carrier amount: {number(point.dominant.amount)} mol/kg H₂O in source reaction normalization. Conserved contribution: {number(point.dominant.contribution)} ({number(100*point.dominant.fraction)}% of total source-basis inventory).</p></>:<p>{point.status==='tie'?`Tied carriers: ${point.leaders.map(c=>c.name).join(', ')}`:point.reason}</p>}
    <p>Conserved basis: {result.system.components[0].name}. Total: {number(point.totalInventory)} · dissolved: {number(point.dissolvedInventory)} mol/kg H₂O, source-basis equivalents. These are not inferred elemental atom counts.</p>
    <p>Accepted solids: {point.solids?.map(s=>`${s.name}: ${number(s.amount)} mol/kg H₂O`).join('; ')||(point.solverStatus==='converged'?'none':'unavailable')}.</p>
    <p>Allocation residual: {number(point.residual)} · existing balance tolerance: {number(point.tolerance)}. Fractions are not renormalized.</p>
    <details><summary>All carrier contributions and solver diagnostics</summary><pre>{JSON.stringify({carriers:point.carriers,diagnostics:result.grid.outcomes[index].diagnostics},null,2)}</pre></details>
   </section>
   <details><summary>Beaker · same experimental equilibrium</summary><ResultSelectionContext.Provider value={{index,count:result.points.length,pin,state:point.state??{ok:false,message:'No accepted equilibrium at this sample.'},theme:'dark'}}><InteractiveBeaker/></ResultSelectionContext.Provider></details>
   <details><summary>Experimental source scope and failed coordinates</summary><pre>{JSON.stringify({included:result.discovery.includedCandidates,excluded:result.discovery.excludedCandidates,omitted:result.omitted,gaps:result.points.flatMap((p,i)=>p.status==='gap'?[{index:i,pH:p.pH,Eh:p.Eh,reason:p.reason,diagnostics:result.grid.outcomes[i].diagnostics}]:[])},null,2)}</pre></details>
  </>}
 </section>
}
