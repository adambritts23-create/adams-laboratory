import './CalculationWorkspace.css'
import ResultViewControls from './ResultViewControls.jsx'
import {resultSession} from '../plots/resultViews.js'
import ProblemSummary from './ProblemSummary.jsx'
import {boundaryComponents,normalizeAutomaticDefinition} from '../calculations/automaticBoundaries.js'
import PredominanceArea from './PredominanceArea.jsx'
import EquilibriumConstraints from './EquilibriumConstraints.jsx'
import {configureGeneralClosed} from '../calculations/generalClosedSetup.js'
import ClosedReagentSetup from './ClosedReagentSetup.jsx'
import ClosedNetworkReview from './ClosedNetworkReview.jsx'
import GeneralClosedPanel from './GeneralClosedPanel.jsx'
import {discoverGeneralClosed} from '../thermodynamics/generalClosedReagents.js'
import ImposedEhSetup from './ImposedEhSetup.jsx'
import PourbaixSetup from './PourbaixSetup.jsx'
import DiagramSwitcher from './DiagramSwitcher.jsx'
import { diagramTransition } from '../session/diagramNavigation.js'
import { diagramIdentity } from '../plots/diagramIdentity.js'
import SurfaceResponseControls from './SurfaceResponseControls.jsx'
import { diagramTypes, diagramType, diagramUnavailable } from '../calculations/diagramSetup.js'
import { chemicalLabel } from '../chemistry/format.js'
import {outputDefinitions} from '../calculations/outputs.js'
import {concentrationLogOutput} from '../plots/formatNumber.js'
import {editFixedCondition} from '../calculations/setupEditing.js'
import IndependentSolubilitySetup from './IndependentSolubilitySetup.jsx'
import { defaultSolubilityComparison, solubilityPairs } from '../calculations/independentSolubility.js'
import { useEffect, useRef, useState } from 'react'
import { calculatedConditions, workspaceMode } from '../plots/workspaceView.js'
import JsonDetails from './JsonDetails.jsx'
import PlotWorkspace from './PlotWorkspace.jsx'
import AxisControls from './AxisControls.jsx'
import FixedCondition from './FixedCondition.jsx'
import PointResult from './PointResult.jsx'
import OutputControls from './OutputControls.jsx'
import MapOutput from './MapOutput.jsx'

