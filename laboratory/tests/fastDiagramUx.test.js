import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRepository } from '../src/thermodynamics/repository.js'
import { automaticAuditSession, runAutomaticControl } from '../scripts/validation/automaticSolidsAudit.js'
import { discoverReactionSet } from '../src/thermodynamics/compatibility.js'
import { diagramTransition } from '../src/session/diagramNavigation.js'
import { updateLaboratorySession } from '../src/session/laboratorySession.js'
import { deriveOutputs } from '../src/calculations/outputs.js'
import { selectedEquilibrium } from '../src/plots/resultSelection.js'
import { componentPartitions } from '../src/beaker/componentPartition.js'
import { activeSolidLabel } from '../src/beaker/phaseLabel.js'

const repo = createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
let draft = automaticAuditSession(repo, ['Ni 2+'], [0.0037], 11)
draft.calculationDefinition.independentVariables[0].range = { min: 2, max: 12 }
const excluded = discoverReactionSet(repo, draft.chemicalSystem).rows.find(r => r.species.name === 'NiO(cr)')
draft = updateLaboratorySession(draft, { type: 'system', action: { type: 'toggleSpecies', id: excluded.species.id } }, repo)
const control = await runAutomaticControl(repo, 'Ni navigation', draft)
const original = control.session
const components = original.chemicalSystem.selectedComponents.map(id => repo.getComponentById(id))
const reactions = discoverReactionSet(repo, original.chemicalSystem)
const transition = (s, id) => diagramTransition(s, id, components, reactions)

test('four common outputs reuse one current accepted sweep and preserve scientific setup and selected state', () => {
  let session = original
  const before = JSON.stringify(original), selected = selectedEquilibrium(session, 8)
  for (const id of ['total-fraction', 'aqueous-fraction', 'saturated-log-solubility', 'log-concentration']) {
    const next = transition(session, id)
    assert.equal(next.kind, 'reuse'); assert.equal(next.definitionChanged, false)
    session = updateLaboratorySession(session, { type: 'plotView', patch: next.plot }, repo)
    assert.equal(session.lastPlot, original.lastPlot)
    assert.equal(session.calculationDefinition, original.calculationDefinition)
    assert.equal(session.chemicalSystem, original.chemicalSystem)
    assert.equal(session.revision, original.revision)
    assert.equal(selectedEquilibrium(session, 8).result, selected.result)
    assert.deepEqual(componentPartitions(selectedEquilibrium(session, 8)), componentPartitions(selected))
    assert.equal(deriveOutputs(control.system, control.sweep, next.plot).ok, true)
  }
  assert.equal(JSON.stringify(original), before)
  assert.equal(original.calculationDefinition.componentConditions.find(c => c.mode === 'T').value, 0.0037)
  assert.deepEqual(original.calculationDefinition.independentVariables[0].range, { min: 2, max: 12 })
  assert.ok(original.chemicalSystem.excludedSpecies.includes(excluded.species.id))
})

test('fast solubility retains unsaturated gaps and aqueous fractions retain aqueous-only normalization', () => {
  const sol = deriveOutputs(control.system, control.sweep, transition(original, 'saturated-log-solubility').plot)
  assert.ok(sol.series[0].points.some(p => p.value === null))
  assert.ok(sol.series[0].points.some(p => Number.isFinite(p.value)))
  const fraction = deriveOutputs(control.system, control.sweep, transition(original, 'aqueous-fraction').plot)
  assert.ok(fraction.series.every(s => s.phase === 'aqueous'))
  assert.ok(fraction.series.every(s => !control.system.products.some(p => p.id === s.id && p.phase === 'solid')))
})

test('stale, missing and unverified snapshots never become reusable through navigation', () => {
  for (const session of [{ ...original, revision: original.revision + 1 }, { ...original, lastPlot: null }, JSON.parse(JSON.stringify(original))]) {
    assert.equal(transition(session, 'aqueous-fraction').kind, 'setup')
  }
})

