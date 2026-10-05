# Validated bounded pure-solid equilibrium — completion report

## Result and integration

Implemented an opt-in general candidate-solid point solver and validated its use through the existing independent 1D sweep engine. The current UI, legacy preparation policy, specialized solubility output eligibility, exports and historical audit are preserved. This phase does not expose a new UI control or claim that the existing one-solid solubility output now supports arbitrary assemblages.

Use prepareChemicalSystem with solidPolicy: 'bounded-multisolid-v1' on an explicitly direct, provenance-linked numerical specification, then the existing createPointInput / solvePoint or createSweepDefinition / runSweep interfaces. Without this policy the prior preparation contract remains intact, including its typed rejection of multiple candidates. All 201 prior tests are unchanged and pass.

## Candidate search and scientific checks

Candidates must pass the existing direct-basis preparation checks: unique IDs, finite complete signed coefficient rows, finite stored formation constants, source linkage, aqueous/pure-solid phases, mol/kg-H2O, ideal 25 °C and declared 1 bar. The new policy rejects electron-component bases. It does not discover missing phases, close redox reactions or perform basis transformations.

Products are canonically ordered for opt-in requests. Enumerate the empty set and subsets through the rank of solid stoichiometry restricted to total-constrained components. This is at most the number of unknown component activities; extra dependent phase inventories cannot be independently determined. Dependent subsets receive explicit rejection diagnostics. Limits are 12 candidates and 1024 subsets; exceeding either fails closed without accepting a truncated search.

Each independent subset adds one solid-amount unknown and one saturation equation per active phase to the existing scaled, damped log-Newton system. Every converged candidate is checked for mass balance, aqueous mass action, strictly nonnegative solid amounts, active saturation equalities and inactive saturation inequalities. No negative amount is clipped. All bounded subsets are considered; no previous-point continuity heuristic is used.

Distinct admissible positive phase supports or materially different accepted states yield ambiguous-solid-assemblage. Equivalent zero-inventory boundary representations may use the smallest canonical subset. Fixed saturated reservoirs without inventory constraints yield underdetermined-solid-inventory. Numerical failures, missing admissible assemblages, dependent sets and search limits remain typed failures with no fabricated equilibrium result.

No existing tolerance changed: Newton residual 2e-13, solid log-saturation equality/inequality 1e-12, existing balance/mass-action contract and Gaussian conditioning gate. The row-normalized rank gate uses the same 1e-14 conditioning threshold. The existing 2e-14 amount comparison floor and 1e-8 log-activity comparison threshold identify materially different accepted roots; different positive phase supports are rejected regardless of that floor. Boundary-neighborhood tests at relative inventory offsets ±1e-8 retain nonnegative amounts or explicit failure. No new tunable complementarity tolerance was introduced.

Point diagnostics include candidate identities, attempted active subsets, rejection reasons, converged candidate solid amounts/SIs and component balance residuals/limits. Successful results identify actual positive active solids and the search policy. Existing trace reconstruction already sums all solid rows and was reused without modification. Point and 1D sweep method metadata distinguish this policy from the legacy single-solid algorithm.

## Validation ladder

A/B: 29 focused existing point, single-component pH-solubility and independent-solubility tests passed first, including five official golden systems. The final full suite preserves all 201 previous tests.

C: an explicitly artificial mathematical two-component fixture has solids with formation logs 3 and 4 and separate unit coefficient rows. At totals 0.01 and 0.02, direct mass action gives free amounts 0.001 and 0.0001, and solid inventories 0.009 and 0.0199. A weaker competing solid has SI=-1. These test-only constants are not chemical database data. Concentrations, both amounts, totals and inequalities agree; reversed candidate order gives identical arrays and phase records.

D: with all ten audited candidates, pH12 recovers calcite + crystalline Mg(OH)2. The independently derived audit closed form agrees quantitatively:
- calcite amount: 0.09992893917438252 mol/kg-H2O;
- brucite amount: 0.0009996683875431584;
- dissolved Ca: approximately 7.10608256174822e-5;
- dissolved Mg: approximately 3.31612456841557e-7.

