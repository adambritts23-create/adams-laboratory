# Validated aqueous fraction diagrams — completion report

## 1. Definition and workflow

The new output identity is aqueous-fraction, labelled **Fraction diagram · aqueous only**. For ordinary analytical component E:

D_E = sum over selected compatible aqueous species j of nu(j,E) m(j)

f(i,E) = nu(i,E) m(i) / D_E.

The free basis component is included with coefficient1. All solid inventories are excluded. The old fraction output retains its original analytical-total denominator and solid membership, with an explicit UI explanation distinguishing it from the new diagram. Solubility remains a separate output.

Load the existing validated mixed Ca–carbonate–Mg example (explicit multi-solid opt-in), select Fraction diagram · aqueous only and choose Ca, carbonate or Mg. Calculate the pH sweep. To change the component or switch between mixed solubility and fractions, use Edit setup and Return to results: output-only changes do not recalculate equilibrium or increment the scientific input revision. Changed chemical inputs require recalculation.

The new output is restricted to a 1D pH sweep. The graph defaults to0–1; zoom/pan remain available and Reset view returns to the default. Existing legend/focus, direct labels where legible, hover/pin, expansion and SVG/JSON export are reused. Focused curves retain a direct label when the complete label set is crowded. Missing samples split curves. There are no new interpolated equilibrium values.

## 2. Stoichiometry and membership

Contributors come from the prepared system's selected aqueousRows and direct source coefficient matrix, not parsed display names or a hard-coded species list. Only positive coefficients for the selected ordinary component contribute; signed aqueous inventory definitions and special proton/electron/water targets are rejected. Excluded reactions never contribute. Canonical contributor ordering and compensated summation reduce ordering sensitivity.

The mixed example uses the existing11 aqueous reactions,10 candidate pure solids, totals Ca0.1 / carbonate0.1 / Mg0.001 mol/kg-H2O, pH0–14 with29 samples, ideal25°C and declared1bar. All three selected-component distributions are available at all29 accepted samples, even below solid saturation: an aqueous distribution does not require a saturated solid.

## 3. Multinuclear species

Every product uses its actual component coefficient. Mg4(OH)4+4 contributes4 times its molality in both numerator and denominator. At pH12 its weighted Mg contribution is approximately1.959115277e-20 mol/kg-H2O and normalized fraction5.907845852e-14. Neither a molecule-count denominator nor a free-ion-only denominator is used.

## 4. Zero and unavailable totals

The output uses an explicitly documented conservative eligibility floor of2e-14 mol/kg-H2O, drawn from the existing absolute balance floor. If D_E is at or below that floor, normalization is unavailable with dissolved-total-below-fraction-resolution, including an otherwise accepted tiny positive state. This is a fraction-output policy, not a change to solver tolerances or a claim that physical concentrations are exactly zero.

Negative/nonfinite contributions, nonfinite totals and failed normalization produce explicit unavailable results. Failed, unrun, unsupported or stale states cannot generate fractions. On stale UI results the old conditions and raw sweep remain identifiable, but current fractional values are null. JSON retains original raw equilibrium precision and revision. No missing point is filled or connected across a gap.

## 5. Independent analytical validation

A separate aqueous carbonate–H–water system was prepared from the unchanged stored reaction records. At fixed pH, all carbonate-bearing forms are first order in free carbonate, so its activity cancels from every fraction. Independently calculated weights are:

- CO3 2-:1;
- HCO3-:10^(beta_HCO3 - pH);
- H2CO3:10^(beta_H2CO3 -2pH);
- CO2(aqueous):10^(beta_CO2 -2pH).

Expected fraction equals each weight divided by their sum. Tests compare at pH3,7,10.5,14. Both database-supported CO2(aqueous) and H2CO3 forms are retained separately; no gas phase or new constants are introduced. A reduced selected set omitting H2CO3 confirms its contribution disappears and the remaining set normalizes correctly.

The mixed-system fractions are also independently reconstructed from the previously saved multi-solid evidence, using its aqueous amounts and source coefficients at all29 points, and compared against new derived curves.

## 6. Example results

Rounded examples from the preserved mixed-equilibrium evidence (the exports retain full doubles):

| Selected component / pH | Dissolved total (mol/kg-H2O) | Representative aqueous fractions |
|---|---:|---|
| Carbonate /7 |0.003044375889|HCO3-0.7832066261; CO2(aq)0.1765535088; CaHCO3+0.02961431737; other compatible species complete the sum|
| Ca /12 |7.106082562e-5|Ca2+0.7264195341; CaOH+0.1955183458; CaCO3(aq)0.07804943274; CaHCO3+0.00001268731583|
| Mg /12 |3.316124568e-7|MgOH+0.7751203942; Mg2+0.2134858838; MgCO3(aq)0.01139072588; MgHCO3+0.000002996066168; tetramer5.907845852e-14|
| Ca /14 |0.0001625258042|CaOH+0.9312744247; Ca2+0.03460012567; CaCO3(aq)0.03412539415; CaHCO3+5.547249200e-8|

