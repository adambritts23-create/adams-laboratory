# Public bounded Fe oxidation-state Pourbaix v1

Implemented locally for review. No deployment or remote push.

## Starting and final verification

Starting baseline: 452/452 tests passed, all five official golden benchmarks unchanged, build/lint/artifact audit passed. The initial manifest is `.local/public-fe-phase/before.json`. Final results, changed-file lists and protected scientific hashes are recorded in `public-fe-checks.json`.

Final regression: **458/458 passed**, zero failures/cancellations/skips/todo; all five goldens unchanged. Build, lint and artifact audit passed. Lint retains the single pre-existing ExpandedPlot hook warning; the build retains its existing bundle-size advisory.

The public path reruns all 2,565 samples and compares every oxidation-state fraction against the immutable accepted Fe evidence. Counts remain **422 Fe(0), 581 Fe(II), 1,473 Fe(III), 89 Fe(VI)**, with exactly equal saved fractions. Magnetite's 1 Fe(II) + 2 Fe(III) allocation and ferrate's Fe(VI) assignment remain unchanged. The existing HALTAFALL campaign supplies independent validation of this same matched grid; this UI phase did not conduct a new external reference campaign.

## Exact public scope

Fe total **0.001 mol/kg H₂O**, ideal activities, 25 °C, 1 bar declared; pH 0–14 at 0.25 spacing, Eh −1.0 to +1.2 V vs SHE at 0.05 V spacing, 57×45 samples. Fixed H⁺ and electron activities; a(H₂O)=1. Only the validated source snapshot, canonical basis, 19 Fe carriers and seven solid candidates are accepted.

Included solids: Fe(cr), Fe(OH)₂(cr), Fe(OH)₃(am), Fe(OH)₃(s), Fe₂O₃(cr), Fe₃O₄(cr), FeOOH(cr). Fe₀.₉₃₂O(cr) remains explicitly excluded because fractional/nonstoichiometric canonical stoichiometry is unsupported. Inclusion is not the same as being stable at a sample. Phase suppression, added/removed carriers or changed phase filters invalidate v1 support.

The established `fePourbaixCandidate` remains unchanged as historical scientific evidence. A separate public result wrapper enables the application feature only after the existing candidate assessment passes on a complete branded grid. It retains metadata, source, phase-scope and revision identities. Stale, forged, incomplete, unresolved and failed calculations cannot produce a supported public map. Editing the total to 0.01 produces an explicit unsupported message, never a silently extrapolated diagram.

Cu, Mn, arbitrary Fe totals, other temperatures, nonideal models, modified phase sets and other grid domains/resolutions remain unsupported. No compiler scope, equilibrium equation, thermodynamic constant, physical water-reference constant or numerical tolerance was changed.

## Workflow and presentation

Use **Load example… → Load bounded Fe Pourbaix v1**, then **Plot diagram**. This is part of the existing System / Calculation workflow and blue Pourbaix diagram family. The existing diagram choice displays Pourbaix without a generic validation-pending label for this supported setup. Other configurations receive an explicit scope explanation.

The region identities are Fe(0), Fe(II), Fe(III), Fe(VI), with graphite, cyan, amber and violet colors. These colors indicate classification, not physical appearance. Secondary information identifies the actual thermodynamic carrier; exact inspection remains available below the map. Predominance is the largest fraction, majority is strictly greater than 50%, and symmetric ties retain their scientific meaning.

Each cell represents a calculated sample. Boundaries are not smoothed and the displayed resolution is explicit. Dashed H₂/O₂ reference overlays use the existing source-bound calculation; hatching marks regions above O₂ and below H₂ without hiding them. Fe(VI) remains visible above the conventional water reference window. The reference convention is unit normalized gas fugacity/activity, a(H₂O)=1, SHE-based Eh at 25 °C; no analytical gas inventory is solved.

Click, hover, use the sample number or press arrow keys on the map to inspect exact accepted samples. Home/End select endpoints. Inspection reports pH, Eh, pe, total Fe, all four total-based fractions, predominant state, majority/tie status, carrier and phase, accepted solids, dissolved and unresolved Fe, water context, solver status and version/provenance data. No additional solve is performed for inspection. The existing beaker shares the exact input/result; its inventory labels now say total Fe for this canonical redox inventory, while dissolved-species names retain their actual identities.

SVG and numerical JSON exports are available under Export ▾. Scientific scope text explains that equilibrium predominance does not predict corrosion rate, kinetics, nucleation, passivation rate, metastable persistence or precipitate appearance.

## Browser evidence

The finished feature was opened and calculated in the Codex in-app browser. Desktop (1600×1100) and mobile (390×844) breakpoints were inspected, and the temporary viewport override was reset afterward. Mobile document width was 375 px within a 390 px viewport: no horizontal overflow.

All four region buttons were checked. The representative points were Fe(0) at pH 7/Eh −0.9, Fe(II) at pH 1.5/Eh 0, Fe(III) at pH 8/Eh 0.25, and Fe(VI) at pH 12.5/Eh 1.1. The magnetite control at pH 10/Eh −0.6 showed approximately 33.34403% Fe(II) and 66.65597% Fe(III), with Fe₃O₄(cr) as the dominant carrier. Every inspected map input ID matched its beaker input ID. ArrowRight moved sample 496 to 497. The unsupported total check explicitly rejected 0.01, after which 0.001 was restored and recalculated.

- [Desktop map and beaker](public-fe-desktop.png)
- [Mobile layout](public-fe-mobile.png)
- [Unsupported-total message](public-fe-unsupported.png)
- [Recorded inspection and identity evidence](public-fe-browser.json)

Initial attempts to launch a separate automated Edge process failed with runtime `spawn EPERM`. Acceptance was completed using the working in-app browser. Screenshots were saved by an ephemeral loopback-only artifact writer into this project; that helper is not part of the application.

## Files and artifact boundary

New public orchestration and setup live in `src/calculations/publicFePourbaix.js`, `fePublicSetup.js` and `src/data/fePourbaixExample.js`. New map/view components are `FePourbaixWorkspace.jsx`, `FePourbaixSetup.jsx`, `FePourbaix.css` and `src/plots/fePourbaixView.js`. Integration changes are limited to App, diagram setup/navigation/switcher, calculation/plot workspaces, session result commit, accepted selection and beaker display labels. Focused tests are `publicFePourbaix.test.js` and `publicFeArtifact.test.js`; the old pending-mode test now retains the correct unsupported-configuration assertion for Fe v1.

The artifact audit now recognizes the exact static oxidation-state registry object, verified against its pinned canonical SHA-256 and complete contents, exactly once. It does not whitelist arbitrary source hashes. Additional payloads, changed allocations, duplicate metadata, raw local paths, unexpected binaries and oversized artifacts still fail. This accommodates the previously validated production metadata without importing `.local/spana-audit` artifacts or the old test-only allocation fixture into the public application.

## Recommendation

Ready for review of this bounded public feature. The next scientific expansion should be a separately authorized, independently referenced Fe-total validation campaign, beginning with the internally explored 10⁻⁴ and 10⁻² mol/kg H₂O controls. That work has not been started here. No broader Fe or Cu/Mn support is enabled.
