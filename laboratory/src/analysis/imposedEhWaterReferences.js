import {prepareWaterContext,waterContext} from './registeredWaterContext.js'
// Presentation annotation only. Source failure must never gate an equilibrium.
export async function imposedEhWaterReferences(repository,request,temperature){
 if(request.mode==='fixed')return {status:'unavailable',reason:'requires-fixed-pH-Eh-axis'}
 if(temperature.value!==25||temperature.unit!=='C')return {status:'unavailable',reason:'water-reference-temperature-outside-validated-scope'}
 const context=waterContext(await prepareWaterContext(repository),request.pH,0)
 if(context.status!=='available')return context
 return {status:'available',pH:request.pH,temperatureC:25,referenceElectrode:'SHE',references:context.waterReferences,
  interpretation:'Thermodynamic references only; outside-window equilibria remain valid. Gas evolution kinetics, overpotential and electrode kinetics are not modeled.'}
}
