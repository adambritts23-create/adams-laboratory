import {constructEquilibrium} from '../thermodynamics/equilibriumConstructor.js'
import {createCalculationDefinition} from './definition.js'
import {wetLabCoordinateMetadata,isWetLabSolution} from './wetLabSolutions.js'

/** Inventory transport only. The selected System and ordinary Calculation constructor own chemistry. */
export function wetLabCalculationSession(repository,mixture,revision,chemicalSystem){
 const fail=(code,message)=>({ok:false,diagnostics:[{code,message}]})
 if(!isWetLabSolution(mixture)||mixture.preparationRevision!==revision||mixture.volumeMl<=0)return fail('invalid-analytical-preparation','Current branded positive-volume analytical preparation required.')
 if(!Array.isArray(chemicalSystem?.selectedComponents)||!Array.isArray(chemicalSystem?.selectedSpecies))return fail('missing-selected-system','Select the chemical system in System before preparing an analytical experiment.')
 if(chemicalSystem.selectedComponents.some(id=>repository.getComponentById(id)?.role==='electron'))return fail('analytical-redox-deferred','Acid/base Wet Lab requires a System without e⁻. Redox experiments use a separate, currently unavailable contract.')
 const totals={}
 for(const [key,moles] of Object.entries(mixture.moles)){
  const id=wetLabCoordinateMetadata[key]?.sourceId??key
  if(moles!==0&&!chemicalSystem.selectedComponents.includes(id))return fail('component-outside-system','Select the supplied component in System first: '+(repository.getComponentById(id)?.name??id))
  totals[id]=(totals[id]??0)+moles/mixture.modelSolventMassKg
 }
 if(!chemicalSystem.selectedComponents.some(id=>repository.getComponentById(id)?.role==='proton'))return fail('missing-proton-component','Select H⁺ in System to conserve signed analytical proton equivalents.')
 const definition=createCalculationDefinition(chemicalSystem,repository)
 definition.componentConditions=chemicalSystem.selectedComponents.map(id=>repository.getComponentById(id)?.role==='solvent'?{componentId:id,mode:'LA',quantity:'log-activity',unit:'dimensionless',value:0}:{componentId:id,mode:'T',quantity:'total',unit:'mol/kg-H2O',value:totals[id]??0})
 return {ok:true,session:{chemicalSystem,calculationDefinition:definition,revision},totals}
}
export async function compileWetLabAnalytical(repository,mixture,revision,chemicalSystem){
 const request=wetLabCalculationSession(repository,mixture,revision,chemicalSystem)
 if(!request.ok)return request
 return constructEquilibrium(repository,{adapter:'ordinary',session:request.session})
}
