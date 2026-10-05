import {createWorkspaceSession} from '../session/laboratorySession.js'
import {createCalculationDefinition} from '../calculations/definition.js'
import {configureClosedReagents,closedReagentIds} from '../calculations/closedReagentSetup.js'
export function closedReagentExample(repository){
 const ids=Object.values(closedReagentIds)
 if(ids.some(id=>!repository.getComponentById(id)))throw Error('The reviewed Fe/peroxide source components are unavailable in this database.')
 const s=createWorkspaceSession(repository)
 s.chemicalSystem={...s.chemicalSystem,selectedElements:['Fe','Cl'],selectedComponents:ids,selectedSpecies:[],excludedSpecies:[],optionalSpecies:[],enabledPhases:['aqueous','liquid']}
 s.calculationDefinition=configureClosedReagents(createCalculationDefinition(s.chemicalSystem,repository))
 s.visualizationState={workspace:'calculation',plot:{type:'log-concentration',componentId:closedReagentIds.Fe,live:false}}
 return s
}
