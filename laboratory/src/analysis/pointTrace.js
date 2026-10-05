import { aqueousFractionNumerics } from '../calculations/aqueousFractions.js'
import { freeze, isPrepared } from '../solver/models.js'
import { componentBalanceTolerance, numericalValidationContract as limits } from '../solver/validationContract.js'
import { isGridResult } from '../calculations/grid.js'
import { isSweepResult } from '../calculations/sweep.js'
import { isDerivedResult } from '../calculations/outputs.js'
import { toSourceInput } from '../calculations/definition.js'
import { cellDiagnostic } from './gridDiagnostics.js'
import { factoredTrace,positiveLogSum } from '../solver/logConcentration.js'

/** Independent reconstruction from amounts and signed source rows, never result residuals. */
export function auditPointEquations(system, input, result) {
  if (!result?.ok || !input) return { status: 'not-evaluated', checks: [], dissolved: null, totals: null }
  const n = system.components.length, checks = []
  const check = (equation, id, actual, expected, tolerance) => checks.push({ equation, id, actual, expected, residual: actual - expected, tolerance, passed: Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= tolerance })
  const smallest = Math.min(1e-6, ...input.constraints.filter(c => c.kh === 1 && c.value !== 0).map(c => Math.abs(c.value)))
  const trace = i => result.linearConcentrationStatus?.[i]?.startsWith('positive-')
  const logConcentration = i => trace(i) ? result.logConcentrations[i] : Math.log10(result.concentrations[i])
  const dissolved = system.components.map((c, i) => c.role === 'water' ? 0 : result.concentrations[i] + system.aqueousRows.reduce((sum, j) => sum + (trace(n+j) ? factoredTrace(result.logConcentrations[n+j], [system.products[j].coefficients[i]]) : system.products[j].coefficients[i] * result.concentrations[n + j]), 0))
  result.concentrations.forEach((value, i) => { if(trace(i))check('trace-linear-materialization',system.speciesIds[i],value,10**result.logConcentrations[i],0) })
  const totals = dissolved.map((d, i) => system.components[i].role === 'water' ? 0 : d + system.solidRows.reduce((sum, j) => sum + system.products[j].coefficients[i] * result.concentrations[n + j], 0))
  system.components.forEach((c, i) => {
    const k = input.constraints[i], tolerance = componentBalanceTolerance(k.kh === 1 ? k.value : totals[i], smallest)
    if (k.kh === 1) check('component-balance', c.id, totals[i], k.value, tolerance)
    else check('fixed-log-activity', c.id, result.logActivities[i], k.value, 0)
    check('reported-dissolved-sum', c.id, result.dissolvedComponentAmounts[i], dissolved[i], tolerance)
    check('reported-total-sum', c.id, result.componentTotals[i], totals[i], tolerance)
    if(Number.isFinite(result.dissolvedComponentLogAmounts?.[i])) {
      const expected=system.aqueousRows.some(j=>system.products[j].coefficients[i]<0)?NaN:positiveLogSum([...(c.suppressed?[]:[result.logActivities[i]]),...system.aqueousRows.flatMap(j=>system.products[j].coefficients[i]>0?[result.logActivities[n+j]+Math.log10(system.products[j].coefficients[i])]:[])])
      check('reported-log-dissolved-sum',c.id,result.dissolvedComponentLogAmounts[i],expected,limits.massActionLogResidualTolerance)
    }
    if (c.suppressed) check('suppressed-bookkeeping-amount', c.id, result.concentrations[i], 0, 0)
    else check('ideal-free-activity', c.id, logConcentration(i), result.logActivities[i], limits.massActionLogResidualTolerance)
    if (c.role === 'water') check('ideal-solvent-log-activity', c.id, result.logActivities[i], 0, 0)
  })
  system.products.forEach((p, j) => {
    const log = p.logBeta + p.coefficients.reduce((sum, a, i) => sum + a * result.logActivities[i], 0)
    check('reported-formation-log', p.id, result.logActivities[n + j], log, limits.massActionLogResidualTolerance)
    if (p.phase === 'aqueous') check('aqueous-mass-action', p.id, logConcentration(n+j), log, limits.massActionLogResidualTolerance)
    else {
      const s = result.solids.find(s => s.id === p.id)
      check('solid-amount', p.id, s?.amount, result.concentrations[n + j], 0)
      check('solid-nonnegative', p.id, Math.min(0, s?.amount), 0, 0)
      check('solid-complementarity', p.id, s?.status === 'present' ? log : Math.max(0, log), 0, result.saturationTolerance)
      check('solid-activity', p.id, s?.status === 'present' ? s.activity : Number(s?.activity !== null), s?.status === 'present' ? 1 : 0, 0)
    }
  })
  return { status: checks.every(c => c.passed) ? 'passed' : 'failed', checks, dissolved, totals }
}

