# Closed redox Step 5 — automatic Fe(II)/peroxide discovery and addition benchmark

## Decision and scope

The bounded backend benchmark is supported by the imported reaction data and passes the independent calculation. Actual reagents discover 24 admitted source reactions, internally introduce the formal electron connection, and solve through the unchanged closed compiler and point solver. No selected e−, imposed pH/pe/Eh, electron inventory, special Fe oxidation algorithm, or source constant changes are used.

The accepted candidate is **1e−6 mol/kg total Fe supplied as Fe2+, 0.01 mol/kg supplied H+, 0.010002 mol/kg chloride, and 2.5e−7 mol/kg H2O2**, at ideal 25 °C, declared 1 bar and unit solvent-water activity. The addition domain is 0–1e−6 mol/kg H2O2 at the same Fe/counterion inventory. H+ is a supplied analytical reagent, not a fixed activity; pH is derived. This corresponds to an idealized FeCl2/acid preparation with explicit countercharge, not a finite-volume mixing recipe.

The initially investigated 1e−3 mol/kg Fe preparation was rejected: the aqueous result supersaturated excluded Fe solids. Its old probe files and explicitly named rejected-1mM artifacts are retained as rejected evidence, not accepted references. The independent calculation was repeated for the lower-total candidate before its production result was accepted.

The versioned metadata scope gates Fe, Cl and H−2O inventories. Its arithmetic allowance is 128 machine epsilons times the summed absolute inventory terms, solely for equivalent preparation arithmetic. It does not change solver or scientific acceptance tolerances. Source/component digests, complete reaction-set presence and static atom/charge identities are checked. Missing, additional or modified admitted source records invalidate this scope.

## Imported sources and exact admitted network

Every reaction below uses the imported formation convention: product = sum of the signed source components, with log activity(product) = logK + sum(coeff × log activity(component)). Negative coefficients therefore appear on the opposite chemical side. Electron/proton/water coefficients are shown explicitly. All records are aqueous in this scope. Imported thermal metadata is preserved, but this benchmark uses only the audited 298.15 K constants; source reference pressure is unspecified. Full original provenance, raw source tokens and thermodynamic metadata are retained in closed-redox-step5-sources.json.

