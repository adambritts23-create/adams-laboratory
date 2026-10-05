# Calculation-result Beaker integration — completion report

## Integration and shared state

The separate top-level Interactive Beaker entry is removed. Calculation results now place the scientific plot on the left and a compact Beaker on the right; narrow layouts stack them. Standalone fixed-condition calculations also enter results immediately.

One selection context owns the pinned and hovered sample indices. The Beaker receives the original prepared system, point input and accepted result objects from the stored Calculation outcome. It neither solves chemistry nor reconstructs coordinates. Numerical inspection exposes that same result and its original precision. Positive accepted solid amounts alone produce the qualitative bed; source phase names identify the solids. Contributor tables retain source stoichiometric coefficients and weighted amounts.

## Synchronization and acceptance

1. **1D:** hover previews the exact sample; clicking pins it; leaving restores the pinned state. Browser checks compared input IDs and every dissolved total directly with numerical JSON exports.
2. **2D:** sample selection and map clicks update the Beaker from the exact grid outcome. A selected grid sample outside an open slice is explicitly identified rather than substituted with the slice's first sample.
3. **3D:** existing exact sampled-vertex selection updates the shared state; no interpolated mesh value enters the Beaker. Switching between 2D and 3D preserves selection.
4. **Ca/carbonate:** the browser removed Mg, recalculated, and verified calcite and no phantom Mg. Aqueous-only states have no precipitate.
5. **Multi-solid:** samples 0, 14, 21 and 28 of the existing 29-point mixed sweep have respectively zero, one, two and three positive solid phases. The Beaker lists the original accepted solids, including calcite and crystalline Mg(OH)2, and its dissolved totals exactly match exported results.
6. **Standalone point:** the browser verified immediate results display and the accepted Ca aqueous state at pH 7.

Stale, failed, unrun and mismatched-system states cannot produce an accepted Beaker. Independent-system overlays explicitly have no single mixed equilibrium to visualize. A valid equilibrium may still have unavailable output values (for example an unsaturated solubility output); output gaps retain their existing meaning.

## Validation

- Full suite: **324/324 passed**, including all 317 previous tests and seven focused additions.
- Focused suite: **31/31 passed**.
- Browser: **11 checks passed**, covering 1D hover/pin, exact totals, 0–3 solids, Ca/carbonate without Mg, 2D, 3D, a 390 px layout without horizontal overflow, and standalone results.
- Build, lint and production audit passed. Existing large-bundle warning and the existing ExpandedPlot effect-cleanup lint warning remain; no lint errors.
- All five golden benchmarks pass. The reference fixture SHA-256 remains `aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`.
- Bundled database SHA-256 remains `9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245`.

Solver equations, constants, tolerances, activity assumptions and numerical export precision are unchanged. No deployment.

## Exact implementation files changed

- src/App.jsx
- src/App.css
- src/beaker/acceptedState.js (new pure accepted-result projection)
- src/beaker/visual.js (extracted qualitative drawing helper)
- src/beaker/currentPoint.js (legacy adapter reuses projection)
- src/beaker/equilibriumBeaker.js (reuses drawing helper)
- src/components/ResultSelectionContext.js (new shared context)
- src/components/InteractiveBeaker.jsx
- src/components/PlotWorkspace.jsx
- src/components/ScientificPlot.jsx
- src/components/GridPlot.jsx
- src/components/GridWorkspace.jsx
- src/components/Surface3D.jsx
- src/components/CalculationWorkspace.jsx
- src/plots/resultSelection.js (new selection and accepted-outcome resolver)
- src/plots/workspaceView.js
- src/session/laboratorySession.js
- tests/resultBeaker.test.js (new)
- scripts/result-beaker-browser.cjs (new)

Verification artifacts: docs/result-beaker-focused.txt, docs/result-beaker-tests.txt, docs/result-beaker-build.txt, docs/result-beaker-lint.txt, docs/result-beaker-audit.txt, docs/result-beaker-browser.txt, docs/result-beaker-browser-results.json, docs/result-beaker-1d.json, docs/result-beaker-grid.json, docs/result-beaker-split.png, docs/result-beaker-3d.png, docs/result-beaker-mobile.png, and this report. Build regenerated dist. An intermediate browser-partial JSON, if present, records the superseded standalone display error; the final browser-results JSON is authoritative.

## Remaining limitations

The Beaker is schematic: its bed height and generic color are qualitative, not volume or mineral appearance. No addition, dilution, kinetics or new chemistry was added. Legacy standalone Beaker calculation APIs remain for regression compatibility but are absent from the production UI import graph. Narrow screens stack the Beaker below the plot content. Browser automation used headless Chrome with software WebGL; hardware-specific rendering was not tested. Independent overlays cannot represent one shared mixed Beaker. Saved sessions do not resurrect an accepted standalone point; it must be recalculated.

Stopped for review.
