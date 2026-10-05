# Mn–H–O species audit and internal pH–Eh grid — completion report

## Outcome

Completed a restricted internal validation grid using the existing fixed-electron policy and multi-solid solver. The public Pourbaix control remains disabled. This is a sampled equilibrium/assemblage diagnostic within the audited bundled database domain, not a complete real-water Pourbaix diagram.

The 229-test working-tree baseline was preserved; final suite: **236/236 passing**, with seven new focused tests. The five unchanged golden benchmarks pass. Build, lint and production audit pass. Lint retains the existing ExpandedPlot.jsx line 21 warning (zero errors); build retains the existing large-chunk advisory. No deployment.

## Candidate audit and explicit basis conversion

Searched all 4,445 bundled species by Mn in product names, discovery associations and source component names: 83 records identified. All 83 are individually accounted for in the appendix and numerical evidence. Nineteen products are included: 12 aqueous and seven solids. Sixty-three records require additional chemical components outside the specified Mn–H–O system. The remaining reverse Mn2+ record is redundant with the chosen basis and is excluded to avoid treating a basis identity as another species.

The Mn2+/Mn3+ forward/reverse log constants are -25.42 and +25.42 and close exactly. Four relevant Mn(III) hydrolysis/oxide records require Mn3+ as a source component. Their explicit offline conversion uses:

Mn3+ = Mn2+ - e-, logBeta = -25.42.

For a source coefficient q of Mn3+, add q times that formation row and q times -25.42 to the stored log constant. Both originals, q and the operation remain in each compiled sourceRecord. The source database itself is unchanged. This is a deliberately bounded, independently tested reaction addition in the offline harness, not a new general basis-transformation engine in the app. No free thermodynamic parameter is introduced.

Each included product is checked against independently transcribed Mn/H/O atom counts and its stored charge. For the converted basis (Mn2+,H+,e-,H2O), atom counts are (nu_Mn, nu_H+2nu_water, nu_water), and charge is 2nu_Mn+nu_H-nu_e. Source discovery-element links are not mistaken for atom counts. Hydroxide dimers carry TWO Mn atoms; Mn3O4 carries THREE and Mn2O3 carries TWO.

All seven compatible solid records are retained, including a-MnOOH and MnO even though they never become the accepted positive phase on this grid. Exclusions were not chosen to make a familiar diagram. Amorphous/crystalline names are retained exactly; stability means only competition among included stored candidates. Missing literature phases, thermodynamic uncertainty and the database's original quality flags remain limitations. Numerical consistency validation does not independently establish the experimental accuracy of these constants.

Mn-free reservoir species (e.g. OH-) do not alter the Mn balance or the selected phase equations with fixed H/e/water activities and ideal activities. Their omission is not a claim about electroneutrality, water stability or total solution composition. No additional charge equation or spectator ions are introduced.

### Included reaction table

Coefficients are in order Mn2+, H+, e-, H2O. Derived constants retain ordinary binary floating-point evaluation; source decimal values remain listed separately.

