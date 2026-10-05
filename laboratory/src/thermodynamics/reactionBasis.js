/** Independent linear reaction-space algebra. All identities and scientific
 * attributes are supplied explicitly; names, formulae and oxidation states are
 * deliberately absent from this module's input contract. */
export const reactionBasisVersion = 'reaction-basis-v1'
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0
const finite = Number.isFinite
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) }
  return value
}
const failure = (code, details = {}) => freeze({ ok: false, diagnostics: [{ code, ...details }] })
// Arithmetic error only. Source uncertainty is separately supplied and propagated.
const roundoff = scale => 128 * Number.EPSILON * Math.max(1, scale)
const zeros = n => Array(n).fill(0)

/** A reaction is productCoefficient * logActivity(productId) = logK +
 * sum(terms[id] * logActivity(id)). Scaling changes BOTH sides and logK.
 * sourcePrecision contains explicit absolute error bounds, never an inferred
 * number of significant digits. Missing bounds mean no source-error allowance. */
export function scaleReaction(reaction, factor) {
  if (!finite(factor) || factor === 0) return failure('invalid-reaction-scale')
  const r = structuredClone(reaction)
  r.productCoefficient = (r.productCoefficient ?? 1) * factor
  r.logK *= factor
  r.terms = r.terms.map(t => ({ ...t, coefficient: t.coefficient * factor }))
  r.sourceScale = (r.sourceScale ?? 1) * factor
  if (r.sourcePrecision) {
    r.sourcePrecision.logK = (r.sourcePrecision.logK ?? 0) * Math.abs(factor)
    r.sourcePrecision.coefficients = Object.fromEntries(Object.entries(r.sourcePrecision.coefficients ?? {}).map(([id, n]) => [id, n * Math.abs(factor)]))
  }
  return r
}