/** Recompute the selected display quantity independently; null is never replaced by zero. */
export function recomputeOutput(system, input, result, request, seriesId, audit) {
  if (!result?.ok) return null
  const i = system.speciesIds.indexOf(seriesId), c = system.componentIndex[request.componentId]
  const amount = result.concentrations[i], log = v => v > 0 ? Math.log10(v) : null
  const dissolved = audit.dissolved[c], solid = result.solids.find(s => s.id === seriesId)
  const logDissolved=result.dissolvedComponentLogAmounts?.[c]??log(dissolved)
  switch (request.type) {
    case 'concentration': return result.linearConcentrationStatus?.[i]==='positive-underflow'?null:amount
    case 'solid-amount': return solid?.amount ?? null
    case 'log-concentration': return system.components[i]?.suppressed ? null : result.logConcentrations?.[i] ?? log(amount)
    case 'log-activity': return solid ? solid.status === 'present' ? 0 : null : result.logActivities[i]
    case 'saturated-log-solubility': {
      const phases = system.products.filter(p => p.phase === 'solid')
      if (system.components[c]?.role !== 'ordinary' || system.products.some(p => p.coefficients[c] < 0) || phases.length !== 1 || !(phases[0].coefficients[c] > 0)) return null
      const phase = result.solids.find(s => s.id === phases[0].id)
      return phase && ['present','saturated-zero-amount'].includes(phase.status) && Number.isFinite(phase.logSaturation) && Math.abs(phase.logSaturation) <= result.saturationTolerance ? logDissolved : null
    }
    case 'total-dissolved': return dissolved===0&&Number.isFinite(logDissolved)?null:dissolved >= 0 ? dissolved : null
    case 'log-total-dissolved': case 'log-solubility': return logDissolved
    case 'analytical-total': return input.constraints[c].kh === 1 ? input.constraints[c].value : null
    case 'aqueous-fraction': return dissolved > aqueousFractionNumerics.minimumDissolvedAmount && i>=0 && (i<system.components.length || system.products[i-system.components.length].phase==='aqueous') ? (i<system.components.length?Number(i===c):system.products[i-system.components.length].coefficients[c])*amount/dissolved : null
    case 'total-fraction': {
      const total=input.constraints[c]
      if(i<0||total?.kh!==1||!(total.value>result.residuals.componentBalanceLimits[c]))return null
      const coefficient=i<system.components.length?Number(i===c):system.products[i-system.components.length].coefficients[c]
      return coefficient*(solid?.amount??amount)/total.value
    }
    case 'fraction': {const coefficient=i<system.components.length?Number(i===c):system.products[i-system.components.length].coefficients[c];return coefficient!==0&&result.linearConcentrationStatus?.[i]==='positive-underflow'?null:audit.totals[c]>0?coefficient*amount/audit.totals[c]:null}
    case 'calculated-pH': return -result.logActivities[system.components.findIndex(c => c.role === 'proton')]
    case 'calculated-redox': {
      const pe = -result.logActivities[system.components.findIndex(c => c.role === 'electron')]
      return request.redoxQuantity === 'pe' ? pe : pe * 8.31446261815324 * Math.LN10 * (result.temperatureC + 273.15) / Number('96485.3321233100184')
    }
    default: return null
  }
}

