# Stock-pH preparation and shared experiment workspace

Status: COMPLETE for review. No deployment or push.

## 1. Stock pH scientific contract

Initial stock pH is optional on **both** analytical-component stocks. Blank values return the original branded stock unchanged. Physical/reagent stock definitions retain their separate unchanged inventory contract; pH adjustment is not silently applied to them.

For a specified pH, `wetLabStockPH.js` creates an ordinary Calculation request for that bottle's supplied source-component subset, retaining the selected System's phase policy, selected compatible source products, exclusions, temperature, pressure and activity model. Components supplied only by the other bottle are absent from this independent stock basis; they are not replaced by tiny positive totals. H+/water remain special coordinates. No new reaction network or solver is introduced.

H+ is fixed through the existing pH condition. Once ordinary Calculation accepts the equilibrium, the adapter reads its signed `componentTotals[protonIndex]`, multiplies by model solvent mass (the existing 1 model kg H2O/L convention), and replaces the stock's signed proton inventory. Other supplied component inventories remain exactly as entered. Provenance retains the source identities, requested pH, accepted system/input/result and proton inventory before/after preparation. The changed net analytical charge is disclosed; no counterions are inserted.

Dispensing scales every conserved inventory with delivered volume. Mixing adds these inventories and volumes. Each dose uses the **full selected System** and the same existing ordinary Calculation constructor, with H+ returned to a total-inventory condition. Neither stock pH is imposed on the mixture. There is no pH averaging, interpolation, or second inspection equilibrium.

## 2. Independent preparation and round-trip evidence

At 0.010 mol/L analytical component, the tests independently construct the fixed-pH Calculation request, compare the entire accepted result, then release H+ as a conserved total and solve ordinary Calculation again. Source/species identities, concentrations, log activities, solids and residuals are checked. Round-trip comparisons use the existing numerical validation contract, without changing tolerances.

| Stock | Imposed pH | Conserved H total, mol/kg model H2O | Reconstructed pH |
|---|---:|---:|---:|
| Acetate | 5 | 0.003646565376899642 | 5 |
| Citrate | 5 | 0.013486701470223003 | 4.999999999999792 |
| Phosphate | 5 | 0.019962781620595543 | 4.999999999999030 |
| Carbonate | 5 | 0.01958584271894856 | 5.000000000000116 |
| Carbonate | 11 | 0.0007549031146365888 | 11 |
| Calcium | 7 | -2.6570483609344955e-8 | 7 |

Largest log-activity difference in the initial six-case probe was approximately 1.94e-12, below the existing 1e-8 comparison threshold. The tiny negative calcium-stock proton total is transported with its sign intact.

## 3. Homogeneous-stock limit

A fixed-pH stock with **any accepted positive solid amount** is refused before homogeneous transport. This check uses actual accepted inventory, not eligibility or saturation alone, and is stricter than the visual sediment threshold.

Browser and regression evidence confirm the message:

> Sample: Prepared stock contains an equilibrium solid. Transport of heterogeneous stocks is not yet defined.

The demonstration mixed 0.010 M Ca and carbonate in the same stock at pH 11. Prepare experiment became unavailable with that reason. No solid was discarded. Blank-pH inputs retain the previously accepted behavior.

## 4. Carbonate analytical total versus actual species

Both stocks below contain 0.010 mol/L total carbonate in the existing model-volume convention. Values are accepted mol/kg model H2O, numerically corresponding to mol/L under that convention; this is not an independently measured density conversion.

| Aqueous species | Stock pH 5 | Stock pH 11 |
|---|---:|---:|
| CO3 2- | 1.9976611114e-9 | 0.0082485843551 |
| HCO3- | 0.00042415228918 | 0.0017513761051 |
| H2CO3 | 0.000014438491292 | 5.9618276943e-11 |
| CO2(aq) | 0.0095614072219 | 3.9480206914e-8 |

Thus 0.010 M carbonate total at pH 5 emphatically does not mean 0.010 M free CO3 2-. Existing gas/phase boundaries are unchanged; no headspace, degassing or gas-loss model is added.

