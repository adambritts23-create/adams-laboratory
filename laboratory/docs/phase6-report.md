# Phase 6 — point hardening, validated 1D sweeps and user equilibria

Date: 2026-09-06 (local). Phase 6 implemented within the restricted ideal domain. No Phase 7 work, diagrams, new thermodynamic constants, nonideal models or Java solver port was introduced.

## 1. Exact files added or changed

Added in Phase 6:

- `src/calculations/sweep.js`: validated immutable sweep requests, independent point orchestration, cancellation and outcomes.
- `src/thermodynamics/userEquilibria.js`: raw user-record validation, source normalization, repository composition and versioned source-only interchange.
- `src/components/UserEquilibria.jsx`, `src/components/SweepResult.jsx`: minimal source-entry and numerical-inspection UI.
- `tests/phase6Helpers.js`, `tests/pointHardening.test.js`, `tests/sweep.test.js`, `tests/userEquilibria.test.js`: independent mathematical/integration checks.
- `scripts/audit-phase6-underdetermined.js`: retained audit counterexample, now asserting successful rejection.
- `scripts/report-phase6-sweeps.js`, `scripts/audit-production-boundary.js`: reproducible timing/residual evidence and static production graph/bundle checks.
- `docs/phase6-performance.json`: measured timings and full-precision endpoint concentrations.
- `docs/phase6-report.md`: this final report, replacing the initial interruption report.

Modified existing files:

- `src/solver/point.js`: acceptance conditioning gate, method version 1.0.1 and exported method identity.
- `src/solver/prepareSession.js`: reuse preparation for sweeps; validate user source records; retain known reference-pressure metadata and omit nonexistent database hashes.
- `src/thermodynamics/validation.js`: explicit unverified user provenance and unknown charge/composition support.
- `src/thermodynamics/repository.js`: lightweight identity query for collision checks without copying full raw source payloads.
- `src/session/laboratorySession.js`: sweep request/result identity checks, source-edit invalidation and persisted-result rejection.
- `src/App.jsx`: composed user data, execution controls and revision invalidation.
- `src/components/CalculationWorkspace.jsx`: sweep/cancel actions and numerical outcomes.
- `src/components/AvailableSpecies.jsx`: visible user-defined/unverified labels.
- `src/components/ComponentSelector.jsx`: accurate restricted pe/Eh capability description.
- `tests/pointSolver.test.js`: permanent underdetermination regression with valid controls.
- `README.md`, `docs/scientific-architecture.md`: current workflow, architecture and verification commands.

`dist/` was rebuilt. No package/dependency, Vite configuration, original database installation, official golden fixture, historical Phase 3–5 report, or tolerance contract was changed. The previous interrupted run had added the audit script and interruption report; these were reused and updated, not duplicated.

## 2. Phase 5 audit and authorized resumption

The initial audit reproduced all 49 existing tests, including the five official Java comparisons and exact golden SHA-256 assertion. Build and lint passed. Scientific acceptance and golden comparison remained separate code paths.

Hardening exposed an electron-only system with no products and kh=1 total zero. Suppressed C(e-)=0 means its balance is r(x)=0 for every electron log activity x, with derivative zero. The old solver accepted the fallback initial log activity -7 in zero iterations as scientifically passed. No thermodynamic constants were needed for this counterexample. The work stopped under Section B and was reported. The user then explicitly authorized a conservative correction and continuation conditional on unchanged valid benchmarks passing.

After the correction, all 50 then-current tests passed, including the new regression and all five unchanged official cases. No deeper formulation problem or valid benchmark failure was exposed by this correction. Phase 6 resumed only after that gate passed.

Golden SHA-256 remains:

    aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960

## 3. Scientifically necessary point-solver change

`solveAssemblage` now assembles and checks the actual constrained Jacobian before accepting residual convergence, including at iteration zero and at the iteration limit. It reuses the existing partial-pivot linear routine and unchanged pivot threshold. No equations, initialization, damping, mass-action formula, phase search or numerical tolerance were redesigned.

The counterexample now returns `ok:false`, `status:'failed'`, `result:null`, diagnostic `singular-or-ill-conditioned`, and no calculated activity arrays. The same applies with an additional ordinary component whose total is already balanced. Fixed electron activity and ordinary free-component identity balances remain valid without product rows. Existing signed proton-zero and electron-total cases remain valid. There is no electron-specific rejection branch or benchmark-specific chemistry logic.

