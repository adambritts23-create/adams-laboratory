# Mn diagnostic classification completion report

## 1. Audited candidates
The pinned saved system contains the same 19 products plus free Mn2+: 13 aqueous species and seven pure solids. No candidates or constants were changed. The inventory records all source identities and oxidation derivations, and 64 excluded records with their individual reasons (outside the audited Mn–H–O domain, or the reverse basis conversion). This is completeness within the audited bundled candidate set, not a claim about every phase in nature.

- Mn 2+: aqueous; Mn coefficient 1; oxidation state 2.
- a-MnOOH(s): solid; Mn coefficient 1; oxidation state 3.
- Mn 3+: aqueous; Mn coefficient 1; oxidation state 3.
- Mn(cr): solid; Mn coefficient 1; oxidation state 0.
- Mn(OH)2: aqueous; Mn coefficient 1; oxidation state 2.
- Mn(OH)2(am): solid; Mn coefficient 1; oxidation state 2.
- Mn(OH)2+: aqueous; Mn coefficient 1; oxidation state 3.
- Mn(OH)3-: aqueous; Mn coefficient 1; oxidation state 2.
- Mn(OH)4-2: aqueous; Mn coefficient 1; oxidation state 2.
- Mn2(OH)3+: aqueous; Mn coefficient 2; oxidation state 2.
- Mn2O3(cr): solid; Mn coefficient 2; oxidation state 3.
- Mn2OH+3: aqueous; Mn coefficient 2; oxidation state 2.
- Mn3O4(s): solid; Mn coefficient 3; oxidation state 2.6666666666666665.
- MnO(cr): solid; Mn coefficient 1; oxidation state 2.
- MnO2(s): solid; Mn coefficient 1; oxidation state 4.
- MnO4 2-: aqueous; Mn coefficient 1; oxidation state 6.
- MnO4-: aqueous; Mn coefficient 1; oxidation state 7.
- MnO4-3: aqueous; Mn coefficient 1; oxidation state 5.
- MnOH+: aqueous; Mn coefficient 1; oxidation state 2.
- MnOH+2: aqueous; Mn coefficient 1; oxidation state 3.

Oxidation is derived as 2 − nu_e/nu_Mn in the compiled Mn2+ basis and checked against original atom/charge balance. Mn3O4 reports average +8/3 only; no individual site assignment is inferred.

## 2. Classification semantics
Three separate modes show accepted phase assemblage, predominant dissolved species, or predominant dissolved oxidation state. Dissolved contributions are nu_Mn times aqueous molality. Oxidation contributions sum those amounts. A phase is active only with positive accepted amount, present status and accepted assemblage membership. Near-zero saturation alone is insufficient.

Comparison half-width is nu_Mn × (4e-14 + 2e-10 × abs(molality)), reusing existing numerical comparison budgets. Any upper bound overlapping the largest lower bound remains a possible leader. These are conservative numerical comparison budgets, not statistical confidence intervals or experimental uncertainties. Negligible dissolved Mn uses the existing 2e-14 absolute balance floor. Nothing changes solver acceptance.

## 3. States found
assemblage: Mn(cr) = 13; Mn(OH)2(am) = 25; Aqueous only = 122; Mn3O4(s) = 10; Mn2O3(cr) = 5; MnO2(s) = 20

species: Mn 2+ = 98; MnOH+ = 1; Mn(OH)2 = 2; Mn2(OH)3+ = 27; Mn(OH)4-2 = 7; Mn(OH)3- = 2; Mn(OH)2+ = 9; Unresolved dissolved tie = 1; MnO4-3 = 1; MnO4- = 47

oxidation: Mn oxidation state +2 = 137; Mn oxidation state +3 = 9; Unresolved dissolved tie = 1; Mn oxidation state +5 = 1; Mn oxidation state +7 = 47

Counts are sampled categories, not inferred continuous regions. All 195 states remain accepted.

## 4. Independent validation
Every point was checked against the prior original-source mass-action oracle, independently of compiled solver rows: the monomer/dimer dissolved balance T=A*a+B*a² and the most restrictive pure-solid free-activity cap. Largest weighted-species difference was 3.5778671692021646e-17 mol/kg. The machine-readable evidence includes representatives of every category and all 106 neighboring sample pairs whose classifications change; both endpoints are independently checked. No chemistry was rerun.

| Assemblage | Sample | pH | Eh / V SHE | Independent dissolved Mn / mol kg−1 |
|---|---:|---:|---:|---:|
| Mn(cr) | 6 | 6 | -1.5 | 1.7762929032736945e-11 |
| Mn(OH)2(am) | 55 | 10 | -0.75 | 0.0006524786563705982 |
| Aqueous only | 107 | 2 | 0.25 | 0.001 |
| Mn3O4(s) | 102 | 12 | 0 | 2.9731355413086375e-10 |
| Mn2O3(cr) | 117 | 12 | 0.25 | 3.351939949918788e-12 |
| MnO2(s) | 143 | 8 | 0.75 | 1.4390695990377157e-11 |

