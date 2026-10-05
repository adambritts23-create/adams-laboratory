import {sourceComponentMetadataVersion} from '../thermodynamics/sourceComponentMetadata.js'
import {ionicMetadata,analyticalMetadata} from './wetLabIons.js'
import {acetateSource} from './acetateSource.js'
import {freeze} from '../solver/models.js'
import {equilibriumSourceFingerprint} from '../thermodynamics/equilibriumNetwork.js'
import {isSuccessfulPointResult} from '../solver/point.js'

export const volumeConvention = freeze({
 id:'dilute-ideal-aqueous-volume-v0', temperatureC:25, activityModel:'ideal',
 volumeRule:'additive delivered solution volumes', modelKgPerL:1,
 solventCoordinate:'1 model kg H2O per L solution; benchmark coordinate, NOT measured solvent mass or density',
 waterActivity:1, scope:'HCl/NaOH strong-electrolyte benchmark; no ion pairing, solids, gases or redox',
})
// Reviewed physical coordinate metadata; not equilibrium outcomes or solver routing.
export const wetLabCoordinateMetadata=freeze({protonEquivalent:{sourceId:'component:H%2B',charge:1},Na:{sourceId:'component:Na%2B',charge:1},Cl:{sourceId:'component:Cl-',charge:-1},acetate:{sourceId:acetateSource.component,charge:-1},boron:{sourceId:'component:B(OH)3',charge:0},chromium:{sourceId:'component:Cr%203%2B',charge:3}})
export const wetLabRecipes=freeze({
 HCl:{id:'HCl',compatibilityScope:'reviewed-acid-base',requiresCompatibilityScope:true,components:{protonEquivalent:1,Na:0,Cl:1},charge:0,provenance:'Explicit HCl → H+ + Cl− strong-electrolyte recipe'},
 NaOH:{id:'NaOH',compatibilityScope:'reviewed-acid-base',components:{protonEquivalent:-1,Na:1,Cl:0},charge:0,provenance:'Explicit NaOH → Na+ + OH−; OH− = H2O − H+ in the source proton/water basis'},
 CH3COOH:{id:'CH3COOH',compatibilityScope:'reviewed-acid-base',label:'Acetic acid · CH3COOH(aq)',components:{protonEquivalent:1,Na:0,Cl:0,acetate:1},charge:0,provenance:acetateSource.provenance},
 'B(OH)3':{id:'B(OH)3',label:'Boric acid · B(OH)₃',components:{protonEquivalent:0,Na:0,Cl:0,boron:1},charge:0,provenance:'Reviewed neutral boric acid; component:B(OH)3, network-composition-v2, CODATA source identity 155572; no added counterion.'},
 CrCl3:{id:'CrCl3',label:'Chromium(III) chloride · CrCl₃',components:{chromium:1,Cl:3},charge:0,sourceParts:[{sourceId:'component:Cr%203%2B',coefficient:1},{sourceId:'component:Cl-',coefficient:3}],provenance:'Reviewed idealized dissolved CrCl3 formula units: Cr(III) and three intrinsic chlorides; NIST WebBook CAS 10025-73-7. No hydrate/dissolution kinetics. Pinned source metadata and independent 12-dose reference; Ideal 25 °C, unit water activity.'},
})
export const wetLabRecipeSources=freeze({HCl:'spana:2ac52a30213c9288:159033',NaOH:'spana:2ac52a30213c9288:224689',CH3COOH:acetateSource.acid,'B(OH)3':'component:B(OH)3'})
const objects=new WeakSet()
export function wetLabError(code,message){const error=new Error(message);error.code=code;throw error}
const check=(yes,code,message)=>{if(!yes)wetLabError(code,message)}
const brand=value=>{freeze(value);objects.add(value);return value}
const baseKeys=['protonEquivalent','Na','Cl']
export const isWetLabSolution=value=>objects.has(value)
/** Release the pH reservoir into conserved signed proton equivalents. All other
 * supplied analytical inventories stay exactly as entered, including structural zeros. */
