# Phase 8.2 — default chemistry workspace and graph instruments

Completed locally on 2026-09-06. Continued the Phase 8.1 application in place. **No equilibrium equations, mass balances, active-set behavior, tolerances, source constants, pH/pe/Eh transformations, derived-output formulas, unit conversions or golden fixtures were changed. Pourbaix remains disabled. No Phase 9, 3D, nonideal model or extrema search was implemented. Nothing was published.**

## Baseline and final checks

The actual Phase 8/8.1 reports, README, repository and snapshot validation, source loader, ChemicalSystem/LaboratorySession, calculation definitions, user records, units, plots and tests were inspected before editing. There is no Git metadata in this workspace; changes were made in place without resetting files or recreating the project.

| Check | Before editing | Final |
|---|---|---|
| `npm test` | 97 passed | **111 passed**, no failures/skips |
| Five official golden comparisons | Passed | Passed unchanged |
| `npm run build` | Passed, 70 modules | Passed, 81 modules |
| `npm run lint` | Passed | Passed |
| `node scripts/audit-production-boundary.js` | Passed | Passed, expanded artifact checks |
| JavaScript / gzip | 334.60 / 102.67 kB | 354.26 / 107.85 kB |
| CSS / gzip | 20.01 / 4.93 kB | 22.56 / 5.45 kB |

The golden SHA-256 remains `aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`. All five official cases and the permanent unconstrained-electron rejection remain in the suite. No Java reference capture was regenerated. The solver remains version 1.0.1. Dependencies, package scripts, static deployment and the Vite base `/adambritts-site/laboratory/` are preserved.

## Startup and source boundary

Previously the application opened with an unavailable-looking periodic table until a user manually located a large normalized snapshot. The new development source mechanism makes this configuration infrastructure rather than a repeated file-picker workflow.

**LOCAL DEVELOPMENT DATA MUST NOT BE ASSUMED REDISTRIBUTABLE.**

The ignored `.env.local` configures `ADAMS_DEV_DATA=.local/spana-components.json`. The variable deliberately has no `VITE_` prefix. `scripts/development-source.js` is server-only and registered with `apply: 'serve'`. It serves a single configured file at a fixed endpoint, accepts GET/HEAD, checks loopback address, Host and supplied Origin, sets `Cache-Control: no-store`, and returns generic errors without disclosing the configured path. URL parameters cannot choose another file. Missing/unconfigured data produces explicit failure status and a manual chooser.

`createDefaultSourceProvider` separates transport from source interpretation. Concurrent subscribers share one load promise per page, avoiding duplicate fetch/parse in React StrictMode. Component lifecycle/generation checks prevent an obsolete automatic completion from replacing a later source choice. The provider feeds the same `loadSnapshotFile → repositoryFromSnapshot → createRepository` path as manual import. Progress reports loading and validation before readiness; failures do not become a ready repository. The normal LaboratorySession is initialized from the validated result.

Production has no configured distributable default source. Vite eliminates the development transport, and the build opens with a useful database chooser and custom entry. No snapshot was imported into React, copied to `dist`, compressed into an asset or published. `.gitignore` is unchanged. A future permitted source can provide bytes through the same provider contract without replacing the chemistry pipeline.

The strengthened audit traverses the production import graph and all generated files. It rejects local source paths/endpoints, actual local database fingerprints, unreviewed artifact types (including compressed/binary payloads), oversized assets and unexpected total size. The inspected build contains **5 files totaling 391,933 bytes**, all HTML/JavaScript/CSS/SVG; no snapshot or equivalent large payload. Audit tests deliberately exercise forbidden filenames, local paths, fingerprints, compressed files and oversized embedded content.

## Source management and periodic-table workflow

The source status is compact and uses actual counts: **4,445 application species records = 4,444 imported records + 1 explicit water identity**, with **168 component forms**. Source details retain import diagnostics, original source manifest/fingerprints, load time and loading measurements. Loading does not certify redistribution rights or empirical accuracy.

All 118 element buttons are focusable. Repository availability is independent of focus and chemical selection. In this source, 84 elements have component associations and 34 have none. Clicking carbon shows actual source forms such as carbonate, formate and acetate; no form is selected automatically. Special H+/e−/water choices remain distinct. Multi-element forms explain which additional discovery elements are needed rather than inventing their chemistry.

Clicking an unavailable element focuses it, explains the repository limitation and offers **Define custom chemistry…**. Focused element context can populate explicit association fields only after the user chooses that convenience action. It never creates a formula, coefficient, charge, oxidation state, phase or constant. Fresh workspace discovery is neutral rather than preselecting the legacy U/C demo; the established proton/solvent initialization remains.

