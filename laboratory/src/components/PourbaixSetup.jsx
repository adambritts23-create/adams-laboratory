import {pourbaixReadiness} from '../plots/pourbaixExperience.js'
import {useEffect,useState,useMemo} from 'react'
import ExperimentalCarrierPourbaix from './ExperimentalCarrierPourbaix.jsx'
import {preparePourbaixWorkflow,effectivePourbaixRequest} from '../calculations/userPourbaix.js'
import {redoxComponentChoices} from '../analysis/redoxDiscovery.js'
import './FePourbaix.css'
import './Pourbaix.css'
export function DiscoveryDetails({discovery}){
 if(!discovery)return null
 const excluded=discovery.excludedCandidates.filter(r=>r.reason!=='requires-components-outside-selected-family')
 return <details className="fe-scope"><summary>Redox system details / scientific scope</summary>{discovery.databaseSearch&&<p>HYDRA database products found: {discovery.databaseSearch.products.length}. Products admitted by this material/phase scope: {discovery.includedCandidates.length}. Gas reservoirs and finite gas inventory are not solved; source membership alone does not admit a phase.</p>}<p>{discovery.family.componentIds.length} source-connected redox forms share one analytical inventory. Separate oxidation-state totals are not imposed.</p><p>Canonical basis: {discovery.canonicalEstablished?'established':'not established'} · Oxidation-state inventory: {discovery.inventoryComplete?'complete':'unresolved'}</p><p>Included solid candidates: {discovery.includedCandidates.filter(r=>r.phase==='solid').map(r=>r.name).join(', ')||'none'}. Included means eligible for equilibrium, not necessarily stable.</p><p>Excluded candidates: {excluded.map(r=>`${r.name}: ${r.reason}`).join('; ')||'none'}.</p><p>Unsupported candidates: {discovery.unsupportedCandidates.map(r=>`${r.name}: ${r.reason}${r.excludedByReferenceScope?' (excluded by reviewed scope)':''}`).join('; ')||'none'}.</p><p>Unresolved carrier allocations: {discovery.unresolvedCarriers.length}. {discovery.unresolvedCarriers.map(r=>r.name).join(', ')}</p><p>{discovery.excludedCandidates.length-excluded.length} source reactions require components outside this selected family.</p><details><summary>Exact source identities, bridges and exclusions</summary><pre>{JSON.stringify(discovery,null,2)}</pre></details></details>
}
export default function PourbaixSetup({session,repository,onChange}){
 const d=session.calculationDefinition,q=effectivePourbaixRequest(session,repository),[ready,setReady]=useState(null)
 useEffect(()=>{let current=true;preparePourbaixWorkflow(session,repository).then(value=>{if(current)setReady({revision:session.revision,repository,value})}).catch(e=>{if(current)setReady({revision:session.revision,repository,value:{ok:false,reason:e.message}})});return ()=>{current=false}},[session,repository])
 const result=ready?.revision===session.revision&&ready.repository===repository?ready.value:null
 const readiness=pourbaixReadiness(result)
 const choices=useMemo(()=>redoxComponentChoices(repository),[repository]),selected=choices.filter(c=>session.chemicalSystem.selectedElements.includes(c.label)||c.componentId===q?.componentId)
 const alias=repository.getComponentById(q?.componentId)?.associations?.[0]?.element
 const label=choices.find(c=>c.componentId===q?.componentId)?.label??alias??'component'
 const options=selected.some(c=>c.componentId===q?.componentId)||!q?.componentId?selected:[...selected,{componentId:q.componentId,label}]
 const change=patch=>onChange({...d,pourbaix:{...q,...patch}},null,{manual:true})
 const input=(key,value)=>change({[key]:value})
 return <section className="fe-setup pourbaix-setup" aria-label="Pourbaix setup"><div className="pourbaix-inputs"><label>Redox component<select aria-label="Redox component" value={q?.componentId??''} onChange={e=>input('componentId',e.target.value)}><option value="">Choose a selected element</option>{options.map(c=><option key={c.componentId} value={c.componentId}>{c.label}</option>)}</select></label><label>Total {label}<input className="field-editable" type="number" step="any" aria-label="Total redox component" value={q?.total??''} onChange={e=>input('total',e.target.value===''?null:Number(e.target.value))}/><span>mol/kg H₂O · one total across all oxidation states</span></label></div>
 <div className="pourbaix-inputs">{Object.entries(q?.additionalTotals??{}).map(([id,value])=><label key={id}>Fixed total {repository.getComponentById(id)?.name}<input aria-label={'Additional total '+id} type="number" step="any" value={value??''} onChange={e=>input('additionalTotals',{...q.additionalTotals,[id]:e.target.value===''?null:Number(e.target.value)})}/><span>mol/kg H₂O · independent source component</span></label>)}</div>
 <div className="pourbaix-inputs">{[['pH','X · pH'],['Eh','Y · Eh vs SHE (V)']].map(([key,title])=><fieldset className="axis-role" key={key}><legend>{title}</legend>{['min','max','points'].map(k=><label key={k}>{k==='points'?'Samples':k==='min'?'Minimum':'Maximum'}<input type="number" step={k==='points'?1:'any'} aria-label={`${key} ${k}`} value={q?.[key]?.[k]??''} onChange={e=>input(key,{...q[key],[k]:e.target.value===''?null:Number(e.target.value)})}/></label>)}</fieldset>)}</div>
 <p>Temperature: {d.temperature.value} °C · Pressure: {d.pressure.value} bar declared · Activity: {d.activityModel}. Fixed H⁺ / electron activities and a(H₂O)=1. H₂/O₂ reference overlays only; no gas inventory is solved.</p>
 <div role="status" aria-live="polite" className="pourbaix-readiness"><strong>{readiness.label}</strong><p>{readiness.detail}</p>{result?.ok?<><p>{label} · Oxidation states: {result.preparation.discovery.oxidationStates.join(', ')} · {result.preparation.discovery.carrierCount} supported carriers · {result.preparation.discovery.solidCount} compatible solid candidates.</p><small>Scientific result status is assigned after every sample converges and its complete inventory passes checks.</small></>:result&&<small>{result.reason}</small>}</div>
 <DiscoveryDetails discovery={result?.preparation?.discovery??result?.discovery}/>
 <p className="fe-note">{result?.ok?'Choose Plot diagram to calculate. Changing total, ranges, sampling or phase scope creates a new result; it does not inherit independent reference validation.':'An oxidation-state map requires complete, reviewed carrier allocations and supported conditions. The readiness disclosure does not enable an unsupported calculation.'}</p>
 {!result?.ok&&result?.discovery?.canonicalEstablished&&!result.discovery.inventoryComplete&&result.discovery.unresolvedCarriers.length>0&&<ExperimentalCarrierPourbaix key={JSON.stringify([session.revision,session.chemicalSystem,d])} session={session} repository={repository}/>}
 </section>
}

