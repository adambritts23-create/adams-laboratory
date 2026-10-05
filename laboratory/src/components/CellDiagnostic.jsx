import {displayNumber} from '../plots/formatNumber.js'
import { cellDiagnostic } from '../analysis/gridDiagnostics.js'
import JsonDetails from './JsonDetails.jsx'
export default function CellDiagnostic({outcome,point,descriptor}) {
  if(!outcome)return null
  const d=cellDiagnostic(outcome,point,descriptor)
  return <div className="cell-diagnostic"><strong>{descriptor?.label} [{descriptor?.unit}]</strong><p>Calculation: {d.calculationStatus} · {d.normalizedDiagnosticCategory}</p><p>{d.explanation}. Requested output: {d.requestedOutputStatus}{d.outputReason?` · ${d.outputReason}`:''}</p>
    {d.iterations!==null&&<p>Accepted iterations: {d.iterations}</p>}
    {d.attempts.map((a,i)=><p key={i}>Attempt {i+1}: {a.code??(a.accepted?'accepted':'not accepted')}{Number.isFinite(a.iteration)?` · iteration ${a.iteration}`:''}{Number.isFinite(a.residualNorm)?` · reported residual norm ${displayNumber(a.residualNorm,'diagnostic')}`:''}</p>)}
    {d.rawDiagnostic.map((r,i)=><p key={i}>{r.code}: {r.message}</p>)}
    <JsonDetails title="Raw diagnostic, residuals and cell conditions" value={d}/>
  </div>
}
