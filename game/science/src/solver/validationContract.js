/** Proposed acceptance criteria for the five ideal reference systems only. */
export const numericalValidationContract = Object.freeze({
  version: 1, scope: 'phase4-restricted-ideal-benchmarks', sourceAbsoluteBalanceFloor: 2e-14,
  requestedRelativeBalanceTolerance: 1e-10, comparisonAbsoluteConcentrationTolerance: 4e-14,
  comparisonRelativeConcentrationTolerance: 2e-10, comparisonLogActivityTolerance: 1e-8,
  massActionLogResidualTolerance: 1e-10, saturatedSolidLogActivityTolerance: 1e-8,
  requiredErrorFlags: 0, nonidealAcceptance: 'not-established', diagramTolerance: 'not-applicable',
})

/** Conservative outer-loop bound; official inner-loop bounds can be tighter. */
export function componentBalanceTolerance(total, smallestNonzeroTotal, relative = 1e-10) {
  return Math.max(2e-14, relative * Math.max(Math.abs(total), Math.min(Math.abs(smallestNonzeroTotal), 1e-6)))
}
