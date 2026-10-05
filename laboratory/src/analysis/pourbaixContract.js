import {freeze} from '../solver/models.js'
import {isGridResult} from '../calculations/grid.js'
import {peToEh} from '../solver/redox.js'
import {isRegisteredOxidationModel,classifyRegisteredPoint} from './registeredElementOxidation.js'
import {waterContext} from './registeredWaterContext.js'

export function elementPhaseScope(system,contract) {
  const actual=system.products.filter(p=>p.phase==='solid').map(p=>p.id)
  const modified=actual.length!==contract.includedSolids.length || contract.includedSolids.some(id=>!actual.includes(id))
  return freeze({version:modified?null:contract.phaseScopeVersion, baseVersion:contract.phaseScopeVersion, included:actual,
    excluded:contract.excluded, unsupported:actual.filter(id=>!contract.includedSolids.includes(id)),
    modified,
    meaning:'Included means eligible for equilibrium, not selected as stable. Accepted solids belong to each individual result.'})
}

export function inspectRegisteredPoint(model,system,input,result,options,contract) {
  if(!contract || model?.metadataVersion!==contract.metadataVersion || model?.metadataSha256!==contract.metadataSha256) return freeze({status:'unavailable',reason:'metadata-evidence-mismatch'})
  const c=classifyRegisteredPoint(model,system,input,result,options)
  if(c.status==='unavailable') return c
  const proton=system.components.findIndex(r=>r.role==='proton'), electron=system.components.findIndex(r=>r.role==='electron'), water=system.components.findIndex(r=>r.role==='water')
  if(input.constraints[proton].kh!==2 || input.constraints[electron].kh!==2 || input.constraints[water].kh!==2 || input.constraints[water].value!==0) return freeze({status:'unavailable',reason:'unsupported-reservoirs'})
  const pH=-input.constraints[proton].value, pe=-input.constraints[electron].value, Eh=peToEh(pe,system.temperatureC)
  const context=waterContext(options?.waterModel,pH,Eh)
  if(context.status==='unavailable') return context
  return freeze({...c,pH,Eh,pe,totalInventory:c.total,conservedComponent:model.inner.reference.componentId,phaseScope:elementPhaseScope(system,contract),phaseScopeVersion:elementPhaseScope(system,contract).version,
    dominantThermodynamicCarriers:c.secondaryCarriers,waterWindow:context.waterWindow,waterReferences:context.waterReferences})
}

export function assessPourbaixCandidate(model,system,grid,{currentRevision,waterModel}={},contract) {
  const fail=reason=>freeze({eligible:false,publicEnabled:false,reason})
  if(!isRegisteredOxidationModel(model) || model.metadataVersion!==contract.metadataVersion || model.metadataSha256!==contract.metadataSha256) return fail('metadata-evidence-mismatch')
  if(elementPhaseScope(system,contract).modified) return fail('modified-phase-scope')
  if(system.id!==contract.systemId || model.systemId!==system.id) return fail('chemistry-evidence-mismatch')
  if(!isGridResult(grid) || grid.systemId!==system.id || grid.revision!==currentRevision) return fail('unaccepted-or-stale-grid')
  if(grid.status!=='completed' || grid.counts.converged!==contract.pH.points*contract.Eh.points || grid.counts.failed || grid.counts.notRun) return fail('incomplete-grid')
  if(JSON.stringify(grid.shape)!==JSON.stringify([contract.pH.points,contract.Eh.points])) return fail('unvalidated-grid')
  for(const o of grid.outcomes) {
    const c=inspectRegisteredPoint(model,system,o.input,o.result,{status:o.status,currentRevision,waterModel},contract)
    if(!['classified','tie'].includes(c.status)) return fail(c.reason)
    if(c.total!==contract.total || Math.abs(c.pH-(contract.pH.min+o.ix*contract.pH.step))>1e-12 || Math.abs(c.Eh-(contract.Eh.min+o.iy*contract.Eh.step))>1e-12) return fail('unvalidated-coordinate-or-total')
  }
  return freeze({eligible:true,publicEnabled:false,contractVersion:contract.version,metadataVersion:model.metadataVersion,metadataSha256:model.metadataSha256,phaseScopeVersion:contract.phaseScopeVersion,claim:'Candidate for next-phase public implementation; fixed cross-validated scope only.'})
}
