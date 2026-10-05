# Solubility surfaces and scientific Beaker presentation

Completed 2026-09-17. Local only; no deployment or push.

## 1. 3D solubility

The existing surface response already implemented saturation-qualified log10 total dissolved selected-component molality, identical to 1D Log solubility. This phase clarified and verified that contract rather than adding a second formula. It is neither Ksp nor solid amount. Unsaturated, failed and unsupported outputs remain gaps. Existing assemblage-change mesh gaps remain intact.

The surface uses the existing supported axis contracts (pH, analytical totals with linear/log scale, log activity, imposed Eh/pe where preparation permits). It requires an eligible component and compatible admitted solid scope; availability remains preparation-dependent. The selected component is explicit. A missing eligible component now has a concise explanation.

Ag control: ideal, 25 C, Ag total 0.001 mol/kg H2O; pH 0–12, 5 samples; Cl total 10^-8–10^-1 mol/kg H2O, 8 samples. All 40 equilibria accepted; 8 saturation-qualified outputs unavailable. All grid values match the common accepted-result helper exactly. Three independent 1D pH slices (15 points) agree exactly, including unavailable values. Actual phases include AgCl(s), Ag2O(s), and coexistence. This is internal adapter/integration evidence, not new external validation of the domain.

## 2. Beaker visual model

Calculation retains a fixed illustrative liquid level. Wet Lab uses the existing additive solution volume divided by initial sample volume plus loaded burette capacity, bounded to [0,1]. No material density or physical solid volume is inferred.

Only accepted positive solids passing the existing display threshold contribute to visible sediment. The threshold and all accepted amounts are unchanged. For S, the sum of visible solid formula-unit molalities, nominal sediment height is 2 + 54*S/(S+0.005) SVG units, or zero when no solid passes the threshold. This is monotonic and bounded below 56 units. Phase pattern widths are proportional to each visible solid's molality. Exact amounts and component-weighted partitions remain in inspection. Formula-unit visual proportions must not be read as component fractions or physical phase volumes.

## 3. Illustrative properties

Glass highlights, meniscus, solution gradients, shadow, atmosphere, sediment texture and surface shape are decorative. Cyan/green colors do not predict chemical appearance. No density, crystallography, particle size, settling order, kinetics or gas bubbles were added. Calculation graduations are uncalibrated. The renderer consumes source identities and accepted inventories; it does not infer chemistry from formulas.

## 4. Calculation integration

1D, grid and Predominance inspection use the shared Beaker drawing and existing accepted sample adapters. The 2D map and 3D surface retain their common grid. Existing total fractions, dissolved normalization, phase acceptance, stale-result checks and export quantities are unchanged. Predominance retains its existing lazy exact-point inspection calculation; ordinary rendering does not invoke it independently.

## 5. Wet Lab

The apparatus uses the same glass/liquid/sediment renderer while keeping the burette and preparation workstation. Supplied physical volume can be shown in an uncalculated setup preview, but no sediment is shown without accepted equilibrium inventory. The existing transient preview and committed selection contracts are preserved.

## 6. Performance

Instrumented test: 55 equilibrium solves before and after 20 repeated surface/map projections and 800 selected-state/Beaker projections. Projection work took approximately 39 ms in that run; this is not a GPU frame-rate measurement. SVG work is proportional to visible phases and introduces no animation loop or solver dependency. Existing cached Wet Lab hover regression passed without additional solves.

## 7. Browser evidence

- Ag 1D: five accepted pH samples, one defined saturation output at the selected low chloride; aqueous-only sample had no sediment, Ag2O sample did.
- Ag surface: 40/40 accepted, 2D/3D switching and exact-index inspection exercised. Indices 0, 4, 29 and 39 included unsaturated, single-solid and coexisting-solid states.
- Existing Ca–carbonate–Mg example: pH 12 showed accepted Mg(OH)2(cr) about 0.001 and CaCO3(cr) about 0.0999 mol/kg H2O with different pattern widths.
- HCl/NaOH Wet Lab: accepted 50 mL titrant dose showed 100 mL solution, two-thirds of 150 mL display capacity, no sediment.
- Existing boric-acid precipitation example: 10 mL dose had no sediment; 20 and 30 mL doses had accepted sediment with different heights. Arrow navigation 20.00 to 20.50 mL updated the vessel to 70.50 mL.
- Fe Predominance lazy inspection: index 496, pH 10, Eh -0.60 V, showed accepted Fe3O4(cr) about 0.000333 mol/kg H2O; dissolved Fe about 1.6e-7 mol/kg H2O.
- Narrow 390 px viewport: Wet Lab and surface page document width equaled available width (375 px excluding scrollbar), without horizontal overflow. Desktop sizing restored afterward.
- Nested Wet Lab SVG viewport sizing issue found and fixed by explicit dimensions; resulting vessel fits the apparatus. No captured browser console errors.

## 8. Validation and preservation

- Focused combined regressions: 46/46 passed, zero failures/skips/cancellations (includes Fe/Cu/Cr area parity, Beaker, total fractions and Wet Lab controls).
- Instrumented surface/visual suite: 5/5 passed; 55-to-55 solve count.
- Final focused rerun after SVG sizing correction: 16/16 passed. This overlaps the combined suite and is not an additional unique test count.
- Production build passed; existing large-chunk advisory remains.
- Production artifact audit passed.
- Lint: zero errors, one existing ExpandedPlot.jsx:21 react-hooks warning.
- Preservation snapshot: 1,017 baseline files; 1,008 unchanged; nine intended visual/UI/test files changed; no missing files; zero protected science/data changes. New focused test and this report added. Solver, calculations, thermodynamic/source data and parity/golden fixtures preserved by SHA256.
- Full repository regression was not rerun for this focused presentation phase. A child-process test invocation hit sandbox spawn EPERM; the supported no-isolation invocation subsequently passed.

Evidence: `.local/solubility-visual/{before.json,preservation.json,ag-probe.json,focused.txt,regressions.txt,final-focused.txt,build.txt,audit.txt,lint.txt}`. Local research scripts/artifacts are not production dependencies.
