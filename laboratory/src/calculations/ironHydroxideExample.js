import {isSupportedFormationSource} from '../thermodynamics/formationSupport.js'
import {discoverReactionSet,automaticSpeciesPolicy,automaticSolidPolicy} from '../thermodynamics/compatibility.js'

export const ironHydroxideScope='fresh-iron-hydroxides-v1'
export const ironHydroxideIds=['spana:2ac52a30213c9288:130902','spana:2ac52a30213c9288:131188']
export const ironHydroxideDescription='Fresh hydroxides · restricted equilibrium: Fe(II) and Fe(III) inventories are conserved separately. Only Fe(OH)₂(cr) and Fe(OH)₃(am) solids are enabled; crystalline oxides, redox exchange, air oxidation and ageing are not modeled. Colours are illustrative. Ideal activities; countercharge unspecified.'
export const ironHydroxideSetup={experimentScope:ironHydroxideScope,
 sample:{preparationContract:'analytical-acid-base',volumeMl:50,contributions:[
  {id:'ferrous',kind:'component',sourceId:'component:Fe%202%2B',concentrationMolPerL:.05},
  {id:'ferric',kind:'component',sourceId:'component:Fe%203%2B',concentrationMolPerL:.05},
  {id:'acid',kind:'component',sourceId:'component:H%2B',concentrationMolPerL:.1}]},
 titrant:{preparationContract:'analytical-acid-base',volumeMl:50,contributions:[
  {id:'hydroxide',kind:'component',sourceId:'spana:2ac52a30213c9288:250448',concentrationMolPerL:.5}]}}

/** Experiment-local source selection; never mutates the user's System or constants. */
export function wetLabExperimentSystem(repository,system,setup){
 if(setup?.experimentScope!==ironHydroxideScope){
  const selected=new Set(system.selectedComponents),excluded=new Set(system.excludedComponents??[])
  const byName=new Map(repository.getComponents().map(c=>[c.name,c]))
  const include=component=>{if(component&&component.role!=='electron'&&!excluded.has(component.id))selected.add(component.id)}
  for(const part of [setup?.sample,setup?.titrant]){
   if(part?.preparationContract!=='analytical-acid-base')continue
   for(const row of part.contributions??[]){
    if(row.kind!=='component'||!(Number(row.concentrationMolPerL)>0))continue
    const component=repository.getComponentById(row.sourceId)
    if(component){include(component);continue}
    const species=repository.getSpeciesById(row.sourceId)
    if(!species||!isSupportedFormationSource(species,repository))continue
    const terms=species.metadata?.effectiveSourceReaction?.components?.filter(t=>t.coefficient!==0)??[]
    // Selection supplies source coordinates only. Stock validation still decides admission.
    if(terms.some(t=>byName.get(t.name)?.role==='electron'))continue
    for(const term of terms)include(byName.get(term.name))
   }
  }
  if(selected.size===system.selectedComponents.length)return system
  const local={...system,selectedComponents:[...selected]}
  return {...local,selectedSpecies:discoverReactionSet(repository,local).selectedSpecies}
 }
 const components=['component:H%2B','component:H2O','component:Fe%202%2B','component:Fe%203%2B'].filter(id=>!system.excludedComponents?.includes(id))
 const excluded=new Set(system.excludedSpecies??[])
 for(const row of repository.getSpecies())if(row.phase==='solid'&&!ironHydroxideIds.includes(row.id))excluded.add(row.id)
 const local={...system,selectedElements:['Fe'],selectedComponents:components,speciesPolicy:automaticSpeciesPolicy,solidPhasePolicy:automaticSolidPolicy,excludedSpecies:[...excluded],optionalSpecies:[]}
 return {...local,selectedSpecies:discoverReactionSet(repository,local).selectedSpecies}
}
