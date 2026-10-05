# General Pourbaix experience — review report

The existing generic workflow is now directly available through the **Pourbaix / pH–Eh** quick-view button in Calculation. Select an element in System, choose Pourbaix, enter one analytical total, pH/Eh ranges and sample counts, then Plot diagram. Fe and Cu remain the supported public families. No solver, reaction-basis engine, thermodynamic constants or support contracts changed.

## Baseline and validation

The recorded 500/500 baseline, five goldens, exact Fe/Cu references, exact reaction-basis controls, dual uranium 1,025-point controls, build and artifact audit were intact. Before editing, SHA-256 comparison verified every file in the previous phase manifest against its accepted final hash; no redundant baseline grid campaign was run.

Final full regression: **503/503 pass**, zero failures/cancellations/skips/todo, 375.087 seconds. All five official goldens and exact Fe/Cu reference identities/fractions pass. The existing uranium dual-basis regression also passes. After the last navigation/copy polish, the focused 15-test generic Pourbaix suite passed again. Build and artifact audit pass. Lint has zero errors and only the existing ExpandedPlot effect-cleanup warning; build retains its bundle-size advisory.

Fe exact counts: 422 Fe(0), 581 Fe(II), 1473 Fe(III), 89 Fe(VI). Cu exact counts: 1179 Cu(0), 156 Cu(I), 1230 Cu(II). The browser also completed the changed Cu example at total 0.002 mol/kg H2O, pH 2–12, Eh ±1.005715 V, 57×45 samples, and showed CALCULATED / INTERNALLY VERIFIED. It did not inherit the reference claim.

## Interface and scientific interpretation

Oxidation state remains the primary region color: slate for the lowest state, cyan-blue for the next, ochre for the third, purple for Fe(VI). Labels and inspection provide redundant identification. Color is categorical, not physical compound appearance. Water reference lines, hatching outside the water window, imposed-Eh assumptions and kinetic limitations remain visible.

A prominent carrier readout now shows exact source species identity, aqueous/solid type, percentage of the total conserved component carried by that species, dissolved percentage and scientific status. An expandable carrier table preserves aqueous protonation/hydrolysis and solid forms, source IDs and total-component denominators. Mixed-valence allocations are summed by stable carrier ID before displaying a species fraction, so magnetite is not counted as separate species or assigned only its predominant-state contribution.

Secondary encoding uses a carrier badge and inspection, not a rainbow of species or new inferred chemical labels. Browser examples demonstrate Fe(III) carried by aqueous Fe3+ at sample 2052 and by solid Fe2O3(cr) at sample 454, with the same Fe(III) map color. Full acid-base chemistry remains in the source-resolved carrier table; no name-based chemistry classifier was introduced.

Plot, inspection and Beaker retain the same accepted input/result. Browser evidence records matching input IDs for both Fe carrier examples and Cu reference/changed conditions. Keyboard ArrowRight moves sample 2052 to 2053; the focused regression verifies the exact result object is reused. Inspection performs no equilibrium solve. Existing compatible sweep view reuse and stale-result rejection remain unchanged.

Readiness is distinct from scientific result status:

- READY TO CALCULATE: preparation succeeds; calculation checks are still pending.
- REFERENCE VALIDATED: the exact independently benchmarked conditions and all checks match.
- CALCULATED / INTERNALLY VERIFIED: all internal checks pass, but these conditions lack an exact independent benchmark.
- UNSUPPORTED: defensible preparation or interpretation is unavailable.
- CHEMISTRY CONSTRUCTIBLE · METADATA PENDING: reaction-basis construction succeeds but authoritative oxidation allocations/support are incomplete.

Uranium shows the last state, with four source-connected redox forms, included solids and 30 unresolved source-record allocations disclosed. Those 30 entries are source records and may share display names. No U oxidation-state metadata was added and no public U map was enabled. The disclosure does not claim that arbitrary uranium conditions have been solved or independently validated.

## Browser acceptance evidence

The feature was exercised in the local in-app browser. Console error capture is empty. Desktop (1600 px), narrow desktop (1100 px) and mobile (390 px) have no horizontal overflow. At 390 px the page scroll width is 375 px, and the Beaker begins 16 px below the plot/inspection column. Controls wrap and remain keyboard accessible. Temporary viewport overrides were reset.

- A: [Fe map](experience-fe-map.png)
- B: [Fe selected carrier and matching Beaker](experience-fe-beaker.png)
- C: [Cu reference map](experience-cu-map.png)
- D: [Changed Cu conditions and internally verified status](experience-cu-changed.png)
- E: [Fe(III) aqueous carrier, same oxidation-state color](experience-fe-carrier-change.png)
- F: [Uranium metadata-pending disclosure](experience-uranium.png)
- G: [390 px mobile map](experience-mobile.png), [1100 px narrow desktop](experience-narrow.png)

[Machine-readable browser evidence](experience-browser.json) includes selection identities, carrier/inspection text, keyboard result and viewport measurements. Screenshots are viewport captures, so lower inspection/Beaker sections are shown separately rather than compressed into one long image.

## Exact changed files

Production: src/App.jsx; src/components/CalculationWorkspace.jsx; src/components/DiagramSwitcher.jsx; src/components/PourbaixSetup.jsx; src/components/PourbaixWorkspace.jsx; src/components/Pourbaix.css; new src/plots/pourbaixExperience.js.

Tests: tests/userPourbaix.test.js, with three focused additions reusing existing Fe/Cu grids.

Evidence: this report, pourbaix-experience-hashes.json, experience-browser.json and the eight experience-*.png screenshots. Local run logs and evidence utilities are under .local/pourbaix-experience and are not production dependencies. [Hash manifest](pourbaix-experience-hashes.json) records before/after checks for all 574 pre-existing files; scientific engine, source data, metadata and accepted scientific evidence remain byte-identical.

## Limits and next phase

Support remains single-family Fe/Cu oxide/hydroxide chemistry at Ideal 25 °C and 1 bar declared, with existing total-resolution, grid-size and preparation gates. Arbitrary totals do not acquire independent validation. Sampling limits boundary precision. Carrier changes within one oxidation-state region are exposed by selection/table, not a new internal boundary algorithm. Public uranium, multi-element overlays, kinetics, passivation, spontaneity and electrochemical cells remain out of scope.

Recommended next phase: authoritative, source-provenanced uranium oxidation-state allocations and an explicit bounded support contract, using the already accepted equilibrium evidence. No new uranium campaign was introduced here.

No deployment or remote push. Stopped for review.
