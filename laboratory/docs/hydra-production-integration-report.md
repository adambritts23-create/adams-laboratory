# HYDRA-consistent production integration

## 1. Actual HYDRA search semantics

The authority is pinned upstream `DataBase/src/database/DBSearch.java`, commit `c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7`, run against the accepted Reactions.db SHA256 `2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a`. Upstream Java was not edited. The adapter and captured Java outputs are in `.local/hydra-system-search/`; no production import depends on them.

DBSearch lines 878–892 require every non-negligible source component to be in the search vocabulary. H2O is implicit; H+ and e− are explicit coordinates. Negative coefficients require membership just like positive coefficients. The membership-only coefficient floor is 0.0001; Adam never uses that floor to round or discard production equations and refuses unresolved nonzero terms.

With e−, lines 195–250 and 270–336 expand component forms through forward, electron-containing products, restricted to component-catalog associations with the originally selected system (default N/S/P redox flags enabled). Associations are vocabulary links, not atom counts. This is neither unrestricted inverse graph traversal nor a single nonrecursive subset scan. Lines 340–429 rewrite discovered dependent forms into the original basis. Lines 610–690 handle selected identities, replacement records and solid filtering. Gas/solid membership uses the same source component rule. Java uses its name-comparison helper for aliases; Adam binds the pinned import's authoritative IDs/exact names. Arbitrary external aliases or different databases are not newly claimed supported.

## 2. Adam versus actual Java

All product-name sets match exactly in seven executed cases. Counts include gases; electron-transfer records overlap the phase groups.

| Component system | Products | Solids |
|---|---:|---:|
| H+, Fe2+ | 6 | 1 |
| H+, e−, Fe2+ | 28 | 8 |
| H+, acetate | 3 | 0 |
| H+, e−, Cr3+, Cl−, Na+ | 44 | 11 |
| H+, e−, Fe2+, chromate, K+, Cl− | 75 | 23 |
| H+, e−, Cu2+, Cl− | 45 | 7 |
| H+, e−, Na+, nitrate | 33 | 1 |

Evidence: [comparison](hydra-system-comparison.json), [static Java reference](hydra-search-reference.json), [test](../tests/hydraSearch.test.js). Original source coefficients/log K are compared without mutation. The compiler may retain redundant selected-component equalities for cycle checking; these are not additional material carriers. Closed physical preparation explicitly adds H+/e−/water to its internal vocabulary, without supplying electron material.

## 3. Fe/chromate

The 21 admissible solids are legitimate source-system products. Java finds 23; two remain outside Adam's admitted integer/composition scope: Fe0.932O(cr) and FeOHCrO4(cr). Both are disclosed as excluded, not silently dropped or declared unstable. The general model contains 55 aqueous/source identities plus 21 solid identities (76 total); the old 64 combined bound was the blocker.

At the saved control, the general model accepts pH 2.000904879895163, pe 16.854453280490187 and Fe2O3(cr) = 2.0196894034631827e−6 mol/kg H2O. All other admitted phases satisfy the existing absence/complementarity tests. No phase was suppressed to achieve this result. See [general scope](hydra-fecr-general.json).

## 4. Phase scaling

The already existing coupled active-set policy was reused unchanged: solve the current set, inspect all absent saturation indices, add the most violated phase, remove negative/incompatible phases, repeat with deterministic cycle detection and the existing 24-step limit. No exhaustive enumeration is used by the new source-solid policy. The point API refuses attempts to use that policy without the active-set runner.

The combined source/solid envelope is now explicitly 128 species/reactions, aligned with the existing numerical product storage envelope. Aqueous source reduction remains bounded to 64 species/reactions and 16 basis coordinates. The old general 12-solid enumeration contract is preserved for its existing callers. This is bounded capacity, not a claim that every 128-species chemistry converges.

Focused synthetic controls at 63, 64, 65, 80 and 128 solid products solve two simultaneous positive solids; 129 is refused. The real 76-source Fe/chromate control also passes. Solver equations, tolerances, active-set selection and complementarity thresholds were not changed.

## 5. Historical versus general scopes

An explicit, unique `solidIds` request selects the historical nine-source scope; it remains distinct in prepared identity and phase disclosure from the 21-source model. The nine-phase saved reference is preserved and its test now explicitly requests those nine phases. At this control the two equilibria happen to agree; this does not make their models or validation claims interchangeable. [Restricted scope evidence](hydra-fecr-reviewed.json).

