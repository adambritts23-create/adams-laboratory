import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRepository } from '../src/thermodynamics/repository.js'
import { auditFractionBeaker } from '../scripts/validation/fractionBeakerAudit.js'
import { surfaceResponses, selectSurfaceResponse } from '../src/calculations/surfaceResponses.js'
import { selectDiagram } from '../src/calculations/diagramSetup.js'
import { responseDisplay } from '../src/plots/responseSurface.js'
import { selectedEquilibrium } from '../src/plots/resultSelection.js'
import { updateLaboratorySession } from '../src/session/laboratorySession.js'
import { seriesLabel } from '../src/plots/presentation.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { deriveOutputs, deriveGridOutputs } from '../src/calculations/outputs.js'
import { createGridDefinition, runGrid } from '../src/calculations/grid.js'
import { prepareSessionPoint } from '../src/solver/prepareSession.js'
import { gridModel } from '../src/plots/gridView.js'
import { prepareSurface } from '../src/plots/surface3d.js'
const repo = createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const cases = await auditFractionBeaker(repo)
const [aqueous, calcite, mixed] = cases
const options = (c, d = c.session.calculationDefinition) => surfaceResponses(c.session.chemicalSystem, d, repo)

test('response surface selects 3D with floor contours; 2D/3D view changes preserve the identical grid', async () => {
  const s = structuredClone(aqueous.session), d = s.calculationDefinition
  const components = s.chemicalSystem.selectedComponents.map(id => repo.getComponentById(id))
  const next = selectDiagram(d, { visualizationMode: '2d', responseMode: 'contours' }, 'surface', components)
  assert.equal(next.plot.visualizationMode, '3d')
  assert.equal(responseDisplay(next.plot).mode, 'surface-floor')
  assert.equal(responseDisplay(next.plot).baseContours, true)
  const carbonate = components.find(c => c.name === 'CO3 2-')
  next.definition.componentConditions = next.definition.componentConditions.filter(c => c.componentId !== carbonate.id)
  next.definition.independentVariables[0].points = 3
  next.definition.independentVariables.push({ componentId: carbonate.id, quantity: 'total', mode: 'LTV', unit: 'mol/kg-H2O', range: { min: -3, max: -1 }, points: 3 })
  s.calculationDefinition = next.definition
  const p = await prepareSessionPoint(s, repo, { grid: true }), gd = await createGridDefinition(p.system, s.calculationDefinition, s.revision)
  const grid = await runGrid(p.system, gd.grid)
  s.lastPlot = { system: p.system, grid }; s.visualizationState.plot = next.plot
  const before = JSON.stringify(grid)
  for (const visualizationMode of ['2d', '3d']) {
    const viewed = updateLaboratorySession(s, { type: 'plotView', patch: { visualizationMode } }, repo)
    assert.equal(viewed.lastPlot.grid, grid); assert.equal(viewed.revision, s.revision)
    assert.equal(JSON.stringify(viewed.lastPlot.grid), before)
  }
})

test('ordinary surface families exclude generalized inventory, fractions, redox and fixed/varied pH', () => {
  assert.deepEqual(options(aqueous).map(c => c.type), ['concentration', 'log-concentration', 'log-activity', 'total-dissolved', 'log-total-dissolved'])
  const d = structuredClone(aqueous.session.calculationDefinition), proton = d.independentVariables.pop()
  d.componentConditions.push({ componentId: proton.componentId, mode: 'LA', quantity: 'pH', value: 7 })
  assert.ok(!options(aqueous, d).some(c => c.type === 'calculated-pH'))
  d.componentConditions.at(-1).mode = 'T'
  assert.ok(options(aqueous, d).some(c => c.type === 'calculated-pH'))
})

test('secondary surface targets preserve authoritative species/phase identities and never invent Mg', () => {
  const choices = options(calcite)
  for (const type of ['concentration', 'log-concentration', 'log-activity']) {
    const c = choices.find(c => c.type === type)
    assert.equal(c.target, 'species'); assert.ok(c.targets.every(t => t.phase === 'aqueous'))
    assert.ok(c.targets.every(t => !t.name.includes('Mg')))
    assert.ok(!c.targets.some(t => t.name === 'CaCO3(cr)'))
  }
  const solid = choices.find(c => c.type === 'solid-amount')
  assert.equal(solid.target, 'solid'); assert.deepEqual(solid.targets.map(t => t.name), ['CaCO3(cr)'])
  assert.equal(choices.find(c => c.type === 'total-dissolved').target, 'component')
  const patch = selectSurfaceResponse(solid, { gridSeriesId: 'unselected-Mg' })
  assert.equal(patch.gridSeriesId, solid.targets[0].id)
  assert.equal(selectSurfaceResponse(choices[0], { gridSeriesId: solid.targets[0].id }).gridSeriesId, null)
})

