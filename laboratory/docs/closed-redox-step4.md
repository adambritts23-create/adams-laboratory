# Closed redox Step 4 — proton/water and non-electron reaction closure

## Decision

The production closed-redox preparation/compiler now admits a simultaneous network of source redox half-reactions and ordinary aqueous reactions, with an explicitly declared unit-activity water solvent. The eight-solute V/Eu/hydrolysis benchmark independently validates derived pH and Eh. This is a **bounded conditional aqueous network**, not a chemically complete V/Eu solution or a public Wet Lab feature.

## 1. Architecture audit and classification

The previous `closedRedoxNetwork.js` rejected (a) any physical carrier whose role was not `ordinary` or phase not `aqueous`, excluding the normal proton and liquid-water identities; (b) any source reaction without a nonzero electron term. Preparation then assigned kh=1 totals to every basis component. Inspection computed logarithms from concentrations, which cannot represent suppressed solvent water's activity. The existing elemental-inventory rank check assumed every atom in the admitted species remained in the solute inventory.

The normal path already represents H+ as an unsuppressed proton component, OH−/complexes as aqueous products with signed coefficients, and H2O as suppressed solvent water. The point solver accepts kh=1 signed component totals and kh=2 logarithmic activities. Water is required to have kh=2, log activity zero. It has no analytical total and its numerical free concentration is suppressed to zero. Fixed pH is a proton kh=2 condition; a proton kh=1 coefficient total is a signed acid/base inventory, not a final free-H+ concentration.

**Classification A: preparation/compiler integration using the existing constraint mathematics**, with an explicit solvent convention and inventory projection. No new numerical constraint type, independent electroneutrality equation, Newton equations, tolerances or acceptance criteria were required. Charge closure follows from explicit electroneutral preparation and the spanning conserved physical quantities; an extra charge equation would overconstrain this basis.

A small point-solver interface connection was also necessary for one cancellation-sensitive starting guess (section 11). That forwards a validated initial vector to the already-existing internal initialization facility; it does not change the solver mathematics.

## 2. Candidate benchmarks and selected scope

- V/Eu plus water dissociation alone: simple, but without metal hydrolysis acid/base and redox would largely be decoupled. Insufficient coupling demonstration.
- V/Eu plus Eu(III) first hydrolysis: imported `spana:2ac52a30213c9288:125602`, log K −7.9, Haas/Shock/Sassani (1995). At the chosen acidic conditions its response is much smaller; retained as an audited alternative.
- **V/Eu plus V(III) first hydrolysis and water dissociation:** selected. Reuses both accepted real-source redox half-reactions and adds a substantial, independently interpretable proton/redox feedback.
- A labeled synthetic protonated-carrier extension was available as the authorized fallback, but unnecessary because these imported reactions suffice.

Admitted solutes: V³⁺, V²⁺, Eu³⁺, Eu²⁺, V(OH)²⁺ (source display `VOH+2`), H⁺, OH⁻ and Cl⁻. H2O is the fixed solvent identity; e− is a formal algebraic identity eliminated from the closed numerical system. There are no solids or gases.

Chloride is an explicitly constrained spectator in this benchmark. Higher hydrolysis products, Eu hydrolysis, chloride complexes, additional vanadium states, precipitates and gas reactions are excluded by the declared model. This does **not** assert that they are negligible in an actual beaker or that the chosen source subset is complete.

## 3. Admitted reactions and provenance

All constants are the unchanged imported values at 298.15 K. Database SHA256: `2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a` (`Eq-Diagr/Reactions.db`).

| Source record suffix | Imported formation relation | log K | Source citation |
|---|---|---:|---|
| `360928` | V²⁺ = V³⁺ + e⁻ | −5.83 | Bard, Parsons, Jordan (eds.), *Standard Potentials in Aqueous Solution*, Marcel Dekker/IUPAC, 1985 |
| `120483` | Eu²⁺ = Eu³⁺ + e⁻ | −6.10 | Same 1985 reference |
| `369711` | V(OH)²⁺ = V³⁺ − H⁺ + H2O | −2.26 | Baes and Mesmer, *The Hydrolysis of Cations*, Wiley, 1976 |
| `250448` | OH⁻ = −H⁺ + H2O | −14.0015 | CODATA, Cox/Wagman/Medvedev (1989); Shock/Helgeson (1988), erratum (1989) |

