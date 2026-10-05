# Mg(OH)2 pH log-solubility completion

Continued the current graph-first working tree. No earlier phase was restarted or reverted.

## Use

In System, click **Load Mg(OH)₂ pH solubility example**. This explicitly replaces the setup and opens Calculation with Log solubility, Mg as the inventory component, crystalline Mg(OH)2 as the sole candidate solid, pH 9–12 (61 samples), and total Mg 0.001 mol/kg H2O. Click Calculate. Edit setup retains the definition. These totals and ranges are editable example inputs, not thermodynamic data.

The normal manual path remains available: select Mg 2+, H+ and water; include Mg(OH)2(cr) through Review reaction set; choose Log solubility and Mg; vary pH. Exactly one relevant solid is required by the existing solver. The selected solid is now explicitly named beside the output controls; change it through the existing reaction review.

## Scientific definition and independent validation

The existing production solubility transformation was reused unchanged. At accepted saturation:

`D_Mg = m(Mg2+) + m(MgOH+) + 4 m(Mg4(OH)4+4)`

The output is `log10(D_Mg / (mol/kg H2O))`. Solid inventory is excluded. OH- is included in equilibrium but contributes zero Mg. All compatible supported aqueous records are included automatically; no hydrolysis product was removed to obtain a curve.

The bundled records supply every formation constant and signed coefficient. They identify Mg(OH)2(cr), MgOH+, Mg4(OH)4+4 and OH-; the selected Mg system contains no electron/redox component. Source provenance remains attached to the normal prepared system and export.

The independent analytical check uses the stored formation constants b_s, b_1 and b_4 and unit water activity. Pure-solid saturation gives `l = log10(a_Mg) = -b_s - 2 pH`. Therefore:

`D_Mg = 10^l + 10^(b_1 + l + pH) + 4 * 10^(b_4 + 4l + 4pH)`.

This expression uses no solver-returned activities or dissolved totals. Accepted output agrees within 1e-8 log units; additional checks reconstruct the weighted aqueous sum and Mg balance including solid inventory. The tetramer contributor is explicitly asserted to carry coefficient four. This validates implementation against the source equations, not the empirical accuracy of the database or an experimental solubility measurement.

When the saturation-required dissolved inventory exceeds the supplied total, the solid is absent and saturation solubility is unavailable. The example yields 61 accepted equilibrium points but only 42 solubility values; the other 19 are unsaturated gaps. It deliberately does not draw an analytical-total plateau. Failed points, unsupported inputs and nonpositive logarithm arguments keep the existing unavailable semantics. Domain remains ideal activities, 25 °C, declared 1 bar, one candidate pure solid and direct basis; no nonideal correction, general redox closure or Pourbaix capability was added.

## Files changed in this task

- `src/data/solubilityExample.js` (new): source-backed Mg–H–O setup factory, with no embedded constants or computed results; missing/ambiguous solid data rejected.
- `src/App.jsx`: explicit example loading action and feedback, using the normal Calculation → Plot pipeline and advancing the session revision.
- `src/components/CalculationWorkspace.jsx`: passes the actual selected solid name to output controls.
- `src/components/OutputControls.jsx`: displays that solid identity for saturated log-solubility.
- `tests/pHSolubility.test.js` (new): three tests for analytical agreement/weighted inventory, unsaturated and failed gaps, and missing-source rejection.
- `docs/pH-solubility-report.md` (new): this report.

Build regenerated `dist/`. No solver, thermodynamic database, tolerance, export implementation, plotting engine, dependency or deployment configuration was changed.

## Checks

- Focused Mg tests: 3 passed.
- Current full suite: **194 passed**, zero failures/skips; preserves all 191 prior tests and all five golden benchmarks.
- Golden reference SHA-256 remains `aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`.
- Lint: exit 0, one existing warning in unchanged ExpandedPlot.jsx.
- Build and production-boundary audit: passed; existing bundle-size advisory remains. Database/artwork hashes unchanged.
- Browser: loaded example, inspected explicit component/solid/pH setup, calculated into the existing graph-first Results view, returned through Edit setup and recalculated. Observed 61/61 equilibria and 42/61 available output values. Hover showed a finite saturated value; pinned pH 9.05 explicitly reported the solid unsaturated/absent. Existing zoom, pan, inspection, expansion and export controls remain present and their implementations unchanged. Exact JSON round-trip values are tested.

No numerical values were taken from the supplied reference image. No scientific blocker was found for this bounded Mg system; no attempt was made to reproduce the Fe/Zn/Cd curves.
