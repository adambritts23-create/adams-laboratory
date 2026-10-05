# Mixed-solution Wet Lab feasibility — 2026-09-16

**Decision:** feasible with the existing equilibrium solver and volume/cache architecture, but not with an unchanged preparation/compiler interface. A standalone acetate–borate prototype passed 51 small simultaneous aqueous calculations (17 volumes × three preparations). No production implementation was made.

Evidence: `scripts/validation/mixedSolutionFeasibility.js`, `docs/mixed-solution-feasibility.json` (all concentrations, family fractions, residuals, phase checks, source records and spectator audit), and `docs/mixed-solution-feasibility-log.txt`. Run from the project root with `node scripts/validation/mixedSolutionFeasibility.js`. The script imports only Node filesystem/crypto. It does not call the production solver or preparation functions.

## A. Current architecture

| Location | Existing constraint / reusable behavior |
|---|---|
| `src/calculations/wetLabSolutions.js` | `prepareStockSolution` accepts exactly one `reagent`, concentration and volume; recipes are HCl, NaOH and CH3COOH. Charge is hard-coded as protonEquivalent + Na − Cl − acetate. This is not an N-family inventory contract. |
| Same module | `dispenseVolume` scales every inventory key; `mixSolutions(...parts)` already adds arbitrary keys and retains operation provenance. However, their charge validator still knows only the old keys. Mixing separately prepared stocks also adds their volumes: it cannot represent N solutes all prepared to ONE final 50 mL volume by simply repeating 50 mL stocks. |
| `wetLabSetup.js` | `sample` and `titrant` each contain one reagent. `prepareWetLabStocks` makes one stock each. Sampling estimates one proton-equivalent cancellation volume; it is only a sampling hint, not an equilibrium endpoint. |
| `wetLabTitration.js` | `runTitration` insists on `kind === 'stock'`, so even a branded existing mixture cannot be supplied directly. Labels/initialAnalyte/titrant metadata assume one reagent and concentration. Independent aliquots from the original stock, additive volume, revision checks and exact accepted-state selection are reusable. |
| Same module | `prepareWetLab` pins a water/strong-electrolyte scope, optionally acetate. `solveMixedSolution` explicitly constructs H/Na/Cl/acetate chemistry. This is the principal chemistry restriction, not the plotting code. |
| `wetLabSetup.js`, `wetLabExperience.js` | Recipe availability requires manual selected System components/species and no excluded required reactions. Source-record hashes are checked. Experience chooses acetate context with a boolean and requires each stock's singular recipe to be available. |
| `wetLabExperience.js`, `WetLab.jsx` | Points are cached by delivered volume within an experiment; state branding, series ID, revision, repository/System binding and epoch/disposal reject stale results. Hover validates an existing accepted point; leaving restores committed selection. Explicitly applying an uncached volume can solve once. Keep these semantics. |
| `wetLabAnalysis.js` | Reuses exact system/input/result references, discovers ordinary components and aqueous carriers, and delegates fraction mathematics. For the proposed aqueous mixture, family selectors and carrier plots need no chemistry-specific plotting. Log concentration currently filters aqueous carriers: future solids need an explicit extension, not an assumption that all-phase plotting already works. |
| `thermodynamics/reagentPreparation.js` | Separate mass-based reviewed recipes (FeCl2, HCl, peroxide, EuCl3); nonnegative physical inventories, explicit counterions, charge checking and lineage. It deliberately rejects molarity/volume without conversion. It must not be confused with Wet Lab's model-volume convention. |

Minimum conceptual change: a prepared solution has one final volume plus N supplied contribution rows, rather than one reagent identity. The engine consumes their summed conserved inventories; rows remain available as provenance.

## B. Selected source-supported benchmark

Only one second acid family was investigated: B(OH)3/borate. No alternative-family search was needed. The targeted network is small despite oligomers and cross-association. All relevant retained source records pass the imported-formation checks (original logK, imported provenance, 298.15 K and formation convention). Constants were read directly, not duplicated in the prototype.

Source namespace: `spana:2ac52a30213c9288:`; suffixes below are exact reaction identities in `public/data/thermodynamic-default.json`. Full citations, terms and provenance are in the JSON. File SHA-256: `9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245`.

