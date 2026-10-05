import {auditWetLabRecipes} from './wetLabSetup.js'
import {wetLabExperimentSystem} from './ironHydroxideExample.js'
import {prepareWetLabStockEquilibria} from './wetLabStockPH.js'
import {prepareWetLabScope} from './wetLabTitration.js'
/** Optional fixed-pH stocks are solved here; mixture admission remains structural.
 * Every delivered dose still requires its own accepted ordinary equilibrium. */
export async function preflightWetLab(repository,setup,system,revision,catalog){
 try{
  system=wetLabExperimentSystem(repository,system,setup)
  const stocks=await prepareWetLabStockEquilibria(repository,setup,revision,catalog,system),audit=await auditWetLabRecipes(repository,system)
  for(const stock of Object.values(stocks))for(const row of stock.contributions)if(!['ionic','component'].includes(row.kind)&&!audit.available.some(r=>r.id===row.reagent))throw new Error(audit.recipes.find(r=>r.id===row.reagent)?.reasons.join(' ')||'Reviewed recipe unavailable.')
  const context=await prepareWetLabScope(repository,stocks,system,revision)
  return {status:'CONDITIONAL',stocks,scope:context.scope,reason:context.scope.reason+' Structural preflight passed; individual doses can still be unavailable for unsupported phases/gases or solver failure. Ideal 25 °C, additive-volume model.'}
 }catch(error){return {status:'UNAVAILABLE',reason:error.message,code:error.code,discovery:error.discovery}}
}
