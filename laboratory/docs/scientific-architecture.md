# Scientific architecture — Phase 8

## Live domain and data boundary

Elements → source component choices → available species → ChemicalSystem is the builder workflow. Elements, source components, products, analytical constraints and solvent are distinct. H₂O is solvent, H+ the proton component, and e− the electron component. Explicit selected roles determine coordinate capabilities. Removing a component removes incompatible conditions and invalidates results.

LaboratorySession owns ChemicalSystem, ThermodynamicDataSelection, CalculationDefinition, nullable CalculationResult, AnalysisState and VisualizationState. System and Calculation views share this session without a save/open handoff. Scientific edits increment revision and clear results. Internal serialization is separate from workflow; persisted results are discarded pending recalculation. Full untrusted interchange validation remains future work.

CalculationDefinition preserves T/TV/LTV/LA/LAV, units, output requests, fixed component conditions and independent-variable arrays. Point execution accepts fixed T/LA; sweep execution varies exactly one TV/LTV/LAV coordinate while retaining the other fixed conditions. Temperature and pressure are shared session conditions. Existing mol/L analytical element drafts are separate from source-component totals and are not converted automatically. The numerical amount convention is mol/kg H2O.

## Implemented point path

Repository/user selection → prepareSessionPoint → PreparedChemicalSystem → PointEquilibriumInput → solvePoint → PointEquilibriumResult → scientific validation → matching-revision session commit.

Preparation resolves ordered identities and signed source reaction coefficients; it does not reconstruct atomic composition, substitute reactions, combine constants or perform DBSearch redox closure. Missing source data, detectable direct basis dependencies and unsupported conditions yield diagnostics. ChemicalSystem remains a draft; a separate PreparedChemicalSystem establishes readiness only for the restricted selected system. No general independence proof is claimed.

Prepared systems and point inputs are immutable, SHA-256 identified numerical objects. The solver queries no repository and depends on no React component. At 25 °C and the declared 1 bar setting, it solves ideal log-activity mass action with kh=1 component balances and kh=2 imposed activities. Signed coefficients, electron/solvent suppression and pure-solid saturation/amount are explicit. Water requires logA=0; no water total is introduced.

The independently designed method uses analytic Jacobians, row scaling, damped Newton steps and deterministic absent/present handling for at most one candidate pure solid. Version 1.0.1 applies the existing Jacobian conditioning check before every convergence acceptance, including an initially zero residual; an undetermined activity is rejected with a typed failure. Numerical convergence, scientific residual acceptance and cross-implementation regression remain separate checks. Failed points have inspectable typed diagnostics and are not stored as successful point results. Results preserve prepared/input identity and revision; mismatched or stale results cannot commit.

See [Phase 5 report](phase5-report.md) for exact equations, method, limits, all five unchanged official comparisons and unresolved scientific questions. No Java reference source/classes or fixtures enter the production bundle. The application does not need Java.

## User source records and sweeps

Imported records and validated versioned user records compose into the same ThermodynamicRepository. User records reference existing component IDs; normalization resolves their exact names without changing signed coefficients or logK. Raw values and unverified provenance remain attached. Repository-facing preparation revalidates this source adapter and then uses the same ordered coefficient preparation and point solver. No numerical branch knows whether a record was imported or user-defined. Phase 8.2 adds explicitly entered ordinary aqueous component identities through the same repository contract. General arbitrary-basis proof, formula parsing and reaction normalization remain unsupported.

User source edits increment the scientific session revision and clear pending/accepted results. Source-only JSON import/export validates the version, identities, numeric values, terms and reference-state contract, and rejects result fields. Calculated results are never trusted on import. Source validation does not establish empirical accuracy, chemical completeness or atom balance.

`createSweepDefinition` validates and hashes a frozen scientific definition against a prepared system. Its inclusive ordered coordinates map individually via the existing source-input transformations. `runSweep` creates independent point inputs, invokes the same point solver, yields in bounded chunks and preserves every requested coordinate. Point failure, cancellation and invalidation remain distinct. Immutable SweepResult carries definitions, identities, revision, source provenance, full point outcomes, diagnostics and non-scientific timings. Session commit requires a branded result matching the pending system/definition/revision; stale results cannot commit. The temporary table renders this object without performing chemistry or generating curves.

