import { createSpecies } from '../../schema.js'
import { sourceNumber, knownNumber } from './binary.js'
import { effectiveComponents, sourcePhase, sourceCharge } from './names.js'
import { resolveReferences } from './references.js'
export const IMPORTER_VERSION = 'spana-readonly-1.0.0'
export const SOURCE_REVISION = 'c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7'
const safeNumbers = value => {
  if (typeof value === 'number') return sourceNumber(value)
  if (Array.isArray(value)) return value.map(safeNumbers)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, safeNumbers(v)]))
  return value
}
export function componentLinks(entries, knownSymbols) {
  const links = new Map(), diagnostics = []
  for (const entry of entries) for (const component of entry.components) {
    if (component.name.startsWith('@')) {
      diagnostics.push({ severity: 'warning', message: `ELB deletion directive ${component.name} retained but not applied; multi-database overlay unsupported.` })
      continue
    }
    if (!links.has(component.name)) links.set(component.name, [])
    links.get(component.name).push({ element: entry.element, description: component.description, recognizedElement: knownSymbols.includes(entry.element), byteOffset: entry.byteOffset })
  }
  return { links, diagnostics }
}
export function normalizeSpanaRecord(raw, context) {
  const { sourceDatabase, sourceFile, importDate, dbHash, references, links, referenceSourceFile } = context
  const sourceRecordId = `byte:${raw.byteOffset}`
  const warnings = ['Element links describe source components, not product atom counts. Oxidation states are not supplied.']
  const comps = effectiveComponents(raw)
  const linkMetadata = comps.map(c => ({ ...c, associations: links.get(c.name) ?? [] }))
  const unlinked = linkMetadata.filter(c => c.coefficient !== 0 && (!c.associations.length || c.associations.some(a => !a.recognizedElement)) && !['H2O', 'H+', 'H +', 'e-', 'e -'].includes(c.name))
  if (unlinked.length) warnings.push(`Unlinked source components: ${unlinked.map(c => c.name).join(', ')}`)
  const symbols = [...new Set(linkMetadata.flatMap(c => c.coefficient === 0 ? [] : c.associations.filter(a => a.recognizedElement).map(a => a.element)))].sort()
  const resolutions = resolveReferences(raw.reference, references)
  const unresolved = resolutions.filter(r => !r.citation)
  if (unresolved.length) warnings.push(`Unresolved reference codes: ${unresolved.map(r => r.code).join(', ')}`)
  if (raw.name.startsWith('@')) warnings.push('Deletion directive retained for audit; not a selectable reaction. Overlay semantics are not implemented.')
  if (raw.layout === 'six-slot') warnings.push('Source uses the supported Java six-slot layout; raw proton field retained separately.')
  if (raw.thermal.kind !== 'deltaH-deltaCp') warnings.push('Temperature model retained verbatim, not evaluated.')
  const validCoefficients = comps.every(c => Number.isFinite(c.coefficient))
  if (!validCoefficients) warnings.push('Non-finite source stoichiometry; record cannot define a system.')
  const unique = new Set(comps.map(c => c.name)).size === comps.length
  if (!unique) warnings.push('Duplicate component names: ordered coefficients retained; no summation or repair performed.')
  const componentStoichiometry = validCoefficients && unique && comps.some(c => c.coefficient !== 0)
    ? Object.fromEntries(comps.filter(c => c.coefficient !== 0).map(c => [c.name, c.coefficient])) : null
  const thermal = raw.thermal
  const parameters = thermal.kind === 'deltaH-deltaCp' ? { deltaH_kJ_per_mol: knownNumber(thermal.deltaH), deltaCp_J_per_mol_K: knownNumber(thermal.deltaCp) }
    : thermal.kind === 'analytic' ? Object.fromEntries(thermal.coefficients.map((n, i) => [`a${i}`, knownNumber(n)])) : {}
  const citation = resolutions.filter(r => r.citation).map(r => `${r.code}: ${r.citation}`).join('\n\n') || null
  const qualityFlags = ['imported', 'not-solver-validated', 'composition-unknown', ...(unresolved.length ? ['unresolved-references'] : []), ...(raw.name.startsWith('@') ? ['source-directive'] : [])]
  return createSpecies({
    id: `spana:${dbHash.slice(0, 16)}:${raw.byteOffset}`, name: raw.name, displayName: raw.name, formula: raw.name,
    phase: sourcePhase(raw.name), charge: sourceCharge(raw.name), elementalComposition: null,
    discoveryElements: unlinked.length || !validCoefficients ? null : symbols, oxidationStates: null,
    componentStoichiometry, formationReaction: null,
    logK: knownNumber(raw.logK), logKConvention: 'log10 formation constant for one named product from the signed source component coefficients (eq-diagr Complex)',
    temperatureReference: 298.15, pressureReference: null,
    temperatureModel: { type: `spana-${thermal.kind}`, parameters },
    source: 'Spana/DataBase local reaction database', sourceDatabase, sourceRecordId, citation,
    notes: warnings, qualityFlags, deprecated: raw.name.startsWith('@'),
    metadata: { sourceFormat: 'spana-java-binary', sourceRevision: SOURCE_REVISION, componentLinks: safeNumbers(linkMetadata),
      elementFilterBasis: 'source-component-associations; not complete product composition',
      solverReady: false, sourceNamingConvention: 'eq-diagr Util', sourceReferenceResolutions: resolutions,
      sourceTemperatureMetadata: safeNumbers(thermal), sourcePressureMetadata: { storedReferencePressure: null, note: 'No pressure-reference scalar stored. Upstream derives limits; no derivation performed here.' },
      originalReaction: { product: raw.name, components: safeNumbers(raw.components), separateProtonCount: safeNumbers(raw.protonCount) },
      effectiveSourceReaction: { product: raw.name, components: safeNumbers(comps) },
    },
    provenance: { kind: 'imported', sourceDatabase, sourceFile, sourceRecordId, originalRecordId: null,
      originalSpeciesName: raw.name, originalReaction: { product: raw.name, components: safeNumbers(raw.components), separateProtonCount: safeNumbers(raw.protonCount) },
      originalLogK: sourceNumber(raw.logK), originalReferenceCode: raw.reference, resolvedCitation: citation,
      referenceSourceFile, dbSha256: dbHash, byteOffset: raw.byteOffset, byteLength: raw.byteLength,
      importDate, importerVersion: IMPORTER_VERSION, comments: warnings, qualityFlags,
      original: { speciesName: raw.name, reaction: { product: raw.name, components: safeNumbers(raw.components), separateProtonCount: safeNumbers(raw.protonCount) },
        logK: sourceNumber(raw.logK), citation: raw.reference, raw: safeNumbers(raw) },
    },
  })
}