| Source reaction ID | Imported formation relation | log K | Reference temperature | Imported provenance |
|---|---|---:|---|---|
| spana:2ac52a30213c9288:126513 | Fe 2+ = 1 Fe 3+ + 1 e- | 13.051 | 298.15 K | NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013 |
| spana:2ac52a30213c9288:126584 | Fe 3+ = 1 Fe 2+ + -1 e- | -13.051 | 298.15 K | NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013 |
| spana:2ac52a30213c9288:130813 | Fe(OH)2 = 1 Fe 2+ + -2 H+ + 2 H2O | -20.6 | 298.15 K | 1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135 |
| spana:2ac52a30213c9288:131002 | Fe(OH)2+ = 1 Fe 3+ + -2 H+ + 2 H2O | -4.8 | 298.15 K | NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013  1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135 |
| spana:2ac52a30213c9288:131099 | Fe(OH)3 = 1 Fe 3+ + -3 H+ + 3 H2O | -12 | 298.15 K | 1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135 |
| spana:2ac52a30213c9288:131406 | Fe(OH)3- = 1 Fe 2+ + -3 H+ + 3 H2O | -34.2 | 298.15 K | 1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135 |
| spana:2ac52a30213c9288:131496 | Fe(OH)4- = 1 Fe 3+ + -4 H+ + 4 H2O | -21.6 | 298.15 K | 1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135 |
| spana:2ac52a30213c9288:131586 | Fe(OH)4-2 = 1 Fe 2+ + -4 H+ + 4 H2O | -46 | 298.15 K | 1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135 |
| spana:2ac52a30213c9288:133463 | Fe2(OH)2+4 = 2 Fe 3+ + -2 H+ + 2 H2O | -2.82 | 298.15 K | NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013 |
| spana:2ac52a30213c9288:135482 | FeCl+ = 1 Fe 2+ + 1 Cl- | -0.3 | 298.15 K | SmithMart: NIST Standard Reference Database 46 Version 8. NIST Critically Selected Stability Constants of Metal Complexes Database http://www.nist.gov/srd/nist46.cfm National Institute of Standards and Technology, 100 Bureau Dr., Stop 2300, Gaithersburg, MD |
| spana:2ac52a30213c9288:135557 | FeCl+2 = 1 Fe 3+ + 1 Cl- | 1.52 | 298.15 K | NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013 |
| spana:2ac52a30213c9288:135630 | FeCl2+ = 1 Fe 3+ + 2 Cl- | 2.22 | 298.15 K | NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013  2006LEa: Liu W, Etschmann B, Brugger J, Spiccia L, Foran G, McInnes B; Chem. Geol. 231 (2006) 326-349 |
| spana:2ac52a30213c9288:135711 | FeCl3 = 1 Fe 3+ + 3 Cl- | 1.02 | 298.15 K | NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013  2006LEa: Liu W, Etschmann B, Brugger J, Spiccia L, Foran G, McInnes B; Chem. Geol. 231 (2006) 326-349 |
| spana:2ac52a30213c9288:135791 | FeCl4- = 1 Fe 3+ + 4 Cl- | -0.98 | 298.15 K | NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013  2006LEa: Liu W, Etschmann B, Brugger J, Spiccia L, Foran G, McInnes B; Chem. Geol. 231 (2006) 326-349 |
| spana:2ac52a30213c9288:138672 | FeO4-2 = 1 Fe 3+ + -8 H+ + -3 e- + 4 H2O | -112.6 | 298.15 K | 1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135 |
| spana:2ac52a30213c9288:138873 | FeOH 2+ = 1 Fe 3+ + -1 H+ + 1 H2O | -2.15 | 298.15 K | NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013  1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135 |
| spana:2ac52a30213c9288:138969 | FeOH+ = 1 Fe 2+ + -1 H+ + 1 H2O | -9.1 | 298.15 K | NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013  1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135 |
| spana:2ac52a30213c9288:151381 | H2 = 2 H+ + 2 e- | -3.083 | 298.15 K | 82NBS: Wagman D D, Evans W H, Parker V B, Schumm R H, Halow I, Bailey S M, Churney K L, Nuttall R L; The NBS tables of chemical thermodynamic properties: Selected values for inorganic and C1 and C2 organic substances in SI units. J. Phys. Chem. Ref. Data 11, Suppl. No.2, 1982  89Sho/Hel: Shock E L, Helgeson H C, Sverjensky D A; Geochim. Cosmochim. Acta 53 (1989) 2157-2183 |
| spana:2ac52a30213c9288:152743 | H2O2 = -2 H+ + -2 e- + 2 H2O | -59.61 | 298.15 K | 82NBS: Wagman D D, Evans W H, Parker V B, Schumm R H, Halow I, Bailey S M, Churney K L, Nuttall R L; The NBS tables of chemical thermodynamic properties: Selected values for inorganic and C1 and C2 organic substances in SI units. J. Phys. Chem. Ref. Data 11, Suppl. No.2, 1982  1962GC: Giguere P A, Carmichael J L; J.Chem.Eng.Data 7 (1962) 526-527 |
| spana:2ac52a30213c9288:159033 | HCl = 1 H+ + 1 Cl- | -0.7 | 298.15 K | 1997Tag: Tagirov B R, Zotov A V, Akinfiev N N; Geochim. Cosmochim. Acta, 61 (1997) 4267-4280 |
| spana:2ac52a30213c9288:175307 | HO2- = 1 H2O2 + -1 H+ | -11.65 | 298.15 K | SmithMart: NIST Standard Reference Database 46 Version 8. NIST Critically Selected Stability Constants of Metal Complexes Database http://www.nist.gov/srd/nist46.cfm National Institute of Standards and Technology, 100 Bureau Dr., Stop 2300, Gaithersburg, MD  88Sho/Hel: Shock E L, Helgeson H C; Geochim. Cosmochim. Acta 52 (1988) 2009-2036; and "ERRATA", ibid, 53 (1989) p.215 |
| spana:2ac52a30213c9288:249989 | O2 = -4 H+ + -4 e- + 2 H2O | -85.988 | 298.15 K | 89Sho/Hel: Shock E L, Helgeson H C, Sverjensky D A; Geochim. Cosmochim. Acta 53 (1989) 2157-2183 |
| spana:2ac52a30213c9288:250161 | O3 = -6 H+ + -6 e- + 3 H2O | -155.14 | 298.15 K | 82NBS: Wagman D D, Evans W H, Parker V B, Schumm R H, Halow I, Bailey S M, Churney K L, Nuttall R L; The NBS tables of chemical thermodynamic properties: Selected values for inorganic and C1 and C2 organic substances in SI units. J. Phys. Chem. Ref. Data 11, Suppl. No.2, 1982 |
| spana:2ac52a30213c9288:250448 | OH- = -1 H+ + 1 H2O | -14.0015 | 298.15 K | Codata: Cox J D, Wagman D D, Medvedev V A, CODATA Key Values for Thermodynamics. Hemisphere Publ. Co., New York, 1989  88Sho/Hel: Shock E L, Helgeson H C; Geochim. Cosmochim. Acta 52 (1988) 2009-2036; and "ERRATA", ibid, 53 (1989) p.215 |

