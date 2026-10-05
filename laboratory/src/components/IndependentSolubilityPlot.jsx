import { useMemo, useState } from 'react'
import { comparisonOutputs, comparisonPackage } from '../calculations/independentSolubility.js'
import ScientificPlot from './ScientificPlot.jsx'
import ExportPanel from './ExportPanel.jsx'

export default function IndependentSolubilityPlot({ session, onView, busy }) {
  const comparison = session.lastPlot.comparison, plot = session.visualizationState.plot ?? {}
  const derived = useMemo(() => comparisonOutputs(comparison, session.revision), [comparison, session.revision])
  const [artifact, setArtifact] = useState(null)
  const visible = plot.comparisonVisibleIds ?? derived.series.map(s => s.id), theme = plot.theme ?? 'dark'
  return <section className={`plot-workspace ${theme}`}>
    <p role="status">{session.revision !== comparison.revision ? 'STALE — previous comparison unavailable for edited setup; recalculate.' : busy ? 'Calculating independent solutions…' : 'Independent solutions · not a mixed-metal equilibrium'}</p>
    <button onClick={() => onView({ theme: theme === 'dark' ? 'light' : 'dark' })}>{theme === 'dark' ? 'Light' : 'Dark'} plot theme</button>
    <details><summary>Compared systems and availability</summary>{derived.series.map((s, i) => <p key={s.id}><label><input type="checkbox" checked={visible.includes(s.id)} onChange={() => onView({ comparisonVisibleIds: visible.includes(s.id) ? visible.filter(id => id !== s.id) : [...visible, s.id] })}/>{comparison.entries[i].pair.label}</label> · {s.points.filter(p => p.value !== null).length}/{s.points.length} solubility values available{comparison.entries[i].error && ` · ${comparison.entries[i].error.message}`}</p>)}<p>Missing values split curves. Expand exact sample inspection for weighted species contributions.</p></details>
    <ScientificPlot key={comparison.revision} derived={derived} visibleIds={visible} theme={theme} currentRevision={session.revision} focusedId={plot.focusedSeriesId ?? null} onFocus={id => onView({ focusedSeriesId: id })} onExport={(type, svg, view) => {
      const data = { text: type === 'svg' ? svg : comparisonPackage(comparison, session.revision, visible, view), type: type === 'svg' ? 'image/svg+xml' : 'application/json', filename: `independent-solubility-r${comparison.revision}.${type}` }
      setArtifact(data)
      const url = URL.createObjectURL(new Blob([data.text], { type: data.type })), a = document.createElement('a')
      a.href = url; a.download = data.filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    }}/>
    <details><summary>Independent calculation provenance and diagnostics</summary><pre>{JSON.stringify(comparison, null, 2)}</pre></details>
    {artifact && <ExportPanel artifact={artifact} onClose={() => setArtifact(null)}/>}
  </section>
}
