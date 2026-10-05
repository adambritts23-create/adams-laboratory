import { useState } from 'react'
import { matchesOxidationStates,speciesElements } from '../thermodynamics/repository.js'
import { chemicalLabel } from '../chemistry/format.js'
import SpeciesDetails from './SpeciesDetails.jsx'
export default function AvailableSpecies({species,catalog=species,selected,elements,phases,onToggle}){
  const [search,setSearch]=useState(''),[phase,setPhase]=useState('all'),[oxidation,setOxidation]=useState({}),[scope,setScope]=useState('compatible'),[limit,setLimit]=useState(50),[selectedOnly,setSelectedOnly]=useState(false),[inspect,setInspect]=useState(null)
  const browse=scope==='all'?catalog:species,allowed=new Set(species.map(s=>s.id)),query=search.trim().toLowerCase()
  const activeFilters=Object.fromEntries(Object.entries(oxidation).filter(([symbol])=>elements.includes(symbol)))
  const visible=browse.filter(s=>(phase==='all'||s.phase===phase)&&(!selectedOnly||selected.includes(s.id))&&matchesOxidationStates(s,activeFilters)&&`${s.id} ${s.name} ${s.displayName} ${chemicalLabel(s.displayName)} ${s.formula}`.toLowerCase().includes(query))
  const inspected=catalog.find(s=>s.id===inspect)
  return <section className="species-browser" aria-labelledby="species-title">
    <div className="section-heading"><h2 id="species-title">Species</h2><small aria-live="polite">{visible.length} matches · {selected.length} selected</small></div>
    <div className="species-search"><label>Search species<input type="search" value={search} onChange={e=>{setSearch(e.target.value);setLimit(50)}} placeholder="Name or formula"/></label>
      <label>Browse phase<select value={phase} onChange={e=>setPhase(e.target.value)}><option value="all">All phases</option>{phases.map(p=><option key={p}>{p}</option>)}</select></label>
      <label className="inline-check"><input type="checkbox" checked={selectedOnly} onChange={e=>setSelectedOnly(e.target.checked)}/>Selected only</label>
      <details className="filter-options"><summary>More filters / help</summary><label>Element scope<select value={scope} onChange={e=>{setScope(e.target.value);setLimit(50)}}><option value="compatible">Compatible with selected components</option><option value="all">Entire catalog · inspect only where incompatible</option></select></label>
        {elements.map(symbol=>{const relevant=browse.filter(s=>(speciesElements(s)??[]).includes(symbol)),values=[...new Set(relevant.flatMap(s=>s.oxidationStates?.[symbol]?.map(v=>v.value)??[]))].sort((a,b)=>a-b);if(!values.length)return null;if(relevant.some(s=>!s.oxidationStates?.[symbol]))values.push('unknown');return <fieldset key={symbol}><legend>{symbol} oxidation-state filter</legend>{values.map(v=><label key={v}><input type="checkbox" checked={(oxidation[symbol]??[]).includes(v)} onChange={()=>setOxidation(old=>({...old,[symbol]:(old[symbol]??[]).includes(v)?old[symbol].filter(x=>x!==v):[...(old[symbol]??[]),v]}))}/>{v}</label>)}</fieldset>})}
        <p>Compatibility does not imply stability. Source element links can be incomplete; unknown oxidation states stay unknown. Selection changes chemistry; plot visibility does not.</p>
        <button onClick={()=>{setSearch('');setPhase('all');setScope('compatible');setOxidation({});setSelectedOnly(false)}}>Clear browser filters</button>
      </details>
    </div>
    <div className="species-content"><div className="species-table-scroll"><table className="species-table"><thead><tr><th>Include / species</th><th>Phase</th><th>Selection / support</th><th>Info</th></tr></thead><tbody>
      {visible.slice(0,limit).map(s=><tr key={s.id} className={selected.includes(s.id)?'included':''}><td><label><input type="checkbox" aria-label={`Include ${chemicalLabel(s.displayName)}`} checked={s.role==='solvent'||selected.includes(s.id)} disabled={s.role==='solvent'||!allowed.has(s.id)} onChange={()=>onToggle(s.id)}/><span title={s.name}>{chemicalLabel(s.displayName)}</span></label></td><td>{s.phase}</td><td>{!allowed.has(s.id)?'Incompatible components':s.role==='solvent'?'Always included':['gas','liquid'].includes(s.phase)?'Equilibrium unsupported':selected.includes(s.id)?'Selected':'Candidate'}{s.provenance.kind==='user-defined'&&<strong> · Unverified</strong>}</td><td><button aria-label={`Details ${chemicalLabel(s.displayName)}`} aria-pressed={inspect===s.id} onClick={()=>setInspect(inspect===s.id?null:s.id)}>ⓘ</button></td></tr>)}
    </tbody></table>{visible.length>limit&&<button onClick={()=>setLimit(n=>n+50)}>Show 50 more records</button>}{!visible.length&&<p>No species match these filters.</p>}</div>
    {inspected&&<aside className="species-inspector"><button onClick={()=>setInspect(null)}>Close inspector</button><SpeciesDetails species={inspected} expanded/></aside>}</div>
  </section>
}
