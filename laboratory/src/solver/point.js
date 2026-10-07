import { enumerateAssemblages, multiSolidPolicy, sourceSolidPolicy, phaseRank } from './assemblages.js'
import { freeze, diagnostic, isPrepared, isPointInput } from './models.js'
import { solveLinear } from './linear.js'
import { componentBalanceTolerance, numericalValidationContract as contract } from './validationContract.js'
import { linearFromLog as power, minimumNormal, factoredTrace, concentrationStatus, positiveLogSum, logTracePolicy } from './logConcentration.js'

export const closedSolidActivePolicy = 'closed-pure-solid-active-set-v1'
const successfulResults = new WeakSet()
export const isSuccessfulPointResult = r => successfulResults.has(r)
export const pointMethod = Object.freeze({ name: 'scaled-log-Newton-with-single-solid-active-set', version: '1.0.1' })
const multiSolidMethod = Object.freeze({ name: 'scaled-log-Newton-with-bounded-pure-solid-assemblages', version: '1.0.0' })
export const methodForSystem = system => system?.solidPolicy === multiSolidPolicy && system.solidRows?.length > 1 ? multiSolidMethod : pointMethod
// Iteration tolerances are stricter than scientific acceptance; regression thresholds are never used to stop Newton.
const iterationTolerance = 2e-13, saturationTolerance = 1e-12
const norm = values => Math.max(0, ...values.map(Math.abs))
const sum = values => { let total = 0, correction = 0; for (const value of values) { const y = value - correction, t = total + y; correction = (t - total) - y; total = t } return total }
function evaluate(system, input, logA, solidAmount) {
  const n = system.components.length
  const free = system.components.map((c, i) => c.suppressed ? 0 : power(logA[i]))
  const productLog = system.products.map(p => p.logBeta + sum(p.coefficients.map((v, i) => v * logA[i])))
  const productC = system.products.map((p, j) => p.phase === 'aqueous' ? power(productLog[j]) : (Array.isArray(solidAmount) ? solidAmount[j] ?? 0 : solidAmount))
  const trace = system.products.map((p, j) => p.phase === 'aqueous' && productC[j] < minimumNormal)
  const weighted = (j, i) => trace[j] ? factoredTrace(productLog[j], [system.products[j].coefficients[i]]) : system.products[j].coefficients[i] * productC[j]
  const dissolved = system.components.map((c, i) => c.role === 'water' ? 0 : sum([free[i], ...system.aqueousRows.map(j => weighted(j, i))]))
  const totals = system.components.map((c, i) => c.role === 'water' ? 0 : sum([dissolved[i], ...system.solidRows.map(j => system.products[j].coefficients[i] * productC[j])]))
  const balance = input.constraints.map((c, i) => c.kh === 1 ? totals[i] - c.value : null)
  const scale = input.constraints.map((c, i) => Math.max(Math.abs(c.value), Math.abs(free[i]) + sum(system.products.map((p, j) => Math.abs(weighted(j, i)))), 1e-300))
  if (![...free, ...productC, ...productLog, ...dissolved, ...totals, ...scale].every(Number.isFinite)) throw new Error('overflow')
  return { free, productC, productLog, trace, dissolved, totals, balance, scale, logA: [...logA], n }
}

