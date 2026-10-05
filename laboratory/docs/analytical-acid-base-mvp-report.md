# Analytical acid/base Wet Lab MVP

2026-09-17. Local production integration; no deployment or push.

## 1. Analytical acid/base contract

A stock explicitly chooses analytical acid/base components or physical/reagent sources. Analytical rows specify a source identity, mol/L and one final solution volume. Amount = concentration times litres. Dispensing and additive-volume mixing preserve those amounts and preparation revision. The existing model uses volume/1000 as model kg H2O (not a measured solvent mass), Ideal, 25 C, declared 1 bar and unit water activity. Signed H+ equivalents remain signed; no electroneutral-stock admission requirement or invented counterions applies to the analytical contract.

`wetLabAnalytical.js` maps the branded inventory to the existing `analytical-components` equilibrium constructor and point solver. H+, solvent and actual nonzero ordinary inventories define each dose. The existing source connectivity screen rejects connected aqueous electron transfer and unsupported ordinary basis closure. Availability is determined by source/constructor support, not an element whitelist. Selectable metadata does not promise that every combination is solvable.

OH-, acetic acid and borate are source-bound input conveniences; their basis coefficients come from the actual supported formation records. No pKa or titration formula is added. Original thermodynamic records are unchanged.

## 2. Required H+/OH- experiment

Actual browser inputs: sample OH- 1.0 mol/L, 50.00 mL; titrant H+ 1.0 mol/L, 100.00 mL loaded. Prepare experiment enabled with analytical countercharge disclosure. 107 calculated samples produced.

| H+ delivered (mL) | Accepted pH |
|---:|---:|
| 0 | 14.001500000000004 |
| 25 | 13.524378745280377 |
| 50 | 7.00075 |
| 75 | 0.6989700043359107 |
| 100 | 0.4771212547196624 |

All 107 match the preceding read-only audit within 1e-10 pH. The reference in `analytical-acid-base-audit-reference.json` is a copy of the prior saved evidence with its origin/hash; it was not recomputed to match this implementation. Every accepted point passes existing component-balance limits; mass-action log residuals are below 1e-8. Inventory construction and dilution are tested at matching doses.

Every accepted species ID is exactly H+, H2O or the source OH- record. Na+, Cl-, nitrate and all other counterions are absent. Browser inspection at 50 mL showed H+ and OH- each 9.9827455148e-8 mol/kg model H2O, zero signed proton-equivalent inventory and a 100 mL Beaker.

## 3. Weak acid/base

Acetic acid: 50 mL, 0.1 mol/L, with 0.1 mol/L OH- titrant. All 107 samples accepted. Initial pH 2.8813724399515466; half-equivalence (25 mL) 4.757455476485015; equivalence (50 mL) 8.728787820933542. Browser reproduced these values and half-equivalence partition: acetate 50.026%, acetic acid 49.974%. Tests check the actual source formation law, balances and both fraction normalizations across the entire series. This is internal production integration evidence; existing independent acetate controls are retained, not a claim of new external validation.

Boric acid/borate source connectivity is tested, including source record 37016. A direct production probe at 0.1 mol/L gave pH 4.9755148883025555, 9.261718111083338, 10.976630114326387 and 12.524608330510365 at 0, 25, 50 and 100 mL OH- respectively. Existing physical borate/precipitation controls are also retained.

## 4. Component versus reagent

The UI defaults to analytical H+/OH- at 0.1 mol/L. A separate validated HCl/NaOH preset retains reviewed physical recipes, their Na/Cl contributions and strict physical neutrality checks. Changing a stock definition explicitly replaces its entries and invalidates the old experiment. Unknown stock definitions refuse rather than falling back.

Explicit analytical Na+ remains in inventory and its admitted NaOH association is retained. Explicit chloride that triggers connected redox refuses for that actual boundary; it is never silently dropped. Mixed analytical/physical stocks retain the supplied physical contributions and use an explicitly analytical resulting boundary. Physical stocks still must pass their own original preparation checks.

## 5. Charge semantics

