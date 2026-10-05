# Redox capability audit and validated foundation — completion report

## Outcome and review boundary

Implemented an internal, explicit `fixed-electron-v1` point foundation. All 229 tests pass: the 221-test baseline plus eight focused tests. No public Pourbaix feature, classified grid, water lines, UI changes or deployment. Stopping at the point foundation is deliberate: the selected Mn set validates equations and phase selection, but is not a complete thermodynamic Mn diagram model.

## 1. Architecture discovered

The direct component basis uses signed formation coefficients. Aqueous species obey log10(a_i)=logBeta_i+sum(nu_ij log10(a_j)). Proton is a special component with a free aqueous concentration; electron and water free concentrations are suppressed. Electron log activity nevertheless enters formation equations. Legacy componentTotals for electron are signed reaction bookkeeping, not physical electron molality. The new trace states this explicitly.

Fixed kh=2 components have no conservation equation and are not Newton unknowns. Thus H+ and e- can both be externally controlled independently while the ordinary Mn analytical total is conserved. Electroneutrality remains explicitly not imposed: this is a reservoir-controlled restricted chemical model, not a closed electrochemical cell or charge-closure solver.

Existing 1D sweeps and Cartesian grids already transform pe/Eh inputs. Existing 2D inventory-dominance output is not a thermodynamic Pourbaix classifier. The 3D path displays scalar grid outputs and adds no thermodynamic validation; it is unchanged.

## 2. Exact blockers and disposition

- Legacy preparation did not require externally imposed electron activity. New opt-in rejects electron/proton totals and requires ordinary totals, explicit H+, e- and water.
- Multi-solid preparation rejected any electron basis. This rejection remains the default; the new fixed-electron policy permits the existing bounded algorithm.
- No validated redox phase-selection evidence existed. Focused analytical/candidate-order checks now establish the selected restricted example.
- Species completeness, competing oxidation-state phases, tie/mixed-state interpretation and a redox-specific grid classification remain unaudited. No classified grid is delivered.
- General basis transformations, electroneutrality/redox closure, gas equilibrium and nonideal activities remain unsupported.

## 3–4. Selected system and exact stored constants

Selected Mn2+/MnO4- because its actual bundled reaction is a direct one-metal, proton-coupled electron reaction; it supplies a closed-form solution and quantitative pH slope without extra ligands. This is not a choice based on a textbook diagram.

Basis order: Mn 2+, H+, e-, H2O. Total Mn=0.001 mol/kg-H2O; ideal activities, 25 C, declared 1 bar.

| Product | Coefficients in basis order | logBeta | Bundled record ID |
|---|---|---:|---|
| MnO4- (aqueous) | 1, -8, -5, 4 | -122.5 | spana:2ac52a30213c9288:212927 |
| MnO2(s) | 1, -4, -2, 2 | -41.56 | spana:2ac52a30213c9288:212715 |
| Mn(cr) | 1, 0, 2, 0 | -39.96 | spana:2ac52a30213c9288:207519 |

Coefficients and constants are read from the bundled artifact, without modification. Charge checks are respectively 2-8+5=-1, 2-4+2=0, 2-2=0. Each selected aqueous species contains one Mn. Source provenance is included in the full exported system. Source reference-pressure scalar remains unavailable; 1 bar is the declared existing solver setting, not newly recovered source metadata.

## 5–6. H/e mathematics and SHE conversion

pH=-log10(a_H+), pe=-log10(a_e-). Eh=(ln(10) R T/F) pe in volts versus SHE, with T in kelvin. Reuses the existing transformation with R=8.31446261815324 and F=96485.3321233100184; no replacement constants. At 25 C the factor is 0.05915934968478112 V per pe. Conversion round trips and proportional temperature dependence pass at 0, 25 and 50 C. This validates the coordinate conversion only: equilibrium calculations still reject temperatures other than 25 C.

For the aqueous pair R_aq=[MnO4-]/[Mn2+]=10^(-122.5+8 pH+5 pe). Therefore [Mn2+]=T_Mn/(1+R_aq), [MnO4-]=T_Mn R_aq/(1+R_aq). Equal contributions occur at pe=(122.5-8 pH)/5, slope -1.6 pe/pH, or -0.0946549594956498 V/pH at 25 C. This two-species equality is not a full-system stability boundary.

## 7. Independent comparisons and residuals

Before production edits, the legacy fixed-activity equations already reproduced the aqueous solution; see redox-foundation-design.md. The new evidence is reproducible with `node scripts/validate-redox-foundation.js` and stored at full JSON numerical precision in redox-foundation-validation.json.

Aqueous checks: pH 7 at pe 10, 13.3 and 16; equal-contribution checks at pH 3/pe 19.7 and pH 10/pe 8.5; seven-point existing sweep pe 10–16 at pH 7. At pH 7/pe 13.3 both aqueous amounts are 0.0005 mol/kg within numerical roundoff. The nine recorded point states have maximum absolute free-Mn analytical error 4.0115480381963664e-18 and maximum absolute Mn balance residual 3.903127820947816e-18 mol/kg. Recorded mass-action and active-solid log-saturation residuals are zero. Independent tests reconstruct balances and saturation from returned amounts/log activities, not just the solver acceptance flag.

