import { compileCanonicalRedox } from '../thermodynamics/canonicalRedox.js'
import { isSupportedFormationSource } from '../thermodynamics/formationSupport.js'
import { repositoryReactionCatalog } from '../thermodynamics/compatibility.js'
import { effectiveComponents, sourceCharge } from '../thermodynamics/importers/spana/names.js'
import { componentRole } from '../chemistry/components.js'
import { prepareChemicalSystem, freeze } from './models.js'
import { fixedElectronPolicy } from './redox.js'
import { multiSolidPolicy, assemblageLimits } from './assemblages.js'

const unsupported = (code,message) => freeze({ok:false,status:'unsupported',diagnostics:[{code,message}]})
/** Explicit internal opt-in only. Ordinary prepareSession and discovery remain untouched.
 * candidateSpeciesIds optionally bounds a validation subset; null discovers the full
 * compatible canonical set. Exclusions and disabled phases remain authoritative.
 * This prepares structure only: it never merges the session's oxidation-state totals.
 */
export async function prepareCanonicalRedoxSession(session, repository, { candidateSpeciesIds = null } = {}) {
  const chemical = session?.chemicalSystem, definition = session?.calculationDefinition
  if (!chemical || !definition) return unsupported('invalid-canonical-request','An editable session is required.')
  if (definition.activityModel !== 'ideal' || definition.temperature.value !== 25 || definition.pressure.value !== 1 || definition.ionicStrength.unit !== 'mol/kg-H2O' || (definition.ionicStrength.mode === 'fixed' && definition.ionicStrength.value !== 0)) return unsupported('unsupported-conditions','Canonical preparation supports the existing ideal 25 °C, declared 1 bar domain only.')
  const selected = chemical.selectedComponents.map(id => repository.getComponentById(id))
  if (selected.some(c=>!c) || ['proton','electron','solvent'].some(role=>!selected.some(c=>componentRole(c.name)===role))) return unsupported('unsupported-redox-basis','Select source proton, electron and water controls explicitly.')
  if (!chemical.enabledPhases.includes('aqueous') || !definition.enabledPhases.includes('aqueous')) return unsupported('unsupported-phase','Exchanging aqueous states must be enabled.')
  const catalog = repositoryReactionCatalog(repository)
  const components = repository.getComponents().map(c=>({id:c.id,name:c.name,charge:sourceCharge(c.name),role:c.role==='basis-choice'?'ordinary':c.role==='solvent'?'water':c.role}))
  const records = catalog.map(s=>{
    const terms=s.metadata?.effectiveSourceReaction?.components
    // Imported source rows only in this bounded phase; exact raw effective terms
    // and original names/constants must agree. No edited row can impersonate source.
    const validated=s.provenance?.kind==='imported' && isSupportedFormationSource(s,repository)
      && s.provenance.originalSpeciesName===s.name && s.metadata.effectiveSourceReaction?.product===s.name
      && s.provenance.original?.raw && JSON.stringify(terms)===JSON.stringify(effectiveComponents(s.provenance.original.raw))
      && s.charge===sourceCharge(s.name)
    return {id:s.id,name:s.name,phase:s.phase,charge:s.charge,logBeta:s.logK,terms,provenance:s.provenance,validated:Boolean(validated)}
  })
  const excludedIds=[...(chemical.excludedSpecies??[]),...catalog.filter(s=>!chemical.enabledPhases.includes(s.phase)||!definition.enabledPhases.includes(s.phase)).map(s=>s.id)]
  const compiled=compileCanonicalRedox({components,records,selectedIds:selected.filter(c=>componentRole(c.name)==='basis-choice').map(c=>c.id),productIds:candidateSpeciesIds,excludedIds})
  if (!compiled.ok) return compiled
  if (compiled.products.filter(p=>p.phase==='solid').length>assemblageLimits.candidates) return unsupported('unsupported-candidate-set','Canonical solids exceed the existing 12-candidate limit.')
  const prepared=await prepareChemicalSystem({components:compiled.components,products:compiled.products,basisStatus:'explicit-direct',redoxPolicy:fixedElectronPolicy,solidPolicy:multiSolidPolicy,
    unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{kind:compiled.policy,inventory:compiled.inventory,validation:compiled.validation,excludedIds,omitted:compiled.omitted,sources:repository.getSources()}})
  return prepared.ok?freeze({...prepared,status:'supported',canonical:compiled,pourbaixEnabled:false}):freeze({...prepared,status:'unsupported'})
}

/** Explicit inventory acknowledgement, not an automatic sum of independently
 * conserved oxidation-state totals. Electron is never part of this mapping.
 */
export function canonicalRedoxTotals(preparation, inventory) {
  if (!preparation?.ok || !preparation.canonical || !inventory || !Array.isArray(inventory.componentIds) || !Number.isFinite(inventory.total) || inventory.total<=0) return unsupported('ambiguous-conserved-inventory','Provide one positive analytical total for the complete connected family.')
  const expected=preparation.canonical.inventory.sourceComponentIds
  if (inventory.componentIds.length!==expected.length || new Set(inventory.componentIds).size!==expected.length || expected.some(id=>!inventory.componentIds.includes(id))) return unsupported('ambiguous-conserved-inventory','Acknowledge every connected source state in one inventory; separate state totals are unsupported.')
  return freeze({ok:true,totals:{[preparation.canonical.inventory.canonicalComponentId]:inventory.total},inventory:structuredClone(inventory)})
}
