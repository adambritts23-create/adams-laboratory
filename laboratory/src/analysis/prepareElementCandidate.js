import {createWorkspaceSession} from '../session/laboratorySession.js'
import {createCalculationDefinition} from '../calculations/definition.js'
import {prepareCanonicalRedoxSession} from '../solver/prepareCanonicalRedox.js'
import {prepareRegisteredOxidation} from './registeredElementOxidation.js'
import {prepareWaterContext} from './registeredWaterContext.js'

// Internal scientific contract only. No public capability flag is changed.
export async function prepareElementCandidate(repository,registry) {
  const session=createWorkspaceSession(repository)
  session.chemicalSystem={...session.chemicalSystem,selectedComponents:[...registry.basisIds],enabledPhases:['aqueous','solid','liquid'],excludedSpecies:[]}
  session.calculationDefinition=createCalculationDefinition(session.chemicalSystem,repository)
  const prepared=await prepareCanonicalRedoxSession(session,repository,{candidateSpeciesIds:registry.rows.map(r=>r.sourceSpeciesId)})
  if(!prepared.ok) return prepared
  const model=await prepareRegisteredOxidation(prepared.system,registry),waterModel=await prepareWaterContext(repository)
  if(model.status!=='registered' || waterModel.status==='unavailable') return {ok:false,status:'unsupported',reason:model.reason??waterModel.reason,publicEnabled:false}
  return {...prepared,model,waterModel,publicEnabled:false}
}

export function elementGridDefinition(system,contract,total=contract.total) {
  const chemical={selectedComponents:system.components.map(c=>c.id),selectedSpecies:system.products.map(p=>p.id),temperature:25,pressure:1,enabledPhases:['aqueous','solid','liquid']}
  const definition=createCalculationDefinition(chemical,{getComponentById:id=>{const c=system.components.find(c=>c.id===id);return {...c,role:c.role==='ordinary'?'basis-choice':c.role==='water'?'solvent':c.role}}})
  definition.componentConditions=[{componentId:system.components[0].id,mode:'T',quantity:'total',unit:'mol/kg-H2O',value:total},{componentId:system.components[3].id,mode:'LA',quantity:'log-activity',unit:'dimensionless',value:0}]
  for(const component of system.components.slice(4)){const value=contract.additionalTotals?.[component.id];definition.componentConditions.push({componentId:component.id,mode:'T',quantity:'total',unit:'mol/kg-H2O',value})}
  definition.independentVariables=[{componentId:system.components[1].id,mode:'LAV',quantity:'pH',unit:'dimensionless',range:{min:contract.pH.min,max:contract.pH.max},points:contract.pH.points},{componentId:system.components[2].id,mode:'LAV',quantity:'Eh',unit:'V-SHE',range:{min:contract.Eh.min,max:contract.Eh.max},points:contract.Eh.points}]
  return definition
}
