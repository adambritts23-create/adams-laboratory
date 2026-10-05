import test from 'node:test'
import assert from 'node:assert/strict'
import { carbonateGrid, localCarbonateAvailable } from './phase9Helpers.js'
import { definitionFor } from './phase6Helpers.js'
import { calculateGrid, gridFixture, vary } from './phase8Helpers.js'
import { createPointInput } from '../src/solver/models.js'
import { solvePoint } from '../src/solver/point.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { deriveGridOutputs } from '../src/calculations/outputs.js'
import { gridModel, gridPackage, gridSvg, gridBounds, exactGridIndex, navigateGrid } from '../src/plots/gridView.js'
import { scalarContours, scalarColor, colorRange, gridCellStatus } from '../src/plots/scalarMap.js'
import { componentMolarMass, convertMassInput, massConditionInput } from '../src/calculations/massConcentration.js'
import { toSourceInput, validateCalculationDefinition } from '../src/calculations/definition.js'
import { updateLaboratorySession } from '../src/session/laboratorySession.js'
import { createGridDefinition } from '../src/calculations/grid.js'
import { createLiveRun } from '../src/calculations/liveRun.js'

test('real automatic carbonate F(pH,log total): manual point inputs and both 1D slices match exactly', { skip: !localCarbonateAvailable }, async () => {
  const { system, definition, carbonate, proton } = await carbonateGrid(), grid = await calculateGrid(system, definition)
  assert.equal(grid.counts.converged, 35)
  for (const index of [0, 6, 28, 34, 17, 8, 12, 23]) {
    const p = grid.outcomes[index]
    const input = await createPointInput(system, { revision: 0, unit: 'mol/kg-H2O', temperatureC: 25, pressureBar: 1, activityModel: 'ideal', constraints: system.components.map(c => ({ componentId: c.id, kh: c.id === carbonate.id ? 1 : 2, value: c.id === carbonate.id ? 10 ** p.y : c.id === proton.id ? -p.x : 0 })) })
    assert.ok(input.ok); const direct = solvePoint(system, input.input); assert.ok(direct.ok)
    assert.deepEqual(direct.concentrations, p.result.concentrations); assert.deepEqual(direct.logActivities, p.result.logActivities)
    assert.equal(p.index, p.iy * 7 + p.ix)
  }
  for (const kept of [0, 1]) {
    const fixedIndex = kept === 0 ? 2 : 3, fixedAxis = definition.independentVariables[1 - kept], d = structuredClone(definition)
    d.independentVariables = [d.independentVariables[kept]]
    d.componentConditions.push({ componentId: fixedAxis.componentId, mode: kept === 0 ? 'T' : 'LA', quantity: kept === 0 ? 'total' : 'pH', unit: kept === 0 ? 'mol/kg-H2O' : 'dimensionless', value: kept === 0 ? 10 ** grid.coordinates[1][fixedIndex] : grid.coordinates[0][fixedIndex] })
    const prepared = await createSweepDefinition(system, d, 0); assert.ok(prepared.ok, JSON.stringify(prepared))
    const sweep = await runSweep(system, prepared.sweep)
    sweep.outcomes.forEach((p, i) => assert.deepEqual(p.result.concentrations, grid.outcomes[kept === 0 ? fixedIndex * 7 + i : i * 7 + fixedIndex].result.concentrations))
  }
})
test('swapping X/Y transposes the lattice and preserves scientific meaning and exported orientation', async () => {
  const { system, definition } = await gridFixture(), a = await calculateGrid(system, definition)
  const d = { ...definition, independentVariables: [...definition.independentVariables].reverse() }, b = await calculateGrid(system, d)
  for (const p of a.outcomes) assert.deepEqual(p.result.concentrations, b.outcomes[p.ix * 3 + p.iy].result.concentrations)
  const derived = deriveGridOutputs(system, a, { type: 'log-concentration' }), model = gridModel(derived), svg = gridSvg(model, gridBounds(derived.metadata))
  assert.equal(exactGridIndex(model, a.coordinates[0][2], a.coordinates[1][1]), 5)
  assert.ok(svg.includes('data-cell-index="5"'))
  const doc = JSON.parse(gridPackage(system, a, derived, { selectedSeries: model.series }))
  assert.equal(doc.sampledOutput.cells[5].ix, 2); assert.equal(doc.sampledOutput.cells[5].iy, 1)
  assert.equal(doc.sampledOutput.order, 'x-fast-row-major')
})
test('output unavailable, solver failure, cancellation, stale and not-run retain distinct states', async () => {
  const { system, input } = await gridFixture('pH-redox')
  let definition = definitionFor(system, input)
  definition = vary(definition, system.components.find(c => c.role === 'proton').id, 'LAV', 6, 8, 3, 'pH')
  definition = vary(definition, system.components.find(c => c.role === 'electron').id, 'LAV', 10, 14, 3, 'pe')
  const grid = await calculateGrid(system, definition), derived = deriveGridOutputs(system, grid, { type: 'log-concentration' })
  const electron = derived.series.find(s => s.kind === 'special')
  assert.ok(electron); assert.equal(gridCellStatus(electron.points[0]), 'derived-unavailable')
  const controller = new AbortController(); controller.abort()
  const cancelled = await calculateGrid(system, definition, 0, { signal: controller.signal })
  const out = deriveGridOutputs(system, cancelled, { type: 'log-concentration' })
  const doc = JSON.parse(gridPackage(system, cancelled, out, {}))
  assert.equal(doc.sampledOutput.cells.length, 9); assert.ok(doc.sampledOutput.cells.every(p => p.state === 'cancelled' && p.value === null))
  assert.equal(gridCellStatus({ pointStatus: 'failed', value: null }), 'solver-failure')
  assert.equal(gridCellStatus({ pointStatus: 'not-run', runDisposition: 'invalidated-stale' }), 'stale-invalidated')
  assert.equal(gridCellStatus({ pointStatus: 'not-run' }), 'not-run')
})
test('failure lattice exports every coordinate and hatched cells cannot become zeros', async () => {
  const { system, definition } = await gridFixture()
  definition.independentVariables[0] = { ...definition.independentVariables[0], mode: 'TV', quantity: 'total', unit: 'mol/kg-H2O', range: { min: -1e-5, max: 1e-5 } }
  const grid = await calculateGrid(system, definition), derived = deriveGridOutputs(system, grid, { type: 'log-concentration' }), model = gridModel(derived)
  const doc = JSON.parse(gridPackage(system, grid, derived, { selectedSeries: model.series }))
  assert.equal(doc.sampledOutput.cells.length, 9)
  assert.ok(doc.sampledOutput.cells.some(p => p.state === 'solver-failure' && p.value === null))
  assert.ok(gridSvg(model, gridBounds(model.metadata)).includes('url(#missing-grid)'))
})
test('contours interpolate valid triangles only and mask every quad touching a missing corner', () => {
  const model = { metadata: { shape: [3, 2] }, points: [0, 1, 2, 0, 1, 2].map((value, i) => ({ x: i % 3, y: Math.floor(i / 3), value })) }
  const segments = scalarContours(model, [0.5, 1.5]); assert.equal(segments.length, 4)
  assert.ok(segments.every(s => s.from.x === s.level && s.to.x === s.level))
  model.points[1].value = null; assert.deepEqual(scalarContours(model, [0.5, 1.5]), [])
  assert.deepEqual(scalarContours(model, [NaN]), []); assert.deepEqual(scalarContours(model, Array(21).fill(1)), [])
})
test('sequential scalar colors are channel-monotone, ranges clamp view only and invalid ranges are explicit', () => {
  assert.deepEqual(colorRange({ min: -8, max: -2 }, null), { min: -8, max: -2, error: null })
  const colors = Array.from({ length: 11 }, (_, i) => scalarColor(i, 0, 10).match(/\d+/g).map(Number))
  for (let i = 1; i < colors.length; i++) assert.ok(colors[i].every((c, j) => c >= colors[i - 1][j]))
  assert.equal(scalarColor(-1, 0, 10), scalarColor(0, 0, 10)); assert.equal(scalarColor(11, 0, 10), scalarColor(10, 0, 10))
  assert.ok(colorRange({ min: -8, max: -2 }, { min: 0, max: -1 }).error)
  const session = { revision: 4, visualizationState: {}, lastPlot: { marker: 'same grid' } }
  const view = updateLaboratorySession(session, { type: 'plotView', patch: { colorRange: { min: -6, max: -3 }, contours: true } })
  assert.equal(view.revision, 4); assert.equal(view.lastPlot, session.lastPlot)
  assert.notDeepEqual(navigateGrid({ xMin: 0, xMax: 14, yMin: -6, yMax: -1 }, 0.7), { xMin: 0, xMax: 14, yMin: -6, yMax: -1 })
})
test('explicit unavailable output identity is not silently substituted and SVG preserves view/color/contour metadata', async () => {
  const { system, definition } = await gridFixture(), grid = await calculateGrid(system, definition), derived = deriveGridOutputs(system, grid, { type: 'log-activity' })
  assert.equal(gridModel(derived, 'missing-id'), null)
  const model = gridModel(derived), svg = gridSvg(model, gridBounds(model.metadata), 'dark', 1, 4, undefined, { colorRange: { min: -9, max: -1 }, contours: true })
  assert.ok(svg.includes('linearGradient')); assert.ok(svg.includes('Contours: interpolated')); assert.ok(svg.includes('OLD conditions'))
})
test('user stop preserves partial grid results while invalidation prevents old generation commits', async () => {
  const { system, definition } = await gridFixture('fixed-activity', 21)
  let live, started
  const running = new Promise(resolve => { started = resolve })
  const completed = new Promise(resolve => {
    live = createLiveRun(async (_, control) => { started(); resolve(await calculateGrid(system, definition, 0, { ...control, chunkSize: 1 })) }, 1)
  })
  live.schedule({}, true); await running; live.stop()
  const result = await completed; assert.equal(result.status, 'cancelled'); assert.ok(result.counts.notRun > 0); assert.equal(result.counts.requested, 441)
  live.cancel()
})
test('grid definition rejects duplicate component coordinates and retains independent pH/pe/Eh direct inputs', async () => {
  const { system, definition } = await gridFixture('pH-redox')
  const duplicate = { ...definition, independentVariables: [definition.independentVariables[0], definition.independentVariables[0]] }
  assert.equal((await createGridDefinition(system, duplicate, 0)).ok, false)
  for (const quantity of ['pe', 'Eh']) {
    const d = structuredClone(definition)
    // Same retained direct-basis fixture, coordinate check only; not a Pourbaix reference.
    const proton = system.components.find(c => c.role === 'proton'), electron = system.components.find(c => c.role === 'electron')
    d.independentVariables = [{ componentId: proton.id, mode: 'LAV', quantity: 'pH', unit: 'dimensionless', range: { min: 6, max: 8 }, points: 3 }, { componentId: electron.id, mode: 'LAV', quantity, unit: quantity === 'Eh' ? 'V-SHE' : 'dimensionless', range: { min: quantity === 'Eh' ? 0.5 : 10, max: quantity === 'Eh' ? 0.8 : 14 }, points: 3 }]
    d.componentConditions = system.components.filter(c => ![proton.id, electron.id].includes(c.id)).map(c => ({ componentId: c.id, mode: 'LA', quantity: 'log-activity', unit: 'dimensionless', value: c.role === 'water' ? 0 : -3 }))
    const grid = await calculateGrid(system, d)
    grid.outcomes.forEach(p => { assert.ok(p.result.ok); assert.equal(p.transformed[0].value, -p.x); assert.deepEqual(p.result, solvePoint(system, p.input)) })
  }
})