## Phase 8.2: source providers and explicit user chemistry

The original Phase 8.2 development-only policy is superseded by the public release: the default provider fetches `BASE_URL + data/thermodynamic-default.json` in both environments. It supplies bytes to the same `loadSnapshotFile → repositoryFromSnapshot → createRepository` path as manual import. A shared promise validates once per page; manual override replaces the source and resets the draft. The explicitly selected publication asset preserves scientific fields and provenance, replacing only absolute archive locations with archive-relative identifiers. Exact data/artwork hashes and sizes are audited; unrelated private files, oracle tooling and fixtures remain excluded. No new redistribution-rights conclusion is made. See [public release report](public-release-report.md).

`userComponents.js` validates stable IDs, ordinary aqueous identities, explicit discovery associations and provenance, then composes them with the base repository. `composeUserEquilibria` remains the sole user-reaction adapter. Signed coefficients, logK and raw reference metadata remain unchanged. Collisions and removal of a component still required by a stored user reaction are rejected. Custom associations may extend discovery element identities, never imported thermodynamic records. All custom data remains USER-DEFINED / UNVERIFIED.

`prepareSessionStructure` reuses the chemical preparation body of `prepareSessionPoint` for the configuration handoff. It omits numeric-condition checks only for this structural review, never inserts placeholder constraints and never calls the point solver. The point/sweep/grid path still performs its original definition validation. Structural success is not equilibrium convergence, general basis-independence proof or empirical validation. A selected non-solvent component is additionally required for the UI handoff. Legitimate free-component systems do not require an invented product reaction.

New/reset actions advance scientific revision and clear results/pending requests. Ordinary source edits preserve the old plot snapshot as stale; removed IDs are reconciled. Graph visibility remains view-only. Persistence is deferred because `deserializeSession` is not a complete source-fingerprint-matched untrusted restoration contract. No imported dataset is placed in browser persistent storage.

Responsive geometry, collision-aware labels, logarithmic parameter mappings and export presentation remain downstream of accepted numerical results. Point mathematics, derived quantity formulas, unit conversions, tolerances, golden fixtures and the experimental classification policy are unchanged. Pourbaix and Phase 9 remain outside scope. See [Phase 8.2 report](phase8-2-report.md).

## Future boundaries

Basis preparation, thermodynamic evaluation, point solving, sweep orchestration, analysis and rendering remain separate responsibilities. The implemented preparer supports only direct 25 °C source reactions; general transformations and nonideal models require additional validated work.

Plotting and output transformations consume branded numerical results, preserve failed/cancelled gaps, and identify obsolete revisions. Debouncing is implemented; worker orchestration remains future work.

Calculation dimensionality and visualization dimensionality remain separate. One or two component-coordinate axes execute. Physical-parameter axes require tagged extensions and a validated thermodynamic evaluator. The grid result can supply later slices, surfaces and analyses without a separate chemistry engine; those consumers are not implemented here.

Pourbaix requires proton/electron capability, repeated validated equilibrium calculations and a declared predominance rule. No hard-coded boundaries are permitted. Renderer code must never calculate chemistry.

AnalysisEngine remains a boundary for extrema, crossings, precipitation onset, saturation boundaries and sensitivity on validated named quantities. Minimum single-species concentration, minimum dissolved component and maximum amount of a particular solid are distinct objectives. Refinement must preserve convergence, phase information and provenance; failed points must never be treated as zeros or extrema.

See the Phase 6 report for audit, hardening, sweep semantics and user-data proof. Phase 6 stopped before diagram outputs. The Phase 7 extension below adds supported 1D display quantities; optimization, nonideal models and general redox closure remain unsupported.

## Phase 7 extension: validated display boundary