## 5. Titration parity

The existing differential harness checks unchanged H+/OH-, acetate, acetic acid, citrate, phosphate, acetate+formate, carbonate and Ca/carbonate cases. New stock-pH tests additionally compare 0, 25, 50 and 100 mL doses for acetate, citrate, phosphate, carbonate and acetate+formate against independently constructed ordinary Calculation requests. Exact prepared system/input, accepted/refused status, pH, species, concentrations, log activities, residuals and solids match.

For the carbonate-pH-5 / calcium-pH-7 example, 50 mL addition gives mixture pH about 4.98441, not the mean of 5 and 7. The 0 mL state retains the full-System exact-zero calcium gap; all 100 sampled positive doses are accepted. No synthetic connector is drawn through the unavailable point.

## 6. Calcium/carbonate precipitation

Sample: 50.00 mL of 0.0100 mol/L carbonate, independently prepared at pH 11. Burette: 200.00 mL of 0.0100 mol/L calcium, independently prepared at pH 7. Both starting stocks are homogeneous. Each listed mixed state agrees with equivalent Calculation.

| Delivered mL | Derived mixture pH | CaCO3(cr), mol/kg model H2O |
|---:|---:|---:|
| 2 | 10.98029481418 | 0.0003786100092685 |
| 25 | 10.69626105426 | 0.003326332692317 |
| 50 | 8.682906872258 | 0.004605378415798 |
| 100 | 7.932780547648 | 0.003080377745369 |
| 200 | 7.930997791130 | 0.001845528726965 |

At 50 mL, the 100 mL beaker contains 0.0004605378415798 mol CaCO3(cr); accepted log saturation is zero. Source identity remains `spana:2ac52a30213c9288:60759`. The pH-5 carbonate example remains dissolved under its conditions; precipitation is not fabricated to match the inspiration image.

## 7. Shared sediment and vessel mapping

Calculation and Wet Lab both use `BeakerDrawing`, the same glass/meniscus, phase pattern segments and exact-inventory inspection. The pre-existing visible-phase threshold is unchanged: a solid must exceed both the existing component balance tolerance and one millionth of at least one controlled component inventory; the fallback floor remains 1e-12 mol/kg.

For visible solid molality S, the existing illustrative base height remains `2 + 54*S/(S + 0.005)` SVG units (zero when no visible solid). The **shared vessel renderer now caps this at 24% of displayed liquid depth**. This prevents moderate precipitation from visually filling a shallow Wet Lab sample. The mapping is bounded and nondecreasing at fixed liquid depth; it is not a density, morphology, settling or physical-volume model. Pattern widths still represent shares of visible solid formula-unit molality, not component fractions.

Tests span absent/trace/small/moderate/large and multiple-solid mappings. A further accepted ordinary-Calculation audit (both analytical totals 0.010 mol/kg) records:

| Accepted state | Solid molality sum | Calculation height | Wet Lab height at 50/250 mL |
|---|---:|---:|---:|
| None, pH 0 | 0 | 0 | 0 |
| Hidden trace, pH 6.24919527 | 1.00001e-10 | 0 | 0 |
| Visible trace, pH 6.24919636 | 2.00000e-8 | 2.000216 | 2.000216 |
| Small, pH 6.24974489 | 1.00000e-5 | 2.107784 | 2.107784 |
| Moderate, pH 7 | 0.0069680841 | 33.4400 | 11.52 |
| Large, pH 10 | 0.0098925232 | 37.8701 | 11.52 |
| Two solids, pH 14 | 0.0098374742 | 37.8028 | 11.52 |

Heights are illustrative SVG units, not measured millimetres. The trace states were located by varying imposed pH with the unchanged ordinary solver. Exact accepted inventories and residuals are in `accepted-sediment-audit.json`.

 Accepted Calculation states at pH 0, 7, 10 and 14 were inspected in the browser, including two distinct accepted solids at pH 14. Exact amounts and component partitions remain untouched. Calculation keeps its fixed illustrative liquid level; Wet Lab uses volume/(initial sample + burette capacity).

