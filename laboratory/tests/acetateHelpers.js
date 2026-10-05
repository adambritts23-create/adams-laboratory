import {createWorkspaceSession} from '../src/session/laboratorySession.js'
import {reconcileAutomaticSpecies} from '../src/thermodynamics/compatibility.js'
import {createCalculationDefinition} from '../src/calculations/definition.js'
export function acetateSession(repo,{acetateTotal=.5,protonTotal=0,sodiumTotal=null,sweep=true}={}){
 const session=createWorkspaceSession(repo,{solidPhasePolicy:'explicit'})
 session.chemicalSystem=reconcileAutomaticSpecies({...session.chemicalSystem,selectedElements:['C',...(sodiumTotal!==null?['Na']:[])],selectedComponents:['component:H%2B','component:H2O','component:CH3COO-',...(sodiumTotal!==null?['component:Na%2B']:[])],enabledPhases:['aqueous','liquid'],optionalSpecies:[],excludedSpecies:[]},repo)
 const d=createCalculationDefinition(session.chemicalSystem,repo)
 d.componentConditions=d.componentConditions.map(c=>c.componentId==='component:H%2B'?{...c,mode:'T',quantity:'total',unit:'mol/kg-H2O',value:protonTotal}:c.componentId==='component:CH3COO-'?{...c,value:acetateTotal}:c.componentId==='component:Na%2B'?{...c,value:sodiumTotal}:c)
 if(sweep){d.componentConditions=d.componentConditions.filter(c=>c.componentId!=='component:H%2B');d.independentVariables=[{componentId:'component:H%2B',mode:'TV',quantity:'total',unit:'mol/kg-H2O',range:{min:-1,max:1},points:81}]}
 d.dimensions=1;session.calculationDefinition=d;return session
}