The selected-system tray groups discovery elements, ordinary basis components, special components, solvent and actual product species. Removals are deliberate buttons and follow normal scientific revision/invalidation. Creating a custom record does not select it. Curve visibility remains a separate view operation.

## Custom components and reactions

`userComponents.js` extends the repository-facing source architecture. It accepts versioned, explicitly named **ordinary aqueous basis choices** with stable IDs, explicit element associations, user-defined source type, citation, notes and creation/edit timestamps. The existing component schema does not require a charge field; none was fabricated. Element associations are discovery metadata, not atom balances. Existing special identities must be used for proton/electron/solvent roles. Solid/gas basis components and arbitrary role flags are rejected.

The adapter preserves the imported catalog and adds only explicit custom component identities/discovery links. `composeUserEquilibria` is still the sole user-reaction adapter. A custom component can participate in the same preparation/point path, demonstrated with the unchanged official AgCl formation constant and explicit Ag+/Cl− terms. This proves pathway support, not general chemical correctness or arbitrary-basis independence.

The reaction editor now supports inspect, edit, duplicate and remove, explicit signed component terms, product identity/display, aqueous or solid phase, logK at 298.15 K, optional charge, unknown or explicitly declared 1 bar reference pressure, citation and notes. Missing logK is rejected. No value is fetched, inferred or normalized. Duplication keeps the explicit scientific fields but requires a new product/component identity. Raw values and provenance remain inspectable; all custom records are **USER-DEFINED / UNVERIFIED**.

Component/species names and IDs cannot silently collide with imported or other custom records. Removing a component required by a stored custom reaction fails with an unknown-component diagnostic; remove or explicitly edit the dependent reaction first. Source edits advance scientific revision, invalidate current results/requests and retain the old plot as stale. Removed component/species IDs and conditions are reconciled.

The versioned `adams-user-chemistry` collection exports custom components/reactions only. Import fully validates it against the current base repository and rejects session/result fields, collisions and missing dependencies. The existing `adams-user-equilibria` source-only format remains supported. Source values and provenance round-trip unchanged. The collection feature does not export the imported database.

## Handoff and session semantics

**Continue to calculation** uses `prepareSessionStructure`, which reuses the exact chemical preparation body of the point path without constructing numeric point constraints. It checks actual source support, direct terms, basis dependencies, phase restrictions and preparation limits. No dummy total/activity is supplied to pass readiness. Success means configuration can continue, not that an equilibrium has been solved. Full point/sweep/grid preparation still applies the existing numeric definition checks. The UI additionally requires a non-solvent component. Valid free-component systems do not need an invented product reaction merely to enable the handoff.

**New system** clears discovery, non-solvent component/product selections, calculation definitions/results and plot state while retaining the loaded repository and custom collection. The water identity remains. **Reset calculation** retains chemical membership and restores blank user constraints/default calculation settings, clearing results, pending work and plot preferences. Both increment revision and cancel pending live work.

Workspace persistence was investigated and **deferred deliberately**. The existing `deserializeSession` rejects some shapes and clears results, but does not establish full source-fingerprint/version matching or comprehensive untrusted nested-definition validation. Automatically restoring such a document could attach old IDs/conditions to changed sources. There is no localStorage/IndexedDB copy of the imported dataset and no automatic restoration of calculated values. Export custom collections before reload or source replacement; changing source starts a new draft.

## Graph presentation and interaction

The existing graph-first toolbar remains. Responsive SVG geometry increases plotting height on desktop/laptop displays; it is presentation-only and also used for exact pointer mapping, crosshair geometry and SVG export. The fixed-condition rail visually shares the graph background/boundary. Totals use vertical logarithmic bars with pointer dragging, arrow-key control and authoritative numeric entry. Convenience ranges expand to include out-of-range typed values rather than clipping the typed scientific input. Zero/blank invalid totals do not receive a logarithmic bar. No UI component solves equilibrium.

The existing 350 ms debounce, generation checks, cancellation and stale-result behavior remain unchanged. No intermediate chemistry is interpolated. Labels use exact sampled endpoints, separated label positions and leader lines; crowded plots fall back to the interactive legend. Integer log ticks and canonical identifiers remain unchanged.

Free component curves still originate from accepted **free concentrations**, not analytical totals. The carbonate curve is labeled **Free CO₃²⁻**; the rail and figure conditions explicitly label **component total**. The fixed total is not manufactured as a calculated species curve. Molality remains mol/kg H₂O, and unsupported M/mM/µM/nM conversions remain disabled.

