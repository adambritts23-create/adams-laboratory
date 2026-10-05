import { freeze, identity, isPrepared, createPointInput, diagnostic } from '../solver/models.js'
import { solvePoint, methodForSystem } from '../solver/point.js'
import { validateCalculationDefinition, toSourceInput } from './definition.js'

const definitions = new WeakSet(), results = new WeakSet()
export const isGridResult = value => results.has(value)
const reject = message => freeze({ ok: false, status: 'definition-preparation-failure', diagnostics: [diagnostic('invalid-grid-definition', message)] })
export async function createGridDefinition(system, definition, revision) {
  if (!isPrepared(system)) return reject('A branded prepared system is required.')
  const d = structuredClone(definition)
  const chemical = { selectedComponents: system.components.map(c => c.id), selectedSpecies: system.products.map(p => p.id), enabledPhases: ['aqueous','solid','gas','liquid'] }
  const repository = { getComponentById: id => { const c = system.components.find(c => c.id === id); return c && { ...c, role: c.role === 'water' ? 'solvent' : c.role === 'ordinary' ? 'basis-choice' : c.role } } }
  let errors
  try { errors = validateCalculationDefinition(d, chemical, repository, { allowDescending: true }) } catch { return reject('Malformed grid definition.') }
  if (errors.length) return reject(errors.join(' '))
  if (d.independentVariables.length !== 2 || !Number.isInteger(revision) || revision < 0) return reject('Exactly two distinct varied components and a nonnegative revision are required.')
  if (d.activityModel !== 'ideal' || d.temperature.value !== 25 || d.pressure.value !== 1 || d.ionicStrength.unit !== 'mol/kg-H2O' || (d.ionicStrength.mode === 'fixed' && d.ionicStrength.value !== 0)) return reject('Only ideal 25 C, declared 1 bar, mol/kg-H2O and automatic or fixed-zero ionic strength are supported.')
  if (system.products.some(p => !d.enabledPhases.includes(p.phase))) return reject('A prepared product phase is disabled.')
  if ([...d.componentConditions,...d.independentVariables].some(c => ['T','TV','LTV'].includes(c.mode) && c.unit !== 'mol/kg-H2O')) return reject('Molarity cannot be used as molality.')
  const axes = d.independentVariables.map(a => ({ ...a, start: a.range.min, end: a.range.max }))
  if (axes[0].points * axes[1].points > 10000) return reject('At most 10000 grid points are supported.')
  const coordinates = axes.map(a => Array.from({ length: a.points }, (_, i) => i === 0 ? a.start : i === a.points-1 ? a.end : (1-i/(a.points-1))*a.start+i/(a.points-1)*a.end))
  if (coordinates.flat().some(v => !Number.isFinite(v))) return reject('Nonfinite sampled coordinate.')
  const body = { schemaVersion: 1, kind: 'grid-definition', systemId: system.id, revision, calculationDefinition: d, axes, coordinates, shape: axes.map(a => a.points), order: 'x-fast-row-major', fixedConditions: d.componentConditions, unit: system.unit, sourceIdentity: system.sourceIdentity }
  const grid = freeze({ ...body, id: await identity(body) }); definitions.add(grid)
  return freeze({ ok: true, grid, diagnostics: [] })
}

/** Orchestration only: each coordinate calls the unchanged validated point solver. */
export async function runGrid(system, grid, { signal, isCurrent = () => true, chunkSize = 20, projectOutcome = null, onProgress = null } = {}) {
  if (!isPrepared(system) || !definitions.has(grid) || grid.systemId !== system.id) return reject('Grid/prepared system identities do not match.')
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 100) return reject('Chunk size must be 1–100.')
  const started = performance.now(), outcomes = []
  let solvingMs = 0, inputPreparationMs = 0, status = 'completed', lastTaskYield = started
  const counts={requested:grid.shape[0]*grid.shape[1],converged:0,failed:0,notRun:0}
  const retain=outcome=>{counts[outcome.status==='converged'?'converged':outcome.status==='failed'?'failed':'notRun']++;outcomes.push(projectOutcome?projectOutcome(outcome):outcome)}
  for (let iy = 0; iy < grid.shape[1]; iy++) for (let ix = 0; ix < grid.shape[0]; ix++) {
    const index = iy * grid.shape[0] + ix, x = grid.coordinates[0][ix], y = grid.coordinates[1][iy]
    const base = { index, ix, iy, x, y, coordinate: x, pointId: `${grid.id}:${index}` }
    if (!isCurrent()) status = 'invalidated-stale'
    else if (signal?.aborted && status !== 'invalidated-stale') status = 'cancelled'
    if (status !== 'completed') { retain({ ...base, transformed: null, input: null, result: null, status: 'not-run', scientificAcceptance: 'not-evaluated', diagnostics: [diagnostic(status, 'Requested coordinate was not calculated.')] }); continue }
    let transformed, input, result
    const inputStart = performance.now()
    try {
      transformed = grid.axes.map((a,i) => toSourceInput(a, i === 0 ? x : y, 25))
      const constraints = [...grid.fixedConditions.map(c => ({ componentId: c.componentId, ...toSourceInput(c,c.value,25) })), ...grid.axes.map((a,i) => ({ componentId:a.componentId,...transformed[i] }))]
      input = await createPointInput(system,{ constraints, revision:grid.revision,unit:system.unit,temperatureC:25,pressureBar:1,activityModel:'ideal' })
    } catch(error) { input = { ok:false,diagnostics:[diagnostic('coordinate-transformation-failure',error.message)] } }
    inputPreparationMs += performance.now()-inputStart
    if (input.ok) { const t = performance.now(); result = solvePoint(system,input.input); solvingMs += performance.now()-t } else result = input
    retain({ ...base, transformed:transformed??null,input:input.input??null,result,status:result.ok?'converged':'failed',scientificAcceptance:result.ok?'passed':'not-accepted',diagnostics:result.diagnostics })
    if ((index+1)%chunkSize===0) { onProgress?.({...counts,completed:index+1}); // Periodically allow ordinary UI tasks as well as prioritized continuations.
      if(projectOutcome&&globalThis.scheduler?.yield&&performance.now()-lastTaskYield<75)await globalThis.scheduler.yield();else { await new Promise(resolve=>setTimeout(resolve,0));lastTaskYield=performance.now() } }
  }
  if (!isCurrent()) status='invalidated-stale'
  else if (signal?.aborted && status==='completed') status='cancelled'
  if(status==='completed'&&counts.failed) status='completed-with-failed-points'
  const result=freeze({schemaVersion:1,kind:projectOutcome?'projected-grid':'grid',gridId:grid.id,systemId:system.id,revision:grid.revision,definition:grid,coordinates:grid.coordinates,shape:grid.shape,order:grid.order,outcomes,status,counts,sourceIdentity:system.sourceIdentity,unit:system.unit,method:methodForSystem(system),timing:{nonScientific:true,solvingMs,inputPreparationMs,elapsedMs:performance.now()-started},warnings:[...system.warnings,'Independent sampled grid; no interpolated chemistry or validated Pourbaix classification.']})
  if(!projectOutcome)results.add(result); return result
}
