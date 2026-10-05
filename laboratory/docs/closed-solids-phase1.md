# General closed physical equilibrium with pure solids — Phase 1

## Contract

An explicit compiler request with phases [aqueous, pure-solids] admits the pinned nine-record closed-pure-solids-v1 scope when reachable. The caller's source fingerprint is mandatory. Aqueous-only requests and the explicit reviewed peroxide profile retain their old contracts. No new visible calculation mode was added.

Solid composition, neutral charge and transformed formation laws come from exact retained source coefficients and the established aqueous reaction basis, including the eliminated electron expression. No formula parsing, guessed stoichiometry, copied thermodynamic constants or element-name solve branch is used. Source identities, source laws, references, required components, transformed coefficients and exclusions are in closed-solids-benchmark.json.

The existing point Newton equations solve all admitted aqueous activities and active solid amounts simultaneously. The new opt-in selection policy starts aqueous, admits the largest violated log-saturation constraint (source ID resolves numerical ties), removes the most negative active amount, detects repeated phase sets and stops after at most 24 phase solves. It does not enumerate subsets. Dependent constraints or numerical failure cause refusal, not another convergence-selected assemblage search. Ordinary/Pourbaix subset selection is unchanged. Inner tolerances remain 2e-13 scaled balance and 1e-12 saturation; negative amounts have zero allowance. Physical conservation, aqueous source laws, common redox potential and proton/water closure are checked after the coupled solve.

This is bounded conditional equilibrium support, not universal multiphase support. All excluded source phases are checked at the coupled state. A materially supersaturated excluded solid or required gas withholds the candidate.

## Fe/chromate

Exact supplied mol/kg H2O: Fe2+ 6e-6, CrO4 2- 2e-6, K+ 2e-6, Cl- .010012, H+ .010002. Ideal 25 C, 1 bar declared, unit water activity, no imposed pH/Eh.

- pH: 2.000904879895163
- pe: 16.854453280490187
- Eh: 0.9970984953663458 V vs SHE
- dissolved Fe: 0.0000019606211930739816 mol/kg H2O
- solid-bound Fe: 0.0000040393788069263654 mol/kg H2O
- dissolved Cr: 0.000001999999999999999 mol/kg H2O
- Fe partition: dissolved 32.6770198846%, solid-bound 67.3229801154% of supplied Fe.
- No admitted phase is assigned a fake trace. Eight candidates are exactly zero.

| Candidate | Amount (mol/kg H2O) | Log saturation | Status |
|---|---:|---:|---|
| Fe(cr) | 0 | -59.45557448115607 | absent |
| Fe(OH)2(cr) | 0 | -18.154858160385352 | absent |
| Fe(OH)3(am) | 0 | -4.9505 | absent |
| Fe(OH)3(s) | 0 | -3.4804999999999993 | absent |
| Fe2O3(cr) | 0.0000020196894034631827 | 0 | present |
| Fe3O4(cr) | 0 | -16.294858160385353 | absent |
| FeOOH(cr) | 0 | -0.22049999999999947 | absent |
| Cr(OH)3(cr) | 0 | -9.042284795840331 | absent |
| Cr2O3(cr) | 0 | -14.904569591680664 | absent |

Twenty-three reachable solids were audited, not just hematite/goethite. Fourteen are excluded from this bounded inventory scope; all are undersaturated at the final state. The excluded-gas normalized fugacity sum is 2.1450264048081155e-8; this is a phase audit, not solved gas inventory or gas-evolution kinetics.

