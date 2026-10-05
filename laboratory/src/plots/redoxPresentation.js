import {isRegisteredOxidationModel} from '../analysis/registeredElementOxidation.js'
import {oxidationStateLabel} from './pourbaixPresentation.js'
// This is a label/provenance projection; never changes the conserved inventory.
export function redoxPresentation(system,discovery,supplied,label){
 if(!label||!supplied)return null
 const model=discovery.model,validated=isRegisteredOxidationModel(model)&&model.systemId===system.id
 return {label,componentId:system.components.find(c=>c.role==='ordinary').id,suppliedAs:supplied.name,suppliedComponentId:supplied.id,
  metadataVersion:validated?model.metadataVersion:null,
  carriers:validated?Object.fromEntries(model.inner.allocations.map(a=>[a.id,{distribution:a.distribution,oxidationLabel:a.distribution.map(d=>oxidationStateLabel(label,d.oxidationState)).join(' / ')}])):{}}
}
export function presentRedoxState(state,presentation){
 if(!state.ok||!presentation)return state
 return {...state,redoxPresentation:presentation,components:state.components.map(c=>c.id===presentation.componentId?{...c,name:presentation.label,preparationName:c.name}:c)}
}
