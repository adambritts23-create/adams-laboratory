# Wet Lab mixed prepared solutions — Phase 1

## A. Prepared-solution architecture

`prepareSolution` creates a branded, immutable preparation with 1–16 reviewed contribution rows sharing ONE final volume. Each row's formula-unit moles equal its mol/L concentration times that common volume in litres. The benchmark sample therefore occupies 50 mL, with 0.001 mol acetic acid and 0.001 mol boric acid, not 100 mL. Both sample and burette use this contract. Dispensing scales all supplied inventories; mixing adds each physical solution volume once. Every titration dose starts independently from the original sample and original burette. No previous equilibrium is recycled as the next preparation.

Rows retain stable IDs, reviewed recipe/source identity, concentration, formula-unit moles, provenance, intrinsic components, explicit automatic-addition slots, and metadata/recipe versions. Preparation revisions, source scope, physical lineage and accepted-state identities remain bound together. Existing single-stock callers delegate to the same preparation architecture.

## B. Sample / burette UI

Both panes have one volume input and compact Reagent | Concentration / mol L⁻¹ | remove rows. Both support adding/removing contributions, up to 16. The four reviewed recipes are HCl, NaOH, acetic acid and boric acid. The Mixed solution example fills the benchmark inputs without changing System. Apparatus still represents one mixed liquid; beaker and burette fills use total physical volume and remaining loaded volume.

## C. Scope resolution

Reviewed recipes activate authoritative source chemistry without manually selecting Na or Cl in System. A preparation probe resolves components/reactions and binds the resulting scope to the experiment. Explicit component/reaction exclusions and incompatible aqueous/model/temperature/pressure conditions are refused. Required source identities and phase scope are inspectable under Reviewed recipes / chemistry scope. System itself is not mutated.

Acetate/borate/NaOH uses `closed-physical-nonredox` through the existing general compiler. HCl-containing experiments retain an explicitly labelled REVIEWED RESTRICTED SCOPE compatibility wrapper around the established HCl/NaOH/acetate chemistry, because the full source chloride family has redox connectivity. This is a declared model choice before calculation, never a fallback following a failed general solve. Boric acid plus HCl is refused as outside that reviewed compatibility scope. There is one shared physical preparation and titration runner.

## D. Independent mixed-acid comparison

All 101 displayed integer-mL benchmark states are accepted. Six selected doses reproduce the unchanged saved independent source-law reference:

| NaOH added / mL | Total volume / mL | Production pH |
|---:|---:|---:|
| 0 | 50 | 3.232816494563761 |
| 5 | 55 | 4.752769017369950 |
| 10 | 60 | 6.979561727891936 |
| 15 | 65 | 9.220328731995949 |
| 20 | 70 | 10.678997049575305 |
| 100 | 150 | 12.717501076711436 |

Maximum pH difference: 9.2371e-13. Maximum absolute carrier difference: 2.91434e-15 mol/kg model H₂O. These are numerical implementation checks against the saved independent feasibility reference, not experimental accuracy claims. Full evidence and timings: `wet-lab-mixed-benchmark.json`; original reference: `mixed-solution-feasibility.json` (unchanged).

## E. Multi-region response

The actual source-derived curve has an acetate buffer region near 5 mL / pH 4.75, a transition near 10 mL, a borate buffer region near 15 mL / pH 9.22, and the subsequent transition into hydroxide excess around 20 mL. These are observed features of the sampled equilibrium curve, not hard-coded endpoint rules. The mixed example uses 101 uniformly spaced total-volume samples; arbitrary added volumes can be calculated separately and cached. The old inventory-derived equivalence navigation hint is restricted to applicable single-row preparations.

## F. Analytical views and accepted identity

Log concentrations includes both chemical families, their cross-complex, borate oligomers and sodium associations. Total fractions and Aqueous speciation independently select Acetate or Boron and reuse the unchanged component-weighted total and dissolved-only functions. The cross-complex contributes once to each relevant family; borate oligomers retain coefficients 2, 3 and 4. There is no combined acetate-plus-boron denominator.

Rendered browser checks verified all six benchmark doses and identical state IDs across apparatus, readout, graph and inspection. At committed 5 mL, pointer preview displayed cached 15 mL / pH 9.22033 without changing commitment; pointer leave restored 5 mL / pH 4.75277; graph click committed 15 mL. Both families were exercised in both fraction views. Removing the boric-acid row made the old experiment stale; re-preparation gave the different single-acetate result at 15 mL, pH 11.88363. Reverse NaOH/HCl gave pH 13.00150, 7.00075 and 1.47712 at 0, 50 and 100 mL respectively. Browser console inspection found no errors.

## G. Counterions and associations

NaOH intrinsically supplies one Na and minus one proton-equivalent per formula unit in the source proton/water coordinate; HCl intrinsically supplies one proton-equivalent and one Cl. Neutral acetic and boric acid require no additional spectator. No Na/K/nitrate/chloride is guessed to repair arbitrary charge. Preparation additions / counterions inspection discloses every row and its intrinsic inventory; automatic additions beyond the recipe are empty in this phase.

The general mixed calculation includes source-derived Na-acetate and Na-borate associations and neutral NaOH where admitted. Historical HCl compatibility retains its explicitly reviewed chemistry rather than claiming full chloride-network closure.

## H. HNO3 / H2SO4 source audit

