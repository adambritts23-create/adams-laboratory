import { diagramUnavailable, selectDiagram } from '../calculations/diagramSetup.js'
import { validateOutputRequest } from '../calculations/outputDescriptors.js'
import { isSweepResult } from '../calculations/sweep.js'
import { isPrepared } from '../solver/models.js'

// Navigation decisions only. Output eligibility stays in the scientific validators.
export function diagramTransition(session, id, components, reactionSet = {}) {
  const d = session.calculationDefinition, plot = session.visualizationState.plot ?? {}
  const reason = diagramUnavailable(id, d, components, reactionSet.solidCount ?? 0, reactionSet.automaticSolids, reactionSet.pourbaixReason)
  if (reason) return { kind: 'unavailable', message: reason }
  const next = selectDiagram(d, plot, id, components)
  const comparable = value => JSON.stringify({ ...value, dimensions: value.dimensions ?? 1, solubilityComparison: value.solubilityComparison ?? null })
  const definitionChanged = comparable(d) !== comparable(next.definition)
  if (definitionChanged) return { ...next, kind: 'setup', definitionChanged, message: 'Requires new calculation. This mode needs different calculation setup. Review the axes and conditions, then choose Plot diagram to calculate.' }
  const snapshot = session.lastPoint ?? session.lastPlot, sweep = snapshot?.sweep
  if (!isPrepared(snapshot?.system) || !isSweepResult(sweep) || sweep.revision !== session.revision || sweep.systemId !== snapshot.system.id || sweep.status === 'invalidated-stale') {
    return { ...next, kind: 'setup', definitionChanged, message: 'Review setup, then choose Plot diagram. No current compatible sweep is available to reuse.' }
  }
  const request = !['total-fraction','aqueous-fraction'].includes(next.plot.type) && d.mixedSolubility
    ? { type: 'saturated-log-solubility', ...d.mixedSolubility }
    : { type: next.plot.type, componentId: next.plot.componentId }
  const check = validateOutputRequest(snapshot.system, request, { definition: (snapshot.imposedEh||snapshot.closedReagents) ? sweep.definition.calculationDefinition : d })
  if (!check.ok) return { ...next, kind: 'setup', definitionChanged, message: `Setup required: ${check.diagnostics.map(x => x.message).join(' ')} No calculation started.` }
  return { ...next, kind: 'reuse', definitionChanged, message: 'Same calculated sweep · view changed without recalculating.' }
}
