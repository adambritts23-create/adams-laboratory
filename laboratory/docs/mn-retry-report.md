# Mn numerical-failure recovery — bounded initialization retry

## Outcome

All 29 previously failed Mn grid samples now pass the unchanged equilibrium acceptance checks. The 195-point grid has 195 accepted, zero failed and zero not-run states. All 166 previously accepted samples retain identical numerical concentrations, log activities, component totals, solid results and residuals (JSON comparison naturally normalizes signed zero). The separate phase-coexistence probe still returns ambiguous-solid-assemblage.

This phase changes initial guesses only. It does not change equilibrium equations, formation constants, tolerances, phase enumeration, basis conversion, classification, public UI or deployment state. Public Pourbaix remains disabled.

## Root cause and evidence

At pH14/pe0, starting log(a_Mn2+) at log(total)=-3 leads to an initial Mn inventory of 2517850890192.162 mol/kg under mass action. The dimensionless solid-amount column scale becomes 3.971641068560975e-16, below the existing relative pivot threshold 1e-14. The independent oracle gives a finite Mn3O4-limited equilibrium. The initial matrix conditioning failure does not establish that equilibrium is impossible.

At strongly oxidizing coordinates, the free concentration can be more than a hundred log units below the analytical total. Starting at the total can consume the iteration budget before reaching that range. The same mechanism is reproduced with an explicitly synthetic mathematical A/bound-A system; no Mn name, redox identity, benchmark coordinate or oracle formula appears in the production retry.

## Minimal fix

After a numerical failure only, permit one additional start when there is exactly one unknown positive ordinary analytical total, all other components have fixed activities, all species coefficients for that unknown are nonnegative, and at most one solid is active in the candidate assemblage.

For an aqueous-only candidate, write each weighted mass-action contribution as n_j * 10^(b_j+n_j*x), with x the unknown log activity and b_j determined by stored reactions and fixed activities. If there are N positive aqueous contributors including the free component, give each an initial upper bound T/N. Choose the smallest resulting log-activity bound. This creates a finite, nonnegative inventory seed rather than using total as free activity. It is only a seed; the Newton equations and acceptance checks still determine the result.

For a candidate with one active pure solid, initialize its log activity at the saturation equation x=-b_s/n_s. Solid amount still starts at zero. Newton solves the inventory and rechecks saturation, positivity and all inactive phases. No saturation-bound oracle replaces the production solve.

The retry is ineligible for suppressed electron/proton total cases, signed unknown-component stoichiometry, multiple unknown totals or multiple active solids. Successful first starts are never replaced. The existing rank check still executes even at zero residual. A failed retry preserves the original typed failure, and records the additional retry failure rather than changing failure semantics. Overflow/underflow states outside representable range still fail.

Every retry records its policy ID, original failure and initial log activities in the attempts trace. There is at most one retry per candidate, with the same per-start iteration limit; a zero iteration budget disables retry. This can increase work for previously failing candidates, bounded to two starts each. No scientific acceptance threshold is relaxed.

## Validation

Five new focused tests cover:
- all 29 historical failures recovering through the original checks and independent quadratic/saturation comparisons;
- unchanged numerical states for all 166 historical successes;
- coexistence ambiguity, zero total and zero iteration-budget rejection;
- generic synthetic monomer recovery without Mn/redox identity;
- exact exported retry provenance and fixed-activity preservation.

The seven existing Mn audit tests remain. Two expectations were updated because numerical failures are now repaired: the regular grid must converge at all 195 points, and failure-classification coverage now uses an explicit zero-total invalid grid instead of depending on a numerical defect. No golden expectations or tolerance tests were weakened.

Final full suite: **241/241 passing** (236 previous tests plus five). All five golden benchmarks remain unchanged. Existing underdetermined-component and exponent-range tests pass. Build passed. Lint passed with the existing ExpandedPlot hook-cleanup warning only. Production audit passed against the completed build; existing large-chunk build advisory remains.

Independent evidence maxima over all 195 samples:
- free-Mn log10 analytical error: 2.1316282072803006e-14;
- absolute Mn balance residual: 3.924811864397526e-17 mol/kg;
- active-solid log-saturation residual: 7.105427357601002e-15.

Existing iteration tolerance 2e-13, active saturation tolerance 1e-12 and pivot threshold 1e-14 are unchanged. The previous 166 accepted samples are compared against the historical exact numerical evidence, not a newly generated baseline.

## Artifacts and exact files changed

Modified:
- src/solver/point.js — bounded numerical-failure retry and trace, unchanged residual/acceptance equations.
- tests/mnAudit.test.js — updated successful-grid expectation; preserved failure coverage with invalid inputs.

Added:
- tests/initializationRetry.test.js — five regression tests.
- scripts/validate-mn-retry.js — reproducible comparison with historical evidence.
- docs/mn-retry-validation.json — exact new grid/results, retry traces and independent comparisons.
- docs/mn-retry-report.md — this report.

Run node scripts/validate-mn-retry.js to regenerate the new evidence. The original docs/mn-grid-validation.json, original diagnostic SVG/PNG and prior report were deliberately preserved as historical artifacts; their 29-failure status describes the pre-fix run. The new evidence records the historical file SHA256. Required build output in dist was regenerated. No deployment.

## Remaining limitations and review boundary

This resolves the observed initialization failures in the bounded audited Mn grid; it is not a general cure for ill-conditioned multi-component equilibrium. Genuinely singular, unsupported, ambiguous and unrepresentable cases remain failures. No gas equilibrium, water-stability lines, nonideal activity model, closed-cell charge/redox closure or public Pourbaix feature was introduced. The audited phase set and offline MnIII basis conversion retain their prior limitations.

Stop here for review. A subsequent bounded step could promote the audited reaction conversion and trace contract into an explicit internal application workflow; it should not silently generalize basis transformations or claim complete real-water stability.
