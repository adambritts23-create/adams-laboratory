# Pourbaix / pH–Eh audit — REDOX GAP REPORT

**Decision: keep public Pourbaix validation pending.** The numerical engine can solve restricted fixed-potential equilibria, including competing oxidation-state solids, when given an explicitly prepared common basis. The ordinary editable-system preparation path cannot yet construct that basis generically. The user's section 27 explicitly requires stopping when redox-active components cannot share a consistent basis or phase competition is unsupported. Those conditions occur in the production session path. No production code, database, UI or solver policy was changed. This is a current integration/validation gap, not a claim that fixed-Eh thermodynamics is impossible or that the stored data lack redox reactions.

## 1. Verified starting baseline

393 tests passed; zero failed/cancelled/skipped/todo, 257442.5352 ms. All five official golden comparisons passed. Log: `.local/pourbaix-baseline-tests.txt`. Baseline was launched before new audit tests were added. All scientific code remained untouched throughout.

## 2. Actual architecture

Imported database → exact signed `effectiveSourceReaction` → direct-name compatibility discovery → `prepareSession` → `prepareChemicalSystem` → branded input → `solvePoint` → accepted result. `grid.js` orchestrates independent calls to this point solver. No general reaction-basis substitution occurs in either discovery or session preparation.

`solver/redox.js` already provides `fixed-electron-v1`, `ehToPe`, `peToEh` and `solveFixedRedox`. `models.js` requires fixed activities for H/e/water and analytical totals for ordinary components under that explicit policy. Electron free concentration is suppressed; its log activity participates in mass action. Electron bookkeeping is not a conserved electron inventory. An additional electroneutrality equation is explicitly unsupported. That is consistent with the existing externally imposed reservoir model; adding a physical electron mass balance is **not** the missing work.

## 3. Existing electron / pe / Eh support

All three predate this phase. `definition.js` maps pH and pe to negative log activities and Eh to log electron activity. `grid.js` already supports independent pH × pe/Eh coordinates for prepared systems. `redoxFoundation.test.js` independently tests aqueous transitions and solid competition. These capabilities do not establish a complete ordinary Pourbaix workflow.

## 4. Import and reaction conventions

`binary.js` preserves signed source coefficients and log K. `names.js:effectiveComponents` restores the separate proton count for the supported legacy six-slot format when no explicit proton term exists. `normalize.js` preserves original and effective reactions, raw source data, log K, byte offsets and provenance. The convention is formation of one named product from signed source component terms:

`log(a_product) = logBeta + Σ coefficient_i × log(a_i)`.

Eight representative imported Fe/Cu/Mn reactions pass independent atom-count and charge checks in the new audit tests. Their electron/proton coefficients equal the effective raw-source terms, and log K equals the original source value. This is representative validation, not a claim that every database record has been chemically audited. Product atom counts and oxidation states are not supplied generically by the importer; element-discovery associations must not be used as molecular formulas. Source temperature is 298.15 K; the pressure-reference scalar is absent, so 1 bar remains declared rather than a verified per-record reference pressure.

## 5. Canonical layer

None added, following the stop condition. Fe(II)/Fe(III), Cu(I)/Cu(II) and Mn(II)/Mn(III) are separate named basis choices. Choosing both plus electron reproducibly returns `redundant-basis`. Choosing one does not recursively substitute the other into its hydrolysis/solid rows. Example: Fe₂O₃(cr) is incompatible with an Fe(II)/H/e/water basis because its stored terms require Fe(III).

## 6. Fixed-potential and multi-solid gap

The low-level explicit policy works and remains tested. However, `prepareSession.js` does not pass `redoxPolicy: fixed-electron-v1`. `usesAutomaticSolids` deliberately excludes electron-bearing systems. Attempting a multi-solid Fe(III)/electron session returns `unsupported-redox-assemblage`. Removing this guard alone would skip the missing basis and candidate validation. Conversely, treating both iron valences as separately conserved totals would solve a different constrained problem, not the requested exchangeable total-iron equilibrium.

## 7. Conversion

`Eh = [R T ln(10) / F] pe`, `pe = -log10(a_e)`, volts versus SHE. Existing constants: R = 8.31446261815324 J/(mol K), F = 96485.3321233100184 C/mol, T = 298.15 K. Actual implementation factor: **0.059159349684782335 V per pe**. Positive Eh means positive pe and lower electron activity. Round trips pass within 1e-13 pe. Comparison to the existing rounded reference factor uses 1e-12 V tolerance; no constants or conversions were changed.

