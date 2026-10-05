# Phase 8.3 — automatic repository-compatible reaction sets

Completed 2026-09-06 in the existing React/Vite project. Phase 9 was not started.

## Baseline and scientific boundary

Inspected the Phase 8/8.1/8.2 reports, repository/schema, component/species selection, session updates, custom-record normalization, preparation, calculation workspace, plots and related tests before editing. Baseline: **111 tests passed**, all five unchanged golden cases, build/lint/audit passed. The production audit counted 5 artifacts and 391,933 bytes; the build transformed 81 modules.

The user-observed problem was real: selecting carbonate, proton and solvent still required ordinary product checkboxes. The modern workspace now constructs aqueous membership from source reactions. The legacy manual initializer remains available for compatibility and independent equivalence testing.

No point-solver equations, balances, active sets, conditioning checks, tolerances, constants, golden fixtures, coordinate transforms or unit rules changed. Preparation still enforces explicit-direct, ideal, 25 °C, declared 1 bar, mol/kg-H₂O, at most 16 components, 128 products and one candidate pure solid. Source reference pressure stays unknown where absent. Direct compatibility is not a completeness claim or a general independence proof.

## Architecture and inclusion policy

`thermodynamics/compatibility.js` indexes nondeprecated records and resolves selected component IDs to exact source names. Every nonzero signed formation term must refer to a selected component, including required special/water components. Zero terms introduce no dependency. Missing, duplicated or nonfinite terms and missing/nonfinite constants are ineligible. Product formulas, element associations, oxidation-state guesses and substrings never establish membership. Products are not recursively promoted to basis components.

`formationSupport.js` shares the existing source-eligibility predicate with preparation. Imported records retain their supported convention, original constant and reference temperature; custom records use existing raw-record validation. Preparation still checks basis dependencies and the combined solver domain. Discovery does not truncate a large set or choose a solid to make preparation pass.

Modern sessions opt into `speciesPolicy: repository-compatible-v1`. `selectedSpecies` materializes the membership passed to preparation. Separate `excludedSpecies` and `optionalSpecies` arrays retain deliberate aqueous exclusions and solid choices. Compatible supported aqueous records enter automatically; solids require explicit inclusion. Multiple deliberately chosen solids retain the typed `unsupported-solid-assemblage` rejection. Gases and nonsolvent liquids stay unsupported.

Component/phase changes rebuild membership. Repository replacement rebuilds it against new source records. Exclusions survive temporary component removal; restoring that component does not undo the exclusion. New system clears choices but retains the policy. Reset calculation retains chemistry. Drafts remain in memory, as in Phase 8.2; workspace persistence is not introduced.

Element focus/selection is discovery only: it neither removes chosen components nor increments scientific revision. Chemistry exclusions increment revision, clear current results and retain the old plot as stale. `visualizationState.plot.visibleIds` remains view-only and cannot affect membership or numerical results.

## Review and error states

The species browser is now **Review reaction set**: search, phase filter, pagination, and optional inspection of records requiring other components. Rows distinguish automatic products, user exclusions, optional solids, unsupported records, missing terms/components and basis/solvent identities. The existing inspector exposes signed terms, log K, convention, reference conditions, citations and original provenance. Reduced reaction sets are explicitly labeled.

Empty-set messages distinguish no compatible records, unsupported/not-included records and explicit exclusions. Structural preparation failures remain separate readiness diagnostics. System and Calculation counts come from the same derived set. Continue uses existing structural preparation without product selections or fabricated numeric conditions.

Shown species offers search, individual toggles, show/hide all, free-basis and automatic aqueous-product presets. Optional solid curves remain accessible individually and through show all. Visibility is never an exclusion operation.

## Acid–base, user records and redox

H₂O remains solvent, not a duplicate product. H⁺ remains a special component underlying the existing pH transform. Fresh startup retains the proton default; New system clears nonsolvent choices, allowing explicit H⁺ selection.

OH⁻ is included from the actual source record's negative proton and positive water terms through the normal preparation path. There is no UI Kw or OH⁻ name-based inclusion rule. “Proton/solvent equilibrium” is a view classification derived from component roles and terms, not a new thermodynamic category. The regression renames this test product and changes formula labels without altering membership/classification.

