# Phase 10 — scientific analysis engine

Completed 2026-09-06. Phase 11 has not started. **Solver mathematics, thermodynamic constants, acceptance tolerances and golden fixtures are unchanged.** No independently demonstrated solver defect was found or repaired in this phase. Difficult convergence was not forced or reinterpreted as chemistry.

## Baseline and scope

Read the Phase 10 attachment and inspected the completed Phase 9 filesystem, derived outputs, prepared-system/result representation, grid/sweep orchestration, session commits, view/export modules and existing tests before editing. Baseline verification: 136 tests passed with zero skips, all five unchanged goldens passed, build/lint/production audit passed. Baseline production audit was 5 files / 408,068 bytes with localSourceAbsent=true.

The work continues the existing React/Vite project and browser-only architecture. No replacement solver, runtime, dependency, external service, backend, LLM or deployment was added. Package files, base URL, local thermodynamic source and deployment configuration were preserved.

## Total dissolved component: precise definition

For an eligible ordinary direct-basis analytical component C, the accepted dissolved amount is:

D_C = m_free,C + sum over prepared aqueous product rows j of coefficient(j,C) * m_j.

The free basis term has unit coefficient for its own component. Coefficients are the actual prepared reaction/basis coefficients, not parsed formulas or reconstructed atom counts. The existing point solver already calculates this aqueous sum, with compensated summation, in its dissolvedComponentAmounts field. The new outputs consume that trusted accepted-result field; they do not copy the input analytical total or recompute equilibrium. Tests independently reconstruct the sum from concentrations and prepared coefficients.

Only ordinary nonsuppressed analytical components with nonnegative direct inventory coefficients are offered as new total-dissolved outputs. Signed proton/electron bookkeeping inventories are not silently reinterpreted. Pure solids, gases and unsupported liquids are excluded. This is a component-equivalent amount on the native mol/kg-H2O basis, not necessarily an elemental total across unselected redox forms or a saturated solubility.

The new first-class output names are **Total dissolved component** and **Log total dissolved component**, with the selected component identity/name shown. The old log-solubility internal identifier remains compatible with existing tests/saved view semantics, but the selector uses the explicit total-dissolved terminology. No generic solubility claim was introduced.

For all-aqueous closed systems, total dissolved agrees with the analytical balance within the existing componentBalanceTolerance. Under fixed activity, the sum is derived from accepted free/product concentrations rather than copied from an activity input. With a present solid, dissolved amount excludes that solid inventory and can differ from the analytical total. These are independently asserted using unchanged reference systems.

Individual aqueous species amount and pure solid amount are separate outputs. Pure solid amount uses the accepted supported solid's actual amount per kg water, including a valid zero amount; it is not a dissolved total or a saturation metric. Existing log activity rules, including unavailable absent-solid activity, remain intact. No new solid/fugacity/nonideal calculation was added.

## Architecture

- src/calculations/outputs.js adds explicit linear/log dissolved quantities, individual aqueous amount and pure solid amount; retains linearValue/linearUnit for amount logs, and brands accepted derived objects.
- src/analysis/samples.js contains generic finite-sample extrema, exact ties, adjacency regions and threshold brackets. It has no equilibrium equations or solver invocation.
- src/analysis/summary.js checks prepared, calculation and derived identities, then produces ScientificResultSummary and deterministic factual text.
- src/analysis/slices.js projects exact grid cells into a 1D view; it neither prepares nor solves new points.
- AnalysisPanel associates compact analysis with each selected map F or selected 1D analysis series. SliceView reuses ScientificPlot and its gap-preserving geometry/export.
- Grid rendering adds independently toggled extrema markers, distinct missing-state patterns and an optional adjacency-only domain overlay.

The point/sweep/grid scientific execution remains the same. Summary/threshold/marker/slice operations only consume the retained immutable result and change presentation state. No equilibrium rerun is needed for analysis.

## Analysis semantics

Minimum and maximum are comparisons of actual finite numeric values at accepted samples, never formatted strings. They include original indices and exact X/Y coordinates, plus available underlying linear amount/unit for logarithmic amount outputs. Exact-value ties count separately; the first requested lattice index is the deterministic representative. Small accepted numerical differences are not rounded into ties, and no new tolerance was invented. The UI warns that tiny differences can reflect numerical tolerance.

Extrema exclude failed, unrun, cancelled, unaccepted and derived-unavailable values. No valid F values produces explicit unavailable extrema. Zero linear amount remains valid for a linear output but has an undefined logarithm; its linearValue=0 is retained alongside the unavailable log reason. A logarithmic extremum therefore applies to the subset where that log quantity exists.