Both inverse Fe source records are retained for cycle consistency; they are not two independent chemical processes. The 28 identities include formal electron and solvent water; there are 26 modeled physical aqueous carriers. Fe chloride/hydrolysis complexes, the Fe hydrolysis dimer, ferrate, HCl, OH−, HO2− and dissolved H2/O2/O3 are admitted. Fe oxidation allocations are explicit source-identity metadata (existing reviewed Fe assignments plus explicit chloride assignments), not inferred from names.

## Exclusions and phase audit

All solids and gas phases are excluded from the equilibrium model; nine compatible Fe solids and four gas source records are diagnosed using the accepted activities. Fe0.932O(cr) is a diagnostic source-law evaluation only, not a broadened canonical/closed compiler phase. Seven chloride redox records are explicitly excluded. Their source identities and reasons are retained in every preparation discovery report.

| Source ID | Carrier | Phase | Exclusion |
|---|---|---|---|
| spana:2ac52a30213c9288:82236 | Cl2 | aqueous | Conditional counterion-redox exclusion |
| spana:2ac52a30213c9288:82314 | Cl2(g) | gas | Phase not admitted |
| spana:2ac52a30213c9288:82394 | ClO- | aqueous | Conditional counterion-redox exclusion |
| spana:2ac52a30213c9288:82497 | ClO2(aq) | aqueous | Conditional counterion-redox exclusion |
| spana:2ac52a30213c9288:82605 | ClO2- | aqueous | Conditional counterion-redox exclusion |
| spana:2ac52a30213c9288:82715 | ClO3- | aqueous | Conditional counterion-redox exclusion |
| spana:2ac52a30213c9288:127500 | Fe(cr) | solid | Phase not admitted |
| spana:2ac52a30213c9288:130902 | Fe(OH)2(cr) | solid | Phase not admitted |
| spana:2ac52a30213c9288:131188 | Fe(OH)3(am) | solid | Phase not admitted |
| spana:2ac52a30213c9288:131294 | Fe(OH)3(s) | solid | Phase not admitted |
| spana:2ac52a30213c9288:132744 | Fe0.932O(cr) | solid | Phase not admitted |
| spana:2ac52a30213c9288:133739 | Fe2O3(cr) | solid | Phase not admitted |
| spana:2ac52a30213c9288:134486 | Fe3O4(cr) | solid | Phase not admitted |
| spana:2ac52a30213c9288:138772 | FeOCl(cr) | solid | Phase not admitted |
| spana:2ac52a30213c9288:139276 | FeOOH(cr) | solid | Phase not admitted |
| spana:2ac52a30213c9288:151531 | H2(g) | gas | Phase not admitted |
| spana:2ac52a30213c9288:159101 | HClO | aqueous | Conditional counterion-redox exclusion |
| spana:2ac52a30213c9288:159212 | HClO2 | aqueous | Conditional counterion-redox exclusion |
| spana:2ac52a30213c9288:250070 | O2(g) | gas | Phase not admitted |
| spana:2ac52a30213c9288:250265 | O3(g) | gas | Phase not admitted |

