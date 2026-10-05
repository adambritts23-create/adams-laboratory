# Phase 5 — First independent ideal equilibrium point solver

Status: completed for the deliberately restricted domain below. Phase 6 has not begun. The five official Java golden cases and Phase 4 tolerances remain unchanged.

## 1. Files added/changed

Added production modules:

- `src/solver/models.js`: immutable prepared-system and point-input factories, diagnostics, exact-content SHA-256 identities and boundary validation.
- `src/solver/linear.js`: small dense partial-pivoting linear solve.
- `src/solver/point.js`: independent scaled log-activity Newton point solver, single-solid assemblage handling, scientific acceptance and immutable results.
- `src/solver/prepareSession.js`: repository-to-numerical preparation and fixed-coordinate mapping.
- `src/components/PointResult.jsx`: numerical point tables and diagnostics.

Added verification/report files:

- `tests/pointHelpers.js`, `tests/pointSolver.test.js`, `tests/pointSession.test.js`.
- `scripts/report-point-benchmarks.js`.
- `docs/phase5-report.md`, `docs/phase5-benchmarks.md`, `docs/phase5-benchmarks.json`.

Modified: `src/App.jsx`, `src/App.css`, `src/components/CalculationWorkspace.jsx`, `src/components/SystemDefinition.jsx`, `src/session/laboratorySession.js`, `src/solver/contract.js`, `scripts/run-java-references.js`, `README.md`, `docs/scientific-architecture.md`.

`dist/` was rebuilt. No dependencies, project license or deployment configuration changed. The Vite base remains `/adambritts-site/laboratory/`. No user source installation files were modified.

## 2–5. Mathematical formulation, unknowns, residuals and method

Let x_i=log10(a_i) for component i, and let nu_ji be the signed source-component coefficient for reaction product j. Aqueous mass action is:

    ell_j = logBeta_j + sum_i nu_ji*x_i
    m_j = 10^ell_j

Here m is the numerical molality in mol/kg H2O under the declared ideal reference-state assumption. Ordinary free component molality is 10^x_i. Electron and solvent concentrations are suppressed bookkeeping zeros while their log activities still enter mass action.

For each kh=1 component, solve:

    r_i = free_i + sum_aqueous nu_ji*m_j + sum_solid nu_ji*s_j - T_i = 0

For kh=2, x_i is fixed and no balance-target equation is added. Its total is calculated after solving. Signed coefficients and signed component totals are retained; no elemental atom-count matrix is reconstructed.

Unknowns are only the kh=1 component log activities, plus a scaled solid amount for the present-solid assemblage. The analytic aqueous Jacobian with respect to x_k is:

    dr_i/dx_k = ln(10) * [delta_ik*free_i + sum_aqueous nu_ji*nu_jk*m_j]

For a present solid, add its coefficient column in balance equations and its saturation row `logBeta_s + sum nu_si*x_i = 0`. This is a coupled solve, not removal of excess material after an aqueous calculation. Negative coefficients correctly enter both residuals and derivatives.

Each balance row is scaled by the maximum of absolute target total, sum of absolute contributing amounts, and 1e-300. Derivative contributions are divided by that scale before multiplication where possible to avoid unnecessary underflow. Compensated summation reduces cancellation in signed balances. The solid amount variable uses a fixed scale based on the largest imposed total (minimum 1e-12). There are no added numerical dependencies.

Newton steps use partial-pivoting Gaussian elimination. A pivot <=1e-14 times the largest scaled matrix entry is rejected as singular/ill-conditioned. The reported minimum pivot ratio is a diagnostic heuristic, not a computed condition number or independence proof.

A step is initially limited to at most four log10 units per unknown. Backtracking halves the step up to 40 times and requires a decrease in the infinity norm of scaled residuals (Armijo factor 1e-4). Row scales stay fixed during each line search; they are updated at the next iteration. Default limit is 120 Newton iterations per assemblage, with explicit diagnostic overrides allowed from 0 to 500 for testing.

Initial unknown x_i is log10(abs(T_i)) for nonzero totals, or −7 for zero totals. Fixed log activities are copied exactly. The initial solid amount is zero. No randomness, benchmark IDs or case-specific chemistry branches enter the numerical method.

