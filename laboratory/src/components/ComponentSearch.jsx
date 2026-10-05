import {useMemo,useState} from 'react'
import {searchComponentSystem} from '../thermodynamics/componentSearch.js'
import {chemicalLabel} from '../chemistry/format.js'
export default function ComponentSearch({repository,selectedIds}){
 const [open,setOpen]=useState(false)
 const search=useMemo(()=>open?searchComponentSystem(repository,selectedIds):null,[open,repository,selectedIds])
 return <details onToggle={e=>setOpen(e.currentTarget.open)} aria-label="Database products found"><summary>Selected components → database products found</summary>
  {search?.ok&&<><p>Source-system search: {search.aqueous.length} aqueous · {search.solids.length} solids · {search.gases.length} gases · {search.electronConnected.length} electron-transfer records.</p>
   <p>Search results describe the database system. Calculation availability and accepted phases are checked separately. Closed physical chemistry introduces the electron transfer coordinate internally; no electron reagent is supplied.</p>
   {[['Aqueous products',search.aqueous],['Pure solids',search.solids],['Gases',search.gases],['Electron-transfer records',search.electronConnected]].map(([label,rows])=><details key={label}><summary>{label} · {rows.length}</summary><ul>{rows.map(r=><li key={r.id}><span style={{whiteSpace:'nowrap'}}>{chemicalLabel(r.name)}</span> <details><summary>Source identity / reaction</summary><small>{r.id}</small><p>{r.citation}</p><pre>{JSON.stringify({reaction:r.metadata?.effectiveSourceReaction,logK:r.logK,phase:r.phase,provenance:r.provenance},null,2)}</pre></details></li>)}</ul></details>)}
  </>}
  {search&&!search.ok&&<p>{search.diagnostics.map(d=>d.message).join(' ')}</p>}
 </details>
}
