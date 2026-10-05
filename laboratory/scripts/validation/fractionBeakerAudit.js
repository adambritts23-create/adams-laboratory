import { createWorkspaceSession } from '../../src/session/laboratorySession.js'
import { createCalculationDefinition } from '../../src/calculations/definition.js'
import { reconcileAutomaticSpecies, repositoryReactionCatalog } from '../../src/thermodynamics/compatibility.js'
import { mixedCarbonateSolubilityExample } from '../../src/data/solubilityExample.js'
import { prepareSessionPoint } from '../../src/solver/prepareSession.js'
import { createSweepDefinition, runSweep } from '../../src/calculations/sweep.js'
import { deriveOutputs } from '../../src/calculations/outputs.js'
import { selectedEquilibrium } from '../../src/plots/resultSelection.js'

// Reproduce the reported inputs with explicit phase selection. Constants come only from the repository.
export function carbonateAuditSession(repository, withCalcite = false) {
  const names = ['Ca 2+', 'CO3 2-', 'H+', 'H2O']
  const components = names.map(name => repository.getComponents().find(c => c.name === name))
  const calcite = repositoryReactionCatalog(repository).find(s => s.name === 'CaCO3(cr)' && s.phase === 'solid')
  const session = createWorkspaceSession(repository, { solidPhasePolicy: 'explicit' })
  session.chemicalSystem = reconcileAutomaticSpecies({ ...session.chemicalSystem,
    selectedElements: ['Ca', 'C'], selectedComponents: components.map(c => c.id), enabledPhases: ['aqueous', 'solid', 'liquid'],
    optionalSpecies: withCalcite ? [calcite.id] : [], excludedSpecies: [],
  }, repository)
  const d = createCalculationDefinition(session.chemicalSystem, repository)
  d.componentConditions = d.componentConditions.filter(c => c.componentId !== components[2].id)
    .map(c => components.slice(0, 2).some(k => k.id === c.componentId) ? { ...c, value: 0.1 } : c)
  d.independentVariables = [{ componentId: components[2].id, mode: 'LAV', quantity: 'pH', unit: 'dimensionless', range: { min: 0, max: 14 }, points: 29 }]
  d.dimensions = 1
  session.calculationDefinition = d
  return session
}

export async function auditFractionBeaker(repository) {
  const cases = []
  for (const [label, session] of [
    ['Ca/carbonate without selected solids', carbonateAuditSession(repository)],
    ['Ca/carbonate with calcite selected', carbonateAuditSession(repository, true)],
    ['Validated mixed-solid example', mixedCarbonateSolubilityExample(repository)],
  ]) {
    const prepared = await prepareSessionPoint(session, repository, { sweep: true })
    if (!prepared.ok) throw new Error(JSON.stringify(prepared.diagnostics))
    const system = prepared.system
    const definition = await createSweepDefinition(system, session.calculationDefinition, session.revision)
    const sweep = await runSweep(system, definition.sweep)
    session.lastPlot = { system, sweep }
    const componentId = system.components.find(c => c.name === 'Ca 2+').id
    const fractions = deriveOutputs(system, sweep, { type: 'aqueous-fraction', componentId })
    cases.push({ label, session, system, sweep, fractions, componentId })
  }
  return cases
}

export function fractionBeakerEvidence(cases) {
  return cases.map(({ label, session, system, sweep, fractions }) => ({
    label, counts: sweep.counts,
    selectedProducts: system.products.map(p => ({ id: p.id, name: p.name, phase: p.phase, source: p.sourceRecord })),
    samples: [0, 14, 21, 24, 28].map(index => {
      const outcome = sweep.outcomes[index], state = selectedEquilibrium(session, index)
      const curve = fractions.series.find(s => s.name === 'CaCO3'), point = curve?.points[index]
      return { index, pH: outcome.coordinate, status: outcome.status, acceptance: outcome.scientificAcceptance,
        inputId: outcome.input?.id, analyticalTotals: outcome.input?.constraints.filter(c => c.kh === 1),
        plottedCurve: curve ? { id: curve.id, name: curve.name, phase: curve.phase, quantity: fractions.metadata.output.formula, value: point.value, fractionTrace: point.fractionTrace } : null,
        activeSolids: outcome.result?.solids.filter(s => s.amount > 0), solidDiagnostics: outcome.result?.solids,
        dissolvedTotals: system.components.map((c, i) => ({ id: c.id, name: c.name, value: outcome.result?.dissolvedComponentAmounts[i] })),
        beakerSolids: state.solids, sameInput: state.input === outcome.input, sameResult: state.result === outcome.result,
        fractionSum: fractions.series.reduce((n, s) => n + (s.points[index].value ?? 0), 0),
      }
    }),
  }))
}
