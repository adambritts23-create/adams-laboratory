import { createSpecies } from './schema.js'
import { createRepository } from './repository.js'

export const userReferenceState = 'ideal-molal-formation'
const text = v => typeof v === 'string' && v.trim().length > 0
const nameKey = v => v.replaceAll(/\s/g, '')

/** Raw records are source data, never calculated results or curated data. */
export function validateUserEquilibrium(raw, repository, peers = []) {
  const diagnostics = []
  const add = (code, message) => diagnostics.push({ code, message })
  if (!raw || typeof raw !== 'object') return [{ code: 'invalid-user-record', message: 'A record object is required.' }]
  const fields = ['schemaVersion', 'id', 'productId', 'displayName', 'phase', 'charge', 'terms', 'logK', 'temperatureK', 'pressureBar', 'referenceState', 'sourceType', 'citation', 'notes', 'createdAt', 'modifiedAt']
  if (Object.keys(raw).some(key => !fields.includes(key))) add('invalid-user-record', 'Unknown fields or calculated results are not accepted in a source record.')
  if (raw.schemaVersion !== 1 || raw.sourceType !== 'user-defined') add('invalid-user-record', 'Expected user-defined schema version 1.')
  if (!text(raw.id) || !raw.id.startsWith('user:')) add('invalid-identity', 'A stable user: application ID is required.')
  if (!text(raw.productId) || !text(raw.displayName)) add('invalid-product', 'Explicit product identity and display name are required.')
  if (!['aqueous', 'solid'].includes(raw.phase)) add('unsupported-phase', 'Only aqueous products and pure solids are supported.')
  if (raw.charge !== null && (!Number.isFinite(raw.charge) || !Number.isInteger(raw.charge))) add('invalid-charge', 'Charge must be an integer or explicit null (unknown).')
  if (!Number.isFinite(raw.logK)) add('invalid-logK', 'A finite numeric log10 formation constant is required.')
  if (raw.temperatureK !== 298.15 || (raw.pressureBar !== null && raw.pressureBar !== 1) || raw.referenceState !== userReferenceState) add('unsupported-reference-state', 'Only explicitly declared ideal molal formation at 298.15 K and unknown or 1 bar reference pressure is supported.')
  if (!Array.isArray(raw.terms) || !raw.terms.length) add('invalid-terms', 'Explicit signed component terms are required.')
  else {
    const seen = new Set()
    for (const term of raw.terms) {
      if (!term || !repository.getComponentById(term.componentId)) add('unknown-component', 'Terms must refer to component IDs in the current repository. Add and structurally validate a custom component first if needed.')
      if (seen.has(term?.componentId)) add('duplicate-term', 'A component may occur only once in a reaction.')
      seen.add(term?.componentId)
      if (!Number.isFinite(term?.coefficient) || term.coefficient === 0) add('invalid-coefficient', 'Signed coefficients must be finite and nonzero; no normalization is performed.')
    }
  }
  for (const key of ['citation', 'notes']) if (raw[key] !== null && typeof raw[key] !== 'string') add('invalid-metadata', `${key} must be text or null.`)
  for (const key of ['createdAt', 'modifiedAt']) if (!text(raw[key]) || !Number.isFinite(Date.parse(raw[key]))) add('invalid-metadata', `${key} requires a timestamp.`)
  const occupied = [...(repository.getSpeciesIdentities?.() ?? repository.getSpecies({ includeDeprecated: true })), ...repository.getComponents(), ...peers.map(p => ({ id: p.id, name: p.productId }))]
  if (occupied.some(p => p.id === raw.id || (text(raw.productId) && nameKey(p.name) === nameKey(raw.productId)))) add('identity-collision', 'Product identity or application ID collides with another record/component. Resolve the ambiguity explicitly.')
  return diagnostics
}

