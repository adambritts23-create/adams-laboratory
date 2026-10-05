import {displayNumber as format,displayConcentration,displayDissolvedAmount,displayComponentTotal} from '../plots/formatNumber.js'
export default function PointResult({ result }) {
  if (!result) return <p className="notice">No accepted point result for the current session. Only fixed-condition ideal points at 25 °C are supported; no diagrams are calculated.</p>
  return <section aria-labelledby="point-result-title">
    <h3 id="point-result-title">Calculated ideal equilibrium point</h3>
    <p>Revision {result.revision} · 25 °C · declared 1 bar setting · mol/kg H₂O · {result.iterations} Newton iterations. Scientific residual checks passed.</p>
    <div className="result-scroll"><table><thead><tr><th>Species</th><th>Amount (mol/kg H₂O)</th><th>log₁₀ activity / solid saturation</th></tr></thead><tbody>{result.speciesIds.map((id, i) => <tr key={id}><td>{result.speciesNames[i]}</td><td>{displayConcentration(result,i)}</td><td>{format(result.logActivities[i],'log')}</td></tr>)}</tbody></table></div>
    <div className="result-scroll"><table><thead><tr><th>Component</th><th>Total</th><th>Dissolved amount</th><th>Balance residual</th></tr></thead><tbody>{result.componentIds.map((id, i) => <tr key={id}><td>{result.componentNames[i]}</td><td>{displayComponentTotal(result,i)}</td><td>{displayDissolvedAmount(result,i)}</td><td>{format(result.residuals.componentBalance[i])}</td></tr>)}</tbody></table></div>
    {result.solids.map(s => <p key={s.id}>{s.name}: {s.status}; amount {format(s.amount,'amount')} mol/kg H₂O; log saturation {format(s.logSaturation,'log')}.</p>)}
    <p>Electron and water concentration entries are suppressed bookkeeping zeros. Fixed-activity component balances are outputs; their target residual is unavailable. Solid amount and hypothetical log saturation are distinct.</p>
    <details><summary>Numerical diagnostics and provenance</summary><pre>{JSON.stringify(result, null, 2)}</pre></details>
  </section>
}