| Source suffix | Product / formation relation | log10 K |
|---|---|---:|
| 79298 | CH3COOH from H+ + CH3COO− | 4.757 |
| 37016 | B(OH)4− from B(OH)3 + H2O − H+ | −9.236 |
| 36848 | B(OH)3(CH3COO)− from B(OH)3 + acetate | −0.43 |
| 38021 | B2O(OH)5− from 2 B(OH)3 − H+ | −9.31 |
| 38284 | B3O3(OH)4− from 3 B(OH)3 − H+ − 2 H2O | −7.31 |
| 38377 | B4O5(OH)4²− from 4 B(OH)3 − 2 H+ − 3 H2O | −15.03 |
| 220132 / 187065 | Na acetate / K acetate association | −0.12 / −0.27 |
| 223181 | NaB(OH)4 from Na+ + B(OH)3 + H2O − H+ | −8.956 |
| 224689 / 189498 | NaOH / KOH from cation + H2O − H+ | −14.4 / −14.46 |
| 250448 | OH− from H2O − H+ | −14.0015 |

Acid, borate oligomer, cross-complex and acetate-pair records cite NIST SRD 46 v8; sodium borate cites Pokrovski/Schott/Sergeyev (1995); water cites CODATA and Shock/Helgeson. The principal source pKa separation is 4.479 units. These are source-supported Ideal-model constants, not new experimental validation.

Sample: **50.00 mL containing 20.00 mM acetic acid and 20.00 mM boric acid** (1.000 mmol of each family). Titrant: **0.1000 mol/L NaOH, 100.00 mL loaded**. Conditions: Ideal, 25 °C, unit water activity, additive delivered volume, existing **1 model kg H2O/L solution** convention. No measured density or actual solvent-mass claim.

At V mL, each family total is 0.001 / [(50+V)/1000] model mol/kg; supplied sodium is 0.1000(V/1000) / [(50+V)/1000]. Initial recipes are neutral; NaOH supplies equal positive sodium and base equivalents. No initial counterion is needed for either neutral acid.

## C. Independent simultaneous prototype

Unknowns are log free H+, acetate, B(OH)3, and each positive-total Na+/K+. Every product amount follows its retained source mass-action law. A separate damped Newton routine solves **electroneutrality and all family/cation balances simultaneously**. Borate oligomers contribute 2/3/4 boron units; the cross-complex contributes to BOTH family balances. No sequential neutralization, region formula or Henderson–Hasselbalch calculation is used. Each point starts independently.

Percentages below are of the relevant TOTAL analytical family, not percentages renormalized to the displayed carriers. Other retained complexes account for differences from 100%.

| NaOH mL | pH | Acetic acid % acetate | Free acetate % | B(OH)3 % boron | Free B(OH)4− % | Na-acetate % acetate |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 3.23282 | 97.0749 | 2.9035 | 99.9783 | 0.00010 | 0 |
| 5 | 4.75277 | 49.9063 | 49.4225 | 99.6636 | 0.00328 | 0.3385 |
| 10 | 6.97956 | 0.5846 | 97.5996 | 98.7856 | 0.54734 | 1.2187 |
| 15 | 9.22033 | 0.00337 | 98.0481 | 48.9706 | 47.2350 | 1.6740 |
| 20 | 10.67900 | 0.000117 | 97.9334 | 3.3090 | 91.7690 | 2.0492 |
| 100 | 12.71750 | 0.00000104 | 95.3496 | 0.02939 | 89.0596 | 4.6504 |

All 17 sampled volumes are preserved in the JSON, including buffer, intermediate, near-equivalence and excess-base points. Each record includes analytical totals, every aqueous carrier, actual cation inventories, family-weighted fractions, charge/component residuals and phase activities. Cl/nitrate are not supplied in these preparations and are absent, not substituted with numerical traces.

Across all 51 points (main benchmark plus the two counterion preparations):

- Maximum absolute charge residual: **3.274e−15 model mol charge/kg**.
- Maximum absolute conserved-component residual: **3.557e−15 model mol/kg**.
- Maximum source mass-action residual: **8.882e−16 log10 units**. Mass-action residual is an algebraic consistency check because product amounts are constructed from these laws; conservation provides the independent nonlinear closure check.
- All family fractions close within the prototype's explicit check; no missing inventory is renormalized.
- Largest reachable solid log activity: **−1.62906** (all sampled candidates undersaturated). Checked boric acid crystal (155572), B2O3 (38100) and, where Na is present, borax (221010).
- Acetic acid gas record 79376 has maximum normalized equilibrium gas activity **3.558e−6**. This is reported rather than pretending no gas record exists. No headspace/gas inventory is solved; this supports a bounded aqueous, no-headspace prototype, not a prediction of zero volatilization into an arbitrary open vessel.

## D. Curve interpretation

Two separated buffer regions are evident around 5 mL / pH 4.75 and 15 mL / pH 9.22. The intermediate rise around 10 mL and broader final rise around 20 mL are consistent with the two 1 mmol neutral-acid inventories. These are sampled features, not precisely located experimental or derivative-defined endpoints. All reactions remain active at every volume.

The source Na-borate association matters: its boron fraction is 2.026% at 15 mL, 4.823% at 20 mL and 10.911% at 100 mL. Consequently free borate need not approach 100% even at high pH.