The comparison criterion is 1e-25+2e-10 times the expected molality, chosen to test both trace concentrations and ordinary values. It is a test comparison only; no new solver tolerance or relaxed scientific acceptance check was introduced.

## 8. Multi-solid interaction

The existing bounded subset enumeration, Newton solver and complementarity tests are reused unchanged. Independently, MnO2 requires log(a_Mn2+) <= 41.56-4 pH-2 pe; Mn(cr) requires log(a_Mn2+) <= 39.96+2 pe. The smallest applicable bound caps the analytical aqueous solution; the remaining Mn inventory is the selected solid amount.

At pH 7: pe=-25 selects Mn(cr); pe=0 is aqueous only; pe=10 selects MnO2; pe=20 is aqueous only with oxidized aqueous Mn dominant. All agree with independent bounds and inventory reconstruction. Reversing product/candidate order gives identical concentrations and solid diagnostics. This one-metal example has one independent conserved inventory and at most one independent positive solid amount away from degeneracy. It does not establish arbitrary multi-metal redox coexistence. Existing ambiguity/dependent-assemblage failures are retained, not converted into a colored region.

## 9. Grid status

No validated pH–Eh classification grid was achieved or claimed. Stopped at the explicitly permitted validated-point milestone. The bundled Mn system also contains Mn3+, MnO4 2-, MnO4-3 and Mn3O4(s), among other forms; excluding these is defensible for equation validation but not for asserting global Mn stability regions. A future grid needs a reviewed closed species/candidate set and a documented tie/mixed-state interpretation. No interpolation or artificial boundaries were added.

## 10. Water stability

Stored H2(g): logBeta=0 for 2H+ +2e-. Stored O2(g): logBeta=-83.09 for -4H+ -4e- +2H2O. Under unit water and gas activity at 25 C, these imply pe=-pH and pe=83.09/4-pH, respectively. Both have an Eh slope of -ln(10)RT/F at that temperature. These are algebraic consequences, not implemented gas equilibria. Gas fugacity/equilibrium is unsupported and temperature-dependent equilibrium constants have not been validated; temperature dependence of the intercept cannot be inferred by merely rescaling the 25 C constant. Consequently water lines are not currently delivered as a scientifically supported application feature.

## 11–12. Verification and preservation

- Pre-change baseline: 221/221 passing.
- Focused new tests: 8/8 passing.
- Final full suite: 229/229 passing, including all five unchanged golden benchmarks.
- Build: passed; existing large-chunk advisory remains.
- Lint: passed, zero errors; existing ExpandedPlot.jsx line 21 hook-cleanup warning remains.
- Production audit: passed against the completed build.
- Golden fixture SHA256: aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960.
- Bundled database SHA256: 9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245.

Solver mathematics, constants, tolerances, golden fixtures, fraction/solubility definitions, activity assumptions, pressure assumptions, exports and UI defaults were not changed. Typed unsupported/input/failure states remain explicit. Exported accepted traces include exact coordinates, system/source records, constraints, weighted aqueous contributions, totals, all solids/SI/amounts, residuals and attempts, with null classification. Rejected preparations carry typed diagnostics and never fabricate equilibrium results.

## 13. Exact files changed

Modified:
- src/solver/models.js — opt-in preparation/input safeguards; legacy behavior retained.

Added:
- src/solver/redox.js — explicit SHE fixed-potential wrapper and auditable exact trace.
- tests/redoxHelpers.js — bundled selected-system construction and independent analytical calculation.
- tests/redoxFoundation.test.js — eight focused regression/validation tests.
- scripts/validate-redox-foundation.js — reproducible numerical evidence capture.
- docs/redox-foundation-design.md — pre-production audit and bounded design.
- docs/redox-foundation-validation.json — nine exact numerical validation traces.
- docs/redox-foundation-report.md — this report.

The required Vite build regenerated dist output; no deployment or public assets were edited.

## 14–15. Limitations and smallest next phase

This establishes externally controlled redox equilibrium in an explicit restricted basis, not general redox closure or a complete Mn Pourbaix model. Ideal 25 C conditions only; no charge neutrality, gas treatment, basis substitution, automatic oxidation-state inference or new phase-completeness claim. Legacy electron bookkeeping remains available only through the unchanged legacy pathway; the new foundation forbids using it as an electron conservation constraint.

Recommended next bounded phase: audit a complete compatible Mn aqueous/pure-solid candidate set at 25 C, independently validate phase competition/coexistence and define an inventory-and-assemblage classification that retains ties, mixtures and unavailable points. Only then build a small internal pH–Eh grid, before any public Pourbaix UI. Stop here for review.