export function releasePreparedStock(stock,preparation){
 const {system,input,result}=preparation
 check(objects.has(stock)&&stock.preparationContract==='analytical-acid-base'&&isSuccessfulPointResult(result)&&result.systemId===system.id&&result.inputId===input.id&&result.revision===stock.preparationRevision,'invalid-prepared-stock','Current accepted stock equilibrium required.')
 check(!result.solids.some(s=>s.amount>0),'heterogeneous-stock','Prepared stock contains an equilibrium solid. Transport of heterogeneous stocks is not yet defined.')
 const index=system.components.findIndex(c=>c.role==='proton')
 check(index>=0&&Number.isFinite(result.componentTotals[index]),'invalid-proton-inventory','Accepted signed proton inventory is unavailable.')
 const moles={...stock.moles,protonEquivalent:result.componentTotals[index]*stock.modelSolventMassKg}
 delete moles['component:H%2B']
 return solution({...stock,moles,componentCoordinates:moles,stockPreparation:preparation,analyticalProtonAdjustment:(stock.analyticalProtonAdjustment??0)+moles.protonEquivalent-(stock.moles.protonEquivalent??0),provenance:[...stock.provenance,{operation:'prepare-at-fixed-pH-and-release-reservoir',requestedPH:preparation.requestedPH,systemId:system.id,inputId:input.id,protonMolesBefore:stock.moles.protonEquivalent??0,protonMolesAfter:moles.protonEquivalent,countercharge:'unspecified; no counterions inserted',stockComponentIds:system.components.map(c=>c.id)}]})
}
function solution({volumeMl,moles,provenance,contributions=[],preparationRevision=0,preparationContract='physical',analyticalProtonAdjustment=0,...rest}){
 const keys=Object.keys(moles)
 check(Number.isFinite(volumeMl)&&volumeMl>=0&&keys.every(k=>Number.isFinite(moles[k])),'inventory-overflow','Finite volume and analytical inventories required.')
 const charge=analyticalProtonAdjustment+contributions.reduce((n,r)=>n+r.moles*(['ionic','component'].includes(r.kind)?r.composition.charge:wetLabRecipes[r.reagent].charge),0)
 check(preparationContract==='analytical-acid-base'||Math.abs(charge)<=128*Number.EPSILON*Math.max(1,contributions.reduce((n,r)=>n+Math.abs(r.moles*(r.kind==='ionic'?r.composition.charge:wetLabRecipes[r.reagent].charge)),0)),'unbalanced-recipe','No counterions are inserted or repaired.')
 return brand({version:'wet-lab-solutions-v1',preparationContract,chargeDisclosure:preparationContract==='analytical-acid-base'?'Analytical component stock; countercharge unspecified; not a complete physical solution.':'Physical/reagent stock',convention:volumeConvention,...rest,volumeMl,finalVolumeMl:volumeMl,contributions,preparationRevision,sourceFingerprint:equilibriumSourceFingerprint,metadataVersion:contributions.some(r=>['ionic','component'].includes(r.kind))?sourceComponentMetadataVersion:'network-composition-v2',totalPhysicalMoles:preparationContract==='physical'?contributions.reduce((n,r)=>n+r.moles,0):null,totalSpecifiedMoles:contributions.reduce((n,r)=>n+r.moles,0),componentCoordinates:moles,
  volumeOrigin:'user-defined delivered solution volume',moles,chargeEquivalents:charge,...(analyticalProtonAdjustment!==0?{analyticalProtonAdjustment}:{}),
  modelSolventMassKg:volumeMl/1000,measuredSolventMassKg:null,provenance})
}
export function prepareStockSolution(request){
 check(request&&Object.keys(request).every(k=>['reagent','concentrationMolPerL','volumeMl','temperatureC','convention'].includes(k)),'invalid-stock','Only reagent, mol/L, available mL, temperatureC and convention are accepted.')
 const {reagent,concentrationMolPerL:c,volumeMl:v,temperatureC,convention}=request
 check(Object.hasOwn(wetLabRecipes,reagent),'unsupported-reagent','Only reviewed physical reagent recipes are supported; arbitrary or unbalanced recipes are refused.')
 check(convention===volumeConvention.id&&temperatureC===25,'incompatible-convention','Explicit v0 convention and 25 °C required.')
 check(Number.isFinite(c)&&c>0&&Number.isFinite(v)&&v>0,'invalid-stock','Positive finite stock concentration and available volume required.')
 return prepareSolution({volumeMl:v,contributions:[{id:'reagent',reagent,concentrationMolPerL:c}],temperatureC,convention})
}
/** All rows occupy ONE final solution volume, never one stock volume per solute. */
export function prepareSolution(request,catalog=null){
 check(request&&Object.keys(request).every(k=>['volumeMl','contributions','temperatureC','convention','preparationRevision'].includes(k)),'invalid-stock','Only reviewed preparation fields are accepted; identities are source-owned.')
 const {volumeMl,contributions,temperatureC,convention,preparationRevision=0}=request
 check(convention===volumeConvention.id&&temperatureC===25,'incompatible-convention','Explicit model-volume convention and 25 °C required.')
 check(Number.isFinite(volumeMl)&&volumeMl>0&&Number.isInteger(preparationRevision)&&preparationRevision>=0&&Array.isArray(contributions)&&contributions.length>0&&contributions.length<=16,'invalid-stock','Positive final volume and 1–16 physical contribution rows required.')
 const seen=new Set(),moles=Object.fromEntries(baseKeys.map(k=>[k,0])),rows=contributions.map(row=>{
  check(row&&Object.keys(row).every(k=>['id','reagent','concentrationMolPerL','kind','sourceId'].includes(k))&&typeof row.id==='string'&&row.id&&!seen.has(row.id),'invalid-stock','Unique stable reviewed contribution rows required; source identities and additions are recipe-owned.');seen.add(row.id)
  check(row.kind===undefined||row.kind==='ionic','invalid-stock','Unknown physical contribution kind; no recipe fallback.')
  if(row.kind==='ionic'){
   const {form,metadata}=ionicMetadata(catalog,row.sourceId)
   check(Number.isFinite(row.concentrationMolPerL)&&row.concentrationMolPerL>=0,'invalid-stock','Nonnegative finite mol/L required for ionic contributions.')
   const amount=row.concentrationMolPerL*volumeMl/1000
   const key=Object.entries(wetLabCoordinateMetadata).find(([,m])=>m.sourceId===row.sourceId)?.[0]??row.sourceId
   moles[key]=(moles[key]??0)+amount
   return {id:row.id,kind:'ionic',reagent:form.name,sourceId:form.id,elementAssociations:form.associations,composition:metadata,concentrationMolPerL:row.concentrationMolPerL,moles:amount,provenance:{kind:'source-bound-ionic-preparation',sourceIdentity:metadata.sourceIdentity,form:form.id},intrinsicComponents:{[form.id]:1},automaticAdditions:[],metadataVersion:catalog.version}
  }
  check(!Object.hasOwn(row,'sourceId'),'invalid-stock','Reviewed recipe source identities are recipe-owned; explicit sourceId requires ionic kind.')
  check(Object.hasOwn(wetLabRecipes,row.reagent),'unsupported-reagent','Choose a reviewed physical reagent recipe.')
  check(Number.isFinite(row.concentrationMolPerL)&&row.concentrationMolPerL>0,'invalid-stock','Positive finite mol/L required for every contribution.')
  const recipe=wetLabRecipes[row.reagent],amount=row.concentrationMolPerL*(volumeMl/1000)
  for(const [k,n] of Object.entries(recipe.components))moles[k]=(moles[k]??0)+n*amount
  return {id:row.id,reagent:recipe.id,sourceId:wetLabRecipeSources[recipe.id],...(recipe.sourceParts?{sourceParts:recipe.sourceParts}:{}),concentrationMolPerL:row.concentrationMolPerL,moles:amount,provenance:recipe.provenance,intrinsicComponents:recipe.components,automaticAdditions:[],metadataVersion:'network-composition-v2',recipeVersion:'wet-lab-reviewed-recipes-v1'}
 })
 const single=rows.length===1?rows[0]:null
 return solution({kind:'stock',volumeMl,moles,contributions:rows,preparationRevision,reagent:single?.reagent??'Mixed solution',recipe:single?wetLabRecipes[single.reagent]:null,concentrationMolPerL:single?.concentrationMolPerL??null,soluteMoles:rows.reduce((s,r)=>s+r.moles,0),provenance:[{operation:'prepare-solution-to-final-volume',volumeMl,preparationRevision,contributions:rows}]})
}
/** Pure dispensing: callers advance to remainder for sequential use. The input is never depleted in place. */
export function dispenseVolume(stock,volumeMl){
 check(objects.has(stock),'forged-preparation','A branded stock, mixture or remaining solution is required.')
 check(Number.isFinite(volumeMl)&&volumeMl>=0&&volumeMl<=stock.volumeMl,'invalid-dispense','Deliver a nonnegative volume no greater than the available solution.')
 const keys=Object.keys(stock.moles),ratio=stock.volumeMl===0?0:volumeMl/stock.volumeMl
 const moles=Object.fromEntries(keys.map(k=>[k,stock.moles[k]*ratio]))
 const aliquot=solution({kind:'aliquot',analyticalProtonAdjustment:(stock.analyticalProtonAdjustment??0)*ratio,preparationContract:stock.preparationContract,volumeMl,moles,contributions:stock.contributions.map(r=>({...r,moles:r.moles*ratio})),preparationRevision:stock.preparationRevision,provenance:[...stock.provenance,{operation:'dispense',fromVolumeMl:stock.volumeMl,volumeMl}]})
 const remainder=solution({kind:'remainder',analyticalProtonAdjustment:(stock.analyticalProtonAdjustment??0)*(1-ratio),preparationContract:stock.preparationContract,volumeMl:stock.volumeMl-volumeMl,moles:Object.fromEntries(keys.map(k=>[k,stock.moles[k]-moles[k]])),contributions:stock.contributions.map(r=>({...r,moles:r.moles-r.moles*ratio})),preparationRevision:stock.preparationRevision,provenance:[...stock.provenance,{operation:'remaining-after-dispense',volumeMl}]})
 return freeze({aliquot,remainder})
}
export function mixSolutions(...parts){
 check(parts.length>0&&parts.every(p=>objects.has(p)&&p.convention===volumeConvention),'incompatible-preparation','Mix only branded v0 preparations.')
 check(parts.every(p=>p.preparationRevision===parts[0].preparationRevision),'stale-preparation','Cannot mix preparations from different revisions.')
 const keys=[...new Set(parts.flatMap(p=>Object.keys(p.moles)))];
 return solution({kind:'mixture',analyticalProtonAdjustment:parts.reduce((n,p)=>n+(p.analyticalProtonAdjustment??0),0),preparationContract:parts.some(p=>p.preparationContract==='analytical-acid-base')?'analytical-acid-base':'physical',volumeMl:parts.reduce((n,p)=>n+p.volumeMl,0),moles:Object.fromEntries(keys.map(k=>[k,parts.reduce((n,p)=>n+(p.moles[k]??0),0)])),contributions:parts.flatMap((p,i)=>p.contributions.map(r=>({...r,id:`part${i}/${r.id}`,parentRowId:r.id,parentPreparationRevision:p.preparationRevision}))),preparationRevision:Math.max(...parts.map(p=>p.preparationRevision)),provenance:parts.flatMap(p=>p.provenance).concat({operation:'additive-volume-mix',parts:parts.length})})
}



