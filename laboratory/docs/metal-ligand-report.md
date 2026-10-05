# Ni–ammonia response surface — validated review

Completed the requested chemistry challenge; no deployment. The expanded browser is left in Surface + floor contours. No renderer, grid plumbing, solver, constants, tolerances, activity assumptions or existing scientific definitions were changed.

## Selected system and scientific scope

X = pH, 6.5–10 (33 samples). Y = log10(total ammonia component / mol kg⁻¹ H₂O), −2–0 (17 samples). Z = log10(m(Ni(NH3)2²⁺) / mol kg⁻¹ H₂O). These are three distinct quantities. Ni analytical total = 1e−10 mol/kg-H2O; 25 °C; declared 1 bar; existing ideal activities, water activity 1, externally imposed pH. Grid: 561 accepted points, zero failures/unavailable samples, 1,024 triangles.

The ligand total includes free NH3, NH4+ and the stoichiometrically weighted ammonia in every included complex. This is a closed aqueous ammonia inventory with no gas headspace/reservoir. Bundled NH3(g) is not a phase in that specified model; this is not an open volatilizing ammonia solution. All three compatible pure Ni solids are included in the existing bounded assemblage calculation. None is saturated anywhere sampled: maximum log saturation = -2.3996984054129413. No required solid was excluded to produce the surface.

The selected low metal inventory is an explicit trace-metal aqueous validation domain, not a changed constant or axis exaggeration. At the high ligand end, ideal activity is a restricted model assumption, not a claim of experimental accuracy in concentrated ammonia. No redox closure, counterion/electroneutrality balance, gas equilibrium or nonideal correction is implied.

## Candidate screening before selection

Direct Ni(II), Zn(II) and Cu(II) / NH3 / H+ / H2O bases are supported by the bundled reactions, without electron terms. Initial screening used pH6–11, log ligand−4–0 and metal1e−5 with every compatible solid. Cu had one failed point, retained as failed in the screening count; Zn and Ni had none. That broad domain is not the delivered example.

A common trace-metal domain then screened all three at metal1e−10, pH6.5–10, log ligand−2–0 (29×17 coarse samples); all 493 points per candidate converged with no active solids. Ranges below are log-molality units; pH rows at ligand totals .01/.1/1 and ligand columns at pH6.5/8.25/10.

| Candidate | pH row ranges | ligand column ranges | sampled pH maxima | maximum mixed difference |
|---|---|---|---|---|
| Cu 2+ / NH3 → Cu(NH3)2+2 | 1.0264923 / 2.434321 / 4.2948084 | 1.7434466 / 1.9466766 / 2.5782591 | 8 → 7.125 → 6.5 | 4.4648411 |
| Zn 2+ / NH3 → Zn(NH3)2 2+ | 3.4580392 / 2.2717609 / 3.5584384 | 3.8387871 / 1.6284087 / 2.3920852 | 8.75 → 8 → 7 | 5.8949086 |
| Ni 2+ / NH3 → Ni(NH3)2+2 | 4.112411 / 2.2719476 / 3.1936766 | 3.6550296 / 1.0216384 / 3.0975833 | 9.625 → 8.375 → 7.375 | 6.6010174 |

All three show coupled response. Cu's high-ligand maximum reaches the lower domain edge. Zn remains a defensible alternative. Ni was selected because successive ammine competition produces an interior maximum at every representative ligand total and the largest tested mixed difference. Selection follows direct reaction/basis and solid support; no data or solver settings were adjusted for appearance. Final pH sampling is 33 points (32 intervals) to make reversed-coordinate comparisons exact with the existing weighted-endpoint grid formula. This is sampling only, not a grid implementation change.

## Actual bundled reaction inventory

Basis vector order: [Ni²⁺, NH3, H+, H2O]. Every row below encodes the source formation relation product = sum(coefficients × basis); log a(product) = logBeta + sum(coefficients × log a(basis)). Negative proton coefficients express hydrolysis. Constants are transcribed from the bundled records unchanged. Source IDs, original provenance, complete point inputs and accepted traces are retained in the compressed evidence.

| Product | Phase | Source coefficient vector | Stored logBeta |
|---|---|---|---|
| NH4+ | aqueous | 0, 1, 1, 0 | 9.237 |
| Ni(NH3)2+2 | aqueous | 1, 2, 0, 0 | 4.88 |
| Ni(NH3)3+2 | aqueous | 1, 3, 0, 0 | 6.54 |
| Ni(NH3)4+2 | aqueous | 1, 4, 0, 0 | 7.67 |
| Ni(NH3)5+2 | aqueous | 1, 5, 0, 0 | 8.33 |
| Ni(NH3)6+2 | aqueous | 1, 6, 0, 0 | 8.3 |
| Ni(OH)2 | aqueous | 1, 0, -2, 2 | -20.08 |
| Ni(OH)3- | aqueous | 1, 0, -3, 3 | -29.2 |
| Ni(OH)4-2 | aqueous | 1, 0, -4, 4 | -44 |
| Ni2OH+3 | aqueous | 2, 0, -1, 1 | -10.6 |
| Ni4(OH)4+4 | aqueous | 4, 0, -4, 4 | -27.52 |
| NiNH3+2 | aqueous | 1, 1, 0, 0 | 2.72 |
| NiOH+ | aqueous | 1, 0, -1, 1 | -9.54 |
| OH- | aqueous | 0, 0, -1, 1 | -14.0015 |
| Ni(OH)2(am) | solid | 1, 0, -2, 2 | -12.9 |
| Ni(OH)2(cr) | solid | 1, 0, -2, 2 | -11.03 |
| NiO(cr) | solid | 1, 0, -2, 1 | -12.48 |

