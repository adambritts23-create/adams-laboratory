# Adam’s Laboratory — public release preparation

The default normalized Spana/MEDUSA dataset now loads automatically in development and production from `/adambritts-site/laboratory/data/thermodynamic-default.json`. The separate 22,908,068-byte asset lives in `public/data/`; Vite copies it into `dist/data/`. Manual Choose database replaces the source and resets the draft without merging. Failed startup retains explicit errors and manual fallback.

Publish the complete contents of `dist/` at the site's `laboratory/` path, preserving Vite base `/adambritts-site/laboratory/`. This is a locally verified release preparation, **not a live deployment**. See [release report](docs/public-release-report.md) for 177 passing tests, exact changes, source attribution, artwork, retained unfinished trace work, and an unrelated output-switching UI crash.

Phase 11.1 adds shared output descriptors, explicit supplied-vs-dissolved totals, output preflight and structured grid diagnostics. Inspect failed or unavailable cells and expand **Grid diagnostics** for representative coordinates and sampled axis coverage. **172 tests pass**, including all five unchanged golden benchmarks. Solver mathematics and source constants remain unchanged. See the [Phase 11.1 report](docs/phase11-1-report.md).

React/Vite chemical-system builder with a read-only Spana importer, validated user-defined record handling, an independent restricted ideal point solver, and interactive 1D curves, 2D sampled maps and 3D response surfaces. Nonideal models, validated Pourbaix diagrams and general redox/basis transformations remain unsupported.

Phase 11 adds **3D Surface** beside **2D Map** for the same calculated grid. Orbit, zoom, exact point inspection, sampled extrema, masked contours, mesh display and exact slices change visualization only. Missing samples remain holes. PNG figures and numerical JSON are separate exports. **162 tests pass**, including all five unchanged golden benchmarks. See the [Phase 11 report](docs/phase11-report.md) for measured performance and limitations.

Phase 8.3 constructs supported aqueous reaction sets automatically from explicit component terms. Review reaction set exposes provenance and deliberate chemistry exclusions; graph visibility remains separate. Logarithmic controls show current decades and plots have integer grids with bounded labels. **122 tests pass**, including all five unchanged golden benchmarks and exact automatic/manual carbonate equivalence at all 51 pH points. See the [Phase 8.3 report](docs/phase8-3-report.md).

## Database workspace

Open **Database** to search reactions and references, add or edit a personal alternative, and choose active records. Component search accepts formulas, element symbols, and element names (for example, `cerium`). The editor reports atom and charge balance separately; unrecognised formulas remain review-only. Signed coefficients describe formation of one unit of product. Enter log K for that displayed direction.

New reactions and imported collections start disabled. Enable reviewed entries individually or by collection. **Prefer new data** selects the most recently added equivalent definition; incompatible reaction bases or reference conditions require an explicit conflict choice. Display filters do not change calculation inclusion. Source changes invalidate calculation results and restart the wet-lab workspace.

**Save / Save as** writes a library containing originals, additions, exclusions and conflict choices. There is no automatic persistence: save before refreshing or replacing the base. **Open / add database** adds a supported normalized reaction database, or restores a saved library. **Export active database** exports the selected calculation dataset. Raw Hydra binary files are not accepted by this interface. **Remove all non-Spana additions** restores the Spana selection and clears personal chemistry, without modifying existing files on disk.

Custom calculation support remains limited to the existing aqueous/solid formation solver at 298.15 K and its supported reference state. Optional temperature parameters are retained for review and are not automatically applied. No new uranium equilibrium data have been added.

## Run and verify

`npm run dev`, `npm run build`, `npm run lint`, `npm test`.

The production base remains `/adambritts-site/laboratory/`. Deployment configuration is preserved; Three.js is bundled locally for 3D rendering, with a 2D fallback when WebGL2 is unavailable. Ordinary use and tests do not require Java. Drafts live in memory; reloading or changing the database starts a new session.

## Calculate a supported point