The architecture above remains the numerical foundation. Phase 7 adds `calculations/outputs.js` after the branded `SweepResult`: it checks system/input/revision identities and successful point acceptance before producing nullable display series. It never solves a new point. Concentration/activity logs, nonnegative inventory fractions, dissolved inventory logs, pH and pe/Eh have explicit definitions and gap reasons; see `phase7-report.md`.

`plots/geometry.js`, `plots/export.js` and `ScientificPlot.jsx` receive display series only and do not import numerical preparation or solvers. Sample lookup is exact; straight visual segments never cross a missing sample. `PlotWorkspace.jsx` connects the transformation to the renderer and owns view choices through `visualizationState.plot`.

Scientific edits increment session revision and clear current results while retaining `lastPlot` as an explicitly old, immutable snapshot. The snapshot carries its own prepared system and sweep, so graph conditions and exports cannot silently inherit newly edited inputs. `calculations/liveRun.js` supplies debounce, abort and generation checks around the existing sweep engine. Only a matching branded result may replace a plot. All-failed new runs retain the old graph with separate diagnostics. Plot visibility, theme, output selection and navigation do not change chemical membership or invoke equilibrium solving.

The solver remains version 1.0.1 with unchanged scientific tolerances and golden references. No thermodynamic source values, closure models or production solver equations changed in Phase 7.

## Phase 8: units and sampled grids

`calculations/units.js` separates molality from molarity and scaled molarity. Scaling returns an explicit canonical value/unit and requested display unit. Cross-family conversion returns a typed unavailable result: source/session data do not provide a validated mass-of-solvent per solution-volume relationship. UI choices remain disabled where that physical information is missing. No scalar relabeling or implicit density is introduced into preparation.

The normal UI maps scientific labels to the existing low-level conditions. Axes occupy `independentVariables`; remaining conditions occupy `componentConditions`. A 2D request prepares one supported system, then `createGridDefinition` validates and brands a frozen definition containing both ordered coordinate arrays. Start/end order is retained. `runGrid` calls `toSourceInput`, `createPointInput` and the unchanged `solvePoint` at every coordinate. Maximum allocation is 10000 points. The row-major index is `iy * Nx + ix` (X varies fastest); point identity combines grid identity and index.

The branded `GridSweepResult` retains requested X/Y, transformed inputs when attempted, input identity, raw result or typed failure, revision, source identity, method and timings. Cancelled and invalidated runs preserve not-run coordinates. A generation change aborts pending work and prevents obsolete commits. The session retains its previous plot snapshot while inputs change. Cancellation is cooperative, not a worker interrupt: an in-flight solve may finish before the next check, but cannot commit as a superseded result.

`deriveGridOutputs` and `deriveOutputs` use the same private accepted-output implementation. Their entry gates require their respective branded result and matching prepared system. No Phase 7 output formula was replaced. Grid points add Y/index/identity and diagnostic context to the existing nullable values. The renderer receives only the derived model, uses flat cells and exact nearest-requested-sample inspection, and never interpolates equilibrium chemistry. Exports retain both raw grid data and derived values; SVG metadata identifies the plotted snapshot and view, but is not the full numerical package.

`classifyInventoryGrid` is an explicitly experimental consumer of validated component fractions. It compares the free target component and selected positive-coefficient products, including actual solid inventory. Absolute fraction ties within 1e-10 remain ties; unavailable candidates make the cell unavailable. This is inventory dominance, not Predom's documented solid-priority convention. Production Pourbaix stays disabled until independently validated pH/redox/phase classification is available. See [Phase 8 report](phase8-report.md) for source-document investigation, validation layers and remaining scope.


## Phase 8.3: repository-compatible membership

The modern workspace opts into repository-compatible-v1; the legacy manual initializer remains available for equivalence tests. thermodynamics/compatibility.js resolves selected IDs to exact component names and checks every nonzero signed source term, using shared formationSupport.js eligibility. It infers no formulas, redox closure, missing components or basis substitutions. The existing preparation gate still validates the combined basis, physical domain and limits.

