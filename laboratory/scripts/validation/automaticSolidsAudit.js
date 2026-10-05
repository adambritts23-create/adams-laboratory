import { createWorkspaceSession } from '../../src/session/laboratorySession.js'
import { createCalculationDefinition } from '../../src/calculations/definition.js'
import { reconcileAutomaticSpecies, discoverReactionSet } from '../../src/thermodynamics/compatibility.js'
import { mixedCarbonateSolubilityExample } from '../../src/data/solubilityExample.js'
import { prepareSessionPoint } from '../../src/solver/prepareSession.js'
import { createSweepDefinition, runSweep } from '../../src/calculations/sweep.js'
import { selectedEquilibrium } from '../../src/plots/resultSelection.js'

export function automaticAuditSession(repository, names, totals = names.map(() => 0.1), points = 29) {
 const session = createWorkspaceSession(repository)
 const components = [...names, 'H+', 'H2O'].map(name => repository.getComponents().find(c => c.name === name))
 if (components.some(c => !c)) throw Error('Control component unavailable')
 session.chemicalSystem = reconcileAutomaticSpecies({ ...session.chemicalSystem,
  selectedElements: [...new Set(components.flatMap(c => c.associations.map(a => a.element)))],
  selectedComponents: components.map(c => c.id), enabledPhases: ['aqueous', 'solid', 'liquid'] }, repository)
 const d = createCalculationDefinition(session.chemicalSystem, repository), proton = components.find(c => c.role === 'proton')
 d.componentConditions = d.componentConditions.filter(c => c.componentId !== proton.id).map(c => {
  const i = components.findIndex(k => k.id === c.componentId)
  return i < names.length ? { ...c, value: totals[i] } : c
 })
 d.independentVariables = [{ componentId: proton.id, mode: 'LAV', quantity: 'pH', unit: 'dimensionless', range: { min: 0, max: 14 }, points }]
 d.dimensions = 1
 session.calculationDefinition = d
 return session
}
export async function runAutomaticControl(repository, label, session) {
 const start = performance.now(), discovery = discoverReactionSet(repository, session.chemicalSystem)
 const discoveryMs = performance.now() - start
 const prepared = await prepareSessionPoint(session, repository, { sweep: true })
 if (!prepared.ok) throw Error(label + ': ' + JSON.stringify(prepared.diagnostics))
 const definition = await createSweepDefinition(prepared.system, session.calculationDefinition, session.revision)
 if (!definition.ok) throw Error(JSON.stringify(definition))
 const solveStart = performance.now(), sweep = await runSweep(prepared.system, definition.sweep)
 session.lastPlot = { system: prepared.system, sweep }
 return { label, session, system: prepared.system, sweep, discoveryMs, solveMs: performance.now() - solveStart,
  candidates: discovery.rows.filter(r => r.compatible && r.supported && r.species.phase === 'solid').map(r => ({ id: r.species.id, name: r.species.name, included: r.included, excluded: r.excluded })) }
}
export async function auditAutomaticSolids(repository) {
 const cases = []
 for (const [label, session] of [
  ['Ca water', automaticAuditSession(repository, ['Ca 2+'])],
  ['FeIII water', automaticAuditSession(repository, ['Fe 3+'], [0.1], 51)],
  ['Ca carbonate', automaticAuditSession(repository, ['Ca 2+', 'CO3 2-'])],
  ['Mixed validated', mixedCarbonateSolubilityExample(repository)],
  ['Water negative', automaticAuditSession(repository, [])],
 ]) cases.push(await runAutomaticControl(repository, label, session))
 return cases
}
export function automaticEvidence(cases) {
 return cases.map(c => ({ label: c.label, candidates: c.candidates, counts: c.sweep.counts,
  discoveryMs: c.discoveryMs, solveMs: c.solveMs,
  samples: c.sweep.outcomes.map((outcome, index) => {
   const state = selectedEquilibrium(c.session, index)
   return { index, pH: outcome.coordinate, status: outcome.status, inputId: outcome.input?.id,
    solids: outcome.result?.solids, dissolved: state.components?.map(x => ({ name: x.name, amount: x.totalDissolved })),
    beakerSolids: state.solids, beakerMessage: state.phaseMessage, sameResult: state.result === outcome.result,
    diagnostics: outcome.diagnostics }
  }) }))
}