## 8–10. Supported scope, exclusions and availability

Supported now: explicit direct/common-basis, ideal, 25 °C, declared 1 bar, mol/kg-H₂O fixed-potential point/grid calculations under the existing validated policies. Public Pourbaix remains unavailable. Arbitrary ordinary redox basis closure, automatic redox phase inclusion and a generic validated dominance policy are not supported. No temperature, nonideal, pressure, gas-fugacity, kinetic or electrochemical-current extensions were made.

A future support gate must require a validated connected redox basis, supported and traceable reactions, one conserved analytical inventory per exchanging element, fixed H/e/water controls, explicit audited candidates/exclusions, the supported conditions, and a validated classification contract. Mere electron selection or a redox pair is insufficient. Existing pending UI and the three primary fast views are unchanged.

## 11–12. Grid and dominance

No new defaults or public map were introduced. Existing grid results preserve branded inputs, exact sample identity, acceptance, diagnostics and failed/not-run outcomes. The grid itself is not the blocker. No scientific interpolation was added.

Two existing generic diagnostic conventions are deliberately marked `pourbaixEnabled:false`: largest component-inventory fraction (including solids), and largest dissolved component fraction with solids reported separately. They are different meanings and cannot silently become a thermodynamic phase-stability map. A future first public convention should be explicitly validated as accepted positive solid assemblage, otherwise coefficient-weighted aqueous predominance, with ties/ambiguous assemblages unavailable or separately labelled. This is proposed architecture, not newly implemented classification.

## 13. Water reference lines

Water references already exist in the internal diagnostic. Stored H₂(g): logBeta 0, terms 2H⁺ + 2e⁻. Stored O₂(g): logBeta −83.09, terms −4H⁺ −4e⁻ + 2H₂O. Setting normalized gas fugacity and water activity to one yields `pe = −pH` and `pe = 83.09/4 − pH`; Eh follows the existing factor. These are source-derived **reference** boundaries, not a gas-equilibrium solve. `analysis/waterReferences.js` explicitly declares unit normalized fugacity, a(H₂O)=1 and missing source pressure scalar. No public overlay or external intercept was added. Water-line honesty is therefore not the stop reason; generic basis/session integration is.

## 14. Fe findings

Source pair: Fe³⁺ + e⁻ → Fe²⁺, logBeta 13.051; inverse −13.051. Hence log(a_FeII/a_FeIII) = 13.051 − pe; oxidation is favored as Eh increases. This verifies the direction of the aqueous pair, not a complete Fe map. Database rows include both valences, their hydrolysis products, Fe(cr), Fe(OH)₂(cr), Fe(OH)₃(am)/(s), FeOOH(cr), Fe₂O₃(cr), Fe₃O₄(cr), and ferrate. These are actually present; none was invented.

The official redox golden is narrowly Fe(II)/Fe(III), total 1e-5 mol/kg, pe 13, one aqueous product and no solid/proton-coupled topology. It is not general redox closure. The new tests establish the precise production rejection paths. No Fe pH/Eh map or comparison to textbook region geometry was claimed or enabled, because the prerequisites fail.

## 15. Cu findings

Cu²⁺ + e⁻ → Cu⁺ has logBeta 2.833, inverse −2.833. Rows include Cu(cr), Cu₂O(cr), CuO(cr), Cu(OH)₂(cr), and hydrolysis species using both Cu bases. The same generic basis gap occurs. Cu metal is present, not missing; it must eventually use the existing solid machinery after canonical preparation. No Cu topology was claimed.

## 16. Mn findings — existing work retained

The project already contains a substantial **offline, Mn-specific** audit in `scripts/validation/mnAudit.js`, not just the tiny foundation fixture. It compiles four Mn(III)-based rows by explicitly adding the Mn³⁺ formation reaction to the Mn²⁺ basis. It records source provenance and validates atom/charge counts using a manually transcribed Mn table. Its 19 products include 12 aqueous products and seven solid candidates, plus free Mn²⁺. The latest existing retry validation has 195/195 accepted points at Mn total 0.001, pH 0–14 (15 samples), Eh −1.5 to +1.5 V SHE (13 samples), ideal 25 °C and declared 1 bar. Those broad Eh limits are stress-test coordinates, not water limits.

The separate coexistence probe remains ambiguous. Later boundary/topology work certifies some connections while retaining unresolved cells and nonlinear/junction limitations. The development-only browser diagnostic reads pinned saved artifacts for that one example; it does not calculate the user's edited system. Its offline compiler names Mn³⁺ explicitly and is not a general production adapter. Promoting that saved map or copying its metal-specific conversion into production would violate this phase's generic-architecture requirement. Existing Mn tests run in the full regression suite; historical reports/artifacts were not regenerated or relabelled as new calculations.