| Product | Phase | Stored logK | Compiled logBeta | Coefficients | MnIII conversion factor |
|---|---|---:|---:|---|---:|
| a-MnOOH(s) | solid | 0.07 | -25.35 | 1, -3, -1, 2 | 1 |
| Mn 3+ | aqueous | -25.42 | -25.42 | 1, 0, -1, 0 | 0 |
| Mn(cr) | solid | -39.96 | -39.96 | 1, 0, 2, 0 | 0 |
| Mn(OH)2 | aqueous | -22.2 | -22.2 | 1, -2, 0, 2 | 0 |
| Mn(OH)2(am) | solid | -15.2 | -15.2 | 1, -2, 0, 2 | 0 |
| Mn(OH)2+ | aqueous | 0.84 | -24.580000000000002 | 1, -2, -1, 2 | 1 |
| Mn(OH)3- | aqueous | -34.8 | -34.8 | 1, -3, 0, 3 | 0 |
| Mn(OH)4-2 | aqueous | -48.3 | -48.3 | 1, -4, 0, 4 | 0 |
| Mn2(OH)3+ | aqueous | -23.9 | -23.9 | 2, -3, 0, 3 | 0 |
| Mn2O3(cr) | solid | 0.65 | -50.190000000000005 | 2, -6, -2, 3 | 2 |
| Mn2OH+3 | aqueous | -10.56 | -10.56 | 2, -1, 0, 1 | 0 |
| Mn3O4(s) | solid | -61.26 | -61.26 | 3, -8, -2, 4 | 0 |
| MnO(cr) | solid | -17.93 | -17.93 | 1, -2, 0, 1 | 0 |
| MnO2(s) | solid | -41.56 | -41.56 | 1, -4, -2, 2 | 0 |
| MnO4 2- | aqueous | -118.4 | -118.4 | 1, -8, -4, 4 | 0 |
| MnO4- | aqueous | -122.5 | -122.5 | 1, -8, -5, 4 | 0 |
| MnO4-3 | aqueous | -113.8 | -113.8 | 1, -8, -3, 4 | 0 |
| MnOH+ | aqueous | -10.59 | -10.59 | 1, -1, 0, 1 | 0 |
| MnOH+2 | aqueous | 1.24 | -24.180000000000003 | 1, -1, -1, 1 | 1 |

## Independent equilibrium validation

At fixed pH/pe, let a be free Mn2+ molality/activity under the existing ideal convention. Source-coordinate evaluation first calculates log(a_Mn3+)=log(a)-25.42+pe, then evaluates ORIGINAL source reactions; it does not evaluate the compiled solver rows. All aqueous Mn products in this selected set are monomers or dimers, so the analytical Mn balance is T=A*a+B*a^2. A includes the free ion and monomer factors; B contains twice every dimer factor. The positive root is evaluated as 2T/(A+sqrt(A^2+4BT)).

For each pure solid, evaluate its source formation factor K_eff at a=1. Its saturation bound is log(a) <= -log10(K_eff)/nu_Mn. The smallest bound caps the aqueous-only root. If capped, the remaining Mn inventory determines the positive solid amount divided by its Mn coefficient. At equal limiting bounds, inventories may be underdetermined: the analytical scalar cap is not a license to assign unique solid amounts.

Every accepted grid point was compared with this independently derived quadratic/cap solution. Tests also reconstruct balances, aqueous mass action and every solid saturation directly from the output. Reversed candidate order was checked for a representative of every accepted assemblage and the coexistence failure.

Maximum observed errors/residuals over 166 accepted samples:
- free-Mn log10 analytical difference: 2.1316282072803006e-14;
- absolute Mn balance residual: 3.924811864397526e-17 mol/kg;
- reported aqueous mass-action log residual: 0;
- active-solid log-saturation residual: 7.105427357601002e-15.

Analytical log comparisons use the existing 1e-8 log-activity comparison scale; solid amount comparisons use existing 4e-14 absolute plus 2e-10 relative comparison scales. No production acceptance tolerances were changed. Exact coefficient/charge checks use exact integer equality.

### Coexistence probe

At pH 9, pe 5.025 (Eh derived by the existing SHE conversion), Mn3O4 and Mn2O3 have equal limiting free-Mn log activity (-6.93). Both phase inventories satisfy the original point acceptance checks individually. The existing solver correctly returns ambiguous-solid-assemblage with two accepted alternatives in its attempts trace. No arbitrary split or replacement result is produced. This probe is separate from the regular grid; its complete trace is in the evidence file.

## Internal grid and classification

Grid: 15 pH samples from 0 to 14 by 1, and 13 Eh samples from -1.5 to +1.5 V vs SHE by nominal 0.25 V. Total Mn is explicitly 0.001 mol/kg-H2O, 25 C, declared 1 bar, ideal activities, fixed water activity 1. These are broad finite stress-test ranges chosen to sample reduced metal, hydroxide/oxide competition and oxidized aqueous states; they are not asserted water-stability bounds. Exact coordinates from the existing Cartesian sampler are retained (including normal binary representations of nominal steps).