Counts distinguish requested, calculated, failed, unrun, cancelled, invalidated, derived-unavailable and finite F values. Calculation coverage is calculated/requested; value coverage is available F/requested. These are sampled-point fractions, **not continuous domain area**. Any incomplete output coverage is flagged; less than half available receives additional prominent wording. The warning threshold controls presentation only, never scientific acceptance.

Connected valid regions use adjacent requested samples in 1D and four-neighbor lattice adjacency in 2D. Diagonal-only contact is not a bridge. Region membership and counts are retained; they do not certify continuity between independently sampled states or establish a phase region.

The extrema are not global mathematical extrema, thermodynamic solubility minima, precipitation maxima or chemical explanations. In a closed all-aqueous system a fixed dissolved total is constrained by balance; slight sampled differences can be numerical rather than a meaningful optimum.

## Thresholds

The threshold is entered in the selected **displayed F units**. For log outputs, enter the log10 threshold. Strictly bracketing adjacent finite accepted samples are retained with both original endpoint coordinates/indices/values. Exact sampled equalities are listed separately. Failed/unrun/derived-unavailable samples interrupt adjacency. Invalid/nonfinite threshold input is not evaluated.

There is no crossing interpolation or root solve. An adjacent pair can bracket a threshold without proving a unique transition between its endpoints. Near solver precision, a bracket is not a certified crossing. Threshold values and all original brackets/equalities are included in the structured summary and numerical export.

## Failure diagnostics and valid-domain rendering

Diagnostic groups use actual top-level status/code, with a human-readable label where a supported code is known. Unknown diagnostics remain explicitly unclassified. Each group counts affected points once and retains a representative index/X/Y, original diagnostics, per-assemblage attempts and derived-unavailable reason. No chemical explanation is inferred from nonconvergence, conditioning or unsupported boundary totals.

The standard explanation is that numerical equilibrium was not established at the requested state. Failures do not imply precipitation, instability, a solubility boundary, an infinite amount or zero.

Valid cells retain scalar color. Failed cells use crossing hatch; unavailable derived F uses horizontal strokes; unrun/cancelled cells use dots. The legend distinguishes these states, while inspection retains exact reasons. Current results after cancellation and even entirely failed 1D sweeps are inspectable rather than silently displaying an older successful curve as the new result. Existing branding, revision and generation checks still reject obsolete commits.

Optional calculated-domain boundaries are dashed edges between neighboring sampled cells with different accepted-F availability. They are cell-availability edges, not interpolated chemistry or phase boundaries. The optional extrema markers and domain overlay are view-only and represented in SVG metadata/legend. Missing-cell contours from Phase 9 still cannot bridge unavailable samples.

## Exact 1D slices

A horizontal slice holds the pinned sample's Y index and uses its complete X row. A vertical slice holds X and uses its complete Y column. No user coordinate is rounded into a newly solved condition. Each slice point retains its original gridIndex, gridCoordinates, value, linear amount, status and reason; only its 1D rendering index/X coordinate is projected.

The reused 1D renderer splits curves at null samples. Fixed coordinates are prominent and explicitly labeled as pH, log total, linear total or activity coordinates. Browser testing caught and corrected an initial caption that could label a log total as a linear concentration. The fixed-slice label is also included in SVG condition text and metadata. A slice carries its parent grid identity/revision and current stale indication. Switching to a new grid clears the old slice selection from the visible result; no old slice is silently relabeled.

Slice exports contain the exact projected samples and parent/grid metadata. The attached full-grid summary is identified as that parent's analysis, not claimed to be a newly calculated slice equilibrium. View-only slice export never changes chemistry.

## ScientificResultSummary and export

The machine-readable summary includes prepared/result identity, revision/current revision/stale flag, selected components and reaction species, fixed conditions (including any preserved g/L proof), independent variables, physical conditions, output identity/units, coverage/counts, extrema, connected regions, threshold brackets/equalities, actual diagnostic groups, accepted solid-state information, source identifiers, solver/source warnings and explicit limitations.

The activeSolids field retains accepted per-point solid-state records, including their explicit present/absent/saturated-zero status; it is not a classification inferred from failed points. Consumers must inspect each status rather than infer presence from the field name.

Deterministic human text is built only from these facts. It reports sampled numerical extrema and exclusions, not a mechanism or causal chemical explanation. No LLM, API key or network call is involved. Matching branded derived/calculation objects are required; forged clones are rejected by the summary boundary.

Both existing 1D and grid numerical exports include ScientificResultSummary alongside original raw/derived results and statuses. SVG contains sampled analysis/overlay metadata where relevant. Complete downloads/Copy remain untruncated; only the displayed preview is limited to 12,000 characters. The browser test confirmed export construction and preview, not independent operating-system download completion.