Across all 38 sampled states, maximum hypothetical pure-solid log saturation is **-0.512837644378812**; maximum individual hypothetical gas log fugacity is **-3.70405683012906** under the source unit-standard convention. No checked solid saturates. These gas diagnostics are not a headspace material balance and do not imply gas kinetics or measured partial pressures. Maximum excluded chlorine inventory evaluated at the restricted solution is **2.13610109772513e-15 mol/kg**, and its electron-capacity contribution is **3.64028752905515e-15 mol/kg**. Both are below the existing 2e−14 mol/kg absolute balance floor. This is a bounded perturbation diagnostic, not a complete chlorine-redox solution. Domain restrictions and conditional labeling remain necessary; neither zero excluded inventory nor general phase stability is claimed.

## Independent thermodynamic derivation

Imported relations:

- Fe2+ = Fe3+ + e−, logK = 13.051.
- H2O2 = −2H+ −2e− +2H2O, logK = −59.61.

Reverse the peroxide formation relation and twice the Fe reduction relation to obtain:

**2 Fe2+ + H2O2 + 2 H+ → 2 Fe3+ + 2 H2O**

**logK = 59.61 − 2×13.051 = 33.508**, with two electrons cancelling exactly.

The independently relevant oxygen redistribution is **2 H2O2 → O2(aq) + 2 H2O**, logK = 2×59.61 −85.988 = **33.232**. Accordingly excess supplied peroxide cannot be assumed to remain as peroxide.

Let F = 1e−6, C = 0.010002, A = 0.01 and D = supplied peroxide, all mol/kg. The independent equations are:

- sum Fe atoms × carrier molality = F;
- sum Cl atoms × carrier molality = C;
- sum charge × carrier molality = 0;
- sum (H atoms −2 O atoms) × carrier molality = A−2D;
- solvent a(H2O)=1; solvent exchange closes H and O with one shared water transfer.

Equivalently, electron capacity B = Q −(H−2O) −2Fe +Cl = 2D. Electron is not counted as a material species. The independent script uses raw formation laws: Fe2+/Fe3+ = 10^(13.051−pe), H2O2 = 10^(−59.61−2log aH+ +2pe). At trial H+, pe and Cl−, the Fe balance is a stable quadratic including the Fe dimer. Nested scalar bracketed balances solve chloride, electron capacity and charge. This calculation imports no production equilibrium solver, closed compiler or reaction-basis transformer. Saved expected values precede acceptance of the production controls.

## Expected versus production equilibrium

Amounts are mol/kg H2O; Fe states include all admitted component-weighted carriers, not just the free ions.

| Quantity at D=2.5e−7 | Independent | Production |
|---|---:|---:|
| Fe(II), all carriers | 4.99999999999999e-7 | 5.00000000000000e-7 |
| Fe(III), all carriers | 5.00000000000001e-7 | 4.99999999999995e-7 |
| Fe/peroxide source-basis extent | 2.50000000000000e-7 | 2.49999999999999e-7 |
| pH | 2.00087575782903 | 2.00087575782903 |
| pe | 12.7076768506225 | 12.7076768506225 |
| Eh, V vs SHE | 0.751777898487190 | 0.751777898487189 |
| Free H+ | 0.00997985524861955 | 0.00997985524861961 |
| Residual H2O2 | 6.41364941808217e-31 | 6.41364941808201e-31 |

Total Fe = 9.99999999999995e-7; final Fe(II) = 5.00000000000000e-7; Fe(III) = 4.99999999999995e-7; Fe(VI) = 7.64744096164840e-66. No inventory was rounded to complete conversion. The full independent/production carrier comparison is in the evidence JSON; maximum log10-molality discrepancy over the three control doses is 4.79616346638068e-12.