test('incompatible stale products and unselected solids cannot enter ordinary Z options', () => {
  const chemical = structuredClone(aqueous.session.chemicalSystem)
  const mg = repo.getSpecies().find(s => s.name === 'MgOH+')
  chemical.selectedSpecies.push(mg.id)
  const choices = surfaceResponses(chemical, aqueous.session.calculationDefinition, repo)
  assert.ok(choices.every(c => c.targets.every(t => t.id !== mg.id)))
  assert.ok(!choices.some(c => c.type === 'solid-amount' || c.type === 'saturated-log-solubility'))
})

for (const c of cases) test(`${c.label}: fraction inspection and Beaker share exact accepted state and positive solids`, () => {
  for (let i = 0; i < c.sweep.outcomes.length; i++) {
    const o = c.sweep.outcomes[i], b = selectedEquilibrium(c.session, i)
    assert.ok(b.ok); assert.equal(b.result, o.result); assert.equal(b.input, o.input)
    assert.deepEqual(b.solids, o.result.solids.filter(s => s.amount > 0))
    const trace = c.fractions.series[0].points[i].fractionTrace
    assert.equal(trace.inputId, o.input.id); assert.equal(trace.solids, o.result.solids)
    assert.deepEqual(trace.activeAssemblage, b.solids.map(s => s.name))
    assert.ok(c.fractions.series.every(s => s.phase === 'aqueous' && !o.result.solids.some(p => p.id === s.id)))
    assert.ok(Math.abs(c.fractions.series.reduce((n, s) => n + s.points[i].value, 0) - 1) < 1e-12)
    b.components.forEach(component => assert.equal(component.totalDissolved, o.result.dissolvedComponentAmounts[c.system.components.findIndex(k => k.id === component.id)]))
  }
})

test('large CaCO3 aqueous fraction is not calcite; explicit calcite and mixed solids agree with the Beaker', () => {
  const curve = aqueous.fractions.series.find(s => s.name === 'CaCO3'), point = curve.points[24]
  assert.equal(curve.phase, 'aqueous'); assert.ok(point.value > 0.9)
  const row = point.fractionTrace.contributors.find(c => c.id === curve.id)
  assert.equal(point.value, row.weightedMolality / point.fractionTrace.totalDissolved)
  assert.match(seriesLabel(curve, 'aqueous-fraction'), /\(aq\)$/)
  assert.deepEqual(selectedEquilibrium(aqueous.session, 24).solids, [])
  assert.ok(selectedEquilibrium(calcite.session, 24).solids.some(s => s.name === 'CaCO3(cr)' && s.amount > 0))
  assert.equal(selectedEquilibrium(mixed.session, 28).solids.length, 3)
})

test('failed exact samples never acquire fractions, solids or 3D interpolated equilibrium', async () => {
  const d = structuredClone(calcite.session.calculationDefinition)
  d.independentVariables[0].range = { min: -400, max: -399 }; d.independentVariables[0].points = 2
  const sd = await createSweepDefinition(calcite.system, d, 0), sweep = await runSweep(calcite.system, sd.sweep)
  const s = { ...calcite.session, lastPlot: { system: calcite.system, sweep } }
  assert.ok(sweep.outcomes.every(o => o.status !== 'converged'))
  assert.equal(selectedEquilibrium(s, 0).ok, false)
  const fractions = deriveOutputs(calcite.system, sweep, { type: 'aqueous-fraction', componentId: calcite.componentId })
  assert.ok(fractions.series.every(s => s.points.every(p => p.value === null && p.fractionTrace.solids === null)))
  const gridD = structuredClone(aqueous.session.calculationDefinition), carbonate = aqueous.system.components.find(c => c.name === 'CO3 2-')
  gridD.dimensions = 2; gridD.independentVariables[0].points = 2
  gridD.componentConditions = gridD.componentConditions.filter(c => c.componentId !== carbonate.id)
  gridD.independentVariables.push({ componentId: carbonate.id, mode: 'TV', quantity: 'total', unit: 'mol/kg-H2O', range: { min: 0, max: 0.1 }, points: 2 })
  const gd = await createGridDefinition(aqueous.system, gridD, 0), grid = await runGrid(aqueous.system, gd.grid)
  assert.ok(grid.counts.failed > 0)
  const derived = deriveGridOutputs(aqueous.system, grid, { type: 'log-concentration' }), model = gridModel(derived, aqueous.componentId)
  const surface = prepareSurface(model, grid.outcomes)
  assert.equal(surface.counts.valid, grid.counts.converged)
  assert.ok(surface.triangles.every(t => t.every(i => grid.outcomes[i].status === 'converged')))
})
