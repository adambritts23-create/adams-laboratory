import { sourceReactionBasis } from './sourceReactionBasis.js'
import { prepareChemicalSystem } from '../solver/models.js'
import { sourceCharge } from './importers/spana/names.js'
import { reactionBasisVersion } from './reactionBasis.js'
import { multiSolidPolicy } from '../solver/assemblages.js'

/** Internal scientific preparation. This is not a public support permission. */
export async function prepareReactionBasisSystem(repository, options) {
  const algebra = sourceReactionBasis(repository, options)
  if (!algebra.ok) return algebra
  const components = algebra.basisIds.map(id => {
    const c = algebra.components.find(c => c.id === id)
    return { id, name: c.name, role: c.role === 'basis-choice' ? 'ordinary' : c.role === 'solvent' ? 'water' : c.role, charge: sourceCharge(c.name) }
  })
  const products = [], omitted = [...algebra.exclusions]
  for (const expression of algebra.expressions) {
    const source = algebra.sourceRows.find(r => r.id === expression.sourceReactionId)
    if (algebra.basisIds.includes(expression.productId)) continue
    if (!['aqueous', 'solid'].includes(source.phase)) { omitted.push({ id: source.id, status: 'unsupported-phase', phase: source.phase }); continue }
    const old = products.find(p => p.identity === expression.productId)
    if (old) {
      if (Math.abs(old.logBeta - expression.logK) > 1e-10 || old.coefficients.some((n, i) => Math.abs(n - expression.coefficients[i]) > 1e-12)) return { ok: false, diagnostics: [{ code: 'inconsistent-product-representations', id: source.id }] }
      continue
    }
    const chargeResidual = expression.coefficients.reduce((sum, n, i) => sum + n * components[i].charge, 0) - source.charge
    const arithmeticBound = 128 * Number.EPSILON * Math.max(1, expression.coefficients.reduce((s, n, i) => s + Math.abs(n * components[i].charge), 0))
    if (Math.abs(chargeResidual) > arithmeticBound) return { ok: false, diagnostics: [{ code: 'source-charge-imbalance', id: source.id, chargeResidual, arithmeticBound }] }
    if (components.some((c, i) => c.role === 'ordinary' && expression.coefficients[i] < 0)) return { ok: false, diagnostics: [{ code: 'negative-conserved-inventory', id: source.id }] }
    products.push({ id: source.id, identity: expression.productId, name: source.name, phase: source.phase, coefficients: expression.coefficients, logBeta: expression.logK, sourceRecord: { expression, chargeCheck: { chargeResidual, arithmeticBound }, elementalCheck: 'independent-product-composition-not-supplied-by-source' } })
  }
  const prepared = await prepareChemicalSystem({ components, products, basisStatus: 'explicit-direct', redoxPolicy: 'fixed-electron-v1', solidPolicy: multiSolidPolicy, unit: 'mol/kg-H2O', temperatureC: 25, pressureBar: 1, sourceIdentity: { version: reactionBasisVersion, sourceIds: algebra.sourceRows.map(r => r.id), omitted } })
  return { ...prepared, algebra, omitted, publicEnabled: false, status: prepared.ok ? 'algebraically-supported-metadata-pending' : 'unsupported' }
}
