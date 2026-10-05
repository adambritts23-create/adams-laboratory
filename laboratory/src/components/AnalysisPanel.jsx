import { displayNumber as number } from '../plots/formatNumber.js'
import { axisDisplayLabel } from '../plots/export.js'
import JsonDetails from './JsonDetails.jsx'
import { chemicalLabel } from '../chemistry/format.js'
import { summaryText } from '../analysis/summary.js'
export default function AnalysisPanel({summary,onView,settings={},onPin,onSlice,domainOverlay=true}) {
  if(!summary?.ok)return <p role="status">{summary?.reason??'Choose an analysis output.'}</p>
  const names=Object.fromEntries(summary.selectedComponents.map(c=>[c.id,c.name]))
  const {counts,analysis,output}=summary,partial=analysis.validCount<counts.requested
  return <section className="analysis-panel" aria-label="Scientific analysis"><h3>Analysis · {chemicalLabel(output.seriesName)}</h3>
    <p className={partial||summary.stale?'stale-banner':'plot-status'}>{summary.stale?'OLD conditions · ':''}Calculated: {counts.calculated} / {counts.requested} · Failed: {counts.failed} · Unrun: {counts.unrun} · Coverage: {(summary.calculationCoverage*100).toFixed(1)}% · Available F: {counts.validValues}</p>
    {partial&&<p role="status"><strong>Extrema apply only to successfully calculated points with an available output.</strong> {analysis.valueCoverage<0.5?'Less than half of the requested samples have this value. ':''}{counts.derivedUnavailable} calculated states have unavailable F. Sample coverage is a point fraction, not continuous domain area.</p>}
    {['total-dissolved','log-total-dissolved','log-solubility'].includes(output.type)&&<p>Total dissolved is not automatically solubility. Tiny differences may reflect numerical tolerance.</p>}
    <div className="analysis-extrema">{['minimum','maximum'].map(key=>{const p=analysis.extrema[key];return <div key={key}><strong>{key==='minimum'?'Minimum':'Maximum'} sampled</strong><p>{p?`${number(p.value)} ${output.unit}`:'Unavailable — no accepted finite value'}</p>{p?.linearValue!==null&&p?.linearValue!==undefined&&output.type.startsWith('log-')&&<p>{number(p.linearValue)} {p.linearUnit} · underlying amount</p>}{p&&<><small>{axisDisplayLabel(summary.independentVariables[0],names)} = {number(p.x)}{p.y!==undefined&&` · ${axisDisplayLabel(summary.independentVariables[1],names)} = ${number(p.y)}`} · sample {p.index} · calculated</small>{onPin&&<button onClick={()=>onPin(p.index)}>Inspect {key}</button>}</>}{onPin&&<label><input type="checkbox" checked={settings[key==='minimum'?'showMinimum':'showMaximum']??false} onChange={e=>onView({[key==='minimum'?'showMinimum':'showMaximum']:e.target.checked})}/>Show {key} on map</label>}</div>})}</div>
    <p>{analysis.regions.count} connected valid sample region(s) · {analysis.regions.adjacency}. No global extrema or chemical boundary inferred.</p>
    {onPin&&domainOverlay&&<label><input type="checkbox" checked={settings.showDomainBoundary??false} onChange={e=>onView({showDomainBoundary:e.target.checked})}/>Calculated-domain boundary · sample F availability, not a phase boundary</label>}
    {onSlice&&<p><button onClick={()=>onSlice('horizontal')}>Plot horizontal slice</button><button onClick={()=>onSlice('vertical')}>Plot vertical slice</button> · through pinned map sample</p>}
    <details><summary>Threshold brackets / failure diagnostics</summary><label>Threshold in displayed F units<input type="number" step="any" value={settings.analysisThreshold??''} onChange={e=>onView({analysisThreshold:e.target.value===''?null:Number(e.target.value)})}/></label><p>{output.unit}. For log outputs enter log10 threshold. {analysis.threshold.brackets.length} adjacent valid brackets · {analysis.threshold.exactSamples.length} exact sampled equalities. No interpolation across gaps. Brackets near numerical precision do not certify a crossing.</p>
    {summary.failures.length>0&&<><p>Numerical equilibrium was not established at failed requested states. Diagnostics do not establish a chemical cause.</p><ul>{summary.failures.map(g=><li key={g.status+g.code}>{g.count} · {g.category} · {g.code} · representative X={g.representative.x}{g.representative.y!==undefined&&`, Y=${g.representative.y}`} {onPin&&<button onClick={()=>onPin(g.representative.index)}>Inspect sample {g.representative.index}</button>}</li>)}</ul></>}
    <JsonDetails title="Exact threshold brackets and diagnostic representatives" value={{threshold:analysis.threshold,failures:summary.failures}}/></details>
    <details><summary>Deterministic scientific summary</summary><p>{summaryText(summary)}</p><JsonDetails title="ScientificResultSummary JSON" value={summary}/></details>
  </section>
}