A fully fixed-activity point has no unknowns and needs no Jacobian constraint; the existing zero-size linear boundary remains valid. The check is a conservative local numerical conditioning gate, not a proof of global chemical basis independence or uniqueness. Known difficult systems can still fail explicitly.

Method version is now 1.0.1. Three tolerance layers remain distinct and unchanged:

- Iteration: scaled residual <=2e-13; solid saturation <=1e-12.
- Scientific acceptance: existing component-balance bound, aqueous mass action <=1e-10 log units, exact imposed activities, nonnegative solid amount and complementarity.
- Golden regression: concentration absolute 4e-14 plus relative 2e-10; log activity 1e-8. Golden comparison never stops Newton.

## 4. Hardening cases and evidence types

All five official/oracle cases remain permanent and unchanged. New cases are explicitly mathematical or application-integration tests, not fabricated official references.

| Investigation | Evidence |
| --- | --- |
| Underdetermined zero residual | Structural electron-only counterexample and electron-plus-ordinary variant; typed rejection, no activity output |
| Dilution / trace concentration | Synthetic one-product beta=1 equation m_free=T/2 at totals 1e-3, 1e-9, 1e-30, 1e-100, 1e-250, 1e-300; relative check <=1e-12 |
| Single-solid onset | Synthetic logBeta=3 and coefficient 1; totals 1e-3*(1-1e-8), 1e-3, 1e-3*(1+1e-8); absent, saturated-zero-amount and present statuses; analytical solid amount max(0,T-1e-3) |
| Signed proton balances | Synthetic m_H - 1e-14/m_H = T at -1e-3, -1e-9, 0, 1e-9, 1e-3; stable quadratic root, relative check <=1e-11 |
| Awkward initialization | Synthetic beta=1e30, T=1e-3; expected m_free=T/(1+beta), about 1e-33; converges from a log estimate thirty decades away |
| Mixed kh=1/kh=2 | Retained point controls and new TV/LTV sweeps with the other component held at fixed activity |
| Repeated solves | Exact repeated point results and repeated sweep outcomes with different chunk sizes |
| Singular/dependent boundaries | New initial-root rejection, retained nonzero inconsistent electron total and detectable dependent-basis preparation rejection |
| Range / exact zero | Retained free-activity overflow/underflow and zero-total rejection; added product exponent +/-400 failures; TV zero coordinate retained as typed failure |
| Malformed preparation | Null/incomplete structures, retained malformed coefficients, cloned/unbranded objects, wrong identities and missing constraints |
| Stale results | Existing point safeguards plus sweep wrong-definition, changed-revision, forged-result, source-edit and deserialization tests |
| Independent science | Reconstruct balances and aqueous mass action from output amounts, signed coefficients and actual input targets; reconstruct solid saturation independently of result residual fields |

Synthetic constants exist only in verification fixtures. No demo database constants were added. The five official source systems also underwent 8,270 sweep-point residual reconstructions in the performance script. These new coordinates are invariant checks, not additional Java golden captures.

## 5–9. Sweep architecture, coordinates and sampling

The path is:

    selected repository records -> shared conservative preparation
      -> PreparedChemicalSystem
      -> createSweepDefinition(CalculationDefinition, revision)
      -> ordered createPointInput calls -> unchanged point formulation
      -> full ordered outcomes -> immutable SweepResult

The numerical point solver does not import the sweep, repository, UI or golden fixtures. A prepared system is reused across a sweep. Every point starts independently; there is no warm-start state, second solver or chemistry inside table rendering.

SweepDefinition contains the complete calculation definition, axis/component ID, mode, quantity/unit, start/end, point count, fixed conditions, requested coordinates, prepared/source identity and scientific revision. A canonical SHA-256 content identity and factory brand prevent unvalidated definitions from being executed.

Only one TV/LTV/LAV axis executes. Other constraints remain fixed T/LA. Conditions stay ideal, 25 C, declared 1 bar, mol/kg-H2O, direct basis, at most one candidate pure solid. Molarity, nonideal models, finite fixed ionic strength, other temperatures/pressures, multiple axes and disabled prepared phases are rejected. The phase selector may retain an unused gas category, but a gas product cannot enter the prepared numerical system.