Full IDs have prefix `spana:2ac52a30213c9288:`. Full imported records and admitted source metadata are in `closed-redox-step4-sources.json`. References above are citations preserved by the imported records, not a claim of independently re-extracting the books.

Each relation is checked for exact integer charge and atom balance. Hydrolysis is equivalently V³⁺ + H2O ⇌ V(OH)²⁺ + H⁺; water dissociation is H2O ⇌ H⁺ + OH⁻. Ordinary reactions have no artificial electron term. Discrete charges and atom counts bind explicitly to source identities; formulas are not parsed to guess oxidation states.

Declared conditions: ideal normalized molal activities, 25 °C, 1 bar declared. Unavailable source pressure/activity-compatibility metadata remains unavailable. No activity/pressure correction or source constant was invented. For definitions, see IUPAC [pH](https://goldbook.iupac.org/terms/view/P04524), [autoprotolysis constant](https://goldbook.iupac.org/terms/view/A00532), and [Nernst equation](https://goldbook.iupac.org/terms/view/09068).

## 4. Proton/water convention and analytical preparation

Preparation A, per reference kg water: V³⁺ = 0.001, Eu²⁺ = 0.001, H⁺ = 0.001, Cl⁻ = 0.006 mol/kg; other admitted solutes initially zero. This describes reagent supply, not an initially equilibrated speciation. Initial charge is 0.003 + 0.002 + 0.001 − 0.006 = 0.

Water is explicitly `fixed-water-activity`, log a(H2O)=0. It is not assigned 55.5 mol/kg or any invented conserved water amount. The conserved solute quantities are V, Eu, Cl, charge and **H−2O**. This last invariant annihilates solvent water's composition and expresses acid/base supply relative to that solvent. Separate solute H and O totals are deliberately not constrained because reactions transfer H2O between the solvent and solute representations.

For this network the acid condition is:

h − [OH−] − [V(OH)²⁺] = A = 0.001.

This is a closed acid/base inventory with derived pH. It is not a fixed-pH reservoir. The reported water-to-solute transfer is stoichiometric bookkeeping per reference kg, not a solved finite solvent amount or a solvent-depletion model. Total H/O closure including solvent transfer is checked by ΔH_solute = 2 ΔO_solute. All other element inventories and physical charge remain closed.

## 5. Independent reduction and uniqueness

The independent script imports no production compiler or solver. Its results were saved before the production extension was executed.

Let both metal totals be T=0.001. Set x=[V²⁺]=[Eu³⁺], y=[V(OH)²⁺], h=[H⁺], Kh=10^(−2.26), Kw=10^(−14.0015).

Exact cancellation of the two one-electron reactions gives:

V³⁺ + Eu²⁺ ⇌ V²⁺ + Eu³⁺; log K = −5.83 − (−6.10) = 0.27.

The balances and laws reduce to:

- [Eu²⁺] = T−x; [V³⁺]+y = T−x.
- y = Kh[V³⁺]/h; [OH−] = Kw/h.
- x² / ([V³⁺](T−x)) = K.
- r(h)=sqrt(K/(1+Kh/h)); x=T r/(1+r).
- [V³⁺]=(T−x)/(1+Kh/h).
- F(h)=h−Kw/h−(T−x(h))Kh/(h+Kh)−A=0.

As h increases, x increases and both factors in the hydrolysed amount decrease. Therefore F is strictly increasing. F(A)<0 and F(A+T+Kw/A)>0. A unique positive physical root exists in that bracket. Independent scalar bisection determines it; no production-solver state generates the expected answer.

## 6. Expected and production equilibrium

| Solute | Independent amount, mol/kg |
|---|---:|
| V³⁺ | 0.000130471010570693 |
| V²⁺ | 0.000386171715406402 |
| V(OH)²⁺ | 0.000483357274022905 |
| Eu³⁺ | 0.000386171715406402 |
| Eu²⁺ | 0.000613828284593598 |
| H⁺ | 0.001483357280741126 |
| OH⁻ | 6.718220169026734e−12 |
| Cl⁻ | 0.006 |

Both half laws independently give pe:

pe_V=−5.83+log10([V³⁺]/[V²⁺]); pe_Eu=−6.10+log10([Eu³⁺]/[Eu²⁺]).

**pH = 2.8287542324063; pe = −6.30126643508076; Eh = −0.372778824489925 V vs SHE.** Production reproduces these values. V²⁺ is 38.61717% of total V; hydrolysed V(III) is 48.33573%, and free V³⁺ is 13.04710%. These follow from the coupled network, not from sequential speciation/redox calculations.

Numerical convention note: the first independent Eh conversion used Faraday's constant rounded to 96485.33212, giving −0.372778824502713 V. The 1.28e−11 V difference was traced to that rounding. Multiplying the exact SI elementary charge and Avogadro constant independently gives 96485.33212331001 C/mol and the existing application convention above. The original value and correction remain in the independent evidence. Composition, pH, pe, source log K values and production constants did not change; comparison tolerances were not loosened.

## 7. Simultaneous production integration and residuals

The compiler validates every source reaction's atoms/charge, separates true electron-bearing halves from ordinary reactions, transforms **all** reactions together, and exactly cancels electrons only within the redox subnetwork. Its conserved-inventory rank audit excludes the fixed-solvent degree of freedom. Water remains a required explicit basis identity.

Preparation assigns existing kh=1 signed totals to closed solute basis components and kh=2/log activity zero only to solvent water. Inspection separately checks all ordinary source laws, common half-reaction potentials, net electron-free reactions, physical inventories, charge, and solvent transfer. Water logs use its actual activity, never log of its suppressed concentration. New networks use `closed-redox-aqueous-closure-v2`; older electron-only scope retains its existing version.

Across eight preparation/basis/order combinations:

- Maximum absolute composition difference from independent expectations: 2.6020852139652106e−18 mol/kg.
- Maximum physical-inventory/charge residual: 4.260311183605066e−18.
- Maximum ordinary mass-action log residual: 4.440892098500626e−16.
- Maximum net-redox log residual and inter-couple pe disagreement: zero numerically.

Primary solvent transfer is 0.000483357280741126 mol H2O per reference kg. Its ΔH−2ΔO residual is −6.505213034913027e−19. Primary existing acceptance limits are about 1.28e−13 for H−2O and Eu, 1.48e−13 for V, 6.28e−13 for Cl and 1.29e−12 for physical charge. Exact per-run limits/residuals are retained in `closed-redox-step4-evidence.json`.

New comparison bounds: absolute amounts 1e−12 mol/kg **and** log amounts 1e−10 (so trace OH− is genuinely tested), pH/pe 1e−10, Eh 1e−11 V. These are test comparisons, not solver tolerances.

## 8. Fixed-pH and fixed-Eh cross-checks

Three separate exact controls use the same eight solutes, source reactions, temperature, ideal activities, analytical metal totals and chloride:

1. Fixed pH: replace only the closed proton coefficient total with the independently derived proton activity, retaining the internally electron-eliminated system.
2. Fixed Eh: use the raw source half-reactions with formal electron activity imposed at the independent Eh, retaining the signed acid inventory.
3. Fixed pH and Eh together at the independently derived coordinates.

All reproduce the independent composition within 2.6020852139652106e−18 mol/kg. They recover acid inventory 0.001 and zero physical charge to roundoff. No interpolation, changed counterion, fitted constant or additional reservoir was used to force agreement. These are generic point-API cross-checks, not new public multi-family UI routes.

Boundary conditions are equivalent **only at those matching values**. Raising pH by 0.2 changes the recovered acid inventory to 0.000373989546141468 and charge to −0.000626010453858536 mol/kg. Raising Eh by 0.02 V while retaining acid inventory produces charge +0.000344088972572926. Those externally controlled subsystem calculations are not neutral closed bulk preparations and are explicitly not claimed equivalent.

## 9. Preparation, basis and order invariance

Preparation B begins with half of each metal oxidation form, plus conversion of 0.0001 mol/kg V³⁺ and solvent water into V(OH)²⁺ and H⁺. Its solute H/O values differ by exactly the solvent-transfer convention, while V, Eu, Cl, H−2O and charge are identical. It has independent preparation provenance and converges to the same final state.

Tested metal bases are [V³⁺,Eu³⁺,V²⁺,Cl⁻] and [V²⁺,Eu²⁺,V³⁺,Cl⁻], each augmented by H⁺ and H2O. Both histories and both reaction orders give eight accepted combinations. Additional tests move water to the first basis position and reverse/scale source reactions. All agree. Formal e− never becomes a conserved material inventory.

## 10. Failure and scope gates

Regression tests reject missing/invalid solvent declarations, nonunit solvent activity, water totals, electron totals, imposed pH/Eh options in closed preparation, invalid H/O/charge metadata, omitted water basis, inconsistent reaction cycles, missing countercharge, and a network containing no redox reaction. Ordinary reactions are not given fake electrons. All invalid scientific inputs remain rejected; no solver acceptance test was relaxed.

## 11. Cancellation-sensitive initialization diagnosis

History B's straightforward signed binary64 projection leaves 1.3552527156068805e−20 in a mathematically zero component total. Previously the default logarithmic starting guess used that residual as if it were a free-species scale, causing an iteration-zero conditioning failure. The exact zero history used the normal fallback and succeeded. This was a preparation-arithmetic/initialization issue, not a different equilibrium or unsupported chemical basis.

The preparation now recognizes only a cancellation-sized target: nonzero |target| ≤ 128 machine epsilons times the absolute sum of its projection terms. It supplies a starting scale from that absolute sum. **The target is retained bit-for-bit; nothing is rounded to zero or discarded.** The point entry point validates the optional initial vector and requires all fixed activities to remain exactly fixed before forwarding it to the existing internal Newton routine. This threshold is a floating-point starting-guess decision, not a scientific materiality or convergence tolerance. Existing callers without a vector keep their previous behavior. Both the tiny retained target and invalid seed rejection are tested.

## 12. Preservation and validation

Only three production files change: `src/thermodynamics/closedRedoxNetwork.js`, `src/solver/closedRedox.js`, and the initial-vector validation/forwarding lines in `src/solver/point.js`. A 223-file source/public SHA256 comparison confirms the other 220 files unchanged. Thermodynamic data, constants, solver residual/Jacobian equations, tolerance definitions, Step-3 expected values and UI were not edited.

Focused tests: 37/37 pass. Production build and artifact audit pass. Lint has zero errors and one pre-existing ExpandedPlot warning. Full regression: **562/562 pass**, zero failures, cancellations, skips or todo (365.562 seconds), including all existing closed-redox, imposed-Eh, acid/base/speciation, Pourbaix, Fe/Cu reference and golden checks. Full evidence, independent derivation, source records, hashes and reproducible report script are retained locally.

## 13. Remaining limitations and Fe(II) + H2O2 readiness

The architectural blocker for simultaneously coupling aqueous proton/water, ordinary reaction laws and internally balanced redox is removed **within the explicit ideal fixed-solvent scope**. Finite solvent depletion, nonideal activity models, complete source discovery, all real hydrolysis/complexation networks, precipitation, gases and kinetic mechanisms are not validated by this benchmark.

**Recommendation: proceed to a bounded Fe(II) + H2O2 source/scope audit and independent benchmark next.** The required aqueous coupling machinery is now available, but Fe/H2O2 chemistry itself is not yet validated or automatically supported. That next phase must identify its actual source reactions, oxygen/proton/electron inventories, relevant complexes and any unavoidable phase/gas constraints. This result is not a claim to simulate Fenton kinetics, radical pathways or a chemically complete peroxide experiment. Fe/H2O2 and uranium were not implemented here.

No Wet Lab UI, deployment or push. Stop for review.
