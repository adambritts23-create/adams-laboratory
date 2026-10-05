# Mn thermodynamic boundary refinement — partial region view

1. **Primary meaning.** Accepted positive Mn-bearing pure-solid assemblage takes precedence. In aqueous-only states, the largest stoichiometrically weighted dissolved-species contribution is used only when the existing comparison policy separates it. Dissolved species and oxidation-state diagnostic maps remain separate and unchanged. The audited candidate set, total Mn 0.001 mol/kg-H2O, ideal activities, fixed pH/Eh, 25 °C and declared 1 bar are unchanged.

2. **Detected brackets.** The original 195 stored states identify 80 neighboring primary-classification changes: 50 aqueous/solid, 25 solid/solid and five aqueous/aqueous. Endpoints, original inputs/results, classifications and candidate conditions are exported. This count differs from the previous all-mode change count because the primary interpretation is deliberately different.

3. **Refinement.** Deterministic midpoint bisection calls the unchanged solveFixedRedox path. No solver options or tolerances are overridden. Four parent brackets contain an intervening accepted state; they are subdivided rather than treated as single boundaries. The resulting 84 terminal crossing brackets require 1,789 intermediate evaluations in one reproducible audit run. Every accepted evaluation is independently checked against the original-source mass-action oracle. The offline audit is reproducible with node scripts/validate-mn-boundaries.js. The browser reads pinned artifacts rather than recomputing chemistry.

4. **Convergence.** Opposite accepted endpoint separation is at most 1e-6 pH for horizontal brackets or 1e-7 V for vertical brackets. At most 32 bisections and eight intervening-state subdivision levels are allowed. Failed, tied or ambiguous intermediate evaluations stop that branch explicitly. Coordinate enclosures, not arbitrarily rounded single boundary positions, are exported.

5. **Analytical comparison.** All 29 terminal solid/solid crossings agree with independently reconstructed equal free-Mn activity caps. In the Mn2+ basis, each cap is −(logBeta − nu_H*pH − nu_e*pe)/nu_Mn. Subtracting normalized phase equations gives constant − nH*pH − ne*pe = 0. The Mn(cr)/Mn(OH)2(am) proton-coupled slope is −RT ln(10)/F, approximately −0.0591593496848 V/pH at 25 °C. Original-source cap calculations independently reproduce each equality. No direct simple aqueous/aqueous Nernst transition occurs in the primary brackets: the aqueous transitions involve unequal Mn stoichiometry, so free activity cannot be cancelled. No simple Nernst line is falsely assigned to these.

6. **Solid/aqueous and aqueous validation.** Independent equality residuals change sign across every terminal bracket. For solid/aqueous crossings the residual is log10(D_at_solid_cap / Mn_total), reconstructing all monomer/dimer aqueous contributions from original source reactions. For solid/solid crossings it is the cap difference. For aqueous/aqueous crossings it is the log ratio of weighted contributions. Accepted endpoints preserve balance and saturation checks. These validations do not substitute a new production solver.

7. **Intervening phases and junctions.** Parent edges 103–118, 104–119 and 114–129 contain an intervening Mn2O3(cr) phase. Edge 126–141 also encounters Mn2O3(cr) between its original classifications. These states are retained. The audit has not established a unique connected two-dimensional boundary graph or exact junction positions. No triple points or connecting curves were invented. Uncertified areas remain gray, including potential junction neighborhoods.

8. **Uncertainty and region enclosure.** Filled interiors are conservative enclosures, not midpoint-colored grid cells. For a solid, affine cap ordering is checked throughout a rectangle and convex dissolved-inventory sums are bounded at its vertices. For aqueous-only regions, interval bounds on the existing monomer/dimer balance bound free Mn; all saturation upper bounds must be negative and weighted-species intervals must separate. A 1e-9 log-unit enclosure guard is used only to avoid claiming near-equalities as certified interiors; it does not change any equilibrium tolerance. Existing absolute balance/comparison floors are reused. Unproved boxes are subdivided to depth nine, then left unresolved. There are 10,613 certified tiles and 4,676 unresolved boxes. Finest enclosure widths are 0.02734375 pH and 0.005859375 V; these are deliberately distinct from the much tighter one-dimensional crossing bounds. About 1.78% of plotted coordinate area is unresolved; this is not a probability or a measure of physical uncertainty.

