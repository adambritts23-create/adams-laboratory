import {createCondition} from './definition.js'
import {configureGeneralClosed} from './generalClosedSetup.js'
import {configureImposedEh} from './imposedEh.js'
export function calculationConstraints(definition,components){
 if(definition.generalClosed||definition.closedReagents)return {hydrogen:'derived',electron:'derived'}
 if(definition.imposedEh||definition.pourbaix)return {hydrogen:'imposed',electron:'imposed'}
 const h=components.find(c=>c.role==='proton'),row=[...definition.componentConditions,...definition.independentVariables].find(c=>c.componentId===h?.id)
 return {hydrogen:row?.quantity==='total'?'derived':'imposed',electron:components.some(c=>c.role==='electron')?'imposed':'not-connected'}
}
/** Presentation transition only; accepted results are invalidated by the existing onChange path. */
export function changeCalculationConstraint(definition,components,coordinate,value,{closedAvailable=false}={}){
 const current=calculationConstraints(definition,components)
 if(current[coordinate]===value)return definition
 const next={...current,[coordinate]:value},base=structuredClone(definition.generalClosed?.ordinaryDefinition??definition.closedReagents?.ordinaryDefinition??definition)
 if(next.electron==='derived'){
  if(next.hydrogen!=='derived'||!closedAvailable||components.some(c=>c.role==='electron'))return null
  return configureGeneralClosed(base,components)
 }
 if(next.electron==='imposed'){
  if(next.hydrogen!=='imposed'||!components.some(c=>c.role==='electron'))return null
  return configureImposedEh(base,components)
 }
 if(components.some(c=>c.role==='electron'))return null
 const h=components.find(c=>c.role==='proton');if(!h)return null
 delete base.generalClosed;delete base.closedReagents
 // A changed reservoir cannot inherit the old numerical value or varied H axis.
 base.independentVariables=base.independentVariables.filter(c=>c.componentId!==h.id)
 base.componentConditions=base.componentConditions.filter(c=>c.componentId!==h.id)
 base.componentConditions.push(createCondition(h,next.hydrogen==='derived'?'T':'LA',next.hydrogen==='derived'?'total':'pH'))
 return base
}
