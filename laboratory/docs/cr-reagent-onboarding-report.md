# Chromium(III) chloride onboarding: audit and stop decision

**Decision: do not enable the production bottle yet.** Independent source equilibrium is tractable, but the current physical closed-redox preparation boundary cannot accept the NaOH-addition preparation. This is a software/scientific-contract gap, not evidence that chromium chloride cannot equilibrate. No production source, recipe catalogue, UI, data, solver or build was changed.

## A. Physical bottle identity
NIST Chemistry WebBook identifies chromium trichloride as Cl3Cr, CAS 10025-73-7: https://webbook.nist.gov/cgi/cbook.cgi?Name=CrCl3 (accessed 2026-09-16). The existing pinned component metadata explicitly supplies Cr(III) as component:Cr%203%2B (charge +3, Cr1) and chloride as component:Cl- (charge -1, Cl1). The proposed formula-unit map is therefore one of the former plus three of the latter, net charge zero. This is an idealized already-dissolved preparation measured in CrCl3 formula-unit equivalents, not a claim of instantaneous dissolution of anhydrous crystals or equilibrium molecular CrCl3. No source aqueous species named CrCl3 exists in this snapshot. Hydrate water is not added or silently counted as solvent.

Candidate recipe and pinned identities/provenance are recorded in cr-reagent-source-audit.json under recipeCandidate, explicitly NOT ENABLED. A 50 mL, 0.0100 mol/L sample supplies 0.000500 mol Cr and 0.001500 mol intrinsic Cl. A dose V mL of 0.1000 mol/L NaOH supplies 0.0001V mol sodium/base. Formula-unit moles stay nonnegative; the signed proton equivalent is an internal transformed coordinate, not a negative reagent.

## B. Targeted source graph
Forward closure starts only from the actual Cr(III), chloride, sodium, proton, electron and unit-water source coordinates; electron here is a reference algebra coordinate with zero analytical electron total, not an imposed potential. It reaches 46 source laws: 31 aqueous laws, 11 solid candidates and four gases. Duplicate source representations of a basis carrier are consistency laws, not duplicate inventories. No combinatorial element search was performed.

Chromium source chemistry includes Cr(II)/Cr(III)/chromate, mono- and polynuclear hydrolysis, Cr(OH)4-, dichromate/chromic-acid forms, and CrCl+2 (source 95316). Sodium association includes NaCl and NaOH. Chloride redox includes dissolved Cl2 and oxychlorine carriers; none was discarded as a spectator. Gas candidates are Cl2(g), H2(g), O2(g), O3(g). The mixed chromium solid NaCr2O7·2H2O(s) is included in the independent reference candidate set.

The non-redox boundary explicitly returns redox-boundary-mismatch for 11 connected aqueous source records. Cr(II)/Cr(III) and chromate/Cr(III) forward/reverse relations are present. A tiny calculated population is not used retrospectively to delete the source reaction or justify a restricted non-redox model. The historical HCl compatibility wrapper was not used.

## C. Exact current production blockers
1. General closed-redox discovery uses componentMetadata (closed-component-metadata-v1). Sodium is reviewed in networkComposition (network-composition-v2) for the non-redox route, but not shared into this redox registry. A positive-dose selection fails missing-conservation-metadata for component:Na%2B.
2. compileEquilibriumNetwork accepts the physical contribution preparation object only for closed-physical-nonredox. Passing it to closed-physical returns unsupported-boundary-condition. Thus the provenance-bearing physical NaOH source product (224689) has no supported redox preparation handoff.
3. preparationCharge on the equivalent dose coordinates returns invalid-reagent-inventory because H-equivalents are negative. That check correctly requires physical solute amounts to be nonnegative. It must not simply be relaxed to accept negative physical reagents; the physical-to-redox-basis transformation needs a separate validated handoff, including source-law/water bookkeeping.
4. Closed-redox pure-solid scope admits only Cr(OH)3(cr) and Cr2O3(cr) from this graph. Its other candidates remain checked exclusions. The independent reference includes all 11 reachable solids; it shows the two-phase restriction is not the first blocker for these sampled conditions, but any future support must disclose and validate the complete phase scope.

The existing redox compiler accepts the zero-NaOH initial Cr/chloride state, and its pH/pe agree with the independent reference within 1e-9. That single initial-point success does not establish production support for a sodium/base titration.

## D. Independent reference (12 strategic doses)
The existing independent raw-source Newton/phase implementation imports no production compiler, solver or new reagent onboarding. Every point reconstructs original cumulative inventories at the additive-volume model solvent mass (50+V)/1000 kg. It includes chromium/chloride redox and H/O carriers. Electron total is zero in the reference component basis; Eh is not prescribed. Numerical continuation of logarithmic initial guesses is used only to aid Newton convergence. Active solids and all physical totals are rebuilt at every point; no precipitate history is carried over.