function solveAssemblage(system, input, active, options) {
  const unknown = input.constraints.flatMap((c, i) => c.kh === 1 ? [i] : [])
  const activeRows = Array.isArray(active) ? active : active ? [system.solidRows[0]] : []
  if (activeRows.some(j => !unknown.some(i => system.products[j].coefficients[i] !== 0))) return { ok: false, code: 'inconsistent-fixed-constraints', message: 'A solid amount cannot be determined when all of its participating components have fixed activities.' }
  const logA = options.initialLogActivities ? [...options.initialLogActivities] : input.constraints.map(c => c.kh === 2 ? c.value : Math.log10(Math.abs(c.value) || 1e-7))
  const amountScale = Math.max(...input.constraints.filter(c => c.kh === 1).map(c => Math.abs(c.value)), 1e-12)
  let solidVariables = activeRows.map(() => 0), state, minPivotRatio = 1, lastFailure = null
  try { state = evaluate(system, input, logA, 0) } catch (error) { return { ok: false, code: error.message, message: 'Initial mass action exceeds floating-point range.' } }
  for (let iteration = 0; iteration <= options.maxIterations; iteration++) {
    const residual = unknown.map(i => state.balance[i] / state.scale[i])
    activeRows.forEach(j => residual.push(state.productLog[j]))
    const jacobian = unknown.map(i => {
      const row = unknown.map(k => Math.LN10 * sum([(i === k ? (!system.components[i].suppressed && state.free[i] < minimumNormal ? factoredTrace(state.logA[i], [1], state.scale[i]) : state.free[i] / state.scale[i]) : 0), ...system.aqueousRows.map(j => state.trace[j] ? factoredTrace(state.productLog[j], [system.products[j].coefficients[i], system.products[j].coefficients[k]], state.scale[i]) : system.products[j].coefficients[i] * system.products[j].coefficients[k] * (state.productC[j] / state.scale[i]))]))
      activeRows.forEach(j => row.push(system.products[j].coefficients[i] * (amountScale / state.scale[i])))
      return row
    })
    activeRows.forEach(j => jacobian.push([...unknown.map(i => system.products[j].coefficients[i]), ...activeRows.map(() => 0)]))
    const linear = solveLinear(jacobian, residual.map(r => -r))
    if (!linear.ok) return { ok: false, code: 'singular-or-ill-conditioned', message: 'Scaled Newton Jacobian is singular or fails the pivot threshold.', iteration }
    minPivotRatio = Math.min(minPivotRatio, linear.pivotRatio)
    // A zero residual does not determine an activity when the constraint Jacobian
    // is singular. Apply the same conditioning gate even at an initial root.
    if (norm(residual) <= iterationTolerance && activeRows.every(j => Math.abs(state.productLog[j]) <= saturationTolerance)) return { ok: true, state, iteration, minPivotRatio, active: activeRows.length > 0, activeRows }
    if (iteration === options.maxIterations) return { ok: false, code: 'numerical-nonconvergence', message: 'Iteration limit reached without satisfying scaled balances/saturation.', iteration, residualNorm: norm(residual), minPivotRatio }
    const step = linear.solution
    let alpha = Math.min(1, 4 / Math.max(4, ...step.slice(0, unknown.length).map(Math.abs)))
    const oldMerit = norm(residual)
    let accepted = false
    for (let backtrack = 0; backtrack < 40; backtrack++, alpha *= 0.5) {
      const trialLog = [...logA]
      unknown.forEach((i, k) => { trialLog[i] += alpha * step[k] })
      const trialVariables = solidVariables.map((v, k) => v + alpha * step[unknown.length + k])
      const trialSolid = system.products.map((_, j) => { const k = activeRows.indexOf(j); return k < 0 ? 0 : trialVariables[k] * amountScale })
      try {
        const trial = evaluate(system, input, trialLog, trialSolid)
        // Hold row scales fixed during line search; changing units cannot manufacture descent.
        const trialResidual = unknown.map(i => trial.balance[i] / state.scale[i])
        activeRows.forEach(j => trialResidual.push(trial.productLog[j]))
        if (norm(trialResidual) <= oldMerit * (1 - 1e-4 * alpha) || norm(trialResidual) <= iterationTolerance) {
          trialLog.forEach((value, i) => { logA[i] = value }); solidVariables = trialVariables; state = trial; accepted = true; break
        }
      } catch (error) { lastFailure = error.message }
    }
    if (!accepted) return { ok: false, code: lastFailure ?? 'numerical-nonconvergence', message: 'No finite residual-reducing damped step was found.', iteration, residualNorm: oldMerit }
  }
}