User-defined records use the same compatibility algorithm after their existing validation, and remain **USER-DEFINED / UNVERIFIED**. Source edits/removals invalidate results and caches. No custom solver path exists.

Electron-dependent records require the selected electron component. The local carbon solid requiring electrons is unavailable with carbonate/H⁺/water alone. No missing redox basis, oxidation state, general closure or basis substitution is inferred.

## Equivalence and regression tests

The local test independently builds an old explicit four-product system and a new component-only system. Both contain CO₂(aq), H₂CO₃, HCO₃⁻ and OH⁻ and run pH 0–14, 51 samples, total carbonate 0.001 mol/kg H₂O, ideal 25 °C and declared 1 bar.

**Both converge at 51/51 points.** Prepared systems, point inputs, concentration/log-activity arrays and statuses are exactly equal under deep comparison. No tolerance was widened. A portable custom-source test independently compares prepared systems and point concentrations. The local regression explicitly skips only when the locally licensed snapshot is unavailable; it ran here. Imported/custom compatibility is also tested with the retained official fixed-activity constant.

Eleven new tests cover exact dependencies; multi-component selection; discovery/chemistry/visibility separation; exclusions, restoration and stale plots; cache replacement; deliberate solids and typed rejection; old/new equivalence; new/reset behavior; imported/custom records; unavailable data/phases; landmarks/density; label fallback; and real carbonate/Ca/electron dependencies. Existing free-versus-total, live-generation, boundary and earlier scientific tests remain unchanged.

Final: **122 tests passed, 0 failures, 0 skipped**. The five unchanged golden cases pass: acid-base, complexation, precipitation, redox and fixed-activity. The permanent unconstrained-electron regression passes. Golden SHA-256 remains `aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`.

## Graph refinements

Logarithmic bars show decade landmarks and the current `log10 C` caption beside the exact numeric input. The current integer decade receives priority: 0.001 visibly aligns with −3; neighboring labels yield space. Caption rounding never feeds back into chemistry. Numeric entry and the existing 350 ms debounce/cancellation/generation checks are unchanged.

`logGridTicks` derives label spacing from physical plot height with a 24 px target. Integer grid lines remain between major labels where practical. Extreme spans coarsen the grid and bound allocation; fractional zooms retain fractional ticks. The existing `axisTicks` API/tests remain intact. At the actual browser viewport, the carbonate range −22 to 2 used labels every three decades and all intervening integer lines; −3 was explicitly labeled. Taller plots admit more labels.

Direct labels retain exact sampled anchors and leaders with minimum vertical separation and maximum displacement of three label spacings. More than eight labels or an unsatisfiable placement uses the Shown species legend with an SVG notice. No curve values are moved or interpolated. Free carbonate and analytical-total condition labels remain distinct in graph and exports.

## Performance

Measured locally with Node on the 4,445-record snapshot after repository construction. Observational timings, not correctness thresholds:

| Operation | Time |
| --- | ---: |
| Cold immutable catalog/index and initial discovery | 257.50 ms |
| Carbonate component-selection session update | 7.22 ms |
| Uncached discovery, mean of 100 alternating exclusion sets | 5.89 ms |
| Compatible browser text filtering, mean of 1,000 runs | 0.173 ms |
| Cached reaction-set/summary refresh, mean of 1,000 runs | 0.0097 ms |

A WeakMap keyed by immutable repository instance retains one frozen catalog and one most recent selection result. Its key includes component IDs, phases, solvent ID and explicit choices. Source replacement cannot inherit an old cache. Preparation shares the catalog instead of cloning the full source for dependency scans. Component selection bypasses legacy element-filtered full-species reconciliation. Filtering uses cached rows and displays 50 initially. The first index has a measurable one-time cost; custom-source composition still has its Phase 8.2 cloning cost. No unbounded history cache is kept.

## Built-in browser verification

Verified a fresh tab at `http://127.0.0.1:5173/adambritts-site/laboratory/`:

