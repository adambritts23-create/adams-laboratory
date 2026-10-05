# Wet Lab phase 2 — graphical acid/base titration v1

Wet Lab is now a first-class workspace beside System and Calculation. It provides the requested 50.00 mL, 0.1000 mol/L HCl experiment with 100.00 mL of 0.1000 mol/L NaOH available. No new chemistry or changes to the Phase-1 state engine were introduced. No deployment or push.

## Interface and state ownership

The new `WetLab.jsx` view renders an SVG burette above a beaker, a prominent physical/pH readout, dispensing controls, an interactive calculated curve and expandable inspection/model disclosures. Burette fill scales with selected remaining volume; beaker fill scales with selected total solution volume. Drawings are explicitly schematic. Liquid colour represents liquid, not an indicator or compound colour. The apparatus takes a titration state rather than acid/base equations.

`wetLabExperience.js` is a UI orchestration/cache adapter over unchanged `prepareStockSolution`, `prepareWetLab`, `runTitration` and `selectTitrationState`. It precomputes 107 accepted samples: 0–100 mL in 1 mL steps plus 49.5, 49.9, 49.99, 50.01, 50.1 and 50.5 mL. These are sampling coordinates only; no pH transition is hard-coded. New arbitrary volumes receive one independent Phase-1 solve and become selectable calculated points.

Each curve entry retains the engine's exact state. The apparatus, readout and chart receive that same selected object; the equilibrium inspection reads the existing result, with no second solve. The DOM exposes matching selected-state IDs on all three views for verification. Selecting a cached point or resetting does not invoke the solver. Component unmount disposes the adapter, and a changed source requires fresh preparation. Returning to Wet Lab starts a fresh experiment; it does not reuse a disposed selection.

## Controls and interaction

- +0.01, +0.10 and +1.00 mL change total delivered volume; they disable when the available inventory would be exceeded.
- Typed total volume is validated; empty/invalid/nonfinite, negative and above-capacity values are refused. pH is read-only.
- Reset selects the original accepted 0 mL state, restoring the full burette and 50 mL beaker.
- The 49.99 mL shortcut makes small additions around equivalence accessible.
- Clicking a curve point selects it. Clicking between points selects the nearest calculated X coordinate, independent of pointer Y; no interpolated pH is accepted.
- Arrow keys, Home/End and the calculated-sample selector provide keyboard alternatives.
- Connecting lines are presentation only. Unavailable results are gaps and never fabricated numerical outputs.

The adapter rejects copied/foreign points, disposed experiments and obsolete asynchronous requests. A newer selection invalidates a pending arbitrary-volume calculation before it can replace the selected state.

## Inspection and conventions

Expandable inspection reports exact pH, supplied analytical proton-equivalent inventory, H+, OH−, Na+ and Cl− concentrations, accepted input identity and the original preparation/mixing provenance. At zero sodium inventory it explicitly reports zero supplied inventory rather than inventing a trace species. The model section identifies dilute-ideal-aqueous-volume-v0, additive volumes, the 1 model kg H2O/L numerical coordinate, ideal activities, 25 °C and unit water activity. It disclaims actual density/solvent mass, contraction and experimental-grade 0.1 M accuracy. No gas, solid, redox or kinetic features were added.

## Actual browser validation

Tested in the local rendered application at `http://127.0.0.1:5178/adambritts-site/laboratory/` using the bundled source:

| Total NaOH added (mL) | Remaining (mL) | Beaker (mL) | Displayed accepted pH |
|---:|---:|---:|---:|
| 0.00 | 100.00 | 50.00 | 1.00000 |
| 25.00 | 75.00 | 75.00 | 1.47712 |
| 49.99 | 50.01 | 99.99 | 4.99991 |
| 50.00 | 50.00 | 100.00 | 7.00075 |
| 50.01 | 49.99 | 100.01 | 9.00150 |
| 100.00 | 0.00 | 150.00 | 12.52438 |

All six states had identical apparatus/readout/chart state IDs. Direct input selected each value. Sequential +0.01/+0.10/+1.00 clicks selected 0.01/0.11/1.11 mL with pH 1.00017/1.00191/1.01929. The shortcut plus +0.01 selected exact equivalence. ArrowRight moved from equivalence to 50.01 mL. A direct SVG point click selected 50.00 mL, and the sample selector recovered 25.00 mL.

At equivalence, inspection showed H+ and OH− = 9.9827455148e−8, Na+ and Cl− = 5.0000000000e−2 mol/kg model H2O; proton-equivalent inventory was zero. Clearing the input via keyboard and applying showed the typed validation message while retaining 50.01 mL. Reset returned 0/100/50 mL and initial pH 1.00000. No browser console errors were captured.

At a temporary 390 × 844 viewport, controls remained usable; the +0.01 mL button measured 89.16 × 42 pixels, document scroll width was 375 pixels (no horizontal overflow), and a mobile-width increment correctly updated the selected state. The apparatus/curve stack at narrow widths. The viewport override was restored afterward. Desktop screenshots were visually inspected for apparatus, curve and readout readability. The local tab was left at the reset state for review.

## Automated validation

Focused Phase-1 and UI-adapter tests: **16/16 passed** (`wet-lab-ui-focused.txt`). Six new tests cover dense accepted sampling, shared result identity and no selection-time solving, arbitrary-volume caching/reset, invalid/forged/foreign states, cancellation races and navigation preserving ordinary chemistry/revision. The original ten Phase-1 tests remain unchanged.

The full regression was run exactly once: **620/621 passed**, with one obsolete navigation assertion expecting two primary workspace buttons rather than the newly required three. No scientific test failed. That assertion now expects three and explicitly verifies the Wet Lab pressed-state semantics. The final affected suite (navigation, Phase 1 and UI adapter) passes **21/21**, recorded in `wet-lab-ui-final-focused.txt`. The full suite was not repeated, respecting the once-only instruction. The SVG maximum fill scale was corrected while the full run was in progress and then verified in the browser at 150 mL; no state-engine code changed. Production build and artifact audit pass (`index-DW6fJR1N.js`). Lint has zero errors and the pre-existing ExpandedPlot cleanup warning; Vite retains its large-chunk advisory.

## Preservation and scope

The pre-edit hash audit covers 786 existing files. Only `src/App.jsx` (workspace mounting/navigation), `src/session/laboratorySession.js` (allowing the workspace name), and `tests/axisGrouping.test.js` (updating the primary-workspace count) changed. Phase-1 calculations, equilibrium solvers, thermodynamic data, redox/closed chemistry, Pourbaix, imposed-Eh, ordinary calculation, fraction views and golden/reference evidence retain their original hashes. The complete difference list is in `wet-lab-ui-preservation.json`.

New production files: `src/calculations/wetLabExperience.js`, `src/components/WetLab.jsx`, `src/components/WetLab.css`. The new focused test file is `tests/wetLabExperience.test.js`.

This version intentionally exposes one fixed experiment. No arbitrary stock configuration, weak acids/bases, indicators, precipitation, redox, heat or animation kinetics are claimed. Those future features can supply compatible physical states to the apparatus after separate scientific validation. Wet Lab selections do not alter System/Calculation chemistry.
