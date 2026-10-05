import {isClosedReagentPlot} from './closedReagentPlot.js'
import { freeze, identity, isPrepared, createPointInput, diagnostic } from '../solver/models.js'
import { solvePoint, methodForSystem } from '../solver/point.js'
import { validateCalculationDefinition, toSourceInput } from './definition.js'

const definitions = new WeakSet(), results = new WeakSet()
export const isSweepResult = value => results.has(value) || isClosedReagentPlot(value)
const failure = message => freeze({ ok: false, status: 'definition-preparation-failure', diagnostics: [diagnostic('invalid-sweep-definition', message)] })

/** Validated scientific request; display ordering is never sorted after transformation. */
export async function createSweepDefinition(system, definition, revision) {
  if (!isPrepared(system)) return failure('An immutable prepared system is required.')
  const d = structuredClone(definition)
  const chemical = { selectedComponents: system.components.map(c => c.id), selectedSpecies: system.products.map(p => p.id), enabledPhases: ['aqueous', 'solid', 'gas', 'liquid'] }
  const repository = { getComponentById: id => {
    const c = system.components.find(c => c.id === id)
    return c && { ...c, role: c.role === 'water' ? 'solvent' : c.role === 'ordinary' ? 'basis-choice' : c.role }
  } }
  let errors
  try { errors = validateCalculationDefinition(d, chemical, repository) } catch { return failure('Malformed calculation definition.') }
  if (errors.length) return failure(errors.join(' '))
  if (system.products.some(p => !d.enabledPhases.includes(p.phase))) return failure('Prepared products include a phase disabled by this definition.')
  if (d.independentVariables.length !== 1) return failure('Exactly one TV, LTV or LAV axis is supported.')
  if (!Number.isInteger(revision) || revision < 0) return failure('A nonnegative scientific revision is required.')
  if (d.activityModel !== 'ideal' || d.temperature.value !== 25 || d.pressure.value !== 1 || d.ionicStrength.unit !== 'mol/kg-H2O' || (d.ionicStrength.mode === 'fixed' && d.ionicStrength.value !== 0)) return failure('Only ideal 25 °C, declared 1 bar, mol/kg-H2O with automatic or fixed-zero ionic strength is supported.')
  if ([...d.componentConditions, ...d.independentVariables].some(c => ['T', 'TV', 'LTV'].includes(c.mode) && c.unit !== 'mol/kg-H2O')) return failure('Molarity conversion is unsupported.')
  const axis = d.independentVariables[0]
  // Bound allocation even when a caller raises the declarative sampling budget.
  if (axis.points > 10000) return failure('This browser orchestration supports at most 10000 requested points.')
  const coordinates = Array.from({ length: axis.points }, (_, i) => i === 0 ? axis.range.min : i === axis.points - 1 ? axis.range.max : (1 - i / (axis.points - 1)) * axis.range.min + i / (axis.points - 1) * axis.range.max)
  if (coordinates.some(c => !Number.isFinite(c))) return failure('Sampling produced a nonfinite coordinate.')
  const body = { schemaVersion: 1, systemId: system.id, revision, calculationDefinition: d,
    axis: { ...axis, start: axis.range.min, end: axis.range.max }, coordinates,
    fixedConditions: d.componentConditions, unit: system.unit, sourceIdentity: system.sourceIdentity }
  const sweep = freeze({ ...body, id: await identity(body) }); definitions.add(sweep)
  return freeze({ ok: true, sweep, diagnostics: [] })
}

/** Independent point solves; yielding/cancellation never changes Newton state. */
export async function runSweep(system, sweep, { signal, isCurrent = () => true, chunkSize = 20 } = {}) {
  if (!isPrepared(system) || !definitions.has(sweep) || sweep.systemId !== system.id) return failure('Sweep and prepared-system identities do not match.')
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 100) return failure('Chunk size must be an integer from 1 to 100.')
  const started = performance.now()
  let solvingMs = 0, inputPreparationMs = 0, status = 'completed'
  const outcomes = []
  for (let index = 0; index < sweep.coordinates.length; index++) {
    const coordinate = sweep.coordinates[index]
    if (!isCurrent()) status = 'invalidated-stale'
    else if (signal?.aborted && status !== 'invalidated-stale') status = 'cancelled'
    if (status !== 'completed') {
      outcomes.push({ index, coordinate, transformed: null, input: null, status: 'not-run', scientificAcceptance: 'not-evaluated', diagnostics: [diagnostic(status, 'This requested point was not calculated.')] })
      continue
    }
    let transformed, input, result
    const inputStart = performance.now()
    try {
      transformed = toSourceInput(sweep.axis, coordinate, 25)
      const constraints = [...sweep.fixedConditions.map(c => ({ componentId: c.componentId, ...toSourceInput(c, c.value, 25) })), { componentId: sweep.axis.componentId, ...transformed }]
      input = await createPointInput(system, { constraints, revision: sweep.revision, unit: system.unit, temperatureC: 25, pressureBar: 1, activityModel: 'ideal' })
    } catch (error) { input = { ok: false, diagnostics: [diagnostic('coordinate-transformation-failure', error.message)] } }
    inputPreparationMs += performance.now() - inputStart
    if (input.ok) {
      const solveStart = performance.now()
      result = solvePoint(system, input.input)
      solvingMs += performance.now() - solveStart
    } else result = input
    outcomes.push({ index, coordinate, transformed: transformed ?? null, input: input.input ?? null,
      status: result.ok ? 'converged' : 'failed', scientificAcceptance: result.ok ? 'passed' : 'not-accepted', result,
      diagnostics: result.diagnostics })
    if ((index + 1) % chunkSize === 0) await new Promise(resolve => setTimeout(resolve, 0))
  }
  if (!isCurrent()) status = 'invalidated-stale'
  else if (signal?.aborted && status === 'completed') status = 'cancelled'
  const counts = { requested: outcomes.length, converged: outcomes.filter(p => p.status === 'converged').length, failed: outcomes.filter(p => p.status === 'failed').length, notRun: outcomes.filter(p => p.status === 'not-run').length }
  if (status === 'completed' && counts.failed) status = 'completed-with-failed-points'
  const result = freeze({ schemaVersion: 1, kind: 'sweep', systemId: system.id, sweepId: sweep.id, revision: sweep.revision,
    sourceIdentity: system.sourceIdentity, definition: sweep, coordinates: sweep.coordinates,
    transformedCoordinates: outcomes.map(p => p.transformed), outcomes, status, counts, unit: system.unit,
    method: methodForSystem(system),
    timing: { nonScientific: true, elapsedMs: performance.now() - started, inputPreparationMs, solvingMs },
    warnings: [...system.warnings, 'Independent ideal point solves; no output transformations, curves or phase-boundary refinement.'] })
  results.add(result); return result
}