## UI changes

Output choices are grouped into Species, Components, Solids and Coordinates, with Diagnostics directing users to the Analysis panel. Inventory component selection is distinct from species F selection. A 1D Analysis series selector makes the analyzed identity explicit when several curves are shown.

The existing graph-first layout is retained: compact setup, primary map/curve, fixed-condition rail, then the Analysis panel and collapsible threshold/diagnostic/provenance details. Min/max toggles, representative-point inspection and horizontal/vertical slice actions are direct. No large wizard, save/reopen workflow or redesign was added.

## Tests and regression evidence

Final: **150 tests pass, 0 fail, 0 skipped**. The original 136 tests remain. Fourteen new focused tests cover:

- independent aqueous stoichiometric reconstruction, balance tolerance and fixed-activity distinction from input totals;
- solid exclusion and separate actual solid amount;
- linear/log pairing and unavailable zero logs;
- rejection of signed bookkeeping inventories;
- failed/unrun exclusion even when a synthetic analysis-only sample contains a finite number;
- explicit no-valid result;
- disconnected regions and no diagonal bridge;
- strict brackets/exact equalities, invalid thresholds and no crossing through gaps;
- exact horizontal/vertical slice membership and failed gaps;
- actual-code diagnostic grouping/counts;
- deterministic summaries, forged input rejection and stale facts;
- cancellation masks, unavailable extrema and full status export;
- view-only markers and result/revision preservation;
- entirely failed current sweep presentation;
- adjacency-only calculated-domain edges.

Analysis-only synthetic arrays test graph/statistical semantics, not fabricated equilibrium data or constants. Existing integration tests still exercise local carbonate construction, source record integrity, point/grid/1D equivalence, unit proof, generation safety and production boundaries.

All five unchanged official golden benchmarks pass: acid-base, complexation, precipitation, redox and fixed-activity. The underdetermined-component regression still rejects the invalid case. The golden integrity test retains SHA-256 aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960. No expected value or acceptance tolerance was weakened.

## Built-in browser verification

URL: http://127.0.0.1:5173/adambritts-site/laboratory/ . Local development source auto-loaded. No private source was bundled into production.

A. **Carbonate 1D:** C → CO3²− with H+/H2O and automatic four-reaction aqueous chemistry; pH 0–14, 51 samples, carbonate total 0.001 mol/kg water. All 51 converged. Total dissolved displayed approximately 0.001 throughout, with numeric extrema/locations from accepted samples and 100% coverage. At pH 7, switching to individual amount showed free carbonate 3.8408397133205427e-7, CO2 0.00018383414665830661, H2CO3 2.7760429652641045e-7 and HCO3− 0.00081550416507383523 mol/kg water. Total dissolved was not confused with free carbonate.

B. **Complete 2D:** pH 0–14 × log carbonate total −6 to −1, 21×21. All 441 converged. Log dissolved output retained linear extrema approximately 1e-6 and 0.1 mol/kg water. Both markers rendered. Pinning cell 220 (X index 10/Y index 10) gave horizontal indices 210–230 and vertical indices 10,31,…,430, with fixed pH 7 or log total −3.5 as appropriate. Threshold −3.2 produced 21 valid adjacent brackets. Markers, threshold and slices retained grid ID 23920c37327860a243ab89bf8135ca6a951de1366695c393facc693117b05ef8 and scientific revision 8.

C. **Explicit failure-domain test:** changed carbonate to a linear total range −0.001 to 0.001 at 21×21. This deliberately includes invalid/nonpositive ordinary totals to exercise honest rejection, not to model negative physical carbonate. There were 210 converged / 231 failed / 0 unrun, 47.6% coverage. The UI warned that fewer than half the samples had F; the minimum came from positive total 0.0001, excluding the rejected rows. Actual diagnostic code was inconsistent-or-boundary-total, with representative X=0,Y=−0.001. Inspection showed the actual unsupported finite-positive-activity boundary explanation. The vertical slice contained eleven unavailable samples followed by ten calculated samples; it rendered one valid segment without filling the missing domain.

D. **Cancellation:** repeated the mixed-domain test at 81×61 and cancelled during execution. The retained result had 300 failed points and 4,641 unrun/cancelled points, zero calculated values, and explicit unavailable extrema. DOM markers distinguished failed versus cancelled cells; no minimum marker was fabricated.

E. **Multispecies complexation:** added fixed Ca²+ total 0.001 to the carbonate system, automatic seven aqueous reactions, no optional solids, and a 21×21 pH/log-carbonate grid. All 441 converged. At pH 7/log carbonate −3.5, total dissolved calcium was 0.0010000000000000005 versus free calcium 0.00099653737374167132 mol/kg water. Switching outputs retained scientific revision 19 and the grid identity. Closed-total extrema differed only at numerical precision, with the UI explicitly distinguishing them from solubility.