1. The default source loads automatically. Use **Choose database** to deliberately replace it with another compatible complete normalized snapshot; this uses the same validation path and starts a new draft.
2. Select source components; supported directly compatible aqueous products are included automatically. Review the reaction set to exclude/restore products or deliberately include an optional solid. Element links are discovery metadata, not atom counts. H₂O is solvent; explicit H+/e− components enable activity coordinates.
3. Select **Continue to calculation** in the same session. Structural readiness does not guarantee numerical solvability. Select a calculation type and axis variables; enter remaining totals or activities beside the graph. Totals use mol/kg H₂O. The supported defaults are ideal activities, 25 °C and declared 1 bar; automatic ionic strength is not evaluated. No total concentration is assumed.
4. Select **Calculate**. For a standalone fixed-condition point, use **Advanced / diagnostics**. Unsupported definitions fail explicitly. Scientific changes invalidate results.

At most one candidate pure solid is supported. General independence/closure is not certified. Source thermodynamic values and provenance are preserved; missing metadata remains unknown. Demo constants remain null. The unimported legacy prototype is outside the active bundle.

## Run a sweep or add user data

Choose **1D speciation curves** and one variable: pH, pe/Eh when an electron component is selected, component activity, or total concentration on a linear/log scale. Enter increasing bounds and 2–10000 samples; keep other components fixed. Select **Calculate**. Hover/click to inspect actual samples; numeric sample selection supports keyboard inspection. Zoom, pan and reset change only the view. Zero logarithms and failed points remain explicit gaps.

After the first graph, fixed-condition edits automatically recalculate after a 350 ms debounce (unless disabled). The retained graph is marked stale and keeps its old conditions until an accepted replacement is ready. **Cancel** cancels pending work; the engine retains not-run positions internally and no superseded result can commit. Failed current runs have separate numerical diagnostics. Hiding a curve does not remove the species from chemistry; actual membership changes belong in System.

Supported outputs are log amount/concentration, log activity, nonnegative component distribution fractions, log dissolved component amount, calculated pH and calculated pe/Eh. Dissolved amount is not a general intrinsic-solubility calculation. Export **SVG** plus **numerical JSON** to retain the full quantities, conditions, identities, provenance and gaps. Drafts and exported results are not automatically reimported as trusted scientific state.

For **2D equilibrium map**, choose two distinct component variables and their start/end/sample counts. Both ascending and descending 2D axes are retained, with at most 10000 total points. Every coordinate invokes the same point solver; hatched cells have no accepted value. Click a cell or enter a sample index for exact inspection. The optional **Inventory dominance · experimental** display compares stoichiometrically weighted component inventory fractions, including actual solid amount. It is not a validated phase-stability or Pourbaix diagram.

Unit selectors distinguish mol/kg H₂O from M, mM, µM and nM. Molarity prefixes scale within their own family, but the current source/session has no supported solution-volume conversion information. Molarity choices are therefore disabled for molality results and inputs, with an explanation; no dilute-solution or 1:1 approximation is used.

In System, focus an element and choose **Define custom chemistry…**. Create explicit ordinary aqueous components where needed, then define a reaction using repository component IDs and your own explicitly sourced formation constant. Associations aid discovery; they do not infer atoms, oxidation states, charge, reactions or constants. Use existing proton/electron/water identities for special roles. Unknown charge/reference pressure stay null. Records are marked unverified; colliding identities are rejected and coefficients/logK are never normalized. Creation and selection are separate. Edit, duplicate, inspect or remove custom records in the editor. The versioned **Custom chemistry collection** JSON panel exports custom components/reactions only and validates them on import. Export before reloading or changing databases. Import replaces the user collection and rejects calculated-result fields.

Phase 6 verification: `node scripts/audit-phase6-underdetermined.js`, `node scripts/report-phase6-sweeps.js`, and (after build) `node scripts/audit-production-boundary.js`. The point solver now applies its existing Jacobian conditioning gate before accepting even an initially zero residual. No golden values or tolerances changed. See [Phase 6 report](docs/phase6-report.md) and [performance evidence](docs/phase6-performance.json).

## Configured local development source

**LOCAL DEVELOPMENT DATA MUST NOT BE ASSUMED REDISTRIBUTABLE.**

The ignored `.env.local` file contains:

```dotenv
ADAMS_DEV_DATA=.local/spana-components.json
```

This historical server-only configuration identifies the normalized source chosen for the public asset. It remains intact; the default client now uses the static asset in both environments. Regenerate deliberately with `node scripts/prepare-public-data.js`. Scientific records, constants and citations are preserved; only absolute archive-location prefixes and JSON whitespace change. No new legal claim about redistribution rights is made. Attribution remains separate from software licensing.

