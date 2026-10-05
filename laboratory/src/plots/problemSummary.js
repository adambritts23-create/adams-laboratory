import {chemicalLabel} from '../chemistry/format.js'
const number=v=>typeof v==='number'&&Number.isFinite(v)?String(v):'not set'
const unit=c=>c.quantity==='Eh'?'V vs SHE':c.quantity==='pH'?'pH':c.quantity==='pe'?'pe':c.quantity==='log-activity'?'log₁₀ activity':c.unit==='mol/kg-H2O'?'mol/kg H₂O':c.unit??''
export function problemSummary(definition,components){
 const describe=c=>{const component=components.find(x=>x.id===c.componentId),name=chemicalLabel(component?.name??'Choose component');return c.quantity==='pH'?'pH':c.quantity==='Eh'?'Eh':c.quantity==='pe'?'pe':`${name} ${c.mode==='LA'||c.mode==='LAV'?'log activity':c.mode==='LTV'?'total · log₁₀':'total'}`}
 const varied=(definition.independentVariables??[]).map((c,i)=>`${i?'Y':'X'} · ${describe(c)}: ${number(c.range?.min)} → ${number(c.range?.max)} ${unit(c)} · ${c.points??'—'} samples`)
 const fixed=(definition.componentConditions??[]).filter(c=>!definition.independentVariables?.some(a=>a.componentId===c.componentId)&&!['solvent','water'].includes(components.find(x=>x.id===c.componentId)?.role)).map(c=>`${describe(c)}: ${number(c.value)} ${unit(c)}`)
 return {varied,fixed,conditions:`${number(definition.temperature?.value)} °C · ${definition.activityModel??'model not set'} · ${number(definition.pressure?.value)} bar declared`}
}