const massInput = () => ({ componentId: 'component:quantity', componentName: 'Explicit quantity', unit: 'g/L', value: 1, composition: { atoms: { Ca: 1, Cl: 2 }, source: 'Explicit test composition, calcium chloride quantity' }, basis: { kind: 'solvent-mass-per-solution-volume', kgWaterPerL: 0.97, source: 'Declared test basis, not empirical density data', constantAcrossConditions: true } })
test('molar mass derives from explicit atom counts and sourced atomic weights, never display-string guesses', () => {
  const input = massInput(), m = componentMolarMass(input.composition)
  assert.ok(m.ok); assert.equal(m.value, 40.078 + 2 * 35.45)
  assert.equal(componentMolarMass({ ...input.composition, name: 'Wrong display' }).value, m.value)
  for (const composition of [null, { formula: 'CaCl2', source: 'label only' }, { atoms: { Unknown: 1 }, source: 'x' }, { atoms: { Ca: -1 }, source: 'x' }, { atoms: { Ca: 1 }, source: 5 }]) assert.equal(componentMolarMass(composition).ok, false)
})
test('g/L conversion requires explicit solvent basis, rejects dilute assumptions and preserves full provenance', () => {
  const input = massInput(), result = convertMassInput(input)
  assert.equal(result.state, 'defined'); assert.equal(result.molarity.value, input.value / result.molarMass.value)
  assert.equal(result.value, result.molarity.value / 0.97); assert.deepEqual(result.original, input); assert.equal(result.approximate, false)
  const absent = convertMassInput({ ...input, basis: null }); assert.equal(absent.state, 'unavailable'); assert.ok(absent.molarity)
  assert.equal(convertMassInput({ ...input, basis: { kind: 'approximate' } }).ok, false)
  assert.equal(convertMassInput({ ...input, basis: { density: 1 } }).ok, false)
  assert.equal(convertMassInput({ ...input, basis: { ...input.basis, constantAcrossConditions: false } }).ok, false)
})
test('mass-input provenance is checked at the scientific boundary; g/L axes and stale converted values fail', () => {
  const conversion = convertMassInput(massInput()), c = { componentId: massInput().componentId, mode: 'T', quantity: 'total', unit: 'mol/kg-H2O', value: conversion.value, massInput: conversion }
  assert.deepEqual(massConditionInput(c), conversion); assert.equal(toSourceInput(c, c.value, 25).value, c.value)
  assert.throws(() => toSourceInput(c, c.value * 2, 25))
  for (const patch of [{ value: c.value * 2 }, { componentId: 'another' }, { mode: 'TV' }, { unit: 'g/L' }]) assert.throws(() => massConditionInput({ ...c, ...patch }))
  const changed = structuredClone(c); changed.massInput.original.value = 2; assert.throws(() => massConditionInput(changed))
  const definition = { schemaVersion: 1, output: { type: 'log-concentration', speciesIds: [] }, componentConditions: [c], independentVariables: [], temperature: { value: 25, unit: 'C' }, pressure: { value: 1, unit: 'bar' }, ionicStrength: { mode: 'automatic', unit: 'mol/kg-H2O' }, activityModel: 'ideal', enabledPhases: ['liquid'], sampling: { strategy: 'cartesian', maxPoints: 10000 } }
  const errors = validateCalculationDefinition(definition, { selectedComponents: [c.componentId], selectedSpecies: [], enabledPhases: ['liquid'] }, { getComponentById: () => ({ id: c.componentId, name: 'Changed identity', role: 'basis-choice' }) })
  assert.ok(errors.some(e => e.includes('identity changed')))
})

