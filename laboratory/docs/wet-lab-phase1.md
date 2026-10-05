# Wet Lab phase 1 — volumetric acid/base state engine

This is a state-engine deliverable, not a graphical Wet Lab release. The benchmark is 50.00 mL of 0.1000 mol/L HCl with 0.1000 mol/L NaOH at 25 °C. No existing production file, solver equation, tolerance, thermodynamic record or reviewed redox preparation was edited. No deployment or push was performed.

## 1. Existing chemistry path and audit

The ordinary `prepareChemicalSystem` → `createPointInput` → `solvePoint` path is sufficient. It already accepts signed component coefficients and signed analytical proton totals. The reviewed source water reaction expresses OH− = H2O − H+, log K = −14.0015, record `spana:2ac52a30213c9288:250448` (CODATA/88Sho–Hel source references retained in the record). Water has fixed log activity zero. HCl supplies +1 proton equivalent and +1 chloride; NaOH supplies −1 proton equivalent and +1 sodium. The resulting proton balance is [H+] − [OH−] = supplied proton equivalents per model solvent kg. Explicit spectator inventories make this preparation electrically balanced; the solver does not add a new charge equation or counterions.

The existing molal `reagentPreparation` and `mixPreparations` contract remains unchanged: it refuses unsupported volume conversions. The closed-redox preparation path is unnecessary here and is never imported. Ordinary sweep orchestration varies one component on a fixed prepared system; titration changes volume and multiple inventories together. A small new runner therefore orchestrates the same point solver, rather than misrepresenting titrant volume as one ordinary component total. Existing Beaker `acceptedState` projects each exact accepted numerical result without solving again.

Scope is the explicit strong-electrolyte benchmark: H+, OH−, Na+, Cl− and unit-activity water. Na/Cl ion pairing, solids, gases, redox and nonideal activities are not represented. This is not a claim of full H/Na/Cl database closure. Source records and component identities are bound by SHA-256; changed data require review. Exactly zero spectator inventory omits that spectator from the point's numerical basis; no trace material is introduced to represent zero. Each state carries its own prepared-system identity.

## 2. Physical convention

`dilute-ideal-aqueous-volume-v0` explicitly declares:

- Input concentration: mol/L of solution; delivered volume: mL.
- Solute moles: concentration × delivered litres.
- Mixed volume: sum of delivered volumes.
- Numerical coordinate: **1 model kg H2O per litre of solution**.
- Ideal activities, 25 °C, declared 1 bar, a(H2O) = 1.

`volumeOrigin` records user-defined delivered solution volume; `modelSolventMassKg` records the model coordinate. `measuredSolventMassKg` is null. No real density, exact water mass, thermal expansion, partial molar volume or nonideal volume additivity is claimed. Molarity and model molality have the same numerical value only by this named benchmark convention. The validation below establishes internal numerical agreement under that convention, not real-solution accuracy at 0.1 M.

## 3. Stock solution contract

`prepareStockSolution({reagent, concentrationMolPerL, volumeMl, temperatureC, convention})` accepts explicit HCl or NaOH recipes. It returns an immutable branded stock with finite available volume, concentration, recipe identity/provenance, solute moles, complete signed analytical inventories, charge equivalents and model coordinate. Unknown fields, arbitrary recipes, nonpositive or nonfinite concentration/stock volume and incompatible conventions/temperatures are rejected.

NaOH's negative proton equivalent is an acid/base conservation coordinate, not a negative amount of dissolved H+. It is the source-basis equivalent of one OH− with unit solvent water. Both supplied recipes have zero total charge, checked from their complete inventories. Other stocks need separate reviewed recipes and chemical scope.

## 4. Dispensing

`dispenseVolume(solution, volumeMl)` returns `{aliquot, remainder}`. Both are branded immutable physical preparations. Inventory fractions follow the exact requested volume without drop quantization. The operation is pure: a sequential dispenser must carry forward `remainder`; reusing the original object intentionally describes an alternative experiment, not a further withdrawal. Negative/nonfinite and above-available volumes fail. A zero aliquot is permitted; an empty remainder cannot supply a positive dose.

## 5. Mixing

`mixSolutions(...parts)` sums analytical moles and delivered volumes, updates the declared model solvent coordinate and retains the preparation/dispensing trail. It accepts branded compatible solutions only and checks charge and finite totals. `solveMixedSolution(context, mixture)` divides these inventories by the model solvent coordinate and calls the unchanged numerical point engine. It does not evaluate a titration formula.

