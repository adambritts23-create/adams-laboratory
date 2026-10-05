# Phase 2 completion report

## 1. Files added

- `src/components/NumberField.jsx` — shared numeric/null input.
- `src/components/RedoxControls.jsx` — explicitly future-only redox inputs.
- `src/components/SpeciesDetails.jsx` — record metadata and provenance inspection.
- `src/chemistry/format.js` — oxidation-state display formatting.
- `src/chemistry/validation.js` — ChemicalSystem validation.
- `src/thermodynamics/schema.js` — extensible species defaults, phase and activity-model identifiers.
- `src/thermodynamics/validation.js` — record/dataset diagnostics.
- `src/thermodynamics/repository.js` — validated snapshot service and queries.
- `src/thermodynamics/index.js` — application data-provider composition root.
- `src/thermodynamics/repository.test.js` — repository and query regressions.
- `src/thermodynamics/validation.test.js` — scientific-record validation regressions.
- `src/thermodynamics/importers/pipeline.js` — generic adapter orchestration, no external parser.
- `src/thermodynamics/importers/pipeline.test.js` — provenance and failure-path tests.
- `src/solver/contract.js` — future request contract and unimplemented status.
- `docs/scientific-architecture.md` — scientific semantics and schema reference.
- `docs/importers.md` — adapter contract and MEDUSA/DataBase prerequisites.
- `docs/phase-2-report.md` — this report.

## 2. Files modified

- `src/App.jsx` — wires the domain model and repository into the interface; keeps feedback outside the scientific model.
- `src/App.css` — browser, details, filtering and shared control styling.
- `src/components/ElementSelector.jsx` — discovery semantics and implicit solvent H/O.
- `src/components/AvailableSpecies.jsx` — phase/text/oxidation browser with selected-species access and details.
- `src/components/SystemDefinition.jsx` — analytical constraints, solvent, pH modes, pressure, activity/redox and phase controls.
- `src/data/elements.js` — adds F and Ca to the compact subset.
- `src/data/species.js` — replaces simplistic records with 20 schema-based, non-thermodynamic fixtures.
- `src/chemistry/system.js` — replaces the dataset-coupled reducer with a React-independent ChemicalSystem and transitions.
- `src/chemistry/system.test.js` — updates and expands system regressions.
- `package.json` — adds `npm test`; dependencies unchanged.
- `README.md` — current workflow, architecture, status and documentation links.

Generated production output was rebuilt in `dist/`: `index.html`, `assets/index-BfIrdCnA.css`, `assets/index-6pqCAMQa.js`, plus Vite's copied public assets. Previous generated bundles were replaced by the build.

`vite.config.js`, the entry point, global `src/index.css`, dependency lockfile and unused legacy prototype were not edited. The deployment base remains `/adambritts-site/laboratory/`. No deployment was published.

## 3. Architecture changes

UI edits ChemicalSystem; repository queries supply species identities and scientific records. A future solver consumes a resolved ChemicalSystem and validated thermodynamic records, then supplies results for visualization. Only UI, draft domain model, local repository, validation and import orchestration exist now.

React components do not import the demo species array. `src/thermodynamics/index.js` selects the provider. Components receive records and callbacks, while domain functions receive a repository dependency.

## 4. ChemicalSystem model

The serializable version-1 model contains selectedElements, selectedSpecies IDs, analyticalComponents, null componentBasis, explicit solvent, fixed/range pH, temperature, pressure, automatic/fixed ionic strength, requested activity model, future redox modes and enabled phases. Units are explicit.

H₂O is a liquid solvent record; H/O are implicit discovery elements. No arbitrary H/O totals are requested. Selected solutes create draft analytical element totals for other elements. This does not construct a reaction basis or establish independence. Removing elements or disabling phases prunes incompatible solutes and orphan constraints. Browser filters retain selections.

## 5. Thermodynamic species schema

Records support identities, display formula, phase, role, charge, atom counts, oxidation metadata, component coefficients, formation reaction, logK/convention, temperature/pressure reference, temperature model, activity compatibility, source IDs/citation, notes, quality flags, deprecation, metadata and provenance.

