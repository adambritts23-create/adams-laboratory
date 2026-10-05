import fs from 'node:fs'
import { prepareChemicalSystem, createPointInput } from '../src/solver/models.js'
import { componentRole } from '../src/chemistry/components.js'
import { sourcePhase } from '../src/thermodynamics/importers/spana/names.js'

export const references = JSON.parse(fs.readFileSync(new URL('./fixtures/eq-diagr/references.json', import.meta.url)))
export function role(name) {
  const r = componentRole(name)
  return r === 'basis-choice' ? 'ordinary' : r === 'solvent' ? 'water' : r
}
export async function prepareReference(c) {
  const preparation = await prepareChemicalSystem({
    components: c.components.map(name => ({ id: name, name, role: role(name) })),
    products: c.sourceRecords.map(r => ({ id: r.id, name: r.name, phase: sourcePhase(r.name), logBeta: r.logK,
      coefficients: c.components.map(name => r.coefficients[name] ?? 0), sourceRecord: r.provenance })),
    basisStatus: 'explicit-direct', temperatureC: 25, pressureBar: 1, unit: 'mol/kg-H2O',
    sourceIdentity: { revision: references.sourceRevision, databaseHash: c.sourceRecords[0].provenance.dbSha256, species: c.sourceRecords.map(r => r.id) },
  })
  if (!preparation.ok) throw new Error(JSON.stringify(preparation))
  const input = await createPointInput(preparation.system, { revision: 0, unit: 'mol/kg-H2O', temperatureC: 25, pressureBar: 1, activityModel: 'ideal',
    constraints: c.conditions.map((condition, i) => { const [mode, value] = condition.split(','); return { componentId: c.components[i], kh: mode === 'T' ? 1 : 2, value: Number(value) } }) })
  if (!input.ok) throw new Error(JSON.stringify(input))
  return { system: preparation.system, input: input.input }
}