| Carrier | Accepted molality at benchmark |
|---|---:|
| Fe 2+ | 4.97510977456860e-7 |
| H2O2 | 6.41364941808201e-31 |
| H+ | 0.00997985524861961 |
| Cl- | 0.00998203878330996 |
| Fe 3+ | 2.25672956426102e-7 |
| Fe(OH)2 | 1.25474127211744e-23 |
| Fe(OH)2+ | 3.59112923153415e-8 |
| Fe(OH)3 | 2.27042307445028e-13 |
| Fe(OH)3- | 3.15812954994795e-35 |
| Fe(OH)4- | 5.71455674698967e-21 |
| Fe(OH)4-2 | 5.01540142610301e-45 |
| Fe2(OH)2+4 | 7.73945808369952e-13 |
| FeCl+ | 2.48898294466824e-9 |
| FeCl+2 | 7.45931197565540e-8 |
| FeCl2+ | 3.73179711154732e-9 |
| FeCl3 | 2.35037563894537e-12 |
| FeCl4- | 2.34615407832994e-16 |
| FeO4-2 | 7.64744096164840e-66 |
| FeOH 2+ | 1.60086708846266e-7 |
| FeOH+ | 3.95984717848409e-14 |
| H2 | 3.16151162519835e-33 |
| HCl | 0.0000198766639410505 |
| HO2- | 1.43873554975788e-40 |
| O2 | 7.01795265151672e-28 |
| O3 | 1.29215808920370e-67 |
| OH- | 9.98563661805223e-13 |

## Generated reaction explanation and extent

The production result exposes reactants/products, integer coefficients, logK, source IDs/multipliers, half-reaction oxidation/reduction direction and citations, electron count, signed extent and units. It is generated from the existing compiler cancellation algebra, not by inspecting final concentrations to invent an equation.

Independently, its extent is D minus residual H2O2 minus HO2− (the sole admitted ordinary peroxide-family deprotonation product). This follows from the peroxide material coordinate of the source basis. The Fe/peroxide net basis reaction above has extent **2.49999999999999e-7 mol/kg** at the benchmark. Fe(II) is oxidized to Fe(III); peroxide oxygen is reduced toward solvent water in that source combination. All ordinary-reaction and redox basis extents together reconstruct every accepted solute change and solvent transfer within the existing inventory limits. Floating-point signed trace extents are retained rather than interpreted as kinetic turnover.

These are **algebraic source-reaction-basis extents**, not unique physical pathways or rates. At excess oxidant the Fe/peroxide basis extent exceeds half the total Fe because a negative Fe/O2 coupled-reaction extent cancels the additional formal Fe turnover. The combined redistribution gives oxygen production without claiming a catalytic mechanism. No Fenton kinetics, radical intermediates, induction times or reaction rates are modeled.

## Invariance, laws and equivalent controls

Both supported bases (FeII/peroxide/H/Cl/water and FeIII/peroxide/H/Cl/water), both equivalent preparation histories and both source orders pass. The alternative history converts a partial source-balanced amount before preparation and conserves Fe, Cl, charge and H−2O. All combinations return the same final composition; the eight-way combinations are regression tested.

At D=2.5e−7, 5e−7 and 1e−6, a separate generic source-basis transformation prepares **FeIII/H+/e−/Cl−/H2O**, fixes H+ and e− to the closed result's derived values, and keeps the same Fe/Cl analytical totals and water convention. The ordinary point solver reproduces every carrier. Maximum controlled-vs-closed log10-molality discrepancy: 2.84217094304040e-14. This is conditional endpoint equivalence; the controlled problem replaces proton/electron balance with reservoirs and is never labeled closed redox. No analytical Fe/counterion total was altered to obtain agreement; matching composition also reproduces the closed charge/proton-water invariants.

Every accepted sample passes existing physical inventory, common-potential, ordinary mass-action, net-reaction and water-transfer checks. Across the sampled sweep, maximum absolute physical inventory residual is 8.67361737988404e-18 mol/kg. Maximum ordinary log-law residual is 1.06581410364015e-14. The unchanged mass-action tolerance is 1e−10; individual physical balance limits propagate the existing component tolerances plus roundoff and are preserved with each sample. At the benchmark the Fe limit is 4.842170943040401e−14, H−2O limit 1.068421709430404e−12 and charge limit 2.068621709430404e−12 mol/kg. None were enlarged.

