import {automaticBoundaries} from '../calculations/automaticBoundaries.js'
import {createCondition} from '../calculations/definition.js'
export default function EquilibriumConstraints({definition,components,repository,onChange}){
 const state=automaticBoundaries(definition,components,repository)
 const toggle=(component,checked)=>{
  const rows=definition.componentConditions.filter(c=>c.componentId!==component.id)
  if(checked)rows.push({...createCondition(component,'LA',component.role==='proton'?'pH':'Eh'),value:null,explicit:true})
  onChange({...definition,componentConditions:rows})
 }
 return <fieldset className="calculation-mode-row"><legend>Analytical component conditions</legend>
 <span>pH: {state.hydrogen.label}</span><span>Eh: {state.electron.label}</span><span>Redox: {state.redox?'Electron-connected source system':'Selected source system without electron expansion'}</span>
 {state.reason&&<p role="alert">{state.reason}</p>}
 <details><summary>Fix pH or potential explicitly</summary><p>H⁺ analytical balance determines pH unless its activity is fixed. Select e⁻ or an Eh/pe coordinate to include electron-connected source reactions. Physical closed-reagent chemistry is a separate mode. Axis coordinates take precedence.</p>
 {components.filter(c=>['proton','electron'].includes(c.role)&&!definition.independentVariables.some(a=>a.componentId===c.id)).map(c=>{
 const row=definition.componentConditions.find(r=>r.componentId===c.id&&r.mode==='LA')
 return <label key={c.id}><input type="checkbox" checked={!!row} onChange={e=>toggle(c,e.target.checked)}/>Fixed {c.role==='proton'?'pH':'Eh (V vs SHE)'}{row&&<input aria-label={c.role==='proton'?'Fixed pH':'Fixed Eh'} type="number" step="any" value={row.value??''} onChange={e=>onChange({...definition,componentConditions:definition.componentConditions.map(r=>r===row?{...r,value:e.target.value===''?null:Number(e.target.value)}:r)})}/>}</label>
 })}{definition.componentConditions.filter(c=>c.mode==='T'&&components.find(x=>x.id===c.componentId)?.role==='proton').map(row=><label key={row.componentId}>Analytical H⁺ equivalents (mol/kg H₂O)<input aria-label="Supplied H+ equivalents" type="number" step="any" value={row.value??''} onChange={e=>onChange({...definition,componentConditions:definition.componentConditions.map(r=>r===row?{...r,value:e.target.value===''?null:Number(e.target.value),inferred:false}:r)})}/></label>)}</details>
 </fieldset>
}
