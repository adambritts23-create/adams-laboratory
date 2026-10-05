import test from 'node:test'
import assert from 'node:assert/strict'
import { workspaceMode, calculatedConditions } from '../src/plots/workspaceView.js'
import { references, prepareReference } from './pointHelpers.js'
import { definitionFor, vary } from './phase6Helpers.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'

test('Calculate opens results only for a new returned snapshot; invalid requests retain setup', () => {
  const old = { revision: 1 }, next = { revision: 2 }
  assert.equal(workspaceMode({ mode: 'setup', submission: null }, null), 'setup')
  const submitted = { mode: 'setup', submission: { previous: old } }
  assert.equal(workspaceMode(submitted, old), 'setup') // preparation error: retained snapshot is unchanged
  assert.equal(workspaceMode(submitted, next), 'results')
  assert.equal(workspaceMode({ mode: 'setup', submission: { previous: null } }, next), 'results')
})
test('Edit setup survives background updates; explicit return/recalculate retain the existing graph', () => {
  const snapshot = { revision: 1 }, editedLiveResult = { revision: 2 }
  const editing = { mode: 'setup', submission: null }
  assert.equal(workspaceMode(editing, snapshot), 'setup')
  assert.equal(workspaceMode(editing, editedLiveResult), 'setup')
  assert.equal(workspaceMode({ mode: 'results', submission: null }, snapshot), 'results')
  assert.equal(workspaceMode({ mode: 'results', submission: null }, null), 'setup')
  for (const counts of [{ converged: 0, failed: 3 }, { converged: 2, failed: 1 }]) {
    assert.equal(workspaceMode({ mode: 'setup', submission: { previous: snapshot } }, { counts }), 'results')
  }
})
test('results condition summary uses the actual snapshot, not edited inputs, and preserves exact values', async () => {
  const { system, input } = await prepareReference(references.cases.find(c => c.id === 'complexation'))
  const definition = vary(definitionFor(system, input), system.components[0].id, 'LTV', -8, -4, 3)
  const prepared = await createSweepDefinition(system, definition, 0), sweep = await runSweep(system, prepared.sweep)
  const snapshot = { system, sweep }, before = JSON.stringify(snapshot)
  definition.componentConditions[0].value = 99
  const lines = calculatedConditions(snapshot)
  assert.match(lines[0], /25 °C.*1 bar.*ideal/)
  assert.ok(lines.some(line => line.includes('log₁₀') && line.includes('-8 to -4')))
  assert.ok(lines.some(line => line.includes('0.001')))
  assert.ok(!lines.some(line => line.includes('99')))
  assert.equal(JSON.stringify(snapshot), before)
  assert.deepEqual(calculatedConditions({ system, grid: { definition: { ...sweep.definition, axes: [sweep.definition.axis] } } }), lines)
})
