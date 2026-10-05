# Closed redox Step 3 — first real-source reaction-network benchmark

## Decision and scientific scope

**Accepted as a reaction-restricted real-source benchmark, not as a complete V/Eu aqueous-equilibrium model or public feature.** No production source, thermodynamic constant, tolerance, solver, UI or scientific gate was changed. This phase adds only validation scripts, permanent tests and documentation.

Selected: V(III)/V(II) and Eu(III)/Eu(II), with explicit chloride counterions. The reacting physical subsystem has exactly five admitted aqueous species: V³⁺, V²⁺, Eu³⁺, Eu²⁺ and Cl⁻. Water is the implicit solvent mass convention, not an admitted reaction species. There is no imposed pH, acid reservoir, H/O inventory, gas, solid or ligand reaction. Chloride is constrained to remain a spectator **by the benchmark model**, not asserted to be universally noncomplexing.

This is the transparent simpler scope allowed by the request. It establishes an exact conditional thermodynamic equilibrium for the two imported redox reactions under the ideal model. It does not demonstrate that omitted hydrolysis, complexation, further vanadium oxidation states, precipitation or water/gas reactions are negligible in a real prepared beaker. No claim of a physically complete solution at unspecified pH is made. The existing closed compiler cannot yet admit ordinary proton/water chemistry or non-electron hydrolysis reactions; its gates were left intact.

## 1. Actual imported candidates considered

| Candidate pair | Imported reduction log K / electron count | Assessment |
|---|---|---|
| Fe(III/II) + Ce(IV/III) | 13.051 / 1; 29.08 / 1 | NEA-Fe and Bard/IUPAC sources; very large driving force and Ce(IV) hydrolysis make the first independently interpretable test less convenient. |
| Fe(III/II) + Sn(IV/II) | 13.051 / 1; 12.98 / 2 | Authoritative NEA Fe/Sn records; useful future unequal-electron real control, but Sn(IV) hydrolysis/complexation adds scope issues. |
| Fe(III/II) + Cu(II/I) | 13.051 / 1; 2.833 / 1 | Existing well-audited sources, but Cu(I) disproportionation/metal competition complicate an aqueous-only interpretation. |
| V(III/II) + Eu(III/II) | −5.83 / 1; −6.1 / 1 | Selected. Same source reference, monatomic explicit reactions, no H/O terms, moderate net K and four substantial equilibrium ionic amounts. |

The complete relevant imported records, provenance and an inventory of excluded V/Eu carriers are retained in `closed-redox-step3-sources.json`. Selection was based on source/reaction interpretability, not a dramatic visual result. No uranium chemistry was used.

## 2. Source and reaction audit

Database: `Eq-Diagr/Reactions.db`, SHA256 `2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a`.

| Identity | Imported reaction | log K | Electron count | Reference temperature |
|---|---|---:|---:|---:|
| `spana:2ac52a30213c9288:360928` (byte 360928) | V³⁺ + e⁻ → V²⁺ | −5.83 | +1 | 298.15 K |
| `spana:2ac52a30213c9288:120483` (byte 120483) | Eu³⁺ + e⁻ → Eu²⁺ | −6.1 | +1 | 298.15 K |

Both records cite **85Bar/Par: Bard A. J., Parsons R., Jordan J. (eds.), Standard Potentials in Aqueous Solution, Marcel Dekker / IUPAC, 1985**. This is the authoritative citation preserved in the imported database; this phase did not independently re-extract the book. V³⁺ and Eu³⁺ bind to `component:V%203%2B` and `component:Eu%203%2B`; chloride binds to `component:Cl-` in `Eq-Diagr/Reactions.elb`.

The two raw source reactions are imported directly; their electron coefficients and constants are checked against pinned expectations before solving. Atomic composition and charge are explicit, static assignments to these five specific monatomic identities (V=1 or Eu=1 or Cl=1; charges +3,+2,+3,+2,−1). No runtime formula parsing or generic oxidation-state guessing is used. The imported product atom-composition/oxidation metadata are null; the small fixture supplies its own explicit composition table for compiler bookkeeping, without extending the public oxidation-state registry.

Both half reactions conserve one metal atom and charge exactly: 3−1=2. Their difference cancels electrons exactly at one electron. Original source pressure-reference scalars and activity-model compatibility fields are unavailable; these facts remain in the source audit. Calculations retain Adam's declared 1 bar, 25 °C, ideal normalized molal-activity convention. No hidden pressure or molarity correction is introduced. Thus the comparison validates the architecture against these imported standards under the declared model, not experimental accuracy of a finite-ionic-strength solution.

