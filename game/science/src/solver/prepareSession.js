import { multiSolidPolicy } from './assemblages.js'
import { componentRole } from '../chemistry/components.js'
import { validateCalculationDefinition, toSourceInput } from '../calculations/definition.js'
import { prepareChemicalSystem, createPointInput, rejected, diagnostic } from './models.js'
import { sourcePhase } from '../thermodynamics/importers/spana/names.js'
import { isSupportedFormationSource } from '../thermodynamics/formationSupport.js'
import { repositoryReactionCatalog, usesAutomaticSolids, phaseSelectionSummary } from '../thermodynamics/compatibility.js'

/** Repository-facing preparation. The numerical solver never sees or queries a repository. */
export async function prepareSessionPoint(session, repository, { sweep = false, grid = false } = {}) {
  return prepareSession(session, repository, { sweep, grid, structureOnly: false })
}
/** Configuration handoff only: reuse chemical preparation without fabricating numeric constraints.
 * Success does not establish a solvable point or a validated thermodynamic basis.
 */
export async function prepareSessionStructure(session, repository) {
  return prepareSession(session, repository, { structureOnly: true })
}
async function prepareSession(session, repository, { sweep = false, grid = false, structureOnly = false }) {
  const chemical = session.chemicalSystem, definition = session.calculationDefinition
  const errors = structureOnly ? [] : validateCalculationDefinition(definition, chemical, repository, { allowDescending: grid }).map(message => diagnostic('invalid-definition', message))
  if (!structureOnly && definition.independentVariables.length !== (grid ? 2 : sweep ? 1 : 0)) errors.push(diagnostic('unsupported-sweep', 'Choose zero, one or two varied coordinates for a point, sweep or grid respectively.'))
  if (definition.activityModel !== 'ideal') errors.push(diagnostic('unsupported-activity-model', 'Select ideal activities explicitly; all nonideal models remain unsupported.'))
  if (definition.temperature.value !== 25 || definition.pressure.value !== 1) errors.push(diagnostic('unsupported-conditions', 'Stored reference constants are supported only at 25 °C with the declared 1 bar setting.'))
  if (definition.ionicStrength.unit !== 'mol/kg-H2O' || (definition.ionicStrength.mode === 'fixed' && definition.ionicStrength.value !== 0)) errors.push(diagnostic('unsupported-ionic-strength', 'The ideal point path does not model finite ionic strength or convert molarity. Use automatic (not evaluated) or fixed zero mol/kg-H2O.'))
  if (definition.mixedSolubility && (!sweep || grid || definition.solubilityComparison || definition.independentVariables[0]?.quantity !== 'pH')) errors.push(diagnostic('unsupported-mixed-solubility', 'Mixed solubility requires one pH sweep, without independent-system comparison.'))
  if (definition.gridMultiSolid && ((!grid && !structureOnly) || definition.mixedSolubility || definition.solubilityComparison)) errors.push(diagnostic('unsupported-grid-solid-policy', 'The explicit multi-solid grid option requires two independent variables without a 1D solubility mode.'))
  const selected = chemical.selectedComponents.map(id => repository.getComponentById(id))
  if (selected.some(c => !c)) errors.push(diagnostic('missing-component', 'A selected source component is unavailable.'))
  if (errors.length) return rejected(...errors)
  const names = selected.map(c => c.name)
  // Detect explicit dependencies already expressed in the source catalog. This is not general redox closure.
  for (const record of repositoryReactionCatalog(repository)) {
    if (!names.includes(record.name) || record.role === 'solvent') continue
    const terms = record.metadata.effectiveSourceReaction?.components?.filter(c => c.coefficient !== 0)
    if (!terms?.length || !terms.every(c => names.includes(c.name))) continue
    const identityReaction = terms.length === 1 && terms[0].name === record.name && terms[0].coefficient === 1 && record.logK === 0
    if (!identityReaction) errors.push(diagnostic('redundant-basis', `Selected component ${record.name} is also a direct reaction product of this basis. Remove the dependent choice; no substitution will be performed.`))
  }
  const products = []
  for (const id of chemical.selectedSpecies) {
    const s = repository.getSpeciesById(id)
    if (!s) { errors.push(diagnostic('missing-species', `Selected species ${id} is unavailable.`)); continue }
    if (s.role === 'solvent') continue
    if (!definition.enabledPhases.includes(s.phase)) { errors.push(diagnostic('disabled-phase', `${s.name} belongs to a disabled phase.`)); continue }
    const supportedSource = isSupportedFormationSource(s, repository)
    if (!supportedSource) {
      errors.push(diagnostic('thermodynamic-data-unavailable', `${s.name} lacks supported, traceable 25 °C source formation data.`)); continue
    }
    const terms = s.metadata.effectiveSourceReaction?.components
    if (!Array.isArray(terms) || new Set(terms.map(c => c.name)).size !== terms.length || terms.some(c => !Number.isFinite(c.coefficient))) {
      errors.push(diagnostic('invalid-stoichiometry', `${s.name} has missing, duplicated or nonfinite source coefficients.`)); continue
    }
    if (terms.some(c => c.coefficient !== 0 && !names.includes(c.name))) {
      errors.push(diagnostic('unsupported-basis-transformation', `${s.name} requires an unselected source component. Redox closure and basis transformations are not implemented.`)); continue
    }
    products.push({ id: s.id, name: s.name, phase: s.phase, logBeta: s.logK,
      coefficients: names.map(name => terms.find(c => c.name === name)?.coefficient ?? 0), sourceRecord: s.provenance })
  }
  if (errors.length) return rejected(...errors)
  const prepared = await prepareChemicalSystem({ ...(definition.mixedSolubility || definition.gridMultiSolid || (usesAutomaticSolids(chemical, repository) && products.some(p => p.phase === 'solid')) ? { solidPolicy: multiSolidPolicy } : {}), components: selected.map(c => {
    const r = componentRole(c.name)
    return { id: c.id, name: c.name, role: r === 'basis-choice' ? 'ordinary' : r === 'solvent' ? 'water' : r, phase: r === 'solvent' ? 'liquid' : sourcePhase(c.name), source: c }
  }), products, basisStatus: 'explicit-direct', unit: 'mol/kg-H2O', temperatureC: 25, pressureBar: 1,
  sourceReferencePressure: products.length > 0 && products.every(p => repository.getSpeciesById(p.id).pressureReference === 1) ? 1 : null,
  sourceIdentity: { ...(usesAutomaticSolids(chemical, repository) ? { phaseSelection: phaseSelectionSummary(repository, chemical) } : {}), sources: repository.getSources(), databaseHashes: [...new Set(products.map(p => p.sourceRecord.dbSha256).filter(Boolean))], selectedComponentIds: chemical.selectedComponents, selectedSpeciesIds: chemical.selectedSpecies } })
  if (!prepared.ok) return prepared
  if (sweep || grid || structureOnly) return prepared
  const constraints = []
  try {
    for (const component of selected) {
      const c = definition.componentConditions.find(c => c.componentId === component.id)
      const mapped = toSourceInput(c, c.value, definition.temperature.value)
      constraints.push({ componentId: component.id, kh: mapped.kh, value: mapped.value })
    }
  } catch (error) { return rejected(diagnostic('unit-or-coordinate-incompatibility', error.message)) }
  const point = await createPointInput(prepared.system, { constraints, revision: session.revision, unit: 'mol/kg-H2O', temperatureC: 25, pressureBar: 1, activityModel: 'ideal' })
  return point.ok ? { ok: true, system: prepared.system, input: point.input, diagnostics: [] } : point
}
