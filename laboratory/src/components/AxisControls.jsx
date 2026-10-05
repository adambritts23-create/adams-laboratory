import {editAxis} from '../calculations/setupEditing.js'
import {axisOptions,chooseAxisOption} from '../calculations/axisOptions.js'
import {chemicalLabel} from '../chemistry/format.js'
import AmountUnitSelect from './AmountUnitSelect.jsx'
const quantities={pH:'pH',total:'Analytical total',Eh:'Eh vs SHE',pe:'pe','log-activity':'Log activity'}
export default function AxisControls({index,definition:d,components,onChange,diagram}){
 const axis=d.independentVariables[index],axisName=index===0?'X':'Y',options=axisOptions(components,diagram)
 const allowed=o=>!d.independentVariables.some((a,i)=>i!==index&&a.componentId===o.component.id)
 const available=options.filter(allowed),quantityOptions=[...new Set(options.map(o=>o.quantity))]
 const sameQuantity=options.filter(o=>o.quantity===axis?.quantity),componentOptions=[...new Map(sameQuantity.map(o=>[o.component.id,o.component])).values()]
 const scales=sameQuantity.filter(o=>o.component.id===axis?.componentId)
 const choose=option=>{if(option&&allowed(option))onChange(chooseAxisOption(d,index,option,components))}
 const edit=patch=>onChange(editAxis(d,index,patch))
 const protonTotal=axis?.quantity==='total'&&components.find(c=>c.id===axis.componentId)?.role==='proton'
 return <fieldset className="axis-setup axis-role" data-axis-role={axisName.toLowerCase()}><legend>{axisName} axis</legend>
  <div className="axis-selectors">
   <label>Quantity<select aria-label={axisName+' quantity'} value={axis?.quantity??''} disabled={index===1&&!d.independentVariables[0]} onChange={e=>choose(available.find(o=>o.quantity===e.target.value&&o.component.id===axis?.componentId)??available.find(o=>o.quantity===e.target.value))}><option value="">Choose quantity</option>{quantityOptions.map(q=><option key={q} value={q} disabled={!available.some(o=>o.quantity===q)}>{quantities[q]}</option>)}</select></label>
   <label>Component<select aria-label={axisName+' component'} value={axis?.componentId??''} disabled={!axis} onChange={e=>choose(sameQuantity.find(o=>o.component.id===e.target.value&&o.mode===axis.mode)??sameQuantity.find(o=>o.component.id===e.target.value))}><option value="">Choose component</option>{componentOptions.map(c=><option key={c.id} value={c.id} disabled={!available.some(o=>o.component.id===c.id&&o.quantity===axis?.quantity)}>{chemicalLabel(c.name)}{c.role==='proton'&&axis?.quantity==='total'?' equivalent':''}</option>)}</select></label>
   <label>Scale<select aria-label={axisName+' scale'} value={axis?.mode??''} disabled={!axis||scales.length<2} onChange={e=>choose(scales.find(o=>o.mode===e.target.value))}>{scales.map(o=><option key={o.mode} value={o.mode}>{o.mode==='LTV'?'Log₁₀':o.mode==='TV'?'Linear':'Linear coordinate'}</option>)}</select></label>
  </div>
  {axis&&<><div className="axis-range"><label>{axisName} minimum<input className="field-editable" type="number" step="any" value={axis.range.min??''} onChange={e=>edit({range:{...axis.range,min:e.target.value===''?null:Number(e.target.value)}})}/></label><label>{axisName} maximum<input className="field-editable" type="number" step="any" value={axis.range.max??''} onChange={e=>edit({range:{...axis.range,max:e.target.value===''?null:Number(e.target.value)}})}/></label><label>{axisName} samples<input className="field-editable" type="number" min="2" max="10000" value={axis.points} onChange={e=>edit({points:Number(e.target.value)})}/></label></div>
   {axis.quantity==='total'?<details className="axis-help"><summary>mol/kg H₂O · {protonTotal?'signed analytical H⁺ equivalent':axis.mode==='LTV'?'log₁₀ scale':'linear scale'}</summary>{protonTotal&&<p>Positive values represent acid equivalents; negative values represent base equivalents. This is an analytical component coordinate, not equilibrium hydrogen-ion concentration. No physical burette or assumed molarity conversion.</p>}<AmountUnitSelect label={`${axisName} concentration unit`} unit={axis.unit}/></details>:<small>{axis.quantity==='Eh'?'V vs SHE':axis.quantity==='log-activity'?'log₁₀ activity · dimensionless':axis.quantity==='pH'?'pH · dimensionless':'pe · dimensionless'}</small>}
  </>}
 </fieldset>
}
