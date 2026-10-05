import {projectSourceInventory} from '../thermodynamics/sourceConservation.js'
import {compileClosedRedoxNetwork} from '../thermodynamics/closedRedoxNetwork.js'
import {prepareChemicalSystem,createPointInput,freeze,identity} from './models.js'
import {solvePoint,closedSolidActivePolicy} from './point.js'
import {multiSolidPolicy,sourceSolidPolicy,sourceSolidLimits} from './assemblages.js'
import {peToEh} from './redox.js'
import {numericalValidationContract as tolerance} from './validationContract.js'
const preparations=new WeakSet(),results=new WeakSet()
export const isClosedRedoxResult=r=>results.has(r)
const fail=(code,message,extra={})=>freeze({ok:false,mode:'closed-redox',diagnostics:[{code,message}],...extra})
const arithmetic=terms=>128*Number.EPSILON*Math.max(1,terms.reduce((n,x)=>n+Math.abs(x),0))
/** Reagent amounts define preparation, not separate final valence totals. */
export async function prepareClosedRedox(request){
 const network=compileClosedRedoxNetwork(request)
 if(!network.ok)return network
 const basis=network.basisIds.map(id=>network.sourceSpecies.find(s=>s.id===id))
 const products=network.physical.filter(s=>!network.basisIds.includes(s.id)).map(s=>({id:s.id,name:s.name,phase:s.phase,charge:s.charge,coefficients:network.algebra.componentExpressions[s.id].coefficients,logBeta:network.algebra.componentExpressions[s.id].logK,sourceRecord:{identity:s.sourceIdentity,networkVersion:network.version,halfReactions:network.halves,expression:network.algebra.componentExpressions[s.id]}}))
 // Distinct source carriers may collapse when spaces in formula/charge labels
 // are removed (EuCl 2+ versus EuCl2+). Preserve IDs and source labels; give only
 // such internal solver display names an identity suffix. No equation changes.
 const labels=new Map(basis.map(s=>[s.name.replaceAll(/\s/g,''),s]))
 for(const product of products){
  const key=product.name.replaceAll(/\s/g,''),prior=labels.get(key),source=network.sourceSpecies.find(s=>s.id===product.id)
  const different=prior&&(prior.charge!==source.charge||[...new Set([...Object.keys(prior.elements??{}),...Object.keys(source.elements??{})])].some(e=>(prior.elements?.[e]??0)!==(source.elements?.[e]??0)))
  if(different)product.name+=` [${product.id}]`
  // Same-composition/charge aliases retain the ordinary duplicate rejection.
  labels.set(product.name.replaceAll(/\s/g,''),source)
 }
 const p=await prepareChemicalSystem({components:basis,products,basisStatus:'explicit-direct',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{mode:'closed-redox',version:network.version,network}})
 if(!p.ok)return p
 return prepareInventory(network,p.system,request.preparation,request.revision??0)
}