| Axis mode/quantity | Per-point solver value |
| --- | --- |
| TV | kh=1, total=display coordinate |
| LTV | kh=1, total=10^display coordinate, in mol/kg-H2O |
| LAV log-activity | kh=2, logA=display coordinate |
| LAV pH | kh=2, logA(H+)=-pH |
| LAV pe | kh=2, logA(e-)=-pe |
| LAV Eh | kh=2, logA(e-)=-Eh*F/(R*ln(10)*(T_C+273.15)) |

Eh uses the existing EC constants R=8.31446261815324 and F parsed from 96485.3321233100184, with volts versus SHE. pH/pe are dimensionless. No physical constants were changed.

As in Phase 4, display bounds must increase. Descending display requests are explicitly rejected. Increasing pH/pe/Eh yields decreasing solver log activity: endpoints are never reordered after transformation. Inclusive endpoint values are assigned exactly; interior coordinates use weighted linear interpolation. IEEE-754 interior rounding is retained, not cosmetically changed. N is an integer 2–10000 within the declared sampling budget. A valid N-point definition always produces N ordered requested positions, including failures or unrun positions.

## 10–12. Outcomes, cancellation, revision and schema

Each outcome retains index, requested coordinate, transformed source coordinate (hur/kh/field/value) when available, immutable point input when available, status, scientific acceptance, full point result or typed failure, and diagnostics. A failed interior TV zero point remains at its original index; neighboring successes cannot silently replace it. A transformation failure retains its requested coordinate with unavailable input.

SweepResult schema version 1 includes kind=sweep, systemId, sweepId, revision, sourceIdentity, full definition, coordinates, transformedCoordinates, outcomes, counts, unit, method/version, warnings and explicitly non-scientific elapsed/input-preparation/solving timings. It is recursively frozen and internally branded. It is not a set of plotted Y arrays. Full point concentrations, activities, totals, dissolved amounts and solids remain available for future separately validated output transformations.

Run states are `completed`, `completed-with-failed-points`, `cancelled`, and `invalidated-stale`. Invalid definitions/preparation have a separate structured failure boundary (`definition-preparation-failure` from the sweep factory; shared preparation returns its existing diagnostic envelope and the UI labels preparation failure). Individual outcomes are `converged`, `failed`, or `not-run`; cancellation is never counted as numerical failure.

AbortSignal and a current-revision predicate are checked between independent points. The engine yields every 20 points by default (configurable 1–100); it never interrupts Newton halfway through a point. An in-flight point may finish before cancellation takes effect. All remaining coordinates are retained as not-run with cancellation/stale diagnostics. Staleness takes priority when both conditions apply.

Session commit requires an internally produced result and exact pending system, sweep identity and scientific revision. A stale run cannot commit. Cancelled partial runs may be inspected with their explicit status. Chemistry, calculation or user-source edits increment revision and clear results/requests; UI execution is invalidated immediately. Persisted point/sweep results and pending requests are discarded. Calculation and System views continue to share the same session.

## 13. Performance observations

`node scripts/report-phase6-sweeps.js` measures 51, 101, 501 and 1001 points for each of the five reference source systems. All 20 sweeps completed and all 8,270 points passed independent reconstructed residual checks. Numerical preparation (including the initial reference input) is measured separately from sweep-definition creation, per-point input creation and point-solving time. Full repository loading is excluded and explicitly not claimed to have this latency.

Observed local Node elapsed ranges, including cooperative yields:

| Requested points | Elapsed across the five systems |
| ---: | ---: |
| 51 | 25.7–40.3 ms |
| 101 | 59.2–76.1 ms |
| 501 | 371.4–390.8 ms |
| 1001 | 749.5–788.7 ms |

Numerical preparation was approximately 0.79–6.59 ms. At 1001 points, accumulated solver time was about 33.2–271.9 ms; the remainder includes input hashing, scheduling/yield overhead and orchestration. This is measurement, not a browser latency guarantee. Full precision timings and endpoint values are in `phase6-performance.json`; one prepared system per case was reused.

A slow full-snapshot JSON re-import observed in browser verification prompted a small data-access correction: collision validation now queries lightweight identities, and import/export validates raw collections without redundantly rebuilding the composed repository. No numerical cache or warm-start was introduced. Full source loading/composition can still take longer than the tiny point solves.

## 14–19. User equilibrium architecture, schema and persistence

