# Interactive Equilibrium Beaker MVP — completion report

Completed as an explicit-opt-in educational workspace. No deployment. Local review: http://127.0.0.1:5173/adambritts-site/laboratory/ → Interactive Beaker. The bundled/default database is required; demo/manual sources do not enable this MVP. Existing System/Calculation setup is separate and is not replaced by opening the beaker.

## 1. Architecture

src/beaker/equilibriumBeaker.js prepares the existing mixedCarbonateSolubilityExample through prepareSessionPoint, createSweepDefinition and runSweep, then derives the existing mixed saturated-solubility outputs. It does not supply new thermodynamic constants or introduce another chemistry model. The component retains this immutable29-point sweep, selecting exact accepted results as pH changes.

beakerState is an explicitly derived view: original input/result identity, dissolved components/contributors, solid inventory and sample marker remain linked to their normal branded solver objects. precipitateVisual is a separate presentation mapping and cannot feed into the solver. No inventory, water-mass, volume, dosing or additions engine is implemented; a future inventory-to-input adapter can precede the existing equilibrium boundary without altering the drawing.

InteractiveBeaker.jsx handles pH selection, theme, clickable schematic and compact readout. Its optional graph reuses figureSvg and resultPackage. It shares the exact sweep rather than calculating an independent graph. App.jsx adds the opt-in navigation, uses the already loaded default repository and keeps the previous System/Calculation workspace separate. Leaving the beaker cancels any unfinished initialization; reopening initializes the fixed example at pH7.

## 2. Exact data consumed

Source-backed basis: Ca2+, CO3²−, Mg2+, H+, H2O. Analytical totals: Ca0.1, inorganic carbonate0.1 and Mg0.001 mol/kg-H2O. Ideal25°C, declared1bar, water activity1; ten audited candidate pure solids and eleven compatible aqueous reactions. pH is imposed, not inferred from an acid dose.

The view checks prepared-system, sweep, derived-output and successful-point brands; current revision; sweep/system identity; point input identity; scientific acceptance; and matching dissolved traces. It consumes solids.amount/status/logSaturation, dissolvedComponentAmounts through the existing output traces, source coefficients, species molalities, weighted contributors, residuals and rejected-assemblage diagnostics.

Dissolved Ca = free Ca2+ + CaCO3(aq) + CaHCO3+ + CaOH+.
Dissolved Mg = free Mg2+ + MgCO3(aq) + MgHCO3+ + MgOH+ + 4 Mg4(OH)4⁴+.
The largest contributor shown in the compact readout is ranked by weighted contribution to the selected dissolved component, not by particle count. Liquid inspection lists every relevant contributor, including coefficient4 for the Mg tetramer. Source-form names in component headings identify the component basis; totals include all listed forms, not just the free ion.

## 3. Solid inventory → visual mapping

One neutral, unlayered bed appears iff accepted positive solid amounts exist. Let S be their sum in mol/kg-H2O. S=0 gives height0; S>0 gives height12 + 44 S/(S+0.05) SVG drawing units. The0.05 scale and12/44 dimensions are view choices only, not constants or calibrated precipitate volumes. Liquid level is fixed and decorative. Phase identities and exact calculated amounts are labeled separately; there is no claim of physically separated layers, color, morphology, turbidity, settling or kinetics.

Click/tap or keyboard-activate the liquid/bed to inspect it; ordinary buttons provide equivalent access. Precipitate inspection includes all active and inactive candidate amounts and saturation statuses. Details expose exact input/result/trace JSON and the mapping description.

## 4. pH interaction and current-state handling

Slider0–14, step0.5, plus numerical input. Each of the29 values selects an exact stored solver state immediately after initial calculation. Initialization yields between points using the existing orchestration option. No equilibrium interpolation is performed during dragging. Current calculated pH and sample count are explicit.

Blank, nonfinite, out-of-domain or intermediate values such as7.25 show an actionable explanation, remove liquid/bed and remove the synchronized marker. Failed, unsupported, cancelled or stale states likewise cannot become a visual aqueous equilibrium. Repository identity and effect cleanup prevent late initialization from replacing the current source. No previous equilibrium is relabeled as a new pH.

## 5. Synchronized solubility

The optional diagram plots the existing log10 saturated total-dissolved Ca/Mg series. A vertical marker and available curve dots use the same sample index, pH and inputId as the beaker. Unsaturated values remain null: aqueous-only states still have positive dissolved totals but no saturated-solubility curve point. No connections across missing values are introduced. Existing sampled phase-change markers and direct labels remain; the compact legend can focus a curve. Export shared numerical JSON preserves the full original sweep and traces at original precision.

## 6. Representative states demonstrated

All numerical entries below are original solver molalities, not display-rounded values.