/** Retry initialization only: one positive ordinary total, all other activities fixed.
 * Nonnegative stoichiometry makes each aqueous inventory contribution monotone.
 * This seed is not an equilibrium result and never bypasses the Newton/rank gates.
 */
function singleTotalSeed(system, input, activeRows) {
  const unknown = input.constraints.flatMap((c, i) => c.kh === 1 ? [i] : [])
  if (unknown.length !== 1 || activeRows.length > 1) return null
  const i = unknown[0], total = input.constraints[i].value
  if (system.components[i].role !== 'ordinary' || !(total > 0) || system.products.some(p => p.coefficients[i] < 0)) return null
  const logs = input.constraints.map(c => c.kh === 2 ? c.value : 0)
  const fixed = p => p.logBeta + sum(p.coefficients.map((v, k) => k === i ? 0 : v * logs[k]))
  if (activeRows.length) {
    const p = system.products[activeRows[0]], n = p.coefficients[i]
    if (!(n > 0)) return null
    logs[i] = -fixed(p) / n
  } else {
    const rows = system.aqueousRows.filter(j => system.products[j].coefficients[i] > 0)
    const share = Math.log10(total) - Math.log10(rows.length + 1)
    logs[i] = Math.min(share, ...rows.map(j => { const p = system.products[j], n = p.coefficients[i]; return (share - Math.log10(n) - fixed(p)) / n }))
  }
  return logs.every(Number.isFinite) ? logs : null
}

// Coordinate mass balances provide a bounded starting guess for strongly complexed
// positive inventories. This is only initialization; all Newton and science gates remain.
function positiveTotalsSeed(system, input) {
  const unknown = input.constraints.flatMap((c,i)=>c.kh===1?[i]:[])
  if(unknown.length<2||unknown.some(i=>system.components[i].role!=='ordinary'||!(input.constraints[i].value>0)||system.aqueousRows.some(j=>system.products[j].coefficients[i]<0)))return null
  const logs=input.constraints.map(c=>c.kh===2?c.value:Math.log10(c.value))
  for(let sweep=0;sweep<16;sweep++)for(const i of unknown){
    const target=Math.log10(input.constraints[i].value)
    const rows=system.aqueousRows.filter(j=>system.products[j].coefficients[i]>0)
    const terms=rows.map(j=>{const p=system.products[j];return {n:p.coefficients[i],fixed:p.logBeta+sum(p.coefficients.map((v,k)=>k===i?0:v*logs[k]))+Math.log10(p.coefficients[i])}})
    const inventory=x=>{const values=[...(!system.components[i].suppressed?[x]:[]),...terms.map(t=>t.fixed+t.n*x)],m=Math.max(...values);return m+Math.log10(sum(values.map(v=>10**(v-m))))}
    let high=target,low=high-32
    while(inventory(low)>target&&low> -300)low-=32
    if(inventory(low)>target)return null
    for(let step=0;step<64;step++){const mid=(low+high)/2;if(inventory(mid)>target)high=mid;else low=mid}
    logs[i]=(low+high)/2
  }
  return logs.every(Number.isFinite)?logs:null
}