User-defined records using existing source components are implemented. They join imported records in the repository, are explicitly selected in ChemicalSystem, and travel through the same preparation, PreparedChemicalSystem, point solver and sweep engine. Source-specific validation belongs to preparation/source adaptation, not the numerical solver.

Raw schema version 1 fields are: stable `user:` application ID; explicit productId and displayName; phase; charge integer or null; signed nonzero `{componentId, coefficient}` terms; finite logK; temperatureK; pressureBar or null; referenceState; sourceType=user-defined; citation/notes text or null; createdAt/modifiedAt. Unknown fields, including calculated results, are rejected. Raw objects are retained in normalized metadata/provenance without changing coefficients or constants.

The supported declaration `ideal-molal-formation` means one named product formed from the signed explicit source components using the existing dimensionless log10 formation convention and molal ideal activity standard state (pure solid activity one when present). Reference temperature must be 298.15 K; pressure can be explicitly 1 bar or unknown null. Unknown pressure is preserved and warned about; the calculation's declared 1 bar does not fill in missing metadata. Known 1 bar is retained. No uncertainty estimate, charge, atom count or activity coefficient is invented.

Normalized records retain user-defined/unverified provenance, source identity, raw values, exact effective terms, and derived validation/provenance states. Valid records are structurally-valid-restricted; a missing citation is provenance-incomplete, and an entered citation is user-attributed-unverified. A citation is not database verification. Invalid or unsupported raw records return diagnostics and never enter preparation. Imported records keep their separate imported provenance. The browser marks user records explicitly and exposes the full normalized record.

Validation rejects NaN/infinite/missing constants, missing/duplicate/zero/nonfinite terms, unknown components, unsupported phases/reference states/temperatures, and colliding product names or IDs. The policy conservatively rejects collisions across the composed catalog, not just selected records; alternatives require explicitly distinct identity or removal of the conflicting user record. Product identity is explicit user text: names are not parsed to infer atomic composition or chemical equivalence. Whitespace-insensitive identity collision checks do not normalize reaction science. General alias resolution remains unsupported.

Discovery uses existing component-element associations. Water's source pseudo-element XX is not a real element; its discovery links use the repository's explicit water composition. Unknown links stay unresolved. Discovery metadata never becomes an atom-balance matrix. Preparation requires every nonzero term to belong to the selected basis and rechecks raw versus normalized scientific fields. Arbitrary new components, basis transformations, reaction scaling and redox closure are rejected/unimplemented.

End-to-end proof: the existing AgCl source logK 3.31 and signed Ag+/Cl- coefficients (1,1) are copied into an explicitly user-defined test record with a distinct testing identity. At fixed logA(Ag+)=-6 and logA(Cl-)=-3, the ordinary production path gives the same concentration array as the imported path. Independent mass action predicts:

    m_product = 10^3.31 * 1e-6 * 1e-3 = approximately 2.04173794466953e-6 mol/kg-H2O

The custom source also runs through shared session sweep preparation and the real sweep engine. Tests assert unchanged raw values, different provenance/system identity, malformed-record rejection, tampered normalized-value rejection, selected-basis enforcement and source-edit invalidation. No special test solver branch exists.

Versioned JSON uses `{kind:'adams-user-equilibria', schemaVersion:1, records:[...]}`. Import validates the envelope and all raw records against the current component registry; calculated-result/session fields are rejected. Export contains source data only. The minimal UI supports copy/paste save and replacement import, plus adding/removing records. Reloading or changing the database resets the in-memory collection; export first. There are no accounts, automatic storage, cloud services or backend. Programmatic replacement preserves stable IDs and accepts explicit modified timestamps; a full record-editing interface is deferred.

## 20–22. Final verification and static deployment

The full suite contains 67 tests: all 49 Phase 1–5 tests retained plus 18 Phase 6 tests. The standalone underdetermination audit now passes by asserting typed failure. Five original official cases and the exact golden hash remain protected by the existing tests. Build/lint and the production-boundary script are run separately; see the final verification record below.

Final verification record: `npm test` passed **67/67, zero failures/skips**; `npm run build` and `npm run lint` passed. `node scripts/audit-phase6-underdetermined.js` passed with the expected singularity diagnostic. `node scripts/audit-production-boundary.js` passed (38 application modules/assets, only react and react-dom/client external runtime imports). The final Vite build transformed 51 modules and emitted JavaScript `index-MpFHcdfU.js` at 289.74 kB (88.83 kB gzip), CSS `index-4Q4qaGiB.css` at 4.87 kB (1.61 kB gzip), and `dist/index.html`. No browser console errors were observed. Performance evidence is the separate 20-sweep run described above, not an inflated npm test count.