SVG and numerical JSON retain their existing scientific content. An export panel now exposes an exact read-only document, save link and copy action, with snapshot filename/revision. This was added because the in-app browser did not report automatic Blob downloads. Exact SVG/JSON generation and copying were verified; a filesystem download from this browser was not confirmed. The panel retains the document as requested, rather than silently updating an already exported snapshot.

## Concrete browser verification

The built-in browser was used against `http://127.0.0.1:5173/adambritts-site/laboratory/` and a temporary production preview on port 4173. Temporary viewport overrides were reset and the development tab was left open. No browser console errors were recorded. One automation call timed out; the existing tab was recovered through DOM inspection, without restarting the project or repeating data import.

1. Fresh startup visibly reported **Loading thermodynamic source…**, then **Database ready · 4,445 species records**, without a file picker. Validation-stage sequencing is additionally covered by the provider/loading tests. Reload again auto-loaded the source. Source details reported the actual 4,444 + 1 split and 168 forms.
2. Clicking C showed real component forms. H+ and water were already selected through the established initialization; carbonate was explicitly checked. HCO₃− and OH− became selectable and were included. The tray and structural handoff correctly reflected that system.
3. Helium showed **No component data for He in the current database** and opened custom chemistry. An explicit He component was added, visibly marked USER-DEFINED / UNVERIFIED, edited, duplicated into a blank-name draft and removed. No He thermodynamic constant was assigned.
4. An incomplete He reaction with an explicit term and blank logK was rejected with **invalid-logK: A finite numeric log10 formation constant is required.** It was not stored as solver-ready.
5. A disposable user bicarbonate record was entered through the same editor using only the inspected source record's exact coefficient/logK definition and explicit attribution. It was marked unverified and removed before calculation. No new thermodynamic value was invented.
6. Continued to Calculation: 1D, log amount/concentration, pH 0–14, 51 samples, carbonate total 0.001 mol/kg H₂O. Exported numerical data confirmed **51 requested, 51 converged, 0 failed, 0 not run**. Integer ticks included −3. The free carbonate curve and component-total condition had distinct labels.
7. Keyboard adjustment changed the total to `0.001122018454301963`; the graph immediately remained present with **OLD conditions**/updating status and stale metadata. The accepted replacement carried that exact condition. Pointer dragging then changed the total to `0.0044668359215096305`, again retaining the graph while updating.
8. Typed `0.0012345678901234567` remained exact in the input and accepted graph conditions. Hiding/showing Free CO₃²− changed visibility but kept scientific revision **20**. Both numeric and pointer pinning selected sample 25 at exact pH 7; inspection showed full-precision values. Zoom/pan altered view bounds; Reset restored pH 0–14. The requested 0.001 total was restored before final export.
9. SVG export contained conditions and labels. Numerical export was inspected through the visible export textarea: `adams-scientific-1d-export`, revision 21, stale false, 51 outcomes and the correct 0.001 molal condition. **Copy export contents** reported success. Automatic download events were unavailable, so no unsupported download-success claim is made.
10. Reset calculation removed the plot and cleared user input values while preserving carbonate/H+/water and both products. New system kept the ready 4,445-record source while clearing discovery/products/non-solvent choices; Continue explained the need for a non-solvent component. Reload produced neutral discovery with the source automatically ready again.
11. Production preview showed **No database loaded**, an explicit chooser, zero data-backed available elements, and custom entry. No default local source was loaded. The temporary preview tab was closed.

### Measured geometry

| Viewport | SVG figure top | Figure width × height | Observation |
|---|---:|---:|---|
| 1440 × 900 | 253 px | 1164 × 685 px | Graph dominates central workspace; rail 205 px wide, attached at x=1200; vertical bar 220 px high |
| 1024 × 768 | 253 px | 768 × 553 px | Graph and 185 px rail remain beside each other; no document horizontal overflow |
| 390 × 844 | about 460 px | 339 × 176 px | Controls stack, rail moves below; no document horizontal overflow; small-screen graph is an overview |

At 1440 × 900 the figure occupies about 62% of the full viewport area (about 58% visible before scrolling); the actual plotting rectangle is approximately 925 × 498 px, versus approximately 925 × 417 px in Phase 8.1. The figure height increased from 604 to 685 px, with approximately 19% more vertical plotting area. Footer conditions can require a short vertical scroll; total and physical assumptions remain visible in the rail/setup. Phone typography remains a limitation; exact sample inspection and exports provide readable numeric access. Desktop/laptop remains the primary scientific workspace.

