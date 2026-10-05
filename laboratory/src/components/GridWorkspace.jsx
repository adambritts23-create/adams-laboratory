import {ResultSelectionContext} from './ResultSelectionContext.js'
import GridDiagnostics from './GridDiagnostics.jsx'
import ScientificTrace from './ScientificTrace.jsx'
import Surface3D from './Surface3D.jsx'
import { scientificSummary } from '../analysis/summary.js'
import { extractSlice } from '../analysis/slices.js'
import SliceView from './SliceView.jsx'
import ExportPanel from './ExportPanel.jsx'
import { useMemo, useState, useContext } from 'react'
import { deriveGridOutputs } from '../calculations/outputs.js'
import { gridModel,gridPackage } from '../plots/gridView.js'
import GridPlot from './GridPlot.jsx'
import AmountUnitSelect from './AmountUnitSelect.jsx'
export default function GridWorkspace({session,onView,busy}){
  const shared=useContext(ResultSelectionContext)
  const [artifact,setArtifact]=useState(null),[sliceSelection,setSliceSelection]=useState(null)
  const {system,grid}=session.lastPlot,plot=session.visualizationState.plot??{},theme=plot.theme??'dark'
  const request=useMemo(()=>({type:plot.type??'log-concentration',componentId:plot.componentId??null,redoxQuantity:plot.redoxQuantity??'pe'}),[plot.type,plot.componentId,plot.redoxQuantity])
  const derived=useMemo(()=>deriveGridOutputs(system,grid,request),[system,grid,request])
  const classification=null
  const baseModel=useMemo(()=>!['saturated-log-solubility','calculated-pH','calculated-redox','log-solubility','total-dissolved','log-total-dissolved','analytical-total'].includes(request.type)&&!plot.gridSeriesId?null:gridModel(derived,['saturated-log-solubility','calculated-pH','calculated-redox','log-solubility','total-dissolved','log-total-dissolved','analytical-total'].includes(request.type)?null:plot.gridSeriesId,classification),[derived,plot.gridSeriesId,classification,request.type])
  const summary=useMemo(()=>baseModel?scientificSummary(system,grid,derived,baseModel.series.id,{currentRevision:session.revision,threshold:plot.analysisThreshold??null}):null,[system,grid,derived,baseModel,session.revision,plot.analysisThreshold])
  const model=useMemo(()=>baseModel?{...baseModel,analysis:summary?.analysis}:null,[baseModel,summary])
  const slice=useMemo(()=>model&&sliceSelection&&sliceSelection.gridId===grid.gridId?extractSlice(derived,model.series.id,sliceSelection.direction,Math.min(sliceSelection.index,grid.outcomes.length-1)):null,[derived,model,sliceSelection,grid])
  const stale=grid.revision!==session.revision
  const download=(type,svg,state)=>{const text=type==='svg'?svg:gridPackage(system,grid,derived,{...state,selectedSeries:model.series,currentRevision:session.revision,stale,classification,scientificSummary:summary});const url=URL.createObjectURL(new Blob([text],{type:type==='svg'?'image/svg+xml':'application/json'}));const a=document.createElement('a');a.href=url;a.download=`adams-grid-r${grid.revision}.${type}`;setArtifact({text,type:type==='svg'?'image/svg+xml':'application/json',filename:a.download});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  return <section className={`plot-workspace grid-workspace ${theme}`}><div className="plot-heading"><h2>Equilibrium map</h2><button onClick={()=>onView({theme:theme==='dark'?'light':'dark'})}>{theme==='dark'?'Light':'Dark'} theme</button></div>
    <p role="status" className={stale?'stale-banner':'plot-status'}>{stale?(busy?'Conditions changed — updating. Map shows OLD conditions.':'Result stale — recalculate. Map shows OLD conditions.'):busy?'Calculating…':`${grid.status} · ${grid.counts.converged}/${grid.counts.requested} converged · ${grid.counts.failed} failed · ${grid.counts.notRun} not run`}</p>
    {request.type==='saturated-log-solubility'&&<p className="fraction-phase-note">Log total dissolved selected component at accepted solid saturation · mol/kg H₂O. Not Ksp or precipitated amount. Inspection identifies the actual accepted phase assemblage. Unsaturated and failed samples remain gaps; 2D and 3D reuse this same grid.</p>}
    {!derived.ok&&<p role="alert">{derived.diagnostics[0].message}</p>}
    {!model&&derived.ok&&<p role="status">Choose an available F species above. An excluded or unavailable identity is not replaced silently.</p>}
    <label>Visualization<select aria-label="Grid visualization" value={plot.visualizationMode??'2d'} onChange={e=>onView({visualizationMode:e.target.value})}><option value="2d">2D Map</option><option value="3d">3D Surface</option></select></label>
    {model&&plot.visualizationMode==='3d'&&<Surface3D key={grid.gridId+':'+model.series.id} model={model} summary={summary} outcomes={grid.outcomes} settings={plot} onView={onView} onSlice={(direction,index)=>setSliceSelection({direction,index,gridId:grid.gridId})} guide={sliceSelection?.gridId===grid.gridId?sliceSelection:null} theme={theme} currentRevision={session.revision} onExport={download}/>}
    {model&&plot.visualizationMode!=='3d'&&<GridPlot key={grid.gridId+':'+model.series.id} model={model} summary={summary} onSlice={(direction,index)=>setSliceSelection({direction,index,gridId:grid.gridId})} outcomes={grid.outcomes} settings={plot} onView={onView} theme={theme} currentRevision={session.revision} onExport={download}/>}
    <GridDiagnostics summary={summary} onInspect={index=>onView({gridPinned:index})}/>
    {model&&<ScientificTrace system={system} grid={grid} derived={derived} seriesId={model.series.id} index={shared?.index??plot.gridPinned} currentRevision={session.revision} onExport={setArtifact}/>}
    {slice&&<SliceView slice={slice} theme={theme} currentRevision={session.revision} onClose={()=>setSliceSelection(null)} onExport={(type,svg,view)=>setArtifact({text:type==='svg'?svg:JSON.stringify({kind:'exact-grid-slice-export',slice,view,scientificSummary:summary,currentRevision:session.revision},null,2),type:type==='svg'?'image/svg+xml':'application/json',filename:`adams-slice-r${grid.revision}.${type}`})}/>}
    {request.type==='log-concentration'||request.type==='log-solubility'?<details><summary>Concentration display units</summary><AmountUnitSelect label="Map concentration unit"/></details>:null}
    {artifact&&<ExportPanel artifact={artifact} onClose={()=>setArtifact(null)}/>}
    <details><summary>Scientific metadata and source warnings</summary><pre>{JSON.stringify(derived.metadata??derived,null,2)}</pre></details>
  </section>
}