## 3. Independent derivation, established before the production result

Preparation A on a one-kg-water convention:

- V³⁺ = 0.001 mol/kg, initially V²⁺ = 0.
- Eu²⁺ = 0.001 mol/kg, initially Eu³⁺ = 0.
- Cl⁻ = 0.005 mol/kg.

Charge is exactly 3(0.001)+2(0.001)−0.005=0. Conserved analytical quantities are V=0.001, Eu=0.001, Cl=0.005 and physical charge=0. Preparation oxidation-state totals are **not** independently conserved.

Net reaction:

V³⁺ + Eu²⁺ ⇌ V²⁺ + Eu³⁺

log Knet = −5.83 − (−6.1) = 0.27; Knet = 1.8620871366628655.

For extent x and T=0.001, V²⁺=Eu³⁺=x and V³⁺=Eu²⁺=T−x. Therefore Knet=[x/(T−x)]² and x=T sqrt(Knet)/(1+sqrt(Knet)). The quotient is strictly increasing for 0<x<T, so the physical solution is unique.

| Species | Independently expected mol/kg H₂O | Closed result mol/kg H₂O |
|---|---:|---:|
| V³⁺ | 0.00042290752417467115 | 0.00042290752417467115 |
| V²⁺ | 0.0005770924758253289 | 0.0005770924758253289 |
| Eu³⁺ | 0.0005770924758253289 | 0.0005770924758253289 |
| Eu²⁺ | 0.00042290752417467115 | 0.00042290752417467115 |
| Cl⁻ | 0.005 | 0.004999999999999999 |

V(II) and Eu(III) each account for 57.7092475825% of their respective element; the complementary states account for 42.2907524175%.

Each raw half reaction gives pe = log K + log(a_oxidized/a_reduced):

- V: −5.83 + log10((T−x)/x) = −5.965.
- Eu: −6.1 + log10(x/(T−x)) = −5.965.

