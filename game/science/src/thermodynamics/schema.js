/** Extensible phase registry. Solvent is a species role, not a phase. */
export const phases = Object.freeze(['aqueous', 'solid', 'gas', 'liquid'])
export const activityModels = Object.freeze(['ideal', 'Davies', 'extended Debye-Huckel', 'SIT', 'Pitzer'])

/**
 * Species schema v1. Unknown science stays null, never a placeholder number.
 * oxidationStates: { symbol: [{ value: integer, count: positive integer }] | null } | null.
 * Counts allow mixed valence; a missing element entry means unknown.
 * componentStoichiometry: { componentId: coefficient } | null (basis-dependent).
 * formationReaction: { equation: string, stoichiometry: { speciesId: coefficient } } | null.
 * Reaction coefficients are signed: products positive, reactants negative.
 * temperatureReference in K, pressureReference in bar; logK is dimensionless.
 * Provenance.original is an untouched source snapshot, separate from normalized fields.
 */
export function createSpecies(fields) {
  return {
    schemaVersion: 1, id: '', name: '', displayName: '', formula: '', phase: 'aqueous', role: 'solute',
    charge: null, elementalComposition: {}, discoveryElements: null, oxidationStates: null,
    componentStoichiometry: null, formationReaction: null, logK: null, logKConvention: null,
    temperatureReference: null, temperatureModel: null, pressureReference: null,
    activityModelCompatibility: null, source: null, sourceDatabase: null, sourceRecordId: null,
    citation: null, notes: [], qualityFlags: [], deprecated: false, metadata: {}, provenance: null,
    ...fields,
  }
}