Optional close-pKa benchmark B was omitted. The selected two principal pKas are well separated; changing totals does not create a controlled close-pKa pair. A third-family audit would add scope without being necessary for this feasibility decision. This report does **not** claim to have demonstrated endpoint merging. No endpoint count is encoded in the algorithm.

## E. Automatic counterion policy

**Family totals alone do not define a bottle.** “20 mM acetate” could mean acetic acid, sodium acetate or a specified mixture. Those have different acid/base inventories even though the acetate total is identical. Automatic/simple mode must expose a reviewed preparation form or acid/base-equivalent choice, with an explicit default; charge completion follows that choice. It must never infer the missing proton inventory solely from family totals.

Proposed deterministic policy:

1. Resolve each row to reviewed source-bound composition/charge and preparation stoichiometry. Sum net supplied charge in moles, preserving existing counterions and proton/base equivalents. Neutral recipes require no added countercharge.
2. Consider only a small versioned, reviewed candidate list of the required charge sign. Reject missing metadata, incompatible model or newly required unsupported phase/redox scope.
3. Audit candidate connectivity against the actual selected chemistry, including possible additional source closure. Record complexes, phase/gas/redox risks. Reaction count alone is not a measure of chemical influence.
4. Within a pre-reviewed scope, prefer the candidate with fewer relevant interactions, using predicted diagnostics when available. Use an explicit stable preference order only to break genuine equivalent cases. If competing effects cannot be assessed, present choices rather than silently claiming safety.
5. Add exactly −Q/z moles of the selected ion (Q = outstanding supplied charge; z = source-bound charge). Keep its full admitted reaction network and provenance. Do not alter equilibrium amounts afterwards to repair charge.
6. Show “Automatic charge completion”, ion, quantity, rationale and Inspect/change. Compare alternatives at preparation/experiment calculation time, never on pointer movement. Any choice changes preparation identity and invalidates prior accepted points.

Diagnostic proposal: report spectator-bound fractions of each target family, spectator distribution among complexes, changes in pH and target fractions between admissible alternatives, and appearance of phases/gas/redox or failures. Use maxima over actual cached experiment samples plus their locations. Define no universal hidden materiality cutoff; future reviewed scopes or user goals must set documented criteria. A small pH difference does not establish negligible speciation effects.

Source audit findings:

- Na and K both pair with acetate. Na additionally forms NaB(OH)4 in the retained direct source set; no K-borate counterpart was found within this targeted set. Absence from this database is not proof of physical absence.
- Chloride has HCl and NaCl association (159033, 223384), chloride salt solids (188345, 223454), and Fe complexes (135482–135791); FeOCl solid is 138772.
- Nitrate has HNO3 (173181), FeNO3²+ (138437, logK 1), and electron-bearing nitrogen reactions, for example N2 (9455), ammonia (231007), nitrite (241198), plus gases. It cannot be an unconditional metal counterion default in closed redox.
- Chloride also has electron-bearing Cl2/oxychlorine chemistry and Cl2 gas (82236 onward). Neither anion is universally inert. These targeted Fe/H/water/electron connections are saved in `spectatorAudit`; no general metal screening was attempted.

## F. Counterion comparison

To isolate a preparation choice while keeping the titrant fixed, compare 50 mL of **10 mM acetic acid + 10 mM sodium OR potassium acetate + 20 mM boric acid**, both titrated with the same 0.1000 M NaOH. Both are electroneutral and have identical family totals and base-equivalent inventories. K-case sodium still enters from NaOH and remains in the network.

| Added mL | pH, Na salt | pH, K salt | K − Na pH |
|---:|---:|---:|---:|
| 0 | 4.752039 | 4.752974 | +0.000935 |
| 5 | 6.977628 | 6.981521 | +0.003893 |
| 7.5 | 8.737932 | 8.744646 | +0.006714 |
| 15 | 10.694686 | 10.697671 | +0.002984 |
| 100 | 12.743298 | 12.743362 | +0.000064 |

Maximum sampled absolute pH difference is **0.006714**. Maximum free-acetate fraction difference is **0.1923 percentage points**; free-borate difference is **1.2197 percentage points**. At zero addition the sodium pair contains 0.3716% of total acetate versus 0.2642% in the potassium pair. The broad regions remain, with remaining stoichiometric acid demand corresponding to 5 and 15 mL; no finely resolved endpoint shift is claimed from these sparse samples. K is the lower-interaction candidate in this specific retained network, but this is not a universal recommendation to replace sodium.

## G. General-compiler fit

**Combined inventories cannot currently feed the closed-physical route unchanged.**

