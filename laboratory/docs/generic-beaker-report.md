# Generic Interactive Beaker and compact scientific setup

Implemented and validated locally. No deployment. Stopped for review.

## 1. Generic support
Interactive Beaker now calls calculateBeakerPoint with the authoritative current session and the requested pH. There is no Ca/Mg/carbonate membership requirement and no example substitution. A 150 ms debounce coalesces input edits. Stale asynchronous completions are discarded; a previously accepted visual is hidden while a different current request is being calculated.

The legacy validated-example adapter remains intact for its existing tests and optional synchronized 29-sample solubility companion. It does not determine whether the generic Beaker can evaluate current chemistry. At exact existing companion samples the graph remains available; arbitrary newly requested pH values are solved directly and are not interpolated onto that stored graph.

## 2. Solver state consumed
The adapter uses existing prepareSessionPoint, toSourceInput, createPointInput and solvePoint. Only branded successful point results become Beaker states. It reads dissolvedComponentAmounts, concentrations, logActivities and accepted solids directly. Contributor lists use the current basis and every compatible aqueous product with its actual nonzero signed coefficient. The primary dissolved value is the solver's existing dissolved-component amount, not a new solubility definition. No solid inventory is included in that dissolved total.

Positive accepted solid amounts create one qualitative bed; the actual identities and amounts are listed separately. Zero-positive-solid states show aqueous liquid without a bed. Exact point JSON includes the unrounded result, input, component traces and provenance. Physical appearance, kinetics, color, volume and density are not inferred.

## 3. Supported and unsupported conditions
Supported: current point definitions or single pH-sweep definitions accepted by the existing direct-basis solver, at its existing ideal 25 °C / declared 1 bar domain. Existing explicit multi-solid policy is retained through normal preparation. Ordinary proton activity controls can be varied; fixed totals and other constraints are copied unchanged. A proton total is not silently converted into a proton activity control. Systems without a controllable pH retain fixed conditions.

Unsupported requests return a reason and diagnostics without an equilibrium drawing. Non-pH swept variables must first receive explicit fixed conditions; no arbitrary coordinate or analytical total is chosen. Independent-system overlays are not treated as one Beaker equilibrium. Invalid or unsupported activity models, missing constraints, incompatible bases and rejected solves remain unavailable. No new scientific solver domain was enabled.

## 4. Ca-only browser result
Actual browser clicks selected Ca 2+, H+ and H2O, configured an ordinary 51-point pH concentration diagram and calculated it without opening Advanced. Beaker displayed this Ca-only chemistry at pH 7, 3 and 11.234, with no Mg, carbonate, Mn or Ni readout. Its downloaded exact JSON retained pH 11.234 and only Ca as an ordinary component. Separate automated comparisons matched direct point solver concentration arrays exactly at these three pH values.

## 5. Mixed example
The explicit mixed Ca/carbonate/Mg action populated the authoritative session. Beaker at pH 10.5 displayed two accepted solid phases. Returning to System, removing Mg through the periodic table, recalculating and revisiting Beaker removed Mg from components and solids. It was not restored by entering Beaker. The existing 29 exact example states remain covered by unchanged tests.

## 6. No phantom components
The generic adapter imports no fixture and derives its component/species lists only from the prepared current system. Ca-only browser and unit tests, Mg removal checks and second-system checks establish absence of substituted components. Existing shared-session, New/Reset and explicit-loader tests all remain passing.

## 7. Calculation hierarchy
Primary form: Diagram type and Y output on the left, independent X controls beside them, Conditions, compact component totals/fixed conditions, then Calculate. Two-coordinate requests retain their X/Y controls and Z response. Range guidance is semantic: the concentration-only -20 floor is mentioned only for the relevant output types. Results and Edit setup retain the existing workflow and exact inputs. A current component summary remains above the work surface.

At 1440 × 1000 the ordinary Ca setup and Calculate button fit together without scrolling. At 390 × 844 sections stack vertically, as appropriate, without horizontal page overflow.

## 8. Secondary controls
Examples remain collapsed under Load example. Independent comparison is behind Advanced diagram options. Control conventions and reaction review are collapsed. Selected phases have their own disclosure. Each compact component row has Options for alternative control modes and mass-concentration conversion. Existing detailed results, provenance and diagnostics remain in Advanced / diagnostics. No capability was deleted.

