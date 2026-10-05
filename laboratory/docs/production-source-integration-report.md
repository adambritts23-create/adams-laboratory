# General MEDUSA production integration — stopped at preservation gate

Status: **incomplete; not an accepted production milestone**. No deployment or push. The working changes are retained for review. Do not infer a successful build or full regression from the focused evidence below.

## Blocking preservation result

The existing coupled Fe/chromate pure-solid control now refuses with `solid-network-capacity-exceeded` before solving. Generic admission discovers **21 admissible pure solids**, alongside **55 aqueous/source species and 51 source reactions**. The unchanged limits are 12 candidate solids and 64 total species/reactions. The former explicit nine-solid scope fit exactly at 64 species; the general set would require 76 species and 72 reactions.

This is a scope-expansion regression, not a demonstrated numerical equilibrium disagreement. It must not be hidden by truncating the discovered phases, silently restoring an element-specific whitelist, raising unvalidated bounds, or rewriting the independent reference. The more acidic Fe/chromate control is affected as well. See `production-source-blocker.json` for every admitted/excluded source identity and the exact recipe.

The requested stop-at-failed-major-gate policy applies. No full regression, production build, artifact audit, lint, downstream Calculation UI unification, or performance optimization was run after this failure. The already-started focused test batch was allowed to finish to preserve its diagnostic record.

## 1. Production conservation written

`src/thermodynamics/sourceConservation.js` extracts the proven rational nullspace and exact inventory transformation. Supplied binary Number inventories are represented exactly, structural zeros remain zero, and final targets round once to Number. A versioned, serializable source/phase provenance record is attached. Reviewed elemental conserved subspaces are independently compared; mismatch refuses. Production preparation consumes these source targets without a validation-script fallback.

The closed compiler admits absent ordinary-carrier atom metadata when authoritative source charge/identity and complete source conservation exist. It preserves reviewed atoms and their independent validation. Electron and water boundary semantics remain explicit. These edits are written but the overall integration has not passed its acceptance gate.

## 2. Known parity evidence

`production-source-gate.json`: **20 controls passed**: twelve independently referenced Cr doses; three historical reviewed Fe/peroxide doses; Eu; acetate/borate at three volumes; Li acetate. The gate passed again after generic solid/optional-metadata transport was connected. `production-source-legacy-gate.txt`: **7/7 legacy setup tests passed**.

The later focused batch finished: **26 tests; 19 passed, 7 failed; zero cancelled/skipped/todo**. Four failures arise from the capacity regression (including dependent assertions); three retain the old missing-atom refusal expectation. No failing assertion was relaxed.

The later focused batch independently passed the twelve-Cr-dose test, reviewed Fe/peroxide test, Eu test, acetate/borate tests, and ordinary chromium Wet Lab bridge. It exposed the Fe/chromate capacity regression. `production-source-focused.txt` retains all test outcomes, including tests whose old expectation was refusal solely because Cu/nitrate atoms were missing; those assertions were not rewritten to hide the preservation failure.

## 3. Coefficient semantics

The production structural path currently accepts safe-integer source coefficients and performs derived fractional algebra exactly. Noninteger source coefficients remain refused. The prior census is retained in `exact-general-coefficients.json`; the requested complete semantic classification of its 77 noninteger occurrences is not completed in this phase. No source coefficient or log K was changed, rounded, or reinterpreted.

## 4. Copper

The production physical-preparation request with 0.01 mol Cu2+ and 0.02 mol Cl− in one model kg, aqueous plus pure-solid scope, accepted:

- pH: **4.416482679202116**
- pe: **14.160701432847617**
- positive solid: **CuCl2·3Cu(OH)2(cr)**
- source ID: `spana:2ac52a30213c9288:107212`
- amount: **0.000005125676351968837 mol/kg H2O**
- log saturation: **5.329070518200751e−15**
- seven admitted candidate solids.

No Cu atom vector was supplied or inferred. This is new **internal integration evidence**, not an independent Cu reference or proof of general production readiness. Full request, compilation, and result are in `production-source-copper.json`.

## 5. Nitrate — partial diagnosis, unresolved

The balanced 0.01 Na+/0.01 NO3− physical recipe now compiles without atom metadata. The production numerical solve refuses at iteration zero with `singular-or-ill-conditioned`.

Observed structure: 28 source species, 25 source relations, transformed source rank 23, five retained basis coordinates including fixed water, and four independent conservation rows. The numerical problem has four unknown log activities and four balance equations. Basis: *NO2, Na+, NO3−, H+, H2O; target coordinates: [0, 0.01, 0.01, 0, 0].

Read-only runtime instrumentation captured the unchanged Newton calculation. At its default initial logs [-7, -2, -2, -7, 0], the *N2 product log concentration is 97.85, *N2O is 56.21, and N2H5+ is 43.08. Several scaled Jacobian rows are nearly opposite/proportional at floating precision. This establishes failure of the initial conditioning gate; it does **not** establish an underdetermined physical network or prove missing gas inventory constraints. Full structural redundancy/basis-remedy investigation and equilibrium phase/gas analysis were not completed before the preservation stop. No alternative seed, tolerance change, forced acceptance, or gas conclusion was introduced.

Evidence: `production-source-nitrate.json` and the isolated instrumentation script `scripts/validation/productionNitrateDiagnosis.js`. No instrumentation was written into production solver code.

## 6–8. Constructor, boundary contracts, Calculation UI

The existing `physical-preparation` entry remains in place. Non-redox preparation retains its path; closed redox now receives exact source inventory targets. The complete proposed constructor/unification audit was not reached. No new imposed/derived H+/electron combination is claimed supported, and no Calculation UI mode was simplified or relabelled in this phase. Existing imposed-potential and closed boundary conditions remain distinct.

## 9. Wet Lab

Two adapter edits prevent atomless results from masquerading as elemental inventories and allow actual solid concentration carriers in analysis. Reviewed chromium still passed the focused Wet Lab bridge. No new atomless Total Cu/Total N or oxidation-state view is claimed. Broader browser demonstration is not completed.

## 10. Performance

Not reached. No structural cache, support-union reuse, reduced compile count, or 101-point speedup is claimed.

## 11. Remaining limits and resumption point

Resolve the **generic phase-scope/capacity preservation contract first**. Keep the independent nine-phase Fe/chromate reference as its explicitly scoped model; decide how a complete general candidate set can be represented without silent truncation or unvalidated capacity expansion. Then rerun this focused preservation gate before resuming nitrate diagnosis or downstream integration. Checkpoint copies of the pre-edit core files are retained in `.local/production-source-checkpoint`; no automatic rollback was performed.

Other remaining boundaries include noninteger source precision, gas/headspace equilibrium, nonideal conditions, existing species/reaction/phase capacities, semantic elemental/oxidation-state metadata, and the uncompleted constructor/browser/performance stages.

## 12. Preservation and validation status

`production-source-preservation.json` compares 251 pre-edit hashes: no missing files and no changed protected data/reference files. Seven existing source files changed, plus the new production conservation module. The numerical point/linear solvers and tolerance files were unchanged. Source thermodynamic data and saved independent references remain unchanged.

The current working tree is an unfinished integration with a known preservation failure. It is **not ready to deploy or to replace the last verified production build**. Stop for review.
