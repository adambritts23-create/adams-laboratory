# Scientific workspace phase completion report

Completed 8 September 2026 in the existing working tree. No deployment was performed.

## Baseline and preservation

The original phase baseline was 181 passing tests. The interrupted implementation added three tests, giving 184. On resuming, the existing 184 tests passed before any further edits. Final result: **188 passed, 0 failed, 0 skipped**. All pre-existing tests remain in place.

The five official Java-reference expectations are unchanged. SHA-256 of `tests/fixtures/eq-diagr/references.json` remains:

`aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`

No solver mathematics, thermodynamic constants, reaction coefficients, activity calculations, mass-balance equations or numerical acceptance tolerances were changed. No additional thermodynamic constants were invented. The database asset, automatic loading, deployment base, artwork, expanded-plot implementation, species focus and scientific trace architecture were preserved.

## Delivered editor

The existing CalculationWorkspace now places diagram/output selection, axes and ranges, sample counts, physical conditions and compact fixed-component rows above the graph. Desktop axes and physical conditions sit side by side; narrower layouts stack these sections. The final CSS overrides the older display-contents/flex rules that interfered with this arrangement.

Existing AxisControls and FixedCondition are reused. Compact fixed rows omit the large sliders; after calculation, the existing live parameter controls remain available. Fixed totals versus activities and varied axes remain distinct. Exact numeric entries still flow through the existing CalculationDefinition and LaboratorySession actions. Edits increment the scientific revision and invalidate results; output/focus changes remain presentation-only. No save/reopen workflow was added.

Temperature and pressure show the current restricted 25 °C / declared 1 bar domain as read-only values. Ideal activity and automatic/not-evaluated or declared-zero ionic-strength assumptions remain available. Phase filters are identified as filters; included phases can be reviewed through the existing reaction review, and gas equilibrium is explicitly unsupported. The solubility option is disabled unless exactly one solid is included, and preparation validates that it is relevant to the selected component.

## Log-solubility definition

The new output identity is `saturated-log-solubility`. The existing `log-solubility` legacy identity retains its former log-dissolved-total semantics; it was not silently redefined.

For an ordinary, nonsuppressed component i in the explicit source basis:

`D_i = m(free component i) + sum over aqueous products j of nu[j,i] * m_j`

The reported value is:

`log10(D_i / (1 mol/kg-H2O))`

This is **conditional component solubility at equilibrium with the one relevant saturated pure solid**, under the declared calculation conditions and selected reactions. It is not automatically intrinsic solubility, an analytical total, a free-ion concentration, or the solid amount. Solid inventory is excluded from D_i. All component coefficients must be nonnegative for this output.

Applicability requires a branded prepared system, exactly one candidate pure solid with a positive target-component coefficient, and a matching accepted point result. The phase must be `present` or `saturated-zero-amount`, with its finite log saturation within the result's existing saturation tolerance. The normal derived-output layer additionally checks run/input/revision identity and scientific acceptance.

Unsaturated/absent phase, unsupported basis, missing relevant phase, failed/cancelled/unaccepted points and nonpositive or nonfinite dissolved inventory do not yield a solubility value. Values remain null with explicit reasons. A zero logarithm input is undefined, not negative infinity or an invented floor. No missing samples are interpolated. The low-inventory browser case explicitly displays “Relevant solid is unsaturated/absent; saturation solubility is unavailable.”

Output metadata records the solid identity and all contributing aqueous identities, names and coefficients. The metadata is inspectable in Conditions and scientific provenance. The separate scientific trace recomputes the dissolved sum from individual amounts and checks the saturation gate. Both 1D and 2D derived-output paths support this output; existing grid visualizations consume it without a new solver.

## Classification contract and Pourbaix gate

**Pourbaix remains DISABLED**, using the fallback expressly allowed by the phase prompt.

The reusable `classifyDissolvedFormGrid` operates on accepted sampled grid states. For ordinary components with nonnegative inventory coefficients, it considers the free target component and aqueous products carrying that component. It normalizes their coefficient-weighted contributions by their aqueous sum, then chooses the largest dissolved-component fraction. Candidates within `1e-10` fraction of the maximum are a tie. This classification tolerance is separate from numerical convergence tolerances.

The result preserves sampled coordinates, point identity, revision, candidate identity/provenance, fractions, ties and unavailable states. Actual solid states are separate metadata; a solid is not assigned an aqueous predominance fraction or automatic phase-stability priority. Failed or cancelled samples remain unclassified. No boundary interpolation or smoothing is performed.

The earlier inventory-dominance classifier is retained unchanged. As documented in the existing Phase 8 source archaeology, legacy Predom's formed-solid priority differs from that inventory rule and from the new aqueous-only rule. Neither is silently presented as MEDUSA-equivalent thermodynamic phase stability.

The small iron example demonstrates a valid restricted pH/pe coordinate calculation, not general oxidation-state closure. In that example the iron reaction has no proton term, so its boundary is independent of pH. No numerical obstacle was observed for this uncoupled example. What remains missing for a user-facing general Pourbaix mode is validated source-basis/redox closure together with independently validated coupled proton/electron/solid classification and phase topology. The solver still supports at most one candidate solid and no general basis substitution, nonideal activity model or gas equilibrium. This phase does not claim those capabilities and does not add a stability-map renderer.

## Validation cases