Positivity comes from exponentiation, not clipping. Overflow and exponentiation to zero return range diagnostics; trial range errors trigger damping. Subnormal numbers must still satisfy the strict mass-action check. A representable 1e-250 free-component case is tested. A zero total with only nonnegative contributions requires an exact zero-activity boundary, which this finite-log formulation explicitly rejects rather than replacing with a tiny positive number. Signed zero-proton balances with both positive and negative contributions are supported and tested.

## 6–7. Three distinct tolerance layers

1. **Numerical iteration:** scaled balance/saturation infinity norm <=2e-13; active-solid saturation also checked against 1e-12. A small step or a library return flag alone cannot establish convergence.
2. **Scientific acceptance:** the existing Phase 4 component-balance bound is checked independently; aqueous reconstructed mass-action residual <=1e-10 log10 units; imposed kh=2 values unchanged exactly; solid amounts nonnegative; absent solid not supersaturated and present solid at saturation within 1e-12. Finite outputs are required. The stricter scaled iteration check must also have passed.
3. **Cross-implementation regression:** the unchanged Phase 4 limits are absolute concentration/total/dissolved tolerance 4e-14 plus relative 2e-10 times the official magnitude; absolute log-activity tolerance 1e-8. Solid status and saturation are checked separately. Golden values do not enter iteration or scientific acceptance.

Phase 4's balance outer bound is `max(2e-14, 1e-10*max(abs(T), min(smallest nonzero total,1e-6)))`. Its 2e-14 floor explains why a more tightly balanced independent result may differ slightly from Java yet legitimately pass. No tolerance was relaxed to obtain agreement.

## 8. PreparedChemicalSystem and PointEquilibriumInput

PreparedChemicalSystem contains ordered component/product identities, component indexing, signed coefficient rows, stored log10 formation constants, aqueous/solid row indices, special roles and suppression, phase labels, units, 25 °C/declared 1 bar conditions, source-pressure metadata, source records and database identity. The full scientific content, including provenance, receives a SHA-256 identity. Arrays and nested objects are frozen.

Only factory-created, validated objects enter the solver. PointEquilibriumInput is also frozen and SHA-256 identified; it records the prepared-system ID, scientific revision, ordered unique kh/value constraints, mol/kg-H2O, ideal model and conditions. It receives transformed log activities, never pH/Eh UI coordinates. The solver imports neither React nor the repository.

The result contains exact prepared/input IDs, revision and source identity. It exposes free concentrations/activities, species amounts and log activities, calculated component totals, dissolved amounts, solid amounts/status/log saturation, balance and mass-action residuals/limits, iteration/assemblage diagnostics, method/version and warnings. Activities outside numeric range are unavailable while their finite log representation can remain meaningful for suppressed special components. Ionic strength, electric balance and osmotic coefficient are null: none was calculated or silently replaced with zero.

## 9–10. Conservative preparation scope

The numerical factory requires an explicitly direct basis and allows 1–16 components, at most 128 products and at most one candidate pure solid. These bounds limit the implemented algorithm; they are not a claim that every system within them is well-conditioned or chemically complete.

The repository adapter requires supported, imported 25 °C formation data with database provenance, unchanged original logK and explicit finite source reaction terms. It maps exact component names into the selected order, filling absent terms with zero only when the source reaction actually omits that component. It rejects duplicate terms, identities, unsupported phases, missing constants and products requiring unselected components. It scans for direct reactions that make a selected component itself a dependent product and rejects those detectable redundancies. It does not rank-test the product-only matrix.

General component independence, alternative basis selection, aliases beyond straightforward identity checks, thermodynamic reaction cycles and DBSearch redox discovery/substitution remain unimplemented. Selecting Fe(II), e− and the already expressed Fe(III) product works; this does not claim arbitrary redox closure. A source record's Phase 3 general solverReady=false is not blindly flipped: preparation establishes a new, restricted numerical readiness state using the specific supported fields.

## 11–16. Aqueous, kh, special-component and solvent behavior

- Ordinary aqueous products obey signed mass action and ideal molal activities. No activity/concentration equivalence is claimed for nonideal models.
- kh=1 enforces the source-component balance, including solids; it is not necessarily an analytical element inventory.
- kh=2 imposes log activity exactly and calculates its component total. Its target-balance residual is null because no total target was supplied.
- H+ is handled by the ordinary equations. pH mapping to −logA occurs in the existing coordinate layer, outside the solver. Both fixed pH and a signed proton-total mathematical case are tested.
- e− has C=0 but participates algebraically in mass action. Fixed pe arrives as negative electron log activity. The official redox benchmark and an additional signed electron-total mathematical test pass.
- H2O requires kh=2 and logA=0 for this ideal release. Water's C, total and dissolved bookkeeping entries are zero, matching the reference convention; they are not physical solvent absence. There is no 55.5 mol/L substitution or water total. Special/condensed log-activity-coefficient zeros use the reference ideal bookkeeping convention, not measured nonideal properties.

