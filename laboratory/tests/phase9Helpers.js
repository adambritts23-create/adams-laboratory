import fs from 'node:fs'
import { repositoryFromSnapshot } from '../src/thermodynamics/snapshot.js'
import { createWorkspaceSession, updateLaboratorySession } from '../src/session/laboratorySession.js'
import { prepareSessionPoint } from '../src/solver/prepareSession.js'
import { vary } from './phase8Helpers.js'

export const localCarbonateAvailable = fs.existsSync('.local/spana-components.json')
export async function carbonateGrid(nx = 7, ny = 5) {
  const repository = repositoryFromSnapshot(JSON.parse(fs.readFileSync('.local/spana-components.json', 'utf8')))
  let session = createWorkspaceSession(repository)
  session = updateLaboratorySession(session, { type: 'system', action: { type: 'toggleElement', symbol: 'C' } }, repository)
  const carbonate = repository.getComponents().find(c => c.name === 'CO3 2-'), proton = repository.getComponents().find(c => c.role === 'proton')
  session = updateLaboratorySession(session, { type: 'system', action: { type: 'toggleComponent', id: carbonate.id } }, repository)
  session.calculationDefinition = vary(session.calculationDefinition, proton.id, 'LAV', 0, 14, nx, 'pH')
  session.calculationDefinition = vary(session.calculationDefinition, carbonate.id, 'LTV', -6, -1, ny, 'total')
  session.calculationDefinition.dimensions = 2
  const prepared = await prepareSessionPoint(session, repository, { grid: true })
  if (!prepared.ok) throw new Error(JSON.stringify(prepared))
  return { repository, session, system: prepared.system, definition: session.calculationDefinition, carbonate, proton }
}
