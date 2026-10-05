import { createChemicalSystem } from '../chemistry/system.js'
import { createCalculationDefinition } from './definition.js'
import { automaticSpeciesPolicy, reconcileAutomaticSpecies, repositoryReactionCatalog } from '../thermodynamics/compatibility.js'
import { prepareSessionPoint } from '../solver/prepareSession.js'
import { isSuccessfulPointResult } from '../solver/point.js'
import { createSweepDefinition, runSweep } from './sweep.js'
import { deriveOutputs } from './outputs.js'
import { solubilityApplicability } from './solubility.js'

export const solubilityPairs = Object.freeze([
  { id: 'mg-hydroxide', element: 'Mg', component: 'Mg 2+', solid: 'Mg(OH)2(cr)', label: 'Mg · Mg(OH)₂(cr)' },
  { id: 'ca-hydroxide', element: 'Ca', component: 'Ca 2+', solid: 'Ca(OH)2(cr)', label: 'Ca · Ca(OH)₂(cr)' },
])
export const defaultSolubilityComparison = () => ({ min: 10, max: 13.5, points: 71, pairs: solubilityPairs.map(p => ({ id: p.id, total: 0.001 })) })
const results = new WeakSet()
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value) } return value }

/** Separate source bases and point solves, sharing only the requested pH coordinates. */
export async function runIndependentSolubility(repository, definition, revision, control = {}) {
  const config = structuredClone(definition.solubilityComparison)
  if (!config || !Number.isFinite(config.min) || !Number.isFinite(config.max) || config.min >= config.max || !Number.isInteger(config.points) || config.points < 2 || config.points > 1000 || !config.pairs?.length || config.pairs.length > 2 || new Set(config.pairs.map(p => p.id)).size !== config.pairs.length || config.pairs.some(p => !solubilityPairs.some(s => s.id === p.id) || !Number.isFinite(p.total) || p.total <= 0)) throw new Error('Choose one or two independent pairs, positive molal totals, increasing pH bounds and 2–1000 samples.')
  const entries = []
  for (const selected of config.pairs) {
    const pair = solubilityPairs.find(p => p.id === selected.id)
    try {
      const catalog = repository.getComponents()
      const components = [pair.component, 'H+', 'H2O'].map(name => {
        const matches = catalog.filter(c => c.name === name)
        if (matches.length !== 1) throw new Error(`Missing or ambiguous component: ${name}`)
        return matches[0]
      })
      const solids = repositoryReactionCatalog(repository).filter(s => s.name === pair.solid && s.phase === 'solid')
      if (solids.length !== 1) throw new Error(`Missing or ambiguous solid: ${pair.solid}`)
      const chemicalSystem = reconcileAutomaticSpecies({ ...createChemicalSystem(repository), speciesPolicy: automaticSpeciesPolicy,
        selectedElements: [pair.element], selectedComponents: components.map(c => c.id), enabledPhases: ['aqueous', 'solid', 'liquid'], excludedSpecies: [], optionalSpecies: [solids[0].id],
      }, repository)
      const d = createCalculationDefinition(chemicalSystem, repository)
      for (const key of ['temperature', 'pressure', 'activityModel', 'ionicStrength']) d[key] = structuredClone(definition[key])
      d.componentConditions = d.componentConditions.filter(c => c.componentId !== components[1].id).map(c => c.componentId === components[0].id ? { ...c, value: selected.total } : c)
      d.independentVariables = [{ componentId: components[1].id, mode: 'LAV', quantity: 'pH', unit: 'dimensionless', range: { min: config.min, max: config.max }, points: config.points }]
      const prepared = await prepareSessionPoint({ chemicalSystem, calculationDefinition: d, revision }, repository, { sweep: true })
      if (!prepared.ok) throw new Error(prepared.diagnostics.map(d => d.message).join(' '))
      const scope = solubilityApplicability(prepared.system, components[0].id)
      if (!scope.ok) throw new Error(scope.reason)
      const request = await createSweepDefinition(prepared.system, d, revision)
      if (!request.ok) throw new Error(request.diagnostics.map(d => d.message).join(' '))
      const sweep = await runSweep(prepared.system, request.sweep, control)
      const derived = deriveOutputs(prepared.system, sweep, { type: 'saturated-log-solubility', componentId: components[0].id })
      if (!derived.ok) throw new Error(derived.diagnostics.map(d => d.message).join(' '))
      entries.push({ pair, total: selected.total, system: prepared.system, sweep, derived, scope })
    } catch (error) { entries.push({ pair, total: selected.total, error: { code: 'independent-solubility-unavailable', message: error.message } }) }
  }
  const result = freeze({ kind: 'independent-solubility-comparison', revision, config, conditions: structuredClone({
    temperature: definition.temperature, pressure: definition.pressure, activityModel: definition.activityModel, ionicStrength: definition.ionicStrength,
  }), entries, counts: { requested: config.points * entries.length, converged: entries.reduce((n, e) => n + (e.sweep?.counts.converged ?? 0), 0) } })
  results.add(result)
  return result
}

