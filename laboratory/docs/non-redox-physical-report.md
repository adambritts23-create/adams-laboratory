# Non-redox physical closed preparation adapter

Implemented and focused validation completed, 2026-09-16. **16/16 focused tests pass**, zero failures/cancellations/skips/todo. No full regression, build, artifact audit, browser automation, deployment or push was run.

## A. Architectural change

The general compiler now accepts explicit `boundary: 'closed-physical-nonredox'`. Its physical contributions are transformed into constraints and then use the **same direct source-law discovery, basis checks, point preparation, solver and excluded-phase acceptance code** as the analytical branch. No solver was added or modified.

Existing `closed-physical` still uses the unchanged closed-redox discovery/preparation path, with internal electron elimination and derived pH/pe/Eh. The new boundary has no electron component, derives pH and returns `notDetermined.Eh` and `notDetermined.pe` with `status: 'not-determined'` and reasons. Neither is represented as zero, NaN or a numeric potential. `analytical-components` retains its abstract signed-coordinate contract. Imposed-potential paths are unchanged.

`src/thermodynamics/nonRedoxPhysical.js` handles nonnegative physical inputs, source-coordinate transformation, charge validation and the aqueous redox boundary screen. The compiler rejects explicit constraints, amounts, selected IDs or a reviewed-redox profile on this boundary: the physical preparation determines the coordinates. Unknown/unreviewed physical identities, negative/nonfinite quantities, duplicate contribution IDs, missing provenance, inconsistent solvent coordinates and unbalanced preparation fail explicitly. No counterions are inserted.

Request structure:

```js
{
  boundary: 'closed-physical-nonredox',
  revision: 0,
  temperatureC: 25, pressureBar: 1, activityModel: 'ideal',
  unit: 'mol/kg-H2O', solvent: 'unit-water-activity',
  phases: ['aqueous'], sourceFingerprint: equilibriumSourceFingerprint,
  preparation: {
    provenance: 'Description of the actual physical preparation',
    solventCoordinate: {
      convention: 'dilute-ideal-aqueous-volume-v0',
      volumeMl: 65, modelSolventMassKg: 0.065
    },
    contributions: [
      {id: 'acid', sourceId: 'spana:2ac52a30213c9288:79298',
       moles: 0.001, provenance: '20 mM acetic acid in final 50 mL sample'},
      {id: 'boric', sourceId: 'component:B(OH)3',
       moles: 0.001, provenance: '20 mM boric acid in final 50 mL sample'},
      {id: 'base', sourceId: 'spana:2ac52a30213c9288:224689',
       moles: 0.0015, provenance: '15 mL of 0.1000 M NaOH'}
    ]
  }
}
```

An explicit solvent-mass convention is also supported, without a volume or implicit density conversion. Preparation/source/metadata/adapter versions and revision enter prepared-system identity. Reordering contributions preserves chemistry; changed preparation provenance or revision changes identity. Existing result branding remains mandatory.

## B. Physical → solver transformation

Contributions are source-bound formula-unit inventories, not assumed final equilibrium populations. A physical acetic-acid formula unit maps to one acetate + one proton-equivalent coordinate. Boric acid maps to one B(OH)3 coordinate. The retained NaOH source equation maps one nonnegative supplied NaOH formula unit to **+1 Na, −1 analytical H and +1 water bookkeeping**.

For the 100 mL addition state:

- Actual supplied amounts: 0.001 mol acetic acid, 0.001 mol boric acid, **+0.010 mol NaOH**.
- Internal proton-equivalent coordinate: 0.001 − 0.010 = **−0.009 mol**.
- Sodium coordinate: **+0.010 mol**; acetate and boron coordinates: 0.001 mol each.
- Model solvent coordinate: 0.150 kg, under the existing 1 model kg/L additive-volume convention.

The negative value is only in `solverCoordinates`; `physicalPreparation.contributions[].moles` remains nonnegative. Source water coefficients are retained in row provenance, while the solvent remains fixed unit activity, not a solute total. Physical charge is checked using source-derived formula charge before solving. Afterwards, equilibrium charge is checked against the sum of charge-weighted existing component-balance bounds; no new solver tolerance or post-solve charge repair is introduced.

