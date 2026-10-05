# Workspace chemistry ownership and scientific presentation

Status: implementation and automated validation finished; **browser acceptance remains blocked and unverified**. No deployment. Stop for review; this is not a claim that all browser acceptance criteria passed.

## 1–3. Restart recovery
The current files retained the session-based Beaker adapter, explicit example loader, user element toggle, compatibility cleanup, dev-only collapsed Mn diagnostics, comparison selector restrictions, and eight new ownership tests. Their focused log showed eight passes. The preceding broader focused run had 39 passes. The full-suite log was incomplete after interruption and was not accepted as evidence.

Git status and diff were attempted: this directory has no Git metadata. Recovery used direct source inspection, surviving tests/reports and scientific-data hashes. No reset, checkout or removal of later work occurred. The formatter still used the prior ten-significant-digit policy and the concentration floor did not exist. Those presentation changes, additional tests, full validation and this report were completed after resuming. Browser checks remained unfinished and are still blocked.

## 4. Authoritative state
session.chemicalSystem is shared by System, Calculation and Beaker. Workspace navigation changes visualizationState.workspace only; it does not replace chemicalSystem or calculationDefinition. Beaker receives the current session and prepares that session through the existing solver path. A reference definition is used only to check the existing restricted Beaker support domain. Unsupported chemistry returns a typed unavailable response, without a replacement calculation or numerical export.

## 5. Periodic-table behavior
Ordinary UI clicks use toggleSelectedElement: first select/focus for explicit component-form choice, then remove that element and its ordinary forms. Incompatible species and optional selections are removed, calculation component references reconciled, and plots containing a removed basis discarded. Unrelated components remain. Required solvent/special-component dependencies return an explicit explanation. The legacy programmatic toggleElement discovery contract is preserved. Deliberate reaction exclusions still survive temporary component-form removal as required by the original tests.

## 6. Examples
Named Load example actions replace the shared session and record its origin. The current component summary is visible across workspaces. Edited examples are marked modified. The Beaker example loads only through an explicit action; returning to System shows its Ca/carbonate/Mg basis. Ordinary example controls are grouped under collapsed Load example panels.

## 7. Phantom-component protection
Tests remove Mg from the mixed example and verify removal from the basis, compatible aqueous/solid selection, fixed conditions, requested solubility components, plot state and analysis requests. A new Ca/carbonate sweep produces a single Ca curve and numerical export with no Mg/Ni/Mn chemistry fields. Raw source provenance Base64 is ignored for textual-name assertions because arbitrary encoded bytes are not chemical fields. Independent comparison choices are limited to components selected in System, with a calculation guard against unavailable component requests.

## 8. Development tools
Mn diagnostics remain dev-gated inside collapsed Development diagnostics, separate from the normal header and editable current chemistry. The existing diagnostic implementation is preserved. Production audit passes.

## 9. Number formatting
Central displayNumber applies pH: two decimal places; Eh/voltage: three; temperature: one at most; log values: three; concentrations/amounts/totals: three significant figures; general/fraction displays: four; diagnostic residuals can use six. Insignificant trailing zeros are removed and small/large numbers use scientific notation. The old formatNumber API remains for compatibility. Ordinary plot, inspection, Beaker, point, map, surface, Mn and condition labels use the centralized display formatter. Raw advanced JSON and editable numerical inputs preserve exact values; raw diagnostic messages and timing/coverage metrics are not reinterpreted as chemistry.

## 10. Concentration floor/ranges
The automatic concentration-like log display range cannot descend below -20. Output-type metadata explicitly identifies log concentration, dissolved amount and saturated solubility. The ordinary 1D range uses padded data extrema: [-11,-3] yields [-12,-2], rather than forcing -20. Extremely low data cannot distort the padding above the useful range. All-below-floor data remain below the viewport, not fabricated -20 values. Existing SVG clipping handles out-of-range geometry. Map color and surface vertical automatic ranges apply the same semantic floor; existing explicit manual ranges can override it.

pH, Eh/redox, log activity, saturation index, fractions, delta-G and unknown output types are excluded. Missing points still split paths. No scientific classification or mesh topology is changed.

