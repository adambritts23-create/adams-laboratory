import {useEffect,useState} from 'react'
import {effectiveImposedEh,prepareImposedEh} from '../calculations/imposedEh.js'
import {redoxComponentChoices} from '../analysis/redoxDiscovery.js'
import {DiscoveryDetails} from './PourbaixSetup.jsx'
export default function ImposedEhSetup({session,repository,onChange}){
 const d=session.calculationDefinition,q=effectiveImposedEh(session,repository),[readiness,setReadiness]=useState(null)
 useEffect(()=>{let active=true;prepareImposedEh(session,repository).then(value=>{if(active)setReadiness({session,value})}).catch(error=>{if(active)setReadiness({session,value:{ok:false,reason:error.message}})});return()=>{active=false}},[session,repository])
 const ready=readiness?.session===session?readiness.value:null
 const choices=redoxComponentChoices(repository).filter(c=>session.chemicalSystem.selectedElements.includes(c.label)||c.componentId===q.componentId)
 const change=patch=>onChange({...d,imposedEh:{...q,...patch}},null,{manual:true})
 const number=(label,value,update,step='any')=><label>{label}<input aria-label={label} type="number" step={step} value={value??''} onChange={e=>update(e.target.value===''?null:Number(e.target.value))}/></label>
 return <section className="fe-setup" aria-label="Imposed potential setup"><h3>e⁻ · externally imposed potential</h3><p>Electron activity is imposed at every sample. No electron material total is supplied. Closed redox derives Eh and is a separate calculation.</p>
 <label>Potential control<select aria-label="Potential control" value={q.mode??'sweep'} onChange={e=>change({mode:e.target.value})}><option value="sweep">Sweep Eh · fixed pH</option><option value="fixed">Fixed Eh · sweep pH</option></select></label>
 <div className="pourbaix-inputs"><label>Redox component<select aria-label="Redox component" value={q.componentId} onChange={e=>change({componentId:e.target.value})}><option value="">Choose a selected element</option>{choices.map(c=><option key={c.componentId} value={c.componentId}>{c.label}</option>)}</select></label>{number('Total redox component (mol/kg H₂O)',q.total,value=>change({total:value}))}</div>
 {q.mode==='fixed'?<>{number('Fixed Eh (V vs SHE, imposed)',q.fixedEh===undefined?0:q.fixedEh,value=>change({fixedEh:value}))}<fieldset><legend>X · pH</legend>{['min','max','points'].map(k=><div key={k}>{number('pH '+k,(q.pHRange??{min:0,max:14,points:51})[k],value=>change({pHRange:{...(q.pHRange??{min:0,max:14,points:51}),[k]:value}}),k==='points'?1:'any')}</div>)}</fieldset></>:<>{number('Fixed pH',q.pH,value=>change({pH:value}))}<fieldset><legend>X · Eh vs SHE (V, imposed)</legend>{['min','max','points'].map(k=><div key={k}>{number('Eh '+k,q.Eh[k],value=>change({Eh:{...q.Eh,[k]:value}}),k==='points'?1:'any')}</div>)}</fieldset></>}
 <p>{d.temperature.value} °C · {d.pressure.value} bar declared · {d.activityModel} activity · a(H₂O)=1. Gas inventories are not solved.</p><p>One accepted sweep supplies all compatible curve views. Internal integration evidence, not independent validation across the requested potential range. Carrier colors are not oxidation-state colors.</p>
 <p role="status">{!ready?'Checking redox preparation…':ready.ok?'Ready to calculate with fixed electron activity.':ready.reason}</p><DiscoveryDetails discovery={ready?.scope?.discovery??ready?.discovery}/>
 </section>
}
