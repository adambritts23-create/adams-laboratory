# Independent multi-component 1D log-solubility completion

## Scope and use

In Calculation, enable **Compare independent pH solubility systems**. Select Mg, Ca or both; set each solution's analytical total and the common pH minimum, maximum and sample count, then Calculate. The compact comparison editor replaces the ordinary setup controls while active. Turning comparison off returns to the existing ordinary calculation definition.

The graph overlays separate metal–H–O equilibria at identical pH coordinates. It is explicitly **not a mixed-metal equilibrium**. Each preparation contains one metal component, H+, solvent water, all compatible supported aqueous reactions and exactly one deliberately selected pure solid. The current source repository supplies every constant. No simultaneous-solid solver was added.

## Chosen systems and weighting

| Independent system | Relevant solid | Total dissolved component molality |
|---|---|---|
| Mg–H–O | Mg(OH)2(cr) | m(Mg2+) + m(MgOH+) + **4** m(Mg4(OH)4+4) |
| Ca–H–O | Ca(OH)2(cr) | m(Ca2+) + m(CaOH+) |

OH- participates in both equilibria but contributes zero metal. Solid amount is excluded from the dissolved sum. These systems were chosen because the bundled database provides direct non-redox formation reactions and a single relevant crystalline hydroxide for each. Calcium adds a particularly simple independently checkable case. The completed standalone Mg example was not changed.

The default comparison uses pH 10–13.5, 71 samples per solution and 0.001 mol/kg H2O analytical total per metal. These are editable input choices, not constants or values taken from the user's figure. At these settings both solvers accept all 71 points; Mg supplies 71 saturated-solubility values, Ca supplies 5, and the other 66 Ca samples are explicitly unsaturated. The graph does not substitute total-inventory plateaus.

## Independent analytical validation

Let b_s denote the stored hydroxide-solid formation log constant. Both selected solids have signed source coefficients [1, -2, 2] for [metal, H+, H2O]. Under the existing ideal, unit-water-activity assumption, saturation gives:

`l = log10(a_metal) = -b_s - 2 pH`.

For each aqueous product with source coefficients n for metal and h for H+, its independently predicted molality is `10^(b_product + n*l - h*pH)`. The validation sums `n` times these amounts plus the free metal. This yields:

- Mg: `10^l + 10^(b_MgOH + l + pH) + 4*10^(b_tetramer + 4*l + 4*pH)`.
- Ca: `10^l + 10^(b_CaOH + l + pH)`.

The oracle uses stored source equations, not solver-returned activities or dissolved totals. Both log curves agree within 1e-8 log units at available samples. Additional checks reconstruct weighted totals from individual returned aqueous molalities and check metal inventory including solid. The tetramer coefficient is explicitly asserted to be four. Changing/removing Mg leaves the Ca point concentrations and derived curve exactly unchanged. This is independent mathematical implementation validation, not validation against experimental measurements or an assertion of empirical database accuracy.

## Inspection, exports and unavailable regions

The existing ScientificPlot and ExpandedPlot render the comparison: clickable focus legend, direct labels, hover/pin, zoom/pan/reset, visibility toggles, SVG and numerical JSON exports remain available. Labels identify Mg and Ca; setup, conditions and traces identify their respective solids.

Each inspected sample exposes component and solid identities, source IDs, per-species metal coefficients, aqueous molalities, weighted contributions, dissolved total, saturation status, final log value, unavailable reason, revision and point/system identities. Full-precision trace JSON is available below the display-rounded table. Complete JSON export retains each independently prepared source system, original sweep inputs/outcomes, provenance, diagnostic information and derived traces.

Unsaturated, failed, cancelled or unsupported samples have null solubility and explicit reasons. Existing segmented plotting does not bridge gaps. A preparation failure for one pair remains that pair's unavailable curve. Editing setup increments the existing session revision; stale comparison values are masked as unavailable for the edited request, with OLD conditions and a recalculate message. Raw old results remain in the explicitly stale export, without being promoted to current values. Results must be locally calculated and match the session revision before they can commit.

## Validation results

- Focused comparison tests: **4 passed**; focused comparison plus workspace tests: **7 passed**.
- Final full suite: **198 passed**, zero failures/skips; includes the preserved 194-test baseline.
- All five unchanged golden benchmarks pass. Reference SHA-256: `aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`.
- Build and existing production-boundary audit: passed.
- Lint: exit 0, with the existing warning in unchanged ExpandedPlot.jsx. Existing large-bundle advisory remains.
- Browser: Calculation → select pairs → Calculate → overlaid graph; Ca focus; pinned sample 70 at pH 13.5; both contribution tables (including Mg coefficient four); expand/exit; full numerical JSON export; Edit setup → change Mg total → old conditions and unavailable stale curves → Recalculate. Browser default setup yielded 142/142 accepted independent points. No new plotting engine was used.

## Exact files changed

New:

- `src/calculations/independentSolubility.js` — separate source preparations/sweeps, comparison assembly, exact traces/export and revision-checked commit.
- `src/components/IndependentSolubilitySetup.jsx` — pair selectors, independent totals and common pH sampling.
- `src/components/IndependentSolubilityPlot.jsx` — comparison presentation and export using existing ScientificPlot.
- `tests/independentSolubility.test.js` — four focused scientific/integration tests.
- `docs/independent-solubility-report.md` — this report.

Modified:

- `src/App.jsx` — routes explicit comparison requests through the existing cancellable calculation controller and commits matching comparison results.
- `src/components/CalculationWorkspace.jsx` — comparison mode/editor and result counts; preserves ordinary setup.
- `src/components/PlotWorkspace.jsx` — routes comparison snapshots to their view inside existing expansion.
- `src/components/ScientificPlot.jsx` — optional exact per-curve solubility trace disclosures.
- `src/plots/workspaceView.js` — actual calculated comparison conditions.

`dist/` was regenerated. No solver mathematics, constants, tolerances, golden fixtures, activity/pressure assumptions, default database, standalone Mg example, 3D implementation or existing numerical export implementation was modified. No deployment was performed.

## Remaining scientific limits

The selector is bounded to the two checked Mg/Ca hydroxide pairs, with 2–1000 shared pH samples. These are separate ideal solutions, not competition between solids/metals in a mixture. Arbitrary extra ligands from the ordinary system builder are not added to these explicitly defined metal–H–O comparisons. Each retains the existing 25 °C, declared 1 bar, ideal-activity, unit-water-activity, direct-basis restrictions. High-pH ideal-model values do not establish nonideal accuracy. No redox closure, Pourbaix, multiple simultaneous solids, nonideal model or new 3D behavior is enabled. Missing source records and unsupported conditions do not receive substitute constants or fabricated curves.
