# Oxidation-state predominance — Fe visual validation prototype

**Recommendation: B. KEEP VALIDATION PENDING.** This is a calculated validation prototype, not public Pourbaix enablement. The generic classifier works within an explicitly curated assignment scope; the repository does not yet provide general authoritative oxidation-state/localization metadata. No deployment, remote push, unrelated UI change or beaker redesign occurred.

The supplied instructions ended mid-line at “mixed-val” in section 29. The complete preceding requirements were followed, including tests for explicit mixed-valence allocation and rejection when it is unresolved.

## Starting baseline and preservation

Before scientific edits: **426/426 tests passed**, no failures/cancellations/skips/todo, 227272.1849 ms. All five official golden benchmarks passed unchanged. Baseline build passed with the established `--configLoader native` option; lint had zero errors and the existing ExpandedPlot warning.

All **178 pre-existing protected files** under src, public and tests/fixtures retain their recorded SHA-256 hashes. The canonical compiler, preparation adapter, fixed-electron solver, equilibrium equations, grid machinery, ordinary results, database, golden fixtures, public UI and beaker were not modified. New classification code is an internal module and is not imported by the public application.

## What the map classifies

At an exact accepted equilibrium, every carrier of the canonical conserved inventory contributes its formula-unit amount multiplied by the number of atoms allocated to each oxidation state. Free aqueous ions, aqueous products and accepted positive solid amounts are included. Candidate solids with zero accepted amount contribute zero.

For each oxidation state, fraction = allocated component amount / supplied analytical total. Fractions are not renormalized to hide a balance error. The largest fraction defines predominance, even below 50%. A separate majority flag records a strictly greater-than-50% largest fraction. The output retains the largest fraction, second largest, margin, all fractions, exact accepted solids and dissolved inventory.

Primary labels are oxidation states. Within the winning family, the secondary carrier is the largest component-weighted contribution, not the largest formula-unit concentration. Carrier ties are retained as a set. Magnetite contributes only its two Fe(III) atoms to its Fe(III) secondary-carrier amount; its third atom belongs to Fe(II).

## Assignment model and limits

`prepareOxidationAllocation` requires an exact branded canonical system plus system-bound reference/carrier metadata with evidence. It never parses oxidation states from names, labels, charge alone or discovery associations.

With an independently established canonical reference oxidation state R, a carrier containing n conserved atoms and signed canonical electron coefficient e has aggregate oxidation number `nR − e` **only when its metadata establishes electron transfer localized to the conserved component**. Redox-active or unknown ligands are not assumed innocent.

Mononuclear carriers can then use the discrete derived value. Multinuclear carriers require either an explicit homovalence certificate or an explicit discrete allocation. A convenient integer or fractional average is not sufficient. Allocations must sum to n atoms and to the reaction-derived aggregate oxidation number. Missing reference, missing carrier evidence, unknown localization, inconsistent allocation or unresolved mixed valence gates classification out.

Absolute references and carrier assertions are in `scripts/validation/oxidationFixtures.js`, not production chemistry tables. The fixture independently checks metal/H/O counts and aggregate oxidation numbers for its explicitly identified monatomic, elemental, oxide and hydroxide carriers. Fe(II) and Cu(II) are the canonical reference values in this scope. The production classifier is generic.