## Performance evidence

Reproducible local Node measurements are stored in [phase8-2-performance.json](phase8-2-performance.json), generated by `node scripts/measure-phase82.js`. The file contains timings/counts only, not the imported payload or reaction constants.

| Operation | Representative measurement |
|---|---:|
| Snapshot size | 36,269,385 bytes |
| Browser auto-load, fetch through validated repository | 1109.3 ms |
| Browser text read / parse / repository validation+construction | 188.1 / 142.5 / 440.6 ms |
| Independent Node dataset validation, 3-run mean | 28.62 ms |
| Node repository construction including validation/isolation, 3-run mean | 180.14 ms |
| Availability from cached component records, 100-run mean | 0.023 ms |
| Carbonate candidate filtering including returned copies, 30-run mean | 2.70 ms |
| Custom-component collection rebuild, 3-run mean | 420.11 ms |
| Custom-reaction collection rebuild, 3-run mean | 683.28 ms |
| Combined component/reaction rebuild, 3-run mean | 1760.36 ms |

Repository construction includes required validation and defensive structured cloning. Validation is also measured independently, not subtracted to claim an exact decomposition. The source is parsed once per page load; component/catalog copies are memoized by repository generation and candidates by system/repository. Normal live parameter changes do not parse or rebuild the source. Custom collection commits still rebuild isolated repositories and can pause the UI, especially when both custom components and products exist. An immutable overlay/worker is a future optimization, not a reason to skip validation here.

## Test coverage and limits

Fourteen new tests bring the total from 97 to **111**. They cover the default provider/shared load/stages, production absence and failure paths, loopback middleware, path/size/artifact exclusions, available/unavailable discovery, custom component domain/provenance/collisions, missing logK, source-only round trips, the same custom point path, actual multiple-solid diagnostics, source edit invalidation/removal reconciliation, view-only revisions, New/reset semantics, exact logarithmic controls and label collision handling. Existing integer-tick/free-total tests and every previous scientific test remain unchanged.

**Scientifically validated:** the existing restricted numerical core and outputs against their unchanged tests/five golden cases. **Structurally supported:** explicit ordinary custom component identities and user reaction records in the existing direct-basis contract. **User-defined/unverified:** every custom record, even when preparation/calculation succeeds. **Unsupported:** general arbitrary-basis proof/closure, nonideal activities, gas fugacity, general simultaneous multiple solids, temperature/pressure extrapolation, molarity conversion without physical data, validated Pourbaix, 3D and analytical extrema.

Persistence, empirical source verification, redistribution clearance, repository-overlay optimization and a richer phone plotting layout remain future work. This phase does not represent a generally validated chemical database or general-purpose equilibrium formulation.

## Exact file changes in this phase

Modified:

- `vite.config.js`
- `scripts/audit-production-boundary.js`
- `src/App.jsx`, `src/App.css`
- `src/components/DatabaseSource.jsx`, `src/components/databaseLoading.js`
- `src/components/ElementSelector.jsx`, `src/components/ComponentSelector.jsx`
- `src/components/UserEquilibria.jsx`, `src/components/FixedCondition.jsx`
- `src/components/ScientificPlot.jsx`, `src/components/GridPlot.jsx`
- `src/components/PlotWorkspace.jsx`, `src/components/GridWorkspace.jsx`
- `src/session/laboratorySession.js`, `src/solver/prepareSession.js`
- `src/thermodynamics/userEquilibria.js`
- `src/plots/geometry.js`, `src/plots/export.js`, `src/plots/gridView.js`
- `README.md`, `docs/scientific-architecture.md`

Added:

- `.env.local` (ignored, server-only local configuration)
- `scripts/development-source.js`, `scripts/production-artifacts.js`, `scripts/measure-phase82.js`
- `src/components/defaultSource.js`, `src/components/UserComponents.jsx`, `src/components/UserChemistry.jsx`
- `src/components/SystemReadiness.jsx`, `src/components/SelectedSystem.jsx`
- `src/components/usePlotBox.js`, `src/components/ExportPanel.jsx`
- `src/chemistry/elementInteraction.js`, `src/thermodynamics/userComponents.js`
- `src/plots/parameterScale.js`, `src/plots/labels.js`
- `tests/phase82Helpers.js`, `tests/phase82.test.js`
- `docs/phase8-2-performance.json`, `docs/phase8-2-report.md`

The ignored `dist/` build artifacts were regenerated. No imported snapshot, source archive, golden fixture, dependency manifest or lockfile was changed. Stop after Phase 8.2.