## 9. Browser and mobile
Nine recorded headless-Chrome checks passed through the bundled Playwright runtime. This approved process recovered browser verification despite the in-app sandbox failure from the previous phase.

- Ca-only Calculation → Beaker; pH changes 3, 7, 11.234.
- Liquid inspection and exact downloaded point export.
- Explicit Ca/carbonate/Mg example with two solids at pH 10.5.
- Mg removal → recalculation → Beaker without Mg.
- Mg-only aqueous system at pH 10, with no Ca readout.
- Unspecified activity model: actionable ideal-model preparation error and no liquid visual.
- Mobile setup → Calculate → Edit setup preserves total 0.1, then Beaker.
- No page JavaScript errors and no mobile horizontal overflow in checked views.

Screenshots: generic-setup-desktop.png, generic-setup-mobile.png, generic-beaker-ca-desktop.png, generic-beaker-mixed.png, generic-beaker-mobile.png. Desktop setup and mobile Beaker screenshots were visually reviewed. Browser results and the exact download are stored beside this report. Earlier harness selector-failure captures are superseded by the passing final run.

## 10–11. Validation and scientific invariants
- Full suite: **317 tests passing**, zero failures; all **311 previous tests** preserved.
- Six new focused tests cover generic Ca direct-solve equality and exact export, Mg weighting (including coefficient four), single/multi-solid inventories, unsupported requests, pH controllability and compact editing mappings.
- Focused group: 29/29 passed, including legacy Beaker and semantic presentation tests.
- Build passed; existing large-chunk warning remains.
- Lint: zero errors; existing ExpandedPlot effect-ref warning remains.
- Existing production audit passed.
- Five golden benchmarks unchanged and passing.

Golden fixture SHA256: aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960

Database SHA256: 9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245

Solver equations, constants, tolerances, activity assumptions, Pourbaix/3D scientific calculations and full numerical precision were not changed. Display formatting and semantic visual-floor tests remain unchanged and passing.

## 12. Exact files changed this phase
- src/beaker/currentPoint.js
- src/calculations/setupEditing.js
- src/components/InteractiveBeaker.jsx
- src/components/CalculationWorkspace.jsx
- src/components/FixedCondition.jsx
- src/components/AxisControls.jsx
- src/App.css
- tests/genericBeaker.test.js
- scripts/generic-beaker-browser.cjs

Evidence generated:
- docs/generic-beaker-browser-failure.png
- docs/generic-beaker-browser-initial.txt
- docs/generic-beaker-browser-point.json
- docs/generic-beaker-browser-results.json
- docs/generic-beaker-browser.txt
- docs/generic-beaker-build.txt
- docs/generic-beaker-ca-desktop.png
- docs/generic-beaker-focused.txt
- docs/generic-beaker-initial.png
- docs/generic-beaker-lint.txt
- docs/generic-beaker-mixed.png
- docs/generic-beaker-mobile.png
- docs/generic-beaker-production-audit.txt
- docs/generic-beaker-tests.txt
- docs/generic-setup-desktop.png
- docs/generic-setup-mobile.png
- docs/generic-beaker-report.md

The existing build regenerated dist/ locally; no deployment settings were changed. This folder has no Git metadata, so no historical Git diff is available. No prior source files or tests were reset or discarded.

## 13. Remaining limitations
The solver's existing scientific restrictions still apply. Non-pH sweeps require the user to fix those variables before Beaker evaluation. The synchronous solver can briefly occupy the main thread after debounce; no worker or new engine was introduced. The general Beaker exports an exact point; the legacy synchronized solubility companion is available only for its supported current configuration and exact stored samples. The drawing is qualitative. Browser verification used headless desktop Chrome and a 390-pixel viewport, not every browser/device.

## 14. Smallest next Beaker phase
Add an explicit fixed-value picker for non-pH swept variables before opening Beaker, using the same current-session constraints and solver adapter. This would let a user inspect an exact current 2D-grid condition without silently choosing a coordinate. No additions, dilution, kinetics or new chemistry are needed.

Local development URL: http://127.0.0.1:5173/adambritts-site/laboratory/
