# SPANA Predom algorithm audit and implementation decision

Inspected retained upstream commit c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7, before production edits. Source root: `.local/hydra-basis-audit/upstream/`.

1. **Equilibrium at every point: yes; independent cold start at every point: no.** `Predom/src/predominanceAreaDiagrams/Predom.java` 3198–3388 traverses every X/Y sample; line 3272 calls `h.haltaCalc()`. One solver instance is reused, with `concs.cont=false` at the start of each column (3228). HALTAFALL supports continuation within the column. No chemistry is skipped merely because adjacent labels match.
2. **Analytical pairwise equilibrium boundaries: no.** No cheaper closed-form region construction replaces the grid solve.
3. **Line/region intersection: graphical only.** `Plot_Predom.java` computes connections/region label centres from sampled frontier points. This is not a derivation of chemical equilibrium boundaries.
4. **Adaptive subdivision / boundary tracing instead of solving a grid: no.** Uniform stepX/stepY at 3105–3109. Adjacent row/column labels are compared at 3326–3337. The two-column label buffer (3168–3178) and saved frontier points (3338–3352) are compact graphical storage.
5. **Carriers and phases:** `findTopSpecies`, 2431–2475, weights concentrations by the chosen component coefficient. Default phase interpretation is solid-first, with an aqueous-only option. Solid tie handling is order-sensitive and differs from Adam. Redox products enter through the prepared component reaction system and imposed electron activity; there is no discrete mixed-valence atom allocation in this classifier.
6. **Analytical totals:** TV/LTV values are assigned to `concs.tot`, with logarithmic coordinates exponentiated (3216–3226 and 3239–3249). Fixed totals remain analytical balance constraints.
7. **H+, e-, H2O:** Predom maps T/TV/LTV to kh=1 and LA/LAV to kh=2 (2715–2726). Proton and electron activities may be imposed through the latter. Solvent activity belongs to the existing chemical input conventions. These are not extra material inventories or automatic closed-redox constraints.
8. **Nonlinear boundaries:** sampled like other boundaries, then connected graphically. No guarantee of exact subgrid equilibrium crossings.
9. **Invalid points:** solver errors are checked (3313–3318); a valid top species/frontier is not manufactured. The plotting buffers use outside/unavailable sentinels. Adam retains explicit gaps for failed and unrun samples.
10. **Speed:** source establishes reused solver/work arrays, continuation and compact two-column/frontier storage. These plausibly reduce work/allocation. It does NOT establish how much faster each factor is on this machine. Java/SPANA runtime versus JavaScript timing was not measured here; no claim of an analytical speed advantage is justified.

## Decision

Keep the validated solver, tolerances, cold independent-point semantics and source constants. Reuse Adam's grid runner with an optional streaming result projection. Classify each accepted result immediately and retain compact sampled region cells. Full grids remain available unchanged. Exact selected-point inspection reconstructs the identical input and uses the same solver, then checks the classification before presenting the Beaker state.

No HALTAFALL-specific continuation, retry tolerance adjustment, order-dependent tie rule, solid-first carrier rule or graphic boundary smoothing is ported. They would require separate scientific validation. Carrier predominance uses the largest conserved source-component contribution across aqueous and accepted solids, with the existing symmetric carrier tie tolerance. Reviewed Fe/Cu oxidation-state allocation remains the default when its authoritative registry is available; carrier display is separately labelled EXPERIMENTAL / UNREVIEWED.

The optimization removes rich per-point retention, not the need for equilibrium solves. Browser measurements must therefore be reported honestly, even if latency does not improve. A future continuation solver API or independently validated adaptive method is a separate phase.

## 2026-10-02: ordinary species workflow aligned with Predom

Rechecked retained Predom.java `findTopSpecies` (2431–2475) and the grid call to `h.haltaCalc` (3272). New ordinary area definitions now request species/carrier regions and solid-first phase priority. The explicit pH–Eh shortcut sets imposed proton/electron activities while preserving fixed material conditions; absent totals remain unset for the user to enter. Oxidation-state interpretation remains separately selectable. Existing saved definitions retain their interpretation and, when no phase policy is present, the previous largest-inventory rule.

The classifier weights each concentration/amount by the selected component stoichiometry. In solid-first mode, present solids take priority; aqueous-only and largest-inventory alternatives are explicit. Symmetric numerical ties and failed-point gaps are retained, rather than copying upstream order-dependent solid tie handling. No solver tolerances, reaction constants, equilibrium acceptance rules or reference fixtures were changed. This is source-guided workflow/classification alignment, not a claim of complete HALTAFALL equivalence.

Validation: existing six predominance tests pass (including full Fe/Cu reference maps and Cr full-grid comparison); five new checks pass for weighting, phase priority, ties, Fe/Cr species maps, and the pH–Eh shortcut. Production build and changed-file lint pass.