E: the pH14 full search selects calcite, brucite and portlandite. Independently, log aCa = -beta_portlandite - 2pH, log aMg = -beta_brucite - 2pH and log aCO3 = -beta_calcite - log aCa. Reconstruct all aqueous species from the unchanged records. Calcite inventory is Tcarbonate-Dcarbonate; portlandite is TCa-DCa-calcite; brucite is TMg-DMg. All three are positive and every other candidate SI is nonpositive. This confirms the selected solution rather than assuming that adding the third solid is sufficient:
- calcite: 0.09940548504912593 mol/kg-H2O;
- portlandite: 0.0004319891466332604;
- brucite: 0.0009999974190573818.

F: only after C–E passed, the existing sweep engine calculated 29 independent samples from pH0 to14 at spacing0.5. All29 passed separate reconstruction of balances, aqueous mass action and complementarity. Sampled active regions:
- pH0–5: aqueous-only;
- pH5.5–9.5: calcite;
- pH10–13.5: calcite + brucite;
- pH14: calcite + brucite + portlandite.

These are sampled regions, not refined transition locations. No gaps were filled or interpolated. Maximum reported balance residual: 5.7870375158586285e-15 mol/kg-H2O. Maximum active SI magnitude: 1.7763568394002505e-15. A separate evidence run, also independently checked, records the same 29 points in multisolid-validation.json. Mg4(OH)4+4 retains coefficient4 in dissolved Mg and all balances.

Additional tests cover equal-stability ambiguity, unequal-stability polymorph selection, negative/inequality rejections, rank dependence, candidate/search limits, fixed reservoirs, non-redox scope and boundary neighborhoods. Seven new tests, final total **208 passed / 0 failed**.

## Checks and preserved data

- npm test: 208 passed, including five golden benchmarks.
- npm run lint: zero errors; one unchanged ExpandedPlot.jsx:21 hook-ref warning.
- npm run build: passed; existing >500kB bundle advisory remains.
- node scripts/audit-production-boundary.js: passed.
- node scripts/validate-multisolid.js: passed; reproducible offline evidence.
- Golden fixture SHA256 unchanged: aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960.
- Bundled database SHA256 unchanged: 9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245.

No constants, stoichiometry, activity assumptions, tolerances, exact export precision, old fixtures, UI files or historical mixed-carbonate audit files were changed. No GPL solver code was used. No deployment performed.

## Exact source/document files changed in this phase

Modified:
- src/solver/models.js — explicit bounded policy and canonical preparation.
- src/solver/point.js — multiple independent solid unknowns, exhaustive bounded phase selection, acceptance and diagnostics.
- src/calculations/sweep.js — accurate method metadata for opt-in sweeps.

Added:
- src/solver/assemblages.js — rank gate and deterministic bounded subsets.
- tests/multisolid.test.js — seven focused scientific/robustness regressions.
- scripts/validate-multisolid.js — offline evidence reproduction.
- docs/multisolid-design.md — design written before production edits.
- docs/multisolid-validation.json — numerical evidence, candidate rejection records and hashes.
- docs/multisolid-report.md — this report.

The build also regenerated dist/index.html and hashed application assets; the production audit verified copied database/artwork assets. There is no Git repository in this working directory, so this file inventory describes this phase's writes rather than a Git diff.

## Remaining limits

This is a bounded small-system solver, not unrestricted global phase discovery. Admissibility is relative to the supplied compatible pure-solid list and stored data. Rank-deficient/ambiguous inventories and numerical conditioning failures remain unavailable. Newton convergence is not guaranteed for every supported-size request. Exact zero-activity boundary reduction remains unsupported. No gas equilibrium, redox closure, nonideal activities, pressure/temperature extension, solid solutions, metastability, kinetics or new 3D capability was added. The validation does not establish empirical accuracy of the source constants outside the existing domain. UI activation and broader multi-solid solubility presentation require a separate bounded task.