9. **Original-state consistency.** None of the 195 stored states contradict a colored enclosure. 187 lie in compatible certified interiors; samples 24, 39, 54, 69, 84, 87, 128 and 145 fall in unresolved enclosure areas and remain inspectable with their original accepted classifications. No contradictory color is assigned. The prior dissolved tie at sample 118 remains in the alternative diagnostic and exact inspection; solid precedence does not erase its aqueous inventory. Every certified tile corner is independently checked against the original-source oracle, supplementing the analytic enclosure conditions.

10. **Water references.** The existing optional analytical H2/O2 overlays are unchanged: unit normalized gas fugacity and water activity, 25 °C, SHE. Source absolute reference-pressure scalar remains unavailable. Dashed water references are visually distinct from refined crossing marks and do not represent calculated gas phases.

11. **View achieved and deliberate limits.** A development-only, partially refined filled-region view is available alongside Sampled points and Refined regions + sampled points. Direct labels are placed in sufficiently large interiors; all represented classes have legend entries. Refinement crossings are marked separately. Gray-strip edges are explicitly labelled enclosure limits, NOT thermodynamic boundaries. Continuous thermodynamic boundary lines and exact junction geometry were not completed because their connected topology is not established. This is the permitted partial result, not a claim that a fully connected conventional Pourbaix diagram has been validated. The old diagnostic remains available. Clicking a region selects the nearest original stored sample in normalized plot coordinates and explicitly identifies that choice; it does not fabricate an equilibrium at the click location. Inspection includes exact coordinates, inventory, residuals and neighboring crossing provenance.

12. **Tests/checks.** 257 tests pass, including eight focused boundary/enclosure tests. Build, lint and production audit pass. Lint retains the existing ExpandedPlot ref warning; build retains the existing chunk-size warning. Browser-checked pinned snapshot/region loading, combined expanded view, exact sample 104 inspection and switching back to the sampled view. Screenshot saved. Numerical JSON includes original states, all intermediate results, brackets, equality comparisons, endpoint uncertainty and enclosure geometry. SVG exports conditions and explicit limitations. Region artifact SHA256 is checked before display.

13. **Preservation.** All 249 prior tests and five unchanged golden benchmarks pass. No constants, solver equations, tolerances, redox formulation, initialization retry, candidate chemistry, solubility/fraction behavior, activity assumptions or 3D behavior changed. The production bundle remains unchanged in content/name; the view is development-only. No deployment.

14. **Exact files changed this phase.**

Modified:
- src/components/MnDiagnostic.jsx

Added:
- src/plots/mnRegions.js
- src/data/mnRegionIdentity.js
- scripts/validation/mnBoundaries.js
- scripts/validation/mnRegionCertificates.js
- scripts/validate-mn-boundaries.js
- tests/mnBoundaries.test.js
- docs/mn-boundary-validation.json
- docs/mn-region-enclosures.json
- docs/mn-refined-regions.svg
- docs/mn-refined-regions-browser.png
- docs/mn-boundary-report.md

Build output was regenerated. Previous scientific evidence, original diagnostic files other than its component, golden fixtures and solver source files were not edited.

15. **Remaining scientific limitations.** The grid brackets do not establish all global topology. Unresolved strips may include thin phases or junctions; nothing is filled across them. Minor regions are not intentionally removed. No exact multi-solid split or triple-point location is claimed. Certificates are restricted to this audited monomer/dimer Mn system and ideal conditions. New arbitrary chemical systems are not supported. The full audit JSON is intentionally sizable because it preserves exact intermediate evidence. Refined-region alternatives for dissolved oxidation/species are not inferred; those remain sampled views.

16. **Smallest next phase.** Trace and validate one local boundary junction involving Mn3O4/Mn2O3/MnO2 using the existing phase equalities, with explicit uncertainty and accepted side-state checks. Only after that should a connected line replace an unresolved enclosure strip. Do not globally smooth the map.

Stopped for review at the partial, scientifically explicit result.