## 17–19. Labels, failures and browser

All existing labels and phase metadata remain unchanged. Fe₂O₃(cr), Cu₂O(cr), aqueous ions and complexes must remain distinct in any future map. Failed points keep their original typed diagnostics; ambiguous coexistence is not assigned an arbitrary phase or split. No new classification or interpolation exists. Browser acceptance was conditional on enabling Pourbaix; it was not enabled, so no new browser screenshots or successful UI calculation are claimed. Current Calculation, pictures, Beaker, partition, exports and fast navigation were untouched.

## 20–22. Verification

New focused suite: 14 passed (six new audit tests plus eight existing foundation tests). Final full suite: **399 passed**, zero failed/cancelled/skipped/todo, duration 261215.2412 ms. All five official golden comparisons passed unchanged: acid-base, complexation, precipitation, redox and fixed-activity. Build succeeded with the established `--configLoader native` option; ordinary `npm run build` first hit environment `spawn EPERM` in Vite's configuration bundler. No permission workaround or config change was made. Artifact audit passed. Lint has zero errors and only the existing ExpandedPlot.jsx line 21 warning. The large-bundle advisory remains.

Logs: `.local/pourbaix-baseline-tests.txt`, `pourbaix-focused.txt`, `pourbaix-final-tests.txt`, `pourbaix-build.txt` (environment failure), `pourbaix-build-native.txt` (successful), `pourbaix-lint.txt`, `pourbaix-audit.json`.

## 23–24. Exact changes and preservation

Added `tests/pourbaixAudit.test.js`, `scripts/audit-pourbaix.js`, this report and `docs/pourbaix-audit-evidence.json`. The audit script is offline only and does not enter the production bundle. No existing production/scientific files changed. All **173** files snapshotted under src, public and tests/fixtures match their original SHA-256 hashes. The existing source artifact and golden fixture hashes remain tested. Dist was regenerated with the same application bundle name. Local logs and the preservation manifest are under `.local/pourbaix-*`.

## 25. Minimum future architectural work

1. Define a generic, bounded canonical redox-basis compiler. Select an independent basis; substitute traceable source rows by linear reaction addition, updating both signed stoichiometry and logBeta. Reject inconsistent cycles, rank deficiency, missing terms and unsupported transformations. Retain every original row and transformation coefficient.
2. Establish an authoritative conserved-component mapping across oxidation states. Keep ordinary non-redox sessions unchanged; preserve user totals and exclusions. Validate charge and representative elemental/proton/electron balance without treating discovery links as atom counts.
3. Connect the validated prepared basis to the existing fixed-electron policy and multi-solid enumeration. Discover candidates after canonicalization, retain explicit exclusions, and fail clearly outside the bounded candidate/solver limits. Do not alter Newton equations or introduce electron inventory balance.
4. Independently validate Fe or Cu source-coordinate equilibria, solid saturation, total dependence, reverse-basis equivalence and grid transitions before enabling a system. Use analytical checks and trusted reference conventions; numerical self-consistency alone is not database accuracy validation.
5. Define one classification contract, including aqueous weighting, accepted solid assemblages, ties and failures. Then add a support gate and sampled 2D map using existing exact grid results. Label optional water lines as references. Preserve every accepted result and failed-point identity.

This is the bounded minimum path; none of it was started after the stop decision.

## 26. Final disposition

Pourbaix remains **validation pending**. No deployment, remote push or subsequent phase. Equilibrium stability would not predict corrosion/passivation rate, reaction speed, nucleation, metastability lifetime, overpotential or current density. The absence of generic production basis preparation is the decisive gap; fixed-potential solving and a useful Mn diagnostic already exist and are preserved.

Reference context (validation only): [USGS PHREEQC master-species architecture](https://water.usgs.gov/water-resources/software/PHREEQC/documentation/phreeqc3-html/phreeqc3-49.htm) explains primary/secondary redox bases; [USGS pe definition](https://water.usgs.gov/water-resources/software/PHREEQC/documentation/phreeqc3-html/phreeqc3-2.htm) defines negative log electron activity; [IUPAC standard electrode potential](https://goldbook.iupac.org/terms/view/S05912) identifies the hydrogen reference convention. These support terminology and architecture, not quantitative Fe/Cu topology validation. No external diagram equations were copied into production.