No global electroneutrality equation or spectator ion is inserted. Explicit requests for additional electroneutrality enforcement are rejected.

## 17. Pure-solid treatment

There is one general candidate-solid implementation, with no AgCl-specific constants or formula checks. First solve the absent assemblage (solid amount zero). Strict undersaturation is decisive. Otherwise solve the present assemblage with saturation equality and the solid amount as a coupled unknown, then check nonnegative amount and all balances. Provisional Newton amounts can be negative; an accepted result cannot be. No post-solve clamping repairs a negative amount.

At a saturation boundary, an absent zero-amount state is labeled distinctly. Materially different accepted assemblages return an ambiguity diagnostic. Saturated fixed-activity reservoirs without any participating total balance cannot determine a solid inventory and are rejected. Supersaturated fixed reservoirs likewise do not get an invented precipitate amount. More than one candidate solid is rejected; robust arbitrary multiphase support is not claimed.

For absent solids, `logActivities` carries the hypothetical formation log activity/log saturation, not the activity of a phase declared present. The separate solid activity is null when absent and one when present.

## 18. Units and thermodynamic limits

All point amounts are mol/kg H2O; log quantities are dimensionless base 10. UI mol/L drafts are neither relabeled nor silently converted. Fixed totals with molarity are rejected by the source-input mapping. Temperature is initially exactly 25 °C and pressure setting exactly 1 bar. A missing source reference-pressure scalar stays null and is warned about; the declared calculation setting does not fabricate missing source metadata.

Only ideal activities are implemented. Automatic ionic strength means not evaluated on this path; fixed nonzero ionic strength is rejected by application preparation. Nonideal models, gas/fugacity inventories, other temperatures/pressures and thermal interpolation are unsupported.

## 19. Official benchmark comparisons

The complete per-value comparison, with 17 significant digits, inputs, official/independent values, absolute and relative differences, thresholds, residuals and pass flags, is in [phase5-benchmarks.md](phase5-benchmarks.md). Machine-readable full results are in [phase5-benchmarks.json](phase5-benchmarks.json). The script `node scripts/report-point-benchmarks.js` produces these reports from unchanged fixtures without Java execution.

| Official case | Result | Newton iterations in accepted assemblage | Largest concentration difference, mol/kg H2O | Largest log-activity difference |
| --- | --- | ---: | ---: | ---: |
| acid-base | PASS | 0 | 3.3087224502121107e-22 | 8.881784197001252e-16 |
| complexation | PASS | 6 | 5.2764934890987825e-15 | 3.4445513108494197e-10 |
| precipitation | PASS | 3 | 3.496768846700249e-15 | 1.1388046061711066e-10 |
| redox | PASS | 5 | 1.9481757786848908e-20 | 1.7763568394002505e-15 |
| fixed-activity | PASS | 0 | 6.505213034913027e-19 | 0 |

All five preserve imposed activities, satisfy the existing regression contract and pass independent scientific checks. The precipitate is present/saturated with balanced amount. C(e−)=0 in the redox case. Zero iterations for all-fixed-activity cases is expected: direct mass action determines their products and output totals without solving balance unknowns.

Golden fixture SHA-256 remains `aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`. A test enforces this exact original hash. The Java harness remains available, but replacing existing references now requires the deliberate `--replace-golden` argument. It was not invoked during Phase 5.

## 20–21. Additional tests and failures

Synthetic constants occur only in clearly labeled mathematical tests. Coverage includes free components, analytic one-reaction behavior, mixed kh constraints, signed/zero proton totals, signed electron totals, 1e-250 concentration, deterministic repeated solves, immutable arrays, mass action and balance reconstruction, absent/present/saturated solids, impossible fixed reservoirs, duplicate/missing constraints, duplicate species/components, malformed coefficients, false special flags, unsupported phases/multiple solids, unit/model rejection, overflow, underflow, singular Jacobians, iteration-limit failure and unsupported zero-activity boundaries.

