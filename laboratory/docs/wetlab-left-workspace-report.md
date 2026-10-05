# Wet Lab permanent apparatus / result placeholder

UI-only correction completed 2026-09-17.

- Existing rich WetLabVessel now stays in the left setup pane, beside the stock editors on desktop, before and after preparation. Its glass, liquid and accepted-inventory sediment renderer are unchanged.
- The exact supplied photograph appears in the right result workspace until preparation succeeds. It is explicitly an illustration, not a calculated state. Successful preparation opens the titration curve automatically.
- Cached Species, Fractions and Solids views keep the same left-hand apparatus and exact selected dose.
- Mobile stacks the apparatus and editors without horizontal overflow.

Validation:
- 27 focused tests passed across wetLabPrimaryAction, wetLabAnalysis, wetLabExperience and beakerPresentation. The first run had one source-pattern assertion fail after inserting presentation resets between two adjacent statements; resets were moved before the established preparation-completion sequence and all three primary-action tests passed on rerun. No test expectations were weakened.
- Production build passed. Existing large-chunk warning remains.
- Artifact audit passed. New image has an explicit size/hash manifest; all existing checks remain active.
- Lint: zero errors, one existing ExpandedPlot.jsx hook warning.
- Browser: exact 1128px source photograph loaded before preparation and disappeared afterward; exactly one live vessel remained on the left. At 50.00 mL, selected dose identity matched all five exposed data-state-id attributes. Switching Species / Fractions / Solids / Titration retained that identity and 107 equilibrium evaluations. Home / End selected 0 / 100 mL and updated vessel volume and pH. At 390px viewport, document client and scroll widths both 375px. No browser errors.
- Hash comparison across src, tests and public/data found only WetLab.jsx, WetLab.css and WetLabVessel.jsx changed. No calculations, solver, thermodynamic data, references, scientific tests or shared BeakerDrawing changes.
- Source photograph, public asset and built asset SHA256 all match: 7f3d8a0fc1c4612cd2a218bd91ea0fe83f89527dea4573ccfaee777c43f9ee80.

Additional files: public/artwork/wet-lab-preparation.png, scripts/public-wet-lab-preparation-manifest.json and its registration in scripts/audit-production-boundary.js. Validation evidence is in .local/wetlab-left-workspace/. The previous 773/773 scientific regression remains the last full-suite result; a full scientific rerun was not needed for this layout-only correction.

No deployment or push.
