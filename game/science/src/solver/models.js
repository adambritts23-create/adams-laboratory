import { multiSolidPolicy, assemblageLimits, sourceSolidPolicy } from './assemblages.js'
/** Immutable numerical boundary. No database access or React dependencies. */
import { componentRole } from '../chemistry/components.js'
const preparedObjects = new WeakSet(), inputObjects = new WeakSet()
export function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value)
  }
  return value
}
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
  return JSON.stringify(value)
}
export async function identity(value) {
  const bytes = new TextEncoder().encode(canonical(value))
  return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('')
}
export const diagnostic = (code, message, path = null) => ({ code, message, path })
export const rejected = (...diagnostics) => freeze({ ok: false, diagnostics })
export const isPrepared = value => preparedObjects.has(value)
export const isPointInput = value => inputObjects.has(value)

export async function prepareChemicalSystem(spec) {
  if (!spec || !Array.isArray(spec.components) || !Array.isArray(spec.products)) return rejected(diagnostic('invalid-system', 'Ordered components and products are required.'))
  const errors = [], components = structuredClone(spec.components), products = structuredClone(spec.products)
  const add = (code, message) => errors.push(diagnostic(code, message))
  if (components.length < 1 || components.length > 16 || products.length > 128) add('unsupported-size', 'Supported limits: 1–16 components and at most 128 products.')
  if (spec.basisStatus !== 'explicit-direct') add('unsupported-basis-transformation', 'A directly resolved, explicitly chosen basis is required; no closure or substitutions are performed.')
  if (spec.temperatureC !== 25 || spec.pressureBar !== 1) add('unsupported-conditions', 'Only stored 25 °C constants at the declared 1 bar reference setting are supported.')
  if (spec.unit !== 'mol/kg-H2O') add('unit-incompatibility', 'The numerical basis must be mol/kg-H2O. No molarity conversion is available.')
  if (!spec.sourceIdentity || typeof spec.sourceIdentity !== 'object') add('missing-provenance', 'Source/data identity is required.')
  const names = new Set(), ids = new Set()
  for (const c of components) {
    if (!c || typeof c.id !== 'string' || !c.id || typeof c.name !== 'string' || !c.name) { add('invalid-component', 'Components require nonempty IDs and names.'); continue }
    if (ids.has(c.id) || names.has(c.name.replaceAll(/\s/g, ''))) add('duplicate-component', `Duplicate component ${c.name}.`)
    ids.add(c.id); names.add(c.name.replaceAll(/\s/g, ''))
    if (!['ordinary', 'proton', 'electron', 'water'].includes(c.role)) add('unsupported-component', `Unsupported role for ${c.name}.`)
    const sourceRole = componentRole(c.name), expectedRole = sourceRole === 'basis-choice' ? 'ordinary' : sourceRole === 'solvent' ? 'water' : sourceRole
    if (c.role !== expectedRole || (c.suppressed !== undefined && c.suppressed !== ['electron', 'water'].includes(c.role))) add('invalid-special-component', `Special/suppression flags must match the explicit identity ${c.name}.`)
    if (c.phase && c.phase !== (c.role === 'water' ? 'liquid' : 'aqueous')) add('unsupported-component', 'Solid or gas components require an unimplemented basis treatment.')
  }
  for (const role of ['proton', 'electron', 'water']) if (components.filter(c => c?.role === role).length > 1) add('duplicate-component', `Multiple ${role} components are ambiguous.`)
  for (const p of products) {
    if (!p || typeof p.id !== 'string' || !p.id || typeof p.name !== 'string' || !p.name) { add('invalid-species', 'Products require IDs and names.'); continue }
    if (ids.has(p.id) || names.has(p.name.replaceAll(/\s/g, ''))) add('redundant-basis', `Product ${p.name} duplicates a component or product identity.`)
    ids.add(p.id); names.add(p.name.replaceAll(/\s/g, ''))
    if (!['aqueous', 'solid'].includes(p.phase) || p.suppressed) add('unsupported-phase', `Unsupported or suppressed product ${p.name}.`)
    if (!Number.isFinite(p.logBeta)) add('thermodynamic-data-unavailable', `Missing/nonfinite formation constant for ${p.name}.`)
    if (!Array.isArray(p.coefficients) || p.coefficients.length !== components.length || p.coefficients.some(n => !Number.isFinite(n)) || !p.coefficients.some(n => n !== 0)) add('invalid-stoichiometry', `A complete nonzero signed coefficient row is required for ${p.name}.`)
    if (!p.sourceRecord) add('missing-provenance', `Source linkage required for ${p.name}.`)
  }
  if (spec.redoxPolicy && !['fixed-electron-v1','analytical-proton-fixed-electron-v1'].includes(spec.redoxPolicy)) add('unsupported-redox-policy', 'Unknown redox policy.')
  if (['fixed-electron-v1','analytical-proton-fixed-electron-v1'].includes(spec.redoxPolicy) && ['proton', 'electron', 'water'].some(role => !components.some(c => c.role === role))) add('unsupported-redox-basis', 'Fixed redox validation requires explicit proton, electron and water components.')
  if (spec.solidPolicy && ![multiSolidPolicy,sourceSolidPolicy].includes(spec.solidPolicy)) add('unsupported-solid-policy', 'Unknown pure-solid selection policy.')
  if ([multiSolidPolicy,sourceSolidPolicy].includes(spec.solidPolicy) && !['fixed-electron-v1','analytical-proton-fixed-electron-v1'].includes(spec.redoxPolicy) && components.some(c => c.role === 'electron')) add('unsupported-redox-assemblage', 'Multi-solid selection is restricted to a non-redox component basis.')
  if (spec.solidPolicy === multiSolidPolicy && products.filter(p => p?.phase === 'solid').length > assemblageLimits.candidates) add('unsupported-solid-count', 'Bounded selection supports at most 12 candidate pure solids.')
  if (![multiSolidPolicy,sourceSolidPolicy].includes(spec.solidPolicy) && products.filter(p => p?.phase === 'solid').length > 1) add('unsupported-solid-assemblage', 'This release supports at most one candidate pure solid; arbitrary multiphase systems are not validated.')
  if (errors.length) return rejected(...errors)
  if ([multiSolidPolicy,sourceSolidPolicy].includes(spec.solidPolicy)) products.sort((a, b) => a.phase === b.phase ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : a.phase === 'aqueous' ? -1 : 1)
  const body = { ...(spec.redoxPolicy ? { redoxPolicy: spec.redoxPolicy } : {}), ...(spec.solidPolicy ? { solidPolicy: spec.solidPolicy } : {}), schemaVersion: 1, preparationVersion: 'direct-basis-1', basisStatus: 'explicit-direct', readiness: 'ready-restricted',
    components: components.map(c => ({ ...c, suppressed: ['electron', 'water'].includes(c.role) })), products,
    speciesIds: [...components, ...products].map(s => s.id),
    componentIndex: Object.fromEntries(components.map((c, i) => [c.id, i])),
    aqueousRows: products.flatMap((p, j) => p.phase === 'aqueous' ? [j] : []), solidRows: products.flatMap((p, j) => p.phase === 'solid' ? [j] : []),
    temperatureC: 25, pressureBar: 1, sourceReferencePressure: spec.sourceReferencePressure ?? null,
    unit: spec.unit, sourceIdentity: structuredClone(spec.sourceIdentity),
    warnings: ['Restricted species set and explicit direct basis; no completeness or general independence proof.', ...(spec.sourceReferencePressure == null ? ['Source reference-pressure scalar unavailable; 1 bar is a declared calculation setting, not reconstructed source metadata.'] : [])] }
  const system = freeze({ ...body, id: await identity(body) })
  preparedObjects.add(system)
  return freeze({ ok: true, system, diagnostics: [] })
}