The setup action stays enabled for otherwise supported analytical stocks with nonzero specified charge. Cards state countercharge unspecified; exact charge and source provenance are under a disclosure. The UI never labels these stocks complete physically charge-balanced solutions. At 1 M, the initial OH- stock has -0.05 mol charge equivalents and the full H+ burette +0.10 mol charge equivalents. No charge completion is performed.

## 6. Redox and phases

Connected analytical redox reports: "Analytical redox not yet supported: connected electron-transfer chemistry requires the deferred preparation contract. No reactions were suppressed." Actual browser Cr3+ selection demonstrated this unavailable status and disabled preparation with the reason beside it. No closed-redox compiler, charge policy or solver code was changed.

Stage C investigated: the existing compiler admits pure-solid closure for the physical non-redox boundary, but not for `analytical-components` (see equilibriumNetwork.js boundary validation and solidClosure dispatch). Extending that admission contract was deferred. The MVP explicitly requests aqueous chemistry; it retains the constructor's excluded-phase saturation and gas-activity checks. Required unsupported phase closure produces an unavailable dose rather than a false accepted aqueous equilibrium. Electron-dependent nonaqueous chemistry is outside this non-redox boundary. Existing physical precipitation remains available through the original route.

## 7. Results and browser checks

Compatible projections: pH, log concentrations, new aqueous log activities, total fractions and aqueous speciation. Fractions use the unchanged positive ordinary-component denominators; H+ signed equivalents have no material fraction denominator and report unavailable. No interpolation creates equilibria.

Browser verified curve click selecting 49.00 mL, arrow navigation, exact 50.00 mL selection, Beaker volume, activity projection retaining that selection, and weak-acid fraction projection retaining 25.00 mL. Editing source chemistry removes stale results. Actual physical preset at 50 mL retained Na+ and Cl- at 0.05 mol/kg and pH 7.00075. No browser console errors captured.

## 8. Performance and solve counts

Focused production test: 107-dose H+/OH- preparation took 5.902 seconds including setup/series work on this machine. Fifty view/inspection operations took 9.33 ms. The experience's series-solve-run count remained 1; view switching and inspection trigger zero additional equilibrium solves. This counter counts dose-series runs, not individual points: the initial series independently solves 107 doses. Existing compiler/source caches are reused; no full database cloning was introduced per dose. In the larger full-suite process, the same preparation took 11.768 seconds and fifty projections/inspections 5.67 ms. Timings vary with machine load and retained test-process state.

## 9. Validation and preservation

Focused combined controls: 36/36 passed. Final seven analytical tests passed after admission hardening; these overlap the combined controls and should not be added as a unique count.

The single full repository regression completed in 844.33 seconds: **747 tests, 746 passed, one failed, zero cancelled/skipped/todo**. The failure was a pre-existing UI source assertion in axisGrouping.test.js expecting a removed Array.from axis-rendering loop. Both that test and CalculationWorkspace.jsx were unchanged at this phase's start. The assertion now checks the existing conditional Y-side and unconditional X-below controls; its focused suite passes **5/5**. No production Calculation behavior changed. The full suite was not repeated; this is not a claim of a clean 747/747 full rerun. All five goldens, exact Fe/Cu references, Cr 2,565/eight-carrier control, closed-redox controls and reviewed Wet Lab controls passed in the full run.

Production build passed, including dist/index.html, current JS/CSS and static data. Artifact audit passed. Lint completed with zero errors and the existing ExpandedPlot.jsx:21 ref-cleanup warning. The existing large-bundle advisory remains.

Evidence directory: `.local/acid-base-mvp/`. Original audit: `.local/analytical-wet-lab/contract-audit.json`. Preservation baseline has 1,022 files: 1,010 unchanged, no missing files. Ten intended Wet Lab calculation/UI files changed; the stale UI assertion was corrected. One adapter, one focused test, copied audit evidence and this report were added. Solver, thermodynamics, chemistry, public data and existing golden/reference fixtures remain byte-identical.

The existing full-suite test at tests/closedPureSolids.test.js:86 regenerated docs/closed-solids-benchmark.json, including fresh timing/output. This is an existing test-generated benchmark report, not its independent reference fixture. Its changed hash is explicitly recorded in preservation.json; it was not silently restored or relabeled unchanged. All closed-solid numerical reference assertions passed. No scientific expectation was updated to obtain a pass.