export function transformReactionBasis({ basisIds, componentIds, reactions, excludedIds = [], attributes = {}, capacity } = {}) {
  if (![basisIds, componentIds, reactions, excludedIds].every(Array.isArray)) return failure('invalid-reaction-request')
  if (capacity !== undefined && capacity !== 'closed-aqueous-64-v1') return failure('reaction-size-limit')
  if (!basisIds.length || componentIds.length > (capacity === 'closed-aqueous-64-v1' ? 64 : 32) || reactions.length > 512) return failure('reaction-size-limit')
  if ([basisIds, componentIds, reactions.map(r => r?.id)].some(a => new Set(a).size !== a.length)) return failure('duplicate-identity')
  if (componentIds.some(id => typeof id !== 'string') || basisIds.some(id => !componentIds.includes(id))) return failure('invalid-basis-identity')
  const ids = new Set(componentIds), excluded = new Set(excludedIds)
  const all = [...reactions].sort((a, b) => compare(a.id, b.id))
  for (const r of all) {
    if (!r || typeof r.id !== 'string' || typeof r.productId !== 'string' || !finite(r.logK) || !finite(r.productCoefficient ?? 1) || (r.productCoefficient ?? 1) === 0 || !Array.isArray(r.terms) || !r.unit || !r.provenance) return failure('invalid-source-reaction', { id: r?.id })
    if (new Set(r.terms.map(t => t.id)).size !== r.terms.length || r.terms.some(t => !ids.has(t.id) || !finite(t.coefficient))) return failure('unresolved-source-component', { id: r.id })
    if ([r.sourcePrecision?.logK ?? 0, ...Object.values(r.sourcePrecision?.coefficients ?? {})].some(n => !finite(n) || n < 0)) return failure('invalid-source-precision', { id: r.id })
  }
  // Exclusion applies to every representation of the same explicit identity.
  const excludedProducts = new Set(all.filter(r => excluded.has(r.id)).map(r => r.productId))
  if (componentIds.some(id => excludedProducts.has(id))) return failure('excluded-basis-component')
  const rows = all.filter(r => !excludedProducts.has(r.productId))
  const dependent = componentIds.filter(id => !basisIds.includes(id)).sort(compare)
  const bridges = rows.filter(r => ids.has(r.productId))
  const n = dependent.length, width = basisIds.length + 1 + bridges.length
  // Rectangular elimination audits every redundant equation, including inverse
  // bridges and equations whose product is itself a selected basis component.
  const matrix = bridges.map((r, j) => {
    const coefficient = id => (id === r.productId ? r.productCoefficient ?? 1 : 0) - (r.terms.find(t => t.id === id)?.coefficient ?? 0)
    return [...dependent.map(coefficient), ...basisIds.map(id => -coefficient(id)), r.logK, ...bridges.map((_, k) => Number(j === k))]
  })
  let rank = 0
  for (let col = 0; col < n; col++) {
    let pivot = -1
    for (let j = rank; j < matrix.length; j++) if (Math.abs(matrix[j][col]) > roundoff(Math.max(...matrix[j].slice(0, n).map(Math.abs))) && (pivot < 0 || Math.abs(matrix[j][col]) > Math.abs(matrix[pivot][col]))) pivot = j
    if (pivot < 0) return failure('rank-deficiency', { unresolvedComponentId: dependent[col], rank, requiredRank: n })
    ;[matrix[rank], matrix[pivot]] = [matrix[pivot], matrix[rank]]
    const divisor = matrix[rank][col]
    matrix[rank] = matrix[rank].map(x => x / divisor)
    for (let j = 0; j < matrix.length; j++) if (j !== rank) {
      const multiplier = matrix[j][col]
      matrix[j] = matrix[j].map((x, k) => x - multiplier * matrix[rank][k])
    }
    rank++
  }
  const cycleChecks = []
  for (const row of matrix.slice(rank)) {
    const multipliers = row.slice(n + basisIds.length + 1)
    const bounds = basisIds.map(id => multipliers.reduce((s, m, j) => s + Math.abs(m) * (bridges[j].sourcePrecision?.coefficients?.[id] ?? 0), 0))
    bounds.push(multipliers.reduce((s, m, j) => s + Math.abs(m) * (bridges[j].sourcePrecision?.logK ?? 0), 0))
    const residuals = row.slice(n, n + basisIds.length + 1)
    const arithmetic = roundoff(multipliers.reduce((s, m, j) => s + Math.abs(m) * (1 + Math.abs(bridges[j].logK) + bridges[j].terms.reduce((a, t) => a + Math.abs(t.coefficient), 0)), 0))
    if (residuals.some((x, j) => Math.abs(x) > bounds[j] + arithmetic)) return failure('inconsistent-reaction-cycle', { residuals, sourceBounds: bounds, arithmeticBound: arithmetic })
    cycleChecks.push({ residuals, sourceBounds: bounds, arithmeticBound: arithmetic })
  }
  const mappings = new Map(basisIds.map((id, i) => [id, [...basisIds.map((_, j) => Number(i === j)), 0, ...zeros(bridges.length)]]))
  dependent.forEach((id, i) => mappings.set(id, matrix[i].slice(n)))
  const expression = (productId, vector, sources, unit, phase) => ({
    version: reactionBasisVersion, productId, basisIds: [...basisIds], coefficients: vector.slice(0, basisIds.length), logK: vector[basisIds.length],
    eliminatedComponentIds: [...dependent], sourceReactions: sources.filter(s => s.multiplier !== 0), unit: structuredClone(unit), phase,
    temperatureModel: { kind: 'linear-combination-of-source-models', terms: sources.filter(s => s.multiplier !== 0).map(s => ({ sourceId: s.id, multiplier: s.multiplier, model: s.temperatureModel ?? null })), evaluation: 'stored-reference-temperature-only' },
    validity: { kind: 'intersection-of-source-domains', sources: sources.filter(s => s.multiplier !== 0).map(s => ({ id: s.id, domain: s.validity ?? null })), unknownDomainsRemainUnknown: true },
  })
  const trace = (r, multiplier) => ({ id: r.id, multiplier, originalLogK: r.logK, originalProductCoefficient: r.productCoefficient ?? 1, originalTerms: structuredClone(r.terms), sourcePrecision: r.sourcePrecision ?? { kind: 'stored-binary64', logK: 0, coefficients: {} }, unit: structuredClone(r.unit), provenance: structuredClone(r.provenance), temperatureModel: r.temperatureModel ?? null, validity: r.validity ?? null })
  const expressions = []
  for (const r of rows) {
    const vector = zeros(width); vector[basisIds.length] = r.logK
    for (const t of r.terms) {
      const mapping = mappings.get(t.id)
      for (let j = 0; j < width; j++) vector[j] += t.coefficient * mapping[j]
    }
    const divisor = r.productCoefficient ?? 1
    const normalized = vector.map(x => x / divisor)
    const sourceMultipliers = new Map([[r.id, 1 / divisor]])
    bridges.forEach((b, i) => sourceMultipliers.set(b.id, (sourceMultipliers.get(b.id) ?? 0) + normalized[basisIds.length + 1 + i]))
    const sources = [...sourceMultipliers].sort(([a], [b]) => compare(a, b)).map(([id, multiplier]) => trace(rows.find(s => s.id === id), multiplier))
    const result = expression(r.productId, normalized, sources, { ...r.unit, productCoefficient: divisor, normalizationFactor: 1 / divisor }, r.phase)
    result.sourceReactionId = r.id
    // Independent bookkeeping when supplied attributes are authoritative.
    result.checks = {}
    for (const property of ['charge', 'inventory', 'elements']) {
      const target = attributes[r.productId]?.[property]
      const values = basisIds.map(id => attributes[id]?.[property])
      if (target === undefined || values.some(v => v === undefined)) { result.checks[property] = { status: 'metadata-unavailable' }; continue }
      const keys = property === 'charge' ? [null] : [...new Set([target, ...values].flatMap(v => Object.keys(v)))]
      const residuals = Object.fromEntries(keys.map(key => [key ?? 'charge', normalized.slice(0, basisIds.length).reduce((sum, c, i) => sum + c * (key === null ? values[i] : values[i][key] ?? 0), 0) - (key === null ? target : target[key] ?? 0)]))
      // Metadata may supply explicit source-unit rounding bounds, never a solver tolerance.
      const bound = attributes[r.productId]?.precisionBounds?.[property] ?? 0
      const arithmetic = roundoff(normalized.reduce((s, x) => s + Math.abs(x), 0) * Math.max(1, ...values.flatMap(v => typeof v === 'number' ? [Math.abs(v)] : Object.values(v).map(Math.abs))))
      if (Object.values(residuals).some(x => Math.abs(x) > bound + arithmetic)) return failure('reaction-bookkeeping-failure', { id: r.id, property, residuals, sourceBound: bound, arithmeticBound: arithmetic })
      result.checks[property] = { status: Object.values(residuals).some(x => Math.abs(x) > arithmetic) ? 'accepted-source-precision-residual' : 'passed', residuals, sourceBound: bound, arithmeticBound: arithmetic }
    }
    if (![...result.coefficients, result.logK].every(finite)) return failure('nonfinite-transformation', { id: r.id })
    const prior = expressions.find(p => p.productId === result.productId)
    if (prior) {
      const scale = [...prior.sourceReactions, ...result.sourceReactions].reduce((sum, s) => sum + Math.abs(s.multiplier) * (1 + Math.abs(s.originalLogK) + s.originalTerms.reduce((a, t) => a + Math.abs(t.coefficient), 0)), 0)
      const arithmetic = roundoff(scale)
      if (prior.phase !== result.phase || Math.abs(prior.logK - result.logK) > arithmetic || prior.coefficients.some((x, i) => Math.abs(x - result.coefficients[i]) > arithmetic)) return failure('inconsistent-product-representations', { id: r.id, priorId: prior.sourceReactionId, arithmeticBound: arithmetic })
    }
    expressions.push(result)
  }
  return freeze({ ok: true, version: reactionBasisVersion, basisIds: [...basisIds], dependentIds: dependent, rank, cycleChecks, expressions, componentExpressions: Object.fromEntries([...mappings].map(([id, v]) => [id, { coefficients: v.slice(0, basisIds.length), logK: v[basisIds.length] }])), exclusions: all.filter(r => excludedProducts.has(r.productId)).map(r => ({ id: r.id, productId: r.productId, status: 'explicitly-excluded' })), diagnostics: [] })
}