1. Snapshot auto-loaded: **Database ready · 4,445 species records**.
2. New system → C → carbonate → explicit H⁺, with H₂O solvent. No ordinary product selections. Four aqueous records auto-included; OH⁻ labeled proton/solvent equilibrium. CO₂(g) unsupported and nonselectable.
3. Review exposed actual signed OH⁻ formation terms and source/reference fields. Review closed normally and Continue was enabled.
4. pH 0–14/51, total 0.001. Numerical export confirmed **requested 51, converged 51, failed 0, notRun 0** and the four expected products. Inspected integer grid, separated endpoint labels and distinct free-carbonate/total-condition labels.
5. Hiding HCO₃⁻ retained revision **5**, four products and nonstale results. Excluding it advanced to **6**, three products and retained plot revision 5 with `stale: true`. Restored it explicitly.
6. Native pointer drag changed total to 0.003981071705534973 and caption to −2.4. Graph remained visible with an updating/stale message, then updated automatically. Typed `0.0012345678901234567` was preserved in both input and calculated-condition metadata.
7. Adding Ca²⁺ produced seven aqueous records: original four plus CaCO₃(aq), CaHCO₃⁺ and CaOH⁺. Four compatible solids stayed unselected. CaCO₃ inspection showed explicit calcium-plus-carbonate terms. Removing Ca²⁺ restored the four-product set.
8. Restored 0.001 and observed explicit −3 bar label. Basis/product visibility presets retained revision **19**, selecting two free basis curves/four aqueous product curves. Restored show all. Browser console reported no errors.

The development tab remains open with carbonate curves. Export data were inspected through the existing panel; this report does not claim an automatic filesystem download was verified.

## Build and production boundary

`npm test`, `npm run build`, `npm run lint` and `node scripts/audit-production-boundary.js` pass. Base remains `/adambritts-site/laboratory/`. Dependencies, Vite configuration and deployment setup are preserved. Audit verifies absence of local source data, paths/fingerprints and development endpoint from distributable artifacts. The snapshot remains ignored and local; no licensed default database was bundled or published.

Final build: 84 modules, 291 ms; JavaScript 360.71 kB (109.80 kB gzip), CSS 22.99 kB (5.57 kB gzip). Final audit: 5 files, 398,810 bytes, `localSourceAbsent: true`. Final full test duration: 2,277.47 ms.

## Files changed

- Added `src/thermodynamics/compatibility.js`, `src/thermodynamics/formationSupport.js`.
- Updated `src/chemistry/system.js`, `src/session/laboratorySession.js`, `src/solver/prepareSession.js`.
- Added `src/components/ReactionReview.jsx`; updated `src/App.jsx`, `src/components/SelectedSystem.jsx`, `src/components/CalculationWorkspace.jsx`. Former `AvailableSpecies.jsx` is retained outside the active workspace import graph.
- Updated `src/components/PlotWorkspace.jsx`, `src/components/FixedCondition.jsx`, `src/components/usePlotBox.js`, `src/App.css`.
- Added `src/plots/logLandmarks.js`; updated `src/plots/geometry.js`, `src/plots/labels.js`, `src/plots/export.js`.
- Added `tests/phase83.test.js` and this report; updated `README.md`, `docs/scientific-architecture.md`.
- Regenerated ignored `dist/` with the existing build. No golden files, snapshot, package files or deployment configuration changed.

## Limitations and Phase 9 prerequisites

Repository compatibility is not complete closure or a general independence certificate. Large sets and multiple deliberate solids can fail preparation rather than silently lose reactions. Invalid/incomplete source metadata stays unsupported. Workspace persistence, faster large custom-source composition, mobile publication-quality plots and independently validated arbitrary redox/basis transformations remain future work.

Pre-existing Phase 8 sampled-grid functionality remains unchanged. No new F(X,Y), Pourbaix, 3D or nonideal implementation was added. Before Phase 9: define requested F(X,Y) quantities/domains; establish independently sourced 2D benchmarks and failed-cell criteria; retain revision/source/export identities across axes; validate proposed phase classification separately from inventory dominance. Expanding basis, phase or activity-model support needs independent scientific formulation and validation first.
