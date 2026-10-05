# Calculation result workspace — completion report

Date: 2026-09-17. Local changes only; no deployment or push.

## Reproduced failure and diagnosis

The actual local browser produced an empty React root after a successful ordinary Fe(II) 51-point pH sweep, followed by Diagram type changes and an unresolved fraction-component selection. The reproducible sequence was log concentrations → total fractions → aqueous speciation → calculated pH → total fractions → Choose component.

Captured at 2026-09-17T11:18:42.422Z:

```
TypeError: Cannot read properties of undefined (reading 'output')
    at SweepWorkspace (.../src/components/PlotWorkspace.jsx?t=1789639360272:201:118)
```

A rejected fraction request correctly returns diagnostics without metadata. The heading accessed `derived?.metadata.output.type`: optional chaining guarded the result object, not its absent metadata. The old accepted sweep remained mounted while setup supplied this invalid output request, so the render threw. No error boundary was added. The heading now handles a rejected output explicitly, leaving the original scientific diagnostics intact.

## Implemented behavior

- A distinct in-page Results mode automatically receives focus and scrolls into view after successful calculation. Setup remains available through Collapse results; Reopen retained results retains the mounted selected-sample provider.
- Accepted-result projection state is captured separately for each accepted snapshot. Editing setup does not overwrite it. Genuine input changes retain the existing stale-result protections.
- Desktop result buttons expose compatible log concentrations, total fractions, aqueous speciation, saturated log solubility, and log activities. A compact selector replaces them on mobile. Relative activities retain their existing validation-pending status. Availability uses the existing scientific output validator; the specialized mixed-system adapter remains restricted to its supported views.
- View-only transitions retain the exact sweep/outcome objects, selected sample, applicable species focus, and Beaker. They do not invoke the calculation callback or mutate the calculation definition.
- Transitions requiring a different definition open setup with “Requires new calculation.” The primary Diagram type selector still defines the problem.
- Plot and Beaker sit beside one another on desktop, stacking on narrow screens. X/Y/Z controls have restrained, distinct accents alongside their existing text labels.
- The compact Predominance Area now has the same reveal/collapse/reopen presentation. Its existing compact calculation and lazy exact-point inspector are unchanged. Response surfaces retain their existing 2D/3D controls and sample contract.

## Actual browser checks

Local Vite application, desktop 1280 × 720 and mobile 390 × 844:

1. Ordinary Fe(II), total 1 mol/kg H2O, pH 0–14, 51 samples: 51/51 accepted. Results appeared automatically with the Beaker beside the plot.
2. Selected sample 23 (pH 6.44): log concentrations → total fractions → aqueous speciation → log solubility → log activities → log concentrations retained sample 23. The Beaker consistently showed 26.4% dissolved / 73.6% solid-bound, Fe(OH)2(cr) 0.736 mol/kg H2O. These rounded values describe this browser control, not a new scientific reference.
3. Collapse/reopen retained sample 23 and the result. The result control did not return to setup while switching views.
4. Response-surface transition displayed the new-calculation notice. A pH × log Fe-total surface with 5 × 5 samples accepted 25/25; switching 3D → 2D → 3D retained sample 12 and its Beaker.
5. Fe Predominance Area: 2,565/2,565 accepted. Lazy inspection at sample 496 (pH 10, Eh -0.60 V) returned Fe3O4(cr), approximately 0.000333 mol/kg H2O. Collapse/reopen retained index 496 and its inspection.
6. Repeated the formerly crashing invalid fraction setup sequence after the fix. Setup remained rendered. Reopening displayed the retained log-concentration result with OLD/stale conditions instead of applying the incompatible draft request.
7. At 390 px width, the Result view selector was visible and switched to Total fractions. The temporary viewport override was reset.
8. Browser error log contained the original captured exception only; no new error appeared during the corrected workflows.

Zero-solve proof is instrumented in the focused Node regression below, rather than inferred from browser timing.

## Validation

- **49/49 focused tests passed**, zero failures/skips/cancellations/todo. Covers result workspace, diagram transitions, workspace navigation, compaction, diagram setup, plot inspection/gestures, fraction readout, and graph-first workspace.
- **5/5 dedicated tests passed with solver-module instrumentation.** Actual `solvePoint` count before/after the compatible view cycle: **51 / 51**. Strict reference equality verifies the retained snapshot, outcomes, selected equilibrium, and hovered equilibrium. The exact rejected-output crash has a regression.
- The instrumentation test is run alone with `--experimental-test-module-mocks` so earlier test imports cannot bypass interception. The same tests also pass under the ordinary test command without requiring this experimental flag. Experimental Node module-mocking warnings are test-tool warnings only.
- Production build passed and updated `dist`; existing large-chunk advisory remains.
- Production artifact audit passed.
- Lint: **0 errors**, one pre-existing warning in `ExpandedPlot.jsx` at line 21 about effect cleanup/ref capture.
- SHA256 preservation: **1,013 existing files examined; 1,007 unchanged; six intentional presentation/navigation-test changes; zero missing files**. Solver, calculation modules, thermodynamic data, chemistry, public assets/data, existing scientific fixtures and Wet Lab files remain unchanged. New result-view components/helpers, tests and this report are listed separately.
- Full repository suite was not run: no shared scientific calculation or routing algorithm changed. The existing diagram-transition function changed only its notice text; area solver/inspection calls remain the same. This follows the requested validation scope.

Existing files changed: `src/App.css`, `src/components/CalculationWorkspace.jsx`, `src/components/PlotWorkspace.jsx`, `src/components/PredominanceArea.jsx`, `src/session/diagramNavigation.js`, `tests/calculationCompaction.test.js`.

New production files: `src/components/ResultViewControls.jsx`, `src/plots/resultViews.js`. New tests: `tests/resultWorkspace.test.js`.

Evidence: `.local/result-workspace/before.json`, `preservation.json`, `focused-final.txt`, `solve-count.txt`, `build.txt`, `artifact-audit.txt`, `lint.txt`.

Stopped for review. No scientific constants, solver tolerances, normalization, validation fixtures or physical Wet Lab chemistry changed.
