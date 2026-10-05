import {createWorkspaceSession} from '../session/laboratorySession.js'
import {createCalculationDefinition} from '../calculations/definition.js'
import {feOxidationMetadata} from '../analysis/feOxidationMetadata.js'
import {configurePublicFeDefinition,feSourceIds,publicFeSetupReason} from '../calculations/fePublicSetup.js'
export function fePourbaixExample(repository,preparation){
 const s=createWorkspaceSession(repository)
 s.chemicalSystem={...s.chemicalSystem,selectedElements:['Fe'],selectedComponents:[...feOxidationMetadata.basisIds],selectedSpecies:[...feSourceIds],excludedSpecies:['spana:2ac52a30213c9288:132744'],enabledPhases:['aqueous','solid','liquid'],temperature:25,pressure:1}
 s.calculationDefinition=configurePublicFeDefinition(createCalculationDefinition(s.chemicalSystem,repository))
 s.visualizationState={...s.visualizationState,workspace:'calculation',plot:{type:'pourbaix',live:false}}
 const reason=publicFeSetupReason(s,preparation,{axes:true});if(reason)throw Error(reason)
 return s
}