| pH | Accepted positive assemblage | Total dissolved Ca | Total dissolved Mg |
|---|---|---|---|
| 0 | Aqueous only | 0.1 | 0.0010000000000000005 |
| 7 | CaCO3(cr) | 0.003044375888997809 | 0.0009999999999999994 |
| 10.5 | Mg(OH)2(cr) + CaCO3(cr) | 0.000081602184152827 | 0.00008153088569393767 |
| 14 | Mg(OH)2(cr) + Ca(OH)2(cr) + CaCO3(cr) | 0.00016252580424081534 | 2.58094261823735e-9 |

At pH7: calcite0.0969556241110022 mol/kg-H2O.
At pH10.5: calcite0.09991839781584717 and Mg(OH)2(cr)0.0009184691143060623.
At pH14: calcite0.09940548504912593, Mg(OH)2(cr)0.0009999974190573818 and Ca(OH)2(cr)0.0004319891466332604.

The captured DOM input identities and every displayed amount were programmatically compared with these exact solver states. All matched. Evidence: beaker-browser-states.json and beaker-validation.json; screenshots for each of these four pH values.

## 7. Browser and mobile behavior

Checked1280×720 desktop and390×844 responsive viewport. Both dark and light beaker themes are readable. Narrow layout stacks the vessel/readout, wraps navigation and labels, and has no page-level horizontal overflow. The optional graph has a640px minimum drawing width with an explicitly labeled internal horizontal scroll area, preserving label readability instead of shrinking all text. The temporary viewport override was reset.

Browser checks: pH0/7/10.5/14; actual full-range slider drags forward and back; bed presence/absence; all active phase counts; exact input identities; liquid/precipitate click inspection; synchronized marker identity; unsampled7.25 rejection with no old liquid, bed or marker; mobile/light-theme rendering. Aqueous, one-, two- and three-solid labels agree with the prior validated evidence. Screenshot captures use normal viewports; the browser's full-page capture produced stitching artifacts, so those captures were replaced by clean viewport images.

## 8. Tests and build

Ten focused tests pass, covering accepted objects, exact pH inputs, zero/one/multiple solids, original solid amounts, dissolved weighting, shared marker, genuine failed solver points, unsupported/cancelled cases and stale rejection. Failure tests use extreme analytical input only in tests, never in the selectable example; no constants/tolerances are changed.

Final full suite: **298 passed,0 failed**, including all288 previous tests. Build passed. Lint:0 errors, one pre-existing ExpandedPlot effect-cleanup warning. Existing bundle-size advisory remains. Production audit passed unchanged. An initially added source-fingerprint literal was removed after the audit caught it; availability instead uses the existing default-source origin in the navigation. Final checks were rerun after that correction.

## 9. Science preserved

All five golden benchmarks pass with unchanged fixture SHA256 aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960.
Bundled database SHA256 9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245 is unchanged.
No solver equations, constants, tolerances, activity calculations, stoichiometry, failure semantics, Pourbaix or3D renderer/grid files were changed. No deployment.

## 10. Exact files changed

Application/validation:
- src/App.jsx — opt-in navigation/default-source availability and separate preserved workspace.
- src/beaker/equilibriumBeaker.js — new existing-engine adapter, exact-state guard and independent visual mapping.
- src/components/InteractiveBeaker.jsx — new beaker UI and reused scientific diagram.
- src/components/InteractiveBeaker.css — scoped dark/light/responsive presentation.
- tests/equilibriumBeaker.test.js — ten focused tests.

Report/evidence:
- docs/beaker-report.md
- docs/beaker-validation.json
- docs/beaker-browser-states.json
- docs/beaker-focused-tests.txt
- docs/beaker-tests.txt
- docs/beaker-lint.txt
- docs/beaker-build.txt
- docs/beaker-production-audit.txt
- docs/beaker-ph-0.png
- docs/beaker-ph-7.png
- docs/beaker-ph-10.5.png
- docs/beaker-ph-14.png
- docs/beaker-mobile-light.png
- docs/beaker-mvp-desktop.png

Standard dist HTML/CSS/JS build artifacts were regenerated locally; all approved data/artwork bytes remain unchanged. Existing scientific reports/tests/fixtures were preserved.

## 11. Limitations

One fixed validated example only;29 discrete pH states. Changing pH does not simulate acid/base dosing, dilution or inventory changes. The illustration is qualitative equilibrium education and cannot predict appearance, volume, precipitation timing or physical layers. The graph preserves saturated-solubility unavailability even when the liquid contains dissolved material. Point transitions are sampled, not continuous phase boundaries. No arbitrary systems, gases, nonideal models or laboratory simulator features were added.

## 12. Smallest recommended next phase

Pin and compare two exact pH states side by side, showing changes in dissolved totals and solid inventory from the same existing sweep. This would add educational value without introducing new chemistry, dosing physics or an inventory engine.

Stopped for review.
