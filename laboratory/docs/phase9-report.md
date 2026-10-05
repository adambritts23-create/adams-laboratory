# Phase 9 — validated F(X,Y) chemistry maps

Completed 2026-09-06. Phase 10 has not started. Solver equations, mass action, balances, active sets, tolerances, source constants and golden fixtures were not changed.

## Baseline and audit

Before editing, reviewed the Phase 8/8.1/8.2/8.3 reports, LaboratorySession, CalculationDefinition, point preparation, sweep/grid engines, derived outputs, coordinate transformations, units, plotting/export, relevant tests and production audit. Traced the existing grid path rather than treating its scaffolding as validation.

Baseline: 122/122 tests passed, all five unchanged official Java benchmarks passed, build/lint/audit passed. Baseline production: 84 modules; JS 360.71 kB (109.80 kB gzip), CSS 22.99 kB (5.57 kB gzip); audit 5 files / 398,810 bytes, localSourceAbsent=true. Existing files and development/deployment configuration were preserved in place.

## Scientific architecture and supported scope

The UI now exposes **2D map / F(X,Y)** and a species selector before the first calculation. Automatic chemistry provides output species without a second species-add workflow. No manual ordinary reaction selection was needed for carbonate. A missing or excluded F identity is not silently replaced by another species.

The path remains: LaboratorySession → validated CalculationDefinition → one PreparedChemicalSystem → existing createGridDefinition/runGrid → independently prepared point inputs → unchanged solvePoint → shared deriveGridOutputs → scalar view model → SVG. The grid engine itself was reused without changing its numerical orchestration. No 1D extrusion, neighboring-result replacement or equilibrium interpolation exists.

Axes reuse TV (linear total), LTV (log total) and LAV (log activity) semantics, including existing pH, pe and temperature-dependent Eh transformations. X/Y must constrain distinct components. Display coordinate order, including descending endpoints, is preserved. Only non-axis variables remain in the live rail. Current physical scope remains ideal activities, 25 °C, declared 1 bar, direct basis, at most one solid, and native mol/kg H2O totals. Existing 10,000-point allocation cap and preparation limits remain enforced.

F uses existing log amount/concentration, log activity, component distribution fraction, log dissolved component amount, calculated pH and calculated pe/Eh semantics. Each carries identity, formula and units. Concentration logs use native molality/solid-amount-per-kg-water semantics; electron and solvent bookkeeping concentrations are unavailable. Fraction and dissolved-component eligibility rules are unchanged. No new saturation or linear-concentration output was invented.

## Result and export contracts

Grid shape is [Nx, Ny]; index = iy * Nx + ix, X fastest. Every requested coordinate is retained. Raw outcomes preserve index/ix/iy, X/Y, point identity, transformed axis inputs, complete fixed/varied input constraints, solver result, diagnostics and acceptance status. Grid/system/source IDs, revision, source metadata, calculation definition and timing remain attached.

Derived points add revision and run-disposition information. Numerical JSON includes the complete system, original grid and derived series, plus a selected sampledOutput with quantity/species identity, shape/order and every selected F cell, its status, transformed inputs and available solid state. Raw point results remain authoritative. Full precision is serialized as JavaScript numbers; inspection/color extrema use 17 significant digits. Exported results remain untrusted on reimport.

Explicit cell states are value-available, derived-unavailable, solver-failure, cancelled, not-run, and stale-invalidated. Stale completed maps additionally carry a visible OLD-conditions banner and revision metadata. Null values always have diagnostic/status context; they are never substituted by zero.

## Renderer and inspection

The large SVG map uses cells centered on actual requested samples, clipped at domain boundaries. X increases right and Y increases upward for ascending requested axes. No fake smoothing is applied. A monotonic sequential RGB scale replaces categorical scalar coloring. Exact min/max, F semantics, axis units, fixed calculation conditions and an unavailable-cell legend appear in the figure. Explicit color limits clamp display colors only; auto/reset restores the sampled range. Invalid ranges have explicit feedback. Reset's null state is covered by a regression assertion after browser testing found and corrected a rendering error.