Aqueous redox representatives include sample 141 (+III), 119 (+V), and 171 (+VII). All aqueous contributions are independently checked, not just the leader.

## 5. Active and multiple solids
Six assemblage categories occur, including aqueous-only. No accepted multi-solid state occurs on this grid. The multiple-active classification branch is tested with an explicitly synthetic presentation fixture, not claimed as a new validated chemical coexistence. Historical ambiguous/coexistence solver regressions remain intact.

## 6. Ties and mixed states
Sample 118, pH 13 / Eh 0.25 V, has dissolved Mn approximately 6.048245171420473e-14 mol/kg. Its numerical comparison intervals cannot distinguish a unique species or oxidation leader; all candidates remain visible. This does not imply equal physical concentrations. Its positive MnO2 assemblage remains classified separately. No negligible-dissolved sample occurs here; that branch is tested synthetically. Failed, unsupported, ambiguous and stale inputs have explicit unavailable classifications, never interpolated values.

## 7–8. Water audit and rendered overlays
Optional overlays are off by default. Original gas formation relations give log(a_gas)=logBeta−nu_H*pH−nu_e*pe=0. At 25 °C: hydrogen pe=−pH; oxygen pe=83.09/4−pH. Eh=(R*T*ln(10)/F)*pe in V versus SHE. Source logBeta values are unchanged. Independent checks at pH 0, 7 and 14 validate the reactions and conversion.

H2 Eh: 0, −0.4141154477934763, −0.8282308955869526 V. O2 Eh: 1.228887591327141, 0.8147721435336648, 0.4006566957401884 V.

Assumptions: unit normalized fugacity f/f°=1 and unit water activity. The source reference-pressure scalar is unavailable, so these are not asserted to represent a specified absolute gas pressure. The equilibrium snapshot declares 1 bar; that does not resolve the gas standard-state scalar. Labels explicitly identify analytical references, not calculated gas equilibria. Other temperatures are rejected.

## 9–10. Diagnostic view and boundaries
Produced a development-only explicit-opt-in view of the pinned 195 states. Click or keyboard selection exposes the original point, controls, aqueous weighting, oxidation totals, active amounts, inactive saturation, residuals, provenance and classification reason. Existing expansion is reused. JSON includes the complete original snapshot and classifications at full numeric precision; SVG includes conditions and overlay assumptions. Classification cannot mutate the frozen snapshot; hash mismatch is rejected and retained evidence becomes stale.

Only sample markers are drawn. No polygons, smooth boundaries, interpolation or refinement were introduced. Public/general Pourbaix remains disabled.

## 11. Unresolved ambiguities
The single dissolved comparison tie, average solid oxidation assignment, absent absolute gas reference-pressure scalar, and completeness outside the bundled audit remain explicit. Sampled colors do not establish exact phase boundaries or kinetics.

## 12–13. Validation and preservation
249 tests pass: all 241 prior tests plus eight focused tests. The strengthened candidate-order test also passes after reordering products, concentrations, solids and metadata. Build and production audit pass. Lint has zero errors and the existing ExpandedPlot ref warning. The existing large-bundle warning remains. All five unchanged golden benchmarks pass. No solver equations, constants, tolerances, retry logic, solubility/fraction definitions, non-redox behavior or 3D behavior changed. No deployment.

Browser checks: explicit opt-in and verified snapshot loading; selecting sample 104; changing to dissolved-species mode; optional water references; expanded plot with exact point inspection. Screenshot saved. Export structure and stale behavior are covered by focused tests; no browser fault injection or separate narrow-viewport check is claimed.

## 14. Exact files changed in this phase
Modified: src/App.jsx.

Added:
- src/data/mnDiagnosticIdentity.js
- src/analysis/mnDiagnostic.js
- src/analysis/waterReferences.js
- src/plots/mnDiagnostic.js
- src/components/MnDiagnostic.jsx
- src/components/MnDiagnostic.css
- tests/mnClassification.test.js
- scripts/validate-mn-classification.js
- docs/mn-diagnostic-inventory.json
- docs/mn-classification-validation.json
- docs/mn-diagnostic.svg
- docs/mn-diagnostic-browser.png
- docs/mn-diagnostic-report.md

The build regenerated dist output. Prior source evidence and golden fixtures were not modified.

## 15–16. Limitations and smallest next phase
This is a fixed saved Mn example under ideal activities at 25 °C, not a general editable Pourbaix calculator. It excludes simulated gases, nonideal activities, kinetics and exact boundaries. The smallest next phase is a separately bounded audit of one adjacent phase change using its thermodynamic equality, without enabling generalized boundary smoothing or extending the chemistry.

Stopped for review.
