import {sweepHeading} from '../plots/resultViews.js'
import {defaultVisibleSeries} from '../calculations/diagramSetup.js'
import PourbaixWorkspace from './PourbaixWorkspace.jsx'
import FePourbaixWorkspace from './FePourbaixWorkspace.jsx'
import InteractiveBeaker from './InteractiveBeaker.jsx'
import PointResult from './PointResult.jsx'
import {ResultSelectionContext} from './ResultSelectionContext.js'
import {selectionReducer,selectedEquilibrium} from '../plots/resultSelection.js'
import IndependentSolubilityPlot from './IndependentSolubilityPlot.jsx'
import AnalysisPanel from './AnalysisPanel.jsx'
import { scientificSummary } from '../analysis/summary.js'
import ExportPanel from './ExportPanel.jsx'
import { useMemo, useState, useReducer, useCallback } from 'react'
import { deriveOutputs } from '../calculations/outputs.js'
import { conditionLines, resultPackage, seriesColor } from '../plots/export.js'
import ScientificPlot from './ScientificPlot.jsx'
import GridWorkspace from './GridWorkspace.jsx'
import { seriesLabel } from '../plots/presentation.js'
import AmountUnitSelect from './AmountUnitSelect.jsx'
import ExpandedPlot from './ExpandedPlot.jsx'