Hover snaps to a sample; clicking pins it. Inspection shows exact X/Y/F, indices, revision, convergence/derived state and expandable raw diagnostics/input/solid information. The crosshair marks the pinned sample. Zoom, pan, reset, color limits and contours modify view state only. Hover does not regenerate the entire SVG; responsive plot geometry and the viewport are memoized.

Optional contours use piecewise-linear triangles with a fixed diagonal and five displayed levels. These are **interpolated visualization only**, not additional equilibrium solutions. Every quadrilateral touching a missing corner is skipped, so contours cannot bridge failed/unavailable regions. Equal-valued fields do not invent boundaries. The old experimental inventory-classification module/tests remain, but categorical classification is removed from the user-facing map controls.

SVG export includes axes, color bar, conditions, pinned view, contour legend and missing-cell pattern. JSON exports the full numerical lattice, not pixels. Large export previews are capped at 12,000 characters; Save/Copy retain the complete artifact. This addresses a browser delay caused by rendering a 13.9-million-character textarea. Collapsed current-grid JSON is generated only when opened. CSV and interactive 1D slices are deferred; numerical row/column equivalence is tested.

## Cancellation, stale results and live edits

Scientific edits retain the previous map as OLD/updating while a debounced run executes. Existing generation and branded-identity checks prevent an obsolete run from committing. User Stop now aborts the active controller without invalidating that generation, allowing the returned partial grid to be accepted. Scientific invalidation still increments generation and aborts obsolete work. When a current run finishes or is cancelled, its full lattice is inspectable/exportable, including an entirely unrun or failed map. Cancelled cells remain explicit even when an older map existed. No incremental provisional values overwrite the retained map during execution.

The existing 350 ms debounce and 20-point yielding chunks are retained. No warm starts were introduced; each point starts independently. The default remains 21 samples per axis; larger requests are never silently reduced.

## Numerical validation

Fourteen new tests bring the total to **136 passing tests, zero failures, zero skips** in this local environment. Local-source integration tests explicitly skip if that private source is absent elsewhere; it was present and exercised here.

The real auto-constructed carbonate system includes CO3²−, H+, H2O and four compatible aqueous reactions. A 7×5 pH 0–14 × log total −6 to −1 grid converges at all 35 points. At four corners, center and three additional interior cells, independently assembled point constraints (proton log activity = −pH; carbonate total = 10^Y; water log activity = 0) reproduce the grid's full concentration and log-activity arrays exactly. These are orchestration-equivalence tests, not a newly sourced external carbonate oracle. A complete row and column match separately executed equivalent 1D sweeps exactly. X/Y swapping transposes the lattice without changing results; index/geometry/export tests guard orientation.

Other tests cover transformed coordinates, duplicate axes, unavailable bookkeeping species, signed-total failure cells, full cancellation export, stale/not-run distinctions, contour masking, monotonic colors, view-only revisions, missing output identity, and current cancelled-grid replacement. Existing live debounce/generation tests and maximum-grid safeguards still pass. g/L tests verify structured molar mass, no name heuristic, defined/unavailable conversion states, rejection of approximations, altered proof/identity/value/axis rejection, preservation of original input, and equivalence of a converted fixed carbonate total to the same native total through the shared sweep path.

All five unchanged golden cases pass: acid-base, complexation, precipitation, redox and fixed-activity. Their Phase 4 tolerances and fixtures remain intact. Golden SHA-256 remains aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960. The permanent underdetermined-electron regression still rejects the invalid case.

## Conservative redox foundation

The retained combined acid-base/redox direct-basis fixture tests pH×pe and pH×Eh grids, preserving the proton sign and existing Eh transformation. Every point is compared with the same accepted direct point input. These checks validate coordinate plumbing for that restricted basis, **not general redox closure or a Pourbaix diagram**.

Pourbaix remains disabled because independently validated phase/species classification rules and an appropriate independent 2D redox reference have not been established. Inventory dominance is not a substitute for those rules. No new redox species, closure, thermodynamic data, multiple-solid semantics or classification claims were introduced.

## Performance and responsiveness

