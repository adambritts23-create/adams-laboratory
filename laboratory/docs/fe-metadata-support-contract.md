# Fe oxidation-state metadata and candidate support contract

Date: 2026-09-10. Scientific recommendation: **ready for a next-phase public implementation of the exact bounded contract below**, subject to that implementation preserving the gates and passing its own integration validation. Public Pourbaix remains disabled. This phase does not authorize broader chemical, concentration, phase or resolution claims.

The principal interpretation remains oxidation-state predominance, followed by the actual thermodynamic carrier and exact equilibrium inspection. No solver, thermodynamic source constant, canonical compiler, existing classification equation or application UI was changed. No deployment or remote push was performed.

## Evidence and scope

The pre-edit baseline passed all 440 tests, including the five official golden controls, build, lint and production artifact audit. Lint retained one existing ExpandedPlot hook warning; the build retained its existing bundle-size advisory. The protected-file manifest covers all 472 pre-existing files under src, public, tests, scripts and docs. Final verification and the hash comparison are recorded in `fe-metadata-checks.json`.

Final result: **452/452 tests passed**, zero failures, cancellations, skips or todo. All five official goldens remain unchanged; build, lint and artifact audit pass. All 472 protected pre-existing files retain identical SHA-256 hashes.

The production registry is `src/analysis/feOxidationMetadata.js`, version `oxidation-state-metadata-v1`. It contains 19 explicit carrier allocations, a source-basis fingerprint, individual canonical carrier fingerprints and static provenance. It contains no log K table. Source IDs are the import architecture's database-hash/record-offset identities. The prepared Fe(III) carrier has a derived canonical identity: its species identity is record 126584, while its inverted Fe(II) bridge reaction is record 126513. These identities are deliberately distinguished.

The registry's canonical hash is pinned independently in `fePourbaixContract.js` and the new evidence. Changing allocations, provenance, source binding or metadata version changes that hash and invalidates the previous support evidence. Reviewers must inspect the scientific change, bump the metadata/scope version when material, rerun validation and deliberately issue a new evidence pin. Never regenerate expected old fractions to make a changed allocation pass.

The runtime path is source-bound prepared chemistry → registry resolver → validated explicit allocations → accepted equilibrium inventory → classification → inspection/support assessment. The resolver supplies an explicit allocation for every carrier. It never invokes the old fixture's charge/formula-derived allocation path. Old saved evidence is read by the validation script solely for comparison. A dependency-graph regression verifies the new production entry points cannot import research fixtures, `.local` files or runtime network code. These modules are available for the next application phase but are not wired into the public UI.

## Authoritative interpretation and maintenance

The assignments are explicit scientific curation of identified source carriers. For this narrowly scoped set, independently specified monatomic/elemental and oxide/hydroxide compositions use H(+I) and O(−II); there are no redox-active ligands. Curation checks counts and charge consistency, but runtime classification does not parse names, formulas, charge or element associations. Source electron coefficients are an additional consistency check, never the authority for localizing redox.

