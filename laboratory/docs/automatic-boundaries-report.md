# Automatic chemistry and boundary inference — review report

## Result

Calculation now infers pH/electron boundaries from the chosen axes and explicit fixed conditions. The primary imposed/derived dropdowns are replaced by a read-only summary. Fixed pH/Eh are optional explicit controls. Removing an activity axis removes its reservoir condition; no default pH=0 is inserted. Signed analytical H+ equivalents remain available.

Selected-source connectivity uses the existing non-redox source-scope audit, which identifies connected electron-bearing chemistry. Electron coordinates are available to axis setup without selecting an electron reagent. No oxidation states, atoms or thermodynamic constants are guessed. New UI definitions carry `automaticBoundaries`; older explicit area requests retain their recorded boundary semantics rather than being reinterpreted.

Closed composition dispatch reuses the general equilibrium constructor independently for each dose, with its existing source discovery, charge checks, phase admission and numerical solver. Accepted samples reuse the existing closed-sweep plotting/inspection adapter. Ordinary non-redox composition stays on the existing signed analytical-component path. Mixed reservoirs remain unavailable with an explanation. Advanced single-point calculation cannot silently bypass the closed path.

## Important acceptance limits — not hidden by the UI

The exact requested H+/H2O/Fe2+/H2O2 system, Fe2+=1 mol/kg water and H2O2=0–1, is correctly detected as closed redox. However, the existing general closed constructor refuses its **+2 mol charge equivalents/kg water** supplied charge. It requires explicit countercharge. This is not only a zero-dose problem. No counterion, acidity, equilibrium or successful sample was invented. Consequently the requested 51 successful closed equilibria cannot be claimed under the instruction to preserve existing science.

For that same peroxide-containing system, X=pH/Y=Eh correctly sets both imposed boundaries, but the existing imposed source-basis transformation cannot prepare the selected independent totals. It reports unavailable and does not discard peroxide or substitute a different system. Broader support would require a separately scoped scientific decision.

A supported Fe-only pH/Eh area works without an explicit e- selection. Browser control: Fe total 0.001, pH 0–14, Eh -1–1.2 V, 3x3: **9/9 accepted**.

## Actual browser checks

- Requested Fe/peroxide setup: X=linear H2O2 total 0–1, 51 points, Fe total=1, no fixed pH/Eh. Readout: both calculated; redox detected. Plot reports the exact missing-countercharge explanation.
- Charge-balanced control: Fe2+=1e-6, H+ equivalents=.01, Cl-=.010002; H2O2=2.5e-7–5e-7, three points. Normal UI, no e- selection or closed-mode switch. Accepted result and Beaker display pH=2.0008757578290273 and Eh=0.7517778984871897 V at the first dose. The browser's default pure-solid scope also reports eight considered phases and no accepted precipitate there.
- Acetate: signed H+ total -1–1, 51 points, fixed acetate total. **51/51 accepted**, calculated pH, Eh not applicable, no connected electron-transfer chemistry. This retains the established analytical acid/base interpretation; it is not an implicit physical NaOH recipe.
- Area pH/Eh axes: summary names the imposing X/Y axes. Removing Y=Eh returns Eh to calculated status and immediately explains the unsupported mixed reservoir. No stale fixed potential remains.
- Supported Fe-only area: 9/9 browser points as above, using source-derived redox preparation and existing exact-point inspection.

## Validation

**99 distinct relevant tests pass across targeted runs**, not a new full-suite count:

- Initial focused group: 26 tests (automatic inference, navigation, diagram setup, constructor).
- Relevant closed-reagent, acetate and imposed-Eh regressions: 36 tests.
- Solver/source/golden checks: 28 tests, including all five official goldens.
- Final area/automatic/compaction group: 15 tests, with nine overlapping the above groups; all six area regressions pass. Fe/Cu exact fractions preserved; Cr 2,565 accepted equilibria/eight carriers unchanged.
- Final static-import adapter recheck: 14/14, overlapping the above groups.

The charge-balanced general aqueous control agrees with reviewed Fe/peroxide pH and Eh within 1e-8 at all three overlapping doses. Total fractions, aqueous speciation, exact selected-object identity and stale rejection pass through existing adapters. No independent validation claim is extended to the 1 mol/kg example.

Production build succeeds. Artifact audit passes after replacing new dynamic imports with explicit static imports required by the existing audit. Lint has zero errors and the pre-existing ExpandedPlot ref-cleanup warning. All 33 protected hashes match the previous milestone. Existing large-bundle warning remains.

Artifacts: `.local/automatic-boundaries-focused.txt`, `automatic-boundaries-regression.txt`, `automatic-boundaries-goldens.txt`, `automatic-boundaries-final-regression.txt`, `automatic-boundaries-import-recheck.txt`, `automatic-boundaries-build.txt`, `automatic-boundaries-artifact-audit.txt`, `automatic-boundaries-final-lint.txt`, `automatic-boundaries-preservation.json`.

No solver, thermodynamic data, tolerances, Wet Lab implementation or reference evidence was edited. No deployment or push. Stopped for review with the two acceptance-scope limits explicitly disclosed.
