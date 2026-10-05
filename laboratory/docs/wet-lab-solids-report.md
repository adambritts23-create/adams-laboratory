# Wet Lab / Calculation pure-solid equilibrium parity

## A. Routing
See wet-lab-solids-routing.md for the pre-edit audit. The existing closed-physical-nonredox boundary now accepts explicit aqueous + pure-solids. Direct source laws are transported through authoritative component atom/charge metadata; neutral integral-composition solid products enter prepareChemicalSystem with bounded-multisolid-v1. solvePoint uses its unchanged closed-pure-solid-active-set-v1 policy. Aqueous and accepted solid inventories are solved simultaneously, with the existing complementarity and balance acceptance checks. No post-processing precipitation or new solver.

Wet Lab requests this scope when System permits solids; aqueous-only scope still withholds supersaturated states. The reviewed historical chloride acid/base scope remains explicitly restricted. Exclusions and revision/source identity checks remain in force. The closed-redox wrapper and its reviewed phase list are unchanged.

## B. Physical and numerical control
Existing reviewed recipes, no new reagent: 50 mL final 0.8 mol/L B(OH)3 solution plus independently delivered 1 mol/L NaOH. Each dose supplies 0.040 mol B and V/1000 mol NaOH; model solvent mass is (50+V)/1000 kg. Internal totals are B=40/(50+V), Na=V/(50+V), H-equivalents=-V/(50+V), with unit water activity. Both initial stocks separately produce accepted aqueous-only inventories. Initial sample is undersaturated relative to H3BO3(cr).

This is a concentrated ideal-model computational control. The numerical volume convention is not measured density or a nonideal solubility prediction. Fixed-pH FeIII was deliberately not treated as equivalent to a closed physical solution.

Three routes agree: physical compiler; ordinary Calculation automatic source discovery/preparation with equivalent signed analytical totals and default solid enumeration; existing independent raw-source Newton/phase reference (no production compiler or solver imports). Independent reference includes every reachable source-law carrier, not a fitted precipitation equation. No Eh or pe is determined or reported for this non-redox benchmark.

| Added NaOH / mL | pH | Borate solid / mol kg⁻¹ model water | Dissolved B / mol kg⁻¹ | Solid-bound B / total B |
|---:|---:|---:|---:|---:|
| 0 | 3.794069948597 | 0 | 0.800000000000 | 0% |
| 10 | 7.913636069223 | 0 | 0.666666666667 | 0% |
| 20 | 9.230874291000 | 0.026802137046 | 0.464220023246 | 18.76149593% |
| 30 | 10.215384779271 | 0.011367888676 | 0.454528445296 | 9.09431094% |
| 50 | 12.947511963489 | 0 | 0.400000000000 | 0% |

Maximum absolute carrier difference: ordinary Calculation 2.926e-14 mol/kg; independent reference 7.495e-16 mol/kg. Maximum independent pH difference 1.777e-15. Maximum component residual 6.884e-14 mol/kg; maximum charge residual 4.035e-14 equivalents/kg, both within unchanged propagated solver bounds. Full per-carrier amounts, both component partitions, saturation values for every candidate, mass-action and component residuals, source provenance and timings are in wet-lab-solids-benchmark.json.

## C–D. Complementarity and accepted phases
At 0, 10 and 50 mL, every admitted candidate amount is exactly zero and no candidate is supersaturated within the existing acceptance tolerance. No sediment appears. At 20 and 30 mL, the only positive solid is source spana:2ac52a30213c9288:221010, Na2B4O7·10H2O(s), with formation log K=-12.4 from the imported 82NBS/Wagman et al. reference. Source terms: 2 Na+, -2 H+, 4 B(OH)3, 5 H2O. These coefficients, not the display formula, provide inventories. At 20 mL its log saturation is about 1.78e-15; H3BO3(cr) and B2O3(cr) remain absent at log saturations -1.10239536 and -8.08979072. Wet Lab's equivalent floating-point preparation gives log saturation exactly zero. The accepted physical amount is about 0.001876149593 mol in the 70 mL model mixture. Reordered source records give identical results. Higher-dose redissolution was a cheap nearby control, not a widened chemistry search.