export function commitIndependentSolubility(session, comparison) {
  if (!results.has(comparison) || comparison.revision !== session.revision || !session.calculationDefinition.solubilityComparison) return session
  return { ...session, lastPlot: { comparison }, calculationStatus: 'independent-comparison', sweepResult: null, gridResult: null }
}

export function comparisonOutputs(comparison, currentRevision = comparison.revision) {
  if (!results.has(comparison)) throw new Error('A calculated independent comparison is required.')
  const stale = currentRevision !== comparison.revision
  const coords = comparison.entries.find(e => e.sweep)?.sweep.coordinates ?? Array.from({ length: comparison.config.points }, (_, i) => i === comparison.config.points - 1 ? comparison.config.max : (1 - i / (comparison.config.points - 1)) * comparison.config.min + i / (comparison.config.points - 1) * comparison.config.max)
  const series = comparison.entries.map(entry => ({ id: entry.pair.id, name: entry.pair.element, phase: 'derived', points: coords.map((x, index) => {
    const original = entry.derived?.series[0].points[index]
    const reason = stale ? 'stale-independent-comparison' : entry.error ? entry.error.code : original.reason
    const result = entry.sweep?.outcomes[index]?.result
    const accepted = isSuccessfulPointResult(result)
    const contributors = (entry.scope?.contributors ?? []).map(c => {
      const i = entry.system.components.findIndex(p => p.id === c.id)
      const j = i >= 0 ? i : entry.system.components.length + entry.system.products.findIndex(p => p.id === c.id)
      const molality = accepted ? result.concentrations[j] : null
      return { ...c, molality, weightedMolality: molality === null ? null : c.coefficient * molality }
    })
    const value = stale || entry.error ? null : original.value
    return { ...original, x, index, value, linearValue: value === null ? null : original.linearValue, reason,
      diagnostic: stale ? 'Setup changed; recalculate. This previous sample is unavailable for the current request.' : entry.error?.message ?? original?.diagnostic,
      status: value === null ? 'unavailable' : 'available',
      trace: { component: entry.pair.component, solid: entry.pair.solid, sourceComponentId: entry.system?.components[entry.scope.index].id ?? null,
        solidId: entry.scope?.solidId ?? null, saturation: accepted ? result.solids.find(s => s.id === entry.scope.solidId) : null,
        contributors, weightedDissolvedTotal: accepted ? result.dissolvedComponentAmounts[entry.scope.index] : null,
        logSolubility: value, unavailableReason: reason ?? null, revision: comparison.revision, stale,
        systemId: entry.system?.id ?? null, inputId: entry.sweep?.outcomes[index]?.input?.id ?? null },
    }
  }) }))
  const names = { 'comparison-pH': 'H+' }
  comparison.entries.forEach(e => { names[e.pair.id] = `${e.pair.element} · ${e.pair.solid} (independent)` })
  return { ok: true, series, metadata: { revision: comparison.revision, runStatus: series.every(s => s.points.every(p => p.value !== null)) ? 'completed' : 'partial',
    axis: { componentId: 'comparison-pH', quantity: 'pH', unit: 'dimensionless', start: comparison.config.min, end: comparison.config.max },
    conditions: comparison.conditions, componentNames: names,
    fixedConditions: comparison.entries.map(e => ({ componentId: e.pair.id, mode: 'T', quantity: 'total', value: e.total, unit: 'mol/kg-H2O' })),
    output: { type: 'saturated-log-solubility', label: 'Independent total-dissolved solubility', unit: 'log10(m / (mol/kg-H2O))', formula: 'Separate metal–H–O equilibria; sum of aqueous molalities weighted by metal coefficients, only at the selected pure-solid saturation. Not a mixed-metal equilibrium.' },
  } }
}

export function comparisonPackage(comparison, currentRevision, visibleIds, view) {
  return JSON.stringify({ kind: 'adams-independent-solubility-export', schemaVersion: 1, currentRevision, stale: currentRevision !== comparison.revision,
    visibleIds, view, comparison, derived: comparisonOutputs(comparison, currentRevision), warning: 'Independent solutions, not a coupled mixture. Raw previous results retain their original revision. Imported results are not trusted calculation state.' }, null, 2)
}