/** Reuse immutable source algebra, never the previous dose inventories or result. */
export async function reprepareClosedRedox(template,supplied,revision=0){
 if(!preparations.has(template)||template.solidClosure)return fail('unprepared-closed-redox','An aqueous branded preparation is required for inventory rebinding.')
 return prepareInventory(template.network,template.system,supplied,revision)
}
async function prepareInventory(network,system,supplied,revision){
 if(!supplied||!['electroneutral','inert-background'].includes(supplied.chargePolicy)||!supplied.amounts||typeof supplied.description!=='string')return fail('closed-preparation-required','Supply explicit reagent species amounts and electroneutral charge policy.')
 if(Object.keys(supplied.amounts).some(id=>!network.physical.some(s=>s.id===id))||Object.values(supplied.amounts).some(n=>!Number.isFinite(n)||n<0)||!Object.values(supplied.amounts).some(n=>n>0))return fail('invalid-reagent-inventory','Only nonnegative finite physical reagent amounts are permitted; no electron inventory.')
 const amounts=network.physical.map(s=>supplied.amounts[s.id]??0)
 const inventories=network.conservation.map(r=>({...r,total:r.weights.reduce((n,w,i)=>n+w*amounts[i],0)}))
 const charge=inventories.find(r=>r.key==='charge'),chargeTerms=amounts.map((n,i)=>n*charge.weights[i])
 if(supplied.chargePolicy==='electroneutral'&&Math.abs(charge.total)>arithmetic(chargeTerms))return fail('unbalanced-preparation','Explicit counterions/reagents do not form an electroneutral preparation; none are manufactured.')
 const exactTargets=network.sourceConservation?projectSourceInventory(network.sourceConservation,supplied.amounts,network.basisIds,network.water?.id):null
 const constraints=network.basisIds.map((componentId,i)=>({componentId,kh:componentId===network.water?.id?2:1,value:exactTargets?exactTargets[i]:componentId===network.water?.id?0:network.physical.reduce((n,s,j)=>n+amounts[j]*network.algebra.componentExpressions[s.id].coefficients[i],0)}))
 // A signed projection can leave a floating-point cancellation residue (e.g.
 // 1e-20 instead of zero). Keep that target exactly; avoid using the residue
 // as a free-species starting activity. This only seeds the existing solver.
 const projectionScales=network.basisIds.map((id,i)=>network.physical.reduce((n,s,j)=>n+Math.abs(amounts[j]*network.algebra.componentExpressions[s.id].coefficients[i]),0))
 const cancellationSeed=constraints.map((c,i)=>c.kh===1&&c.value!==0&&Math.abs(c.value)<=128*Number.EPSILON*projectionScales[i])
 const initialLogActivities=cancellationSeed.some(Boolean)?constraints.map((c,i)=>c.kh===2?c.value:Math.log10(cancellationSeed[i]?projectionScales[i]:Math.abs(c.value)||1e-7)):null
 const input=await createPointInput(system,{constraints,unit:system.unit,revision,temperatureC:25,pressureBar:1,activityModel:'ideal'})
 if(!input.ok)return input
 const prepared=freeze({ok:true,mode:'closed-redox',version:network.version,system,input:input.input,network,inventories,initialLogActivities,preparation:structuredClone(supplied),preparationId:await identity(supplied),equilibriumId:input.input.id})
 preparations.add(prepared);return prepared
}
/** Extend an already compiled aqueous physical basis with source-derived pure phases.
 * Aqueous source equalities stay intact; solid laws are checked by complementarity.
 */