Compatible aqueous records materialize into selectedSpecies. excludedSpecies and optionalSpecies separately retain deliberate aqueous exclusions and solid choices. Component/phase/source edits reconcile membership and invalidate scientific results. Element discovery and visualizationState.plot.visibleIds do not change chemistry or scientific revision. New system clears choices; Reset calculation preserves chemistry.

A repository-instance WeakMap holds one immutable catalog and the most recent selection result. Source replacement creates a new cache. Review reaction set exposes inclusion status and the existing source inspector; System and Calculation share its counts. Proton/solvent labels are view classifications from reaction terms and component roles, with no UI water constant. Preparation, point mathematics and output transforms remain unchanged. See [Phase 8.3 report](phase8-3-report.md) for exact equivalence, performance, browser evidence and limitations.

## Phase 9 scalar map and mass-input additions

The existing grid engine remains the sole 2D orchestration path into the unchanged point solver. `MapOutput` selects F from automatic chemistry before calculation; `GridWorkspace` derives current display quantities from canonical results. `scalarMap` supplies monotonic colors, masked visualization-only contours and explicit per-cell display states. Grid exports retain the raw lattice and selected derived F. User cancellation returns an inspectable partial current grid; scientific invalidation retains generation checks. View changes do not rerun chemistry. Large JSON previews are bounded without truncating exported artifacts.

`massConcentration` accepts explicit structured composition plus a sourced kg-water-per-L-solution basis for a fixed native total. It records/rechecks original input and conversion proof at the definition boundary. Conventional atomic weights have a CIAAW source; imported element associations are not atom counts. Approximate conversion, density-only inference and mass axes are unsupported. See [Phase 9 report](phase9-report.md) for evidence, scope and limitations.

## Phase 10 analysis

`src/analysis/` consumes accepted result/derived identities without invoking equilibrium calculations. Sample extrema exclude unavailable states, regions use requested adjacency, thresholds retain valid brackets/equalities without interpolation, and slices preserve exact parent-grid cells. `ScientificResultSummary` provides deterministic facts, diagnostics, conditions and provenance for exports and possible future interpretation; no AI service is present.

The explicit total-dissolved output uses the accepted aqueous component sum already produced from prepared stoichiometric coefficients. Linear/log amount pairs, individual aqueous amount and pure-solid amount remain distinct. UI domain edges describe sample availability only. See [Phase 10 report](phase10-report.md) for definitions, validation and limitations.

## Phase 11 response surfaces

GridWorkspace shares the existing GridResult, derived output and ScientificResultSummary between 2D and 3D. plots/surface3d.js prepares exact sample records and a conservative four-valid-corner topology. Three.js owns projection, ray picking and orbit controls in threeSurfaceRenderer.js; Surface3D and SurfaceControls own view state and accessible inspection. Camera changes do not reconstruct scientific outputs or invalidate calculation. The renderer has no solver imports.

Only polygon interiors and masked contours use visualization interpolation. Original sampled values, statuses and metadata remain intact. Phase 10 extrema and exact slices are reused, with non-data slice outlines at sampled coordinates. surfaceLifecycle catches capability failures; 2D inspection/export remains available. surfaceFigure produces a labeled raster figure separately from the existing numerical grid package. See [Phase 11 report](phase11-report.md).

## Phase 11.1 output identity and diagnostics

calculations/outputDescriptors.js supplies the shared selector catalog, per-series quantity identity and preflight validation of the actual visualization request. Source/system/definition validation is still separate and precedes calculation. Supplied analytical total reads an existing requested total constraint; dissolved output reads the accepted signed aqueous component sum. No elemental formula reconstruction or solver change is involved.

analysis/gridDiagnostics.js derives stable cell categories, raw evidence, representative indices and sampled-axis coverage from existing outcomes and the selected derived series. Unknown causes remain broad. GridDiagnostics and CellDiagnostic share this evidence across 2D and 3D; numerical grid export retains both raw results and normalized diagnostics. See [Phase 11.1 report](phase11-1-report.md) for the taxonomy, tests and scientific limitations.
