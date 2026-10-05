import {displayNumber} from '../plots/formatNumber.js'
import { axisDisplayLabel } from '../plots/export.js'
export default function GridDiagnostics({summary,onInspect}) {
  const d=summary?.gridDiagnostics
  if(!d)return null
  const labels=summary.independentVariables.map(a=>axisDisplayLabel(a,Object.fromEntries(summary.selectedComponents.map(c=>[c.id,c.name]))))
  return <section className="grid-diagnostics" aria-label="Grid diagnostics"><h3>Grid diagnostics</h3>
    <p>{summary.counts.requested} requested · {summary.counts.calculated} calculated · {summary.counts.failed} failed · {summary.counts.unrun} unrun (including {summary.counts.cancelled} cancelled) · {summary.counts.derivedUnavailable} calculated outputs unavailable</p>
    {d.groups.filter(g=>g.category!=='CALCULATED').map(g=><details key={g.category}><summary>{g.explanation} · {g.count}</summary><p>{g.category}</p>{g.representatives.map(i=>{const c=d.cells[i];return <p key={i}>X · {labels[0]} = {displayNumber(c.x)}; Y · {labels[1]} = {displayNumber(c.y)}. {c.rawDiagnostic.map(r=>`${r.code}: ${r.message}`).join(' ')} {c.outputReason} <button onClick={()=>onInspect(i)}>Inspect diagnostic sample {i}</button></p>})}<p>At most three representatives shown; every requested cell remains inspectable/exportable.</p></details>)}
    <p>{d.calculatedRanges?`Successful sampled bounds: X ${d.calculatedRanges.x.join(' to ')}; Y ${d.calculatedRanges.y.join(' to ')}.`:'No successful sampled coordinates.'} {d.warning}</p>
    <details><summary>Success coverage by sampled X / Y coordinate</summary>{d.axes.map((rows,axis)=><div key={axis}><h4>{labels[axis]}</h4><table><thead><tr><th>Coordinate</th><th>Calculated / requested</th><th>Success</th><th>F available</th></tr></thead><tbody>{rows.map(r=><tr key={r.index}><td>{displayNumber(r.coordinate)}</td><td>{r.calculated} / {r.requested}</td><td>{(100*r.calculated/r.requested).toFixed(1)}%</td><td>{r.available}</td></tr>)}</tbody></table></div>)}</details>
  </section>
}