## 6. Titration state

Every immutable state contains `id`, `seriesId`, `index`, `revision`, initial analyte identity/concentration/volume, titrant identity/concentration, total titrant volume added, titrant remaining volume, total beaker volume, delivered titrant inventories, total analytical moles, mixture/model coordinate/provenance, `equilibrium` (prepared system, input, accepted result and inspection), pH, scientific status and diagnostics. Failed equilibria have unavailable status and null pH; they cannot manufacture a plotted value.

## 7. Series algorithm

`runTitration(context, {analyteStock, analyteVolumeMl, titrantStock, additionVolumesMl, revision}, {isCurrent})` interprets each addition as a **total added volume**. All physical requests are validated first. Each point starts from the original analyte aliquot plus an independently dispensed total dose from the original titrant stock. No accepted solution from an earlier point seeds or supplies the next point. Reordered and repeated requested volumes produce the same inventories and equilibrium; repeated points retain distinct index identities. At most 10,000 points are accepted per call. The current-preparation callback is checked before and after each asynchronous solve and refuses a stale run.

## 8. Independent benchmark

`scripts/validation/wetLabReference.js` is validation-only and has no production imports. It uses known delivered acid/base moles and dilution, then independently solves the water quadratic using a cancellation-safe root:

`H − Kw/H = (nHCl − nNaOH)/V`.

The independent reference uses the stored source water constant, not a substituted pKw of 14. Its formula is never imported by production. All 18 requested additions (0, 10, 25, 40, 45, 49, 49.5, 49.9, 49.99, 50, 50.01, 50.1, 50.5, 51, 55, 60, 75, 100 mL) produce accepted numerical equilibria. Each sample's reference pH, production pH, inventory, input identity and balance residual are retained in `wet-lab-benchmark.json`.

## 9. Error

Maximum absolute pH error across the 18-point benchmark is **3.765876499528531 × 10⁻¹³**. Focused tests require ≤10⁻⁹ pH and retain every existing component-balance acceptance check. No solver tolerances changed. The error demonstrates agreement between two implementations of this declared ideal model.

## 10. Volume and mole conservation

| NaOH added (mL) | Beaker volume (mL) | NaOH delivered (mol) | Chloride (mol) | Proton equivalents (mol) |
|---:|---:|---:|---:|---:|
| 0 | 50 | 0 | 0.005 | +0.005 |
| 25 | 75 | 0.0025 | 0.005 | +0.0025 |
| 50 | 100 | 0.005 | 0.005 | 0 |
| 100 | 150 | 0.010 | 0.005 | −0.005 |

Sodium moles equal delivered NaOH moles. The complete signed charge sum is proton equivalents + sodium − chloride = 0. These are mathematical nominal quantities; JSON retains actual IEEE-754 values (for example 0.005000000000000001), with no decimal rounding inside the API. Tests verify volumes exactly and mole conservation within floating-point arithmetic. Sequential +0.01, +0.10 and +1.00 mL aliquots plus the remaining stock recover the original inventory.

## 11. Equivalence behavior

At 50 mL the supplied proton-equivalent total is zero and the unchanged solver determines equal H+/OH− activity. The pH is **7.00075**, half the source pKw of 14.0015. At 49.99 mL pH is approximately 4.999913303794264; at 50.01 mL it is approximately 9.001499854615775. No production code contains an equivalence-volume rule. A separate 25 mL analyte test moves equivalence to 25 mL through inventory alone.

## 12. Curve and future controls

`series.curve` contains `{x: added mL, y: calculated pH, state}`. The `state` reference is exactly the corresponding `series.states[index]` object. `selectTitrationState(series, index, {seriesId, revision})` refuses foreign, forged or stale series and invalid indices; it performs no equilibrium calculation. The existing Beaker inspection points to the exact `result` and `input` in that state. A future UI reads delivered/remaining burette volumes, beaker volume, pH and inspection from this single object. It changes total addition volume to calculate a new state, never drags pH as an independent variable. No new controls, animation or plot UI were added.

## 13. Performance

Local representative timings, including per-point preparation/hash and equilibrium solve but excluding repository/context construction:

| Points | Accepted | Elapsed |
|---:|---:|---:|
| 18 | 18 | 10.05 ms |
| 101 | 101 | 46.79 ms |
| 501 | 501 | 201.07 ms |

