import { createRepository } from './repository.js'
export function repositoryFromSnapshot(snapshot) {
  if (!snapshot || snapshot.kind !== 'adams-spana-snapshot' || snapshot.artifactVersion !== 1 || snapshot.complete !== true) throw new Error('Expected a complete Adam’s Laboratory Spana snapshot (artifactVersion 1).')
  if (!Array.isArray(snapshot.species) || !Array.isArray(snapshot.elements) || !Array.isArray(snapshot.sources) || !Array.isArray(snapshot.diagnostics)) throw new Error('Snapshot is missing required collections.')
  const repository = createRepository(snapshot)
  const solvent = repository.getSpeciesById('water')
  if (!solvent || solvent.role !== 'solvent' || solvent.phase !== 'liquid' || solvent.elementalComposition?.H !== 2 || solvent.elementalComposition?.O !== 1) throw new Error('Snapshot must include the explicit application water solvent identity.')
  return repository
}