test('defined g/L fixed total reaches the shared sweep path unchanged and preserves export provenance', { skip: !localCarbonateAvailable }, async () => {
  const { system, definition, carbonate } = await carbonateGrid(3, 3)
  // Keep carbonate fixed and vary water is forbidden; validate via the shared 1D path.
  const original = { ...massInput(), componentId: carbonate.id, componentName: carbonate.name, value: 0.06, composition: { atoms: { C: 1, O: 3 }, source: 'Explicit carbonate test composition' } }
  const converted = convertMassInput(original), d = structuredClone(definition)
  d.independentVariables.pop()
  d.componentConditions.push({ componentId: carbonate.id, mode: 'T', quantity: 'total', unit: 'mol/kg-H2O', value: converted.value, massInput: converted })
  const prepared = await createSweepDefinition(system, d, 0); assert.ok(prepared.ok)
  const sweep = await runSweep(system, prepared.sweep)
  assert.ok(sweep.outcomes.every(p => p.result.ok))
  assert.deepEqual(JSON.parse(JSON.stringify(sweep)).definition.calculationDefinition.componentConditions.find(c => c.componentId === carbonate.id).massInput.original, original)
  const native = structuredClone(d); delete native.componentConditions.find(c => c.componentId === carbonate.id).massInput
  const other = await createSweepDefinition(system, native, 0), result = await runSweep(system, other.sweep)
  sweep.outcomes.forEach((p, i) => assert.deepEqual(p.result.concentrations, result.outcomes[i].result.concentrations))
})

test('cancelled current grids remain inspectable/exportable even when an older map exists', async () => {
  const { system, definition } = await gridFixture(), old = await calculateGrid(system, definition)
  const controller = new AbortController(); controller.abort()
  const cancelled = await calculateGrid(system, definition, 0, { signal: controller.signal })
  const session = { revision: 0, lastPlot: { system, grid: old } }
  const pending = updateLaboratorySession(session, { type: 'beginGrid', system, systemId: system.id, gridId: cancelled.gridId, revision: 0 })
  const committed = updateLaboratorySession(pending, { type: 'gridResult', result: cancelled })
  assert.equal(committed.lastPlot.grid, cancelled); assert.equal(committed.lastPlot.grid.counts.notRun, 9)
})