Both remain **candidate reviewed titrants — not yet enabled**. Source identities in database hash `2ac52a30213c9288…` are HNO3 byte 173181 (H+ + NO3−, formation log K −1.3) and H2SO4 byte 154490 (2 H+ + SO4²−, log K −0.018). Sulfate also admits HSO4− byte 178801 (log K 1.982) and NaSO4− byte 225259 (log K 0.92). These are retained source constants, not newly inserted values.

The targeted direct basis audit (H/water/Na/acetate/borate plus nitrate or sulfate) found no direct solid/gas products and no nitrate association beyond HNO3. That limited observation does not establish complete redox-family or arbitrary-metal phase closure. Nitrate connects to electron-dependent N2, N2O4, NO2, NH3 and nitrite laws, with corresponding nitrogen gases in the source. Sulfate connects to HS−, thiosulfate and sulfite redox laws. Full identities, stoichiometry and citations are retained in `wet-lab-mixed-acid-audit.json`.

Enabling either requires reviewed preparation/composition metadata, an explicit validated decision about those connected redox laws, appropriate phase/gas scope and independent dose controls including acid speciation/associations. Treating them as interchangeable H+ bottles would bypass those requirements, so they were not added in this bounded phase.

## I. Boundary / phase behavior

General non-redox samples derive pH and explicitly leave Eh/pe undetermined. Connected material redox chemistry is refused; no artificial fixed electron activity is supplied. Existing compiler phase/gas diagnostics run at each dose. A required unsupported solid/gas closure withholds the accepted aqueous result and produces a gap, preserving candidate diagnostics. Electron-dependent non-aqueous phases remain disclosed outside the non-redox boundary. No Wet Lab redox expansion, finite headspace, gas-loss model or precipitation-specific solver was added. The existing closed-solid mathematics is untouched; this physical non-redox preparation contract does not silently reroute to a different redox/solid boundary.

## J. Performance

Measured focused run: full 101-point mixed preparation 65.64 s, including source resolution and independently prepared doses. Representative network compilation 484–575 ms, point preparation 18–30 ms, equilibrium solve 0.73–1.68 ms. One thousand cached preview/view operations took 70.85 ms and added zero solve runs. Timings depend on concurrent machine load.

The compiler binds physical preparation and signed coordinates into its prepared identity and does not currently expose a reusable dose-independent compiled-network handle. Reusing a prepared system across changed inventories without that contract would bypass checks; this phase therefore retains independent per-dose compilation. Existing repository-level source metadata caching and accepted-state/view caches are retained. Preparation now yields between doses so the UI remains responsive and setup changes cancel obsolete work. A safe structural compiler cache remains a future performance improvement, not an excuse to weaken source or revision checks.

## K. Validation / preservation

Focused development coverage: Wet Lab preparation, mixing, compatibility, views, preview, revision/source refusal, non-redox adapter, mixed reference, cross-family/oligomer weighting, and unsupported phase/gas/redox controls. First focused batch had 42/44 passing; two newly written test expectations were corrected (binary floating-point equality and six-dose filtering of the larger reference file), without changing calculation values. The final focused mixed/acetate batch passed 11/11; the other 39 tests in the first batch passed.

Final validation, 2026-09-16:

- **Full regression, run once: 673/673 passed**, zero failures/cancellations/skips/todo; 777.71 s. Log: `wet-lab-mixed-regression.txt`.
- All five official goldens passed, with the golden fixture unchanged. Fe/Cu exact-grid and independent-reference regressions passed.
- **Production build, run once: passed.** `dist/index.html` and current bundle `assets/index-BA_o_1IS.js` contain the mixed-solution interface. Existing large-chunk advisory remains. Log: `wet-lab-mixed-build.txt`.
- **Artifact audit, run once: passed.** Only approved static source/artwork assets; no unintended local files. Log: `wet-lab-mixed-artifact-audit.txt`.
- **Repository lint, run once:** exposed two pre-existing `process` no-undef errors in the previous phase's `scripts/validation/nonRedoxPhysicalBenchmark.js`. Added only `import process from 'node:process'`; targeted lint of that script then passed. No equations, evidence or benchmark expectations changed. The one existing `ExpandedPlot.jsx:21` hook-cleanup warning remains. Logs: `wet-lab-mixed-lint.txt`, `wet-lab-mixed-lint-targeted.txt`. Full regression/build were not needlessly repeated for this non-runtime import correction.
- **Preservation comparison, run once: 52/52 protected files unchanged**, including solver, thermodynamic/source data, total/dissolved fraction functions, solubility, imposed Eh and independent mixed feasibility evidence. Evidence: `wet-lab-mixed-protected-before.json`, `wet-lab-mixed-preservation.json`.

Production changes are confined to Wet Lab preparation/scope/experience adapters and Wet Lab UI/labels. Focused tests are in `wetLabMixed.test.js` and the updated recipe-availability expectation in `wetLabSetup.test.js`. The additional benchmark-script import is lint housekeeping only. No deployment or push was performed.

## L. Remaining limits

Only four reviewed physical recipes; no arbitrary database-to-bottle conversion or universal spectator selection. Up to 16 rows per prepared solution does not expand the compiler's network capacity. Ideal 25 °C / declared 1 bar, additive volumes and one model kg water per litre solution are explicit numerical conventions, not measured density or nonideal concentrated-solution accuracy. No finite headspace, gas evolution, kinetics, temperature effects or universal phase/redox closure. Source metadata coverage remains authoritative and bounded. HCl/borate and nitric/sulfuric acid preparations remain unavailable as described above. No deployment or push.