## General addition-sweep integration — B, small extension

The existing analytical-total axis provides range/coordinate validation. Its ordinary sweep runner cannot itself reconstruct closed reagent conservation/preparation at every coordinate. The new reusable closed-reagent runner therefore uses those same axis rules but independently rediscovers/prepares/solves each dose through the unchanged closed solver. It has no Fe-specific titration mathematics, imposed potential, continuation seed or interpolated failures.

Broad sweep: **21/21 accepted**, D=0..1e−6. Local sweep: **17/17 accepted**, D=4.999e−7..5.001e−7. The nominal requirement **5e−7** is derived as total Fe × peroxide coefficient / FeII coefficient from the generated net reaction; it is not a switch in the solver.

| Added H2O2 | Final FeII | Final FeIII | Residual H2O2 | Dissolved O2 | Derived pH | Derived Eh / V |
|---:|---:|---:|---:|---:|---:|---:|
| 2.50000000000000e-7 | 5.00000000000000e-7 | 4.99999999999995e-7 | 6.41364941808201e-31 | 7.01795265151672e-28 | 2.00087575782903 | 0.751777898487189 |
| 5.00000000000000e-7 | 7.75588728710458e-11 | 9.99922441127127e-7 | 1.06607006555339e-22 | 1.93897182179101e-11 | 2.00088739205216 | 0.994942267332538 |
| 0.00000100000000000000 | 7.27895601824366e-12 | 9.99992721043983e-7 | 1.21051892900105e-20 | 2.50001819738999e-7 | 2.00088739368770 | 1.05573399600762 |

The oxidant-limited benchmark is nearly 50/50 FeII/FeIII. At nominal equivalence a finite FeII remainder and dissolved oxygen coexist. In the excess region the extra oxygen inventory goes primarily into dissolved O2; no textbook completion rule is imposed. Each sample retains exact system/input/result identities, source scope and request identity, carrier molalities, component-weighted Fe state inventory, derived pH/pe/Eh and acceptedSolids=[]. Fe state fractions can be read as state inventory / conserved Fe. The data contract is ready for later inspection/Beaker adapters; **no public plot/Beaker or Wet Lab interface is added** in this phase. The selected-sample accessor returns the exact accepted object and rejects stale revision/scope, failed samples, incomplete sweeps and forged results. Out-of-domain additions stay explicit gaps; invalid negative doses/reversed ranges are rejected.

## Preservation, verification and readiness

223/223 pre-existing source/public files match their before-phase SHA256 values. Added production files only: closedReagents.js (discovery/result contract), scopes/fePeroxide.js (versioned bounded source metadata), and closedReagentSweep.js (independent addition runner). No existing solver/compiler, UI, thermodynamic data, Fe/Cu references, fractions/solubility mathematics or source constants changed. No research .local dependency was introduced. Scripts and tests use the normal imported public data artifact.

Full regression: **575/575 pass**, zero failures/cancellations/skips/todo (427.533 seconds). Focused Step-5 tests: **13/13 pass**, including the final missing-source scope gate. All previous closed-redox benchmarks, Fe/Cu exact references, imposed-Eh/Pourbaix behavior and five official goldens remain intact. Production build and artifact audit pass. Lint: zero errors, one pre-existing ExpandedPlot hooks warning. The existing bundle-size advisory remains. Node tests used --experimental-test-isolation=none because this sandbox rejects the child-process spawn used by default test isolation; no tests were skipped. Detailed logs are retained beside this report.

Ready for a **restricted internal Mix-two-beakers prototype using the reviewed preparation contract**, not a general experimental simulation or a publicly validated mixing tool. Before a real mixing UI, define solvent-mass/volume dilution and reagent recipes/counterions, scope/phase/gas warnings, failure presentation and adapters to existing plots/Beaker. General concentrations, precipitates, finite headspace, nonideal activities, finite-water depletion, kinetics and radicals remain outside this benchmark. Independent evidence here is a separate mathematical implementation using the same imported source constants; it is not a new external experimental or HALTAFALL validation campaign.

No deployment or push. Stop for review.