Oxidation metadata can describe mixed valence with per-state atom counts; absent information remains unknown. Thermodynamic fields in every demo record remain null. Additional fixtures exercise Fe(II)/Fe(III), multiple element combinations and all four phases without equilibrium constants.

## 6. Repository design

The synchronous snapshot interface exposes elements, sources, phases, species, ID lookup and element/phase/oxidation queries, plus composable text filtering. Dataset validation happens before construction. Source registry identities are checked. Inputs are cloned into a snapshot and query results are copies, protecting provenance from mutation.

Storage-specific loaders can supply validated snapshots later. Asynchronous loading and UI error presentation for a backend are future work; no backend or external database dependency was introduced.

## 7. Validation design

Record diagnostics identify record ID, field path, severity and cause. Checks cover duplicate IDs, phases, finite charges, valid atom counts, known element symbols, oxidation-state representation/counts, finite numeric-or-null thermodynamic values, reaction/model structure, provenance and source identities. Demo constants are rejected, including an accidental original logK.

A non-null imported constant requires supporting reaction/convention/reference conditions/citation and original value. Structural validation cannot establish authenticity or chemical correctness. Ambiguous records are not silently repaired.

System checks cover IDs, compatibility, phases, solvent, analytical constraints/units, finite and ordered pH inputs, temperature/pressure, fixed ionic strength and future redox/activity inputs. These are draft checks, not solver-readiness certification.

## 8. UI changes

- Compact element discovery table includes implicit H/O and adds F/Ca.
- Scientific browser filters by compatibility, phase, text and available oxidation states.
- Species show formula, charge, phase and known oxidation metadata.
- Expandable details expose the complete normalized record and provenance, including null logK.
- A separate selected-species disclosure allows deselection when browser filters hide records.
- System controls separate solvent, analytical totals, pH modes and future activity/redox conditions.
- Calculate validates the draft and explicitly reports that no calculation occurred.
- Existing dark charcoal/green identity is retained; no animation or decorative graphics were added.

## 9. Tests performed

Final commands passed:

- `npm run build` — static production build succeeded.
- `npm run lint` — no lint errors.
- `npm test` — 11 passing tests, zero failures.

Coverage includes implicit H/O discovery; analytical constraint derivation; element/phase selection cleanup; both pH modes and invalid scalar/range inputs; generic element, phase, text and oxidation queries; mixed-valence/unknown filtering semantics; provenance mutation isolation; source registry validation; invalid scientific records; duplicate IDs; raw import preservation; unsupported/malformed rows; parser failure and context mismatch.

Browser checks at the configured base path confirmed: app rendering; selection of uranyl carbonate creates only C/U totals; fixed pH and ionic strength controls appear; valid draft submission reports the unimplemented solver; Fe text search and Fe(III) filtering work; details show null logK and demo provenance. A desktop screenshot was inspected for readability. Responsive CSS is retained, but no separate mobile viewport session was run.

## 10. Scientific ambiguities deliberately left unresolved

No independent basis or mass-balance rank analysis; no water/proton balance, solvent activity or standard-state assumption; no carbonate master-species mapping; no oxidation-specific analytical totals; no electron balance or Eh/pe conversion; no gas fugacity/open-system inventory semantics; no chemical reaction balance verification; no activity coefficients; no thermodynamic corrections; no equilibrium outputs.

No actual MEDUSA/DataBase format is present, so no format-specific importer was implemented. Nothing was scraped or downloaded. Existing prototype constants were not treated as sourced thermodynamic data. There is no fake solve function.

## 11. Recommended next step

Obtain a user-provided, licensed database sample and its actual format/version documentation. Implement a fixture-tested importer that preserves source records and verifies documented units/reaction conventions, with explicit diagnostics for unsupported entries. In parallel at the design level, specify the independent component basis, solvent/proton treatment, charge balance and redox constraints. Only then begin a solver with independently verifiable reference cases.