## E. Analytical views
Total Fractions retains its supplied-component denominator and source weighting: each borate formula unit binds 4 B and 2 Na. At 20 mL, 18.7615% of total B is solid-bound and 81.2385% remains dissolved. The leading aqueous carrier accounts for 38.660% of total B versus 47.589% of dissolved B. Aqueous Speciation includes only dissolved carriers. Existing fraction functions are unchanged. Wet Lab Log concentrations remains explicitly aqueous; solids are exposed through Total Fractions and phase inspection, not mislabelled as dissolved concentration.

## F–G. Presentation and interaction
The apparatus consumes acceptedState.visual, including the existing inventory threshold. It never draws from phase permission or saturation alone. Restrained green sediment is schematic; height is not physical solid volume. Compact phase inspection contains source identity, exact amount per model kg and actual model-mixture moles, component-bound amounts and saturation. Absent and excluded phases are expandable. Legends distinguish solid and aqueous phase.

Browser validation: initial 0 mL has no sediment; 20 mL shows sediment, pH 9.23087, 70 mL beaker and 30 mL burette remaining. Total Fractions and Aqueous Speciation show the denominator distinction above. Commit 10 mL (no sediment), preview 20 mL (sediment), leave graph: exact 10 mL state restored. Graph, beaker, readout and inspection share the same accepted sample ID; commitment stays unchanged during preview. Focused tests verify view/hover operations do not increase solve runs and stale disposed experiments cannot be reused. See wet-lab-solids-browser.json.

## H. Limits
Independent equilibrium at each cumulative dose, not kinetics, nucleation, ageing, hysteresis or persistence of previous precipitates. No finite gas/headspace or gas-loss model; required gas closure remains unavailable. Connected aqueous redox still refuses the non-redox boundary. Electron-dependent phases outside the declared non-redox scope remain disclosed and unevaluated, not assigned guessed saturation. Pure-solid support remains bounded by source reachability, neutral integral atom metadata, existing 12-candidate limit, 16-component/64-carrier physical network limits and unchanged solver acceptance. No CrCl3 recipe or chemistry-specific precipitation branch was added. Future CrCl3/NaOH support must derive intrinsic Cl/Na inventories, hydrolysis, chloride association, phases and possible high-pH carriers through the same compiler.

## I. Performance
Focused sequential evidence: two candidate solids at zero sodium, three thereafter; one phase-selection step for absent states, two for precipitating states. Cold compile 1794 ms; subsequent compiles 463–554 ms, preparation 21–24 ms, solve 1.24–1.64 ms (cold first solve 5.62 ms). Compilation remains the main cost, not solid selection. Future structural reuse would need to bind source fingerprint, basis/support scope, permitted phases and exclusions while regenerating dose-specific inventories and revisions. No checks were weakened and no optimization introduced.

## J. Validation
Focused final tests: 10/10 Wet Lab mixed/solid tests pass; 9/9 physical non-redox tests passed in the initial focused run. Initial focused run exposed two test assumptions: zero admitted solid rows were compared with an aqueous-only reference, and a new physical-moles check used a decimal literal instead of the original stock value. Corrected tests retain the exact saved aqueous reference and explicitly assert zero solids in the mixed control. No reference values or scientific tolerances changed.

Single full regression: **678/678 passed**, zero failures/cancellations/skips/todo, 771.69 seconds. Production build passed (index-BppNHLNF.js); artifact audit passed. Lint: zero errors, one existing ExpandedPlot.jsx line 21 ref-cleanup warning. Build retains the existing large-chunk advisory. Preservation comparison: 51 of 52 inherited protected files unchanged; the sole changed file is equilibriumNetwork.js, the explicitly requested compiler integration. No unexpected protected-file changes. Solver, tolerances, source dataset/importers, fraction mathematics, imposed-Eh code and saved mixed reference are unchanged. Existing reference/golden regressions pass. Logs: wet-lab-solids-regression.txt, wet-lab-solids-build.txt, wet-lab-solids-artifact-audit.txt, wet-lab-solids-lint.txt and wet-lab-solids-preservation.json.

No deployment or push.