export async function prepareClosedSolidExtension(prepared,solids){
 if(!preparations.has(prepared))return fail('unprepared-closed-redox','A branded aqueous physical preparation is required.')
 if(!Array.isArray(solids)||!solids.length||prepared.network.sourceSpecies.length+solids.length>sourceSolidLimits.sourceSpecies||prepared.network.halves.length+prepared.network.ordinaryReactions.length+solids.length>sourceSolidLimits.sourceReactions)return fail('solid-network-capacity-exceeded','The existing candidate/species/reaction bounds cannot be exceeded.')
 if(new Set(solids.map(s=>s.id)).size!==solids.length)return fail('invalid-solid-scope','Duplicate source solids are not a valid candidate set.')
 const weight=(row,s)=>row.sourceDerived?row.basisWeights.reduce((v,w,i)=>v+w*s.coefficients[i],0):row.key==='charge'?s.charge:row.key==='H-2O'?(s.elements.H??0)-2*(s.elements.O??0):(s.elements[row.key]??0)
 for(const s of solids){
  if(s.phase!=='solid'||s.charge!==0||(!s.elements&&!prepared.network.sourceConservation)||(s.elements&&(!Object.keys(s.elements).length||Object.values(s.elements).some(n=>!Number.isSafeInteger(n)||n<0)))||!s.sourceIdentity?.id)return fail('missing-solid-composition','A neutral, source-bound integer composition is required.')
  if(!Array.isArray(s.coefficients)||s.coefficients.length!==prepared.system.components.length||s.coefficients.some(v=>!Number.isFinite(v))||!Number.isFinite(s.logBeta))return fail('invalid-solid-law','Finite transformed solid law required.')
  if(prepared.inventories.some(r=>{const v=r.basisWeights.reduce((n,w,i)=>n+w*s.coefficients[i],0),expected=weight(r,s);return Math.abs(v-expected)>128*Number.EPSILON*Math.max(1,Math.abs(v),Math.abs(expected))}))return fail('invalid-solid-conservation','Transformed solid law does not preserve the physical inventory basis.')
 }
 const p=await prepareChemicalSystem({...prepared.system,products:[...prepared.system.products,...solids.map(s=>({id:s.id,name:s.name,phase:'solid',coefficients:s.coefficients,logBeta:s.logBeta,sourceRecord:s.sourceIdentity}))],solidPolicy:solids.length>12?sourceSolidPolicy:multiSolidPolicy,sourceIdentity:{...prepared.system.sourceIdentity,solidClosure:closedSolidActivePolicy,solids}})
 if(!p.ok)return p
 const input=await createPointInput(p.system,{...prepared.input,constraints:prepared.input.constraints})
 if(!input.ok)return input
 const inventories=prepared.inventories.map(r=>({...r,weights:[...r.weights,...solids.map(s=>weight(r,s))]}))
 const network={...prepared.network,...(prepared.network.sourceConservation?{sourceConservation:{...prepared.network.sourceConservation,provenance:{...prepared.network.sourceConservation.provenance,phaseScope:{kind:'aqueous-and-pure-solids',admittedSolids:solids.map(s=>s.id).sort()}}}}:{}),physical:[...prepared.network.physical,...solids],sourceSpecies:[...prepared.network.sourceSpecies,...solids],conservation:inventories}
 const value=freeze({...prepared,system:p.system,input:input.input,network,inventories,equilibriumId:input.input.id,solidClosure:closedSolidActivePolicy})
 preparations.add(value);return value
}
/** One simultaneous equilibrium. Extra closed-system checks never weaken inner acceptance. */
export function solveClosedRedox(prepared){
 if(!preparations.has(prepared))return fail('unprepared-closed-redox','Use the branded closed-redox preparation path.')
 const {system,input,network}=prepared,result=solvePoint(system,input,{...(prepared.initialLogActivities?{initialLogActivities:prepared.initialLogActivities}:{}),...(prepared.solidClosure?{phaseSelection:closedSolidActivePolicy}:{})})
 if(!result.ok)return fail('closed-equilibrium-failed','Unchanged point solver did not accept this network.',{result})
 const logs=Object.fromEntries(result.speciesIds.map((id,i)=>[id,id===network.water?.id?result.logActivities[i]:Math.log10(result.concentrations[i])]))
 const inventoryChecks=prepared.inventories.map(row=>{
  const terms=network.physical.map((s,i)=>row.weights[i]*result.concentrations[result.speciesIds.indexOf(s.id)])
  const actual=terms.reduce((a,b)=>a+b,0),residual=actual-row.total
  const limit=row.basisWeights.reduce((n,w,i)=>n+Math.abs(w)*result.residuals.componentBalanceLimits[i],0)+arithmetic(terms)
  return {key:row.key,total:row.total,actual,residual,limit,ok:Math.abs(residual)<=limit}
 })
 const ordinaryChecks=network.ordinaryReactions.map(r=>{
  const terms=[(r.productCoefficient??1)*logs[r.productId],-r.logK,...r.terms.filter(t=>t.coefficient!==0).map(t=>-t.coefficient*logs[t.id])]
  const residual=terms.reduce((a,b)=>a+b,0),limit=tolerance.massActionLogResidualTolerance+arithmetic(terms)
  return {reactionId:r.id,residual,limit,ok:Number.isFinite(residual)&&Math.abs(residual)<=limit}
 })
 const waterBalance=network.water?(()=>{
  if(network.physical.some(s=>!s.elements)){const wi=network.basisIds.indexOf(network.water.id),waterToSolutes=network.physical.reduce((v,s)=>v+(s.coefficients??network.algebra.componentExpressions[s.id].coefficients)[wi]*(result.concentrations[result.speciesIds.indexOf(s.id)]-(prepared.preparation.amounts[s.id]??0)),0);return {convention:'Unit water activity; solvent-independent source conservation; elemental H/O interpretation unavailable.',waterToSolutes,logActivity:logs[network.water.id],elementalStatus:'unavailable',ok:logs[network.water.id]===0&&Number.isFinite(waterToSolutes)}}
  const inventory=(key,initial)=>network.physical.reduce((n,s)=>n+(s.elements[key]??0)*(initial?(prepared.preparation.amounts[s.id]??0):result.concentrations[result.speciesIds.indexOf(s.id)]),0)
  const initialH=inventory('H',true),initialO=inventory('O',true),finalH=inventory('H',false),finalO=inventory('O',false),waterToSolutes=finalO-initialO
  const residual=finalH-initialH-2*waterToSolutes,limit=inventoryChecks.find(r=>r.key==='H-2O').limit
  return {convention:'Unit solvent-water activity; conserved solute H-2O, no finite water inventory.',logActivity:logs[network.water.id],initialSoluteH:initialH,initialSoluteO:initialO,finalSoluteH:finalH,finalSoluteO:finalO,waterToSolutes,residual,limit,ok:logs[network.water.id]===0&&Math.abs(residual)<=limit}
 })():null
 const potentials=network.halves.map(r=>{
  const electrons=r.terms.find(t=>t.id===network.electronId).coefficient
  const terms=[(r.productCoefficient??1)*logs[r.productId],-r.logK,...r.terms.filter(t=>t.id!==network.electronId).map(t=>-t.coefficient*logs[t.id])]
  const pe=-terms.reduce((a,b)=>a+b,0)/electrons
  return {reactionId:r.id,electronCoefficient:electrons,pe,Eh:peToEh(pe),peErrorBound:(tolerance.massActionLogResidualTolerance+arithmetic(terms))/Math.abs(electrons)}
 })
 const commonPe=potentials[0].pe
 const potentialChecks=potentials.map(p=>({...p,difference:p.pe-commonPe,agreementLimit:p.peErrorBound+potentials[0].peErrorBound,ok:Number.isFinite(p.pe)&&Math.abs(p.pe-commonPe)<=p.peErrorBound+potentials[0].peErrorBound}))
 const netChecks=network.cancellations.map(c=>{const residual=Object.entries(c.coefficients).filter(([id])=>id!==network.electronId).reduce((n,[id,v])=>n+v*logs[id],0)-c.logK;const limit=c.multipliers.reduce((n,m)=>n+Math.abs(m),0)*tolerance.massActionLogResidualTolerance+arithmetic([c.logK]);return {sourceIds:c.sourceIds,residual,limit,ok:Number.isFinite(residual)&&Math.abs(residual)<=limit}})
 if([...inventoryChecks,...potentialChecks,...netChecks,...ordinaryChecks,...(waterBalance?[waterBalance]:[])].some(c=>!c.ok))return fail('closed-inspection-failed','Physical inventory, charge, solvent closure or admitted reaction laws did not pass.',{result,inventoryChecks,potentialChecks,netChecks,ordinaryChecks,waterBalance})
 const accepted=freeze({ok:true,mode:'closed-redox',version:network.version,system,input,result,preparationId:prepared.preparationId,equilibriumId:prepared.equilibriumId,inspection:{nonRedoxReactions:ordinaryChecks,waterBalance,pH:network.protonId?-logs[network.protonId]:null,protonConvention:network.protonId?'Derived from closed solute inventories; no imposed proton activity.':null,inventories:inventoryChecks,potentials:potentialChecks,netReactions:netChecks,pe:commonPe,Eh:peToEh(commonPe),potentialConvention:'Derived from supplied half-reaction standard states; not an imposed reservoir.',chargePolicy:prepared.preparation.chargePolicy==='inert-background'?'Ideal fictitious inert countercharge; reactive charge conserved; total charge independently checked.':'Explicit electroneutral reagent preparation; physical charge residual independently checked.',...(prepared.preparation.chargePolicy==='inert-background'?{inertCountercharge:{unit:'mol charge equivalents/kg H2O',background:-prepared.inventories.find(r=>r.key==='charge').total,reactive:inventoryChecks.find(r=>r.key==='charge').actual,residual:inventoryChecks.find(r=>r.key==='charge').residual,limit:inventoryChecks.find(r=>r.key==='charge').limit,ok:inventoryChecks.find(r=>r.key==='charge').ok}}:{})}})
 results.add(accepted);return accepted
}
