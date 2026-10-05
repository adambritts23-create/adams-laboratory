import { isPrepared, freeze } from '../solver/models.js'
import { acceptedState } from '../beaker/acceptedState.js'
import { componentBalanceTolerance } from '../solver/validationContract.js'

// Declared classification resolution: one part in 100 million of analytical
// inventory (0.000001 percentage point). This is not a phase-coexistence test.
export const oxidationTieTolerance = 1e-8
const models = new WeakSet()
const unavailable = (reason, details = {}) => freeze({ status:'unavailable', reason, predominant:null, ...details })
const evidence = value => value && typeof value.statement==='string' && value.statement.length>0 && Array.isArray(value.references) && value.references.length>0

/** Assignment requires external authoritative metadata. Source electron counts
 * alone cannot localize ligand redox or distinguish a mixed-valence partition.
 * Metadata is bound to an exact prepared system; nothing is inferred from names.
 */
export function prepareOxidationAllocation(system, metadata) {
  if (!isPrepared(system) || system.sourceIdentity.kind!=='canonical-redox-basis-v1' || metadata?.systemId!==system.id) return unavailable('unvalidated-canonical-system')
  const ordinary=system.components.flatMap((c,i)=>c.role==='ordinary'?[i]:[]), e=system.components.findIndex(c=>c.role==='electron')
  if (ordinary.length!==1 || e<0) return unavailable('unsupported-inventory')
  const index=ordinary[0], reference=metadata.reference
  if (reference?.componentId!==system.components[index].id || !Number.isInteger(reference.oxidationState) || !evidence(reference.provenance)) return unavailable('unresolved-reference-oxidation-state')
  const rows=[{...system.components[index],count:1,electrons:0},...system.products.filter(p=>p.coefficients[index]!==0).map(p=>({...p,count:p.coefficients[index],electrons:p.coefficients[e]}))]
  const allocations=[]
  for(const row of rows){
    const certificate=metadata.carriers?.[row.id]
    if (!certificate || !evidence(certificate.provenance) || certificate.electronLocalization!=='conserved-component-only') return unavailable('unresolved-carrier',{carrierId:row.id})
    const aggregate=row.count*reference.oxidationState-row.electrons
    let distribution=certificate.allocation
    if (!distribution) {
      // Multi-atom carriers need an explicit homovalence certificate; an integer
      // average by itself does not establish a discrete oxidation state.
      if (row.count!==1 && certificate.homovalent!==true) return unavailable('unresolved-mixed-valence',{carrierId:row.id})
      const oxidationState=aggregate/row.count
      if (!Number.isInteger(oxidationState)) return unavailable('unresolved-mixed-valence',{carrierId:row.id})
      distribution=[{oxidationState,count:row.count}]
    }
    if (!Array.isArray(distribution) || !distribution.length || distribution.some(d=>!Number.isInteger(d.oxidationState)||!Number.isInteger(d.count)||d.count<=0) || new Set(distribution.map(d=>d.oxidationState)).size!==distribution.length || distribution.reduce((n,d)=>n+d.count,0)!==row.count || distribution.reduce((n,d)=>n+d.count*d.oxidationState,0)!==aggregate) return unavailable('inconsistent-oxidation-allocation',{carrierId:row.id})
    allocations.push({id:row.id,name:row.name,phase:row.phase??'aqueous',componentCount:row.count,aggregateOxidationNumber:aggregate,distribution:structuredClone(distribution).sort((a,b)=>a.oxidationState-b.oxidationState),provenance:structuredClone(certificate.provenance)})
  }
  const model=freeze({status:'supported-validation',systemId:system.id,index,reference:structuredClone(reference),allocations,metadataScope:metadata.scope??'unspecified',publicSupported:false,tieTolerance:oxidationTieTolerance})
  models.add(model);return model
}

/** Pure bookkeeping for already accepted carrier amounts. Exported to permit
 * independent mathematical tests; callers cannot use this to brand equilibrium.
 */
