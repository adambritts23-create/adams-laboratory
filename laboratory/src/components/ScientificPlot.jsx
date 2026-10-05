import SampleMarker from './SampleMarker.jsx'
import {selectedLegendOrder} from '../plots/selectedLegendOrder.js'
import PlotExport from './PlotExport.jsx'
import usePlotGestures from './usePlotGestures.js'
import { legendReadout } from '../plots/legendReadout.js'
import { diagramIdentity } from '../plots/diagramIdentity.js'
import {ResultSelectionContext} from './ResultSelectionContext.js'
import AqueousFractionInspection from './AqueousFractionInspection.jsx'
import { displayNumber as formatNumber, outputNumberType } from '../plots/formatNumber.js'
import usePlotBox from './usePlotBox.js'
import { useMemo, useRef, useState, useContext, useId } from 'react'
import { bounds, inspectPoint, mapPoint, nearestIndex, plotBox } from '../plots/geometry.js'
import { axisDisplayLabel, conditionLines, figureSvg, seriesColor } from '../plots/export.js'
import { pointStatusText } from '../plots/statusText.js'
import { logarithmicOutput, seriesLabel } from '../plots/presentation.js'

/** Rendering/inspection only: receives derived series, never invokes a solver. */
export default function ScientificPlot({ derived, visibleIds, theme, currentRevision, onExport, focusedId=null, onFocus, manualYRange, waterReferences=null }) {
  const markerId=useId()
  const surface = useRef(null)
  const box = usePlotBox(surface,plotBox,conditionLines(derived.metadata).length)
  const initial = useMemo(() => ({...bounds(derived.series, derived.metadata.axis, logarithmicOutput(derived.metadata.output.type), derived.metadata.output), ...(derived.metadata.defaultYRange?{yMin:derived.metadata.defaultYRange[0],yMax:derived.metadata.defaultYRange[1]}:{})}), [derived])
  const shared=useContext(ResultSelectionContext)
  const [localHover, setLocalHover] = useState(null), [localPinned, setLocalPinned] = useState(0)
  const indices=derived.metadata.slice?.indices,localIndex=i=>indices?indices.indexOf(i):i
  const pinned=shared?localIndex(shared.pinned):localPinned,hover=shared?(shared.hover===null?null:localIndex(shared.hover)):localHover
  const setPinned=i=>shared?shared.pin(indices?indices[i]:i):setLocalPinned(i),setHover=i=>shared?shared.preview(i===null?null:indices?indices[i]:i):setLocalHover(i)
  const [inspectionOpen,setInspectionOpen]=useState(false)
  const validManual=Number.isFinite(manualYRange?.min)&&Number.isFinite(manualYRange?.max)&&manualYRange.min<manualYRange.max
  const view = useMemo(()=>(validManual?{...initial,yMin:manualYRange.min,yMax:manualYRange.max}:initial),[initial,validManual,manualYRange])
  const focus = visibleIds.includes(focusedId) && derived.series.some(s=>s.id===focusedId) ? focusedId : null
  const svg = useMemo(() => figureSvg(derived, visibleIds, view, theme, currentRevision, box, focus, waterReferences), [derived, visibleIds, view, theme, currentRevision, box, focus, waterReferences])
  const coords = derived.series[0]?.points.map(p => p.x) ?? []
  const index = hover ?? Math.min(pinned, coords.length - 1), inspection = inspectPoint(derived, index)
  const location = event => {
    const rect = event.currentTarget.getBoundingClientRect()
    return (event.clientX - rect.left) / rect.width * box.width
  }
  const sample = event => nearestIndex(coords, view.xMin + (location(event)-box.left)/(box.right-box.left)*(view.xMax-view.xMin))
  const x = inspection.x === null ? null : mapPoint({ x: inspection.x, value: view.yMin }, view, box).x
  const figureHeight = box.height + conditionLines(derived.metadata).length * 21
  const gestures = usePlotGestures({count:coords.length,pinned,sample,preview:setHover,pin:i=>{setPinned(i);setInspectionOpen(true)}})
  const readout = legendReadout(derived,index,currentRevision,shared?.state?.redoxPresentation?.label)
  const focusedReadout=readout.rows.find(r=>r.id===focus),focusedSeries=derived.series.find(s=>s.id===focus)
  return <section data-diagram={diagramIdentity(derived.metadata.output.type)} className={`scientific-chart ${onFocus&&derived.series.length?'with-compact-legend':''}`}>
    {onFocus&&derived.series.length>0&&<div className="species-focus compact-plot-legend" data-sample-index={index} data-input-id={shared?.state?.result?.inputId} role="group" aria-label="Species focus · visualization only"><strong>Species · selected-sample abundance · click to focus</strong>{selectedLegendOrder(readout.rows,derived,index,currentRevision,shared?.state).filter(s=>visibleIds.includes(s.id)).map(s=><button key={s.id} data-carrier-id={s.id} aria-label={s.label} aria-pressed={focus===s.id} onClick={()=>onFocus(focus===s.id?null:s.id)}><span className="legend-swatch" style={{background:seriesColor(s.id,theme,derived.series.findIndex(item=>item.id===s.id))}} aria-hidden="true"/><span className="legend-name">{s.label}</span>{derived.metadata.output.type==='total-fraction'&&<small className="carrier-phase">{derived.series.find(row=>row.id===s.id)?.phase==='solid'?'Solid':'Aqueous'}</small>}</button>)}<button disabled={!focus} onClick={()=>onFocus(null)}>Clear focus</button></div>}
    {derived.metadata.output.type==='total-fraction'&&<small className="total-denominator-note">Aqueous species and solid phases share the same total analytical component denominator.</small>}
    {focusedReadout&&derived.metadata.output.type==='total-fraction'&&<div className="focused-carrier-readout" role="status" aria-label="Focused carrier at selected sample"><strong className="chemical-formula">{focusedReadout.label}</strong><span>{focusedSeries.phase==='solid'?'Solid phase':'Aqueous species'} · {axisDisplayLabel(derived.metadata.axis,derived.metadata.componentNames)} = {formatNumber(inspection.x,derived.metadata.axis.quantity)}</span><span>{focusedReadout.text}</span></div>}
    <div className="plot-toolbar" aria-label="Plot actions">
      <PlotExport><button onClick={() => onExport('svg', svg, {...view,waterReferences})}>Export SVG</button><button onClick={() => onExport('json', null, {...view,waterReferences})}>Export numerical JSON</button>
    </PlotExport></div>
    
    <div ref={surface} className="plot-surface fixed-sample-plot" role="group" aria-label="Interactive plot" title="Click to select a calculated sample. Arrow keys select adjacent samples; Home / End select endpoints. Fixed data viewport." {...gestures}>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <svg className="sample-marker-overlay" viewBox={`0 0 ${box.width} ${figureHeight}`} aria-hidden="true"><defs><clipPath id={markerId}><rect x={box.left} y={box.top} width={box.right-box.left} height={box.bottom-box.top}/></clipPath></defs><g clipPath={`url(#${markerId})`}><SampleMarker x={x} pinnedX={Number.isFinite(coords[pinned])?mapPoint({x:coords[pinned],value:view.yMin},view,box).x:null} top={box.top} bottom={box.bottom} points={inspection.values.filter(v=>visibleIds.includes(v.id)&&(!focus||focus===v.id)&&Number.isFinite(v.value)).map(v=>({id:v.id,y:mapPoint({x:inspection.x,value:v.value},view,box).y,color:seriesColor(v.id,theme,derived.series.findIndex(s=>s.id===v.id))}))}/></g></svg>
    </div>
    {derived.metadata.phaseChanges&&<details><summary>Sampled assemblage changes · triangles on axis</summary><p>Markers identify the later accepted sample, not an interpolated phase boundary.</p>{derived.metadata.phaseChanges.map(c=><p key={c.index}>pH {formatNumber(c.previousX,'pH')} → {formatNumber(c.x,'pH')}: {c.from.join(' + ')||'aqueous only'} → {c.to.join(' + ')||'aqueous only'}</p>)}</details>}
    <label>Inspection sample index<input type="number" min="0" max={coords.length-1} step="1" value={pinned<0?'':pinned} onChange={e => { const v = Number(e.target.value); if (Number.isInteger(v) && v >= 0 && v < coords.length) { setPinned(v); setHover(null); setInspectionOpen(true) } }} /></label>
    {index<0&&<p>The selected grid sample is outside this slice. Select a slice sample to inspect it.</p>}
    {index>=0&&<details className="sample-details" open={inspectionOpen||hover!==null}><summary onClick={e=>{e.preventDefault();setInspectionOpen(!inspectionOpen)}}>Exact sample · {formatNumber(inspection.x,derived.metadata.axis.quantity)} · {axisDisplayLabel(derived.metadata.axis, derived.metadata.componentNames)}</summary><section aria-label="Exact point inspection" className="inspection"><h3>{hover === null ? 'Pinned' : 'Hovered'} sample {index}</h3><p>{axisDisplayLabel(derived.metadata.axis, derived.metadata.componentNames)} = {formatNumber(inspection.x,derived.metadata.axis.quantity)}</p>
      <table><thead><tr><th>Series</th><th>Value (display rounded)</th><th>Calculation status</th></tr></thead><tbody>{inspection.values.filter(v => visibleIds.includes(v.id)).map(v => <tr key={v.id}><td className="chemical-formula" style={{ color: seriesColor(v.id, theme, derived.series.findIndex(s => s.id === v.id)) }}>{seriesLabel(derived.series.find(s=>s.id===v.id),derived.metadata.output.type)}</td><td>{readout.rows.find(r=>r.id===v.id)?.text??'Unavailable'}</td><td>{pointStatusText(v)}</td></tr>)}</tbody></table><p>{derived.metadata.output.unit}</p>
    {derived.metadata.output.type==='aqueous-fraction'&&<AqueousFractionInspection trace={inspection.values[0]?.fractionTrace} values={inspection.values} visibleIds={visibleIds}/>}
    {derived.metadata.output.type==='total-fraction'&&<section aria-label="Total component partition inspection"><h4>Fractions of total {shared?.state?.redoxPresentation?.label??inspection.values[0]?.fractionTrace?.component}</h4><p>Includes all aqueous and accepted solid carriers, even when curves are hidden. No renormalization.</p><table><thead><tr><th>Carrier</th><th>% of total component</th><th>% of dissolved component</th></tr></thead><tbody>{inspection.values.map(v=><tr key={v.id}><td className="chemical-formula">{seriesLabel(derived.series.find(s=>s.id===v.id),derived.metadata.output.type)}</td><td>{v.value===null?'Unavailable':formatNumber(100*v.value)}</td><td>{Number.isFinite(v.dissolvedFraction)?formatNumber(100*v.dissolvedFraction):'Not applicable / unavailable'}</td></tr>)}</tbody></table><details><summary>Exact total partition, closure and original precision</summary><pre>{JSON.stringify(inspection.values[0]?.fractionTrace,null,2)}</pre></details></section>}
    {derived.metadata.output.type==='log-concentration'&&inspection.values.filter(v=>visibleIds.includes(v.id)&&derived.series.find(s=>s.id===v.id)?.phase==='solid').map(v=><details key={'solid-amount:'+v.id}><summary className="chemical-formula">{v.name} · exact accepted solid amount</summary><p>{v.linearValue===null?'Unavailable':String(v.linearValue)+' mol/kg H₂O'}</p></details>)}
    {inspection.values.filter(v=>v.saturationTrace).map(v=><details key={'saturation:'+v.id}><summary>Actual saturation phase and exact dissolved quantity</summary><p>Controlling solid: {v.saturationTrace.solids.find(s=>s.id===v.saturationTrace.controllingSolidId)?.name??'No accepted saturated solid'}.</p><pre>{JSON.stringify(v.saturationTrace,null,2)}</pre></details>)}
    {inspection.values.filter(v=>visibleIds.includes(v.id)&&v.trace).map(v=><details key={v.id}><summary>{v.name} · exact solubility trace</summary><p>Component: {v.trace.component} · solid: {v.trace.solid}</p><p>{(v.trace.stale||currentRevision!==derived.metadata.revision)?'OLD sample — unavailable for current setup':'Stored calculated sample'}</p><table><thead><tr><th>Aqueous contributor</th><th>Coefficient</th><th>Molality</th><th>Weighted molality</th></tr></thead><tbody>{v.trace.contributors.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.coefficient}</td><td>{formatNumber(c.molality,'concentration')}</td><td>{formatNumber(c.weightedMolality,'concentration')}</td></tr>)}</tbody></table><p>Weighted dissolved total: {formatNumber(v.trace.weightedDissolvedTotal,'concentration')} mol/kg H₂O · log₁₀ solubility: {v.value===null?'Unavailable':formatNumber(v.value,outputNumberType(derived.metadata.output))}</p><p>{pointStatusText(v)}</p>{v.trace.solids&&<><p>Active assemblage: {v.trace.activeAssemblage.join(', ')||'Aqueous only'}</p><table><thead><tr><th>Candidate solid</th><th>Amount · mol/kg H₂O</th><th>Status</th><th>log saturation</th></tr></thead><tbody>{v.trace.solids.map(s=><tr key={s.id}><td>{s.name}</td><td>{formatNumber(s.amount,'amount')}</td><td>{s.status}</td><td>{formatNumber(s.logSaturation,'log')}</td></tr>)}</tbody></table><details><summary>Mass balance, saturation and rejected assemblages</summary><pre>{JSON.stringify({residuals:v.trace.residuals,selection:v.trace.selection,attempts:v.trace.attempts},null,2)}</pre></details></>}<details><summary>Exact trace JSON · original precision</summary><pre>{JSON.stringify(v.trace,null,2)}</pre></details></details>)}
    </section></details>}
  </section>
}