An initial cold-start trial converged only at the first two doses; subsequent guesses failed line search. A bounded numerical continuation through the strategic doses resolves all 12 points without changing any source laws or tolerances. Those trial failures were numerical starting-guess failures, not phase-unavailability findings.

| NaOH / mL | pH | derived pe | solid-bound Cr / % total | positive solid |
|---:|---:|---:|---:|---|
| 0 | 2.685640974 | 10.845490416 | 0.00000000 |  |
| 1 | 2.835491314 | 10.583512573 | 0.00000000 |  |
| 2 | 2.967088544 | 10.353508632 | 0.00000000 |  |
| 3 | 3.100140471 | 10.121049636 | 0.00000000 |  |
| 5 | 3.463829829 | 9.486404909 | 0.00000000 |  |
| 7 | 3.574417803 | 9.293779912 | 18.60315261 | Cr2O3(cr) |
| 10 | 3.633028195 | 9.191787476 | 50.83607874 | Cr2O3(cr) |
| 14 | 3.853086455 | 8.809637584 | 91.47936162 | Cr2O3(cr) |
| 15 | 7.002153505 | 3.645479996 | 99.99993923 | Cr2O3(cr) |
| 20 | 11.850473910 | -3.520481524 | 99.99973091 | Cr2O3(cr) |
| 50 | 12.537114313 | -4.481778306 | 99.99841859 | Cr2O3(cr) |
| 100 | 12.743673598 | -4.770961306 | 99.99625111 | Cr2O3(cr) |

The sampled precipitation onset lies between 5 and 7 mL; this is not an exact boundary claim. Cr2O3(cr) controls all sampled solid-positive points. At 100 mL about 99.99625% of supplied Cr remains solid-bound. A decrease in solid molality at larger volume must not be mistaken for complete redissolution: dilution changes the denominator. No complete redissolution is predicted in this sampled interval. No equivalence point or precipitate was prescribed.

All candidates obey nonnegative amount and saturation/complementarity checks in the independent reference. Maximum mass-action residual is 1.422e-14 log units; maximum charge residual is 4.251e-16 equivalents/kg model water. Chromium inventory closure is checked at every point. The summed hypothetical gas activity remains below 1 (maximum about 1.134e-16), so this reference set does not require gas closure under the existing policy. This is not a finite-headspace model or a claim of zero volatilization. Exact source coefficients, every aqueous amount, every candidate amount/saturation, balances and timings are in cr-reagent-independent-reference.json.

Production-versus-reference comparison is established only at 0 mL. Positive-dose Calculation/Wet Lab parity, UI fractions, sediment and hover validation were not claimed or run, because the production preparation boundary refuses those doses.

## E. Reusable onboarding contract proposed, not enabled
One reviewed physical-reagent definition should contain: immutable recipe ID/version; display name/formula; authoritative physical formula-unit composition/charge; source fingerprint and pinned component/product identities; supplied form (including oxidation state where reviewed); source-coordinate contributions and intrinsic counterions; stoichiometric water bookkeeping separate from model solvent mass; permitted conditions; requested phase/redox boundary; provenance and metadata version. It contains no titration equation, endpoint, expected phase or expected pH.

The same representation can cover HCl (H+, Cl-), NaOH (source product 224689 and its water/proton transform), acetic acid (79298), boric acid (component:B(OH)3), and proposed CrCl3 (Cr(III), 3 Cl-). Existing recipes can be compatibility adapters. Physical rows must remain distinct from equilibrium carriers. A generic preparer must resolve and validate the resulting scope before the UI enables preparation.

Remaining scalability obstacles in current code:
- wetLabSolutions.js has a four-recipe object and a charge expression naming protonEquivalent/Na/Cl/acetate.
- wetLabSetup.js maps those coordinate keys to source identities and has acetate/boron-specific availability checks and sampling behavior.
- wetLabTitration.js chooses the historical chloride compatibility path by HCl recipe ID and refuses chloride/borate; its general route always requests non-redox preparation.
- reagentPreparation.js is a separate physical recipe catalogue with nonnegative direct component amounts and no general source-product/water transformation.
- componentMetadata and networkComposition expose different identity coverage to redox/non-redox paths.
- reviewed redox phase allowlists and fixed compiler capacities must remain explicit.
- Wet Lab fraction/component consumers currently assume a direct ordinary-component representation; a physical redox route needs a validated conserved-family projection rather than a renamed Cr basis denominator.