export function reactionCoupling(system, variedId, descriptor) {
  const varied = system.componentIndex[variedId], outputIndex = system.componentIndex[descriptor.componentId ?? descriptor.seriesId]
  const product = system.products.find(p => p.id === descriptor.seriesId)
  const outputComponents = outputIndex !== undefined ? [outputIndex] : product ? product.coefficients.flatMap((a, i) => a !== 0 ? [i] : []) : []
  const using = system.aqueousRows.map(j => system.products[j]).filter(p => p.coefficients[varied] !== 0)
  const coupled = using.filter(p => outputComponents.some(i => p.coefficients[i] !== 0))
  return { variedComponent: system.components[varied], output: descriptor.label, aqueousUsingVaried: using.map(p => p.id), directlyCoupledRecords: coupled.map(p => p.id),
    interpretation: coupled.length ? 'Shared nonzero source coefficients exist; response magnitude still depends on the equations and constraints.' : 'ZERO direct aqueous reaction links identified. This is not a proof of no indirect coupling or solid-mediated response.' }
}

export function neighborSensitivity(grid, series, index) {
  const o = grid.outcomes[index], p = series.points[index]
  if (!grid.shape) return []
  return grid.definition.axes.map((axis, a) => {
    const step = a === 0 ? 1 : grid.shape[0], position = a === 0 ? o.ix : o.iy
    // Adjacent only: never search past a hole.
    return { axis: a === 0 ? 'X' : 'Y', componentId: axis.componentId, neighbors: [-1, 1].flatMap(direction => {
      if (position + direction < 0 || position + direction >= grid.shape[a]) return []
      const j = index + direction * step, other = grid.outcomes[j], q = series.points[j]
      const changed = o.input && other.input ? o.input.constraints.filter((k, i) => k.kh !== other.input.constraints[i].kh || k.value !== other.input.constraints[i].value).map(k => k.componentId) : null
      const deltaCoordinate = (a === 0 ? other.x - o.x : other.y - o.y)
      const valid = o.status === 'converged' && other.status === 'converged' && Number.isFinite(p.value) && Number.isFinite(q.value)
      const deltaF = valid ? q.value - p.value : null
      return [{ index: j, deltaCoordinate, changedComponentIds: changed, intendedInputOnly: changed?.length === 1 && changed[0] === axis.componentId,
        deltaF, slope: valid && deltaCoordinate !== 0 ? deltaF / deltaCoordinate : null,
        interpretation: !changed ? 'Point input unavailable.' : changed.length === 0 && deltaCoordinate !== 0 ? 'Coordinate changed but prepared input did not; inspect transform/representability.' : !valid ? 'No finite difference across unavailable output.' : 'Input change and sampled response are separate evidence; small response alone is not an axis defect.' }]
    }) }
  })
}