function acceptedScience(system, input, solution) {
  const s = solution.state, errors = []
  const minimumTotal = Math.min(1e-6, ...input.constraints.filter(c => c.kh === 1 && c.value !== 0).map(c => Math.abs(c.value)))
  const balanceLimits = input.constraints.map(c => c.kh === 1 ? componentBalanceTolerance(c.value, minimumTotal) : null)
  input.constraints.forEach((c, i) => {
    if (c.kh === 1 && Math.abs(s.balance[i]) > balanceLimits[i]) errors.push(diagnostic('balance-residual', `Component ${system.components[i].name} exceeds scientific balance tolerance.`))
    if (c.kh === 2 && s.logA[i] !== c.value) errors.push(diagnostic('fixed-activity-residual', 'An imposed activity changed.'))
  })
  const massAction = system.products.map((p, j) => p.phase === 'aqueous' ? (s.trace[j] ? s.productLog[j] - (p.logBeta + sum(p.coefficients.map((n, i) => n * s.logA[i]))) : Math.log10(s.productC[j]) - s.productLog[j]) : null)
  if (system.aqueousRows.some(j => s.trace[j] && power(s.productLog[j]) !== s.productC[j])) errors.push(diagnostic('trace-materialization-mismatch', 'Rounded linear trace does not match its retained log concentration.'))
  if (massAction.some(r => r !== null && Math.abs(r) > contract.massActionLogResidualTolerance)) errors.push(diagnostic('mass-action-residual', 'A product exceeds the log mass-action residual tolerance.'))
  for (const j of system.solidRows) {
    if (s.productC[j] < 0) errors.push(diagnostic('negative-solid-amount', 'The present-solid solution has a negative amount; it is not physically admissible.'))
    if (solution.activeRows.includes(j) ? Math.abs(s.productLog[j]) > saturationTolerance : s.productLog[j] > saturationTolerance) errors.push(diagnostic('solid-saturation', 'The assemblage violates pure-solid saturation/complementarity.'))
  }
  return { errors, massAction, balanceLimits }
}