## 11. Precision and science
No solver mathematics, constants, tolerances, activity assumptions, species removal cutoff, mass balances, Pourbaix thermodynamics or 3D scientific calculations were changed. Scientific values and JSON export functions retain original numerical precision. Inspection retains the actual sub-floor value, formatted scientifically; exact JSON remains available. No dilution/addition mechanics or new Beaker chemistry support.

Golden reference SHA256: aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960

Bundled database SHA256: 9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245

Both match the pre-task evidence.

## 12. Browser acceptance
**A–I: not browser-verified in this resumed run.** Browser automation failed to start with Windows sandbox error “helper_unknown_error: apply deny-read ACLs”; a reset/retry also failed with a trusted Node process startup error. There is no new screenshot. Approved shell execution permitted automated validation to continue, but it does not establish visual acceptance.

Automated counterparts cover chemistry selection/removal, tab identity, example synchronization, New/Reset isolation, unsupported Beaker behavior, dev-control placement, all 29 exact Beaker states, semantic display examples, clipping scope and retained sub-floor data. Real click behavior, visual layout and the complete browser cases must still be checked once browser automation is available. No successful browser case is inferred from unit tests.

## 13–14. Validation
- Focused final run: 49/49 passing.
- Full suite: **311/311 passing**, zero failures; all original 298 tests preserved, 13 tests added.
- Five golden benchmarks unchanged and passing.
- Build passed. Existing >500 kB chunk warning remains.
- Lint passed with zero errors and the existing ExpandedPlot effect-ref warning.
- Existing production audit passed.
- Full suite includes prior fraction, solubility, redox/Pourbaix, 2D/3D and multi-solid regressions.

## 15. Files
Source/test files edited during the interrupted and resumed task (no Git metadata is available for a historical diff):

- src/App.jsx
- src/chemistry/system.js
- src/thermodynamics/compatibility.js
- src/session/laboratorySession.js
- src/beaker/equilibriumBeaker.js
- src/components/CalculationWorkspace.jsx
- src/components/IndependentSolubilitySetup.jsx
- src/components/InteractiveBeaker.jsx
- src/components/AnalysisPanel.jsx
- src/components/AqueousFractionInspection.jsx
- src/components/CellDiagnostic.jsx
- src/components/FixedCondition.jsx
- src/components/GridDiagnostics.jsx
- src/components/GridPlot.jsx
- src/components/MassInput.jsx
- src/components/MnDiagnostic.jsx
- src/components/PointResult.jsx
- src/components/ScientificPlot.jsx
- src/components/SliceView.jsx
- src/components/Surface3D.jsx
- src/components/SweepResult.jsx
- src/plots/formatNumber.js
- src/plots/geometry.js
- src/plots/scalarMap.js
- src/plots/surface3d.js
- src/plots/threeSurfaceRenderer.js
- src/plots/export.js
- src/plots/gridView.js
- src/plots/mnDiagnostic.js
- src/plots/surfaceFigure.js
- src/plots/workspaceView.js
- tests/workspaceOwnership.test.js
- tests/semanticPresentation.test.js

Evidence/report files created by this task:
- docs/workspace-ownership-report.md
- docs/workspace-ownership-focused.txt
- docs/workspace-ownership-new-tests.txt
- docs/workspace-ownership-focused-final.txt
- docs/workspace-ownership-tests.txt (interrupted; not final evidence)
- docs/workspace-ownership-tests-final.txt
- docs/workspace-ownership-lint.txt
- docs/workspace-ownership-lint-final.txt
- docs/workspace-ownership-build-final.txt
- docs/workspace-ownership-production-audit.txt
- docs/workspace-format-audit.txt

The production build regenerated dist/ artifacts using the existing Vite deployment base. No deployment configuration changed and nothing was deployed.

## 16. Remaining limitations
Browser acceptance and screenshots are outstanding because of the environment failure. Beaker deliberately remains limited to the existing fixed-total, ideal 25 °C, 29-sample validated Ca/carbonate/Mg definition; other systems show unavailable. Graph ranges remain sampled presentation ranges, not analytical boundary estimates. Manual view overrides can show below -20. Exact/raw advanced provenance and diagnostics intentionally retain machine precision. Git-based before/after enumeration is unavailable in this folder.
