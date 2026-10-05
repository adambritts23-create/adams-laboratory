# Total fractions and precipitate consistency

## Scientific diagnosis (before presentation changes)

**A: the default automatic Fe(III) system genuinely predicts significant hematite precipitation at pH 0.** The amount is not a numerical trace, the beaker does not confuse saturation eligibility with positive inventory, and the numerical solubility ordinate uses the same accepted dissolved total. The previous multi-candidate saturation label could misleadingly associate the curve with Fe(OH)3(am), although the accepted controlling phase is Fe2O3(cr).

Control: supplied Fe(III)-basis inventory 1 mol/kg H2O, pH 0, Ideal, 25 C, 1 bar declared, no electron basis, default automatic four-solid set. Source and solver were unchanged before the audit.

- Supplied analytical total: 1 mol/kg H2O.
- Calculated total Fe inventory: 0.9999999999999999 mol/kg H2O.
- Total dissolved Fe: 0.8989408591996729 mol/kg H2O.
- Solid-bound Fe: 0.101059140800327 mol/kg H2O = 10.1059140800327% of supplied Fe.
- Component balance residual: -1.1102230246251565e-16; existing acceptance limit: 1e-10 mol/kg H2O.
- Existing saturation tolerance: 1e-12 in log saturation.

| Candidate | Exact amount / mol kg-1 H2O | Accepted status | Exact log saturation |
|---|---:|---|---:|
| Fe(OH)3(am) | 0 | absent | -4.950500000000001 |
| Fe(OH)3(s) | 0 | absent | -3.4805 |
| Fe2O3(cr) | 0.0505295704001635 | present | 0 |
| FeOOH(cr) | 0 | absent | -0.22050000000000003 |

The exact plotted ordinate is **-0.046268879310268275**, log10 of dissolved Fe; its unrounded linear value is **0.8989408591996729** mol/kg H2O. The point explicitly identifies source solid spana:2ac52a30213c9288:133739 (hematite). Multiplying its amount by its Fe coefficient 2 gives the solid Fe partition above. A value visually near log10(m)=0 does not imply zero precipitation at a supplied total of 1.

A second control explicitly includes only Fe(OH)3(am). At pH 0 it gives total = dissolved = 1, solid amount = 0, log saturation = -4.9043610106908755, absent status, and a null saturated-solubility output with reason relevant-solid-not-saturated. Its beaker draws no sediment. Thus phase scope matters: the two controls must not be described as the same thermodynamic model.

Exact pre-edit accepted input, result inventories, phase statuses, residuals and derived ordinates are in total-fractions-fe-pH0-audit.json. The report reconstructs the requested default automatic setup, not an inaccessible saved browser session.

## Presentation and output contract

Total fractions is a primary diagram choice. Aqueous speciation preserves the existing aqueous-fraction implementation and dissolved-only normalization. Both views reuse the same accepted 1D sweep. Total fractions supports a selected ordinary, nonnegative source component under an analytical total constraint; activity-controlled, unresolved, failed, forged or stale samples remain unavailable. No fraction surface support is newly claimed. Legacy fraction outputs used elsewhere remain unchanged.

For each carrier, total fraction = source component coefficient times accepted amount / supplied analytical total. Free basis species, compatible aqueous species and accepted solid amounts are included; eligible but absent solids contribute zero. Every carrier sum must reproduce the total within the existing per-point balance tolerance. No normalization of an incomplete sum to 100% occurs. Dissolved percentages use the unchanged aqueous-speciation calculation and its existing numerical floor. Total-fraction legends and exact inspection show both denominators for aqueous species; solid entries show only the total denominator. Exact export retains amounts, coefficients, fractions and closure.

Solubility labels now identify total dissolved component at accepted solid saturation. The exact sample disclosure names the actual controlling phase and retains all candidate amounts/statuses, raw log value and raw linear value. This is a label/trace correction; the solubility calculation is unchanged.

The schematic beaker only draws a solid whose contribution exceeds both one millionth (0.0001%) of at least one supplied analytical component total and that component's existing balance tolerance. Without a supplied total, a display-only floor of 1e-12 mol/kg H2O solid is used. These thresholds describe visibility, not phase stability, chemical detection limits or solver acceptance. Exact positive accepted solids remain in state, partition readouts and numerical inspection; their suppression from the drawing is disclosed. Significant hematite at the audited pH 0 remains visible. Bed height remains schematic, not physical volume.

## Validation

- Initial focused tests: 17/17 passed, covering existing beaker presentation plus six new total-fraction/Fe controls.
- Final focused tests: 30/30 passed, including navigation, aqueous speciation and independent selected-output reconstruction.
- Full regression: 513/513 passed in 421.917 seconds; zero failures, cancellations, skips or todo. The original 507 regressions plus six focused tests pass. The old Fractions button-text expectation was updated to the two requested view names.
- Production build and artifact audit pass. Lint has zero errors and its pre-existing ExpandedPlot.jsx ref-cleanup warning; the existing bundle-size advisory remains.
- Browser production-preview checks: automatic Fe3+ total 1, 51-point pH sweep; 10.1% of total Fe in hematite at pH 0, unchanged dissolved-only speciation, exact dual-denominator inspection, and corrected solubility label. View switching reported same calculated sweep without recalculation; no browser errors.
- Protected solver, thermodynamic importer/data code, Fe/Cu registry/support files and Pourbaix calculation hashes are unchanged. Existing reference comparisons and all five official goldens are covered by the full suite. See total-fractions-hashes.json.

## Files

Existing source files changed:
- src/App.jsx
- src/analysis/pointTrace.js
- src/beaker/acceptedState.js
- src/beaker/scene.js
- src/beaker/visual.js
- src/calculations/definition.js
- src/calculations/diagramSetup.js
- src/calculations/outputDescriptors.js
- src/calculations/outputs.js
- src/components/CalculationWorkspace.jsx
- src/components/DiagramSwitcher.jsx
- src/components/InteractiveBeaker.jsx
- src/components/PlotWorkspace.jsx
- src/components/ScientificPlot.jsx
- src/plots/diagramIdentity.js
- src/plots/formatNumber.js
- src/plots/legendReadout.js
- src/plots/presentation.js
- src/session/diagramNavigation.js

New files:
- src/calculations/totalFractions.js
- tests/totalFractions.test.js
- docs/total-fractions-phase.md
- docs/total-fractions-fe-pH0-audit.json
- docs/total-fractions-hashes.json

The only pre-existing test edited is tests/fastDiagramUx.test.js: expected button names now match the requested views. Reproduction scripts and logs are under .local/total-fractions/. dist was rebuilt locally. No deployment or push.
