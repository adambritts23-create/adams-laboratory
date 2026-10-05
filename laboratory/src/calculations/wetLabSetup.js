import {acetateSource} from './acetateSource.js'
import {freeze} from '../solver/models.js'
import {prepareSolution,prepareAnalyticalSolution,volumeConvention,wetLabRecipes,wetLabRecipeSources,wetLabCoordinateMetadata,wetLabError} from './wetLabSolutions.js'
import {prepareWetLab} from './wetLabTitration.js'
import {networkComposition} from '../thermodynamics/networkComposition.js'

export const defaultWetLabSetup=freeze({sample:{reagent:'HCl',concentrationMolPerL:.1,volumeMl:50},titrant:{reagent:'NaOH',concentrationMolPerL:.1,volumeMl:100}})
export const mixedWetLabSetup=freeze({sample:{volumeMl:50,contributions:[{id:'sample-acetic',reagent:'CH3COOH',concentrationMolPerL:.02},{id:'sample-boric',reagent:'B(OH)3',concentrationMolPerL:.02}]},titrant:{volumeMl:100,contributions:[{id:'titrant-base',reagent:'NaOH',concentrationMolPerL:.1}]}})
export const solidWetLabSetup=freeze({sample:{volumeMl:50,contributions:[{id:'sample-boric',reagent:'B(OH)3',concentrationMolPerL:.8}]},titrant:{volumeMl:50,contributions:[{id:'titrant-base',reagent:'NaOH',concentrationMolPerL:1}]}})
export const setupRows=part=>part?.contributions??[{id:'reagent',reagent:part?.reagent,concentrationMolPerL:part?.concentrationMolPerL}]
export const waterReactionId='spana:2ac52a30213c9288:250448'
const componentRequirements=Object.fromEntries(Object.entries(wetLabCoordinateMetadata).map(([key,m])=>[key,m.sourceId]))
export const wetLabSystemKey=system=>JSON.stringify(system)
/** Availability describes bottles backed by reviewed recipes, not bottles of arbitrary selected ions. */
export async function auditWetLabRecipes(repository,system){
 let sourceReason=null
 try{await prepareWetLab(repository)}catch(e){sourceReason=e.message}
 const common=[]
 if(sourceReason)common.push(sourceReason)
 if(!system?.enabledPhases?.includes('aqueous'))common.push('Enable aqueous chemistry in System.')
 if(system?.temperature!==undefined&&system.temperature!==25)common.push('Reviewed Wet Lab recipes require 25 °C.')
 if(system?.pressure!==undefined&&system.pressure!==1)common.push('Reviewed Wet Lab recipes require declared 1 bar.')
 if(system?.activityModel!=null&&system.activityModel!=='ideal')common.push('Reviewed Wet Lab recipes require the Ideal activity model.')
 if(system?.excludedSpecies?.includes(waterReactionId))common.push('Required water equilibrium is explicitly excluded in System.')
 const registry=await networkComposition(repository)
 let acetateReason=null
 try{await prepareWetLab(repository,{acetate:true})}catch(e){acetateReason=e.message}
 const recipes=Object.values(wetLabRecipes).map(recipe=>{
  const required=['component:H2O','component:H%2B',...Object.entries(recipe.components).filter(([,n])=>n!==0).map(([key])=>componentRequirements[key])]
  const missing=required.filter(id=>!system?.selectedComponents?.includes(id))
  const additional=[]
  for(const id of required)if(!registry.entries[id])additional.push(`Reviewed source-bound composition missing or changed: ${id}`)
  if(recipe.components.acetate){
   if(acetateReason)additional.push(acetateReason)
   if(system?.excludedSpecies?.includes(acetateSource.acid))additional.push('Acetic-acid source identity is explicitly excluded.')
  }
  if(recipe.components.boron&&!registry.entries['component:B(OH)3'])additional.push('Reviewed boric-acid source metadata missing or changed.')
  for(const id of [...required,...(recipe.sourceParts?.map(p=>p.sourceId)??[wetLabRecipeSources[recipe.id]])])if((system?.excludedSpecies??[]).includes(id)||(system?.excludedComponents??[]).includes(id))additional.push(`Required identity explicitly excluded: ${id}`)
  const reasons=[...common,...additional]
  return {id:recipe.id,label:recipe.label??`${recipe.id}(aq)`,required,missing,reasons,available:reasons.length===0}
 })
 return freeze({systemKey:wetLabSystemKey(system),recipes,available:recipes.filter(r=>r.available)})
}
const number=value=>{
 if(!['string','number'].includes(typeof value)||(typeof value==='string'&&!value.trim()))wetLabError('invalid-stock','Enter positive finite concentration and volume.')
 return Number(value)
}
export function prepareWetLabStocks(setup,preparationRevision=0,catalog=null){
 const make=part=>{if(part?.preparationContract!==undefined&&!['physical','analytical-acid-base','simplified-redox'].includes(part.preparationContract))wetLabError('invalid-stock','Unknown stock definition; no physical or analytical fallback.');return (part?.preparationContract==='analytical-acid-base'?prepareAnalyticalSolution:prepareSolution)({...(part?.preparationContract==='simplified-redox'?{counterionModel:'inert-background'}:{}),contributions:setupRows(part).map(r=>({...r,concentrationMolPerL:number(r.concentrationMolPerL)})),volumeMl:number(part?.volumeMl),temperatureC:25,convention:volumeConvention.id,preparationRevision},catalog)}
 return freeze({sample:make(setup?.sample),titrant:make(setup?.titrant)})
}
/** Inventory-only navigation/sampling estimate. It never supplies an equilibrium value. */
export function wetLabSampling(stocks){
 const {sample,titrant}=stocks,capacity=titrant.volumeMl
 const perMl=titrant.moles.protonEquivalent/capacity
 const estimate=!sample.moles.boron&&sample.contributions.length===1&&titrant.contributions.length===1&&sample.moles.protonEquivalent*perMl<0?-sample.moles.protonEquivalent/perMl:null
 const equivalenceMl=Number.isFinite(estimate)&&estimate>0?estimate:null
 const coordinates=Array.from({length:101},(_,i)=>i===100?capacity:capacity*i/100)
 if(equivalenceMl!==null&&equivalenceMl<=capacity)for(const offset of [-.5,-.1,-.01,0,.01,.1,.5]){const v=equivalenceMl+offset;if(v>=0&&v<=capacity)coordinates.push(v)}
 return freeze({coordinates:[...new Set(coordinates)].sort((a,b)=>a-b),equivalenceMl,nearEquivalenceMl:equivalenceMl!==null&&equivalenceMl<=capacity?Math.max(0,equivalenceMl-.01):null})
}



