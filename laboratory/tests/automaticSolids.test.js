import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRepository } from '../src/thermodynamics/repository.js'
import { discoverReactionSet, automaticSolidPolicy, usesAutomaticSolids, reconcileAutomaticSpecies } from '../src/thermodynamics/compatibility.js'
import { createWorkspaceSession, updateLaboratorySession, serializeSession, deserializeSession } from '../src/session/laboratorySession.js'
import { auditAutomaticSolids, automaticAuditSession, runAutomaticControl } from '../scripts/validation/automaticSolidsAudit.js'
import { carbonateAuditSession } from '../scripts/validation/fractionBeakerAudit.js'
import { selectedEquilibrium } from '../src/plots/resultSelection.js'
import { prepareSessionPoint } from '../src/solver/prepareSession.js'
import { createGridDefinition, runGrid } from '../src/calculations/grid.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { deriveOutputs, deriveGridOutputs } from '../src/calculations/outputs.js'
import { surfaceResponses } from '../src/calculations/surfaceResponses.js'
import { selectDiagram, diagramUnavailable } from '../src/calculations/diagramSetup.js'
import { multiSolidPolicy } from '../src/solver/assemblages.js'
const repo = createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const cases = await auditAutomaticSolids(repo), [ca, fe, carbonate, mixed, water] = cases
const toggle = (s, type, id) => updateLaboratorySession(s, { type: 'system', action: { type, id } }, repo)
const names = c => c.candidates.map(s => s.name)
const at = (c, pH) => selectedEquilibrium(c.session, c.sweep.outcomes.findIndex(o => o.coordinate === pH))

