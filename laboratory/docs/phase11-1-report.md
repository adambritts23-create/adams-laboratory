# Phase 11.1 — output completeness and grid diagnostics

Completed 6 September 2026. No Phase 12 work or deployment was performed.

**Solver mathematics, iteration limits, acceptance tolerances, thermodynamic constants and golden fixtures are unchanged.** No equilibrium value is repaired, clamped, interpolated or smoothed. No uranium-specific code or operating-condition guidance was added.

## Audit findings and root cause

The Phase 11 application already had linear/log total-dissolved outputs internally **and in the shared toolbar used by 1D, 2D and 3D**. Their absence from the F species dropdown did not mean the formula was missing: that dropdown selected a species, while component outputs required changing the separate Output quantity and Inventory component selectors. This separation was poorly explained.

The audit covered CalculationDefinition, output derivation, AnalysisEngine, toolbar and F selection, accepted component sums, exact inspection, numerical export, scalar-map preparation and Surface3D preparation. Specific gaps were:

- The legacy `CalculationDefinition.output` did not validate the currently selected visualization F identity. A whole grid could run before revealing an absent/incompatible F selection.
- Output definitions described quantity types but lacked a common per-series descriptor distinguishing free species, reaction products and component inventories across views.
- The total-dissolved eligibility check shared a blanket nonnegative-coefficient restriction with fractions. Signed source coefficients must be retained, not assumed positive. Ordinary dissolved sums and nonnegative distribution fractions need separate eligibility rules.
- Raw solver diagnostics, attempts, input constraints and residuals already existed in GridResult. Derived points retained mostly a message and gap reason; Phase 10 grouped diagnostics but exposed them under an optional threshold/failure disclosure. There was no stable cell taxonomy or per-axis success summary.

## Output identities and definition

Existing identities retained: individual aqueous amount, log amount, log activity, total dissolved, log total dissolved, component fraction, pure solid amount, calculated pH and pe/Eh. The legacy log-solubility alias remains compatible and does not gain a claim of intrinsic/saturated solubility.

New explicit projection: **Supplied analytical component total**, copied from the accepted point's requested `kh=1` total constraint. This is not a new equilibrium quantity or a recomputed balance. For activity-controlled components no analytical total was supplied; the output is explicitly unavailable. Preflight rejects starting a new run solely for that impossible request. Viewing an already calculated result retains its successful calculation status and explains output unavailability.

`outputDescriptors.js` now provides a shared selector catalog, deterministic per-series identity, quantity category, component/series linkage, label, units, formula and provenance. Descriptors flow through derived series, analysis, 2D/3D preparation, inspection and JSON. The 3D title and color legend use the same descriptor. The toolbar says **F / Z output quantity**; species options are grouped as free components and product phases; component totals are a separate named group.

Total dissolved uses the solver's already accepted `dissolvedComponentAmounts`:

`free basis amount + Σ aqueous product amount × actual source component coefficient`.

The sum excludes solid inventory and does not reconstruct elemental formulas. Actual signed coefficients are preserved. Ordinary-component sums are eligible without silently removing negative terms; proton/electron bookkeeping inventories remain excluded. Fractions retain their separate nonnegative-inventory rule. The safe complexation test independently reconstructs the weighted sum from returned aqueous amounts and coefficients and demonstrates that it differs from free species.

Linear zero remains zero. A zero logarithm is `zero-log-undefined`; a negative dissolved sum is `negative-dissolved-total-in-source-basis`; a nonfinite/missing sum is `unavailable-dissolved-total`. These are unavailable outputs, never arbitrary floors. Finite underlying signed/linear values remain available in the original result/derived metadata for inspection. Pure transformation tests cover negative and zero totals; they are not new thermodynamic benchmarks.

## Preflight and unchanged scientific boundary

After existing source/system preparation and before `beginGrid`/`runGrid` (or sweep), the application checks the actual requested F identity against the prepared system. Missing/excluded species, absent components, incompatible phases, unsupported output types, missing proton/electron identity and an analytical-total request for an activity-controlled component are rejected explicitly. Nothing is substituted.

Existing definition/source checks continue to validate distinct independent axes, finite fixed inputs, sample counts/budget, representable log-total endpoints, units, phase support, stored conditions and supported chemistry. Preflight checks compatibility, **not future convergence**. Numerical failures remain possible inside a valid definition and must be retained.

No general solver bug was demonstrated in this phase. The user-reported uranium example was not adopted as a benchmark or tuned. The safe partial fixtures intentionally exercise rejected nonpositive total constraints; their failures do not establish a physical chemical boundary or a diagnosis for the separate uranium run.