export function userEquilibriumSpecies(raw, repository) {
  const terms = raw.terms.map(t => ({ name: repository.getComponentById(t.componentId).name, coefficient: t.coefficient }))
  const knownElements = new Set(repository.getElements().map(e => e.symbol))
  const links = raw.terms.flatMap(t => {
    const component = repository.getComponentById(t.componentId)
    // Water's source pseudo-element XX is not an element. Use the repository's
    // explicit solvent composition, never parse a species formula for discovery.
    return component.role === 'solvent' ? Object.keys(repository.getSpeciesById('water')?.elementalComposition ?? {}) : component.associations.map(a => a.element)
  })
  return createSpecies({ id: raw.id, name: raw.productId, formula: raw.productId, displayName: raw.displayName,
    phase: raw.phase, charge: raw.charge, elementalComposition: null,
    discoveryElements: links.every(e => knownElements.has(e)) ? [...new Set(links)] : null,
    componentStoichiometry: Object.fromEntries(raw.terms.map(t => [t.componentId, t.coefficient])),
    logK: raw.logK, logKConvention: 'log10 formation constant for one named product from explicit signed source components',
    temperatureReference: raw.temperatureK, pressureReference: raw.pressureBar,
    source: 'User-defined (not database-verified)', sourceDatabase: 'user-defined', sourceRecordId: raw.id,
    citation: raw.citation || null, notes: raw.notes ? [raw.notes] : [], qualityFlags: ['user-defined-not-verified'],
    metadata: { sourceFormat: 'user-equilibrium-v1', effectiveSourceReaction: { product: raw.productId, components: terms },
      validationState: 'structurally-valid-restricted', provenanceState: raw.citation ? 'user-attributed-unverified' : 'provenance-incomplete', rawUserRecord: structuredClone(raw) },
    provenance: { kind: 'user-defined', sourceDatabase: 'user-defined', sourceRecordId: raw.id,
      originalLogK: raw.logK, original: { speciesName: raw.productId, reaction: structuredClone(raw.terms), logK: raw.logK, citation: raw.citation, raw: structuredClone(raw) },
      comments: raw.notes ? [raw.notes] : [], qualityFlags: ['user-defined-not-verified'] } })
}

function validateCollection(base, records) {
  if (!Array.isArray(records) || records.length > 128) throw new Error('User collection must be an array of at most 128 records.')
  const accepted = []
  for (const raw of records) {
    const diagnostics = validateUserEquilibrium(raw, base, accepted)
    if (diagnostics.length) { const error = new Error(diagnostics.map(d => `${d.code}: ${d.message}`).join(' ')); error.diagnostics = diagnostics; throw error }
    accepted.push(raw)
  }
}

export function composeUserEquilibria(base, records) {
  validateCollection(base, records)
  if (!records.length) return base
  return createRepository({ species: [...base.getSpecies({ includeDeprecated: true }), ...records.map(r => userEquilibriumSpecies(r, base))],
    components: base.getComponents(), elements: base.getElements(), phases: base.getPhases(),
    sources: [...base.getSources(), { id: 'user-defined', name: 'User-defined, not database-verified' }] })
}

export function exportUserEquilibria(records, base) {
  validateCollection(base, records)
  return JSON.stringify({ kind: 'adams-user-equilibria', schemaVersion: 1, records }, null, 2)
}
export function importUserEquilibria(json, base) {
  const value = JSON.parse(json)
  if (value?.kind !== 'adams-user-equilibria' || value.schemaVersion !== 1 || Object.keys(value).some(k => !['kind', 'schemaVersion', 'records'].includes(k))) throw new Error('Expected a version 1 source-only user collection; results/session fields are not accepted.')
  validateCollection(base, value.records)
  return structuredClone(value.records)
}

/** Revalidate raw data and its normalized scientific fields before preparation. */
export function isSupportedUserSpecies(species, repository) {
  const raw = species.metadata?.rawUserRecord
  const withoutSelf = { ...repository, getSpecies: options => repository.getSpecies(options).filter(s => s.id !== species.id),
    getSpeciesIdentities: () => (repository.getSpeciesIdentities?.() ?? repository.getSpecies()).filter(s => s.id !== species.id) }
  if (validateUserEquilibrium(raw, withoutSelf).length) return false
  const expected = userEquilibriumSpecies(raw, repository)
  return ['id', 'name', 'phase', 'logK', 'temperatureReference', 'pressureReference', 'logKConvention', 'provenance'].every(key => JSON.stringify(species[key]) === JSON.stringify(expected[key]))
    && JSON.stringify(species.metadata.effectiveSourceReaction) === JSON.stringify(expected.metadata.effectiveSourceReaction)
}