function download(text, type, filename) {
  const url = URL.createObjectURL(new Blob([text], { type })), a = document.createElement('a')
  a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export default function PlotWorkspace(props) { const snapshot=props.session.lastPoint??props.session.lastPlot;return <ExpandedPlot available={!!snapshot}><SelectedWorkspace key={snapshot?.result?.inputId??snapshot?.grid?.gridId??snapshot?.sweep?.sweepId??'none'} {...props}/></ExpandedPlot> }
function SelectedWorkspace(props){
 const snapshot=props.session.lastPoint??props.session.lastPlot,run=snapshot?.grid??snapshot?.sweep,count=run?.outcomes.length??1
 const [selection,dispatch]=useReducer(selectionReducer,{pinned:0,hover:null})
 const pin=useCallback(index=>dispatch({type:'pin',index,count}),[count]),preview=useCallback(index=>dispatch(index===null?{type:'leave'}:{type:'hover',index,count}),[count])
 const index=selection.hover??selection.pinned,state=useMemo(()=>selectedEquilibrium(props.session,index),[props.session,index])
 const shared={...selection,index,pin,preview,state,count,theme:props.session.visualizationState.plot?.theme??'dark'}
 const onView=patch=>{if(Object.hasOwn(patch,'gridPinned')){pin(patch.gridPinned);const rest={...patch};delete rest.gridPinned;if(Object.keys(rest).length)props.onView(rest)}else props.onView(patch)}
 return <ResultSelectionContext.Provider value={shared}><div className="result-split"><div className="result-plot">{snapshot?.pourbaix?<PourbaixWorkspace {...props}/>:snapshot?.publicFe?<FePourbaixWorkspace {...props}/>:snapshot?.result?<PointResult result={snapshot.result}/>:snapshot?.comparison?<IndependentSolubilityPlot {...props}/>:snapshot?.grid?<GridWorkspace {...props} onView={onView}/>:<SweepWorkspace {...props}/>}</div><InteractiveBeaker/></div></ResultSelectionContext.Provider>
}
function SweepWorkspace({ session, repository, onView, busy }) {
  const plot = session.visualizationState.plot ?? {}, snapshot = session.lastPlot
  const [artifact,setArtifact]=useState(null)
  const [search, setSearch] = useState(''), [phase, setPhase] = useState('all')
  const request = useMemo(() => ({ type: plot.type ?? 'log-concentration', componentId: plot.componentId ?? null, redoxQuantity: plot.redoxQuantity ?? 'pe' }), [plot.type, plot.componentId, plot.redoxQuantity])
  const derived = useMemo(() => snapshot ? deriveOutputs(snapshot.system, snapshot.sweep, !['total-fraction','aqueous-fraction'].includes(request.type)&&snapshot.sweep.definition.calculationDefinition.mixedSolubility ? {type:'saturated-log-solubility',...snapshot.sweep.definition.calculationDefinition.mixedSolubility} : request, {currentRevision:session.revision}) : null, [snapshot, request, session.revision])
  const analysisId=derived?.series?.find(s=>s.id===plot.analysisSeriesId)?.id??derived?.series?.[0]?.id
  const summary=useMemo(()=>derived?.ok?scientificSummary(snapshot.system,snapshot.sweep,derived,analysisId,{currentRevision:session.revision,threshold:plot.analysisThreshold??null}):null,[derived,snapshot,analysisId,session.revision,plot.analysisThreshold])
  const catalog = derived?.series ?? (['log-concentration','log-activity','fraction'].includes(request.type) ? [
    ...session.chemicalSystem.selectedComponents.map(id => repository.getComponentById(id)).filter(Boolean).map(c => ({ id:c.id, name:c.name, phase:c.role==='solvent'?'liquid':'aqueous', kind:['solvent','electron'].includes(c.role)?'special':'free-component', provenance:'source-component' })),
    ...session.chemicalSystem.selectedSpecies.map(id => repository.getSpeciesById(id)).filter(Boolean).map(s => ({id:s.id,name:s.displayName,phase:s.phase,kind:'reaction-product',provenance:s.metadata?.rawUserRecord?'user-defined':s.sourceDatabase==='local-demo-v1'?'demo / no constants':'imported'})),
  ] : [])
  const series = catalog.map(s=>{const c=snapshot?.system.components.find(c=>c.id===s.id)??repository.getComponentById(s.id);return c?.source?.provenance?.kind==='user-defined'||c?.provenance?.kind==='user-defined'?{...s,provenance:'user-defined'}:s})
  const visible = plot.visibleIds ?? (snapshot?.imposedEh?series.filter(s=>s.kind!=='special').map(s=>s.id):defaultVisibleSeries(series,request.type))
  const theme = plot.theme ?? 'dark', stale = snapshot && snapshot.sweep.revision !== session.revision
  const water=snapshot?.imposedEh?.waterReferences
  return <section className={`plot-workspace ${theme}`}>
    <div className="plot-heading"><div><h2>{sweepHeading(derived)}</h2></div><button onClick={() => onView({ theme: theme === 'dark' ? 'light' : 'dark' })}>{theme === 'dark' ? 'Light' : 'Dark'} plot theme</button></div>
    <p role="status" className={stale ? 'stale-banner' : 'plot-status'}>{stale ? busy ? 'Conditions changed — updating. Plot shows OLD conditions.' : 'Result stale — recalculate. Plot shows OLD conditions.' : busy ? 'Calculating — previous validated result remains visible.' : snapshot ? snapshot.sweep.status==='completed'?'Calculated curves':'Calculated with missing points' : 'Choose an axis, enter fixed conditions, then Calculate.'}</p>
    {snapshot?.closedReagents?.closed.generic&&<p>Automatic closed composition · pH and Eh calculated from equilibrium. X is supplied source total; curves show residual equilibrium amounts. Conditional source scope; unavailable samples remain gaps.</p>}
    {snapshot?.closedReagents&&!snapshot.closedReagents.closed.generic&&<p className="fraction-phase-note">Closed reagent / automatic redox · conditional Step-5 aqueous scope. X: supplied H₂O₂. Species curves: residual equilibrium amounts. pH and Eh are derived; view changes reuse these accepted samples.</p>}
    {snapshot?.imposedEh&&<p className="fraction-phase-note">Imposed potential · {snapshot.imposedEh.request.mode==='fixed'?`fixed Eh ${snapshot.imposedEh.request.fixedEh??0} V vs SHE`:`fixed pH ${snapshot.imposedEh.request.pH}`}. Internal integration evidence; not independently validated across this potential range. Carrier colors are not oxidation-state colors.</p>}
    {snapshot?.imposedEh&&snapshot.imposedEh.request.mode!=='fixed'&&<div className="water-reference-control">{water?.status==='available'?<><label><input type="checkbox" checked={plot.showWaterReferences??true} onChange={e=>onView({showWaterReferences:e.target.checked})}/> Show water-stability references</label>{(plot.showWaterReferences??true)&&<p>H₂ reference: {water.references.find(r=>r.name==='H2(g)').Eh.toFixed(6)} V · O₂ reference: {water.references.find(r=>r.name==='O2(g)').Eh.toFixed(6)} V vs SHE. Nominal water-stability window between them. Unit normalized H₂/O₂ fugacity and a(H₂O) = 1; gases are not included in the equilibrium solve. {water.interpretation}</p>}</>:<p>Water references unavailable: {water?.reason??'not recorded for this result'}.</p>}</div>}
    {request.type==='total-fraction'&&<p className="fraction-phase-note">Fractions of the total analytical component: aqueous species plus accepted solids. Their sum is checked at the existing component-balance tolerance.</p>}
    {request.type==='saturated-log-solubility'&&<p className="fraction-phase-note">The curve is total dissolved component, not the amount of a named precipitate. Saturation may be controlled by any included solid; inspection identifies the actual accepted phase.</p>}
    {request.type==='aqueous-fraction'&&<p className="fraction-phase-note">Aqueous speciation: curves marked (aq) partition the dissolved component only. A dissolved complex is not a precipitate; accepted solids are listed separately in the Beaker and inspection.</p>}
    {derived && !derived.ok && <p role="status">{derived.diagnostics.map(d => d.message).join(' ')}</p>}
    {derived?.ok && <details><summary>Conditions and scientific provenance</summary>{conditionLines(derived.metadata).map(line => <p key={line}>{line}</p>)}<pre>{JSON.stringify(derived.metadata,null,2)}</pre></details>}
    {series.length > 0 && <>
      <details className="series-panel"><summary>Shown species · visibility only</summary>{request.type==='log-concentration'&&<p>Aqueous curves show molality. Optional solid curves show log amount per kg water; they are not aqueous concentrations.</p>}
        <div className="series-filters"><label>Search plotted series<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label><label>Series phase<select value={phase} onChange={e => setPhase(e.target.value)}>{['all','aqueous','solid','gas','liquid','special','derived'].map(p => <option key={p}>{p}</option>)}</select></label><button onClick={() => onView({ visibleIds: series.map(s => s.id) })}>Show all series</button><button onClick={() => onView({ visibleIds: [] })}>Hide all series</button><button onClick={() => onView({ visibleIds: series.filter(s => s.kind === 'free-component').map(s => s.id) })}>Show basis/free species</button><button onClick={() => onView({ visibleIds: series.filter(s => s.kind === 'reaction-product' && s.phase === 'aqueous').map(s => s.id) })}>Show automatic products</button></div>
        <div className="series-legend">{series.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) && (phase === 'all' || phase === (s.kind === 'special' ? 'special' : s.phase))).map(s => <label key={s.id}><input type="checkbox" checked={visible.includes(s.id)} onChange={() => onView({ visibleIds: visible.includes(s.id) ? visible.filter(id => id !== s.id) : [...visible,s.id] })}/><span style={{ color: seriesColor(s.id,theme,series.findIndex(item => item.id === s.id)) }} title={`${s.phase} · ${s.provenance}`}>{seriesLabel(s,request.type)}</span>{s.provenance==='user-defined'&&<small>Unverified</small>}</label>)}</div>
      </details>
    </>}
    {derived?.ok && derived.series.length>0 && <>
      {derived.series.length===1&&derived.series[0].points.some(p=>p.value===null)&&<p role="status" className="output-availability">{derived.series[0].points.filter(p=>p.value!==null).length} / {derived.series[0].points.length} output samples available. Missing values remain gaps; inspect a sample for its reason.</p>}
      {derived.metadata.phaseChanges&&<p>One shared mixed equilibrium · unsaturated values remain gaps. {derived.series.map(s=>`${seriesLabel(s,request.type)}: ${s.points.filter(p=>p.value!==null).length}/${s.points.length} solubility samples`).join(' · ')}. Inspect any sample for dissolved totals and solid status.</p>}
      <ScientificPlot key={`${snapshot.sweep.sweepId}:${request.type}:${request.componentId}:${request.redoxQuantity}:${JSON.stringify(plot.yRange)}`} derived={derived} visibleIds={visible} theme={theme} waterReferences={(plot.showWaterReferences??true)?water:null} currentRevision={session.revision} manualYRange={plot.yRange} focusedId={plot.focusedSeriesId??null} onFocus={id=>onView({focusedSeriesId:id})} onExport={(type, svg, view) => {const artifact={text:type === 'svg' ? svg : resultPackage(snapshot.system,snapshot.sweep,derived,visible,{...view,redoxPresentation:snapshot.imposedEh?.redoxPresentation??null,scientificSummary:summary},session.revision),type:type === 'svg' ? 'image/svg+xml' : 'application/json',filename:`adams-laboratory-r${snapshot.sweep.revision}.${type}`};setArtifact(artifact);download(artifact.text,artifact.type,artifact.filename)}} />
      <details className="result-analysis"><summary>Analysis and sampled extrema</summary><label>Analysis series<select value={analysisId??''} onChange={e=>onView({analysisSeriesId:e.target.value})}>{derived.series.map(s=><option key={s.id} value={s.id}>{seriesLabel(s,request.type)}</option>)}</select></label><AnalysisPanel summary={summary} settings={plot} onView={onView}/></details>
      <details><summary>Output definition / export help</summary><p>{derived.metadata.output.formula}. Export JSON alongside SVG for raw data and provenance.</p></details>
    </>}
    {derived?.ok&&derived.series.length===0&&<p role="status">No included species supports this output.</p>}
    {artifact&&<ExportPanel artifact={artifact} onClose={()=>setArtifact(null)}/>}
    {['log-concentration','log-solubility'].includes(request.type)&&<details><summary>Concentration display units</summary><AmountUnitSelect label="Plot concentration unit"/></details>}
  </section>
}