## C. Metadata

`networkComposition` is now version `network-composition-v2` and adds only:

- `component:Na%2B`: Na1, charge +1; exact record digest already used by Wet Lab, explicit monatomic identity linked to retained NaOH/NaCl source laws.
- `component:B(OH)3`: B1 H3 O3, neutral; exact record digest, retained boric-acid identity and CODATA H3BO3 crystal record 155572, with NIST borate law 37016 supporting source-family linkage.

Existing acetate, H and water metadata are reused. Supplied acetic acid and NaOH compositions/coordinates are transported from their retained source reactions, not parsed from display formulas. The separate redox `componentMetadata` registry and redox compiler were not changed. Source constants/data and the saved independent reference were not edited.

## D. Six-point independent comparison

Reference: unchanged `docs/mixed-solution-feasibility.json`, produced by the independent raw-source prototype. Every actual admitted aqueous carrier was compared, including oligomers, cross-complex, water-derived OH− and sodium associations. Source basis water is fixed activity and is excluded from carrier concentration comparisons.

| NaOH equivalent mL | Derived pH | Max carrier absolute discrepancy | Max component residual | Net charge residual |
|---:|---:|---:|---:|---:|
| 0 | 3.232816494564 | 4.164e−17 | 1.041e−17 | +1.524e−18 |
| 5 | 4.752769017370 | 0 | 3.470e−18 | −1.229e−18 |
| 10 | 6.979561727892 | 2.915e−15 | 2.429e−17 | −2.136e−17 |
| 15 | 9.220328731996 | 1.041e−17 | 6.939e−18 | +9.704e−18 |
| 20 | 10.678997049575 | 9.216e−19 | 1.215e−17 | −9.162e−18 |
| 100 | 12.717501076711 | 8.414e−17 | 1.111e−16 | −1.943e−16 |

Amounts/residuals use model mol/kg H2O; charge uses mol charge equivalents/kg. Component residuals include the signed proton coordinate as well as acetate, boron and sodium where supplied. Zero sodium at the initial state is not replaced with a trace inventory.

Global maxima: pH difference **9.175e−13**; carrier absolute difference **2.915e−15**; carrier log10-ratio difference **1.528e−12**; source mass-action residual **8.882e−16 log10 units**. Tests use the existing 4e−14 absolute + 2e−10 relative concentration comparison criterion, plus strict 1e−9 pH/carrier-log comparisons and existing component/mass-action bounds.

All six are **CONDITIONAL** aqueous results. Ordinary candidate solids are undersaturated (largest log activity −1.629064). The acetic-acid gas activity sum ranges from 3.55744e−6 initially to 1.27563e−14 at 100 mL, below the existing >1 gas-refusal criterion. This is not a claim of zero volatilization or a solved headspace. Dedicated concentrated-boric-acid and acetic-acid controls trigger solid/gas refusal and return a candidate without an accepted equilibrium.

## E. Cross-family conservation

`spana:2ac52a30213c9288:36848`, B(OH)3(CH3COO)−, occurs **once** in the prepared product list with coefficients **1 acetate and 1 boron**. At 15 mL its amount is **4.222288358558349e−5 model mol/kg**; that same amount contributes to both independent conserved-family sums. Tests verify the coefficients, unique identity, positive amount and total-family closures without renormalization.

## F. Oligomer conservation

At 15 mL:

| Source suffix | Carrier | Amount, model mol/kg | B units per carrier |
|---|---|---:|---:|
| 38021 | B2O(OH)5− | 4.617135279696e−5 | 2 |
| 38284 | B3O3(OH)4− | 3.478520226741e−5 | 3 |
| 38377 | B4O5(OH)4²− | 8.293640354501e−6 | 4 |

All six tests inspect these exact source coefficients. Boron closure uses the weighted 2/3/4 contributions, not one unit per carrier.

## G. Redox boundary refusal

