import PlotExport from './PlotExport.jsx'
import {ResultSelectionContext} from './ResultSelectionContext.js'
import { responseDisplay, responseModes } from '../plots/responseSurface.js'
import { displayNumber as formatNumber, outputNumberType } from '../plots/formatNumber.js'
import CellDiagnostic from './CellDiagnostic.jsx'
import { useEffect, useMemo, useRef, useState, useContext } from 'react'
import { prepareSurface, surfaceFallbackMessage } from '../plots/surface3d.js'
import { createSurfaceRenderer } from '../plots/threeSurfaceRenderer.js'
import { surfacePng } from '../plots/surfaceFigure.js'
import { axisDisplayLabel, figureConditionLines } from '../plots/export.js'
import { colorRange } from '../plots/scalarMap.js'
import SurfaceControls from './SurfaceControls.jsx'
import { initializeSurfaceRenderer } from '../plots/surfaceLifecycle.js'
import AnalysisPanel from './AnalysisPanel.jsx'
import JsonDetails from './JsonDetails.jsx'

export default function Surface3D({model,summary,outcomes,settings,onView,onSlice,theme,currentRevision,onExport,guide}){
  const surface=useMemo(()=>prepareSurface(model,outcomes),[model,outcomes])
  const host=useRef(null),engine=useRef(null),callbacks=useRef({}),initialCamera=useRef(settings.surfaceCamera)
  const [hoverOrigin,setHoverOrigin]=useState(null)
  const shared=useContext(ResultSelectionContext)
  const [localHover,setLocalHover]=useState(null)
  const hover=shared?shared.hover:localHover,setHover=shared?shared.preview:setLocalHover
  const [error,setError]=useState(null),[timing,setTiming]=useState(null),[picture,setPicture]=useState(null)
  const pinned=shared?shared.pinned:Math.min(settings.gridPinned??0,surface.samples.length-1),sample=surface.samples[hover??pinned]
  const options=useMemo(()=>({theme,...responseDisplay({responseMode:settings.responseMode}),aspect:settings.surfaceAspect??'auto',colorRange:settings.colorRange,zRange:settings.surfaceZRange,surfaceContours:settings.surfaceContours,footprints:settings.surfaceFootprints,showMinimum:settings.showMinimum,showMaximum:settings.showMaximum,guide}),[theme,settings.responseMode,settings.surfaceAspect,settings.colorRange,settings.surfaceZRange,settings.surfaceContours,settings.surfaceFootprints,settings.showMinimum,settings.showMaximum,guide])
  useEffect(()=>{callbacks.current={onPick:(index,origin)=>{onView({gridPinned:index,surfacePick:origin});setHover(null)},onHover:(index,origin)=>{setHover(index);setHoverOrigin(origin)},onCamera:camera=>onView({surfaceCamera:camera}),onTiming:setTiming,onFailure:setError}},[onView,setHover])
  useEffect(()=>{engine.current=initializeSurfaceRenderer(createSurfaceRenderer,host.current,{onPick:(v,origin)=>callbacks.current.onPick(v,origin),onHover:(v,origin)=>callbacks.current.onHover(v,origin),onCamera:v=>callbacks.current.onCamera(v),onTiming:v=>callbacks.current.onTiming(v),onFailure:v=>callbacks.current.onFailure(v)},initialCamera.current);return()=>{engine.current?.dispose();engine.current=null}},[])
  useEffect(()=>{try{engine.current?.update(surface,options)}catch(e){callbacks.current.onFailure(e.message)}},[surface,options])
  useEffect(()=>{engine.current?.setPin(hover??pinned)},[hover,pinned,surface,options])
  const cr=colorRange(surface,settings.colorRange),[xa,ya]=surface.metadata.axes
  const pin=index=>{onView({gridPinned:index,surfacePick:null});setHover(null)}
  const origin=hover===null?settings.surfacePick:hoverOrigin
  return <section className="surface-workspace"><div className="plot-toolbar"><button onClick={()=>engine.current?.reset()}>Reset 3D view</button><PlotExport><button disabled={!!error} onClick={()=>{const url=surfacePng(engine.current.image(),surface,options,currentRevision);setPicture(url);const a=document.createElement('a');a.href=url;a.download=`adams-surface-r${surface.metadata.revision}.png`;a.click()}}>Export 3D PNG</button><button onClick={()=>onExport('json',null,{visualization:'3d',camera:engine.current?.cameraState(),pinned,settings:options})}>Export numerical JSON</button></PlotExport></div>
    <label className="response-mode">3D display<select aria-label="3D display mode" value={options.mode} onChange={e=>onView({responseMode:e.target.value})}>{responseModes.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
    <div className="surface-identities"><span>X · {axisDisplayLabel(xa,surface.metadata.componentNames)}</span><span>Y · {axisDisplayLabel(ya,surface.metadata.componentNames)}</span><strong>Z · {surface.series.descriptor?.label ?? surface.metadata.output.label} [{surface.metadata.output.unit}]</strong></div>
    <div className="surface-stage"><div ref={host} className="surface-canvas" role="group" aria-label="3D surface viewport"/><aside className="surface-colorbar"><div className="response-scale"><div className="response-gradient"/><div className="response-ticks">{Array.from({length:5},(_,i)=><span key={i}>{cr.min===null?'Unavailable':formatNumber(cr.max-(cr.max-cr.min)*i/4)}</span>)}</div></div><small>{surface.series.descriptor?.label} · {surface.metadata.output.unit}</small></aside></div>
    {error&&<p role="alert">{surfaceFallbackMessage} <button onClick={()=>onView({visualizationMode:'2d'})}>Use 2D Map</button><small>{error}</small></p>}
    <p className="scope-note">Height is linear in the displayed Z quantity; each axis is normalized for readability (aspect is view-only). Left drag: orbit · fixed distance and center; pan and zoom disabled. Inspection snaps to sampled vertices. Polygon interiors and contours are visualization interpolation only; no smoothing.</p>
    <p className="surface-legend">Surface / points: calculated · Red crosses: failed, equilibrium not established · Dots: unrun/cancelled · Dashes: calculated but Z unavailable. Footprints are non-data guides.</p>
    {surface.transitionQuads.length>0&&<p className="scope-note">{surface.transitionQuads.length} mesh cells cross a sampled solid-assemblage change and remain open. Valid vertices are retained; these gaps indicate unresolved continuity, not failed calculations or located phase boundaries.</p>}
    <SurfaceControls surface={surface} settings={settings} onView={onView}/>
    <details className="result-analysis"><summary>Analysis and sampled extrema</summary><AnalysisPanel domainOverlay={false} summary={summary} settings={settings} onView={onView} onPin={pin} onSlice={direction=>onSlice(direction,pinned)}/></details>
    <section className="inspection"><h3>{hover===null?'Pinned':'Hovered'} exact 3D sample</h3><label>Grid sample index<input type="number" min="0" max={surface.samples.length-1} value={pinned} onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=0&&n<surface.samples.length)pin(n)}}/></label><p>{origin?.source==='surface-interior'?'Graphical surface interior selected; snapped to a calculated vertex.':origin?.source==='floor-projection'?'Floor projection selected; snapped to the nearest requested sample. No equilibrium was calculated at the click location.':origin?.exactVertex?'Calculated vertex selected.':'Exact requested sample selected by index.'}</p><details><summary>Full-precision X / Y / Z</summary><pre>{JSON.stringify({x:sample.x,y:sample.y,z:sample.valid?sample.z:null,pointStatus:sample.pointStatus,origin:origin??null},null,2)}</pre></details><p>X: {axisDisplayLabel(xa,surface.metadata.componentNames)} = {formatNumber(sample.x,xa.quantity)}<br/>Y: {axisDisplayLabel(ya,surface.metadata.componentNames)} = {formatNumber(sample.y,ya.quantity)}</p><p>Z: {surface.series.descriptor?.name ?? surface.series.name} = {sample.valid?formatNumber(sample.z,outputNumberType(surface.metadata.output)):'Unavailable'} {surface.metadata.output.unit}</p>{sample.linearValue!==null&&sample.linearValue!==undefined&&<p>Underlying amount: {formatNumber(sample.linearValue,'amount')} {sample.linearUnit}</p>}<p>Index {sample.index} · X index {sample.ix} · Y index {sample.iy} · {sample.state} · revision {surface.metadata.revision}</p>{sample.reason&&<p>{sample.reason} · {sample.diagnostic}</p>}<CellDiagnostic outcome={outcomes[sample.index]} point={sample} descriptor={surface.series.descriptor}/><JsonDetails title="Exact point diagnostics and input" value={outcomes[sample.index]}/></section>
    <details><summary>Surface conditions, geometry and performance</summary>{figureConditionLines(surface.metadata).map((line,i)=><p key={i}>{line}</p>)}<p>Scene / first render submission {timing?.sceneAndFirstRenderMs.toFixed(2)??'pending'} ms · {surface.counts.valid}/{surface.counts.samples} valid samples · {surface.counts.triangles} triangles.</p><p>{surface.semantics}</p><button onClick={()=>setTiming(t=>({...t,...engine.current?.stats()}))}>Measure render submission</button>{timing?.meanFrameMs!==undefined&&<p>{timing.frames} submitted frames · mean CPU render submission {timing.meanFrameMs.toFixed(2)} ms · latest frame {timing.lastFrameMs?.toFixed(2)} ms. This is not a GPU completion guarantee.</p>}</details>
    {picture&&<details open><summary>PNG figure ready · raster only</summary><a href={picture} download={`adams-surface-r${surface.metadata.revision}.png`}>Save PNG figure</a><img src={picture} alt="Exported 3D scientific surface figure" style={{maxWidth:'100%'}}/><button onClick={()=>setPicture(null)}>Close PNG preview</button></details>}
  </section>
}
