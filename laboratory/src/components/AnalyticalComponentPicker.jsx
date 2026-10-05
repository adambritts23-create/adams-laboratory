import {useEffect,useRef,useState} from 'react'
import {chemicalLabel} from '../chemistry/format.js'
import {searchAnalyticalComponents} from '../calculations/analyticalCandidates.js'
export default function AnalyticalComponentPicker({catalog,onPick,onClose}){
 const dialog=useRef(null),search=useRef(null),[query,setQuery]=useState(''),[limit,setLimit]=useState(20)
 useEffect(()=>{dialog.current.showModal();search.current.focus()},[])
 const result=searchAnalyticalComponents(catalog,query,{limit})
 function navigate(event){
  if(!['ArrowDown','ArrowUp'].includes(event.key))return
  const buttons=[...dialog.current.querySelectorAll('button[data-candidate]:not(:disabled)')];if(!buttons.length)return
  event.preventDefault();const i=buttons.indexOf(event.target),next=event.key==='ArrowDown'?Math.min(i+1,buttons.length-1):Math.max(i-1,0);buttons[next].focus()
 }
 return <dialog className="analytical-picker" ref={dialog} aria-label="Find analytical component" onCancel={onClose} onKeyDown={navigate}>
  <div className="section-heading"><h3>Find analytical component</h3><button onClick={onClose} aria-label="Close component search">Close</button></div>
  <label>Search source components<input ref={search} type="search" value={query} placeholder="Name, symbol or source formula" onChange={e=>{setQuery(e.target.value);setLimit(20)}}/></label>
  <p>{catalog.systemBound?'Inputs from the selected System, including compatible source-coordinate conveniences. To add other chemistry, use Edit chemistry in System.':'Direct analytical inputs, not salts or reagents. Selection preserves the exact source identity. System capability is checked after selection.'}</p>
  <small role="status">{result.total} matches · showing {result.items.length} of {catalog.candidates.length} source candidates</small>
  <div className="analytical-candidates">{result.items.map(c=><button key={c.id} data-candidate={c.id} disabled={!c.selectable} onClick={()=>onPick(c.id)} aria-label={'Select '+chemicalLabel(c.label)}>
   <strong className="chemical-formula">{chemicalLabel(c.label)}</strong><span>{c.kind} · {c.selectable?'Selectable':'Unavailable as input'}</span><small>{catalog.systemBound&&c.selectable?'Selected System input · ordinary acid/base equilibrium':c.currentLimit??'General source structure · full system admission still required.'}</small>
   {c.capabilities.solidsPossible&&<small>Solid candidates possible; presence depends on composition.</small>}
  </button>)}</div>
  {result.total>result.items.length&&limit<50&&<button onClick={()=>setLimit(50)}>Show more matches</button>}
  {result.total>50&&<small>Refine the search to see other matches.</small>}
  {!result.total&&<p>No matching source component. Try the exact formula or an authoritative element name; unknown aliases are not inferred.</p>}
  <small>Reference validation is separate from structural admission. Use Tab / arrow keys to navigate and Enter to select.</small>
 </dialog>
}
