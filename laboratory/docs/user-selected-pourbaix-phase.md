# Generic user-selected Pourbaix workflow

The application now supports **select element → enter one total → choose pH/Eh ranges → Plot** for the currently registered Fe and Cu oxide/hydroxide families. Choosing component forms manually is unnecessary. This is a generic workflow with deliberately bounded scientific coverage, not universal element support.

## Scientific result

| Control | Grid | Oxidation-state sample counts | Fraction differences from accepted evidence |
|---|---|---|---|
| Fe, 0.001 mol/kg H2O | 57 × 45 | 422 Fe(0), 581 Fe(II), 1473 Fe(III), 89 Fe(VI) | Exactly zero |
| Cu, 0.0001 mol/kg H2O | 57 × 45 | 1179 Cu(0), 156 Cu(I), 1230 Cu(II) | Exactly zero |
| Cu, 0.002 mol/kg H2O; pH 2–12; Eh ±1.005715 V | 57 × 45 | All 2,565 points converged and passed inventory checks | Internally verified; no independent benchmark claim |

The reference grids retain pH 0–14, Eh −1 to +1.2 V vs SHE, Ideal activity, 25 °C and 1 bar declared. Both reconstructed system identities are exactly unchanged. Fe retains seven solid candidates and 19 allocated carriers; Cu retains four solids and 14 allocated carriers. Fe0.932O remains explicitly excluded by the reviewed fractional-stoichiometry scope. Magnetite's existing 1 Fe(II) + 2 Fe(III) allocation is untouched.

## Architecture and scope

`redoxDiscovery.js` traverses source reaction connectivity from the selected source component to a deterministic fixed-point family. It enumerates compatible source reactions independently of registry carrier lists, then invokes the unchanged canonical compiler. Element associations populate the picker only; they do not assign oxidation states. No element-specific branch or formula/charge parser determines oxidation states.

`redoxSupportCatalog.js` is the small element-specific data catalog linking the existing Fe/Cu identity-bound registries and reference contracts. Their allocations, provenance, metadata hashes and thermodynamic constants are unchanged. Every included carrier must resolve through this metadata before calculation. Missing, ambiguous or changed metadata fails closed. No research or test-only allocation fallback exists.

`userPourbaix.js` constructs the actual definition from the user's analytical total, ranges and sampling. The existing solver, grid runner and inventory acceptance checks determine success. Exact reference scope receives **REFERENCE VALIDATED** only after every point passes. Other successful conditions receive **CALCULATED / INTERNALLY VERIFIED**, with an explicit statement that those conditions are not independently benchmarked. Unsupported preparation or failed inventory/equilibrium checks produce no accepted map.

The existing numerical tolerances are not relaxed. Totals too small to resolve the existing inventory/tie contract are rejected. Sampling is bounded by the existing 10,000-point grid limit. Extra analytical components, unresolved chemistry and nonideal conditions are rejected rather than silently discarded.

Solid discovery distinguishes eligible candidates, reviewed exclusions, explicit user exclusions, disabled phases, and reactions requiring additional components. Candidate presence does not mean precipitation. Suppression changes the phase-scope identity and loses the default reference claim. Accepted stable solids and amounts come only from the equilibrium solver.

`boundedPourbaix.js` carries the actual contract, source-discovery disclosure, reference status and request identity. The result retains pH, Eh, pe, total inventory, exact oxidation fractions, carrier/solid inventories, source metadata, water context and solver status. `PourbaixWorkspace.jsx` and `pourbaixPresentation.js` render either registered element using the same map and inspector. Shared selection gives plot and Beaker the same input identity; stale, cancelled or copied results cannot be committed. SVG and numerical JSON remain available under Export.

Primary interpretation remains oxidation-state predominance; thermodynamic carrier is secondary. Fractions use total conserved inventory. Water lines are reference overlays with unit normalized H2/O2 convention and a(H2O)=1, not solved gas inventories. Outside-water-window samples remain results of the fixed-Eh model.

## Third-element audit

Uranium is **unsupported**. Discovery finds four connected component forms and eight bridge records. Proton/water-coupled bridges exceed the existing compiler's validated electron-only substitution scope. Among 30 compatible source records, 27 are explicitly unresolved for authoritative allocation metadata; three encounter fractional source-reaction coefficients first (U3O7, U3O8, U4O9). Those formulae are not being described as nonstoichiometric compounds. No U registry, guessed oxidation allocation, substituted constants or forced plot was added.

Every discovered Fe/Cu/U carrier and source ID is listed in [the discovery audit](redox-discovery-audit.md), with full source provenance and exclusions in [its JSON](redox-discovery-audit.json).

## Validation and browser evidence

Starting baseline: **468/468**, zero failures/cancellations/skips/todo; all five official goldens unchanged. Build and artifact audit passed. Lint had zero errors and one existing ExpandedPlot hook-cleanup warning.

Final result: **480/480 tests passed**, zero failures/cancellations/skips/todo. All five goldens, build and artifact audit pass. Lint: zero errors and the same existing warning.

Final checks are recorded in [discovery-phase-checks.json](discovery-phase-checks.json). The five golden cases are acid-base, complexation, precipitation, redox and fixed activity. Protected-file before/after hashes and the exact changed-file inventory are in [discovery-file-checks.json](discovery-file-checks.json). No accepted numerical evidence was edited to fit this implementation.

Browser acceptance used the normal element picker for Fe and Cu, entered the Cu total explicitly, calculated both reference grids, changed Cu total and bounds to the supplied MEDUSA example, and inspected uranium's refusal. Keyboard Home/ArrowRight selected matching exact input IDs in map and Beaker. At 390 × 844, document width was 375 px: no horizontal overflow. Desktop layouts were checked at 1600 × 1100 and 1280 × 1000. Viewport overrides were restored afterward.

- [Fe map and Beaker](discovery-fe-browser.png)
- [Cu map and Beaker](discovery-cu-browser.png)
- [Changed Cu total and internal-only status](discovery-changed-browser.png)
- [Uranium unsupported disclosure](discovery-unsupported-browser.png)
- [Mobile keyboard selection](discovery-mobile-browser.png)
- [Browser readouts and matching input IDs](discovery-browser.json)

## Remaining limits and next phase

Scientific coverage remains one registered oxide/hydroxide family, Ideal activity, 25 °C and 1 bar declared. Arbitrary totals and bounds are conditional internal calculations, never extrapolated independent validation. Boundaries remain sampled cells. Ligands, additional conserved redox components, new elements and broader activity/temperature support require their own defensible metadata and validation.

Recommended next phase: validate a generic proton/water-coupled canonical bridge extension and curate an authoritative U allocation registry with an independent reference campaign. Keep public U disabled until that work succeeds. The common-coordinate result contract leaves room for future overlays and coupled reasoning, but neither overlays, spontaneity calculations nor electrochemical-cell UI was implemented here.

No deployment or remote push was performed. Ready for review after the recorded final checks.