/** Separate analytical stock contract; the physical constructor above is unchanged. */
export function prepareAnalyticalSolution(request,catalog){
 check(request&&Object.keys(request).every(k=>['volumeMl','contributions','temperatureC','convention','preparationRevision'].includes(k)),'invalid-analytical-stock','Only source-bound analytical preparation fields are accepted.')
 check(request?.temperatureC===25&&request?.convention===volumeConvention.id,'incompatible-convention','Explicit model-volume convention and 25 °C required.')
 const {volumeMl,contributions,preparationRevision=0}=request
 check(Number.isFinite(volumeMl)&&volumeMl>0&&Number.isInteger(preparationRevision)&&preparationRevision>=0&&Array.isArray(contributions)&&contributions.length>0&&contributions.length<=16,'invalid-analytical-stock','Positive final volume and 1–16 analytical component rows required.')
 const seen=new Set(),moles={protonEquivalent:0}
 const rows=contributions.map(row=>{
  check(row?.kind==='component'&&typeof row.id==='string'&&row.id&&!seen.has(row.id)&&Object.keys(row).every(k=>['id','kind','sourceId','concentrationMolPerL'].includes(k)),'invalid-analytical-stock','Unique source-bound component rows required. Reagents use the physical stock contract.');seen.add(row.id)
  const m=analyticalMetadata(catalog,row.sourceId),c=row.concentrationMolPerL
  check(Number.isFinite(c)&&c>=0,'invalid-analytical-stock','Nonnegative finite analytical mol/L required.')
  const amount=c*volumeMl/1000
  for(const [id,n] of Object.entries(m.coefficients)){if(id==='component:H2O')continue;const key=Object.entries(wetLabCoordinateMetadata).find(([,v])=>v.sourceId===id)?.[0]??id;moles[key]=(moles[key]??0)+amount*n}
  return {...row,reagent:m.name,moles:amount,composition:m,provenance:{kind:'analytical-source-coordinate',source:m.source},intrinsicComponents:m.coefficients,automaticAdditions:[]}
 })
 return solution({kind:'stock',preparationContract:'analytical-acid-base',volumeMl,moles,contributions:rows,preparationRevision,reagent:rows.length===1?rows[0].reagent:'Analytical components',concentrationMolPerL:rows.length===1?rows[0].concentrationMolPerL:null,provenance:[{operation:'prepare-analytical-components',volumeMl,preparationRevision,contributions:rows}]})
}