Therefore a new bottle is not yet primarily metadata-only. Resolve the generic physical-contribution-to-closed-redox boundary before enabling CrCl3. Do not remove conservation checks or invent an electron activity. No second reagent was attempted.

## F. Structural reuse audit
Safe reuse is not presently a trivial cache. Zero-dose sodium is absent, while positive-dose sodium adds basis identities, association laws and candidates. The current compiler system identity incorporates physical preparation provenance and coordinates; accepted inputs/results are branded and bound to that identity. Redox and non-redox entry points have different preparation contracts. A reusable structure would need explicit partitions for zero/positive component support, source fingerprint/revision, reagent identities, metadata version, phase scope/exclusions and conditions, plus fresh physical inventory/charge checks and accepted phase solution at every dose. No accepted equilibrium or phase decision may be reused as physical inventory.

No optimization was implemented before resolving the preparation boundary. This leaves the prior measured ~0.5 s per-dose compilation unchanged. The independent reference timings in its JSON describe the reference solver only, not a production speedup. No browser experiment was enabled.

## G. Validation and stop
Audit-script assertions pass: non-redox refusal; missing sodium redox metadata; signed-inventory rejection; initial production redox acceptance/parity; 12 independent source states with Cr closure, phase complementarity, mass action and gas checks. Production source/data/dist hashes are checked separately. The previous completed baseline remains 678/678; no full regression, production rebuild, deployment or push was performed in this audit-only stop.

The supplied continuation completes the structural-reuse condition and confirms Phase G (one full regression only after chemistry/browser readiness) and the conditional chromium browser demonstration. These requirements were incorporated. The explicit earlier instruction to stop production enablement when the existing closed-redox physical boundary cannot represent the preparation governs this audit-only result. This is an unsupported production preparation contract, not a fundamental thermodynamic impossibility: the independent reference succeeds.

## Source-law inventory
IDs below use the immutable imported source snapshot; full citations and record provenance are in cr-reagent-source-audit.json. These are discovered reference laws/candidates, not a production admission claim.

