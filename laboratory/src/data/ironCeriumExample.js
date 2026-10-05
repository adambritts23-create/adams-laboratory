import {createWorkspaceSession} from '../session/laboratorySession.js'
import {createCalculationDefinition} from '../calculations/definition.js'
import {configureGeneralClosed} from '../calculations/generalClosedSetup.js'

export const ironCeriumAmounts=Object.freeze({
 'component:Fe%202%2B':1e-6,
 'component:Ce%204%2B':5e-7,
 'component:H%2B':.01,
 'component:Cl-':.010004,
})
export function ironCeriumExample(repository){
 const ids=[...Object.keys(ironCeriumAmounts),'component:H2O']
 if(ids.some(id=>!repository.getComponentById(id)))throw Error('The Fe(II), Ce(IV), H+, chloride and water source components are required.')
 const s=createWorkspaceSession(repository)
 s.chemicalSystem={...s.chemicalSystem,selectedElements:['Fe','Ce','Cl'],selectedComponents:ids,selectedSpecies:[],excludedSpecies:[],optionalSpecies:[],enabledPhases:['aqueous','liquid']}
 s.calculationDefinition=configureGeneralClosed(createCalculationDefinition(s.chemicalSystem,repository),ids.map(id=>repository.getComponentById(id)))
 s.calculationDefinition.generalClosed={...s.calculationDefinition.generalClosed,amounts:{...ironCeriumAmounts},phases:['aqueous']}
 s.visualizationState={workspace:'calculation',plot:{type:'log-concentration',live:false}}
 return s
}
