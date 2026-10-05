import {prepareWetLabStocks} from './wetLabSetup.js'
import {wetLabCalculationSession} from './wetLabAnalytical.js'
import {wetLabCoordinateMetadata,wetLabError,releasePreparedStock} from './wetLabSolutions.js'
import {constructEquilibrium} from '../thermodynamics/equilibriumConstructor.js'
import {discoverReactionSet} from '../thermodynamics/compatibility.js'
import {solvePoint} from '../solver/point.js'
import {freeze} from '../solver/models.js'

const fail=out=>wetLabError(out.diagnostics?.[0]?.code??'stock-equilibrium-unavailable',out.diagnostics?.map(d=>d.message).join(' ')||'Stock equilibrium unavailable.')
/** Each bottle uses only its supplied source coordinates, with the selected System's
 * exclusions, phases and conditions. No new reactions are added to System. */
export function stockChemicalSystem(repository,stock,system){
 const supplied=new Set(Object.entries(stock.moles).filter(([,n])=>n!==0).map(([key])=>wetLabCoordinateMetadata[key]?.sourceId??key))
 for(const id of supplied)if(!system.selectedComponents.includes(id))wetLabError('component-outside-system','Select the supplied component in System first: '+id)
 const selectedComponents=system.selectedComponents.filter(id=>['proton','solvent','electron'].includes(repository.getComponentById(id)?.role)||supplied.has(id))
 const subset={...system,selectedComponents}
 const compatible=new Set(discoverReactionSet(repository,subset).rows.filter(r=>r.eligible).map(r=>r.species.id))
 return {...subset,selectedSpecies:system.selectedSpecies.filter(id=>compatible.has(id))}
}

export async function prepareStockPH(repository,stock,rawPH,chemicalSystem,{onSolve=()=>{}}={}){
 if(rawPH===undefined||rawPH===null||String(rawPH).trim()==='')return stock
 if(stock.preparationContract!=='analytical-acid-base')wetLabError('stock-ph-contract','Initial stock pH requires the analytical-component stock definition; physical reagent inventories are not adjusted.')
 if(!['number','string'].includes(typeof rawPH)||!Number.isFinite(Number(rawPH)))wetLabError('invalid-stock-ph','Enter a finite initial stock pH, or leave it blank.')
 const pH=Number(rawPH),start=performance.now(),system=stockChemicalSystem(repository,stock,chemicalSystem)
 const request=wetLabCalculationSession(repository,stock,stock.preparationRevision,system)
 if(!request.ok)fail(request)
 const proton=request.session.calculationDefinition.componentConditions.find(c=>repository.getComponentById(c.componentId)?.role==='proton')
 Object.assign(proton,{mode:'LA',quantity:'pH',unit:'dimensionless',value:pH})
 const prepared=await constructEquilibrium(repository,{adapter:'ordinary',session:request.session})
 if(!prepared.ok)fail(prepared)
 onSolve('stock')
 const result=solvePoint(prepared.system,prepared.input)
 if(!result.ok)fail(result)
 return releasePreparedStock(stock,{...prepared,result,chemicalSystem:system,requestedPH:pH,elapsedMs:performance.now()-start})
}

export async function prepareWetLabStockEquilibria(repository,setup,revision,catalog,chemicalSystem,options){
 const stocks=prepareWetLabStocks(setup,revision,catalog),prepared={}
 for(const name of ['sample','titrant']){
  try{prepared[name]=await prepareStockPH(repository,stocks[name],setup[name].initialPH,chemicalSystem,options)}
  catch(error){error.message=(name==='sample'?'Sample':'Burette')+': '+error.message;throw error}
 }
 return freeze(prepared)
}