Free Ni²⁺, NH3 and H+ are also aqueous basis species; water is solvent. For example, NH3 + H+ ⇌ NH4+ (logBeta9.237), and Ni²⁺ + 2NH3 ⇌ Ni(NH3)2²⁺ (logBeta4.88). Raising pH releases free ammonia from ammonium. The diammine population first rises, then yields to tri-/tetra-/penta-/hexaammine complexes; hydrolysis also competes. Increasing ligand total reaches the same free-ammonia competition at lower pH, shifting the ridge. This mechanism produces genuine mixed dependence, not an additive log-ligand offset.

## Independent numerical verification

A separate nested monotone bisection reconstructs both analytical totals using stored mass action. At fixed free NH3, inner bisection solves the nonnegative Ni balance including Ni2OH³⁺ with weight2 and Ni4(OH)4⁴⁺ with weight4. Outer bisection solves ammonia total, weighting each ammine by its ligand count. It uses no accepted solver activities, production Newton method, Jacobian or initial guesses. It reconstructs every aqueous species, then evaluates all three solid saturation quotients independently.

All 561 independently calculated Z values agree within 8.526512829121202e-14 log units (test bound2e−9, a new comparison criterion; production tolerances untouched). All independent solid quotients are below saturation. Representative full-precision comparisons:

| Index | pH | log ligand total | Independent Z | Production Z |
|---|---|---|---|---|
| 0 | 6.5 | -2 | -14.60014187271157 | -14.600141872711571 |
| 28 | 9.5625 | -2 | -10.486430902458471 | -10.486430902458473 |
| 281 | 8.359375 | -1 | -10.365066503075575 | -10.365066503075575 |
| 536 | 7.375 | 0 | -10.365973651847124 | -10.365973651847124 |
| 560 | 10 | 0 | -13.559650258447672 | -13.559650258447675 |

Three independent 1D pH sweeps at log ligand −2,−1,0 each match all 33 row samples. Three independent ligand sweeps at pH6.5,8.25,10 each match all17 column samples. All physical result fields, including rejected assemblage diagnostics, match exactly; input identity is excluded because distinct requests legitimately have different hashes. Swapped-axis traversal and separately reversed X/Y grids reproduce the same physical results exactly at the same coordinates. No solver or grid coordinate values were modified.

## Quantitative acceptance answers

1. pH Z ranges at ligand .01/.1/1: **4.113711, 2.2717015, 3.1936766** log units.
2. Ligand Z ranges at pH6.5/8.25/10: **3.6550296, 1.0216384, 3.0975833** log units. Even the smallest column range exceeds0.9.
3. Sampled ridge pH: **9.5625 → 8.359375 → 7.375**, a2.1875-pH-unit shift. Maximum anchored mixed difference |Z(x,y)−Z(x,y0)−Z(x0,y)+Z(x0,y0)| = **6.60257** log units. A separable additive surface would give zero.
4. The existing five projected constant-Z levels yield 308 segments. A connected contour at Z=-11.069959731303552 changes tangent orientation by **46.686°** in normalized X/Y coordinates; the aggregate range is47.659°. Some low-level branches remain nearly straight, but the family demonstrably curves and changes direction. Endpoint rounding to9 decimals was used only to group visualization segments for this diagnostic, never to alter samples or exports.
5. A115-pixel horizontal orbit drag over a460-pixel canvas corresponds to approximately90° with default OrbitControls. Both screenshots show substantial variation and a ridge, without changing axis aspect, data, color limits or height limits.

Overall Z range: -14.600141872711571 to -10.363923303021949. Contour lines and triangle interiors remain existing piecewise-linear visualization, never newly calculated equilibrium. Missing or invalid points would retain the existing masks; none occurred in this selected grid.

## Browser and regression checks

Loaded the new example through Calculation → Calculate map → expanded3D Surface + floor contours. Verified561/561 accepted;561 renderer vertices/1,024 triangles; quantitative scale and X/Y/Z quantity/unit labels; rotation; numerical export controls. Exact index281 inspection shows pH8.359375, log ligand−1, Z−10.365066503075575, matching saved evidence. The focused integration test proves that repository preparation and exact JSON export reproduce every sampled value.

Four focused tests pass. Full suite: **288 passed,0 failed**, preserving all284 pre-existing tests. All five unchanged golden benchmarks pass. Golden SHA256: aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960. Bundled JSON SHA256: 9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245. Build and production audit pass. Lint:0 errors, the existing ExpandedPlot cleanup warning only. Existing build chunk-size warning remains. No deployment.

## Exact files changed

Application: src/App.jsx (new example dispatch); src/components/CalculationWorkspace.jsx (one selector button and closed-system note); src/data/metalLigandSurfaceExample.js (new setup only).
Validation: scripts/validation/metalLigandSurface.js (screenable source-backed case, independent bisection, slice/traversal checks and response metrics); tests/metalLigandSurface.test.js (four focused tests).
Evidence/report: docs/metal-ligand-screen-initial.json; docs/metal-ligand-screen.json; docs/metal-ligand-validation.json.gz; docs/metal-ligand-review-summary.json; docs/metal-ligand-expanded.png; docs/metal-ligand-rotated.png; docs/metal-ligand-tests.txt; docs/metal-ligand-lint.txt; docs/metal-ligand-build.txt; docs/metal-ligand-production-audit.txt; docs/metal-ligand-report.md. Standard dist artifacts were regenerated by the local build only. Existing reports and evidence were preserved.

Remaining limitations: conditional ideal direct-basis model; no claim of species completeness beyond compatible bundled records, experimental validation, continuous extrema, or behavior outside this sampled domain. Concentration is trace-metal ammine molality, not saturated solubility. The screenshots are review evidence; no renderer redesign was undertaken.