export const analyticalWetLabSetup=freeze({sample:{preparationContract:'analytical-acid-base',volumeMl:50,contributions:[{id:'sample-component',kind:'component',sourceId:'component:H%2B',concentrationMolPerL:.1}]},titrant:{preparationContract:'analytical-acid-base',volumeMl:100,contributions:[{id:'titrant-component',kind:'component',sourceId:waterReactionId,concentrationMolPerL:.1}]}})

// Explicit electroneutral ionic preparations; the same physical mixing path as other Wet Lab stocks.
export const redoxWetLabSetup=freeze({
 sample:{volumeMl:50,contributions:[
  {id:'sample-iron',kind:'ionic',sourceId:'component:Fe%202%2B',concentrationMolPerL:1e-6},
  {id:'sample-acid',kind:'ionic',sourceId:'component:H%2B',concentrationMolPerL:.01},
  {id:'sample-chloride',kind:'ionic',sourceId:'component:Cl-',concentrationMolPerL:.010002},
 ]},
 titrant:{volumeMl:100,contributions:[
  {id:'titrant-cerium',kind:'ionic',sourceId:'component:Ce%204%2B',concentrationMolPerL:1e-6},
  {id:'titrant-acid',kind:'ionic',sourceId:'component:H%2B',concentrationMolPerL:.01},
  {id:'titrant-chloride',kind:'ionic',sourceId:'component:Cl-',concentrationMolPerL:.010004},
 ]},
})

export const simplifiedRedoxWetLabSetup=freeze({
 sample:{preparationContract:'simplified-redox',volumeMl:50,contributions:[
  {id:'sample-iron',kind:'ionic',sourceId:'component:Fe%202%2B',concentrationMolPerL:.0006},
  {id:'sample-acid',kind:'ionic',sourceId:'component:H%2B',concentrationMolPerL:.1},
 ]},
 titrant:{preparationContract:'simplified-redox',volumeMl:100,contributions:[
  {id:'titrant-dichromate',kind:'ionic',sourceId:'spana:2ac52a30213c9288:94892',concentrationMolPerL:.0001},
  {id:'titrant-acid',kind:'ionic',sourceId:'component:H%2B',concentrationMolPerL:.1},
 ]},
})