- **Analytical AgCl saturation:** unchanged precipitation fixture; components Ag+ and Cl-, both supplied at 0.001 mol/kg-H2O; aqueous AgCl and AgCl(s), ideal 25 °C / 1 bar. Using the fixture's actual constants, `Ksp = 10^(-logBeta_solid)` and equal totals give free Ag+ = free Cl- = sqrt(Ksp). Expected dissolved Ag is `sqrt(Ksp) + 10^(logBeta_aqueous) * Ksp`. The new logarithmic output agrees within `1e-8` log units and differs from both the supplied total and the free-ion amount.
- **Solubility gaps and trace:** zero supplied inventories are rejected as unavailable; mixed saturated/unsaturated 1D and grid samples preserve gaps; cancelled grids yield no values. The 1D independent trace agrees with the accepted solubility output. JSON serialization preserves the numerical point values exactly.
- **Iron redox classification:** existing acid-base and redox reference records combined without new constants: H+, H2O, Fe2+, e-, OH- and Fe3+. Fe total is 1e-5 mol/kg-H2O; solvent log activity is zero. X samples pH 0, 7, 14. Y samples pe 12.051, 13.051, 14.051, or their existing temperature-aware Eh equivalents at 25 °C. From the actual source reaction, `m(Fe3+)/m(Fe2+) = 10^(logBeta + pe)`, with logBeta -13.051. Every sampled winner and the central tie agree with that equation; the boundary is pH-independent in this restricted reaction set. The boundary comparison uses `1e-10` in pe, separately from the fraction tie tolerance and solver tolerances. The test also checks `log a(H+) = -pH` directly in accepted results.
- **Missing classification:** cancelled grids and deliberately unrepresentable log-activity coordinates retain the requested point count and coordinates, with failed samples unavailable and valid samples classified. No points are inserted to fill missing regions.
- **Editor state:** fixed-to-varied requests preserve LTV transformation, remaining fixed totals, exact numeric inputs and the original definition. Session edits invalidate point/grid/sweep results, increment revision and retain the previous plot snapshot for stale display. Output-only changes preserve the definition and revision.
- **Display integration:** logarithmic solubility uses logarithmic display ticks; inspection identifies log-total coordinates explicitly and explains unsaturation. Existing formatting, focus and expansion regression tests pass.

## Browser validation

Used the local production preview at `http://127.0.0.1:4173/adambritts-site/laboratory/` with the automatically loaded 4,445-record database.

- Acetate + fluoride: each total 0.001 mol/kg-H2O, H+/water, pH 0–14 with 51 samples. All 51 calculated successfully. Curves and direct labels were visible. Focusing CH3COOH left its label unambiguous; expanded mode and Escape worked. Sample 49 displayed pH 13.72 and inspectable species values.
- Compact layout: inspected the narrow default viewport and an explicit 1280×800 desktop viewport. The desktop request, physical conditions and fixed input fit above the graph without reconstructing the setup across multiple screens. The temporary viewport override was reset.
- AgCl solubility: selected Ag+, Cl-, solvent and optional AgCl(s), retaining the three compatible aqueous chloride complexes from the bundled database. Fixed Ag total 0.001 mol/kg-H2O; log10 Cl total from -8 to -2, 21 samples. All 21 equilibria calculated; 15 solubility values were available and six unsaturated states remained unavailable. This broader browser species set is distinct from the minimal analytical fixture.
- Inspected sample 1 at log10 Cl total -7.7: explicitly unavailable due to an unsaturated/absent solid. Inspected sample 18 at -2.6: displayed log solubility -6.276898131. Both coordinate labels explicitly state log10 molality. Metadata lists Ag+, AgCl, AgCl2- and AgCl3-2 as dissolved-Ag contributors and identifies AgCl(s).
- No browser console errors were captured. Pourbaix rendering was not tested or exposed because the scientific gate remains disabled.

## Final checks

- Focused display/plot/scientific-workspace tests: 11 passed.
- Full suite: **188 passed**, zero failures or skips; includes all five unchanged official golden cases.
- Lint: exit 0, no errors. One pre-existing `ExpandedPlot.jsx:21` effect-cleanup ref warning remains; that file was not changed by this phase.
- Production build: passed, 112 modules. JS 992.41 kB (272.43 kB gzip), CSS 26.97 kB (6.44 kB gzip). Existing bundle-size advisory remains.
- Production/static boundary audit: passed. Approved public database/artwork hashes unchanged; no unintended local files included. Existing Vite base retained.

## Exact phase files

Added:
- `src/calculations/solubility.js` — reusable applicability and accepted-state transformation.
- `tests/scientificWorkspace.test.js` — seven focused scientific/editor/display tests.
- `docs/scientific-workspace-report.md` — this report.

Changed:
- `src/App.css` — compact responsive setup and correction of conflicting legacy layout rules.
- `src/components/CalculationWorkspace.jsx` — pre-plot conditions/layout, explicit capability gate, existing session callbacks.
- `src/components/FixedCondition.jsx` — compact variant preserving existing live controls.
- `src/components/OutputControls.jsx` — solubility selection, phase gate and explanation.
- `src/components/GridWorkspace.jsx` — new scalar output integration.
- `src/components/ScientificPlot.jsx` — unambiguous sampled axis labels using the existing axis-label formatter.
- `src/calculations/definition.js` — new output identity and selected-target validation.
- `src/calculations/outputs.js` — 1D/grid solubility derivation and contributor metadata.
- `src/calculations/outputDescriptors.js` — selector grouping, preflight checks and distinct solubility identity.
- `src/calculations/predominance.js` — aqueous-only classification contract alongside the unchanged inventory classifier.
- `src/analysis/pointTrace.js` — independent reconstruction for the new output.
- `src/plots/presentation.js` — recognize the new output as logarithmic for display.
- `src/plots/statusText.js` — explicit solubility unavailability explanations.

Generated build outputs were refreshed under `dist/` by Vite. No dependency, deployment configuration, solver or thermodynamic-data files were edited for this phase. No unrelated development was begun.