test('surface and dependent-pH transitions preserve compatible conditions but explicitly require setup', () => {
  for (const id of ['surface', 'calculated-pH']) {
    const next = transition(original, id)
    assert.equal(next.kind, 'setup'); assert.equal(next.definitionChanged, true)
    assert.match(next.message, /Plot diagram/)
    assert.deepEqual(next.definition.temperature, original.calculationDefinition.temperature)
    assert.deepEqual(next.definition.pressure, original.calculationDefinition.pressure)
    assert.equal(next.definition.activityModel, original.calculationDefinition.activityModel)
    assert.deepEqual(next.definition.componentConditions.filter(c => c.mode === 'T' && c.quantity !== 'total'), original.calculationDefinition.componentConditions.filter(c => c.mode === 'T' && c.quantity !== 'total'))
  }
  const surface = transition(original, 'surface')
  assert.deepEqual(surface.definition.independentVariables, original.calculationDefinition.independentVariables)
  assert.equal(surface.definition.independentVariables.length, 1) // no invented second axis
})

test('missing fraction component and incompatible fraction axis go to setup without inventing a selection', () => {
  const many = [...components, { id: 'extra', role: 'basis-choice' }]
  const noTarget = { ...original, visualizationState: { plot: { type: 'log-concentration' } } }
  const missing = diagramTransition(noTarget, 'aqueous-fraction', many, reactions)
  assert.equal(missing.kind, 'setup'); assert.equal(missing.plot.componentId, null)
  const d = structuredClone(original.calculationDefinition); d.independentVariables[0].quantity = 'log-activity'
  const axes = transition({ ...original, calculationDefinition: d }, 'aqueous-fraction')
  assert.equal(axes.kind, 'setup'); assert.match(axes.message, /1D pH, imposed-Eh or analytical-total sweep/)
})

test('predominance requires explicit area setup while pending activity and unavailable solubility remain unavailable', () => {
  assert.equal(transition(original, 'relative-activity').kind, 'unavailable')
  const area=transition(original,'predominance')
  assert.equal(area.kind,'setup');assert.equal(area.definitionChanged,true)
  assert.equal(area.definition.dimensions,2);assert.equal(area.plot.live,false)
  assert.deepEqual(area.definition.enabledPhases,original.calculationDefinition.enabledPhases)
  assert.equal(transition(original, 'pourbaix').kind, 'setup')
  const noSolid = diagramTransition(original, 'saturated-log-solubility', components, { solidCount: 0, automaticSolids: true })
  assert.equal(noSolid.kind, 'unavailable')
})

test('navigation uses only view updates for reuse and suppresses automatic solve for changed setup', () => {
  const ui = fs.readFileSync('src/components/CalculationWorkspace.jsx', 'utf8')
  assert.match(ui, /else onView\(next.plot\)/)
  assert.match(ui, /onChange\(next.definition,next.plot,\{manual:true\}\)/)
  assert.match(fs.readFileSync('src/App.jsx', 'utf8'), /if \(!databaseBlocked && !manual && session.lastPlot/)
  assert.doesNotMatch(fs.readFileSync('src/session/diagramNavigation.js', 'utf8'), /runSweep\(|solvePoint\(|prepareSessionPoint\(/)
})

test('switcher exposes direct choices, remaining modes, native button semantics and explicit availability', () => {
  const ui = fs.readFileSync('src/components/DiagramSwitcher.jsx', 'utf8')
  for (const label of ['Log concentrations', 'Total fractions', 'Aqueous speciation', 'Log solubility', 'More']) assert.ok(ui.includes(label))
  assert.match(ui, /diagramTypes.filter/); assert.match(ui, /aria-pressed/); assert.match(ui, /disabled=\{busy/)
  assert.match(ui, /<summary>/); assert.match(ui, /type="button"/)
  const css = fs.readFileSync('src/App.css', 'utf8')
  assert.match(css, /\.diagram-segments \{[^}]*flex-wrap:wrap/)
  assert.match(css, /\.calculate.plot-action \{[^}]*min-height:54px/)
})

test('media preserves local artwork architecture, native dialog close and focus restoration with missing-image fallback', () => {
  const ui = fs.readFileSync('src/components/AdamMedia.jsx', 'utf8')
  for (const item of ['thumbnail:', 'image:', 'caption:', 'showModal()', 'onCancel', 'onClose', 'button?.focus()', 'onError', 'Artwork unavailable']) assert.ok(ui.includes(item))
  assert.doesNotMatch(ui, /onCalculate|onSweep|updateLaboratorySession|https?:\/\//)
  assert.match(fs.readFileSync('src/App.css','utf8'), /object-fit:contain/)
})

test('active solid phase label has correct zero, singular and plural forms', () => {
  assert.equal(activeSolidLabel(0), '0 active solid phases')
  assert.equal(activeSolidLabel(1), '1 active solid phase')
  assert.equal(activeSolidLabel(2), '2 active solid phases')
})

