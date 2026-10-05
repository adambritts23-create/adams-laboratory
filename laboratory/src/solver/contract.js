/**
 * Restricted point solver contract. See models.js, point.js and docs/phase5-report.md.
 * @typedef {Object} EquilibriumRequest
 * @property {Object} chemicalSystem Validated ChemicalSystem with resolved independent basis.
 * @property {Object[]} thermodynamicRecords Validated, sourced records for all reactions and solvent.
 * @property {Object} databaseIdentity Version/checksum identifying the exact dataset snapshot.
 * @property {Object} calculationDefinition Versioned requested quantities and component constraints.
 * @property {Object} basis Ordered source-component identities, signed a rows, lBeta,
 * solid flags, noll and solvent/proton/electron indices; no atom-count reconstruction.
 * @property {Object} pointInput kh=1/tot or kh=2/logA per component, temperature C,
 * pressure bar, explicit mol/kg-H2O convention and supported activity model.
 *
 * Future implementations must reject incomplete constants, unsupported conventions/models,
 * unresolved basis/redox constraints and out-of-domain conditions before calculating.
 * A future result must carry convergence diagnostics, input/database identity and units.
 * It must carry the immutable session revision/run ID; a caller discards stale results.
 * Basis preparation, thermodynamic evaluation, point solving, sweep orchestration,
 * result analysis and rendering remain separate boundaries. Gas fugacity/closed-gas
 * handling and nonideal models require additional contracts before implementation.
 */
export const solverStatus = Object.freeze({ implemented: true, domain: 'ideal-direct-basis-point-25C', message: 'Use the Calculation workspace to prepare and solve a restricted ideal equilibrium point. These builder checks did not perform a calculation.' })