Run `node scripts/audit-production-boundary.js` after building. Exact data/artwork hashes and sizes in `scripts/public-*-manifest.json` allow only these selected static assets. Import-graph, local-path, oracle/fixture, unexpected-file and application-size checks remain. Startup shares one fetch and validated repository per page, with normal HTTP caching; data are not embedded in JavaScript.

**New system** clears selected chemistry/results while retaining the loaded repository and custom collection. **Reset calculation** retains selected chemistry while clearing calculation inputs/results and plot preferences. Automatic workspace persistence is deferred: matching source identities and validating untrusted restoration need a dedicated contract. The imported dataset is never stored in localStorage. Export custom collections before reloading or changing sources.

SVG/JSON export includes a save link and exact copyable contents for browsers that do not support automatic downloads. Exports retain their conditions/revision at export time; exported results are not accepted as trusted session state.

## Local import

To create another snapshot, choose a new output filename:

```powershell
npm run import:spana -- --archive 'C:\Users\adamb\OneDrive\Desktop\Eq-Diagr_Java.zip' --out .local/spana-next.json
```

Alternatively use `--folder` with an extracted directory. ZIP prefix defaults to `Eq-Diagr/`. Source files are never edited/extracted by this tool; existing outputs are refused. Generated database data remains in ignored `.local/` pending a separate redistribution decision.

## Architecture

- `src/thermodynamics/`: imported/user-defined source normalization, validation, composition and repository queries.
- `src/chemistry/`: ChemicalSystem and component capabilities.
- `src/session/`, `src/calculations/`: live revision-safe session, definitions, cancellable 1D/2D execution, unit families, shared validated derived outputs and experimental inventory classification.
- `src/solver/`: conservative preparation, immutable numerical inputs, independent point solving and scientific validation.
- `src/components/`: source selection, system/calculation views, fixed-condition controls, series visibility, interactive plotting and numerical inspection.
- `src/plots/`: numeric display geometry and self-contained SVG/JSON export; no solver imports.
- `src/data/`: element identities and non-thermodynamic demo fixtures.
- `scripts/`, `tests/`: import tooling, independent Java reference harness and verification.

All five official Java benchmarks pass unchanged Phase 4 limits. See [Phase 5 report](docs/phase5-report.md), [full numerical comparisons](docs/phase5-benchmarks.md), and [scientific architecture](docs/scientific-architecture.md). Phase [3](docs/phase3-report.md) and [4](docs/phase4-report.md) reports preserve the historical source investigation.

Phase 8: **90 passing tests**, all five unchanged golden benchmarks, build/lint and production-boundary audit passed. See [Phase 8 report](docs/phase8-report.md) and [performance measurements](docs/phase8-performance.json). Regenerate grid timing evidence with `node scripts/report-phase8-performance.js`; these are local Node timings, not browser paint guarantees. The [Phase 7 report](docs/phase7-report.md) preserves the 77-test baseline. No Phase 9 work or deployment was performed.

`node scripts/report-point-benchmarks.js` regenerates comparison reports only. Java golden regeneration is separate: prepare isolated classes with `scripts/prepare-java-references.ps1`, then deliberately use `npm run reference:java -- --replace-golden`. Never regenerate golden data to fit the production solver.

Phase 9 is complete: **136 passing tests**, five unchanged golden benchmarks, build/lint/audit passed. First-class F(X,Y) maps now include exact sampled inspection, masked failures, sequential color controls, optional visualization-only contours and complete numerical/SVG export. Fixed-total g/L entry requires explicit composition and solvent-mass basis; no dilute approximation. Pourbaix remains disabled pending independent classification validation. See [Phase 9 report](docs/phase9-report.md) and [measurements](docs/phase9-performance.json). Regenerate local carbonate timings with `node scripts/report-phase9-performance.js`.

Phase 10 is complete: **150 passing tests**, all five unchanged golden benchmarks, build/lint/production audit passed. Added explicit total-dissolved outputs, deterministic sampled extrema/coverage/failure summaries, conservative threshold brackets, exact 1D grid slices and view-only analysis markers. Solver mathematics/constants are unchanged. See [Phase 10 report](docs/phase10-report.md) and [analysis timings](docs/phase10-performance.json). This Phase 10 baseline is preserved by Phase 11; no deployment was performed.

## Closed redox mixing: iron and cerium

