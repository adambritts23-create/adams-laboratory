import {precipitateVisual} from './visual.js'
export {precipitateVisual} from './visual.js'
import { mixedCarbonateSolubilityExample } from '../data/solubilityExample.js'
import { prepareSessionPoint } from '../solver/prepareSession.js'
import { isSuccessfulPointResult } from '../solver/point.js'
import { freeze, isPrepared } from '../solver/models.js'
import { createSweepDefinition, runSweep, isSweepResult } from '../calculations/sweep.js'
import { deriveOutputs, isDerivedResult } from '../calculations/outputs.js'

const unavailable = (reason, message) => ({ ok: false, reason, message, visual: null })

/** One immutable equilibrium sweep, shared by the beaker and existing solubility output.
 * No laboratory inventory/volume model: the input remains analytical molalities.
 */
export async function calculateBeakerExample(repository, control = {}) {
  try { return await calculateBeakerSession(mixedCarbonateSolubilityExample(repository), repository, control) }
  catch (error) { return unavailable('unsupported-beaker-example', error.message) }
}

/** Compatibility check only. A reference definition never replaces current chemistry. */
export function beakerSupport(session, repository) {
  try {
    const reference = mixedCarbonateSolubilityExample(repository), actual = session.chemicalSystem, expected = reference.chemicalSystem
    const sameIds = (a,b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
    if (!sameIds(actual.selectedComponents,expected.selectedComponents) || !sameIds(actual.selectedSpecies,expected.selectedSpecies)) return unavailable('unsupported-current-beaker-system', 'This system is not yet available in Interactive Beaker.')
    const d = session.calculationDefinition, r = reference.calculationDefinition
    const conditions = a => [...a].sort((x,y)=>x.componentId.localeCompare(y.componentId))
    if (JSON.stringify(conditions(d.componentConditions)) !== JSON.stringify(conditions(r.componentConditions)) || JSON.stringify(d.independentVariables) !== JSON.stringify(r.independentVariables)
      || ['temperature','pressure','activityModel','ionicStrength'].some(k=>JSON.stringify(d[k])!==JSON.stringify(r[k])) || !d.mixedSolubility || d.solubilityComparison || d.gridMultiSolid
      || !sameIds(d.mixedSolubility.componentIds,r.mixedSolubility.componentIds) || !sameIds(d.enabledPhases,r.enabledPhases)) return unavailable('unsupported-current-beaker-configuration', 'This equilibrium configuration is not yet available in Interactive Beaker. The MVP supports the validated fixed totals, conditions and 29-point pH sweep only.')
    return {ok:true}
  } catch { return unavailable('unsupported-current-beaker-system', 'This system is not yet available in Interactive Beaker.') }
}

export async function calculateCurrentBeaker(session, repository, control = {}) {
  const support = beakerSupport(session,repository)
  return support.ok ? calculateBeakerSession(session,repository,control) : support
}

async function calculateBeakerSession(session, repository, control = {}) {
  try {
    const prepared = await prepareSessionPoint(session, repository, { sweep: true })
    if (!prepared.ok) return { ...unavailable('beaker-preparation-failed', 'The validated example could not be prepared.'), diagnostics: prepared.diagnostics }
    const definition = await createSweepDefinition(prepared.system, session.calculationDefinition, session.revision)
    if (!definition.ok) return { ...unavailable('beaker-definition-failed', 'The pH sweep is unsupported.'), diagnostics: definition.diagnostics }
    const sweep = await runSweep(prepared.system, definition.sweep, { chunkSize: 1, ...control })
    const derived = deriveOutputs(prepared.system, sweep, { type: 'saturated-log-solubility', ...session.calculationDefinition.mixedSolubility })
    if (!derived.ok) return { ...unavailable('beaker-output-failed', 'No current shared equilibrium output is available.'), diagnostics: derived.diagnostics }
    return freeze({ ok: true, system: prepared.system, sweep, derived, revision: session.revision })
  } catch (error) { return unavailable('unsupported-beaker-example', error.message) }
}

/** View-only schematic mapping: no density, phase volume, kinetics or spatial layers. */

/** A current exact sample only. Never turn an unsuccessful or mismatched object into chemistry. */
export function beakerState(snapshot, requestedPH, currentRevision = snapshot?.revision) {
  if (!snapshot?.ok) return unavailable(snapshot?.reason ?? 'beaker-loading', snapshot?.message ?? 'Calculating the validated pH samples…')
  const { system, sweep, derived } = snapshot
  if (!isPrepared(system) || !isSweepResult(sweep) || !isDerivedResult(derived)) return unavailable('unaccepted-beaker-data', 'A normal calculated equilibrium sweep is required.')
  if (sweep.revision !== currentRevision || derived.metadata.revision !== currentRevision || sweep.status === 'invalidated-stale') return unavailable('stale-beaker-state', 'The retained calculation is old. No current beaker state is shown.')
  if (sweep.systemId !== system.id || derived.metadata.sweepId !== sweep.sweepId) return unavailable('mismatched-beaker-state', 'The plot and beaker calculation identities do not match.')
  if (requestedPH === '' || !Number.isFinite(Number(requestedPH))) return unavailable('invalid-beaker-pH', 'Enter pH from 0 to 14 in steps of 0.5.')
  const pH = Number(requestedPH), index = sweep.coordinates.indexOf(pH)
  if (index < 0) return unavailable('unsampled-beaker-pH', 'This MVP uses exact calculated pH samples from 0 to 14 in steps of 0.5. Enter one of these values; no intermediate equilibrium is inferred.')
  const outcome = sweep.outcomes[index], result = outcome.result
  if (outcome.status !== 'converged' || outcome.scientificAcceptance !== 'passed' || !isSuccessfulPointResult(result)) return { ...unavailable('unavailable-beaker-equilibrium', 'Equilibrium is unavailable at this sample. No liquid or precipitate state is inferred.'), pH, index, diagnostics: outcome.diagnostics }
  if (result.inputId !== outcome.input?.id || result.systemId !== system.id || result.revision !== currentRevision) return unavailable('mismatched-beaker-point', 'The accepted point does not match the requested calculation.')
  const components = derived.series.map(series => {
    const point = series.points[index], trace = point.trace
    return { id: series.id, name: trace.component, totalDissolved: trace.weightedDissolvedTotal,
      contributors: trace.contributors, dominant: [...trace.contributors].sort((a, b) => b.weightedMolality - a.weightedMolality)[0],
      solubility: point.value, solubilityReason: point.reason, trace }
  })
  if (components.some(c => c.trace.inputId !== result.inputId || !Number.isFinite(c.totalDissolved))) return unavailable('mismatched-beaker-output', 'The dissolved totals do not belong to this equilibrium point.')
  const solids = result.solids.filter(s => s.amount > 0)
  const category = solids.length === 0 ? 'aqueous' : solids.length === 1 ? 'one-solid' : 'multiple-solids'
  const explanation = category === 'aqueous' ? 'No candidate solid is currently stable in a positive amount.' : category === 'one-solid' ? 'A solid phase is now part of the accepted equilibrium assemblage.' : 'More than one solid phase is required to satisfy the equilibrium conditions.'
  return { ok: true, pH, index, category, explanation, components, solids, allSolids: result.solids,
    visual: precipitateVisual(solids), marker: { index, pH, inputId: result.inputId, values: components.map(c => c.solubility) },
    input: outcome.input, result, systemId: system.id, revision: currentRevision }
}
