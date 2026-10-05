import { componentRole } from '../chemistry/components.js'
import { periodicTable } from '../data/periodicTable.js'
import { sourcePhase } from './importers/spana/names.js'
import { createRepository } from './repository.js'
import { composeUserEquilibria, importUserEquilibria } from './userEquilibria.js'

const text = value => typeof value === 'string' && !!value.trim()
const key = value => value.replaceAll(/\s/g, '')
/** Explicit ordinary basis identities only. Associations are discovery links, not atom balances. */
export function validateUserComponent(raw, base, peers = []) {
  const diagnostics = [], add = (code, message) => diagnostics.push({ code, message })
  if (!raw || typeof raw !== 'object') return [{ code: 'invalid-component', message: 'A component record is required.' }]
  const fields = ['schemaVersion', 'id', 'name', 'associations', 'sourceType', 'citation', 'notes', 'createdAt', 'modifiedAt']
  if (Object.keys(raw).some(k => !fields.includes(k)) || raw.schemaVersion !== 1 || raw.sourceType !== 'user-defined') add('invalid-component', 'Expected version 1 user-defined component source fields only.')
  if (!text(raw.id) || !raw.id.startsWith('user-component:') || !text(raw.name)) add('invalid-identity', 'A stable user-component: ID and explicit name are required.')
  if (text(raw.name) && (componentRole(raw.name) !== 'basis-choice' || sourcePhase(raw.name) !== 'aqueous')) add('unsupported-component', 'Custom components must be ordinary aqueous basis choices. Use existing proton, electron and solvent identities for special roles.')
  if (!Array.isArray(raw.associations) || !raw.associations.length || raw.associations.some(a => !a || Object.keys(a).some(k => !['element', 'description'].includes(k)) || !periodicTable.some(e => e.symbol === a.element) || typeof a.description !== 'string') || new Set(raw.associations?.map?.(a => a?.element)).size !== raw.associations?.length) add('invalid-associations', 'Supply distinct explicit element associations using periodic-table symbols. No composition is inferred.')
  for (const field of ['citation', 'notes']) if (raw[field] !== null && typeof raw[field] !== 'string') add('invalid-metadata', `${field} must be text or null.`)
  for (const field of ['createdAt', 'modifiedAt']) if (!text(raw[field]) || !Number.isFinite(Date.parse(raw[field]))) add('invalid-metadata', `${field} requires a timestamp.`)
  const occupied = [...base.getComponents(), ...base.getSpeciesIdentities(), ...peers]
  if (occupied.some(p => p.id === raw.id || (text(raw.name) && key(p.name) === key(raw.name)))) add('identity-collision', 'Component name or ID already exists. Choose an unambiguous identity; imported records cannot be overridden.')
  return diagnostics
}
export function composeUserComponents(base, records) {
  if (!Array.isArray(records) || records.length > 128) throw Error('At most 128 custom components are supported per collection.')
  const accepted = []
  for (const raw of records) {
    const diagnostics = validateUserComponent(raw, base, accepted)
    if (diagnostics.length) { const error = Error(diagnostics.map(d => `${d.code}: ${d.message}`).join(' ')); error.diagnostics = diagnostics; throw error }
    accepted.push(raw)
  }
  if (!records.length) return base
  const elements = base.getElements()
  for (const symbol of new Set(records.flatMap(r => r.associations.map(a => a.element)))) {
    if (!elements.some(e => e.symbol === symbol)) { const e = periodicTable.find(e => e.symbol === symbol); elements.push({ symbol, name: e.name }) }
  }
  return createRepository({ species: base.getSpecies({ includeDeprecated: true }), sources: base.getSources(), phases: base.getPhases(), elements,
    components: [...base.getComponents(), ...records.map(raw => ({ id: raw.id, name: raw.name, role: 'basis-choice', associations: raw.associations,
      provenance: { kind: 'user-defined', citation: raw.citation, notes: raw.notes, createdAt: raw.createdAt, modifiedAt: raw.modifiedAt },
      metadata: { validationState: 'structurally-valid-restricted', warnings: ['USER-DEFINED · UNVERIFIED'], rawUserComponent: raw } }))] })
}
export function composeUserChemistry(base, components, records) {
  const componentRepository = composeUserComponents(base, components)
  return { componentRepository, repository: composeUserEquilibria(componentRepository, records), components, records }
}
export function exportUserChemistry(base, components, records) {
  composeUserChemistry(base, components, records)
  return JSON.stringify({ kind: 'adams-user-chemistry', schemaVersion: 1, components, records }, null, 2)
}
export function importUserChemistry(json, base) {
  const value = JSON.parse(json)
  // Backwards compatibility is explicit; the old source-only schema is unchanged.
  if (value?.kind === 'adams-user-equilibria') return { components: [], records: importUserEquilibria(json, base) }
  if (value?.kind !== 'adams-user-chemistry' || value.schemaVersion !== 1 || Object.keys(value).some(k => !['kind', 'schemaVersion', 'components', 'records'].includes(k))) throw Error('Expected a version 1 custom source-only collection. Session/results fields are not accepted.')
  composeUserChemistry(base, value.components, value.records)
  return structuredClone({ components: value.components, records: value.records })
}
