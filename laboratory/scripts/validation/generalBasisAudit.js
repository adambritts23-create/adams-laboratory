import fs from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { createRepository } from '../../src/thermodynamics/repository.js'
import { sourceRedoxFamily } from '../../src/analysis/redoxDiscovery.js'
import { prepareReactionBasisSystem } from '../../src/thermodynamics/prepareReactionBasis.js'
import { createPointInput, prepareChemicalSystem } from '../../src/solver/models.js'
import { solvePoint } from '../../src/solver/point.js'
import { componentBalanceTolerance, numericalValidationContract } from '../../src/solver/validationContract.js'

export async function uraniumBasisAudit() {
 const repository = createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
 const evidence = JSON.parse(fs.readFileSync('docs/hydra-basis-controls.json')), output = {}, results = {}
 for (const key of ['UVI', 'UV']) {
  const old = evidence.transformations[key], names = new Map(repository.getComponents().map(c => [c.name, c.id])), basisIds = old.basis.map(n => names.get(n))
  const prepared = await prepareReactionBasisSystem(repository, { familyIds: sourceRedoxFamily(repository, basisIds[2]).componentIds, basisIds, candidateIds: old.transformed.map(r => 'spana:2ac52a30213c9288:' + r.source.id) })
  if (!prepared.ok) throw Error(JSON.stringify(prepared.diagnostics))
  const system = prepared.system, reference = gunzipSync(fs.readFileSync(`docs/reaction-basis-${key}-haltafall-reference.ndjson.gz`)).toString().trim().split('\n').map(JSON.parse)
  // Matched pe, using the unchanged reference harness's documented conversion.
  // Adam's physical constants are not modified by this comparison.
  const referenceFactor = Math.log(10) * 8.31446 * 298.15 / 96485.309
  const implicit = await prepareChemicalSystem({ components: system.components, redoxPolicy: system.redoxPolicy, products: system.products.map(p => ({ ...p, coefficients: p.coefficients.map((n, i) => system.components[i].role === 'water' ? 0 : n) })), basisStatus: 'explicit-direct', solidPolicy: system.solidPolicy, unit: system.unit, temperatureC: 25, pressureBar: 1, sourceIdentity: { purpose: 'ideal-water-constraint-control', parent: system.id } })
  // Apply log a(water)=0 only AFTER transformation. The solver interface retains
  // its required solvent slot; zeroing that column represents implicit ideal water.
  if (!implicit.ok) throw Error(JSON.stringify(implicit.diagnostics))
  const summary = { points: 0, failed: [], maxBalanceResidual: 0, maxReferenceAmountDifference: 0, labelDisagreements: 0, solidDisagreements: 0, maxImplicitWaterDifference: 0, comparisonAbsoluteTolerance: numericalValidationContract.comparisonAbsoluteConcentrationTolerance, counts: {} }
  const samples = []
  const label = carriers => {
   const solids = carriers.filter(c => c.phase === 'solid' && c.amount > 0)
   return [...(solids.length ? solids : carriers)].sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name))[0]?.name
  }
  for (const point of reference) {
   const options = target => ({ revision: 0, unit: target.unit, temperatureC: 25, pressureBar: 1, activityModel: 'ideal', constraints: target.components.map(c => ({ componentId: c.id, kh: c.role === 'ordinary' ? 1 : 2, value: c.role === 'ordinary' ? 1e-5 : c.role === 'proton' ? -point.pH : c.role === 'electron' ? -point.Eh / referenceFactor : 0 })) })
   const input = await createPointInput(system, options(system)), result = solvePoint(system, input.input)
   const waterInput = await createPointInput(implicit.system, options(implicit.system)), waterResult = solvePoint(implicit.system, waterInput.input)
   summary.points++
   if (!result.ok || !waterResult.ok) { summary.failed.push({ pH: point.pH, Eh: point.Eh, diagnostics: result.diagnostics, water: waterResult.diagnostics }); continue }
   const index = 2, carriers = [{ name: system.components[index].name, amount: result.concentrations[index], phase: 'aqueous' }, ...system.products.flatMap((p, j) => p.coefficients[index] ? [{ name: p.name, amount: p.coefficients[index] * result.concentrations[system.components.length + j], phase: p.phase }] : [])]
   const inventory = carriers.reduce((s, c) => s + c.amount, 0)
   summary.maxBalanceResidual = Math.max(summary.maxBalanceResidual, Math.abs(inventory - 1e-5))
   if (Math.abs(inventory - 1e-5) > componentBalanceTolerance(1e-5, 1e-5)) throw Error('component balance failure')
   for (const c of carriers) {
    const ref = point.carriers.find(r => r.name === c.name)
    if (!ref) throw Error('Missing independent carrier ' + c.name)
    summary.maxReferenceAmountDifference = Math.max(summary.maxReferenceAmountDifference, Math.abs(c.amount - ref.amount))
   }
   for (let j = 0; j < system.products.length; j++) summary.maxImplicitWaterDifference = Math.max(summary.maxImplicitWaterDifference, Math.abs(result.concentrations[system.components.length + j] - waterResult.concentrations[implicit.system.components.length + j]))
   const actualLabel = label(carriers), refLabel = label(point.carriers)
   if (actualLabel !== refLabel) summary.labelDisagreements++
   const solids = c => c.filter(r => r.phase === 'solid' && r.amount > 0).map(r => r.name).sort().join('|')
   if (solids(carriers) !== solids(point.carriers)) summary.solidDisagreements++
   summary.counts[actualLabel] = (summary.counts[actualLabel] ?? 0) + 1
   samples.push({ pH: point.pH, Eh: point.Eh, inventory, carriers, label: actualLabel })
  }
  output[key] = summary; results[key] = { system, samples, algebra: prepared.algebra }
 }
 output.crossBasis = { maxAmountDifference: 0, labelDisagreements: 0 }
 results.UVI.samples.forEach((p, i) => { const other = results.UV.samples[i]; if (p.label !== other.label) output.crossBasis.labelDisagreements++; for (const c of p.carriers) output.crossBasis.maxAmountDifference = Math.max(output.crossBasis.maxAmountDifference, Math.abs(c.amount - other.carriers.find(r => r.name === c.name).amount)) })
 return { summary: output, results }
}