| Excluded source ID | Display identity | Reason |
|---|---|---|
| spana:2ac52a30213c9288:92135 | Cr(cr) | Outside the explicitly bounded pure-solid source scope; saturation must be checked after closure |
| spana:2ac52a30213c9288:93513 | Cr(OH)2(s) | Outside the explicitly bounded pure-solid source scope; saturation must be checked after closure |
| spana:2ac52a30213c9288:93784 | Cr(OH)3(am) | Outside the explicitly bounded pure-solid source scope; saturation must be checked after closure |
| spana:2ac52a30213c9288:95613 | CrH(s) | Outside the explicitly bounded pure-solid source scope; saturation must be checked after closure |
| spana:2ac52a30213c9288:95947 | CrO2(cr) | Outside the explicitly bounded pure-solid source scope; saturation must be checked after closure |
| spana:2ac52a30213c9288:96049 | CrO3(cr) | Outside the explicitly bounded pure-solid source scope; saturation must be checked after closure |
| spana:2ac52a30213c9288:132744 | Fe0.932O(cr) | missing-solid-composition: source transport does not establish neutral nonnegative integer composition |
| spana:2ac52a30213c9288:136105 | FeCr2O4(cr) | Outside the explicitly bounded pure-solid source scope; saturation must be checked after closure |
| spana:2ac52a30213c9288:138772 | FeOCl(cr) | Outside the explicitly bounded pure-solid source scope; saturation must be checked after closure |
| spana:2ac52a30213c9288:139063 | FeOHCrO4(cr) | missing-solid-composition: source transport does not establish neutral nonnegative integer composition |
| spana:2ac52a30213c9288:139158 | FeOHCrO4·2Fe(OH)3(cr) | Outside the explicitly bounded pure-solid source scope; saturation must be checked after closure |
| spana:2ac52a30213c9288:187224 | K(cr) | Outside the explicitly bounded pure-solid source scope; saturation must be checked after closure |
| spana:2ac52a30213c9288:188345 | KCl(s) | Outside the explicitly bounded pure-solid source scope; saturation must be checked after closure |
| spana:2ac52a30213c9288:188780 | KFe3(CrO4)2(OH)6(s) | Outside the explicitly bounded pure-solid source scope; saturation must be checked after closure |

No missing-component phases are admitted: discovery requires every retained source term to resolve in the connected selected system. Composition-invalid records remain excluded and visible; source equations are not repaired to match their labels.

## Independent reference

scripts/validation/closedSolidsReference.js imports only Node filesystem access and raw source data. It independently expands source-coordinate laws and implements its own Newton elimination, line search, component sums and bounded phase changes. It does not import production discovery, compiler, point solver, or solid closure. Duplicate source representations of one aqueous carrier are counted once; every retained source equation is then checked against that identity. All nine candidate phases participate in the reference.

Maximum aqueous carrier log10 ratio difference: 1.7045934462194654e-11. pH difference: 0; pe difference: 2.8350655156827997e-12. Independent maximum source mass-action residual 2.3092638912203256e-14; maximum scaled inventory residual 5.872761767629471e-14; charge residual 2.5478950969514e-16. Hematite amount agrees within 4e-14 mol/kg water. Both methods choose hematite alone. Source/candidate ordering tests pass.

Production physical residuals (mol/kg water or corresponding charge equivalents):
- Cl: 3.469446951953614e-18; accepted limit 1.029621709430404e-12
- Cr: -8.470329472543003e-22; accepted limit 6.842170943040401e-14
- Fe: 3.4728350837426314e-19; accepted limit 4.842170943040401e-14
- K: 2.541098841762901e-21; accepted limit 4.842170943040401e-14
- H-2O: 2.6020852139652106e-16; accepted limit 1.2086217094304042e-12
- charge: 2.545711957094639e-16; accepted limit 2.169821709430404e-12

## Controls and adapters

The unchanged ordinary Fe(III), total 1, pH 0, exact existing phase scope was run through the new phase-selection policy: dissolved Fe .8989408591996729, hematite .0505295704001635, solid-bound Fe .101059140800327 within 4e-14. This is an exact-scope numerical precipitation bridge, **not a claim that a fixed-pH open condition is the same physical preparation as the closed Fe/chromate recipe**. A separate fully closed recipe reproducing that open Fe(III) model has not been established here; introducing counterions/redox source families would change its scope.

The Fe/chromate control with H+ .100002 and Cl- .100012 is fully dissolved: all nine solid amounts exactly zero, every candidate undersaturated, no beaker sediment. Eligible is not present.