export function summarizeOxidationInventory(carriers,total) {
  if (!Number.isFinite(total)||total<=0||carriers.some(c=>!Number.isFinite(c.amount)||c.amount<0||!Array.isArray(c.distribution)||c.distribution.some(d=>!Number.isInteger(d.oxidationState)||!Number.isInteger(d.count)||d.count<=0))) return unavailable('invalid-inventory')
  const states=new Map(),weighted=[]
  for(const carrier of [...carriers].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0))for(const d of [...carrier.distribution].sort((a,b)=>a.oxidationState-b.oxidationState)){
    const amount=carrier.amount*d.count
    states.set(d.oxidationState,(states.get(d.oxidationState)??0)+amount)
    weighted.push({id:carrier.id,name:carrier.name,phase:carrier.phase,oxidationState:d.oxidationState,componentAmount:amount,formulaAmount:carrier.amount})
  }
  const sum=[...states.values()].reduce((a,b)=>a+b,0),residual=sum-total,tolerance=componentBalanceTolerance(total,total)
  if (!Number.isFinite(sum)||sum<=0||Math.abs(residual)>tolerance) return unavailable('oxidation-inventory-does-not-close',{sum,total,residual,tolerance})
  if(tolerance/total>oxidationTieTolerance/4)return unavailable('inventory-resolution-insufficient',{total,tolerance})
  const fractions=[...states].map(([oxidationState,amount])=>({oxidationState,amount,fraction:amount/total})).sort((a,b)=>b.fraction-a.fraction||a.oxidationState-b.oxidationState)
  const largestFraction=fractions[0]?.fraction??0,secondLargestFraction=fractions[1]?.fraction??0,margin=largestFraction-secondLargestFraction
  const tiedStates=fractions.filter(f=>largestFraction-f.fraction<=oxidationTieTolerance).map(f=>f.oxidationState)
  const tie=tiedStates.length>1,predominant=tie?null:fractions[0].oxidationState,within=weighted.filter(c=>c.oxidationState===predominant&&c.componentAmount>0)
  const largestCarrier=Math.max(0,...within.map(c=>c.componentAmount))
  return freeze({status:tie?'tie':'classified',predominant,tiedStates:tie?tiedStates:[],majority:largestFraction>0.5,largestFraction,secondLargestFraction,margin,fractions:fractions.sort((a,b)=>a.oxidationState-b.oxidationState),total,residual,tolerance,tieTolerance:oxidationTieTolerance,
    secondaryCarriers:within.filter(c=>(largestCarrier-c.componentAmount)/total<=oxidationTieTolerance).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0),carriers:weighted})
}

/** Requires an exact, branded, current accepted equilibrium. Failed/ambiguous
 * outcomes never receive a classification and are never filled by interpolation.
 */
export function classifyOxidationPoint(model,system,input,result,{currentRevision,status='converged'}={}) {
  if(status!=='converged')return unavailable(status)
  if(!models.has(model)||model.systemId!==system?.id)return unavailable('unresolved-allocation-model')
  if(currentRevision!==input?.revision)return unavailable('stale')
  const accepted=acceptedState(system,input,result)
  if(!accepted.ok)return unavailable('equilibrium-not-accepted')
  const constraint=input.constraints[model.index]
  if(constraint.kh!==1)return unavailable('analytical-total-required')
  const carriers=model.allocations.map(a=>{
    const index=system.speciesIds.indexOf(a.id)
    return {...a,amount:a.phase==='solid'?(result.solids.find(s=>s.id===a.id)?.amount??0):result.concentrations[index]}
  })
  const summary=summarizeOxidationInventory(carriers,constraint.value)
  return freeze({...summary,inputId:input.id,systemId:system.id,revision:input.revision,solverStatus:'converged',dissolvedInventory:result.dissolvedComponentAmounts[model.index],acceptedSolids:result.solids.filter(s=>s.amount>0).map(s=>({...s,componentAmount:s.amount*system.products.find(p=>p.id===s.id).coefficients[model.index]}))})
}
