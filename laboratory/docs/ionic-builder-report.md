# Periodic-table ionic solution builder

Completed locally, 2026-09-17. No deployment or push.

## Implementation

Wet Lab Sample and Burette both offer + Add reagent → Reviewed reagent or Ionic preparation. + Add species opens a native modal reusing System's ElementSelector and ComponentSelector and the repository's authoritative component identities. Electron and solvent are not offered as physical solutes. The main workspace retains compact rows with mM of supplied form, change/remove, explicit net supplied charge and an optional two-row countercharge balance. Up to the existing 16 physical contribution rows are supported, including reviewed and ionic rows together. Positive and negative forms can be selected in either order. No commercial salt/hydrate identity or spectator addition is inferred.

Source-bound ionic rows use the pinned networkComposition registry. Metadata is resolved by source ID, never formula parsing. PreparedSolution retains source identity, source associations, pinned composition/charge provenance, concentration, nonnegative physical moles, final volume, source fingerprint and revision. Dispensing and mixing preserve those rows. The existing physical-preparation compiler discovers the equilibrium route; no new solver, metadata curation, constants, phase model or plotting path was introduced. Reviewed compatibility scopes remain explicitly restricted; ionic preparations never silently enter the historical restricted recipe fallback.

The preflight uses prepareWetLabScope and the unified compiler without solving a titration. Accepted structural scope is CONDITIONAL because Ideal 25 °C, additive-volume conventions and phase/gas restrictions still apply. A later dose can be unavailable; preflight is not a promise that every dose will solve. Missing metadata, imbalance, source exclusions and compiler refusals produce UNAVAILABLE and disable Prepare. Preparation repeats validation and retains existing stale-result protections.

## Scientific evidence

- 50 mL of Cr3+ 10 mM + Cl− 30 mM has exactly the same physical coordinate inventories as reviewed CrCl3 0.0100 M: 0.0005 mol chromium and 0.0015 mol chloride.
- All 12 saved independent chromium reference doses (0, 1, 2, 3, 5, 7, 10, 14, 15, 20, 50, 100 mL) pass pH/pe, aqueous carrier and solid-bound chromium comparisons. No new independent reference campaign and no reference rewrite.
- Assertions use pH/pe difference <1e-8 and carrier/solid inventory absolute difference <1e-10 mol/kg, consistent with the prior integration regression. Both total and dissolved fractions close within 1e-8 in these checks, using the existing adapters.
- Generic Na+/Cl− control prepares and solves via the same compiler with aqueous scope. Requesting pure solids for that control is explicitly unavailable: no reachable solid belongs to the existing bounded scope. No compiler behavior was changed to bypass that restriction.
- Selectable Cu2+/Cl− control refuses for missing authoritative composition/charge metadata. No substitute chemistry.
- Three distinct supplied forms, row order, optional charge balance, mixed reviewed/ionic rows, dispensing/recombination, negative amounts, forged catalog and stale revisions are covered.

## Browser demonstration

Local development app: selected Wet Lab, removed default Sample HCl, chose Ionic preparation, opened shared periodic table, selected Cr → Cr3+, added Cl → Cl− and auto-balanced to 10/30 mM. Sample 50 mL, reviewed NaOH 0.100 mol/L, burette 100 mL. Net charge displayed zero; structural preflight CONDITIONAL.

The actual experiment produced 101/101 accepted samples, from pH 2.68564 at 0 mL to 12.74367 at 100 mL. At 10 mL: pH 3.63303, derived Eh 0.54378 V vs SHE; total fractions showed Cr2O3(cr) 50.836% of total Cr; aqueous speciation used the dissolved denominator. Apparatus, sediment, plot and inspection DOM identities all matched the same exact accepted sample. Log concentrations and keyboard End navigation worked. Transient pointer preview was also observed while the committed sample remained selected separately.

Added Cu2+ as a third row through the same picker: selection remained visible, the experiment became stale, the preflight displayed missing metadata and Prepare was disabled. Removed that row and restored the supported chromium setup. Clearing a concentration through the keyboard disabled preparation with an explicit numeric-input error. The restored setup is ready to prepare again; stale results are not reused.

## Validation

- docs/ionic-builder-focused.txt: 13/13 (6 new ionic tests plus 7 existing setup tests).
- docs/ionic-builder-regressions.txt: 23/23 existing physical mixing, experience, selection/hover and analysis tests.
- Total focused validation: 36/36, zero failures/cancellations/skips/todo.
- Full repository regression intentionally not repeated under the requested compute discipline. Last repository-wide baseline remains 686/686 from docs/unified-physical-regression.txt; this is not a new full-suite claim.
- docs/ionic-builder-build.txt: production build passed. Used Vite's ordinary error fallback for unavailable optional Windows network-drive discovery, without modifying dependencies or configuration. Existing large-bundle warning remains.
- docs/ionic-builder-artifact-audit.txt: passed.
- docs/ionic-builder-lint.txt: zero errors; one existing ExpandedPlot.jsx ref-cleanup warning.
- docs/ionic-builder-preservation.json: targeted existing 72-file baseline comparison, no differences in checked solver/thermodynamic/analysis/data/reference files.

## Files

New: src/calculations/wetLabIons.js, src/calculations/wetLabPreflight.js, src/components/WetLabPreparation.jsx, tests/wetLabIonic.test.js.
Updated: wetLabSolutions.js, wetLabSetup.js, wetLabTitration.js, wetLabExperience.js, WetLab.jsx, WetLab.css, ComponentSelector.jsx. Production dist rebuilt. No thermodynamic or solver source edits.

Stopped for review.