- `equilibriumNetwork.js` sends closed physical requests to `discoverGeneralClosed` and `prepareGeneralClosed`.
- `generalClosedReagents.js` explicitly rejects `no-connected-redox-family` and compiles a closed-redox network requiring electron elimination. Removing that guard alone is unsafe: a non-redox system has no derived Eh.
- Physical discovery uses `componentMetadata`. It lacks boric acid and sodium seeds, and does not use the acetate addition in `networkComposition`. K is already curated. The analytical route has acetate metadata, but still lacks B/Na metadata for this proposed network.
- `prepareClosedReagents` accepts nonnegative supplied component amounts, forbidding electron/water inventory. Wet Lab's negative proton-equivalent contribution from NaOH is an internal basis coordinate, not a negative physical reagent. A reviewed physical-recipe-to-conserved-coordinate adapter must preserve this distinction. Do not pass signed proton totals as fictitious negative H+ reagent amounts.
- The existing analytical-component preparation and point solver already support signed proton coordinates and simultaneous source formation laws. The smallest path is a non-redox physical boundary adapter within the general compiler: validate neutral physical contributions, derive component constraints, reuse the existing solver, and leave Eh unavailable/not determined. Keep the redox route separate and unchanged.

The maximum prototype is only five free log coordinates and 17 aqueous carriers, comfortably below current 16-basis / 64-species / 64-reaction limits. This is not certification of arbitrary mixtures or unlimited discovery. A future compiler must retain all relevant source laws, phase diagnostics and identity checks; no whitelist of two titration formulas is proposed.

## H. Minimum implementation plan

1. Introduce a prepared-solution contract: final delivered volume, N rows with stable row IDs, reviewed reagent/source IDs, concentrations and moles, explicit automatic additions, component-coordinate totals, source fingerprint, recipe/metadata versions, solvent convention and preparation revision. Derive final totals once; retain every contribution and operation lineage.
2. Generalize the existing stock constructor/charge check and stock-kind acceptance. Dispensing scales every contribution and inventory; mixing adds volumes/moles and retains parent preparation IDs. Repeated solute rows share ONE declared final solution volume.
3. Curate missing source-bound B/Na/acetate physical metadata and reviewed acid/base recipes. Add the non-redox physical compiler adapter described above. Do not change solver mathematics, infer Eh, or silently fall back to ordinary sweeps.
4. Add scoped automatic charge completion with explicit preparation form and inspectable alternatives. Initially support only reviewed scopes; reject unsupported completion rather than inventing counterions or excluding their chemistry.
5. Replace manual counterion selection as a prerequisite with a **scope-resolution request**: System provides repository/model/permitted-phase/exclusion policy; the preparation requests required authoritative IDs, and receives an effective scope/fingerprint plus included/excluded reasons. Show activated requirements transparently. Do not mutate unrelated System inventory or override explicit exclusions silently. Bind accepted experiment identity to this resolved scope and preparation revision.
6. Pass each independently mixed physical dose to the general compiler, then return the existing accepted system/input/result/state envelope. Cache by experiment identity and volume. Preserve unavailable samples as gaps. Retain stock, inventory and selected-state provenance.
7. Replace singular setup labels with solution rows/summary; retain apparatus geometry and cached transient preview. Existing analytical views can show both families, H+, OH− and actual cation complexes. Family total fractions and aqueous speciation select acetate or boron; in this aqueous-only example their denominators coincide. A cross-complex contributes correctly to both selected-family inventories.
8. In a later implementation phase, add focused tests for shared-volume N-row preparation, exact charge completion, dispense/mix lineage, this independent benchmark, candidate interactions, missing metadata/phase refusal, revision/cache identity and hover restoration. Preserve existing single-reagent/redox references. No such production changes were made now.

Three UX styles remain distinct: simple mode supplies a reviewed preparation form plus automatic completion; reagent mode supplies actual recipes and their intrinsic counterions; expert signed analytical coordinates remain an explicitly abstract Calculation mode, not automatically a physical Wet Lab bottle.

## I. Limits and stop status

This establishes numerical feasibility in a bounded source-derived **non-redox aqueous** model. It does not validate real density, nonideal concentrated solutions, gas loss/headspace, arbitrary solids or arbitrary mixtures. Maximum titrant concentration and excess-base samples use the existing ideal convention. Undersaturation was checked only at the reported samples; no continuous-domain phase certificate is claimed. Source absence and metadata coverage remain separate from numerical convergence. A general source graph may activate new redox/phase chemistry when other reagents are added; automatic counterions must not conceal that scope change.

No production source, thermodynamic data, tolerances, UI or existing tests were edited. Only this report, the standalone script, its JSON and its log were written. No full regression, production build, artifact audit, browser automation, deployment or push was performed. **Stopped for review.**