In Calculation, choose **Load Fe(II) + Ce(IV) mixing example**, then **Calculate closed equilibrium**.
This exposes the existing source-derived closed solver without selecting an electron or imposing pH/Eh.
The preset supplies 1e-6 mol/kg Fe(II), 5e-7 mol/kg Ce(IV), 0.01 mol/kg H+ and 0.010004 mol/kg Cl-.
Counterions are explicit: an unbalanced preparation is rejected, not silently repaired.
The initial aqueous preset checks excluded solids and gases before accepting its result. Supported pure-solid closure is selectable.
Current scope remains the pinned Spana snapshot, ideal activities, 25 C, 1 bar and unit water activity; this is equilibrium, not kinetics.

The iron/cerium benchmark uses 47 aqueous source laws. It gives pH 2.00085422 and Eh 0.75177768 V vs SHE.
Tests independently check both metal inventories, charge conservation, dose response and the free-ion net quotient
log10([Fe(III)][Ce(III)]/[Fe(II)][Ce(IV)]) = 29.08 - 13.051 = 16.029.
Hydrolysis and complexes mean free-ion amounts are not total oxidation-state amounts.
Run: node --test --test-isolation=none tests/ironCeriumMixing.test.js tests/generalClosedReagents.test.js

## Wet Lab redox titration

Wet Lab has separate **Acid/Base Titration** and **Redox Titration** tabs. Each retains its own setup and prepared results when switching.
The redox tab starts with an explicit electroneutral Fe(II)/Ce(IV) ionic preset (50 mL sample, 100 mL available titrant).
Use the same Prepare experiment, burette increments, Apply volume, reset, and calculated-dose selection controls.
Closed-redox experiments default to Eh versus delivered volume; the Graph selector also offers pH and species views.
Every displayed Eh belongs to the same accepted mixed-solution equilibrium as pH and the beaker. Missing/non-redox results do not invent a potential.
The existing Calculation closed-redox example remains available.

### Simplified Redox: automatic fictitious countercharge

Wet Lab has an independent **Simplified Redox** tab alongside the physical Redox Titration tab. Its ionic stocks receive a fixed, opposite inert background charge automatically; aliquots and mixtures transport and dilute that background. It is not chloride, nitrate, a source species, or an adjustable charge correction. Reactive charge is conserved and the total charge residual is checked at every accepted equilibrium. No manual counterions or electron selection are required. This is an ideal-activity model: fictitious counterions contribute no complexes, redox reactions, or activity correction. Physical preparations retain their explicit electroneutrality requirement.

The default test uses 50 mL of 0.6 mM Fe(II), titrated with 0.1 mM dichromate; both stocks contain 100 mM supplied H+. It uses existing source equilibria, including dichromate record `spana:2ac52a30213c9288:94892`, without adding fitted constants. The net reaction is:

Cr2O7(2-) + 14 H+ + 6 Fe(2+) = 2 Cr(3+) + 7 H2O + 6 Fe(3+).

The independent combined log K is 59.854. At 25 mL added, approximately 15 micromoles of the initial 30 micromoles Fe(II) remain; the supplied 2.5 micromoles dichromate are reduced. The nominal stoichiometric equivalence volume is 50 mL. Tests verify the free-species reaction quotient, charge, conserved inventories, dilution, and physical-mode rejection of incomplete stocks.

This remains full thermodynamic equilibrium, not a kinetic titration model. In particular, beyond iron equivalence the source network permits excess dichromate to oxidize water; its post-equivalence curve should not be interpreted as a validated experimental dichromate titration curve.


### Repeated redox calculation performance

Closed reagent calculations reuse verified aqueous source structures within an immutable repository snapshot (at most 32 templates per snapshot). The key includes the complete scope, chosen basis and ordered supplied identities. Every dose still rebuilds its exact inventories, charge policy, constraints, revision and preparation provenance, then independently solves and validates equilibrium and phase closure. Changed scopes or databases cannot reuse the old source template; mutable repository adapters always take the full verification path.

Run `node scripts/benchmark-wet-lab-redox.mjs` from the project root to time the 101-point copper(I)/dichromate Wet Lab example. It reports preparation time separately from curve time and fails if any point is unavailable. `tests/redoxPreparationReuse.test.js` compares cached and uncached results exactly at seven doses across equivalence and copper precipitation, and checks basis changes, charge rejection and revision identities.
