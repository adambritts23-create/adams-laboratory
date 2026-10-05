# Unified physical preparation → equilibrium compiler

## Implementation

`compileEquilibriumNetwork` accepts `boundary: 'physical-preparation'` with the existing source-bound physical contributions, explicit solvent/volume convention, source fingerprint, revision and conditions. It uses source electron-transfer connectivity to choose the retained non-redox or closed-redox path. No reagent or element names select this fundamental route.

Both boundaries use `networkComposition`, the source-identity-pinned composition/charge registry. Existing `componentMetadata` remains its foundational reviewed registry; sodium, borate and acetate additions are now also available to redox discovery. This changes metadata availability, not source constants or reaction equations.

The new physical adapter validates nonnegative supplied moles and electroneutrality, retains contribution provenance, and brands the resulting physical inventory. Positive source products remain physical carriers: NaOH is supplied with positive formula-unit moles under its authoritative source ID. The **existing closed-redox compiler** projects it into its signed conserved basis. The negative proton equivalent and source-water coefficient are retained in inspection. No negative physical reagent rule was relaxed, and no solver file was edited. Source products requiring unsupported identity transformations still refuse explicitly.

Physical provenance is included in preparation identity; revision participates in accepted input identity. Forged physical/audit/result objects cannot bypass branding. No implicit counterions, gas/headspace model, phase suppression, caching or kinetic claims were added.

## Chemistry evidence

Focused checks compare against existing saved evidence, without regenerating or changing the independent reference:

- Acetate + borate + NaOH: existing physical reference across 0, 5, 10, 20 and 100 mL, including aqueous carrier values. Non-redox returns no derived Eh.
- Reviewed Fe(II)/peroxide: the explicitly requested existing reviewed source profile preserves the independent reference and its counterion-redox exclusions. Selection of this profile is explicit, never inferred from the reagent name. The unrestricted graph remains a distinct conditional scope; a probe showed a ~3.59e-8 pe difference because it also includes counterion redox. It is not relabeled as the reviewed profile.
- Europium chloride + acid: same physical contract, existing cheap independent Eu source reference.
- CrCl3 + NaOH: all 12 retained independent doses, pH/pe, all aqueous carriers, positive solid amounts, conservation closure and solid-bound chromium. Cr2O3 is predicted by equilibrium, not recipe metadata. Unadmitted phases and gas requirements retain post-solve refusal checks.

Maximum differences across the 12-point saved reference: pH 2.69384514695048e-12; pe 4.54081217071689e-12; aqueous carrier amount 1.1861171766991419e-16 mol/kg H2O; positive solid amount 1.3010426069826053e-18 mol/kg H2O.

Reference doses (mL): 0, 1, 2, 3, 5, 7, 10, 14, 15, 20, 50, 100. At 10 mL, pH is about 3.633028194538; at 100 mL, about 12.743673597835. The independent reference predicts substantial solids persisting at high base; no redissolution endpoint was invented.

Evidence: `unified-physical-cr-comparison.json`, `unified-physical-focused.txt`, and tests in `tests/unifiedPhysical.test.js`. Numerical comparison limits in tests do not change solver tolerances.

## Wet Lab

CrCl3 is a normal reviewed recipe: Cr(III) supplied identity, three intrinsic chloride ions, physical formula-unit inventory, provenance and applicability. It contains no pH, endpoint, phase name or titration equation. Its physical parts use the same contribution compiler as other bottles.

Wet Lab projects accepted redox results into its existing point/selection/hover contract. Chromium total fractions use the conserved elemental inventory from the accepted closed result; aqueous speciation uses dissolved elemental inventory. Carrier atom counts weight both. These are presentation adapters, not separate equilibria. Derived pH/Eh, accepted solids and schematic sediment use the exact selected result. Log concentrations include accepted solid carriers for the new redox path; historical non-redox views remain unchanged.

Historical HCl/NaOH/acetate compatibility calculations retain their explicit reviewed restricted profile. New recipes cannot enter that reduced model merely because HCl is also present. Its existing boric-acid/chloride restriction remains explicit. This legacy profile is not the automatic fundamental compiler route.

## Adding CaCl2 next

No fundamental redox/non-redox routing branch should be needed. Required work is reviewed CaCl2 physical recipe/coordinate metadata (Ca2+ plus two intrinsic chlorides), authoritative pinned Ca composition, applicable source/phase validation, and focused integration evidence. Chloride's connected redox graph must be audited; it cannot be silently treated as inert. Missing capacity, phase or metadata coverage could still require separate scientific scope work. CaCl2 was not added here.

The input adapter provides a natural separation between source structure and dose inventory, but compilation is still performed independently per dose. No structural caching or speedup claim was introduced.

## Final verification

Browser verification completed: 101/101 accepted samples, exact selected/preview restoration, derived pH/Eh, total/dissolved fractions, positive-solid sediment, legend focus and keyboard endpoint navigation. See `unified-physical-browser.md`. The single full regression completed: **686/686 passed**, zero failures/cancellations/skips/TODO, 805.398 seconds. The full command used Node's in-process test isolation mode because sandbox child-process spawning is restricted. The ordinary test-worker attempt during focused development failed before running tests; no second full suite was run.

Production build passed: index-feU_gOds.js / index-CM7TKZJn.css. The standard npm launcher stopped before compilation on Vite's optional Windows net-use lookup (spawn EPERM). The successful build used Vite's build API with that one optional lookup returning its ordinary error-callback fallback in-process; no installed dependency or config file was edited and no network-drive access occurred. The existing large-chunk advisory remains.

Artifact audit passed. Lint passed with zero errors and the one existing ExpandedPlot.jsx line 21 ref-cleanup warning. Preservation checked 265 inherited source/data/reference files: 256 unchanged, exactly nine intended source adapters/UI files changed, zero unexpected changes. The new source module is physicalPreparation.js. Solver mathematics/tolerances, thermodynamic data, reviewed Fe/Cu source metadata, importers and saved independent evidence are unchanged. Existing golden/reference regression checks pass.

Logs: unified-physical-regression.txt; unified-physical-build.txt (environment-blocked launcher); unified-physical-build-local.txt (successful production build); unified-physical-artifact-audit.txt; unified-physical-lint.txt; unified-physical-preservation.json. Earlier focused logs retain development failures for the old four-recipe expectation and an initially broadened historical non-redox log view; those were corrected and the focused preservation and full regression now pass.

No deployment, remote push, solver changes, thermodynamic changes or caching were performed. Ready for review.