/** Optional, deterministic and lazy. Consumes one retained point; does not invoke a solver. */
export function scientificPointTrace(system, calculation, derived, seriesId, index, currentRevision = calculation.revision) {
  if (!isPrepared(system) || (!isGridResult(calculation) && !isSweepResult(calculation)) || !isDerivedResult(derived) || system.id !== calculation.systemId || derived.metadata.systemId !== system.id || derived.metadata.revision !== calculation.revision || (derived.metadata.gridId ?? derived.metadata.sweepId) !== (calculation.gridId ?? calculation.sweepId)) return { ok: false, reason: 'Matching prepared, calculation and derived identities required.' }
  const series = derived.series.find(s => s.id === seriesId), o = calculation.outcomes[index]
  if (!series || !o) return { ok: false, reason: 'Select an existing output and exact point index.' }
  const axes = calculation.definition.axes ?? [calculation.definition.axis], coordinates = calculation.kind === 'grid' ? [o.x, o.y] : [o.coordinate]
  const requested = [...calculation.definition.fixedConditions.map(c => ({ condition: c, coordinate: c.value })), ...axes.map((condition, i) => ({ condition, coordinate: coordinates[i] }))]
  const transforms = requested.map(({ condition, coordinate }) => {
    try {
      const expected = toSourceInput(condition, coordinate, system.temperatureC), actual = o.input?.constraints.find(c => c.componentId === condition.componentId) ?? null
      return { condition, coordinate, expected, actual, passed: actual ? actual.kh === expected.kh && actual.value === expected.value : null }
    } catch (error) { return { condition, coordinate, actual: null, passed: null, diagnostic: error.message } }
  })
  const audit = auditPointEquations(system, o.input, o.result), point = series.points[index]
  const recomputed = recomputeOutput(system, o.input, o.result, derived.request, seriesId, audit)
  const tolerance = ['saturated-log-solubility','log-concentration','log-activity','log-total-dissolved','log-solubility','calculated-pH','calculated-redox'].includes(derived.request.type) ? limits.comparisonLogActivityTolerance : limits.comparisonAbsoluteConcentrationTolerance + limits.comparisonRelativeConcentrationTolerance * Math.abs(recomputed ?? 0)
  const output = { descriptor: series.descriptor, plottedValue: point.value, recomputedValue: recomputed, reason: point.reason, tolerance, passed: recomputed === null ? point.value === null : Number.isFinite(recomputed) && Math.abs(recomputed - point.value) <= tolerance }
  return freeze({ ok: true, kind: 'ScientificPointTrace', schemaVersion: 1, systemId: system.id, inputId: o.input?.id ?? null, calculationId: calculation.gridId ?? calculation.sweepId, systemRevision: calculation.revision, currentRevision, stale: calculation.revision !== currentRevision,
    sourceIdentity: system.sourceIdentity, selectedComponents: system.components, solvent: system.components.find(c => c.role === 'water') ?? null,
    preparedComponentOrder: system.components.map(c => c.id), preparedSpeciesOrder: system.speciesIds, includedReactionRecords: system.products,
    stoichiometricMatrix: system.products.map(p => p.coefficients), logKValues: system.products.map(p => p.logBeta),
    pointCoordinates: { index, x: coordinates[0], y: coordinates[1] ?? null, ix: o.ix ?? null, iy: o.iy ?? null }, axes, fixedConditions: calculation.definition.fixedConditions, transformedConditions: transforms,
    input: o.input ?? null, suppliedTotals: o.input?.constraints.filter(c => c.kh === 1) ?? [], suppliedLogActivities: o.input?.constraints.filter(c => c.kh === 2) ?? [],
    unknowns: o.input?.constraints.filter(c => c.kh === 1).map(c => ({ componentId: c.componentId, quantity: 'log10 activity' })) ?? [],
    solidUnknown: system.solidRows.length ? 'Candidate solid amount is an additional unknown only in the present assemblage.' : null,
    solvedLogActivities: o.result?.logActivities ?? null, solvedAmounts: o.result?.concentrations ?? null, solidState: o.result?.solids ?? null,
    recordedResiduals: o.result?.residuals ?? null, equationAudit: audit, convergenceDiagnostics: cellDiagnostic(o, point, series.descriptor),
    initialGuess: { value: null, availability: 'Initial iterate not recorded in retained results; no reconstructed guess is claimed as captured.' }, finalAttemptedUnknowns: { value: null, availability: 'Failed final iterates not recorded; accepted solution is shown separately when available.' },
    minimumPivotRatio: o.result?.minimumPivotRatio ?? null, plottedOutput: output, coupling: axes.map(a => reactionCoupling(system, a.componentId, series.descriptor)), sensitivity: neighborSensitivity(calculation, series, index),
    auditStatus: audit.status === 'not-evaluated' ? 'not-evaluated' : audit.status === 'passed' && transforms.every(t => t.passed) && output.passed ? 'passed' : 'failed',
    limitations: ['Equation consistency is not independent empirical validation or database completeness.', 'Selected records only; no original source file is exported.', 'Finite differences are adjacent sample diagnostics, not interpolated chemistry.'] })
}