## 8. Experiment workspace and synchronization

The left pane contains the sticky primary preparation action, burette stock and sample stock controls, then secondary examples/scope disclosures. The right pane switches **Beaker view / Titration curve / Species / Fractions / Solids** over the same accepted experiment. Graph projection choices, exact sample selector, click/hover/keyboard handling and volume controls remain available.

The large SVG scene places a burette above the shared beaker, with a dark hood, muted background bottles and a subtle decorative radiation-warning sign. Delivered volume, burette remainder, liquid fill, pH and sediment all come from the displayed accepted dose. The scene supports arrow/Home/End navigation and keyboard phase inspection. Unavailable states do not inherit a preceding precipitate.

Browser checks: all five views retained 50.00 mL and pH 8.68291; next selected 52.00 mL, 102.00 mL beaker volume and 148.00 mL burette remaining. Graph click selected an exact 98.00 mL sample. End selected 200 mL; Home preserved the genuine unavailable 0 mL state. Changing stock pH, a component or System invalidated old results. Desktop 1366 px and mobile 390/420 px had no horizontal document overflow (client/scroll widths 1351/1351, 375/375, 405/405 including scrollbar effects).

## 9. Image use and motion

The user-supplied images were visual inspiration only. No photograph, remote asset or external dependency was added: the photograph contains a fixed solid inventory and could misrepresent clear or unavailable states. A static vector hood/burette composition recreates the atmosphere while preserving dynamic scientific glassware. Background signage explicitly does not classify the selected solution's hazards. There is no continuous animation or kinetic implication; results focus respects reduced-motion preference. The requested concise illustrative-appearance disclosure is available under About this illustration.

## 10. Performance and zero-solve evidence

In the browser, the pH-11 carbonate/calcium experiment measured approximately 89.7 ms for stock preparation/setup and 4259.1 ms for the initial 101-dose series. The pH-5 example measured 83.5 ms and 4177.2 ms. These are local single-run observations, not broad performance benchmarks; stock setup time includes existing availability/catalog preparation.

Analytical solver entry instrumentation counted 2 stock solves + 101 dose solves = 103. Cycling all views and selecting already accepted points left the count at 103. The test observer separately verifies that repeated projections, preview/clear-preview, sample selection and cached set-volume requests produce no solver calls. Changing stock inputs may legitimately trigger debounced preparation preflight, which is separate from result-view switching.

## 11. Validation and preservation

Focused gates: **54/54 passed**, including eleven new tests for stock preparation, round trip, heterogeneous refusal, mixed-dose parity, zero-solve selection and sediment mapping. Browser checks passed with no captured errors/warnings. Full repository regression ran once and passed **773/773**, with zero failures/skips (804.06 seconds). Production build and artifact audit passed; lint completed with zero errors and the single pre-existing ExpandedPlot.jsx hook-cleanup warning. The build retains its existing large-chunk warning.

Hash comparison: **1,139 baseline files; 1,129 unchanged; 10 intended existing-file changes; 4 new files; none missing.** All solver, thermodynamic, public-data, existing test/reference and historical scientific-report files retain their original hashes. The full regression regenerated closed-solids-benchmark.json as usual; this run’s copy is saved locally and the historical report bytes were restored. No git repository is present, so the before/after SHA-256 manifest is the preservation authority.

Production output: dist/index.html, assets/index-DvIO1L0R.js, assets/index-D8DrHK7L.css and required data/static content are present. The artifact audit confirms the production graph contains only the allowed runtime dependencies and no test/reference imports.

Evidence directory: `.local/stock-ph-workspace/`. Principal files: `science.json`, `acid-base-doses.json`, `precipitation.json`, `browser.json`, `focused-final.txt`, `full-regression.txt`, `accepted-sediment-audit.json`, `build.txt`, `artifact-audit.txt`, `lint.txt`, `preservation.json`, `before.json`.

No deployment or push.
