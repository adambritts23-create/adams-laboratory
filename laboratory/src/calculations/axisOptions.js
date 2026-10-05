import {createCondition} from './definition.js'
/** Presentation choices over the existing axis contracts; no new control modes. */
export function axisOptions(components,diagram){
 return components.filter(c=>c.role!=='solvent').flatMap(component=>{
  const choices=[{quantity:'log-activity',mode:'LAV'}]
  if(component.role==='proton')choices.unshift({quantity:'pH',mode:'LAV'},{quantity:'total',mode:'TV'})
  else if(component.role==='electron')choices.unshift({quantity:'Eh',mode:'LAV'},{quantity:'pe',mode:'LAV'})
  else choices.unshift({quantity:'total',mode:'LTV'},{quantity:'total',mode:'TV'})
  return choices.filter(o=>diagram!=='aqueous-fraction'||['pH','Eh','total'].includes(o.quantity)).filter(()=>diagram!=='calculated-pH'||component.role!=='proton').map(o=>({...o,component}))
 })
}
export function chooseAxisOption(d,index,option,components){
 const axis=d.independentVariables[index],next=createCondition(option.component,option.mode,option.quantity)
 if(option.quantity==='pH')next.range={min:0,max:14}
 next.points=d.dimensions===2?21:51
 const axes=[...d.independentVariables];axes[index]=next
 const fixed=d.componentConditions.filter(c=>c.componentId!==next.componentId)
 if(axis&&axis.componentId!==next.componentId){const c=components.find(c=>c.id===axis.componentId);if(c&&!['proton','electron'].includes(c.role))fixed.push(createCondition(c,'T'))}
 return {...d,activityModel:d.activityModel==='unspecified'?'ideal':d.activityModel,independentVariables:axes,componentConditions:fixed}
}