export async function createPointInput(system, options) {
  if (!isPrepared(system)) return rejected(diagnostic('unprepared-system', 'Re-prepare the immutable numerical system before solving.'))
  if (!options || !Array.isArray(options.constraints)) return rejected(diagnostic('invalid-constraint', 'One explicit constraint per component is required.'))
  const errors = [], { constraints } = options
  if (options.unit !== system.unit) errors.push(diagnostic('unit-incompatibility', 'Point totals must use mol/kg-H2O.'))
  if (options.temperatureC !== 25 || options.pressureBar !== 1 || options.activityModel !== 'ideal') errors.push(diagnostic('unsupported-conditions', 'Point solver supports only ideal activities at 25 °C and 1 bar.'))
  if (options.enforceElectroneutrality) errors.push(diagnostic('unsupported-constraint', 'An additional electroneutrality equation is not implemented; no spectator ions are inserted.'))
  if (constraints.length !== system.components.length || new Set(constraints.map(c => c?.componentId)).size !== constraints.length) errors.push(diagnostic('invalid-constraint', 'Constraints must uniquely cover every component.'))
  const ordered = system.components.map(c => constraints.find(k => k?.componentId === c.id))
  for (let i = 0; i < ordered.length; i++) {
    const k = ordered[i], c = system.components[i]
    if (!k || ![1, 2].includes(k.kh) || !Number.isFinite(k.value)) errors.push(diagnostic('invalid-constraint', `A finite kh=1 total or kh=2 log activity is required for ${c.name}.`))
    if (system.redoxPolicy === 'fixed-electron-v1' && k?.kh !== (c.role === 'ordinary' ? 1 : 2)) errors.push(diagnostic('invalid-redox-constraint', 'Fixed redox policy requires ordinary totals and externally fixed H/e activities; no electron inventory is allowed.'))
    if(system.redoxPolicy==='analytical-proton-fixed-electron-v1'&&((c.role==='electron'&&k?.kh!==2)||(c.role==='ordinary'&&k?.kh!==1)))errors.push(diagnostic('invalid-redox-constraint','Analytical proton / fixed-electron policy requires ordinary totals and imposed electron activity.'))
    if (c.role === 'water' && (!k || k.kh !== 2 || k.value !== 0)) errors.push(diagnostic('invalid-water-constraint', 'Ideal solvent water requires kh=2 and logA=0; no water total is permitted.'))
  }
  if (!Number.isInteger(options.revision) || options.revision < 0) errors.push(diagnostic('invalid-revision', 'A nonnegative scientific revision is required.'))
  if (errors.length) return rejected(...errors)
  const body = { schemaVersion: 1, systemId: system.id, revision: options.revision, constraints: structuredClone(ordered),
    unit: system.unit, temperatureC: 25, pressureBar: 1, activityModel: 'ideal', electroneutrality: 'not-imposed' }
  const input = freeze({ ...body, id: await identity(body) }); inputObjects.add(input)
  return freeze({ ok: true, input, diagnostics: [] })
}