test('new ordinary systems and New system include intrinsic water/proton and database hydroxide chemistry', () => {
 for (const s of [createWorkspaceSession(repo), updateLaboratorySession(carbonate.session, { type: 'newSystem' }, repo)]) {
  assert.equal(s.chemicalSystem.solidPhasePolicy, automaticSolidPolicy)
  assert.deepEqual(s.chemicalSystem.selectedComponents.map(id => repo.getComponentById(id).role).sort(), ['proton', 'solvent'])
  assert.ok(s.chemicalSystem.selectedSpecies.some(id => repo.getSpeciesById(id).name === 'OH-'))
  assert.ok(s.calculationDefinition.independentVariables.some(c => c.quantity === 'pH'))
 }
})
test('automatic solid compatibility requires every exact nonzero source component; no phosphate or sulfide leakage', () => {
 for (const c of cases) {
  const set = discoverReactionSet(repo, c.session.chemicalSystem), selected = new Set(c.system.components.map(x => x.name))
  for (const row of set.rows.filter(r => r.species.phase === 'solid')) {
   const terms = row.species.metadata.effectiveSourceReaction?.components
   if (row.included) assert.ok(terms.filter(t => t.coefficient !== 0).every(t => selected.has(t.name)))
   if (terms?.some(t => t.coefficient !== 0 && !selected.has(t.name))) assert.equal(row.included, false)
  }
 }
 assert.deepEqual(cases.map(c => c.candidates.length), [2, 4, 4, 10, 0])
})
test('Ca hydroxide is discovered without carbonate and transitions from absent to positive accepted inventory', () => {
 assert.deepEqual(names(ca), ['Ca(OH)2(cr)', 'CaO(cr)'])
 assert.equal(at(ca, 0).solids.length, 0)
 assert.equal(at(ca, 12).solids[0].name, 'Ca(OH)2(cr)')
 assert.equal(at(ca, 12).solids[0].amount, 0.028630254996603023)
 assert.equal(ca.sweep.counts.failed, 0)
})
test('FeIII source phases select hematite at the exact screenshot pH without a redox basis', () => {
 assert.deepEqual(names(fe), ['Fe(OH)3(am)', 'Fe(OH)3(s)', 'Fe2O3(cr)', 'FeOOH(cr)'])
 const state = at(fe, 8.4)
 assert.deepEqual(state.solids.map(s => s.name), ['Fe2O3(cr)'])
 assert.equal(state.solids[0].amount, 0.04999999999949872)
 assert.equal(state.components[0].totalDissolved, 1.0025643935663322e-12)
 assert.ok(!fe.system.components.some(c => c.role === 'electron'))
 assert.equal(at(fe, 0).solids.length, 0)
 assert.equal(fe.sweep.counts.failed, 0)
})
test('Ca carbonate automatically considers four exact phases and admits one and two positive solids', () => {
 assert.deepEqual(names(carbonate), ['Ca(OH)2(cr)', 'CaCO3(am)', 'CaCO3(cr)', 'CaO(cr)'])
 assert.equal(at(carbonate, 12).solids[0].amount, 0.09992894106355982)
 assert.equal(at(carbonate, 14).solids.length, 2)
 assert.equal(carbonate.system.solidPolicy, multiSolidPolicy)
})
test('validated mixed configuration retains explicit choices and the exact three-solid inventory', () => {
 assert.equal(mixed.session.chemicalSystem.solidPhasePolicy, 'explicit')
 assert.deepEqual(at(mixed, 14).solids.map(s => s.amount), [0.0009999974190573818, 0.0004319891466332604, 0.09940548504912593])
})
test('every accepted control sample and Beaker share the exact input/result and positive solid objects', () => {
 for (const c of cases) for (let i = 0; i < c.sweep.outcomes.length; i++) {
  const o = c.sweep.outcomes[i], state = selectedEquilibrium(c.session, i)
  assert.ok(state.ok)
  assert.equal(state.result, o.result); assert.equal(state.input, o.input)
  assert.deepEqual(state.solids, o.result.solids.filter(s => s.amount > 0))
  for (const solid of state.solids) assert.equal(solid, o.result.solids.find(s => s.id === solid.id))
 }
})
test('no compatible solid negative control never invents a precipitate', () => {
 assert.equal(water.candidates.length, 0)
 for (let i = 0; i < water.sweep.outcomes.length; i++) {
  const s = selectedEquilibrium(water.session, i)
  assert.deepEqual(s.solids, []); assert.equal(s.visual.bedHeight, 0)
  assert.match(s.phaseMessage, /No compatible supported solid/)
 }
 assert.match(at(ca, 0).phaseMessage, /2 compatible solid phases considered; none present/)
})
test('exclusions persist through pH edits, diagram/view changes, reset, serialization and recalc', async () => {
 const id = carbonate.candidates.find(s => s.name === 'CaCO3(cr)').id
 let s = toggle(carbonate.session, 'toggleSpecies', id)
 const excluded = [...s.chemicalSystem.excludedSpecies]
 const d = structuredClone(s.calculationDefinition); d.independentVariables[0].range.min = 1
 s = updateLaboratorySession(s, { type: 'calculation', definition: d }, repo)
 const next = selectDiagram(s.calculationDefinition, {}, 'aqueous-fraction', s.system?.components ?? carbonate.system.components)
 s = updateLaboratorySession(s, { type: 'calculation', definition: next.definition }, repo)
 s = updateLaboratorySession(s, { type: 'workspace', workspace: 'calculation' }, repo)
 s = updateLaboratorySession(s, { type: 'plotView', patch: { selectedIndex: 24 } }, repo)
 s = updateLaboratorySession(s, { type: 'resetCalculation' }, repo)
 s = deserializeSession(serializeSession(s))
 assert.deepEqual(s.chemicalSystem.excludedSpecies, excluded)
 s.calculationDefinition.componentConditions = s.calculationDefinition.componentConditions.map(c => ({ ...c, value: c.quantity === 'pH' ? 12 : c.mode === 'T' ? 0.1 : 0 }))
 const p = await prepareSessionPoint(s, repo)
 assert.ok(p.ok, JSON.stringify(p.diagnostics)); assert.ok(!p.system.products.some(p => p.id === id))
 assert.deepEqual(p.system.sourceIdentity.phaseSelection.excludedIds, [id])
 assert.ok(toggle(s, 'toggleSpecies', id).chemicalSystem.selectedSpecies.includes(id))
})
test('component removal/readdition recomputes candidates without restoring an explicitly excluded phase', () => {
 const id = carbonate.candidates.find(s => s.name === 'CaCO3(cr)').id
 let s = toggle(carbonate.session, 'toggleSpecies', id)
 const carbon = carbonate.system.components.find(c => c.name === 'CO3 2-').id
 s = toggle(s, 'toggleComponent', carbon)
 assert.equal(discoverReactionSet(repo, s.chemicalSystem).solidCount, 2)
 s = toggle(s, 'toggleComponent', carbon)
 assert.equal(discoverReactionSet(repo, s.chemicalSystem).solidCount, 3)
 assert.ok(s.chemicalSystem.excludedSpecies.includes(id))
})
test('saved explicit and unversioned legacy scientific choices remain unchanged', () => {
 for (const included of [false, true]) {
  const original = carbonateAuditSession(repo, included)
  delete original.chemicalSystem.solidPhasePolicy
  const loaded = deserializeSession(serializeSession(original)), before = JSON.stringify(loaded.chemicalSystem)
  assert.equal(usesAutomaticSolids(loaded.chemicalSystem, repo), false)
  assert.equal(JSON.stringify(reconcileAutomaticSpecies(loaded.chemicalSystem, repo)), before)
  assert.equal(discoverReactionSet(repo, loaded.chemicalSystem).solidCount, included ? 1 : 0)
 }
})
test('excluding every compatible solid produces an honest aqueous-only accepted state', async () => {
 let s = automaticAuditSession(repo, ['Ca 2+', 'CO3 2-'])
 for (const p of carbonate.candidates) s = toggle(s, 'toggleSpecies', p.id)
 const c = await runAutomaticControl(repo, 'excluded', s), state = at(c, 12)
 assert.equal(state.solids.length, 0)
 assert.equal(state.components[0].totalDissolved, 0.10000000000000002)
 assert.match(state.phaseMessage, /explicitly excluded/)
 assert.equal(c.system.sourceIdentity.phaseSelection.excludedIds.length, 4)
})
test('phase-group exclusion disables solids without erasing per-solid exclusions', async () => {
 const id = ca.candidates[0].id
 let s = toggle(ca.session, 'toggleSpecies', id)
 s = updateLaboratorySession(s, { type: 'system', action: { type: 'togglePhase', phase: 'solid' } }, repo)
 const p = await prepareSessionPoint(s, repo, { sweep: true })
 assert.ok(p.ok); assert.equal(p.system.solidRows.length, 0)
 assert.equal(p.system.sourceIdentity.phaseSelection.excludedIds.length, 2)
 s = updateLaboratorySession(s, { type: 'system', action: { type: 'togglePhase', phase: 'solid' } }, repo)
 assert.ok(!s.chemicalSystem.selectedSpecies.includes(id))
})
test('precipitating automatic systems retain aqueous-only fraction normalization', () => {
 for (const c of [ca, fe, carbonate]) {
  const output = deriveOutputs(c.system, c.sweep, { type: 'aqueous-fraction', componentId: c.system.components[0].id })
  assert.ok(output.ok, JSON.stringify(output.diagnostics))
  assert.ok(output.series.every(s => s.phase === 'aqueous'))
  for (let i = 0; i < c.sweep.outcomes.length; i++) {
   const values = output.series.map(s => s.points[i].value)
   if (values.every(v => v !== null)) assert.ok(Math.abs(values.reduce((a, b) => a + b, 0) - 1) < 1e-12)
  }
 }
})
test('response grids, solid and solubility modes use the same included/excluded phase set at every point', async () => {
 const id = carbonate.candidates.find(s => s.name === 'CaCO3(am)').id
 const s = toggle(automaticAuditSession(repo, ['Ca 2+', 'CO3 2-']), 'toggleSpecies', id)
 const d = s.calculationDefinition, carbon = carbonate.system.components.find(c => c.name === 'CO3 2-').id
 d.dimensions = 2; d.independentVariables[0].points = 3
 d.componentConditions = d.componentConditions.filter(c => c.componentId !== carbon)
 d.independentVariables.push({ componentId: carbon, mode: 'LTV', quantity: 'total', unit: 'mol/kg-H2O', range: { min: -3, max: -1 }, points: 3 })
 const p = await prepareSessionPoint(s, repo, { grid: true }); assert.ok(p.ok)
 const gd = await createGridDefinition(p.system, d, s.revision), grid = await runGrid(p.system, gd.grid)
 const included = p.system.solidRows.map(j => p.system.products[j].id)
 for (const o of grid.outcomes) if (o.result) assert.deepEqual(o.result.solids.map(s => s.id), included)
 const options = surfaceResponses(s.chemicalSystem, d, repo)
 assert.deepEqual(options.find(c => c.type === 'solid-amount').targets.map(s => s.id).sort(), [...included].sort())
 assert.ok(options.some(c => c.type === 'saturated-log-solubility'))
 assert.equal(diagramUnavailable('saturated-log-solubility', { ...d, dimensions: 1 }, p.system.components, included.length, true), null)
 const output = deriveGridOutputs(p.system, grid, { type: 'solid-amount', seriesId: included[0] })
 assert.ok(output.ok)
 assert.ok(!included.includes(id))
})
test('failed automatic sweeps fabricate neither accepted solids nor fraction values', async () => {
 const d = structuredClone(ca.session.calculationDefinition)
 d.independentVariables[0].range = { min: -400, max: -399 }; d.independentVariables[0].points = 2
 const definition = await createSweepDefinition(ca.system, d, 0)
 const sweep = await runSweep(ca.system, definition.sweep)
 const s = { ...ca.session, lastPlot: { system: ca.system, sweep } }
 assert.ok(sweep.counts.failed > 0)
 const fractions = deriveOutputs(ca.system, sweep, { type: 'aqueous-fraction', componentId: ca.system.components[0].id })
 assert.ok(fractions.series.every(s => s.points.every(p => p.value === null && p.fractionTrace.solids === null)))
 for (let i = 0; i < sweep.outcomes.length; i++) if (sweep.outcomes[i].status !== 'converged') {
  const state = selectedEquilibrium(s, i); assert.equal(state.ok, false); assert.equal(state.solids, undefined)
 }
})
test('automatic policy does not broaden electron-basis or gas equilibrium', () => {
 const s = createWorkspaceSession(repo).chemicalSystem
 s.selectedComponents.push(repo.getComponents().find(c => c.role === 'electron').id)
 assert.equal(usesAutomaticSolids(s, repo), false)
 assert.ok(discoverReactionSet(repo, s).rows.filter(r => r.included).every(r => r.species.phase !== 'gas'))
})