These machine-specific timings support interactive small-series use. Large future UI runs may need a worker or yielding/cancellation; no acceptance checks were weakened and no approximate plotting computation or cache was added.

## 14. Failure controls

Tests refuse negative/nonfinite stock and dispense volumes, invalid concentration, finite-stock overdraw, incompatible convention/temperature, arbitrary or unbalanced reagent requests, unknown stock options, copied/forged preparations or contexts, changed source provenance, invalid series requests, zero initial analyte volume, stale runs and mismatched selections. The API throws errors with typed `code` for invalid physical requests. Genuine solver failures remain unavailable states with diagnostics and curve gaps. No silent repair or counterion insertion occurs.

## 15. Mix-two-beakers compatibility

Passing entire branded solutions to `mixSolutions` is the one-shot two-beaker operation. A focused test mixes the whole 50 mL acid and 100 mL base stocks and reproduces the 100 mL titration point, including its equilibrium pH. No separate chemistry implementation is needed. A future UI must manage immutable source/remainder objects to avoid counting a vessel twice.

## 16. Focused tests

`tests/wetLab.test.js`: **10/10 pass**. They cover the independent 18-point control, volume/moles, exact sample/inspection identity, reordered/duplicate reproducibility, sequential dispensing, whole-beaker mixing, physical failures, branding/staleness, provenance drift and shifted equivalence. Native test-process spawning is restricted in this workspace; the supported `--experimental-test-isolation=none` mode was used. Focused and repository-wide ESLint checks pass with zero errors; the repository-wide check retains one pre-existing ExpandedPlot cleanup warning.

## 17. Final full regression

The single final complete regression passed **615/615**, with zero failures, cancellations, skips or todo. `wet-lab-regression.txt` is the authoritative log. The surviving accepted baseline was 605/605. This phase adds ten tests, with no legacy test edits. The full suite was run exactly once after implementation and focused validation.

## 18. Build, artifact and preservation

The single final production build and artifact audit pass. The existing UI bundle remains `index-DYxZYHbd.js`: the new state-engine modules are not imported by the current UI, so this phase does not expose an unfinished Wet Lab screen. Source APIs are ready for the next integration phase. Vite retains its existing large-chunk advisory. `wet-lab-preservation.json` checks 772 pre-existing source/test/data/script/report files against their before hashes: **no changes**. Redox, Pourbaix, ordinary calculation, Step-3/4/5 and general closed chemistry modules and evidence are untouched.

## 19. Limitations before graphical Wet Lab v1

Only the explicit HCl/NaOH strong-electrolyte v0 chemistry is validated here. No arbitrary weak-acid/base systems, other ions, redox, solids, headspace, density model, heat/temperature mixing, volumetric contraction, kinetics or experimental accuracy claim. Serialization loses WeakSet branding; a persisted experiment must be reconstructed and revalidated through the preparation APIs. Stock objects represent immutable available states; future inventory controls must retain remainders. A graphical UI must bind all physical and curve displays to the same selected state, disclose the model coordinate and restricted chemistry, and handle stale runs and gaps.

Evidence: `wet-lab-benchmark.json`, `wet-lab-focused.txt`, `wet-lab-regression.txt`, `wet-lab-build.txt`, `wet-lab-artifact.txt`, `wet-lab-before-hashes.json`, `wet-lab-preservation.json`.

## Minimal consumer example

```js
import {prepareStockSolution, volumeConvention} from '../calculations/wetLabSolutions.js'
import {prepareWetLab, runTitration, selectTitrationState} from '../calculations/wetLabTitration.js'

const context = await prepareWetLab(repository)
const stock = (reagent, volumeMl) => prepareStockSolution({
  reagent, concentrationMolPerL: 0.1, volumeMl,
  temperatureC: 25, convention: volumeConvention.id,
})
const series = await runTitration(context, {
  analyteStock: stock('HCl', 50), analyteVolumeMl: 50,
  titrantStock: stock('NaOH', 100),
  additionVolumesMl: [0, 25, 49.99, 50, 50.01, 100], revision: 1,
})
const selected = selectTitrationState(series, 3, {seriesId: series.id, revision: 1})
// selected.totalVolumeMl === 100; selected.pH === 7.00075
// selected.equilibrium.inspection.result === selected.equilibrium.result
// All physical readouts and the curve marker use selected, with no second solve.
```