The existing physical Fe(II)/H2O2/HCl control, deliberately submitted to the new boundary, returns **`redox-boundary-mismatch`** with connected source reaction IDs. It is neither solved nor rerouted. The same reviewed physical control still solves through the existing `closed-physical` route and agrees with saved Step-5 pH/pe within 1e−9. Directly affected compiler tests also retain their reviewed Fe/peroxide carrier comparisons and other existing redox/analytical controls.

Scope qualification: the screen checks connected **aqueous** electron-transfer chemistry, including a supplied identity that is a redox-law product. Electron-dependent non-aqueous Na metal/reduced-boron records are explicitly returned under `phaseScope.outsideBoundary`; their activity is not determined without potential. This preserves the requested bounded aqueous non-redox model and does not certify stability against all electrochemical phases. Ordinary electron-free excluded solid/gas laws are numerically checked. Further ordinary basis closure that this adapter cannot resolve produces a typed refusal rather than silent omission.

## H. Simple non-redox control

A **20 mM acetic-acid-only** physical preparation passes and agrees within 1e−9 pH with the existing independent `acetateReference`, using actual retained acid and water constants. It admits only the two acid/water formation laws. HCl/NaOH was not used as a general-source control because chloride activates aqueous chlorine redox chemistry; its historical restricted Wet Lab scope was not altered.

## I. Performance and focused validation

Recorded single-process six-state run (milliseconds; hardware/load dependent):

| mL | Compile | Prepare | Solve | Aqueous carriers | Source laws | Basis rank including fixed water |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 1789.74 | 24.81 | 4.33 | 10 | 7 | 4 |
| 5 | 409.55 | 20.63 | 1.67 | 14 | 10 | 5 |
| 10 | 409.92 | 20.59 | 0.68 | 14 | 10 | 5 |
| 15 | 417.18 | 23.09 | 1.86 | 14 | 10 | 5 |
| 20 | 402.81 | 44.88 | 1.64 | 14 | 10 | 5 |
| 100 | 522.95 | 20.86 | 2.66 | 14 | 10 | 5 |

Three or four non-water component coordinates are solved. Independent reaction ranks are 7 or 10. The small equilibrium solve is not the dominant cost: compilation includes imported-catalog identity validation (cold first call), source composition curation/hashing and catalog inspection. No solver optimization or broad performance campaign was undertaken.

Command: `node --test --test-isolation=none tests/nonRedoxPhysical.test.js tests/equilibriumNetwork.test.js`.

Result: **16 passed, 0 failed**, duration 19.63 seconds. The initial default isolated test invocation could not spawn child processes in the sandbox (`EPERM`); the same tests ran successfully in-process. This is not an approval rejection or a scientific test failure.

Evidence files:

- `docs/non-redox-physical-focused.txt`
- `docs/non-redox-physical-benchmark.json` — all six carrier comparisons, balances, mass-action residuals, charge/phase diagnostics and timings.
- `docs/non-redox-physical-benchmark-log.txt`
- `scripts/validation/nonRedoxPhysicalBenchmark.js`
- `tests/nonRedoxPhysical.test.js`
- `docs/non-redox-physical-architecture.md` — pre-edit boundary audit.

Production changes are limited to new `nonRedoxPhysical.js`, compiler integration in `equilibriumNetwork.js`, and the two narrowly curated identities/version in `networkComposition.js`. No UI, Wet Lab, solver, redox mathematics, solid-selection mathematics, fraction mathematics or source thermodynamic data was edited. Existing full-suite status was not re-established in this task.

## J. Remaining work

This is a compiler boundary, not mixed Wet Lab orchestration. N-row solutions still need a shared-final-volume preparation contract and UI, contribution-preserving dispensing/mixing, source-scope activation and experiment identity integration. Automatic charge completion still needs the reviewed candidate policy and explicit preparation-form choice. Free mixed titration needs per-dose compiler invocation, accepted-state/view adapters and bounded availability/phase handling. None was implemented here.

**Stopped for review after focused validation.**
