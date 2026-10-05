import { freeze } from '../solver/models.js'
import { phaseRank } from '../solver/assemblages.js'

export const canonicalRedoxPolicy = 'canonical-redox-basis-v1'
export const canonicalRedoxLimits = Object.freeze({ records: 10000, states: 8, depth: 7, products: 128, coefficient: 1024 })
// Roundoff allowance only, not an allowance for inconsistent source thermodynamics.
// At most seven bridge additions, with source constants bounded to magnitude 1000.
export const cycleLogTolerance = 1e-10
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0
const fail = (code, message, details = {}) => freeze({ ok: false, status: 'unsupported', diagnostics: [{ code, message, ...details }] })
const integer = n => Number.isSafeInteger(n) && Math.abs(n) <= canonicalRedoxLimits.coefficient
const traceRow = r => ({ id: r.id, name: r.name, coefficients: structuredClone(r.terms), logBeta: r.logBeta, provenance: structuredClone(r.provenance) })

/** Internal algebra only. The repository adapter verifies source eligibility.
 * Scope: one connected inventory, unit exchange bridges involving electrons only;
 * integer product coefficients. Never infers atoms from names/discovery links.
 */
export function compileCanonicalRedox({ components, records, selectedIds, productIds = null, excludedIds = [] }) {
  if (!Array.isArray(components) || !Array.isArray(records) || !Array.isArray(selectedIds) || !Array.isArray(excludedIds) || (productIds !== null && !Array.isArray(productIds))) return fail('invalid-canonical-request', 'Explicit source components and records are required.')
  if (components.some(c=>!c || typeof c.id!=='string' || typeof c.name!=='string' || !Number.isFinite(c.charge)) || records.some(r=>!r || typeof r.id!=='string' || typeof r.name!=='string')) return fail('invalid-canonical-request','Source identities and component charges must be explicit.')
  if (records.length > canonicalRedoxLimits.records || components.length > 512) return fail('unsupported-size', 'Source preparation bounds exceeded.')
  if (new Set(selectedIds).size !== selectedIds.length || new Set(components.map(c => c.id)).size !== components.length || new Set(components.map(c => c.name)).size !== components.length || new Set(records.map(r => r.id)).size !== records.length) return fail('redundant-basis', 'Duplicate source identities are not independent basis choices.')
  const byName = new Map(components.map(c => [c.name, c])), byId = new Map(components.map(c => [c.id, c]))
  const chosen = selectedIds.map(id => byId.get(id))
  if (!chosen.length || chosen.some(c => !c || c.role !== 'ordinary')) return fail('invalid-canonical-request', 'Select ordinary source component identities explicitly.')
  const special = ['proton', 'electron', 'water'].map(role => components.filter(c => c.role === role))
  if (special.some(c => c.length !== 1)) return fail('ambiguous-independent-basis', 'Exactly one source proton, electron and solvent identity is required.')
  const [proton, electron, water] = special.map(c => c[0])
  const valid = r => r.validated === true && Number.isFinite(r.logBeta) && Math.abs(r.logBeta) <= 1000 && Number.isFinite(r.charge) && r.provenance && Array.isArray(r.terms) && new Set(r.terms.map(t => t.name)).size === r.terms.length && r.terms.every(t => integer(t.coefficient) && byName.has(t.name))
  const edges = [], unsupportedBridges = []
  for (const r of records) {
    if (byName.get(r.name)?.role !== 'ordinary' || r.phase !== 'aqueous' || !Array.isArray(r.terms)) continue
    const terms = r.terms.filter(t => t.coefficient !== 0), ordinary = terms.filter(t => byName.get(t.name)?.role === 'ordinary')
    if (!terms.some(t => t.name === electron.name && t.coefficient !== 0)) continue
    if (!valid(r) || ordinary.length !== 1 || ordinary[0].coefficient !== 1 || ordinary[0].name === r.name || terms.some(t => t.name !== ordinary[0]?.name && t.name !== electron.name)) { unsupportedBridges.push(r); continue }
    const e = terms.find(t => t.name === electron.name).coefficient
    if (byName.get(r.name).charge !== byName.get(ordinary[0].name).charge - e || r.charge !== byName.get(r.name).charge) { unsupportedBridges.push(r); continue }
    // log(a_to) = log(a_from) + k + e log(a_e)
    edges.push({ from: ordinary[0].name, to: r.name, e, k: r.logBeta, r, multiplier: 1 })
    edges.push({ from: r.name, to: ordinary[0].name, e: -e, k: -r.logBeta, r, multiplier: -1 })
  }
  edges.sort((a,b) => compare(a.r.id,b.r.id) || compare(a.from,b.from) || compare(a.to,b.to))
  const reached = new Set([chosen[0].name]), queue = [chosen[0].name]
  while (queue.length) {
    const name = queue.shift()
    for (const edge of edges.filter(e => e.from === name)) if (!reached.has(edge.to)) { reached.add(edge.to); queue.push(edge.to) }
    if (reached.size > canonicalRedoxLimits.states) return fail('unsupported-size', 'Connected family exceeds the bounded state count.')
  }
  if (unsupportedBridges.some(r => reached.has(r.name) || r.terms.some(t => reached.has(t.name)))) return fail('source-validation-incomplete', 'A connected bridge is not a validated unit, electron-only substitution.')
  if (chosen.some(c => !reached.has(c.name))) return fail('disconnected-redox-states', 'Selected states do not share one reaction-connected inventory.')
  if (reached.size < 2) return fail('missing-bridge', 'No connected redox family can be established from validated source bridges.')
  // Lexical source component ID, not oxidation number or selection order.
  const family = [...reached].map(name => byName.get(name)).sort((a,b) => compare(a.id,b.id)), root = family[0]
  const familyEdges = edges.filter(e => reached.has(e.from))
  const incidence = familyEdges.map(e => family.map(c => Number(c.name === e.to) - Number(c.name === e.from)))
  const rank = phaseRank(incidence)
  if (rank !== family.length - 1) return fail('rank-deficiency', 'Bridge incidence rank does not leave exactly one independent inventory.')
  const maps = new Map([[root.name,{ e: 0, k: 0, steps: [] }]]), pending = [root.name]
  while (pending.length) {
    const from = pending.shift(), prior = maps.get(from)
    for (const edge of familyEdges.filter(e => e.from === from)) {
      const next = { e: prior.e + edge.e, k: prior.k + edge.k, steps: [...prior.steps,{ id: edge.r.id, multiplier: edge.multiplier }] }
      if (!integer(next.e) || !Number.isFinite(next.k)) return fail('unsupported-coefficients','Bridge substitution exceeds exact coefficient bounds.')
      const old = maps.get(edge.to)
      if (old) {
        if (old.e !== next.e || Math.abs(old.k-next.k) > cycleLogTolerance) return fail('inconsistent-cycle', 'Alternate source reaction paths disagree; constants are not averaged.', { recordId: edge.r.id, electronResidual: next.e-old.e, logBetaResidual: next.k-old.k })
      } else {
        if (next.steps.length > canonicalRedoxLimits.depth) return fail('unsupported-multistep-substitution', 'Bridge path exceeds the validated substitution depth.')
        maps.set(edge.to,next); pending.push(edge.to)
      }
    }
  }
  const excludedNames = new Set(records.filter(r => excludedIds.includes(r.id)).map(r => r.name))
  if (family.some(c => excludedNames.has(c.name))) return fail('excluded-redox-state', 'An excluded exchange state cannot be reintroduced through canonicalization.')
  if (productIds?.some(id => !records.some(r => r.id === id))) return fail('missing-source-record', 'A requested reaction is unavailable.')
  const basis = [root,proton,electron,water], allowed = new Set([...reached,proton.name,electron.name,water.name])
  const products = family.slice(1).map(c=>{
    const mapping=maps.get(c.name), coefficients=[1,0,mapping.e,0]
    const transformations=mapping.steps.map(step=>({multiplier:step.multiplier,bridge:traceRow(records.find(r=>r.id===step.id))}))
    return {id:`canonical-state:${c.id}`,name:c.name,phase:'aqueous',coefficients,logBeta:mapping.k,
      sourceRecord:{kind:canonicalRedoxPolicy,operation:'sum-of-signed-bridge-reactions',original:transformations[0].bridge,
        canonicalBasis:basis.map(c=>c.id),transformations,final:{coefficients:[...coefficients],logBeta:mapping.k},validation:{status:'validated-bounded',integerStoichiometry:true,chargeBalance:true,cycleLogTolerance,elementalBalance:'unit-electron-only-source-bridge'}}}
  }), omitted = []
  const candidates = records.filter(r => productIds === null || productIds.includes(r.id) || reached.has(r.name))
  for (const r of candidates) {
    if (excludedNames.has(r.name)) { omitted.push({id:r.id,name:r.name,reason:'explicitly-excluded'}); continue }
    if (reached.has(r.name) || special.some(cs => cs[0].name === r.name)) continue
    if (!Array.isArray(r.terms) || r.terms.some(t => t.coefficient && !allowed.has(t.name))) {
      if (productIds?.includes(r.id)) return fail('missing-bridge', 'Requested row needs a component outside this canonical family.', {recordId:r.id})
      continue
    }
    if (!['aqueous','solid'].includes(r.phase)) {
      if (productIds?.includes(r.id)) return fail('unsupported-phase','Requested phase is outside the aqueous/pure-solid domain.',{recordId:r.id})
      continue
    }
    if (!valid(r)) return fail('source-validation-incomplete','A candidate lacks validated integer source coefficients or source provenance.',{recordId:r.id})
    if (products.some(p => p.name === r.name)) return fail('ambiguous-source-representation', 'Multiple product representations require independent source reconciliation.',{recordId:r.id})
    const coefficients = [0,0,0,0], multipliers = new Map(); let logBeta = r.logBeta
    for (const t of r.terms) {
      if (!t.coefficient) continue
      const mapping = maps.get(t.name)
      if (mapping) {
        coefficients[0] += t.coefficient; coefficients[2] += t.coefficient * mapping.e; logBeta += t.coefficient * mapping.k
        for (const step of mapping.steps) multipliers.set(step.id,(multipliers.get(step.id) ?? 0)+t.coefficient*step.multiplier)
      } else coefficients[basis.findIndex(c => c.name === t.name)] += t.coefficient
    }
    if (!coefficients.every(integer) || !Number.isFinite(logBeta)) return fail('unsupported-coefficients','Transformed row exceeds exact integer bounds.',{recordId:r.id})
    if (coefficients[0] < 0) return fail('ambiguous-conserved-inventory','Negative ordinary inventory coefficients are outside this bounded compiler.',{recordId:r.id})
    if (coefficients.reduce((sum,n,i)=>sum+n*basis[i].charge,0) !== r.charge) return fail('charge-imbalance','Transformed reaction fails source charge balance.',{recordId:r.id})
    const transformations = [...multipliers].filter(([,n])=>n!==0).sort(([a],[b])=>compare(a,b)).map(([id,multiplier])=>({multiplier,bridge:traceRow(records.find(r=>r.id===id))}))
    products.push({id:r.id,name:r.name,phase:r.phase,coefficients,logBeta,sourceRecord:{kind:canonicalRedoxPolicy,original:traceRow(r),canonicalBasis:basis.map(c=>c.id),transformations,final:{coefficients:[...coefficients],logBeta},validation:{status:'validated-bounded',integerStoichiometry:true,chargeBalance:true,cycleLogTolerance,elementalBalance:'not-generically-available'}}})
  }
  if (products.length > canonicalRedoxLimits.products) return fail('unsupported-size','Canonical product count exceeds solver bounds.')
  products.sort((a,b)=>compare(a.id,b.id))
  return freeze({ok:true,status:'supported',policy:canonicalRedoxPolicy,components:basis.map(c=>({...c})),products,omitted,
    inventory:{canonicalComponentId:root.id,sourceComponentIds:family.map(c=>c.id),weights:family.map(c=>({componentId:c.id,coefficient:1})),meaning:'One conserved source moiety established by unit electron-only bridges; no separate oxidation-state totals.'},
    validation:{rank,dependentBasisCount:family.length-1,cycleLogTolerance,bridgeRecords:[...new Set(familyEdges.map(e=>e.r.id))],basisRule:'lexically-smallest-exact-source-component-id',bounds:canonicalRedoxLimits},diagnostics:[]})
}