Recomputed differences from the unchanged official values after the final solver fix:

| Official case | Maximum concentration difference (mol/kg-H2O) | Maximum log-activity difference |
| --- | ---: | ---: |
| acid-base | 3.3087224502121107e-22 | 8.881784197001252e-16 |
| complexation | 5.2764934890987825e-15 | 3.4445513108494197e-10 |
| precipitation | 3.496768846700249e-15 | 1.1388046061711066e-10 |
| redox | 1.9481757786848908e-20 | 1.7763568394002505e-15 |
| fixed-activity | 6.505213034913027e-19 | 0 |

Browser verification used the real local `.local/spana-components.json` at the unchanged Vite base:

- Imported OH- with H+/H2O and a 51-point pH 6–8 sweep: 51 converged; endpoints logA(H+)=-6 and -8. At pH 7, H+=1e-7 and OH-=9.96552080135e-8 mol/kg-H2O, logA(OH-)=-7.0015.
- Cancelled 1001-point sweep: observed 200 converged, zero numerical failures, 801 not-run, with all 1001 positions retained. Counts are timing-dependent; the representation is deterministic for the actual interruption point.
- Edited temperature during a running sweep: old results did not become current. Restored 25 C for subsequent checks.
- Entered an unverified user hydroxide test record using the retained source constant -14.0015, terms H+:-1 and H2O:+1, and an explicit test citation; deselected the imported OH- record and selected the custom record. Its 3-point pH 6/7/8 sweep reproduced the same midpoint amount and activity.
- Deliberate floating-point stress range pH 6/203/400: the last requested coordinate remained present with typed underflow; this is a numerical boundary test, not a physically realistic ideal-solution prediction.
- Exported and re-imported the source-only user JSON, preserved stable ID/raw values, invalidated prior results and recalculated successfully.
- Inspected dark-theme numerical tables and point selection visually; no browser console errors observed.

No Java oracle source/classes, golden fixtures or server module is reachable in the static source graph. The automated graph audit begins at src/main.jsx, checks every static import, permits only react and react-dom/client external runtime imports, and checks built JavaScript for oracle/fixture markers. Source-specific import metadata is application data handling, not a Java implementation port. Vite base remains exactly `/adambritts-site/laboratory/`. No deployment was performed or deployment configuration changed.

## 23. Licensing boundary

The independent implementation boundary is unchanged. The only numerical change moves the existing conditioning check before convergence acceptance. No HALTAFALL or other GPL code was copied, translated or mechanically rewritten. The existing external/local Java oracle was not rerun or bundled. Source-data fixtures retain provenance; database redistribution rights remain a separate question from software licensing. No application license or dependencies changed.

## 24. Unresolved limits

The conditioning gate is local and conservative, not a general proof of basis validity. Exact-zero activity reduction, general chemical identity/alias/composition validation, arbitrary new components, thermodynamic cycles, redox closure, multiple solids, gas fugacity, molarity conversion, nonideal models and general T/P evaluation remain unsupported. Data-entry validation does not establish empirical accuracy or completeness. Subnormal/numerically ill-conditioned systems can return explicit failure even if another algorithm might find a root.

Sweeps are inclusive increasing display-coordinate samples, not phase-onset refinement. Numerical tables expose full point results but no fraction, solubility, redox-output transformation, predominance classification or diagram is claimed implemented. Cancellation occurs at the orchestration boundary, not inside a point solve; source import and large debug rendering still run on the main browser thread. The 10000-point cap bounds work but is not a performance guarantee for maximum-size systems. No hidden warm-start or analysis/optimization engine exists.

## 25. Recommendation for Phase 7

Review this restricted scientific/data boundary first. Phase 7 should specify and validate derived 1D output quantities and a renderer that preserves failed/cancelled gaps and revision identity, using the separately supplied visual references. Include numerical transformation tests and data/provenance display requirements before polished plotting. General component/alias identity and nonideal or multiphase extensions require separate scientific contracts and references; they should not be smuggled into visualization work. Stop here for review before beginning Phase 7.
