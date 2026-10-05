import { useRef } from 'react'
/** Native disclosure keeps existing export callbacks and keyboard button semantics. */
export default function PlotExport({children}) {
  const host=useRef(null)
  const close=()=>{host.current.open=false;host.current.querySelector('summary').focus()}
  return <details className="plot-export" ref={host} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();close()}}}>
    <summary>Export ▾</summary><div className="plot-export-options" onClick={e=>{if(e.target.closest('button')&&!e.target.closest('button').disabled)close()}}>{children}</div>
  </details>
}