The [IUPAC oxidation-state definition](https://goldbook.iupac.org/terms/view/O04365) supplies the chemical convention. Each row retains its imported thermodynamic citation and reference code as evidence of carrier identity. These source citations establish identity; they are not a claim that every thermodynamic reference independently supplied a discrete oxidation-state inventory. The explicit assignments and scope restrictions are maintained by this project.

Magnetite has an independent compound-identity control: [ChEBI ferrosoferric oxide, CHEBI:50821](https://www.ebi.ac.uk/chebi/CHEBI%3A50821) identifies iron(II) diiron(III) oxide, with [magnetite CHEBI:46726](https://www.ebi.ac.uk/chebi/CHEBI%3A46726) linked to that identity. The stored allocation is exactly one Fe(II) plus two Fe(III), never an average valence. Static references were curated on 2026-09-10; no website is contacted during calculations. This phase does not claim an additional independent human review of the new registry.

To add a carrier: establish its exact source identity, independently document composition and oxidation-state allocation, identify ligand-redox/nonstoichiometry limitations, bind its unmodified canonical reaction/provenance, and test both allocation closure and source invalidation. Unsupported identities remain unsupported. Do not add a name-based fallback. A database revision requires renewed identity review even if labels appear unchanged.

The complete carrier table is in `fe-metadata-carriers.md`, including every carrier in the prepared grid, not merely the species or solids present at one selected point. The excluded nonstoichiometric oxide is recorded separately.

## Materiality, closure and classification

The initial policy is intentionally strict: **all candidates must resolve, including numerical traces, zero-concentration candidates and solids absent from the accepted assemblage**. There is no numerical trace waiver and the unresolved-inventory floor is zero. An unknown candidate therefore fails preflight with a typed reason; its unresolved amount is null (not yet evaluated), not falsely reported as zero. Every successfully classified sample reports unresolved inventory = 0 because every possible contributing carrier was resolved. No unresolved remainder is discarded or renormalized.

This avoids inventing a chemical cutoff from solver arithmetic. Existing component-balance tolerance is max(2×10⁻¹⁴, 10⁻¹⁰ × max(|total|, min(|smallest nonzero total|, 10⁻⁶))) mol/kg H₂O. At the validated Fe total it is 10⁻¹³ mol/kg H₂O. It is used solely for closure of the completely allocated inventory. The existing classifier also requires tolerance/total ≤ one quarter of its fraction tie tolerance; an intentionally tiny-total test verifies unavailable classification when that numerical resolution is insufficient.

For each state, fraction = allocated component amount / analytical total Fe. Aqueous carriers, accepted solids and each mixed-valence allocation all enter the sum. The sum must recover the analytical inventory within the existing tolerance. The largest fraction is predominant even when below 0.5; majority means strictly greater than 0.5. The symmetric fraction tie tolerance is 10⁻⁸. All top states within that difference are a tie/transition, with no winning state chosen by ordering and no fractions rounded away. Secondary carriers contribute the largest amount to the predominant oxidation-state inventory; their formula amounts and component contributions remain available. Ties retain exact fractions and have no arbitrarily selected secondary winner.

Typed failures distinguish missing metadata, ambiguous carrier identity, inconsistent source identity/basis, inconsistent allocation, unresolved model, stale/unaccepted/failed equilibrium, inadequate inventory resolution, nonclosure and unsupported reservoirs. Nonstoichiometric and redox-active-ligand carriers have no certificates in this version. Duplicate identities are also rejected by the existing prepared-system boundary. A copied result or model cannot impersonate an accepted result because object branding remains enforced.

## First candidate public domain

Only Fe, 0.001 mol/kg H₂O, ideal activities, 25 °C, declared 1 bar, fixed H⁺ and electron activity and a(H₂O)=1. Coordinates are pH 0–14 with ΔpH=0.25 and Eh −1.0 to +1.2 V vs SHE with ΔEh=0.05 V: exactly 57×45 samples. The exact prepared-system identity, registry hash, phase scope, branded completed grid, current revision, every actual input coordinate/total and every accepted classified sample must agree.

Included candidates: Fe(cr), Fe(OH)₂(cr), Fe(OH)₃(am), Fe(OH)₃(s), Fe₂O₃(cr), Fe₃O₄(cr), FeOOH(cr). Excluded: Fe₀.₉₃₂O(cr), because fractional/nonstoichiometric canonical stoichiometry is outside the current validated compiler scope. An included solid that is never stable remains included; it is not an excluded solid.

`fePhaseScope` exposes included, excluded and unsupported identities, base scope version and a modified flag. Suppression changes the thermodynamic model and removes the default phase-scope version and validation claim. The contract neither creates a suppression UI nor implies kinetic behavior. The support assessment always returns publicEnabled=false in this phase, even when scientifically eligible for the next phase.

## Validation results

The new production path independently prepared the same chemistry and reran all 2,565 points. Every sample converged and classified. Counts remain 422 Fe(0), 581 Fe(II), 1,473 Fe(III), 89 Fe(VI). **Maximum difference from every saved accepted oxidation-state fraction: exactly zero.** Maximum absolute allocation-closure residual was approximately 1.995×10⁻¹⁶ mol/kg H₂O.

The earlier read-only HALTAFALL audit remains the independent numerical reference: it solved all 2,565 matched points, with zero oxidation-state or assemblage disagreements and approximately 9.763×10⁻¹¹ maximum fraction difference. This phase did not rerun the external library; its new registry fractions are exactly equal to the previously cross-validated Adam evidence. The original evidence was not overwritten.

At pH 10 and Eh −0.60 V, Fe(II) fraction is approximately 0.3334402808885098 and Fe(III) approximately 0.6665597191114901. Magnetite contains exactly the 1:2 discrete Fe allocation; dissolved Fe accounts for the slight departure of the whole-system fractions from 1/3 and 2/3. Additional saved controls include the five magnetite-bearing samples where Fe(II) predominates overall. This demonstrates that phase identity does not force the whole-system winning state.

All 89 ferrate-majority samples remain Fe(VI) and lie above the conventional O₂ reference. The previous audit placed them at least approximately 0.399 V above that line. Their position outside the water window supplies context, not an exclusion rule.

Internal full-grid totals of 10⁻⁴ and 10⁻² mol/kg H₂O also converge and allocate completely. They retain the same candidates but change sampled state distributions and solid occurrence; no independent reference validation is claimed for them. Numerical counts and per-solid occurrence are in `fe-metadata-validation.json`. The public recommendation stays at the independently matched 10⁻³ total. No continuous concentration domain is inferred from three checks.

| Total Fe (mol/kg H₂O) | Fe(0) samples | Fe(II) samples | Fe(III) samples | Fe(VI) samples | Independently matched scope |
|---|---:|---:|---:|---:|---|
| 0.0001 | 422 | 617 | 1435 | 91 | No |
| 0.001 | 422 | 581 | 1473 | 89 | Yes |
| 0.01 | 453 | 517 | 1514 | 81 | No |

## Boundary resolution

Every coarse edge crossing the requested pairs was subdivided tenfold: 64 Fe(0)/Fe(II), 89 Fe(II)/Fe(III), and 27 Fe(III)/Fe(VI) edges, 180 total, with 1,620 new solves. Each edge retained a single resolved transition; no failed, tied or multiple-transition subdivision was observed.

For each of the three pairs, maximum observed coarse-to-dense bracket-midpoint displacement was **0.1125 pH units** horizontally and **0.0225 V** vertically. Dense brackets have width 0.025 pH or 0.005 V, respectively; their midpoints retain half-width uncertainty. These are measured shifts on intersected coarse edges, not an exact root error bound, Euclidean boundary displacement or proof that no sub-grid island exists. Cells that do not show a coarse crossing were not searched for hidden transitions.

No line was beautified, no grid classifier replaced and no equality-root refinement implemented. The next UI must disclose sampled resolution and avoid implying exact boundaries. Detailed coarse and dense brackets are preserved in the compressed numerical artifact.

## Water context and future inspection

H₂ and O₂ remain source-bound analytical reference overlays, with unit normalized gas fugacity/activity convention, a(H₂O)=1, 25 °C and SHE-based Eh. `feWaterContext` validates the static source reaction fingerprints and reuses the existing water-reference calculation and physical constants. Gases are not solved as analytical Fe inventory. No constant was adjusted to eliminate the approximately 0.231 mV difference found in the SPANA audit.

Inspection returns actual pH, Eh, pe and total Fe; registry version/hash; phase scope/version; exact fractions for 0, II, III and VI; predominant state, majority and tie information; dominant carrier(s), phase, formula amount and allocated component contribution; accepted solids; dissolved Fe; unresolved inventory; closure residual/tolerance; water references/context; solver status; and input/system/revision identities. Water context is inside the conventional window, above O₂ or below H₂. It never automatically invalidates an accepted fixed-Eh equilibrium.

## Reproduction and next-phase boundary

Run `node scripts/validate-fe-metadata.js` to rerun production-registry classification at all three totals, compare against immutable old evidence and measure the dense boundary brackets. It writes only new metadata-phase evidence. Run the full existing test selection plus `tests/feMetadata.test.js`, the normal build/lint and production artifact audit. The scripts and exact commands are recorded with the final check evidence.

The scientific blocker addressed here is resolved for this specific registry and contract. The next phase may implement the bounded public Fe feature using these gates and inspection data. It must validate UI integration, phase disclosure, stale-result handling and sampled-boundary communication before enabling it. Arbitrary totals, modified solids, other temperatures/activity models, fractional phases, other elements and ligand-redox systems remain outside this validation claim.
