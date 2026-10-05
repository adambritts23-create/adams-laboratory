import ClosedReagentReadout from './ClosedReagentReadout.jsx'
import {imposedEhReadout} from '../calculations/imposedEh.js'
import BeakerDrawing from './BeakerDrawing.jsx'
import SolutionSummary from './SolutionSummary.jsx'
import { componentPartitions, partitionPercent } from '../beaker/componentPartition.js'
import { activeSolidLabel } from '../beaker/phaseLabel.js'
import ComponentPartition from './ComponentPartition.jsx'
import {useContext,useState} from 'react'
import {ResultSelectionContext} from './ResultSelectionContext.js'
import {displayNumber as formatNumber,displayConcentration,displayDissolvedAmount,displayWeightedConcentration} from '../plots/formatNumber.js'
import {chemicalLabel} from '../chemistry/format.js'
import './InteractiveBeaker.css'
const amount=value=>formatNumber(value,'amount')+' mol/kg H₂O'
const label=chemicalLabel
export default function InteractiveBeaker(){
 const selection=useContext(ResultSelectionContext),state=selection?.state??{ok:false,message:'Calculate a state to view the beaker.'}
 const [inspected,setInspected]=useState(false),[inspectedId,setInspectedId]=useState(null)
 const partitions=componentPartitions(state).filter(p=>!state.closedReagents||state.components.some(c=>c.id===p.id)).map(p=>({...p,name:state.components?.find(c=>c.id===p.id)?.name??p.name,suppliedAs:state.redoxPresentation?.suppliedAs})),segments=state.ok?state.solids:[]
 const inspect=id=>{setInspectedId(id);setInspected(true)}
 const focusedSolid=segments.find(s=>s.id===inspectedId)
 return <aside className={`interactive-beaker result-beaker beaker-${selection?.theme??'dark'}`} aria-label="Selected equilibrium beaker" data-input-id={state.ok?state.result.inputId:undefined} data-sample-index={selection?.index}>
 <h3>Beaker · selected result</h3>
 {selection?.count>1&&<label>Selected result sample<input aria-label="Selected result sample" type="number" min="0" max={selection.count-1} value={selection.index} onChange={e=>selection.pin(Number(e.target.value))}/></label>}
 <p role="status">{state.ok&&state.imposedEh?imposedEhReadout(state):state.ok?'Exact Calculation sample · pH '+(state.pH===null?'not defined':formatNumber(state.pH,'pH')):state.message}</p>
 {state.ok&&state.imposedEh&&state.waterReferences?.status==='available'&&<p className="water-context">{state.Eh<state.waterReferences.references[0].Eh?'Below H₂ reference':state.Eh>state.waterReferences.references[1].Eh?'Above O₂ reference':'Inside nominal water-stability window'} · reference context only; outside-window potentials can still be calculated.</p>}
 {state.ok&&state.automaticClosedInspection&&<p>pH: {state.automaticClosedInspection.pH} (calculated) · Eh: {state.automaticClosedInspection.Eh} V vs SHE (calculated)</p>}
 {state.ok&&state.closedReagents&&<ClosedReagentReadout inspection={state.closedReagents} supplied={state.suppliedPeroxide}/> }
 <div className="beaker-scientific-scene equilibrium-vessel-theme"><svg className="calculation-vessel-scene" viewBox="0 0 360 400" aria-label="Selected equilibrium vessel · beaker only"><path d="M0 353H360V400H0Z" fill="#657978" opacity=".2"/><ellipse cx="180" cy="358" rx="125" ry="13" fill="#02090c" opacity=".25"/><BeakerDrawing polished state={state} onInspect={inspect} x="20" y="12" width="320" height="375" style={{width:320,height:375}}/></svg></div>
 {state.ok&&<details><summary>Sediment display threshold</summary><p>{state.visual.mapping}</p>{state.visual.hiddenSolidIds?.length>0&&<p>Accepted trace solids are below the drawing threshold. Their exact amounts remain in numerical inspection.</p>}</details>}
 {state.ok&&<><p className="phase-color-note">Cyan: solution · green: solid phases. Illustrative phase colors, not physical appearance or concentration.</p></>}
 {state.ok&&<><ComponentPartition state={state} partitions={partitions}/><SolutionSummary state={state}/></>}
 {segments.length>0&&<section className="beaker-phase-card precipitate-card"><h4><span className="phase-dot" aria-hidden="true"/>Precipitate (solid)</h4><div className="sediment-key" aria-label="Accepted solid phase keys">{segments.map((s,i)=><button key={s.id} onClick={()=>inspect(s.id)} aria-pressed={inspectedId===s.id}><span className={`phase-pattern pattern-${i%3}`} aria-hidden="true">{i+1}</span><span>{label(s.name)}{state.redoxPresentation?.carriers[s.id]?.oxidationLabel&&<small>{state.redoxPresentation.carriers[s.id].oxidationLabel} · solid</small>}<small>{amount(s.amount)}</small>{partitions.filter(p=>p.ok).flatMap(p=>p.solids.filter(row=>row.id===s.id).map(row=><small key={p.id}>{partitionPercent(row.fraction)} of total {label(p.name)} in this solid</small>))}</span></button>)}<small>Pattern keys only · no settling order or physical volume.</small></div></section>}
 {focusedSolid&&<div className="solid-callout" role="status"><strong>{label(focusedSolid.name)}</strong><p>{focusedSolid.amount} mol/kg H₂O accepted solid</p>{partitions.filter(p=>p.ok).flatMap(p=>p.solids.filter(s=>s.id===focusedSolid.id).map(s=><p key={p.id}>{label(p.name)} contribution: {s.componentAmount} mol/kg H₂O (source coefficient {s.coefficient})</p>))}</div>}
 {state.ok&&<details className="beaker-mapping"><summary>How to read this schematic</summary><p>{state.visual.mapping}</p><p>Pattern widths show relative accepted visible solid molalities, not relative volumes, crystal form or settling order. Liquid appearance and Calculation liquid level are fixed illustrations.</p></details>}
 <small>Schematic only. The plot, inspection and beaker share this accepted result; no extra calculation.</small>
 {state.ok&&<><p>{state.phaseMessage}</p><div className="beaker-readout" aria-label="Selected equilibrium totals" data-input-id={state.result.inputId}><h4>{state.solids.length?activeSolidLabel(state.solids.length):'Aqueous only · no precipitate'}</h4>{state.components.map(c=><p key={c.id}>Dissolved {label(c.name)}: <strong data-component={c.id} data-exact-amount={c.totalDissolved}>{displayDissolvedAmount(state.result,state.result.componentIds.indexOf(c.id))+' mol/kg H₂O'}</strong></p>)}<ul>{state.solids.map(s=><li key={s.id} data-solid-id={s.id} data-exact-amount={s.amount}>{label(s.name)} · {amount(s.amount)}</li>)}</ul></div>
 <details open={inspected}><summary onClick={e=>{e.preventDefault();setInspected(!inspected)}}>Numerical inspection · same equilibrium</summary>{state.components.map(c=><div key={c.id}><h4>{label(c.name)}</h4>{c.contributors.map(a=><p key={a.id}>{label(a.name)}: {displayConcentration(state.result,state.result.speciesIds.indexOf(a.id))} × {a.coefficient} = {displayWeightedConcentration(state.result,state.result.speciesIds.indexOf(a.id),a.coefficient)+' mol/kg H₂O'}</p>)}</div>)}{state.allSolids.map(s=><p key={s.id}>{label(s.name)}: {s.status} · {amount(s.amount)} · log saturation {formatNumber(s.logSaturation,'log')}</p>)}<pre>{JSON.stringify({input:state.input,result:state.result,...(state.redoxPresentation?{redoxPresentation:state.redoxPresentation}:{})},null,2)}</pre></details></>}
 {!state.ok&&state.diagnostics&&<details><summary>Calculation diagnostics</summary><pre>{JSON.stringify(state.diagnostics,null,2)}</pre></details>}
 </aside>
}