The [IUPAC Nernst convention](https://goldbook.iupac.org/terms/view/09068) relates equilibrium potential to activities. An independent SI conversion gives Eh=(RT ln10/F)pe = **−0.3528855208697266 V vs SHE**, with RT ln10/F = 0.05915934968478233 V at 25 °C. Production gives −0.35288552086972663 V. Displayed precision describes numerical comparison, not accuracy of the source constants.

## 4. Independent transformed algebra and production calculation

The production `prepareClosedRedox` → `compileClosedRedoxNetwork` → unchanged point solver path was used. Every physical constraint is kh=1. No Eh, pe, electron total or electron activity is supplied; the formal electron is absent from the numerical solver species.

For physical basis [V³⁺, Eu³⁺, V²⁺, Cl⁻], eliminating the electron directly from the raw half laws gives:

log a(Eu²⁺) = −0.27 − log a(V³⁺) + log a(Eu³⁺) + log a(V²⁺).

Thus the independently derived product coefficient row is [−1,+1,+1,0], log beta −0.27. The formal log electron activity is log a(V²⁺)−log a(V³⁺)+5.83. The source-sort cancellation may store the inverse net reaction with log K −0.27; this is algebraically identical to the positive-extent equation above. Exact integer electron cancellation and independent elemental/charge reconstruction are tested.

One initial test assertion mistakenly used [1,1,−1,0]. Reviewing the raw half-reaction division establishes [−1,1,1,0]; the assertion was corrected. The expected equilibrium composition, source constants and production compiler were not changed.

## 5. Imposed-Eh cross-check and boundary conditions

The same five physical species and the same source half reactions were prepared with explicit formal electron activity through existing generic `prepareChemicalSystem`, `createPointInput`, `createSweepDefinition` and `runSweep` APIs. A five-point Eh sweep spans the independent potential ±0.05 V, and an exact point is separately executed at the independently predicted Eh. There is no interpolation.

All 5/5 sweep points are accepted; each agrees exactly with a separate fixed-Eh solve. At the matching potential the maximum closed/fixed composition difference is **1.3552527156068805e−17 mol/kg**; physical charge residual is **6.093216209368535e−17 mol/kg of charge**.

The public `runImposedEh` discovery wrapper and `solveFixedRedox` convenience wrapper are not extended here: the former admits one redox family, and the latter requires H/e/water reference components. This benchmark instead exercises the existing general LA/Eh axis and point/sweep machinery used underneath those features, while retaining exactly the five-ion chemistry. No fake proton/water species, extra reservoirs, or relaxed wrapper gates were introduced. This is an API integration cross-check, not validation of a new two-family UI route.

Away from the matching Eh, imposed electron exchange changes the subsystem's total oxidation charge. With the same fixed chloride inventory those points are not the electroneutral closed preparation. Their nonzero physical charge is disclosed in the evidence; they are **not** claimed to be stand-alone neutral bulk-solution equilibria. Only the exact matching potential has thermodynamically equivalent closed physical inventories. This distinction prevents false agreement by changing counterions or ignoring charge.

## 6. Preparation, basis and order invariance

Preparation B supplies 0.0005 mol/kg of each of V³⁺, V²⁺, Eu³⁺ and Eu²⁺, plus the same 0.005 chloride. It has exactly the same V, Eu, Cl and charge inventories as preparation A. It is specified independently, not generated from solver output.

Two physical bases were tested: [V³⁺,Eu³⁺,V²⁺,Cl⁻] and [V²⁺,Eu²⁺,V³⁺,Cl⁻]. Both histories, both bases, and both source reaction orders yield eight accepted combinations. All reproduce the independent composition and common Eh. Different histories retain different preparation IDs; within the same basis their equilibrium input identities agree. No sequential pairwise reaction solver is used.

## 7. Residuals, tolerances and evidence

For the primary closed control: V and Eu inventory residuals are zero numerically; chloride residual is −8.673617379884035e−19; physical charge residual is +8.673617379884035e−19. The net-reaction log residual and inter-couple pe difference are zero numerically. Across all eight controls the maximum absolute physical-inventory residual is 8.673617379884035e−19, maximum net log residual is zero, and maximum inter-couple pe discrepancy is zero. All eight controls' exact residuals, existing acceptance bounds, transformed expressions and provenance identities are in `closed-redox-step3-evidence.json`.

Regression comparison uses absolute composition difference ≤1e−12 mol/kg (one part in 10⁹ of each 0.001 analytical metal total), pe difference ≤1e−10 and Eh difference ≤1e−11 V. These are comparison bounds, not changed solver tolerances. The solver's original mass-action tolerance remains 1e−10 in log space and its original component-balance acceptance is separately required at every point. Observed differences are orders of magnitude smaller than comparison limits.

## 8. Remaining limitations and next decision

This is a successful real-source **conditional reaction-network** benchmark. It does not yet meet a stronger claim of complete real-solution chemistry. Hydrolysis, explicit acid/base/water closure, chloride complexes, additional V valences, solids, gas exchange and nonideal activities remain outside this fixture. The source audit lists excluded records; none were silently admitted or treated as negligible. The predicted reducing potential also does not establish gas stability or kinetics.

The architecture is ready for a harder **bounded reaction-network benchmark**, including unequal real electron stoichiometry. It is **not yet demonstrated ready for substantially harder, chemically complete aqueous redox systems**. The next scientific step should establish proton/water and non-redox reaction closure with independently validated scope before combining hydrolysis, precipitation or strong complexation. Uranium and Fe/U were not added. No Wet Lab UI or new public support claim was introduced.

## Validation status

Focused closed-redox and imposed-Eh tests: **30/30 pass**. Final full regression: **555/555 pass**, zero failures, cancellations, skips or todo (364.517 seconds). Production build and artifact audit pass. All 223 protected source/public file hashes are unchanged, preserving production science, Fe/Cu references and existing goldens. Lint: zero errors, one pre-existing ExpandedPlot warning. Companion `closed-redox-step3-*` files retain the evidence. No deployment or push. Stop for review.

## Restart recovery audit

The surviving initial full-regression log recorded 555/555 passing, but a subsequent provenance-assertion edit in the validation helper contained an invalid regular-expression literal. The focused log exposed that syntax error. Recovery changed only that assertion to an explicit citation-prefix check; no expected amounts, equations or production files changed. The corrected focused run passes 30/30. The final full regression against the corrected helper passes 555/555 with zero failures, cancellations, skips or todo. The surviving production build and artifact audit pass, and a fresh comparison confirms all 223 protected source/public files unchanged. Lint reports zero errors and one pre-existing ExpandedPlot warning.