Reproducible command: node scripts/report-phase9-performance.js. Aggregate-only evidence is in phase9-performance.json; no private source records are embedded. Windows Node v24.15.0, automatic carbonate, cold independent points, default chunk 20. One run per size; elapsed includes result assembly, excludes database loading/preparation.

| Grid | Points / converged | Failed | Elapsed | Points/s | Abort response |
| --- | ---: | ---: | ---: | ---: | ---: |
| 21×21 | 441 / 441 | 0 | 350.37 ms | 1,258.68 | 2.25 ms |
| 51×51 | 2,601 / 2,601 | 0 | 2,001.10 ms | 1,299.79 | 6.55 ms |
| 81×61 | 4,941 / 4,941 | 0 | 3,844.68 ms | 1,285.15 | 11.47 ms |

Abort was scheduled after 50 ms; response is measured from actual abort dispatch to returned partial result. The cancellation runs retained respectively 81, 61 and 61 completed points, and every remaining requested coordinate. These are measured local timings, not latency guarantees on other hardware.

Derived model plus initial SVG-string construction took approximately 4.62, 32.87 and 64.98 ms; these are not browser paint times and preceded the final hover memoization/font refinements. Browser 41×31 engine time was 976.8 ms. Browser 81×61 completed all points and a cancelled repeat retained 160/4,941 with 4,781 explicitly unrun cells. Main-thread yielding remained responsive to Cancel and fixed-input controls. A worker is deferred: present scope is usable with smaller defaults and yielding. Large exports still serialize a complete, potentially multi-megabyte package; preview truncation does not eliminate serialization/memory cost. Slower devices and harder chemistry warrant further profiling before expanding the point budget.

## g/L architecture and basis policy

MassInput is an explicit pending editor attached to ordinary fixed totals. It requires structured integer atom counts and a composition source. Existing imported element association labels are not authoritative atom counts. User-entered composition is labeled unverified, and the selected component identity/name is retained. Dosing-salt decomposition into multiple component totals is unsupported; users must describe the actual component quantity.

