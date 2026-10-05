import {searchComponentSystem} from '../thermodynamics/componentSearch.js'
import {createCondition} from './definition.js'

const searchCache=new WeakMap()
function selectedSearch(repository,ids){let entry=searchCache.get(repository);const key=JSON.stringify(ids);if(entry?.key!==key){entry={key,value:searchComponentSystem(repository,ids)};searchCache.set(repository,entry)}return entry.value}

// Infer contracts from explicit coordinates, never from element names or charges.
export function automaticBoundaries(definition,components,repository){
 if(definition.closedReagents||definition.generalClosed)return {hydrogen:{kind:'derived',label:'Calculated from equilibrium'},electron:{kind:'derived',label:'Calculated from equilibrium'},redox:true,reason:null}
 if(definition.imposedEh||definition.pourbaix||definition.publicFePourbaix)return {hydrogen:{kind:'imposed',label:definition.imposedEh?.mode==='fixed'?'Imposed by X axis':'Imposed by fixed condition / axis'},electron:{kind:'imposed',label:'Imposed by fixed condition / axis'},redox:true,reason:null}
 const electronComponent=components.find(c=>c.role==='electron')
 const electronRequested=electronComponent&&!electronComponent.virtualCoordinate||[...definition.independentVariables,...definition.componentConditions].some(c=>c.componentId===electronComponent?.id&&['LA','LAV'].includes(c.mode)&&(c.mode==='LAV'||c.explicit||Number.isFinite(c.value)))
 const ids=components.filter(c=>c.role!=='electron'||electronRequested).map(c=>c.id)
 const scope=selectedSearch(repository,ids)
 const redox=!!electronRequested
 const coordinate=role=>{
  const c=components.find(c=>c.role===role),index=definition.independentVariables.findIndex(a=>a.componentId===c?.id&&a.mode==='LAV')
  if(index>=0)return {kind:'imposed',label:`Imposed by ${index?'Y':'X'} axis`}
  const fixed=definition.componentConditions.find(a=>a.componentId===c?.id&&a.mode==='LA'&&(a.explicit||Number.isFinite(a.value)))
  if(fixed)return {kind:'imposed',label:'Imposed by fixed condition'}
  return {kind:role==='electron'&&!redox?'not-connected':'derived',label:role==='electron'&&!redox?'Not applicable':'Calculated from equilibrium'}
 }
 const hydrogen=coordinate('proton'),electron=coordinate('electron')
 const reason=!scope.ok?scope.diagnostics?.map(d=>d.message).join(' '):redox&&electron.kind==='derived'?'Calculated electron-balance diagrams are unavailable: differential validation did not establish reliable equivalence. Choose imposed Eh/pe, or the separate physical Closed reagent mode.':null
 return {hydrogen,electron,redox,reason}
}

export function normalizeAutomaticDefinition(definition,components){
 const d=structuredClone(definition)
 d.automaticBoundaries=true
 d.componentConditions=d.componentConditions.filter(row=>{
  const role=components.find(c=>c.id===row.componentId)?.role
  return !['proton','electron'].includes(role)||row.mode!=='LA'||row.explicit||Number.isFinite(row.value)
 })
 const h=components.find(c=>c.role==='proton')
 if(h&&![...d.componentConditions,...d.independentVariables].some(c=>c.componentId===h.id))d.componentConditions.push({...createCondition(h,'T','total'),value:0,inferred:true})
 return d
}

export function boundaryComponents(components,repository){
 const electron=repository.getComponents().find(c=>c.role==='electron')
 return electron&&!components.some(c=>c.id===electron.id)?[...components,{...electron,virtualCoordinate:true}]:components
}

const constructions=new WeakMap()
const selectionKey=session=>JSON.stringify([session.revision,session.chemicalSystem])
export function rememberAutomaticConstruction(system,session){constructions.set(system,selectionKey(session))}
export const matchesAutomaticConstruction=(system,session)=>constructions.get(system)===selectionKey(session)
