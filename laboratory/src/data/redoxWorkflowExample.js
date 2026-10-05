import {createWorkspaceSession} from '../session/laboratorySession.js'
import {createCalculationDefinition} from '../calculations/definition.js'
import {configurePourbaixDefinition} from '../calculations/userPourbaix.js'
import {redoxComponentChoices} from '../analysis/redoxDiscovery.js'
import {redoxSupportCatalog} from '../analysis/redoxSupportCatalog.js'
// Convenience examples only: every example still passes through automatic source discovery.
export function redoxWorkflowExample(repository,label){
 const choice=redoxComponentChoices(repository).find(c=>c.label===label)
 if(!choice)throw Error('No source redox component for '+label)
 const session=createWorkspaceSession(repository)
 session.chemicalSystem={...session.chemicalSystem,selectedElements:[label],selectedComponents:[choice.componentId,...repository.getComponents().filter(c=>['proton','electron','solvent'].includes(c.role)).map(c=>c.id)],selectedSpecies:[],enabledPhases:['aqueous','solid','liquid'],excludedSpecies:[]}
 session.calculationDefinition=configurePourbaixDefinition(createCalculationDefinition(session.chemicalSystem,repository),[])
 const reference=redoxSupportCatalog.find(c=>c.label===label)?.reference
 session.calculationDefinition.pourbaix={componentId:choice.componentId,total:reference?.total??0.001,pH:{min:0,max:14,points:57},Eh:{min:-1,max:1.2,points:45}}
 session.visualizationState={workspace:'calculation',plot:{type:'pourbaix',live:false}}
 return session
}