Molar mass derives from the limited H/C/N/O/Na/Cl/Ca/Fe/Cu table in src/data/atomicWeights.js, using the [CIAAW 2024 abridged normal-material atomic weights](https://ciaaw.org/abridged-atomic-weights.htm), checked 2026-09-06. These are conventional molar masses, not isotope-specific values or thermodynamic equilibrium constants. Unsupported elements/compositions reject conversion. No display-string formula parsing or guessed mass is used.

Conversion is defined as mol/L solution = (g/L)/(g/mol), then mol/kg H2O = (mol/L solution)/(kg H2O per L solution). A positive, sourced solvent-mass-per-solution-volume basis and explicit declaration that it remains valid throughout the calculation are required. Density alone is insufficient. No implicit 1 L = 1 kg water assumption and no approximate dilute mode exist. 'Defined' means relative to supplied composition, conventional mass and declared basis; it does not independently certify the user's measurement.

Without a valid basis, the g/L entry stays pending, Apply is disabled, and no converted total enters calculations. Previously applied native conditions remain unchanged. Applying stores original amount/unit, component identity, atom counts/source, mass/source, molarity, solvent basis/source, conversion status and assumptions on the condition. The scientific boundary recomputes and checks this proof before every prepared calculation, rejecting forged/stale conversion values. A later native total edit replaces the mass entry. g/L axes, isotope-specific masses and salt-to-component dosing remain unavailable.

## Concrete built-in browser verification

Local URL: http://127.0.0.1:5173/adambritts-site/laboratory/ . The configured development database auto-loaded 4,445 species records. New system → C → CO3²− → explicit H+ with H2O solvent produced four automatic aqueous reactions; no ordinary species were manually added. The fresh default workspace also includes H+; New system requires explicit component selection.

Selected HCO3− before calculating, pH X 0–14 (41 samples), log total Y −6 to −1 (31 samples). Neither appeared in the fixed rail. All 1,271 cells converged. The map was visible high in the desktop viewport, with correctly oriented axes, sampled cells, sequential color bar and conditions.

Pinned index 635 = (ix 20, iy 15): X=7, Y=−3.5, F=−3.5885738165195189. Numerical JSON contained all 1,271 cells and the identical binary-number value (JSON's shortest representation −3.588573816519519). Auto range was −12.353655517172385 to −1.008948427978792. Color limits −10/−2, contours and pan/zoom retained the exact grid ID and scientific revision 10. Reset-range testing caught a null handling error; fixed and retested successfully. SVG export included contour/axis/color/condition content; the final large SVG preview reported 978,800 total characters while showing only 12,000. Filesystem download completion is not independently asserted; complete export construction and the browser Save/Copy path were checked.

An 81×61 run converged at every cell; a repeat was cancelled at 160 completed cells, with 4,781 cancelled cell markers in the DOM. Added Ca²+ as a fixed component, with no optional solids, and calculated a 21×21 map. Editing its native total from 0.001 to 0.002 visibly showed OLD/updating, then completed with the new fixed condition.

For mass-input verification, entered explicit Ca:1 composition and 0.04 g/L. The UI showed 40.078 g/mol and 0.000998053795099556 mol/L, but Apply remained disabled without a solvent basis. A clearly labeled **browser-test declaration, not measured data**, 0.98 kg water/L, yielded 0.001018422239897506 mol/kg H2O. The new 441-cell map converged and its metadata retained the entire original entry and conversion. Numerical export reported 6,211,494 characters with a bounded preview. Clicking an actual center cell pinned the correct indices/coordinates. No browser errors remained in the fresh verification tab.

Removed the temporary calcium test condition and restored the 41×31 carbonate map for user testing. Numerical direct-point and row/column comparisons are automated as documented above; the browser separately verifies display/export identity. Test conditions are not empirical density or thermodynamic data.

## Final checks and production boundary

- npm test: 136/136 pass, 0 skipped; final duration 1,995.28 ms.
- All five unchanged goldens and the underdetermined-component regression pass.
- npm run build: pass, 89 modules; JS 369.96 kB (112.77 kB gzip), CSS 22.99 kB (5.57 kB gzip).
- npm run lint: pass.
- node scripts/audit-production-boundary.js: pass, 5 files / 408,068 bytes, localSourceAbsent=true.

The base remains /adambritts-site/laboratory/. Package/deployment configuration and local thermodynamic source were preserved. The production import graph contains no Java/Python runtime requirement or local development database. No deployment or publication was performed.

## Files changed in this phase

Added: src/plots/scalarMap.js; src/components/MapOutput.jsx; src/components/MassInput.jsx; src/components/JsonDetails.jsx; src/calculations/massConcentration.js; src/data/atomicWeights.js; tests/phase9Helpers.js; tests/phase9.test.js; scripts/report-phase9-performance.js; docs/phase9-performance.json; docs/phase9-report.md.

Updated: src/App.jsx; src/calculations/definition.js; src/calculations/liveRun.js; src/calculations/outputs.js; src/session/laboratorySession.js; src/components/CalculationWorkspace.jsx; src/components/FixedCondition.jsx; src/components/GridWorkspace.jsx; src/components/GridPlot.jsx; src/components/ExportPanel.jsx; src/components/usePlotBox.js; src/plots/gridView.js; README.md; docs/scientific-architecture.md. Regenerated ignored dist/ with the existing build. Earlier Phase 8.3 changes were retained.

## Remaining limitations and Phase 10 recommendation

Validated here: shared-engine grid/point/1D equivalence for the stated supported systems, exact lattice/export/state handling, carbonate workflow, conservative direct redox coordinate tests, and explicit mass-conversion arithmetic/contracts. Contours are visualization interpolation only. User composition/basis declarations remain unverified inputs. Pourbaix classification, general redox closure, nonideal models, more than one simultaneous solid, 3D, analytical extrema, g/L axes and dosing compounds remain unsupported.

Recommended next step: establish independently sourced redox/phase-classification benchmarks and explicit classification/acceptance rules before enabling Pourbaix. Separately curate licensed structured component composition and solvent-basis metadata for broader g/L usability. Keep these scientific expansions distinct from further export/worker performance work. No Phase 10 implementation has begun.