F. **Overlay/export:** the mixed-domain calcium/carbonate check again returned 210/441, and the calculated-domain overlay produced 21 adjacency edges. Numerical export retained every state and reported 3,122,620 characters with a 12,000-character preview. The final verification tab logged no errors. Temporary failure ranges/calcium additions were removed and the supported carbonate log-total map restored for testing.

The optional uranyl stress test was not used to establish correctness. The motivating 22/441 report is not reclassified as valid chemistry or claimed fixed. No uranium-specific implementation, thresholds, labels or convergence rules exist.

## Performance

Reproduce with node scripts/report-phase10-performance.js. See phase10-performance.json. Local Windows Node measurements use the automatic carbonate system and unchanged independent point calculations. Summary and two-slice medians use five repetitions on the same retained result; they do not call the solver. Calculation timing includes grid preparation in this script; timings are not device-independent guarantees.

| Grid | Accepted points | Calculation | Derivation | Summary median | Two slices median |
| --- | ---: | ---: | ---: | ---: | ---: |
| 21×21 | 441 | 327.73 ms | 1.52 ms | 0.57 ms | 0.022 ms |
| 51×51 | 2,601 | 2,004.01 ms | 3.61 ms | 2.10 ms | 0.052 ms |
| 81×61 | 4,941 | 3,818.74 ms | 5.36 ms | 4.04 ms | 0.056 ms |

The analysis overhead is small relative to calculation. No sample count reduction, warm starts, worker or solver optimization was introduced. Large raw export serialization/memory and source preparation remain separate costs; preview truncation does not remove them. Threshold brackets use accepted floating-point values, so near-equality at numerical precision can produce neighboring brackets without certifying a physical crossing.

## Final checks

- npm test: 150/150 passed, 0 skipped; final recorded full suite 2,826.76 ms.
- All five unchanged goldens and the underdetermined-component regression: passed.
- npm run build: passed; 94 modules, final JS 388,728 bytes, CSS 23,413 bytes.
- npm run lint: passed.
- node scripts/audit-production-boundary.js: passed; 5 production files, 427,241 bytes, localSourceAbsent=true.

Vite base remains /adambritts-site/laboratory/. Production imports contain no Java/Python runtime requirement, development database or uncleared local source. No publishing/deployment occurred.

## g/L policy and other limitations

Phase 9 mass-input architecture is unchanged. Original entry, explicit composition, conventional sourced molar mass, declared kg-water-per-L-solution basis and converted solver value remain attached to fixed conditions and thus included in summaries/results/exports. No implicit molarity/molality equivalence or dilute assumption was added. Generic compound/salt-dose decomposition remains unavailable pending explicit analytical-component mapping.

Unsupported scope remains general redox closure, validated Pourbaix classification, nonideal activity models, multiple simultaneous solids, gas fugacity equilibrium, temperature/pressure extrapolation, 3D and global optimization. Failure maps are diagnostic sample maps, not phase diagrams. Total dissolved includes only selected compatible aqueous chemistry and is not proof of source completeness. Scalar analysis cannot certify unsampled behavior or independent physical accuracy beyond the existing supported validation scope.

## Changed-file inventory

Added:
- src/analysis/samples.js
- src/analysis/summary.js
- src/analysis/slices.js
- src/components/AnalysisPanel.jsx
- src/components/SliceView.jsx
- tests/phase10.test.js
- scripts/report-phase10-performance.js
- docs/phase10-performance.json
- docs/phase10-report.md

Updated:
- src/calculations/outputs.js and src/calculations/definition.js
- src/session/laboratorySession.js
- src/components/OutputControls.jsx, MapOutput.jsx, PlotWorkspace.jsx, GridWorkspace.jsx and GridPlot.jsx
- src/plots/presentation.js, export.js, gridView.js and scalarMap.js
- src/App.css
- README.md and docs/scientific-architecture.md

Regenerated ignored dist/ using the existing build. No solver source, thermodynamic source records, golden fixtures, package/deployment configuration or Phase 9 mass-conversion code changed.

## Phase 11 recommendations

Prioritize independent validation of domain/analysis interpretation and a reproducible diagnostic study of difficult supported bases before widening scientific claims. Investigate whether convergence limitations arise from inputs, basis formulation or numerical conditioning using retained attempts and independent references; stop for scientific review before any solver change. Improve exact-slice/export ergonomics and licensed composition/component-dose metadata separately. Pourbaix requires independently validated classification rules and redox benchmarks, not a relabeling of these domain edges. No Phase 11 work has begun.