| Source ID | Display identity | Phase | Source coefficients | log K |
|---|---|---|---|---:|
| spana:2ac52a30213c9288:82236 | Cl2 | aqueous | 2 × Cl-; -2 × e- | -47.19 |
| spana:2ac52a30213c9288:82314 | Cl2(g) | gas | 2 × Cl-; -2 × e- | -45.98 |
| spana:2ac52a30213c9288:82394 | ClO- | aqueous | -2 × H+; 1 × Cl-; -2 × e-; 1 × H2O | -57.934 |
| spana:2ac52a30213c9288:82497 | ClO2(aq) | aqueous | -4 × H+; 1 × Cl-; -5 × e-; 2 × H2O | -127.1 |
| spana:2ac52a30213c9288:82605 | ClO2- | aqueous | -4 × H+; 1 × Cl-; -4 × e-; 2 × H2O | -107.9 |
| spana:2ac52a30213c9288:82715 | ClO3- | aqueous | -6 × H+; 1 × Cl-; -6 × e-; 3 × H2O | -146.24 |
| spana:2ac52a30213c9288:91458 | Cr 2+ | aqueous | 1 × Cr 3+; 1 × e- | -7.183 |
| spana:2ac52a30213c9288:91532 | Cr 3+ | aqueous | -1 × e-; 1 × Cr 2+ | 7.183 |
| spana:2ac52a30213c9288:91606 | Cr 3+ | aqueous | 8 × H+; 3 × e-; -4 × H2O; 1 × CrO4 2- | 76.35 |
| spana:2ac52a30213c9288:92135 | Cr(cr) | solid | 1 × Cr 3+; 3 × e- | -37.67 |
| spana:2ac52a30213c9288:93513 | Cr(OH)2(s) | solid | 1 × Cr 2+; -2 × H+; 2 × H2O | -10.99 |
| spana:2ac52a30213c9288:93605 | Cr(OH)2+ | aqueous | 1 × Cr 3+; -2 × H+; 2 × H2O | -9.83 |
| spana:2ac52a30213c9288:93695 | Cr(OH)3 | aqueous | 1 × Cr 3+; -3 × H+; 3 × H2O | -16.17 |
| spana:2ac52a30213c9288:93784 | Cr(OH)3(am) | solid | 1 × Cr 3+; -3 × H+; 3 × H2O | -12 |
| spana:2ac52a30213c9288:93877 | Cr(OH)3(cr) | solid | 1 × Cr 3+; -3 × H+; 3 × H2O | -9.33 |
| spana:2ac52a30213c9288:93970 | Cr(OH)4- | aqueous | 1 × Cr 3+; -4 × H+; 4 × H2O | -27.4 |
| spana:2ac52a30213c9288:94615 | Cr2(OH)2+4 | aqueous | 2 × Cr 3+; -2 × H+; 2 × H2O | -5.06 |
| spana:2ac52a30213c9288:94801 | Cr2O3(cr) | solid | 2 × Cr 3+; -6 × H+; 3 × H2O | -15.48 |
| spana:2ac52a30213c9288:94892 | Cr2O7-2 | aqueous | 2 × H+; 2 × CrO4 2-; -1 × H2O | 14.54 |
| spana:2ac52a30213c9288:94983 | Cr3(OH)4+5 | aqueous | 3 × Cr 3+; -4 × H+; 4 × H2O | -8.15 |
| spana:2ac52a30213c9288:95316 | CrCl+2 | aqueous | 1 × Cr 3+; 1 × Cl- | 0 |
| spana:2ac52a30213c9288:95613 | CrH(s) | solid | 1 × Cr 3+; 1 × H+; 4 × e- | -39.2 |
| spana:2ac52a30213c9288:95947 | CrO2(cr) | solid | 1 × Cr 3+; -4 × H+; -1 × e-; 2 × H2O | -24.75 |
| spana:2ac52a30213c9288:96049 | CrO3(cr) | solid | 2 × H+; 1 × CrO4 2-; -1 × H2O | 3.4 |
| spana:2ac52a30213c9288:96141 | CrO4 2- | aqueous | 1 × Cr 3+; -8 × H+; -3 × e-; 4 × H2O | -76.35 |
| spana:2ac52a30213c9288:96242 | CrOH+ | aqueous | 1 × Cr 2+; -1 × H+; 1 × H2O | -4.98 |
| spana:2ac52a30213c9288:96329 | CrOH+2 | aqueous | 1 × Cr 3+; -1 × H+; 1 × H2O | -3.56 |
| spana:2ac52a30213c9288:151381 | H2 | aqueous | 2 × H+; 2 × e- | -3.083 |
| spana:2ac52a30213c9288:151531 | H2(g) | gas | 2 × H+; 2 × e- | 0 |
| spana:2ac52a30213c9288:151977 | H2CrO4 | aqueous | 2 × H+; 1 × CrO4 2- | 6.31 |
| spana:2ac52a30213c9288:152743 | H2O2 | aqueous | -2 × H+; -2 × e-; 2 × H2O | -59.61 |
| spana:2ac52a30213c9288:159033 | HCl | aqueous | 1 × H+; 1 × Cl- | -0.7 |
| spana:2ac52a30213c9288:159101 | HClO | aqueous | -1 × H+; 1 × Cl-; -2 × e-; 1 × H2O | -50.514 |
| spana:2ac52a30213c9288:159212 | HClO2 | aqueous | -3 × H+; 1 × Cl-; -4 × e-; 2 × H2O | -105.91 |
| spana:2ac52a30213c9288:159826 | HCrO4- | aqueous | 1 × H+; 1 × CrO4 2- | 6.51 |
| spana:2ac52a30213c9288:175307 | HO2- | aqueous | 1 × H2O2; -1 × H+ | -11.65 |
| spana:2ac52a30213c9288:220295 | Na(cr) | solid | 1 × Na+; 1 × e- | -45.89 |
| spana:2ac52a30213c9288:223384 | NaCl | aqueous | 1 × Na+; 1 × Cl- | -0.76 |
| spana:2ac52a30213c9288:223454 | NaCl(s) | solid | 1 × Na+; 1 × Cl- | -1.558 |
| spana:2ac52a30213c9288:223604 | NaCr2O7·2H2O(s) | solid | 2 × Na+; 2 × H+; 2 × CrO4 2-; 1 × H2O | 12.12 |
| spana:2ac52a30213c9288:224689 | NaOH | aqueous | 1 × Na+; -1 × H+; 1 × H2O | -14.4 |
| spana:2ac52a30213c9288:249989 | O2 | aqueous | -4 × H+; -4 × e-; 2 × H2O | -85.988 |
| spana:2ac52a30213c9288:250070 | O2(g) | gas | -4 × H+; -4 × e-; 2 × H2O | -83.09 |
| spana:2ac52a30213c9288:250161 | O3 | aqueous | -6 × H+; -6 × e-; 3 × H2O | -155.14 |
| spana:2ac52a30213c9288:250265 | O3(g) | gas | -6 × H+; -6 × e-; 3 × H2O | -153.23 |
| spana:2ac52a30213c9288:250448 | OH- | aqueous | -1 × H+; 1 × H2O | -14.0015 |
