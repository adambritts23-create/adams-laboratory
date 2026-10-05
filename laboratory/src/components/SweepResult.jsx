import {displayNumber} from '../plots/formatNumber.js'
import { useState } from 'react'
import PointResult from './PointResult.jsx'

export default function SweepResult({ result }) {
  const [selected, setSelected] = useState(0)
  if (!result) return null
  const point = result.outcomes[selected]
  return <section><h3>Ordered sweep outcomes</h3>
    <p>{result.status} · revision {result.revision} · {result.counts.requested} requested · {result.counts.converged} converged · {result.counts.failed} failed · {result.counts.notRun} not run.</p>
    <p>Coordinate: {result.definition.axis.quantity} ({result.definition.axis.unit}); {result.definition.axis.mode}. Failed and unrun coordinates remain in sequence. No curves or output transformations are calculated.</p>
    <div className="result-scroll"><table><thead><tr><th>Index</th><th>Requested coordinate</th><th>Solver coordinate</th><th>Outcome</th><th>Inspect</th></tr></thead><tbody>{result.outcomes.map(p => <tr key={p.index}><td>{p.index}</td><td>{displayNumber(p.coordinate)}</td><td>{p.transformed ? `${p.transformed.field} = ${displayNumber(p.transformed.value)}` : 'not evaluated'}</td><td>{p.status} {p.diagnostics.map(d => d.code).join(', ')}</td><td><button onClick={() => setSelected(p.index)}>Point {p.index}</button></td></tr>)}</tbody></table></div>
    {point && <p>Inspecting point {point.index}: requested {point.coordinate} {result.definition.axis.quantity}.</p>}
    {point?.status === 'converged' ? <PointResult result={point.result} /> : <pre>{JSON.stringify(point, null, 2)}</pre>}
    <details><summary>Full immutable sweep data and timing</summary><pre>{JSON.stringify(result, null, 2)}</pre></details>
  </section>
}