export default function CalculationWorkspace({ onIronCeriumExample, onClosedExample, onFeExample, onRedoxExample, feAvailable, onMetalLigandExample, onSurfaceExample, onMixedExample, exampleError, session, repository, onChange: changeDefinition, onView, onCalculate, onSweep, onCancel, pointFeedback, busy, reactionSet, onReview }) {
  const components=boundaryComponents(session.chemicalSystem.selectedComponents.map(id=>repository.getComponentById(id)).filter(Boolean),repository),d=normalizeAutomaticDefinition(session.calculationDefinition,components)
  const onChange=(definition,...args)=>changeDefinition(normalizeAutomaticDefinition(definition,components),...args)
  const [closedAudit,setClosedAudit]=useState(null)
  const discoveryKey=JSON.stringify([session.chemicalSystem.selectedComponents,session.chemicalSystem.excludedSpecies,session.chemicalSystem.optionalSpecies,!!d.closedReagents])
  useEffect(()=>{let current=true;discoverGeneralClosed(repository,session.chemicalSystem.selectedComponents,{reviewedScope:!!d.closedReagents}).then(a=>{if(current)setClosedAudit({key:discoveryKey,audit:a})});return()=>{current=false}},[repository,discoveryKey,d.closedReagents,session.chemicalSystem.selectedComponents])
  const audit=closedAudit?.key===discoveryKey?closedAudit.audit:null
  const custom=!!(session.chemicalSystem.excludedSpecies?.length||session.chemicalSystem.optionalSpecies?.length)
  const closedReason=custom?'Custom reaction exclusions/additions require a separately reviewed closure scope.':!audit?'Source-network audit pending.':!audit.canCalculate?audit.reasons.map(r=>r.message).join(' '):null
  const setClosedMode=()=>{if(closedReason)return;onChange(configureGeneralClosed(d,components),{type:'log-concentration',componentId:null,live:false},{manual:true})}
  const allowedPairs=solubilityPairs.filter(p=>components.some(c=>c.name===p.component))
  const dimensions=d.dimensions??(d.independentVariables.length===2?2:1)
  const editFixed=condition=>onChange(editFixedCondition(d,condition))
  const plot=session.visualizationState.plot??{}, selectedDiagram=diagramType(d,plot)
  const [switchNotice,setSwitchNotice]=useState(null)
  const chooseDiagram=id=>{
    const next=diagramTransition(session,id,components,reactionSet)
    setSwitchNotice(next.message)
    if(next.kind==='unavailable')return
    if(next.definitionChanged)onChange(next.definition,next.plot,{manual:true})
    else onView(next.plot)
    if(next.kind==='reuse')setResultView({snapshot,plot:{...acceptedPlot,...next.plot}})
    setNavigation({mode:next.kind==='reuse'?'results':'setup',submission:null})
  }
  const solidName=reactionSet?.solidCount===1?reactionSet.rows.find(r=>r.included&&r.species.phase==='solid')?.species.name:null
  const inventories=components.filter(c=>c.role==='basis-choice')
  const primaryOutput=['total-fraction','aqueous-fraction','saturated-log-solubility'].includes(selectedDiagram)
  const outputControls=<OutputControls hideSelector session={session} components={components} onView={onView} mixed={!!d.mixedSolubility} hasSolid={!!d.mixedSolubility||(reactionSet?.automaticSolids ? reactionSet.solidCount > 0 : reactionSet?.solidCount===1)} solidName={solidName} label={dimensions===2?'Advanced Z response':'Specialized output'}/>
  const current=session.gridResult??session.sweepResult
  const snapshot=session.lastPoint??session.lastPlot
  const [resultView,setResultView]=useState(()=>({snapshot,plot}))
  // Capture the view once per accepted calculation; later setup edits cannot overwrite it.
  if(resultView.snapshot!==snapshot)setResultView({snapshot,plot})
  const acceptedPlot=resultView?.snapshot===snapshot?resultView.plot:plot
  const onResultView=patch=>setResultView({snapshot,plot:{...acceptedPlot,...patch}})
  const acceptedSession=resultSession(session,acceptedPlot)
  const [navigation,setNavigation]=useState(()=>({mode:snapshot?'results':'setup',submission:null}))
  const results=workspaceMode(navigation,snapshot)==='results', resultHost=useRef(null)
  const shown=snapshot?.result??snapshot?.comparison??snapshot?.grid??snapshot?.sweep, stale=shown&&shown.revision!==session.revision
  const conditions=calculatedConditions(snapshot)
  const submit=()=>{setSwitchNotice(null);setNavigation(results?{mode:'results',submission:null}:{mode:'setup',submission:{previous:snapshot}});if(results&&snapshot?.result&&!d.closedReagents)onCalculate();else onSweep()}
  const displayedSnapshot=results?snapshot:null
  useEffect(()=>{
    let settledFrame
    const frame=requestAnimationFrame(()=>{settledFrame=requestAnimationFrame(()=>{if(results){resultHost.current?.focus({preventScroll:true});resultHost.current?.scrollIntoView({block:'start'})}})})
    return ()=>{cancelAnimationFrame(frame);cancelAnimationFrame(settledFrame)}
  },[results,displayedSnapshot])
  const plotAction=<button className="calculate plot-action" disabled={busy} onClick={submit}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 3v18h18M5 16l5-7 4 4 6-8"/></svg>{busy?'Calculating…':'Plot diagram'}</button>
  const diagramSelector=<DiagramSwitcher selected={selectedDiagram} definition={d} components={components} reactionSet={reactionSet} busy={busy} onSelect={chooseDiagram} outputType={plot.type} onOutput={type=>{onView({type,visibleIds:null,classify:false,colorRange:null,yRange:null});setSwitchNotice("View changed; calculation inputs are unchanged. Availability is checked against the accepted result.")}}/>
  if(d.predominanceArea)return <main className="instrument-workspace calculation-layout area-layout">{switchNotice&&<p className="diagram-switch-notice" role="status">{switchNotice}</p>}<PredominanceArea onPlot={()=>setSwitchNotice(null)} diagramSelector={diagramSelector} session={session} repository={repository} components={components} onChange={definition=>onChange(definition,{type:'predominance',live:false},{manual:true})}/></main>
  if(d.generalClosed)return <main className="instrument-workspace calculation-layout"><button onClick={()=>onChange(d.generalClosed.ordinaryDefinition,{type:'log-concentration',live:false},{manual:true})}>Return to imposed / analytical constraints</button><GeneralClosedPanel session={session} repository={repository} audit={custom?null:audit} unavailableReason={closedReason} onChange={definition=>onChange(definition,undefined,{manual:true})}/></main>
  return <main data-diagram={diagramIdentity(selectedDiagram)} ref={resultHost} tabIndex={-1} className={`instrument-workspace calculation-layout graph-first no-fixed ${results?'results-mode':'setup-mode'}`}>
    {snapshot&&<section className="results-toolbar" aria-label="Results workspace"><div className="results-actions"><button className="back-to-setup" title="Collapse results and return to diagram settings" onClick={()=>setNavigation({mode:'setup',submission:null})}><span aria-hidden="true">←</span> Back to setup</button><h2>Results</h2><button className="calculate" disabled={busy} onClick={submit}>{busy?'Calculating…':'Recalculate'}</button>{busy&&<button onClick={onCancel}>Cancel</button>}<small>{shown?.counts?.converged??(snapshot?.result?1:0)} / {shown?.counts?.requested??(snapshot?.result?1:0)} points calculated</small></div>{stale&&<p className="stale-banner">Settings changed · results show the previous calculation</p>}<details className="result-run-details"><summary>Calculation details</summary>{conditions.map((line,i)=><p key={i}>{line}</p>)}</details></section>}
    {snapshot&&!results&&<button className="reopen-results" onClick={()=>setNavigation({mode:'results',submission:null})}>Reopen retained results{stale?' · old conditions':''}</button>}
    {(d.closedReagents||d.imposedEh||selectedDiagram==='pourbaix'||d.solubilityComparison)&&diagramSelector}
    {switchNotice&&<p className="diagram-switch-notice" role="status">{switchNotice}</p>}
    {pointFeedback&&<div className="request-feedback" role="alert"><strong>Calculation needs attention</strong><p>{pointFeedback.message}</p>{pointFeedback.diagnostics?.map((item,i)=><p key={i}>{item.message}</p>)}{results&&<button onClick={()=>setNavigation({mode:'setup',submission:null})}>Review setup</button>}{snapshot&&<small>The retained graph belongs to its displayed calculation; this message does not establish a new equilibrium.</small>}</div>}
    {results&&shown?.counts?.converged===0&&<p role="alert">No requested point converged. The plot contains no accepted equilibrium values; open diagnostics for the failed or unrun samples.</p>}
    <section className="calculation-setup">{(d.closedReagents||d.imposedEh||selectedDiagram==='pourbaix'||d.solubilityComparison)&&<div className="setup-title">{plotAction}</div>}
      {d.closedReagents?<ClosedReagentSetup definition={d} onChange={onChange}/>:d.imposedEh?<ImposedEhSetup session={session} repository={repository} onChange={onChange}/>:selectedDiagram==='pourbaix'?<PourbaixSetup session={session} repository={repository} onChange={onChange}/>:d.solubilityComparison?<IndependentSolubilitySetup allowedPairIds={allowedPairs.map(p=>p.id)} conditions={d} config={d.solubilityComparison} onChange={config=>onChange({...d,solubilityComparison:config})}/>:<>
              {primaryOutput&&!(d.mixedSolubility&&selectedDiagram==='saturated-log-solubility')&&<label>{['total-fraction','aqueous-fraction'].includes(selectedDiagram)?'Distributed component':'Dissolved component'}<select aria-label="Diagram component" value={plot.componentId??''} onChange={e=>onView({componentId:e.target.value,visibleIds:null})}><option value="">Choose component</option>{inventories.map(c=><option key={c.id} value={c.id}>{chemicalLabel(c.name)}</option>)}</select></label>}
      <div className="diagram-editor" data-dimensions={dimensions}><div className="diagram-ordinate"><details open className="output-setup axis-role" data-axis-role={dimensions===2?'z':'output'} aria-label={dimensions===2?'Z / Response':'Diagram output'}><summary>{dimensions===2?'Z / output':'Y / output'}</summary><h3>{dimensions===2?'Z / Response':'View details'}</h3>
        {selectedDiagram==='log-concentration'&&<p>Equilibrium aqueous species from the current System are shown automatically. Hide or show curves after plotting.</p>}

        {selectedDiagram==='total-fraction'&&<p>All aqueous and accepted solid carriers as fractions of the supplied analytical component total, weighted by component stoichiometry.</p>}
        {selectedDiagram==='aqueous-fraction'&&<p>How the component is distributed among its aqueous forms. Solids are excluded from normalization.</p>}
        {selectedDiagram==='saturated-log-solubility'&&<p>{solidName?<>Solid: <strong>{chemicalLabel(solidName)}</strong>. </>:null}Dissolved inventory at saturation. Unsaturated and failed states remain gaps.{d.mixedSolubility?' The selected mixed-system components share one equilibrium.':''}</p>}
        {selectedDiagram==='calculated-pH'&&<><label>Dependent coordinate<select value="pH" onChange={()=>{}}><option>pH</option><option disabled>Eh — general redox closure unavailable</option></select></label><p>Supply the signed proton balance below and vary another component. pH is calculated from equilibrium, rather than fixed as an input.</p></>}
        {dimensions===2&&<><SurfaceResponseControls session={session} repository={repository} onView={onView}/><small>View the calculated response as a 2D map or 3D surface in Results.</small></>}
        <small>{dimensions===1?'Y':'Z'} range: automatic from data{concentrationLogOutput(plot.type??'log-concentration')?(plot.type==='log-concentration'?' · display floor 10⁻⁹':' · concentration floor −20'):''}</small>
        {dimensions===1&&!d.solubilityComparison&&<><label className="inline-check"><input type="checkbox" checked={!!plot.yRange} onChange={e=>onView({yRange:e.target.checked?{min:null,max:null}:null})}/>Manual Y range</label>{plot.yRange&&<div className="axis-range">{['min','max'].map(key=><label key={key}>Y {key}<input type="number" step="any" value={plot.yRange[key]??''} onChange={e=>onView({yRange:{...plot.yRange,[key]:e.target.value===''?null:Number(e.target.value)}})}/></label>)}</div>}<details><summary>Range and solid overlays</summary><p>Manual bounds apply when both are finite and minimum is below maximum. Enable solid overlays in Results → Shown species. Solid amounts are per kg water, not aqueous concentrations.</p></details></>}
      </details>{dimensions===2&&<AxisControls index={1} definition={{...d,dimensions}} components={components} onChange={onChange} diagram={selectedDiagram}/>}</div><section className="diagram-preview" aria-label="Diagram setup preview"><div className="diagram-preview-toolbar">{diagramSelector}{plotAction}</div><div className="diagram-sketch" aria-hidden="true"><span>{dimensions===2?'Z: selected equilibrium response':'Y: '+(selectedDiagram==='calculated-pH'?'calculated pH':outputDefinitions[plot.type]?.label??'equilibrium result')}</span><small>Setup preview · Plot to calculate</small><span>X → {d.independentVariables[0]?.quantity??'choose coordinate'}</span></div></section><AxisControls index={0} definition={{...d,dimensions}} components={components} onChange={onChange} diagram={selectedDiagram}/>
      <section className="composition-setup"><h3 className="component-heading">Fixed composition </h3><div className="compact-conditions" aria-label="Fixed component conditions">{d.componentConditions.filter(condition=>!condition.inferred&&!['solvent','electron'].includes(components.find(c=>c.id===condition.componentId)?.role)&&condition.mode!=='LA').map(condition=><FixedCondition compact key={condition.componentId} component={components.find(c=>c.id===condition.componentId)} condition={condition} onChange={editFixed}/>)}</div></section><div className="diagram-conditions" aria-label="Calculation conditions"><h3>Conditions</h3><label>Temperature<input className="field-readonly" aria-label="Temperature" value={d.temperature.value} readOnly/>°C</label><label>Pressure<input className="field-readonly" aria-label="Pressure" value={d.pressure.value} readOnly/>bar · declared</label><label>Activity model<select aria-label="Activity model" value={d.activityModel} onChange={e=>onChange({...d,activityModel:e.target.value})}><option value="unspecified">Not chosen</option><option value="ideal">Ideal</option></select></label><label>Ionic strength<select value={d.ionicStrength.mode} onChange={e=>onChange({...d,ionicStrength:{mode:e.target.value,value:e.target.value==='fixed'?0:null,unit:'mol/kg-H2O'}})}><option value="automatic">Automatic · not evaluated</option><option value="fixed">Declared zero mol/kg H₂O</option></select></label><details><summary>Selected phases</summary><small>Phase filters: {d.enabledPhases.join(', ')} · <button onClick={onReview}>Review included phases</button> · Gas equilibrium unsupported</small></details></div></div>

      </>}
      <details className="calculation-secondary"><summary>Boundary conditions and reagent mixing</summary>
      <EquilibriumConstraints definition={d} components={components} repository={repository} onChange={definition=>onChange(definition,{type:'log-concentration',componentId:null,live:false},{manual:true})}/>
      <section aria-label="Closed redox mixing"><h3>Mix reagents · calculate pH and Eh</h3><p>Supply starting ionic forms and their counterions. Electron exchange is internal; do not select e⁻ or impose Eh for this mode.</p><button onClick={onIronCeriumExample} disabled={busy}>Load Fe(II) + Ce(IV) mixing example</button><button onClick={setClosedMode} disabled={busy||!!closedReason}>Use selected reagents for closed equilibrium</button>{closedReason&&<small>{closedReason}</small>}</section>
      <details><summary>Advanced source-network audit · {audit?.canCalculate?'available':'unavailable'}</summary><ClosedNetworkReview audit={audit}/>{closedReason&&<p role="status">{closedReason}</p>}{!closedReason&&<button onClick={setClosedMode}>Use closed physical preparation (derived pH and Eh)</button>}</details>
      </details>
      <ProblemSummary definition={d} components={components}/><div hidden={!!d.closedReagents} className="setup-footer"><small>Ideal 25 °C · 1 bar · {(d.imposedEh||selectedDiagram==='pourbaix'||d.mixedSolubility||d.gridMultiSolid||reactionSet?.automaticSolids)?'bounded multi-solid equilibrium':'at most one solid'}. Boundary conditions determine whether pH and electron activity are imposed or derived.</small>{busy&&<button onClick={onCancel}>Cancel</button>}</div>
      {current?.counts.failed>0&&<p role="alert">{current.counts.failed} requested points could not be calculated. Missing values remain blank; detailed reasons are available below.</p>}
    </section>
    <div className="graph-column" hidden={!snapshot||!results}><ResultViewControls snapshot={snapshot} plot={acceptedPlot} onView={onResultView}/><PlotWorkspace session={acceptedSession} repository={repository} onView={onResultView} busy={busy}/></div>
    <details className="setup-extras"><summary>Examples and advanced setup</summary><div className="setup-reference"><div className="diagram-choice-controls"><div className="example-buttons" aria-label="Examples"><button onClick={onClosedExample}>Load reviewed Fe(II) / H₂O₂ closed addition</button><button disabled={!feAvailable} onClick={onFeExample}>Load Fe Pourbaix</button><button onClick={()=>onRedoxExample('Cu')}>Load Cu Pourbaix</button><button onClick={()=>onRedoxExample('U')}>Uranium readiness</button><button onClick={onMetalLigandExample}>Load Ni–ammonia response surface</button><small>Closed aqueous ammonia inventory · ideal 25 °C · all three compatible Ni solids considered.</small>
      <button onClick={()=>onSurfaceExample(false)}>Load carbonate → bicarbonate surface</button><button onClick={()=>onSurfaceExample(true)}>Load mixed dissolved-Ca surface · multi-solid opt in</button>
      <button onClick={onMixedExample}>Load validated mixed Ca–carbonate–Mg example · opt in</button>{exampleError&&<p role="alert">{exampleError}</p>}</div>{d.mixedSolubility&&<p>Mixed equilibrium · bounded multi-solid selection enabled explicitly. Choose saturated solubility or aqueous fractions; both reuse the same equilibrium states.</p>}
      <small>Pourbaix discovers supported redox chemistry automatically. Exact reference conditions and internally verified calculations have distinct scientific status.</small><details className="diagram-availability"><summary>Diagram availability</summary>{diagramTypes.map(item=>{const reason=diagramUnavailable(item.id,d,components,reactionSet?.solidCount??0,reactionSet?.automaticSolids,reactionSet?.pourbaixReason);return reason?<p key={item.id}>{item.label}: {reason}</p>:null})}</details>
      </div></div>
      <details hidden={selectedDiagram==='pourbaix'||!!d.imposedEh||!!d.closedReagents} className="setup-options"><summary>Advanced diagram options</summary>
        {!d.solubilityComparison&&outputControls}{dimensions===2&&<MapOutput session={session} repository={repository} onView={onView}/>}
        <label className="inline-check"><input type="checkbox" disabled={!!d.mixedSolubility||!allowedPairs.length} checked={!!d.solubilityComparison} onChange={e=>onChange({...d,solubilityComparison:e.target.checked?{...defaultSolubilityComparison(),pairs:defaultSolubilityComparison().pairs.filter(p=>allowedPairs.some(a=>a.id===p.id))}:null})}/>Compare independent pH solubility systems</label>

      </details>
      {snapshot&&<button className="return-results" onClick={()=>setNavigation({mode:'results',submission:null})}>Return to results{stale?' · old conditions':''}</button>}
      <details hidden={!!d.closedReagents} className="setup-options"><summary>Advanced control conventions and reaction set</summary><small hidden={!!d.solubilityComparison}>Axes above are varied (TV / LTV / LAV). Component rows are fixed totals (T) or activities (LA). Water activity remains 1.</small>
      {reactionSet && !d.imposedEh && selectedDiagram!=='pourbaix' && !d.solubilityComparison && <div className="reaction-count">Current chemistry: {reactionSet.aqueousCount} aqueous reactions · {reactionSet.solidCount} solids · {reactionSet.excludedCount} aqueous reactions excluded <button onClick={onReview}>Review reaction set</button></div>}</details>
</details>
    <details className="advanced-panel"><summary>Advanced / diagnostics</summary><label className="inline-check"><input type="checkbox" checked={session.visualizationState.plot?.live!==false} onChange={e=>onView({live:e.target.checked})}/>Update graph after edits</label><p>Scientific revision {session.revision}. Solver inputs preserve source component identities and units.</p>
      <pre>{JSON.stringify(pointFeedback?.diagnostics??[],null,2)}</pre>
      {current&&<JsonDetails title="Current calculation, coordinates and point diagnostics" value={current}/>}
      <details><summary>Calculation definition</summary><pre>{JSON.stringify(d,null,2)}</pre></details>
      <details hidden={selectedDiagram==='pourbaix'||!!d.closedReagents}><summary>Standalone fixed-condition point</summary><button disabled={busy} onClick={()=>{setNavigation({mode:'setup',submission:{previous:snapshot}});onCalculate()}}>Calculate fixed point</button><PointResult result={session.calculationResult}/></details>
    </details>
  </main>
}

