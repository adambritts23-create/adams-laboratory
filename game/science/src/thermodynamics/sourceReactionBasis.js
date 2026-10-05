import { repositoryReactionCatalog } from './compatibility.js'
import { isSupportedFormationSource } from './formationSupport.js'
import { effectiveComponents } from './importers/spana/names.js'
import { transformReactionBasis } from './reactionBasis.js'

/** Exact source-name joins establish identities already defined by the importer.
 * No formula interpretation, oxidation-state allocation or source-order override. */
export function sourceReactionBasis(repository, { familyIds, basisIds, candidateIds = null, excludedIds = [] }) {
  const available = repository.getComponents()
  const availableByName = new Map(available.map(c => [c.name, c]))
  const components = available.filter(c => familyIds.includes(c.id) || ['proton', 'electron', 'solvent'].includes(c.role))
  const byName = new Map(components.map(c => [c.name, c.id]))
  const catalog = repositoryReactionCatalog(repository)
  // Fixed reservoir chemistry can introduce dependent source components too.
  // Connectivity is based solely on exact source reaction membership.
  let changed = true
  while (changed) {
    changed = false
    for (const r of catalog) {
      const component = availableByName.get(r.name)
      const terms = r.metadata?.effectiveSourceReaction?.components
      if (!component || byName.has(component.name) || !terms?.length || !terms.every(t => !t.coefficient || byName.has(t.name))) continue
      if (!terms.some(t => t.coefficient && availableByName.get(t.name)?.role === 'electron')) continue
      components.push(component); byName.set(component.name, component.id); changed = true
    }
  }
  const compatible = catalog.filter(r => r.metadata?.effectiveSourceReaction?.components?.every(t => !t.coefficient || byName.has(t.name)))
  const chosen = compatible.filter(r => byName.has(r.name) || candidateIds === null || candidateIds.includes(r.id))
  if (candidateIds?.some(id => !compatible.some(r => r.id === id))) return { ok: false, diagnostics: [{ code: 'incompatible-source-reaction' }] }
  const identities = new Map()
  for (const r of chosen) if (!identities.has(r.name)) identities.set(r.name, byName.get(r.name) ?? `${r.provenance.sourceDatabase}:product:${r.name}`)
  for (const r of chosen) {
    if (!isSupportedFormationSource(r, repository) || r.provenance.kind !== 'imported' || r.provenance.originalSpeciesName !== r.name || JSON.stringify(r.metadata.effectiveSourceReaction.components) !== JSON.stringify(effectiveComponents(r.provenance.original.raw))) return { ok: false, diagnostics: [{ code: 'source-identity-mismatch', id: r.id }] }
  }
  const reactions = chosen.map(r => ({ id: r.id, productId: identities.get(r.name), phase: r.phase, logK: r.logK,
    terms: r.metadata.effectiveSourceReaction.components.filter(t => t.coefficient).map(t => ({ id: byName.get(t.name), coefficient: t.coefficient })),
    unit: { kind: 'stored-source-reaction-unit', sourceId: r.id, productActivityPower: 1, formulaUnitConversion: 'not-inferred', sourceComment: r.provenance.original.raw.comment ?? null },
    sourcePrecision: { kind: 'stored-binary64-no-rationalization', logK: 0, coefficients: {}, note: 'No source uncertainty scalar is supplied by the importer; arithmetic allowance only.' },
    provenance: r.provenance, temperatureModel: r.temperatureModel, validity: { temperatureReference: r.temperatureReference, pressureReference: r.pressureReference, sourceTemperatureMetadata: r.metadata.sourceTemperatureMetadata, sourcePressureMetadata: r.metadata.sourcePressureMetadata },
  }))
  const excludedNames = new Set(catalog.filter(r => excludedIds.includes(r.id)).map(r => r.name))
  const transformed = transformReactionBasis({ basisIds, componentIds: components.map(c => c.id), reactions, excludedIds: [...excludedIds, ...chosen.filter(r => excludedNames.has(r.name)).map(r => r.id)] })
  return { ...transformed, sourceRows: chosen, components, identities: Object.fromEntries(identities) }
}