export function solvePoint(system, input, options = {}) {
  const activePolicy = options.phaseSelection === closedSolidActivePolicy
  const method = activePolicy ? { name: closedSolidActivePolicy, version: '1.0.0' } : methodForSystem(system)
  let selection = null
  const phaseHistory = []
  const failure = (code, message, attempts = []) => freeze({ ok: false, status: 'failed', diagnostics: [diagnostic(code, message)], attempts,
    ...(selection ? { assemblageSelection: selection } : {}), ...(activePolicy ? {phaseSelection:{policy:closedSolidActivePolicy,limit:24,history:phaseHistory}} : {}), method, systemId: system?.id ?? null, inputId: input?.id ?? null, revision: input?.revision ?? null, result: null })
  if (!isPrepared(system) || !isPointInput(input) || input.systemId !== system.id) return failure('invalid-prepared-input', 'Inputs must be created by the preparation/input boundary and belong to the same system.')
  for (let i = 0; i < system.components.length; i++) {
    if (input.constraints[i].kh === 1 && input.constraints[i].value <= 0 && !system.components[i].suppressed && system.products.every(p => p.coefficients[i] >= 0)) return failure('inconsistent-or-boundary-total', 'A nonpositive total with only nonnegative contributions has no finite positive free-activity solution. Exact zero-activity boundary reduction is unsupported.')
  }
  const maxIterations = options.maxIterations ?? 120
  if (!Number.isInteger(maxIterations) || maxIterations < 0 || maxIterations > 500) return failure('invalid-options', 'Iteration limit must be an integer from 0 to 500.')
  const initialLogActivities = options.initialLogActivities
  if (initialLogActivities !== undefined && (!Array.isArray(initialLogActivities) || initialLogActivities.length !== system.components.length || initialLogActivities.some((n, i) => !Number.isFinite(n) || (input.constraints[i].kh === 2 && n !== input.constraints[i].value)))) return failure('invalid-options', 'Initial log activities must be finite, cover the basis and preserve every fixed activity.')
  if (system.solidPolicy === sourceSolidPolicy && !activePolicy) return failure('active-policy-required', 'This source scope requires active-set iteration; exhaustive enumeration is forbidden.')
  const multiple = [multiSolidPolicy,sourceSolidPolicy].includes(system.solidPolicy) && system.solidRows.length > 1
  const search = multiple ? (activePolicy ? {ok:true, maximumActive:phaseRank(system.solidRows.map(j=>input.constraints.flatMap((c,i)=>c.kh===1?[system.products[j].coefficients[i]]:[])))} : enumerateAssemblages(system, input)) : null
  if (options.phaseSelection !== undefined && !activePolicy) return failure('invalid-options', 'Unknown phase selection policy.')
  if (activePolicy && ![multiSolidPolicy,sourceSolidPolicy].includes(system.solidPolicy)) return failure('invalid-options', 'Closed phase selection requires the explicit bounded pure-solid system.')
  const visited = new Set()
  let nextActive = [], phaseSeed = initialLogActivities
  function* activeCandidates() {
    for (let step=0; step<24 && nextActive; step++) {
      const rows=nextActive, key=rows.map(j=>system.products[j].id).sort().join('|')
      if (visited.has(key)) { phaseHistory.push({failure:'active-set-cycle',activeIds:key}); return }
      visited.add(key); nextActive=null
      yield {rows,independent:phaseRank(rows.map(j=>input.constraints.flatMap((c,i)=>c.kh===1?[system.products[j].coefficients[i]]:[])))===rows.length}
    }
  }
  if (search) selection = { policy: activePolicy ? closedSolidActivePolicy : multiSolidPolicy, candidateSolidIds: system.solidRows.map(j => system.products[j].id), maximumActive: search.maximumActive, subsetLimit: 1024 }
  if (search && !search.ok) return failure(search.code, 'Candidate subset budget exceeded; no truncated search result is accepted.')
  const attempts = [], valid = []
  let aqueousSeed = null
  for (const candidate of (activePolicy ? activeCandidates() : search?.subsets) ?? (system.solidRows.length ? [false, true] : [false]).map(active => ({ rows: active ? [system.solidRows[0]] : [], independent: true }))) {
    const active = candidate.rows.length > 0, activeIds = candidate.rows.map(j => system.products[j].id)
    if (!candidate.independent) { attempts.push({ active, activeIds, code: 'dependent-active-solids', message: 'Active saturation/amount constraints are rank deficient on total-constrained components.' }); continue }
    let solution = solveAssemblage(system, input, candidate.rows, { maxIterations, initialLogActivities: activePolicy ? phaseSeed : initialLogActivities })
    let initializationRetry = null
    if (!solution.ok && maxIterations > 0 && ['singular-or-ill-conditioned', 'numerical-nonconvergence', 'overflow', 'underflow'].includes(solution.code)) {
      const singleSeed = singleTotalSeed(system, input, candidate.rows)
      const initialLogActivities = candidate.rows.length && aqueousSeed ? aqueousSeed : singleSeed ?? positiveTotalsSeed(system,input)
      if (initialLogActivities) {
        initializationRetry = { policy: candidate.rows.length && aqueousSeed ? 'converged-aqueous-assemblage-seed-v1' : singleSeed ? 'single-positive-total-mass-action-seed-v1' : 'positive-totals-coordinate-seed-v1', originalFailure: solution, initialLogActivities }
        const retry = solveAssemblage(system, input, candidate.rows, { maxIterations, initialLogActivities })
        if (retry.ok) solution = retry
        else initializationRetry.retryFailure = retry // Preserve the original typed failure when recovery also fails.
      }
    }
    if (!solution.ok) { attempts.push({ active, activeIds, ...solution, ...(initializationRetry ? { initializationRetry } : {}) }); continue }
    if (!candidate.rows.length) aqueousSeed = [...solution.state.logA]
    const check = acceptedScience(system, input, solution)
    if (activePolicy) {
      phaseSeed=solution.state.logA
      const negative=candidate.rows.filter(j=>solution.state.productC[j]<0).sort((a,b)=>solution.state.productC[a]-solution.state.productC[b]||system.products[a].id.localeCompare(system.products[b].id))[0]
      const violated=system.solidRows.filter(j=>!candidate.rows.includes(j)&&solution.state.productLog[j]>saturationTolerance).sort((a,b)=>solution.state.productLog[b]-solution.state.productLog[a]||system.products[a].id.localeCompare(system.products[b].id))[0]
      if(negative!==undefined)nextActive=candidate.rows.filter(j=>j!==negative)
      else if(violated!==undefined)nextActive=[...candidate.rows,violated]
      phaseHistory.push({activeIds, action:negative!==undefined?'remove-negative':violated!==undefined?'admit-supersaturated':'check-complete', changedId:system.products[negative??violated]?.id??null})
    }
    if (!check.errors.length) valid.push({ solution, check })
    attempts.push({ active, activeIds, ...(initializationRetry ? { initializationRetry } : {}), iteration: solution.iteration, accepted: !check.errors.length, diagnostics: check.errors, ...(multiple ? { solids: system.solidRows.map(j => ({ id: system.products[j].id, amount: solution.state.productC[j], logSaturation: solution.state.productLog[j], active: candidate.rows.includes(j) })), componentBalance: solution.state.balance, componentBalanceLimits: check.balanceLimits } : {}) })
    // Strictly undersaturated absent state is decisive. At equality test the present state for ambiguity.
    if (!multiple && !active && (!system.solidRows.length || solution.state.productLog[system.solidRows[0]] < -saturationTolerance)) break
  }
  if (!valid.length) {
    const reason = activePolicy ? (phaseHistory.at(-1)?.failure??'solid-phase-closure-failed') : system.solidRows.length ? 'no-consistent-solid-assemblage' : attempts[0]?.code ?? 'scientific-validation-failed'
    return failure(reason, 'No scientifically accepted point state was found. Inspect the per-assemblage diagnostics.', attempts)
  }
  if (valid.length > 1) {
    const a = valid[0].solution.state
    if (valid.slice(1).some(v => { const b = v.solution.state; return system.solidRows.some(j => Math.abs(a.productC[j] - b.productC[j]) > 2e-14 || multiple && (a.productC[j] > 0) !== (b.productC[j] > 0)) || multiple && a.logA.some((x, i) => Math.abs(x - b.logA[i]) > contract.comparisonLogActivityTolerance) })) return failure('ambiguous-solid-assemblage', 'Multiple materially different phase states were accepted.', attempts)
  }
  const { solution, check } = valid[0], s = solution.state
  const usesLogTraces = s.trace.some(Boolean) || system.components.some((c, i) => !c.suppressed && s.free[i] < minimumNormal)
  const representation = usesLogTraces ? {
    numericalRepresentation: { version: logTracePolicy, linearValues: 'Rounded binary64 approximations; consult status and retained logs before interpreting zero.', massAction: 'Retained log concentration for subnormal/underflow traces; unchanged round-trip check for ordinary values.', inventory: 'Trace weights and normalized derivatives are factored before exponentiation.', unrepresentableWeightedTermUpperBound: Number.MIN_VALUE, unrepresentableInventoryUpperBound: (system.aqueousRows.length+1)*Number.MIN_VALUE, boundScope: 'Unrepresentable weighted terms only; ordinary floating-point arithmetic remains subject to existing acceptance checks.' },
    logConcentrations: [...system.components.map((c, i) => c.suppressed ? null : s.logA[i]), ...system.products.map((p, j) => p.phase === 'aqueous' ? s.productLog[j] : s.productC[j] > 0 ? Math.log10(s.productC[j]) : null)],
    linearConcentrationStatus: [...system.components.map((c, i) => concentrationStatus(s.free[i], !c.suppressed)), ...system.products.map((p, j) => concentrationStatus(s.productC[j], p.phase === 'aqueous' || s.productC[j] > 0))],
    dissolvedComponentLogAmounts: system.components.map((c, i) => c.role === 'water' || system.aqueousRows.some(j => system.products[j].coefficients[i] < 0) ? null : positiveLogSum([...(c.suppressed ? [] : [s.logA[i]]), ...system.aqueousRows.flatMap(j => system.products[j].coefficients[i] > 0 ? [s.productLog[j] + Math.log10(system.products[j].coefficients[i])] : [])])),
  } : {}
  // Exactly saturated fixed reservoirs cannot determine a finite solid inventory.
  if ((!solution.active || multiple) && system.solidRows.some(j => Math.abs(s.productLog[j]) <= saturationTolerance && !input.constraints.some((c, i) => c.kh === 1 && system.products[j].coefficients[i] !== 0))) return failure('underdetermined-solid-inventory', 'Fixed activities impose saturation but do not determine solid amount.', attempts)
  const result = freeze({ ok: true, status: 'converged', scientificValidation: 'passed', method,
    ...representation,
    ...(activePolicy ? {phaseSelection:{policy:closedSolidActivePolicy,limit:24,history:phaseHistory}} : {}),
    ...(multiple ? { assemblageSelection: { policy: activePolicy ? closedSolidActivePolicy : multiSolidPolicy, maximumActive: search.maximumActive, candidateSolidIds: system.solidRows.map(j => system.products[j].id), activeSolidIds: solution.activeRows.filter(j => s.productC[j] > 0).map(j => system.products[j].id), attempted: attempts.length, saturationTolerance, amountNegativityTolerance: 0 } } : {}),
    systemId: system.id, inputId: input.id, revision: input.revision, sourceIdentity: system.sourceIdentity,
    componentIds: system.components.map(c => c.id), speciesIds: system.speciesIds,
    componentNames: system.components.map(c => c.name), speciesNames: [...system.components, ...system.products].map(c => c.name),
    freeComponentConcentrations: s.free,
    freeComponentActivities: s.logA.map(value => { const activity = 10 ** value; return Number.isFinite(activity) && activity > 0 ? activity : null }),
    concentrations: [...s.free, ...s.productC],
    logActivities: [...s.logA, ...s.productLog], componentTotals: s.totals, dissolvedComponentAmounts: s.dissolved,
    logActivityCoefficients: [...s.free, ...s.productC].map(() => 0),
    solids: system.solidRows.map(j => ({ id: system.products[j].id, name: system.products[j].name, amount: s.productC[j],
      logSaturation: s.productLog[j], status: solution.activeRows.includes(j) && s.productC[j] > 0 ? 'present' : Math.abs(s.productLog[j]) <= saturationTolerance ? 'saturated-zero-amount' : 'absent',
      activity: solution.active && s.productC[j] > 0 ? 1 : null })),
    residuals: { componentBalance: s.balance, componentBalanceLimits: check.balanceLimits, massActionLog: check.massAction, scaledBalance: s.balance.map((r, i) => r === null ? null : r / s.scale[i]) },
    iterations: solution.iteration, diagnostics: [], attempts, minimumPivotRatio: solution.minPivotRatio,
    iterationTolerance, saturationTolerance, temperatureC: 25, pressureBar: 1, unit: 'mol/kg-H2O', activityModel: 'ideal',
    ionicStrength: null, electricBalance: null, waterOsmoticCoefficient: null,
    warnings: [...system.warnings, 'Ideal activities only; ionic strength and electroneutrality are not calculated or imposed.', 'Absent-solid log activity is a hypothetical formation/saturation quantity, not an assigned phase activity.'] })
  successfulResults.add(result)
  return result
}

/** Inspect the existing first Newton linearization without taking a step. */
export function inspectPointInitialization(system,input,initialLogActivities){
 if(!isPrepared(system)||!isPointInput(input)||system.id!==input.systemId)return {ok:false,code:'invalid-prepared-input'}
 const r=solveAssemblage(system,input,[],{maxIterations:0,initialLogActivities})
 return {ok:r.ok||r.code==='numerical-nonconvergence',code:r.code??'initial-root',pivotRatio:r.minPivotRatio??null}
}
