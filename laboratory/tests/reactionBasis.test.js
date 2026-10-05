import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { transformReactionBasis, scaleReaction } from '../src/thermodynamics/reactionBasis.js'
import { createRepository } from '../src/thermodynamics/repository.js'
import { sourceReactionBasis } from '../src/thermodynamics/sourceReactionBasis.js'
import { sourceRedoxFamily } from '../src/analysis/redoxDiscovery.js'
const row = (id, productId, terms, logK, extra = {}) => ({ id, productId, terms: Object.entries(terms).map(([id, coefficient]) => ({ id, coefficient })), logK, unit: { kind: 'source-reaction-unit', sourceId: id }, provenance: { kind: 'synthetic-control' }, phase: 'aqueous', ...extra })
const a = row('a', 'D', { B: 1, H: 4, E: 2, W: -2 }, 9.038)
const b = row('b', 'P', { D: 1, H: -5.3333, E: -1.3333, W: 2.6667 }, -6.85)
const request = { basisIds: ['B', 'H', 'E', 'W'], componentIds: ['B', 'D', 'H', 'E', 'W'], reactions: [a, b] }
test('general signed reaction substitution retains stored fractions, explicit water and source-unit provenance', () => {
 const r = transformReactionBasis(request); assert.ok(r.ok)
 const p = r.expressions.find(x => x.productId === 'P')
 assert.deepEqual(p.coefficients, [1, 4 - 5.3333, 2 - 1.3333, -2 + 2.6667]); assert.equal(p.logK, -6.85 + 9.038)
 assert.equal(p.sourceReactions.find(x => x.id === 'b').originalTerms[2].coefficient, -1.3333)
 assert.equal(p.unit.kind, 'source-reaction-unit'); assert.equal(p.sourceReactions.length, 2)
 assert.equal(p.checks.elements.status, 'metadata-unavailable'); assert.ok(Object.isFrozen(p))
})
test('scaling and reversal change both sides and logK, preserving the normalized expression', () => {
 for (const factor of [-1, 3, .5]) {
  const r = transformReactionBasis({ ...request, reactions: [scaleReaction(a, factor), b] })
  assert.ok(r.ok); const p = r.expressions.find(x => x.productId === 'P')
  assert.deepEqual(p.coefficients, transformReactionBasis(request).expressions[1].coefficients)
  assert.equal(p.logK, -6.85 + 9.038)
 }
 assert.equal(scaleReaction(a, 0).ok, false)
})
test('redundant and inverse paths are deterministic, while contradictory cycles fail closed', () => {
 const inverse = row('inverse', 'B', { D: 1, H: -4, E: -2, W: 2 }, -9.038)
 const reactions = [a, b, inverse, { ...a, id: 'duplicate-path' }]
 const x = transformReactionBasis({ ...request, reactions }), y = transformReactionBasis({ ...request, reactions: [...reactions].reverse() })
 assert.ok(x.ok); assert.deepEqual(x, y)
 assert.equal(transformReactionBasis({ ...request, reactions: [a, { ...inverse, logK: -9.04 }] }).diagnostics[0].code, 'inconsistent-reaction-cycle')
})
test('rank deficiency, disconnected components and duplicate IDs are typed failures', () => {
 assert.equal(transformReactionBasis({ ...request, componentIds: [...request.componentIds, 'unknown'] }).diagnostics[0].code, 'rank-deficiency')
 assert.equal(transformReactionBasis({ ...request, reactions: [a, a] }).diagnostics[0].code, 'duplicate-identity')
 assert.equal(transformReactionBasis({ ...request, reactions: [row('singular', 'D', { D: 1 }, 0)] }).diagnostics[0].code, 'rank-deficiency')
})
test('contradictory alternate product rows fail in the generic engine itself', () => {
 const inconsistent = { ...b, id: 'alternate-product', logK: b.logK + .01 }
 assert.equal(transformReactionBasis({ ...request, reactions: [a, b, inconsistent] }).diagnostics[0].code, 'inconsistent-product-representations')
})
test('explicit product exclusions apply to every representation and never restore an excluded basis', () => {
 const r = transformReactionBasis({ ...request, reactions: [a, b, { ...b, id: 'other' }], excludedIds: ['b'] })
 assert.ok(r.ok); assert.equal(r.expressions.length, 1); assert.equal(r.exclusions.length, 2)
 assert.equal(transformReactionBasis({ ...request, excludedIds: ['a'] }).diagnostics[0].code, 'excluded-basis-component')
})
test('bookkeeping rejects material errors and records separately justified source precision', () => {
 const attributes = Object.fromEntries(['B','H','E','W','D','P'].map(id => [id, { inventory: { conserved: ['B','D','P'].includes(id) ? 1 : 0 } }]))
 assert.ok(transformReactionBasis({ ...request, attributes }).ok)
 attributes.P.inventory.conserved = 1.0001
 assert.equal(transformReactionBasis({ ...request, attributes }).diagnostics[0].code, 'reaction-bookkeeping-failure')
 attributes.P.precisionBounds = { inventory: .0001 }
 assert.equal(transformReactionBasis({ ...request, attributes }).expressions[1].checks.inventory.status, 'accepted-source-precision-residual')
})
test('general algebra contains no names, element branches or formula parsing', () => {
 const s = fs.readFileSync('src/thermodynamics/reactionBasis.js', 'utf8')
 assert.doesNotMatch(s, /\b(?:Fe|Cu|U|HYDRA|SPANA)\b|\.match\(|RegExp/)
})
test('all four unchanged HYDRA audit reaction tables are reproduced exactly by the new engine', () => {
 const repo = createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
 const audit = JSON.parse(fs.readFileSync('docs/hydra-basis-controls.json'))
 for (const key of ['UVI', 'UV', 'Fe', 'Cu']) {
  const old = audit.transformations[key], ids = new Map(repo.getComponents().map(c => [c.name, c.id])), basisIds = old.basis.map(n => ids.get(n))
  const r = sourceReactionBasis(repo, { familyIds: sourceRedoxFamily(repo, basisIds[2]).componentIds, basisIds, candidateIds: old.transformed.map(p => 'spana:2ac52a30213c9288:' + p.source.id) })
  assert.ok(r.ok, JSON.stringify(r.diagnostics))
  for (const expected of old.transformed) {
   const p = r.expressions.find(p => p.sourceReactionId === 'spana:2ac52a30213c9288:' + expected.source.id)
   assert.deepEqual(p.coefficients, expected.terms.map(t => t.coefficient), key + ' ' + expected.name)
   assert.equal(p.logK, expected.constant, key + ' ' + expected.name)
   assert.ok(p.sourceReactions.every(s => s.provenance.dbSha256 && s.temperatureModel))
  }
 }
})
test('normalized oxide source unit has an explicitly bounded four-decimal elemental residual', () => {
 // Independent composition control: one source unit is one conserved atom.
 // Three stored reservoir coefficients rounded to 4 decimals each have at most
 // 0.5e-4 coefficient error: hydrogen bound = 0.5e-4 + 2*0.5e-4.
 const attributes = { B: { elements: { M: 1, O: 2 } }, H: { elements: { H: 1 } }, E: { elements: {} }, W: { elements: { H: 2, O: 1 } }, D: { elements: { M: 1 } }, P: { elements: { M: 1, O: 8/3 }, precisionBounds: { elements: 1.5e-4 } } }
 const r = transformReactionBasis({ ...request, attributes })
 assert.ok(r.ok)
 const check = r.expressions[1].checks.elements
 assert.equal(check.status, 'accepted-source-precision-residual')
 assert.ok(Math.abs(check.residuals.H - .0001) < 1e-14)
 assert.ok(Math.abs(check.residuals.O - (2.6667 - 8/3)) < 1e-14)
 assert.equal(r.expressions[1].coefficients[3], 2.6667 - 2)
})