## Stable diagnostic taxonomy

The new `gridDiagnostics.js` derives classifications from existing outcomes without solving chemistry:

| Category | Meaning |
|---|---|
| `CALCULATED` | Accepted calculation and finite requested F |
| `CALCULATED_OUTPUT_UNAVAILABLE` | Calculation converged, requested F unavailable |
| `FAILED_NONCONVERGENCE` | Solver explicitly reported numerical nonconvergence |
| `FAILED_SINGULAR_OR_UNDERDETERMINED` | Explicit singular/conditioning or undetermined-inventory diagnostic |
| `FAILED_INVALID_STATE` | Reported inadmissible/boundary constraints, numerical range or state acceptance issue |
| `FAILED_UNSUPPORTED_CHEMISTRY` | Explicit unsupported model, phase or formulation |
| `INVALID_INPUT` | Invalid input, identity, units or coordinate transformation |
| `CANCELLED_OR_UNRUN` | Cancelled, superseded or never calculated |
| `FAILED_UNCLASSIFIED` | Broader, unknown or mixed evidence without a single established cause |

Raw diagnostics, normalized category and human explanation are separate. In particular, `no-consistent-solid-assemblage` does **not** become an inferred nonconvergence or chemical cause; all attempt diagnostics remain inspectable. Unknown codes stay broad. Iterations and residuals are shown only where actually reported, including attempt-specific iteration/residual norms.

## UI, domain information and export

Grid diagnostics shows requested/calculated/failed/unrun/cancelled/output-unavailable counts, expandable categories and up to three representative coordinates per category. Each representative can select the exact cell. A collapsed coverage table shows calculated/requested and F-available counts for every sampled X and Y coordinate. Successful coordinate bounds are explicitly only bounds on successful samples, not a continuously validated domain.

Both 2D and 3D exact inspection show calculation status, normalized category, requested-output status, raw diagnostic and original cell input/attempt/residual details. The 2D legend distinguishes calculated colors, failed cross-hatching, calculated-but-unavailable horizontal hatching and unrun dots. Phase 11 surface masking is unchanged: any missing corner removes the entire quad. Extrema and exact slices continue to exclude or gap unavailable F. Slice and view changes do not start equilibrium calculations.

Numerical JSON retains the existing system, GridResult, derived series, provenance, conditions, axes and analysis, and adds normalized grid diagnostics. Each exported sampled cell includes X/Y, calculation status, category, raw diagnostic, attempts, available iteration/residual information, requested-output status/value/units and input/transformed coordinates. The selected output descriptor is explicit in `sampledOutput.quantity.descriptor`. Existing grid axes, dimensions, activity model, temperature, pressure, component basis and source identities remain intact. PNG remains a separate raster figure.

## Validation

**172 tests pass, zero failures and zero skips:** the existing 162 plus 10 focused Phase 11.1 tests. Added coverage includes:

- Safe carbonate shared descriptor/result/export integration and successful grid.
- Existing non-nuclear complexation fixture's independent aqueous stoichiometric sum, free-vs-dissolved distinction and supplied-total semantics.
- Zero/negative/nonfinite log rules, stable descriptor identity and shared selector catalog.
- Exact diagnostic normalization with preserved uncertainty and raw/attempt evidence.
- Failed vs calculated-output-unavailable vs cancelled/unrun states.
- Incompatible F preflight, independent-axis rejection and separate signed-sum/fraction policy.
- Real partial complexation grid: 10 accepted / 15 failed; category counts, axis coverage, extrema, exact slice gaps, eight surviving triangles and complete diagnostic export.
- Cancelled grid preserving all coordinates and no invented output or surface.

All five unchanged golden benchmarks pass: acid-base, complexation, precipitation, redox and fixed-activity. The permanent underdetermined-activity regression also passes. Golden SHA-256 remains `aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`.

### Real local browser checks

At `http://127.0.0.1:5173/adambritts-site/laboratory/`:

1. Started a carbonate map without an F species: explicit preflight rejection and no grid result.
2. Calculated pH 0–14 × log10 total carbonate −6 to −1, 21×21: **441 accepted / 0 failed**. Total dissolved, free carbonate and HCO3− used the same grid ID and revision. At sample 220, free carbonate was `1.2145801621721075e-7` mol/kg H2O; this was not substituted with total dissolved.
3. Verified the same grid as 2D and 3D, exact inspection, maximum selection, exact horizontal slice, normalized diagnostic panel, camera rotation, zoom and reset. The 3D label/legend name the selected quantity.
4. Deliberately invalid/boundary total grid −0.001 to +0.001: **210 calculated / 231 failed**. Category `FAILED_INVALID_STATE` retained the original `inconsistent-or-boundary-total` message. Successful sampled Y bounds started at approximately 0.0001. Exactly **360 surface triangles** remained; failed-cell inspection and the complete copied/parsed JSON agreed on category, raw code and unavailable value.
5. Cancelled an 81×61 run: **800 calculated / 4,141 cancelled-unrun / 0 failed**, with **1,420 surviving triangles**. Cancellation remained distinct from the previous failed grid.
6. An activity-controlled carbonate grid had **441 calculated states**. Switching the existing result to supplied analytical total produced **441 calculated-output-unavailable states, zero failed states and zero triangles**, with `activity-controlled-component-has-no-supplied-total`. Attempting a new run for this request was rejected by preflight. This exercises output semantics; no physical validity claim is made for the activity-imposed domain.
7. Verified a real 1D total-dissolved carbonate curve with fixed total 0.001 mol/kg H2O. Exact inspection at pH 7 showed `0.0010000000000000005` mol/kg H2O under the total-dissolved label.
8. Live axis/condition edits retained the old labeled surface while updating; new results replaced it when ready. Browser console error check was empty. A complete supported carbonate surface was restored.

### Performance

Local Node timing, same safe carbonate source/ranges as Phase 11. Diagnostic classification was measured five times on each already calculated result; medians are reported. It is outside the unchanged grid solver loop.

| Grid | Accepted points | Chemistry / orchestration ms | Diagnostics median ms |
|---|---:|---:|---:|
| 21×21 | 441 | 347.09 | 0.26 |
| 51×51 | 2,601 | 2,031.66 | 0.67 |
| 81×61 | 4,941 | 3,797.03 | 0.77 |

These are local CPU measurements, not a browser/GPU guarantee. Chemistry timings are comparable to Phase 11 (349 / 2,014 / 3,877 ms). No samples or diagnostics were removed to obtain these timings. Full JSON export can grow because raw evidence and normalized views coexist. Reproduce with `node scripts/report-phase11-1-performance.js`; aggregate results are in `phase11-1-performance.json`.

### Build and production boundary

Build, lint and production-boundary audit passed. The Vite base remains `/adambritts-site/laboratory/`; the same static setup and bundled Three.js renderer remain. No packages, deployment configuration or audit rules were changed. The existing large-JavaScript-chunk warning remains visible. Production audit still excludes the private local thermodynamic source and reference fixtures.

## Files changed

Added: `src/calculations/outputDescriptors.js`; `src/analysis/gridDiagnostics.js`; `src/components/GridDiagnostics.jsx`; `src/components/CellDiagnostic.jsx`; `tests/phase11-1.test.js`; `scripts/report-phase11-1-performance.js`; `docs/phase11-1-performance.json`; `docs/phase11-1-report.md`.

Updated: `src/App.jsx`; `src/App.css`; `src/calculations/definition.js`; `src/calculations/outputs.js`; `src/analysis/summary.js`; `src/components/OutputControls.jsx`; `src/components/MapOutput.jsx`; `src/components/GridWorkspace.jsx`; `src/components/GridPlot.jsx`; `src/components/Surface3D.jsx`; `src/plots/gridView.js`; `src/plots/surfaceFigure.js`; `README.md`; `docs/scientific-architecture.md`.

The existing build regenerated ignored `dist/`. No solver source, thermodynamic record, golden fixture, package manifest, lockfile or deployment configuration was edited.

## Limitations and next phase

Classification explains reported evidence, not an unreported physical or numerical cause. Unknown/broad assemblage failures remain broad. Successful sampled bounds and fractions are not continuous domain validation or phase boundaries. Preflight does not guarantee convergence. Ordinary signed component sums are source-basis quantities, not reconstructed elemental inventories. There is no floor/smoothing to hide missing results.

Existing restrictions remain: no validated Pourbaix, general redox closure, nonideal activity models, arbitrary simultaneous solids, gas fugacity equilibrium or extrapolated conditions. WebGL fallback and raster-export limitations remain as documented in Phase 11.

Recommended next work is independent, safe diagnostic case coverage for difficult supported bases and targeted workflow/accessibility validation. Review retained attempt evidence before proposing any numerical change, and require a minimal regression plus unchanged golden validation for a demonstrated defect. Do not infer a solver fix from a visually incomplete surface. **Phase 12 has not started.**