Results: **195 requested; 166 accepted; 29 failed; 0 not-run; 0 ambiguous on the regular grid**. The separate coexistence probe is ambiguous. Accepted assemblages:

| Assemblage | Samples |
|---|---:|
| Mn(cr) | 13 |
| Mn(OH)2(am) | 20 |
| aqueous only | 103 |
| Mn3O4(s) | 8 |
| Mn2O3(cr) | 5 |
| MnO2(s) | 17 |

The diagnostic SVG colors discrete dots by accepted positive solid assemblage, with a neutral color for aqueous-only states. It does NOT color an exclusive species region or interpolate a boundary. Every accepted sample retains all 13 aqueous Mn contributions (free basis species plus 12 products), seven solid amounts/saturation states, dissolved total and mixed aqueous/solid status in JSON. A separate inventory-leader field reports the exact numerical maximum of stoichiometric contributions; this is explicitly not a global thermodynamic stability label. Exact maximum ties are retained as an array, with no new classification tolerance. Near-equal contributions are not discarded: the complete numerical distribution is always retained. True solid coexistence/ambiguity is governed by the existing solver, not that display field.

Stale, unsupported, not-run, failed and ambiguous classifications have null inventories/leaders rather than a success label. Tests exercise these branches and cancellation. Regular failed samples are red crosses and never filled from the analytical comparison; no line connects across them. The application UI, existing 1D/2D plots and 3D remain unchanged.

### Remaining numerical failures

All 29 regular failures report no-consistent-solid-assemblage. Their failed candidate attempts include 203 singular-or-ill-conditioned and 19 numerical-nonconvergence codes (attempt counts, not point counts). Some attempts instead converge but fail saturation checks. The label means no state passed the current algorithm, not proof that physical equilibrium is absent. For example pH 14/pe 0 has an independently determined Mn3O4 saturation cap but the unchanged solver fails its candidate linear systems. The analytical answer was NOT substituted into the grid. These failures are the next concrete engineering limitation; no tolerance relaxation or solver redesign was undertaken.

## Trace/export and preservation

The exact JSON file contains the full 83-record audit/provenance, compiled system with both source records for every conversion, grid definition and exact coordinates, per-point input controls, original full result/attempts, classifications, independent comparisons for accepted points and separate coexistence trace. pH, pe, Eh/V/SHE, T, log H and log e activity are explicit. Linear H/e activities are also available in the solver result's freeComponentActivities; suppressed free electron concentration remains bookkeeping and is not conserved. Existing mass balances, saturation diagnostics and immutable failure results are preserved. JSON numbers round-trip exactly in tests, apart from the standard JSON normalization of signed zero to zero; no decimal rounding of exported values is introduced.

Only the grid method metadata needed a production correction: it now uses methodForSystem(system), so a multi-solid grid no longer claims the single-solid method while its points report the bounded multi-solid method. Numerical grid execution is unchanged.

Five-golden fixture SHA256: aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960.
Bundled database SHA256: 9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245.
Both were checked unchanged. All earlier tests pass, including fraction/solubility and golden checks. Solver equations, constants, tolerances, pressure/activity assumptions and public exports were not changed.

## Water stability and public-feature limitation

No water lines are drawn. The previous algebraic 25 C H2/O2 source relationships do not establish supported gas fugacity/equilibrium. The conversion Eh=ln(10)RT/F*pe is reused but cannot supply temperature-dependent equilibrium constants. No water-stability domain or non-25-C equilibrium validity is claimed. The scanned catalog is accounted for within the declared component domain, but is not guaranteed complete relative to nature or other databases. Public Pourbaix remains disabled.

## Verification, reproducibility and exact files changed

- Seven focused new tests pass; final full suite 236/236, preserving all 229 prior tests and five golden cases.
- Build passed. Lint passed with the existing hook warning only. Production audit passed after the completed build.
- Regenerate evidence and SVG with node scripts/validate-mn-grid.js.
- Browser-inspected the SVG; saved an unmodified browser screenshot as docs/mn-validation-map.png. This is an internal scientific diagnostic artifact, not a UI redesign.