Session tests cover real repository-style preparation, changed constants, detectable dependent basis choices, missing source terms, scientific identity changes, stale revisions, wrong input IDs, forged/cloned results, result invalidation and persisted-result rejection. A successful numerical result is committed only when it was produced by this solver, passed scientific checks and matches the pending prepared/input identities and current session revision.

Failures retain typed codes and per-assemblage diagnostics rather than a plausible-looking composition. Examples include unsupported-basis-transformation, thermodynamic-data-unavailable, unit-incompatibility, invalid-constraint, singular-or-ill-conditioned, numerical-nonconvergence, overflow/underflow, no-consistent-solid-assemblage and underdetermined-solid-inventory. No failed point is stored as CalculationResult.

## 22–23. Verification and browser behavior

All existing Phase 1–4 tests remain active. All **49 tests pass**, with zero failures or skips; `npm run build` and `npm run lint` pass. The final production JavaScript is 271.62 kB before gzip (83.74 kB gzip). No golden output or Phase 4 tolerance was changed. Production bundle inspection confirms that official Java sources/classes and test reference fixtures are outside the browser dependency graph.

Browser verification used the existing imported `.local/spana-components.json`: selected OH− with H+/H2O source components, fixed pH 7, ideal activity model, 25 °C. The UI displayed H+=1.00000000000e−7, OH−=9.96552080135e−8 and logA(OH−)=−7.00150000000, with successful residual checks. Changing temperature to 30 °C cleared the accepted result immediately; calculating again returned a structured unsupported-conditions diagnostic. No browser console errors were observed.

The UI contains numerical tables only. It clearly separates component totals/dissolved amounts, source units, special bookkeeping zeros and hypothetical solid saturation. The System button performs draft checks; real points are prepared and calculated in the Calculation workspace. Diagram settings remain declarative future inputs, not displayed curves.

## 24. Performance and reuse

The local benchmark script measures a first solve and 100 repeated identical-input solves per case; these are timing observations, not a sweep. Observed means were roughly 0.01–0.11 ms per point on this machine, excluding preparation, JSON loading and browser rendering. Timings vary and the detailed generated report records the latest run.

Prepared immutable identities, coefficient rows, constants and index arrays can be reused across point inputs with the same basis/reference conditions. Changed totals/activities create a new PointEquilibriumInput. Changed basis, products, source constants or supported reference conditions require re-preparation. Mutable Newton arrays are internal to each call; no warm-start state leaks between solves. Repository snapshot loading/preparation can dominate these tiny point times. No sweep orchestration or premature cache optimization was added.

## 25. Independent implementation and licensing boundary

The production method was designed here from signed mass action, component balances, the pure-solid complementarity formulation, standard Newton/Jacobian algebra and the documented Phase 3/4 interface. No HALTAFALL function, loop structure, solid-search procedure or Java implementation was ported, translated or mechanically rewritten. The official implementation remains a previously captured external numerical oracle; it is not loaded by production JavaScript or required for normal use/tests.

No application license change was made. Prior GPL source and thermodynamic redistribution observations still apply separately. Local source data and reference fixtures were not published or deployed during this phase.

## 26. Remaining scientific/numerical issues

Five restricted ideal reference cases and mathematical invariants do not validate a general-purpose chemical engine. Arbitrary redox closure/basis changes, multiple solids, exact zero-activity boundaries, gas balances, nonideal activity models, density conversion, thermodynamic temperature/pressure evaluation, broad conditioning guarantees and phase-onset refinement remain unsupported. Damping can fail from a poor initial estimate even when another numerical approach might find a root; such cases return inspectable failure rather than fabricated convergence.

Preparation detects direct dependencies but does not prove general chemical independence or database completeness. The selected species set is exactly the set solved; excluded species can change real chemistry. Reference-pressure metadata remains incomplete where the source did not supply it. The matrix pivot heuristic is not a rigorous conditioning bound. Scientific diagnostics and scope warnings remain part of every result.

## 27. Recommended Phase 6 — for review, not started

Review the Phase 5 method and numerical comparison first. A bounded next phase could expand point-level robustness and independent oracle cases (dilution limits, boundary/near-saturation cases, difficult signed balances and stronger input validation) before any diagram workflow. Agree on the next supported domain explicitly. Subsequent sweep orchestration should call this point boundary with revision/cancellation handling and retain failed-point diagnostics; renderer and AnalysisEngine must consume validated results only.

Stop point respected: no pH/Eh/total sweeps, diagrams, Pourbaix grids, 3D surfaces, optimization, nonideal model or general DBSearch closure was implemented.