The production preservation gate passes the 12 Cr doses, three Fe/peroxide controls, Eu, three acetate/borate points and Li/acetate. Historical HCl/NaOH is also covered by titration/regression checks. [Twenty-point gate](production-source-gate.json).

## 6. Copper

The actual physical-preparation entry accepts Cu2+ 0.010 mol + Cl− 0.020 mol in 1 model kg water, with no Cu atom vector or Cu-specific branch. The corrected source scope gives pH 4.416482679202116 and pe 14.160701432847617; CuCl2·3Cu(OH)2(cr) = 5.125676351968837e−6 mol/kg H2O. Existing inventory, saturation and phase/gas checks pass. This is internal production integration evidence, not new external validation. [Complete result](hydra-copper.json).

## 7. Nitrate

The source network is connected and structurally closed: 28 species, 25 relations, rank 23 and four conserved coordinates. The previous *NO2-based initial linearization had numerical rank 2/4; very large derived *N2/*N2O/hydrazinium activities made rows nearly proportional. Missing atom vectors were not the cause.

Production now uses a narrowly triggered deterministic basis-conditioning fallback: only after the original initial linearization is ill-conditioned AND the unchanged original solve fails, examine single replacements of unsupplied, nonspecial basis coordinates; choose the admissible initial linearization with the largest pivot ratio, then solve with existing settings. It does not choose among converged answers, change material totals, randomize seeds or alter tolerances. Successful existing preparations retain their original basis. The selected basis and reason are disclosed.

For 0.010 mol Na+ + 0.010 mol NO3− in 1 model kg water, *N2 is selected (initial pivot ratio 0.9309570019652748). Production accepts pH 7.089258956203147, pe 12.586270943981088. Four independently executed coordinate choices (*N2, H2O2, O2 and O3) agree within about 1e−14 in pH/pe; the focused test compares all carrier logs against an alternative basis. Existing phase/gas checks pass, estimated gas fugacity sum 7.376042977207893e−5. Atom-based inventory semantics remain unavailable where unsupported. This is internal cross-basis evidence, not an external nitrate benchmark. [Basis audit](hydra-nitrate-basis-audit.json), [production result](hydra-nitrate-production.json).

## 8. Reaction-search UI

System now has a collapsed “Selected components → database products found” inspector, powered by the same source oracle. Aqueous, solids, gases and electron-transfer records have separate counts and expandable source-identified lists. Database membership is explicitly separated from accepted calculation scope; there is no product-by-product selection requirement.

Actual browser check: selecting Fe2+ with H+ gives 5 aqueous/1 solid; selecting e− updates it to 17 aqueous/8 solids/3 gases/12 electron-transfer records. The eight-solid list shows source IDs and intact formulas. Closed physical chemistry's internal electron coordinate is explicitly distinguished from an electron reagent.

## 9. Pourbaix implications

Read-only Fe/Cu comparison finds the existing material carrier source records inside the oracle's expanded system; redundant selected-basis identities differ as expected. Extra water/gas products and excluded fractional solids are explicitly outside the current reviewed model. Existing prepared system IDs remain Fe `8ead3d660c3c240620da3c69fa3a4b55810695c1dce8216e166f9579043386a1`, Cu `fa745a9d951a38cac972a421932facd4634655ad14203aec20dd7feb9ed47a05`.

The validated Pourbaix discovery/preparation path is preserved. This phase establishes source-membership correspondence, not full replacement-grid validation for arbitrary multicomponent pH/Eh systems. A future replacement must match basis reduction, analytical totals, phase exclusions, metadata support and exact grid results. [Source comparison](hydra-pourbaix-comparison.json).

## 10. General calculation architecture

The existing physical-preparation constructor now obtains a bounded source system, derives the permitted closed coordinates (with exact source conservation where needed), binds physical inventories and hands off to the existing numerical point/solid equations. Acid/base, redox and precipitation emerge from source laws; no separate numerical solver was added. Non-redox direct coordinates and redox source-nullspace reduction remain distinct structural adapters, with a common physical entry and accepted-result contract.

Ordinary analytical constraints, closed physical inventories, and imposed H+/e− reservoirs remain different boundary contracts. No Calculation mode was merged. Imposed grids still use their established validated preparation. Fractional source compilation, gas material equilibrium, nonideal closed models and unsupported large networks remain explicit boundaries, not universal support claims.

## 11. Performance

Reuse is bounded to immutable repository metadata, ordered component-support discovery, and complete reaction/basis/source-identity structure. Inventories, physical preparation provenance, revisions and point solves are never cached. Zero-dose support can differ from positive-dose support and receives a separate structural entry. Caches have bounded 32-entry structural/discovery maps; mutable repository wrappers are not trusted for metadata/discovery caching. Structural keys preserve signed zero, field types, source provenance, basis and solvent conventions. Discovery keys preserve ordered component support and reviewed-scope selection. Chromium currently creates four structural objects across the run. Reuse requires an exact structural key; this is not a claim of exactly one compilation across zero-dose and positive-dose support changes.


All 404 sample records match exactly, including pH, derived pe where defined, species IDs, concentrations, log activities, accepted solids and diagnostics. Every sweep accepted 101/101 points.

| Sweep | Independent per-dose time | Reuse time | Structural compiles before → after |
|---|---:|---:|---:|
| HCl | 0.09 s | 0.07 s | 0 → 0 |
| Acetate | 323.40 s | 123.28 s | 0 → 0 |
| Cr | 507.55 s | 84.77 s | 204 → 4 |
| Mixed | 352.56 s | 119.02 s | 0 → 0 |

Times are observations on the shared local machine, not isolated statistical benchmarks. Zero closed-redox structural compilations for HCl/acetate/mixed is expected: they use their existing acid/base/direct-coordinate paths. Metadata reuse improves the latter paths, but this phase does not claim that their complete preparation is compiled once. Separate compile/solve timing and complete point records are retained in [comparison](hydra-performance-comparison.json), [before](hydra-performance-before.json), [after](hydra-performance-after.json). Residual direct-path preparation overhead remains.

## 12. Final validation

The single full repository run completed: **703 tests, 701 pass, 2 fail, zero cancelled/skipped/todo** (1200.742 s). Both failures were isolated from thermodynamic calculations:

- The unchanged pre-phase `wetLabSolutions.js` silently ignored a caller-supplied sourceId on a reviewed recipe row. A rejection-only guard now enforces recipe-owned source identities; ionic rows retain their explicit identity contract. The original failing assertion and four related valid/invalid preparation checks pass (5/5).
- A Wet Lab solids hover test still required every log curve to be aqueous. That assertion conflicted with the already accepted solid-log adapter from the preceding integration. It now checks aqueous and solid presence, exact selected-result identity, positive solid log amounts, and zero-amount gaps, while retaining the hover/no-resolve checks. The focused hover/solid-view rerun passes (1/1), including its 101-state experiment. [Verification](hydra-solid-view-focused.txt).

The full suite is not repeated, following the once-only instruction. Its original failure log remains unaltered: [full run](hydra-full-regression.txt), [input guard verification](hydra-input-guard-focused.txt). The current source should not be described as having a clean 703/703 full rerun.

Final production build and artifact audit pass. The initial artifact audit correctly caught the upstream Java commit pin in the new runtime provenance object. That full pin remains in this report and the static reference, while runtime provenance uses `hydra-component-search-v1`; no audit rule was weakened. The two focused source-search tests still pass. The bundle was rebuilt after this disclosure-only correction; both initial logs are retained.

- [Production build](hydra-build.txt): 242 modules, index.html and required static assets produced. The existing chunk-size advisory remains. A local-only Vite launcher bypasses Windows mapped-drive enumeration (`net use`) because all project/dependency paths are local C: paths; no project/dependency source or build configuration was altered for this environment workaround.
- [Artifact audit](hydra-artifact-audit.txt): passed, including approved data/media hashes, production import boundary, absence of research/oracle markers and experimental carrier-mode disclosures.
- [Lint](hydra-lint.txt): zero errors, one existing `ExpandedPlot.jsx` ref-cleanup warning. That source file is unchanged.
- [Preservation](hydra-preservation.json): 251 checkpoint files compared, 15 expected source edits (including the preceding integration and the rejection-only repair), three new source files, zero missing/unexpected protected changes. All 14 saved independent-reference/fixture hashes match, including the official golden fixture, Fe/peroxide and Cu references. Thermodynamic data and numerical tolerance/linear-solve files remain unchanged. The full suite's scientific/golden cases passed; its two originally failing input/presentation tests have the focused verification described above.

No deployment, push, reset or cleanup was performed. Ready for review, with the full-run result and subsequent focused repairs explicitly separated.
