import {isPrepared,isPointInput,freeze} from '../solver/models.js'
import {isSuccessfulPointResult} from '../solver/point.js'
import {precipitateVisual} from './visual.js'
export function solidEquilibriumMessage(system, result) {
 const positive = result.solids.filter(s => s.amount > 0), selection = system.sourceIdentity.phaseSelection
 if (positive.length) return `Solid present: ${positive.map(s => s.name).join(', ')}`
 if (result.solids.length) return `${result.solids.length} compatible solid phases considered; none present.${selection?.excludedIds.length ? ` ${selection.excludedIds.length} compatible solids explicitly excluded.` : ''}`
 if (selection?.excludedIds.length) return 'Compatible solids were explicitly excluded from this calculation.'
 if (selection && !selection.compatible.length) return 'No compatible supported solid phases in the current database.'
 return 'No solid phases were selected under this configuration’s explicit phase policy.'
}
/** Read-only projection of the exact accepted object. No solve or coordinate reconstruction. */
export function acceptedState(system,input,result){
 if(!isPrepared(system)||!isPointInput(input)||!isSuccessfulPointResult(result)||result.systemId!==system.id||result.inputId!==input.id)return {ok:false,message:'Equilibrium was not established for this point.'}
  const components=system.components.flatMap((c,index)=>{
   if(c.role!=='ordinary')return []
   const contributors=[{id:c.id,name:c.name,coefficient:1,molality:result.concentrations[index],weightedMolality:result.concentrations[index]},...system.products.flatMap((p,j)=>p.phase==='aqueous'&&p.coefficients[index]!==0?[{id:p.id,name:p.name,coefficient:p.coefficients[index],molality:result.concentrations[system.components.length+j],weightedMolality:p.coefficients[index]*result.concentrations[system.components.length+j]}]:[])]
   return [{id:c.id,name:c.name,totalDissolved:result.dissolvedComponentAmounts[index],contributors,dominant:[...contributors].sort((a,b)=>b.weightedMolality-a.weightedMolality)[0]}]
  })
  const proton=system.components.findIndex(c=>c.role==='proton'),solids=result.solids.filter(s=>s.amount>0)
  return freeze({ok:true,phaseMessage:solidEquilibriumMessage(system,result),pH:proton<0?null:-result.logActivities[proton],components,solids,allSolids:result.solids,category:solids.length===0?'aqueous':solids.length===1?'one-solid':'multiple-solids',explanation:solids.length?'Positive pure-solid amounts belong to this accepted equilibrium.':'No selected candidate solid has a positive accepted amount.',visual:precipitateVisual(solids,{system,input,result}),input,result,systemId:system.id,revision:result.revision,system})
}