Oxidation-state terminology follows the [IUPAC definition](https://goldbook.iupac.org/terms/view/O04365). The curated magnetite allocation is one Fe(II) and two Fe(III) atoms, consistent with [ChEBI ferrosoferric oxide](https://www.ebi.ac.uk/chebi/CHEBI%3A50821). These sources support identity/assignment semantics; they supply no replacement thermodynamic constants.

## Ties, mixed character and unavailable samples

The explicit tie resolution is an absolute difference of **1e-8 in analytical-inventory fractions**, equivalent to 0.000001 percentage point. It is a declared classification resolution, not a thermodynamic coexistence criterion and not an unrelated Newton tolerance reused by name. It is 50 times the existing 2e-10 relative comparison tolerance used in representative equilibrium validation. When the two leading fractions differ by no more than this resolution, the primary state is null and all tied states are retained; no alphabetical/source-ID winner is chosen.

Inventory closure is checked with the existing component balance function. If its allowed absolute floor is too large relative to total inventory (more than one quarter of the declared tie resolution), classification is unavailable as `inventory-resolution-insufficient`; the map does not promise this resolution at arbitrarily tiny totals. At the validation total, the balance allowance is 1e-13 mol/kg H₂O, or 1e-10 of total.

No-majority samples can retain the predominant fill with dots. Ties use diagonal hatch and unavailable samples crosshatch. No numeric smoothing, nearest-valid assignment or interpolation occurs. Failed, not-run, stale, ambiguous and unbranded/forged results cannot classify. The current grid has no ties, unavailable points or no-majority points; synthetic tests exercise all these semantics. Thus the legend describes supported treatments without inventing such cells in the Fe result.

## Fe calculation scope

- Total Fe: **1e-3 mol/kg H₂O**, explicitly a validation choice.
- Temperature: 25 °C; pressure: 1 bar declared; ideal activities.
- pH: 0–14, 57 samples, spacing 0.25.
- Eh: −1.0 to +1.2 V vs SHE, 45 samples, spacing 0.05 V.
- 2,565 actual independent grid solves through the unchanged grid machinery.
- Eh limits are a bounded validation range, not a water-stability range.

The canonical family contains free Fe(II), derived Fe(III), supported hydrolysis products, ferrate, and seven source solid candidates: Fe(cr), Fe(OH)2(cr), Fe(OH)3(am), Fe(OH)3(s), Fe2O3(cr), Fe3O4(cr), FeOOH(cr). The selected metadata table contains 19 Fe carriers including the free basis (18 products). Proton/electron/water-only auxiliary products were not selected in this carrier-focused validation subset; their omission is not generic gas support. Fe0.932O(cr) is excluded because the unchanged canonical compiler does not support its fractional stoichiometry. No source value or phase name was altered.

Ferrate is retained and authoritatively allocated as Fe(VI) within the curated mononuclear oxide fixture. Its 89 actual predominant points receive Fe(VI) labels; they are not disguised as Fe(III). This is especially relevant in the upper-right portion outside the water-reference band.

## Calculated results

All **2,565/2,565 samples converged** and classified. No failed, not-run, tied or unresolved grid points were filled or hidden. Recorded runtime was approximately 8.87 seconds on this machine (not a browser latency guarantee).

| Primary state | Samples |
|---|---:|
| Fe(0) | 422 |
| Fe(II) | 581 |
| Fe(III) | 1,473 |
| Fe(VI) | 89 |

Accepted solid carrier occurrences: Fe(cr) 422, Fe(OH)2(cr) 49, Fe3O4(cr) 92, Fe2O3(cr) 1,365. The remaining candidates did not have positive accepted amounts on this grid. Counts of accepted phases are secondary information; region fills use oxidation-state inventory.

Largest absolute oxidation-inventory closure error: **1.9949319973733282e-16 mol/kg H₂O**, within the existing 1e-13 bound. For example, the inspected pH 7 / Eh 0.25 V point is primarily Fe(III), with hematite as its secondary carrier; the figure does not label that region “Fe2O3”.

## Independent controls and genericity

A stripped Fe(II)/Fe(III) control is compared against the independent source Nernst relationship using logBeta 13.051. Calculated fractions agree on both sides of the transition, and the midpoint is classified as a tie. That equation is used only in the test, not to draw or classify the grid.

One point from every displayed primary state is independently solved again and reproduces the saved classification. Grid input metadata includes coordinate descriptors beyond the fixed-point helper, so the test compares physical constraints and numerical fractions rather than falsely requiring identical hashes from differently described input objects. Signed zero is treated as numerically equivalent after JSON serialization.

The same generic classifier distinguishes Cu(0), Cu(I) and Cu(II) at representative accepted points. The curated Mn subset verifies Mn(IV) in MnO2 and discrete Mn(II)/Mn(III) in Mn3O4 and closes an accepted Mn point. No historical Mn map/topology was regenerated or promoted; this is a limited independent cross-check, not a claim of complete Mn-map equivalence.

## Visual output and inspection

- `docs/oxidation-state-fe-map.png`: standalone raster figure shown in the task.
- `docs/oxidation-state-fe-map.svg`: scalable figure from the same exact cell geometry.
- `docs/oxidation-state-fe-prototype.html`: offline interactive map and exact-sample inspector.
- `docs/oxidation-state-fe-view.json`: generated cell geometry and inspection data.
- `docs/oxidation-state-fe-validation.json.gz`: complete numerical evidence, including prepared system, metadata, grid, original inputs/results and classification for every sample.
- `docs/oxidation-validation-summary.json`: compact counts, residual maximum and preservation hashes.

Each rectangle is the midpoint-bounded footprint of one sampled point, clipped at domain endpoints. It does not establish a constant region between samples or an exact analytical boundary. Large state labels are placed inside cells with that actual classification. Click selection and sample-index/previous/next controls select the exact stored sample; they never solve or interpolate another equilibrium. The inspector includes pH, Eh, pe, total, every Fe state fraction, majority/margin, secondary carrier and phase, weighted amount, accepted solids, dissolved Fe, solver status and original-precision stored sample data.

Browser verification passed cell click selection, sample-index navigation and a 390px viewport without horizontal overflow. No browser console errors were observed. Static PNG and SVG are supplied independently of the local preview server. The HTML can be opened directly from disk; it embeds its data and requires no external service.

Water reference lines use the existing source-derived H2(g) and O2(g) formation relationships, unchanged Eh/pe conversion, unit normalized fugacity and water activity one. Both are named on the map. Gases are not solved by drawing these references. Classification colors denote state identity, not actual solution/solid appearance.

The prototype explicitly states that equilibrium classification does not predict rapid crystalline formation, corrosion/passivation rate, nucleation, metastable persistence, overpotential, current density or reaction speed. A secondary equilibrium carrier can be kinetically slow to form.

## Validation status

Final full suite: **440/440 passed**, no failures/cancellations/skips/todo, 258937.0575 ms. All five official golden comparisons passed unchanged (acid-base, complexation, precipitation, redox, fixed-activity). All 14 new focused tests passed again after the final evidence/candidate-disclosure regeneration. Build passed with the established native config loader. Lint has zero errors and the pre-existing ExpandedPlot warning. The production/artifact audit passed; the existing bundle-size advisory remains. Logs: `.local/oxidation-baseline.txt`, `oxidation-final-tests.txt`, `oxidation-focused.txt`, `oxidation-build.txt`, `oxidation-lint.txt`, `oxidation-artifact-audit.json`.

The first new test draft incorrectly compared hashes of coordinate-rich grid inputs to minimal fixed-point inputs; a second draft exposed JSON signed-zero normalization. Both test assumptions were corrected to compare the actual physical constraints. No thermodynamic or solver code was changed to satisfy either check.

## Exact code changes and reproduction

New production module only: `src/analysis/oxidationInventory.js` (metadata validation, weighted inventory summary and branded/current-result gate).

New offline code: `scripts/validation/oxidationFixtures.js`, `scripts/validate-oxidation-grid.js`, `scripts/render-oxidation-prototype.js`, `scripts/render-oxidation-png.ps1`.

New tests: `tests/oxidationInventory.test.js`, `tests/oxidationGrid.test.js` (14 tests total).

Reproduce with `node scripts/validate-oxidation-grid.js`, then `node scripts/render-oxidation-prototype.js`, then PowerShell `./scripts/render-oxidation-png.ps1`. The fixture assertions validate source atom/electron accounting before grid calculation. Full evidence is gzip-compressed to retain all numeric inputs/results without an unnecessary uncompressed duplicate.

## Public recommendation

**B. KEEP VALIDATION PENDING.** The useful prototype and Fe/Cu controls are not a sufficient public support contract. Remaining work includes an authoritative maintained metadata registry, source/scope invalidation rules, an explicit supported-total domain, user acknowledgement of shared analytical inventory and candidate exclusions, and public handling of unsupported/redox-active ligands and mixed-valence assignments. This phase deliberately does not broaden canonical algebra or turn this validation fixture into production Fe/Cu-specific chemistry.

No deployment. No remote push. No public Pourbaix enablement. Stop for review.