Contributor counts are8 for carbonate,4 for Ca and5 for Mg in this selected mixed system. No species names are hard-coded in production normalization.

## 7. Normalization checks

For every valid sample and each of the three components, fractions sum to1 within1e-12. This dimensionless output check permits normal binary floating-point accumulation error, rejects invalid normalizations and does not alter a solver criterion. The UI shows both the sum of all contributing fractions and the sum of currently displayed fractions. Hiding curves does not renormalize them; a displayed subset need not sum to1.

## 8. Solids and inspection

Inspection exposes the selected component, equilibrium status, weighted dissolved total, all aqueous contributor molalities, coefficients, weighted amounts, normalized fractions and fraction sums. A separate expandable solid table shows active assemblage, all candidate amounts, statuses and saturation values. Existing residuals, selection diagnostics, rejected assemblages, input/system/revision identities and original-precision trace JSON remain available.

At pH12, for example, most supplied Mg is precipitated; its dissolved fraction curves still sum to1 rather than D_Mg/0.001. Calcite/brucite coexistence and the higher-pH three-solid state retain exactly the previous solver semantics. No solid amount enters the aqueous denominator.

## 9–10. Tests and checks

Nine focused tests were added. Coverage includes all three mixed distributions versus saved evidence, normalization, tetramer weighting, precipitated-inventory exclusion, zero/effectively-zero/nonfinite handling, a branded accepted tiny state, stale/cancelled/failed gaps, unsupported2D output, source-set omission, candidate reordering, existing scientific trace recomputation, exact export round trips and output switching without replacing the sweep. Analytical carbonate tests use only stored constants.

Full suite: **221 passed /0 failed**. All **212 previous tests** and all five unchanged golden benchmarks pass. The unchanged golden SHA256 assertion is aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960.

Build passed (existing large-bundle advisory). Lint:0 errors,1 pre-existing ExpandedPlot.jsx:21 ref-cleanup warning. Production boundary audit passed; bundled database SHA256 remains9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245.

Browser checks: selected carbonate fractions and calculated29/29; inspected pH7 normalized rows; switched to Mg using Return to results without another solve; inspected pH12 and coefficient4; checked focused direct labels and expanded plot0–1 range; edited Mg input and confirmed stale fractions became unavailable; restored audited totals, recalculated and viewed Ca fractions.

## 11. Exact files changed in this task

Modified:
- src/App.jsx — preflight selects fraction output without forcing the mixed solubility pair request.
- src/analysis/pointTrace.js — independent aqueous-fraction recomputation in the existing trace audit.
- src/calculations/definition.js — recognizes the distinct output identity and component requirement.
- src/calculations/outputDescriptors.js — selector identity and pH/1D/component preflight.
- src/calculations/outputs.js — branded fraction derivation from retained accepted samples, stale/gap handling, output metadata and0–1 default.
- src/components/CalculationWorkspace.jsx — mixed output selection via existing controls.
- src/components/OutputControls.jsx — explicit aqueous diagram and target component choice; legacy distinction.
- src/components/PlotWorkspace.jsx — reuses the stored sweep for current fraction selection and revision checks.
- src/components/ScientificPlot.jsx — fraction default range and inspection integration.
- src/plots/statusText.js — explicit fraction availability messages.

Added:
- src/calculations/aqueousFractions.js — membership, weighted normalization and output eligibility.
- src/components/AqueousFractionInspection.jsx — contributor/fraction/solid inspection.
- tests/aqueousFractions.test.js — nine focused regressions.
- docs/aqueous-fractions-report.md — this report.

Build regenerated dist/index.html and hashed assets. No solver, constant, tolerance, golden-fixture, database, existing test or stylesheet files were edited.

## 12. Remaining limitations

Only1D pH fractions are newly validated. Interpretation follows the selected direct source component basis; it is not arbitrary elemental/redox closure. Eligibility depends on a positive resolved dissolved inventory above the documented floor and nonnegative aqueous coefficients. Normalized fractions are conditional on the selected compatible reaction set and existing ideal-model domain; they do not establish completeness or empirical accuracy of the database. No new gases, nonideal activities, density conversion,2D/3D fractions, Pourbaix, kinetics or beaker UI. The legacy analytical-inventory fraction remains distinct and unchanged.

No deployment performed. The workflow is ready for review.
