import { useMemo, useState } from 'react'
import { scientificPointTrace } from '../analysis/pointTrace.js'
import JsonDetails from './JsonDetails.jsx'

export default function ScientificTrace(props) {
  const [open, setOpen] = useState(false)
  return <details onToggle={e => setOpen(e.currentTarget.open)}><summary>Scientific trace · selected grid cell</summary>
    {open && <TraceContents {...props}/>}
  </details>
}
function TraceContents({ system, grid, derived, seriesId, index, currentRevision, onExport }) {
  const trace = useMemo(() => scientificPointTrace(system, grid, derived, seriesId, index, currentRevision), [system, grid, derived, seriesId, index, currentRevision])
  if (!trace.ok) return <p>{trace.reason} Pin a grid cell to inspect its equations.</p>
  return <section aria-label="Scientific point trace">
    <p>Revision {trace.systemRevision}{trace.stale ? ' · OLD conditions' : ''} · sample {index} · X = {String(trace.pointCoordinates.x)} · Y = {String(trace.pointCoordinates.y)}</p>
    <h4>Requested and prepared conditions</h4><ul>{trace.transformedConditions.map(t => <li key={t.condition.componentId}>{system.components.find(c => c.id === t.condition.componentId)?.name}: {t.condition.quantity} = {String(t.coordinate)} → {t.actual ? `${t.actual.kh === 1 ? 'total' : 'log10 activity'} = ${t.actual.value}` : 'input unavailable'} · {t.passed === null ? 'not evaluated' : t.passed ? 'matches request' : 'MISMATCH'}</li>)}</ul>
    <p>Solver: {trace.convergenceDiagnostics.calculationStatus}. Reconstructed equation audit: <strong>{trace.auditStatus}</strong> ({trace.equationAudit.checks.length} checks).</p>
    <p>{trace.plottedOutput.descriptor.label}: {trace.plottedOutput.plottedValue === null ? 'unavailable' : String(trace.plottedOutput.plottedValue)} {trace.plottedOutput.descriptor.unit}. Independent output reconstruction: {trace.plottedOutput.passed ? 'matches' : 'MISMATCH'}.</p>
    <p>{trace.plottedOutput.descriptor.formula}</p>
    <h4>Reaction-set coupling</h4>{trace.coupling.map(c => <p key={c.variedComponent.id}>{c.variedComponent.name}: {c.aqueousUsingVaried.length} aqueous records use this component; {c.directlyCoupledRecords.length} share output-basis coefficients. {c.interpretation}</p>)}
    <h4>Adjacent sampled response</h4>{trace.sensitivity.map(s => <ul key={s.axis}>{s.neighbors.map(n => <li key={n.index}>{s.axis} → sample {n.index}: Δcoordinate {String(n.deltaCoordinate)}, ΔF {n.deltaF === null ? 'unavailable' : String(n.deltaF)}; intended input only: {String(n.intendedInputOnly)}. {n.interpretation}</li>)}</ul>)}
    <p>Initial and failed final iterates were not recorded. This trace does not invent them. Raw attempts and available residuals remain below.</p>
    <button onClick={() => onExport({ text: JSON.stringify(trace, null, 2), type: 'application/json', filename: `adams-point-trace-r${trace.systemRevision}-${index}.json` })}>Export scientific trace JSON</button>
    <JsonDetails label="Equations, source rows and raw diagnostic details" value={trace}/>
  </section>
}