Total Fractions uses the existing function unchanged on compatible conserved component projections. The Fe fraction closes against supplied 6e-6; its hematite coefficient is two. Signed transformed coordinates retain their existing fraction/solubility refusal. Physical element readout uses the already accepted carrier allocation and supplied conservation-row denominator, never a renormalized incomplete inventory. Existing beaker drawing/visibility rules consume the exact accepted point; no second equilibrium or portrait. The selected solid exposes exact amount and saturation.

Log Solubility is unchanged; its ordinary Fe control remains -0.046268879310268275. It remains unavailable for signed or otherwise incompatible physical-basis quantities. No mixed overlay was extended.

No separate non-Fe positive-precipitation benchmark is claimed. Chromium phases are present as source-derived absent candidates, but validating a broader positive chromium domain is outside this bounded phase. No extra chemistry family or database-wide search was performed.

## Failure and limits

Focused controls explicitly refuse missing-solid-composition, solid-network-capacity-exceeded, unsupported phase classes and forged preparations. Aqueous-only Fe/chromate still produces the original relevant-solid-or-unresolved-phase refusal. New phase iteration detects active-set-cycle or returns solid-phase-closure-failed with per-phase diagnostics/history. Excluded solid/gas requirements withhold the coupled candidate; there is no aqueous fallback.

Unchanged limits: 64 closed source species, 64 source reactions, 16 basis coordinates, 12 admitted solid candidates. This benchmark reaches 64 species (55 aqueous-network species including special identities +9 solids), 60 source laws (51 aqueous +9 solid laws), seven basis coordinates. It uses two active-set solves: aqueous then hematite. Timing is recorded per run in the numerical artifact; cold compilation includes source integrity hashing and varies with machine load.

Unsupported: gases/headspace, non-pure solids/solid solutions, fractional/nonstoichiometric solid composition, kinetics/metastability, unregistered phase scope, broader composition metadata, capacity overflow, and universal guarantees that every admissible phase transition converges under this deliberately bounded policy.

## Next boundary and preservation

The next useful boundary is a reviewed physical-inventory adapter and benchmark for mixed closed preparations (including the ordinary Fe(III) bridge), followed by Wet Lab mixed-solution consumption. Do not yet unify imposed-Eh Pourbaix with closed derived-Eh boundaries. Gas closure is not required by this benchmark. The separate architecture report records the required future simultaneous multiple-acid-family titration contract.

The implementation adds only an opt-in phase-selection branch and closed-solid adapter; source constants, tolerance values, existing aqueous/Pourbaix/Wet Lab/fraction/solubility mathematics are unchanged. Numerical and UI validation logs are listed below; final check outcomes are appended after completion.

- closed-solids-focused.txt: 29/29 focused checks before full regression.
- closed-solids-browser.txt: exact recipe, solid click inspection, absent-state control, stale-result invalidation, visual inspection.
- closed-solids-regression.txt: single full regression run.
- closed-solids-build.txt, closed-solids-artifact.txt, closed-solids-lint.txt, closed-solids-preservation.json: final checks.

No deployment or push. Stop for review.

## Final verification

- Full regression: **659/659 passed**, zero failures/cancellations/skips/TODO; 445390.0441 ms. Run once.
- Focused pre-regression suite: **29/29**. Final targeted confirmation: **8/8** after tightening the new composition guard to the existing 128-epsilon structural convention and clarifying admitted-phase labels. No existing solver tolerances changed.
- Browser: exact Fe/chromate recipe, solid inspection, absent-solid recipe, stale invalidation and rendering passed.
- Production build: passed; existing large-bundle advisory remains.
- Artifact audit: passed.
- Lint: zero errors; one pre-existing ExpandedPlot.jsx:21:114 ref-cleanup warning.
- Preservation: **338** pre-existing source/test/data hashes compared, **332 unchanged**, exactly six intended files changed, zero unexpected changes. All source data and existing tests unchanged. Source registry and validation/reference additions are new files.
- Latest recorded cold compile 2270.175 ms; preparation 318.528 ms; coupled solve 34.319 ms; two active-phase solves.
- No deployment or push.