Modified: src/calculations/grid.js (method metadata only).
Added:
- scripts/validation/mnAudit.js
- scripts/validate-mn-grid.js
- tests/mnAudit.test.js
- docs/mn-grid-validation.json
- docs/mn-validation-map.svg
- docs/mn-validation-map.png
- docs/mn-grid-report.md (this report)

Required build regenerated dist output; no deployment. Previous redox phase files/evidence and all earlier work were preserved.

## Smallest recommended next phase

Investigate a small representative set of the 29 numerical failures against this independent quadratic/cap oracle, starting with pH14/pe0. Identify the conditioning/initialization cause and propose a bounded fix with unchanged scientific checks before public feature work. Separately, any later promotion of the offline MnIII reaction addition into production needs a reusable provenance-preserving basis-transformation contract. This phase stops here for review; neither task has been started.

## Appendix: every audited record and exclusion reason

Included rows use exactly the coefficients above; out-of-domain rows list the extra source components that prevent membership in the declared Mn–H–O-only system. Each ID links to its complete original reaction, charge, constant and provenance inside the JSON evidence. All exclusion reasons are chemical-domain/basis reasons, not curve-shape choices.

| Product | Source ID | Stored logK | Disposition | Extra components |
|---|---|---:|---|---|
| a-MnOOH(s) | spana:2ac52a30213c9288:11394 | 0.07 | included |  |
| g-MnS(s) | spana:2ac52a30213c9288:140704 | 0.02 | outside-Mn-H-O-components | HS- |
| Mn 2+ | spana:2ac52a30213c9288:207128 | 25.42 | basis-identity-reverse-reaction |  |
| Mn 3+ | spana:2ac52a30213c9288:207202 | -25.42 | included |  |
| Mn(CH3COO)+ | spana:2ac52a30213c9288:207276 | 1.4 | outside-Mn-H-O-components | CH3COO- |
| Mn(cit)- | spana:2ac52a30213c9288:207361 | 5.04 | outside-Mn-H-O-components | cit 3- |
| Mn(CN)2 | spana:2ac52a30213c9288:207442 | 4.22 | outside-Mn-H-O-components | CN- |
| Mn(cr) | spana:2ac52a30213c9288:207519 | -39.96 | included |  |
| Mn(EDTA) 2- | spana:2ac52a30213c9288:207594 | 15.61 | outside-Mn-H-O-components | EDTA 4- |
| Mn(EDTA)- | spana:2ac52a30213c9288:207679 | 27.8 | outside-Mn-H-O-components | EDTA 4- |
| Mn(gly)+ | spana:2ac52a30213c9288:207762 | 3.19 | outside-Mn-H-O-components | gly- |
| Mn(gly)2 | spana:2ac52a30213c9288:207841 | 5.4 | outside-Mn-H-O-components | gly- |
| Mn(H2cit)+ | spana:2ac52a30213c9288:207920 | 13.61 | outside-Mn-H-O-components | cit 3- |
| Mn(H2P2O7)(H3P2O7) | spana:2ac52a30213c9288:208015 | 46.1 | outside-Mn-H-O-components | P2O7 4- |
| Mn(H2P2O7)2- | spana:2ac52a30213c9288:208119 | 45.3 | outside-Mn-H-O-components | P2O7 4- |
| Mn(H2PO4)2+ | spana:2ac52a30213c9288:208217 | 47.04 | outside-Mn-H-O-components | PO4 3- |
| Mn(Hcit) | spana:2ac52a30213c9288:208313 | 9.5 | outside-Mn-H-O-components | cit 3- |
| Mn(HEDTA)- | spana:2ac52a30213c9288:208406 | 19.11 | outside-Mn-H-O-components | EDTA 4- |
| Mn(N3)2 | spana:2ac52a30213c9288:208502 | 1.46 | outside-Mn-H-O-components | N3- |
| Mn(N3)2+ | spana:2ac52a30213c9288:208579 | 10.37 | outside-Mn-H-O-components | N3- |
| Mn(N3)3 | spana:2ac52a30213c9288:208657 | 13.02 | outside-Mn-H-O-components | N3- |
| Mn(NH3)2+2 | spana:2ac52a30213c9288:208734 | 1.25 | outside-Mn-H-O-components | NH3 |
| Mn(NH3)3+2 | spana:2ac52a30213c9288:208814 | 1.38 | outside-Mn-H-O-components | NH3 |
| Mn(NH3)4+2 | spana:2ac52a30213c9288:208894 | 1.24 | outside-Mn-H-O-components | NH3 |
| Mn(NO3)2 | spana:2ac52a30213c9288:208974 | 0.6 | outside-Mn-H-O-components | NO3- |
| Mn(NTA)2 4- | spana:2ac52a30213c9288:209053 | 11.07 | outside-Mn-H-O-components | NTA 3- |
| Mn(OH)2 | spana:2ac52a30213c9288:209137 | -22.2 | included |  |
| Mn(OH)2(am) | spana:2ac52a30213c9288:209226 | -15.2 | included |  |
| Mn(OH)2+ | spana:2ac52a30213c9288:209319 | 0.84 | included |  |
| Mn(OH)3- | spana:2ac52a30213c9288:209409 | -34.8 | included |  |
| Mn(OH)4-2 | spana:2ac52a30213c9288:209499 | -48.3 | included |  |
| Mn(ox) | spana:2ac52a30213c9288:209590 | 3.95 | outside-Mn-H-O-components | ox 2- |
| Mn(ox)+ | spana:2ac52a30213c9288:209668 | 12.09 | outside-Mn-H-O-components | ox 2- |
| Mn(ox)2 2- | spana:2ac52a30213c9288:209747 | 5.25 | outside-Mn-H-O-components | ox 2- |
| Mn(ox)2- | spana:2ac52a30213c9288:209829 | 19.24 | outside-Mn-H-O-components | ox 2- |
| Mn(ox)3 3- | spana:2ac52a30213c9288:209909 | 21.12 | outside-Mn-H-O-components | ox 2- |
| Mn2(cit)2(OH)2 4- | spana:2ac52a30213c9288:209991 | -5.47 | outside-Mn-H-O-components | cit 3- |
| Mn2(OH)3+ | spana:2ac52a30213c9288:210106 | -23.9 | included |  |
| Mn2O3(cr) | spana:2ac52a30213c9288:210197 | 0.65 | included |  |
| Mn2OH+3 | spana:2ac52a30213c9288:210288 | -10.56 | included |  |
| Mn3(PO4)2(cr) | spana:2ac52a30213c9288:210377 | 28.86 | outside-Mn-H-O-components | PO4 3- |
| Mn3O4(s) | spana:2ac52a30213c9288:210463 | -61.26 | included |  |
| MnBr+ | spana:2ac52a30213c9288:210576 | 0.2 | outside-Mn-H-O-components | Br- |
| MnCl+ | spana:2ac52a30213c9288:210651 | 0 | outside-Mn-H-O-components | Cl- |
| MnCl+2 | spana:2ac52a30213c9288:210726 | 1.6 | outside-Mn-H-O-components | Cl- |
| MnClO3+ | spana:2ac52a30213c9288:210802 | 0.4 | outside-Mn-H-O-components | ClO3- |
| MnCN+ | spana:2ac52a30213c9288:210881 | 2.54 | outside-Mn-H-O-components | CN- |
| MnCO3 | spana:2ac52a30213c9288:210956 | 4.7 | outside-Mn-H-O-components | CO3 2- |
| MnCO3(cr) | spana:2ac52a30213c9288:211034 | 11 | outside-Mn-H-O-components | CO3 2- |
| MnF+ | spana:2ac52a30213c9288:211139 | 1.5 | outside-Mn-H-O-components | F- |
| MnF+2 | spana:2ac52a30213c9288:211212 | 6.2 | outside-Mn-H-O-components | F- |
| MnF2+ | spana:2ac52a30213c9288:211286 | 11.8 | outside-Mn-H-O-components | F- |
| MnF3 | spana:2ac52a30213c9288:211360 | 15.6 | outside-Mn-H-O-components | F- |
| MnH2P2O7+ | spana:2ac52a30213c9288:211433 | 25.1 | outside-Mn-H-O-components | P2O7 4- |
| MnH2PO4+2 | spana:2ac52a30213c9288:211528 | 23.67 | outside-Mn-H-O-components | PO4 3- |
| MnHCO3+ | spana:2ac52a30213c9288:211622 | 11.629 | outside-Mn-H-O-components | CO3 2- |
| MnHP2O7 | spana:2ac52a30213c9288:211714 | 23.9 | outside-Mn-H-O-components | P2O7 4- |
| MnHP3O10-2 | spana:2ac52a30213c9288:211807 | 16.05 | outside-Mn-H-O-components | P3O10 5- |
| MnHPO4 | spana:2ac52a30213c9288:211904 | 15.89 | outside-Mn-H-O-components | PO4 3- |
| MnHPO4+ | spana:2ac52a30213c9288:211995 | 23.84 | outside-Mn-H-O-components | PO4 3- |
| MnN3+ | spana:2ac52a30213c9288:212087 | 1.26 | outside-Mn-H-O-components | N3- |
| MnN3+2 | spana:2ac52a30213c9288:212162 | 6.11 | outside-Mn-H-O-components | N3- |
| MnNH3+2 | spana:2ac52a30213c9288:212238 | 0.84 | outside-Mn-H-O-components | NH3 |
| MnNO2+ | spana:2ac52a30213c9288:212315 | 1.1 | outside-Mn-H-O-components | NO2- |
| MnNO3+ | spana:2ac52a30213c9288:212392 | 0.2 | outside-Mn-H-O-components | NO3- |
| MnNTA | spana:2ac52a30213c9288:212469 | 23.44 | outside-Mn-H-O-components | NTA 3- |
| MnNTA- | spana:2ac52a30213c9288:212547 | 8.573 | outside-Mn-H-O-components | NTA 3- |
| MnO(cr) | spana:2ac52a30213c9288:212626 | -17.93 | included |  |
| MnO2(s) | spana:2ac52a30213c9288:212715 | -41.56 | included |  |
| MnO4 2- | spana:2ac52a30213c9288:212826 | -118.4 | included |  |
| MnO4- | spana:2ac52a30213c9288:212927 | -122.5 | included |  |
| MnO4-3 | spana:2ac52a30213c9288:213026 | -113.8 | included |  |
| MnOH+ | spana:2ac52a30213c9288:213126 | -10.59 | included |  |
| MnOH+2 | spana:2ac52a30213c9288:213213 | 1.24 | included |  |
| MnP3O10-3 | spana:2ac52a30213c9288:213301 | 10.23 | outside-Mn-H-O-components | P3O10 5- |
| MnP3O9- | spana:2ac52a30213c9288:213385 | 3.57 | outside-Mn-H-O-components | P3O9 3- |
| MnP4O12-2 | spana:2ac52a30213c9288:213466 | 5.74 | outside-Mn-H-O-components | P4O12 4- |
| MnSCN+ | spana:2ac52a30213c9288:213550 | 1.23 | outside-Mn-H-O-components | SCN- |
| MnSeO3·2H2O(cr) | spana:2ac52a30213c9288:213627 | 7.6 | outside-Mn-H-O-components | SeO3 2- |
| MnSeO4 | spana:2ac52a30213c9288:213714 | 2.43 | outside-Mn-H-O-components | SeO4 2- |
| MnSeO4·5H2O(s) | spana:2ac52a30213c9288:213801 | 2.05 | outside-Mn-H-O-components | SeO4 2- |
| MnSO4 | spana:2ac52a30213c9288:213903 | 1.9 | outside-Mn-H-O-components | SO4 2- |
| p-MnS(s) | spana:2ac52a30213c9288:251157 | -2.98 | outside-Mn-H-O-components | HS- |
