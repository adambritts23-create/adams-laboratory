import {isPrepared, identity, freeze} from '../solver/models.js'
import {prepareOxidationAllocation, classifyOxidationPoint} from './oxidationInventory.js'

const models = new WeakSet()
const unavailable = (reason, details={}) => freeze({status:'unavailable', reason, predominant:null, unresolvedInventory:null, ...details})
// Display labels are deliberately outside the binding. The complete original
// reaction, provenance and canonical transformation are inside it.
const fingerprint = row => row.coefficients
  ? {id:row.id, phase:row.phase, coefficients:row.coefficients, logBeta:row.logBeta, sourceRecord:row.sourceRecord}
  : {id:row.id, role:row.role, charge:row.charge, suppressed:row.suppressed}

export async function prepareRegisteredOxidation(system,registry) {
  if (!isPrepared(system) || system.sourceIdentity.kind!=='canonical-redox-basis-v1' || JSON.stringify(system.components.map(c=>c.id))!==JSON.stringify(registry.basisIds)) return unavailable('unsupported-source-basis')
  if(await identity({inventory:system.sourceIdentity.inventory,sources:system.sourceIdentity.sources})!==registry.sourceBindingSha256) return unavailable('inconsistent-source-basis')
  const index=system.components.findIndex(c=>c.id===registry.conservedComponent)
  const rows=[system.components[index], ...system.products.filter(p=>p.coefficients[index]!==0)]
  const carriers={}
  for (const row of rows) {
    const matches=registry.rows.filter(r=>r.id===row.id)
    if(matches.length!==1) return unavailable(matches.length?'ambiguous-carrier-identity':'missing-carrier-metadata',{carrierId:row.id})
    const entry=matches[0]
    if(!Array.isArray(entry.allocation)||!entry.allocation.length || entry.conservedComponent!==registry.conservedComponent || entry.componentCount!==(row.coefficients?.[index]??1)) return unavailable('inconsistent-oxidation-allocation',{carrierId:row.id})
    if(await identity(fingerprint(row))!==entry.bindingSha256 || (row.phase??'aqueous')!==entry.phase) return unavailable('inconsistent-source-identity',{carrierId:row.id})
    carriers[row.id]={allocation:entry.allocation, electronLocalization:'conserved-component-only', provenance:entry.provenance}
  }
  const inner=prepareOxidationAllocation(system,{systemId:system.id, scope:registry.scope, reference:{componentId:registry.conservedComponent, oxidationState:registry.referenceOxidationState, provenance:registry.rows[0].provenance}, carriers})
  if(inner.status!=='supported-validation') return unavailable(inner.reason,{carrierId:inner.carrierId})
  const model=freeze({status:'registered', systemId:system.id, metadataVersion:registry.version, metadataSha256:await identity(registry), inner, materiality:registry.materiality})
  models.add(model)
  return model
}

export function isRegisteredOxidationModel(model) { return models.has(model) }

export function classifyRegisteredPoint(model,system,input,result,options) {
  if(!models.has(model)) return unavailable('unregistered-allocation-model')
  const classification=classifyOxidationPoint(model.inner,system,input,result,options)
  return freeze({...classification, metadataVersion:model.metadataVersion, metadataSha256:model.metadataSha256,
    unresolvedInventory:classification.status==='unavailable'?null:0, materialityPolicy:model.materiality.policy})
}
