# Phase 8 — scientific workspace, units and validated sampled grids

Completed locally on 2026-09-06, including the C4 usability addendum. Continued the Phase 7 application in place. **Production Pourbaix remains DISABLED.** A reusable 2D equilibrium grid and an explicitly experimental component-inventory classification are implemented. No Phase 9 work was started.

## Baseline and final verification

| Check | Phase 7 baseline, before edits | Final Phase 8 |
|---|---|---|
| `npm test` | 77 passed | **90 passed, 0 failed, 0 skipped** |
| Five official golden comparisons | Passed | Passed, unchanged fixtures and tolerances |
| `npm run lint` | Passed | Passed |
| `npm run build` | Passed; 57 modules | Passed; 66 modules |
| `node scripts/audit-production-boundary.js` | Passed | Passed |
| Main JS / gzip | 309.46 / 95.50 kB | 331.86 / 101.13 kB |
| CSS / gzip | 8.35 / 2.49 kB | 10.97 / 3.01 kB |

Final build: Vite 8.0.13, `index-BaTzSqBJ.js`, `index-DxSHj83w.css`; reported build duration 294 ms. Test runner reported 1753.2 ms for the final complete suite. Build/test/lint ran independently in parallel; performance measurements below ran afterward.

SHA-256 of `tests/fixtures/eq-diagr/references.json`, checked before and after changes:

`aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`

No Java captures were regenerated. The five point cases, previous scientific acceptance checks and permanent underdetermined-component rejection still pass. The point solver is still version 1.0.1; no point equations, conditioning thresholds, thermodynamic constants or golden limits changed. No benchmark-specific production code was added.

The baseline inspection covered the Phase 5–7 reports, scientific architecture, README, source/session/preparation/sweep/output/rendering code and existing tests. The supplied Hydra/Spana images were used as functional references only.

## Workspace and deliberate usability review

System and Calculation still share one in-memory LaboratorySession. Element selection leads to actual source component forms, then compatible species. There is no save/reopen handoff. Chemical membership and plot visibility remain separate.

The Calculation view now prioritizes calculation type, X/Y variables, a large graph, and adjacent fixed conditions. Scientific labels determine the internal condition modes automatically. Ordinary totals default to an empty total-concentration field; no concentration is invented. pH offers an editable 0–14 preview range. The supported ideal 25 °C setting and declared 1 bar semantics are visible. One-dimensional previews default to 51 points and new grid axes to 21; users can change them within the allocation limit.

Fixed components have precise numerical entry and, for finite supported values, an immediately visible slider. Positive concentration sliders use a logarithmic mapping. Slider ranges are convenience ranges, not claims of scientific validity; precise entry remains authoritative. Components used as axes disappear from fixed controls. With no editable fixed components the graph uses the full available width.

The browser usability pass began in System and proceeded through selecting source carbonate, species, variables and calculation. Findings and fixes:

| Finding | Phase 8 change |
|---|---|
| Internal mode codes made ordinary setup dependent on implementation knowledge | High-level pH, pe, Eh, total linear/log scale and activity choices; raw modes remain in technical metadata |
| Extra choice needed before entering an ordinary total | Default ordinary control is total concentration with no assumed value |
| Source loading occupied space after completion | Loaded source panel collapses; source remains accessible |
| Fixed settings required moving away from the graph | Compact adjacent controls, precise entry and visible logarithmic sliders |
| Axes could appear like fixed conditions | Axis controls and fixed controls are mutually exclusive |
| Empty fixed-condition column wasted grid width | Full-width map when all editable components are axes |
| Diagnostic information dominated the ordinary workflow | Collapsed advanced settings, custom records, source metadata and diagnostic details |
| Repeated curve controls occupied graph space | Collapsed “Shown species · visibility only”; view changes preserve scientific revision |
| Molality could be confused with laboratory molarity | Explicit native units and disabled M/mM/µM/nM with conversion explanation |
| Raw component names were difficult to scan | Display-only chemical typography, preserving original source IDs/names in technical views |
| “failed · failed” did not explain a missing point | Human-readable unavailable reasons, including actual point diagnostic where available |
| Legacy-looking navigation and cramped plot text | Dark modern navigation, larger grid labels and split 1D quantity/unit labels |

Important scientific restrictions remain visible outside Advanced. Source species names are still retained in some curve/series labels; typography is improved where unambiguous, not a chemical formula parser. A narrow-screen CSS breakpoint stacks controls rather than squeezing the graph. Browser review used the desktop viewport; no separate mobile-device interaction test is claimed.

## Unit architecture and limitations

`calculations/units.js` defines separate quantity families:

- molality: mol/kg H₂O;
- molarity: mol/L solution or M;
- scaled molarity: mM, µM and nM.

`convertAmount` returns a displayed value, explicit canonical value/unit, display unit and family. Molarity scaling uses powers of ten, with identity, round-trip, nonfinite and representable-range checks. An unavailable cross-family conversion returns a typed `physical-conversion-unavailable` result, never a number.

The current source/session has no validated solvent-mass per solution-volume relationship. A reference pressure or formula string does not supply that physical information. Consequently molality inputs/results cannot be displayed or entered as M, mM, µM or nM. These choices are visible but disabled with concise help. No 1 kg water = 1 L solution assumption, fake density, or dilute-solution approximation exists. Molarity-native input still cannot be silently passed to the molality solver. A future validated physical conversion can extend the unit boundary without altering equilibrium equations.

Axes, raw results, derived formula/unit metadata, SVG metadata and numerical exports retain the actual mol/kg-H₂O basis. Logarithmic totals represent log10 of the numerical total in that basis, not log molarity.

## Two-dimensional calculation architecture

ChemicalSystem → two-axis CalculationDefinition → one PreparedChemicalSystem → branded grid definition → existing point input and point solver at each coordinate → branded grid result → shared validated derived outputs → visualization model → renderer.

The grid is generic over two distinct supported component variables: linear/log total, log activity, proton pH, and electron pe/Eh. Physical-parameter axes, unsupported models and malformed or excessive requests are rejected. The same preparation restrictions apply as for points and 1D sweeps.

Both coordinate arrays include their endpoints and retain requested ascending or descending order. The canonical shape is `[Nx, Ny]`, with index `iy * Nx + ix` (X fastest). Each outcome retains index, X/Y, grid-qualified point ID, attempted transformations, input identity, raw accepted result or failure, diagnostics and acceptance status. Not-run coordinates have no fabricated transformation/result. No coordinate is discarded.

The grid definition is frozen, hashed and privately branded against the prepared system and scientific revision. The result is separately branded. Structured clones and mismatched identities cannot enter the trusted output or session path. Imported calculated data are not promoted to trusted results.

Coordinate transformations reuse `toSourceInput`: pH and pe negate the requested activity coordinate; Eh uses the existing temperature-dependent V-versus-SHE conversion. There is no second sign convention or equilibrium engine. Two-axis descending order is enabled explicitly; the established increasing-order 1D contract remains unchanged.

Cancellation yields cooperatively every 20 points by default. Results distinguish completed, completed-with-failed-points, cancelled and invalidated-stale, with per-point converged/failed/not-run counts. Maximum requested size is 10000. An in-flight point can finish before cancellation is checked; generation and revision checks still prevent obsolete commits. Scientific edits retain the last accepted plot snapshot with OLD-conditions text until an accepted replacement is available. Its labels come from that snapshot, not edited controls. All-failed replacements retain the previous graph and separate current diagnostics.

The grid object is reusable for later slices, contours, analyses or F(X,Y) surfaces. Those consumers, worker execution and 3D rendering are not implemented in Phase 8.

## Shared outputs, rendering and export

The Phase 7 accepted-output formulas were retained in one shared implementation behind the 1D and grid brand gates. Supported outputs remain log amount/concentration, log activity, nonnegative component fraction, log dissolved component amount, calculated pH and calculated pe/Eh. Existing restrictions on signed inventories, suppressed components, absent solids and logarithms of zero remain in force.

Every grid output carries quantity/formula/unit metadata and nullable exact sampled values with unavailable reasons and provenance. The grid renderer imports no solver or calculation code. It draws flat sampled cells; missing cells are hatched. There is no interpolation, smoothing or numerical boundary refinement. Hover and pin choose a real requested coordinate, and display values to 17 significant digits. Zoom/pan/reset alter only the view.

Numerical JSON contains the complete grid definition, all coordinates and statuses, transformed inputs, accepted raw quantities, gaps and diagnostics, derived values, prepared system, source identity, revision, method and units. The view/selected series and any experimental classification are also included. SVG carries the plotted conditions, identity, view and gap indication, but is explicitly not the complete numerical package. No CSV/PNG or trusted-result reimport was added.

User-defined source records traverse the same repository/preparation/point/grid/output path and remain unverified. A permanent test extends the existing user-record equivalence case through a 15-point grid and checks derived values/provenance. No custom-chemistry numerical branch exists.

## Predominance investigation and scientific gate

Local documentation was read from `Eq-Diagr_Java.zip`, entry `Eq-Diagr/Chem_Diagr_Help.jar`, pages `html/SP_Diagr_Predom.htm`, `html/SP_PREDOM_How.htm` and `html/SP_PREDOM.htm`. This was read-only documentation archaeology; no GPL implementation code was copied into production.

The documented Predom convention chooses a main component. A formed solid containing that component takes priority over aqueous species even if its amount is small. With multiple solids it compares component fractions; without a solid it compares stoichiometrically weighted aqueous fractions. The documentation describes sampled grid calculations and an electron component for potential coordinates. This behavior must not be confused with a generic largest-concentration rule.

Phase 8 exposes only **Inventory dominance · experimental**, whose exact policy is:

1. Choose one supported nonnegative component inventory.
2. Candidates are its free basis component and selected products with a positive coefficient for that component.
3. Compare the existing derived fractions: stoichiometric coefficient × amount / calculated component total. For an imposed-total constraint that calculated total must satisfy the unchanged balance acceptance checks; for imposed activity it is reconstructed from the calculated inventory.
4. A pure solid contributes its actual amount. Its unit activity does not give it automatic dominance or Predom-style priority.
5. Fractions within an absolute 1e-10 of the maximum are a tie, with no unique winner.
6. Unavailable candidate values make the coordinate unavailable. Failed/not-run points are never classified.

This is selected-species **component inventory dominance**, not general phase predominance, solid-priority Predom equivalence or phase stability. Gray cells denote ties. Classification candidates and policy are exported.

An independent analytical check uses the already captured Ag–Cl source constant: the AgCl/free-Ag ratio is `10^(logBeta + logActivityCl)`. The equal-inventory boundary is therefore `logActivityCl = -logBeta`; samples on either side and at the tie verify the rule without new thermodynamic data. A separate precipitation case checks actual solid inventory and exclusion of absent solids. This limited validation supports the experimental policy, not a Pourbaix claim.

**Production Pourbaix gate: DISABLED, not passed.** A defensible Pourbaix calculation needs X=pH and Y=pe or Eh relative to SHE, explicit temperature and analytical constraints, valid proton/electron basis semantics, and an independently tested classification rule. The grid's pH/pe/Eh coordinate transformations are tested, but that alone does not establish a Pourbaix phase diagram. The combined acid/base plus redox test system reuses existing fixture reactions as a mathematical coordinate check; it is not a new empirical Pourbaix reference.

Remaining validation includes representative coupled proton/electron equilibria with independently known phase/species boundaries, the intended solid-versus-aqueous classification convention, phase-transition and tie handling, selected-basis/closure limitations, and comparison across appropriate reference systems. No boundary was tuned to a benchmark coordinate. No new constants, stability products, activity models or equilibrium reference values were invented.

### Separate validation layers

| Layer | Evidence / tolerance |
|---|---|
| Equilibrium acceptance | Existing version 1.0.1 solver and scientific validation contract, unchanged; reconstructed mass action and balances at tested grid points |
| Official cross-implementation comparisons | Five unchanged Phase 4 golden cases and established tolerances; no regeneration |
| Grid/1D and direct-point equivalence | Exact equality of repeated point results and matching 1D-derived values/formula metadata |
| pH/pe/Eh derived-coordinate comparison | Absolute difference below 1e-12 in the coordinate tests |
| Inventory classification | Absolute fraction tie tolerance 1e-10; analytical ratio tests at boundary and ±1 log-activity unit; actual solid-amount tests |
| Production Pourbaix boundary comparison | Not established; feature disabled |

## Permanent test coverage

The 13 new test cases comprise two unit-family tests, eight grid tests and three experimental classification tests. The existing user-record test was extended without removing its prior assertions. All previous 77 tests still pass.

Coverage includes coordinate order/endpoints and descending axes; distinct identities; direct unchanged point-solver equivalence and reconstructed invariants; pH/pe/Eh transformations; all existing output families; exact matching 1D output/unit/formula metadata; typed failure and null propagation; cancellation and stale not-run preservation; forged/stale commit rejection; view-only revisions; unsupported models and allocation bounds; export identity/unit/gap preservation; renderer import boundaries; unit scaling without 1:1 fallback; analytical ties and actual solid handling; user provenance through the grid.

## Performance evidence

Generated by `node scripts/report-phase8-performance.js` on Node v24.15.0. Full values, preparation/input timing, counts and timestamp are in [phase8-performance.json](phase8-performance.json). These are local Node CPU/orchestration and SVG-preparation measurements, **not browser paint timings or responsiveness guarantees**. Every measured point converged; all coordinates were retained and accepted-point invariants were reconstructed.

| Existing reference-based system | Grid | Solver CPU ms | Grid elapsed ms | Derived ms | View model ms | SVG mean ms |
|---|---:|---:|---:|---:|---:|---:|
| Fixed activity | 11×11 | 8.9494 | 96.9185 | 1.4606 | 0.2046 | 0.5130 |
| Fixed activity | 21×21 | 22.7790 | 338.4416 | 3.6386 | 0.2271 | 0.8317 |
| Fixed activity | 51×51 | 116.3928 | 1997.3457 | 26.0591 | 0.9674 | 1.4161 |
| Precipitation | 11×11 | 21.3280 | 89.0261 | 0.8731 | 0.0827 | 0.2787 |
| Precipitation | 21×21 | 61.2119 | 332.8675 | 2.3702 | 0.0437 | 0.7880 |
| Precipitation | 51×51 | 357.4171 | 2014.7989 | 40.4950 | 0.3214 | 1.9477 |
| pH/redox coordinate fixture | 11×11 | 14.9045 | 96.6089 | 2.1866 | 0.0678 | 0.4849 |
| pH/redox coordinate fixture | 21×21 | 30.5552 | 349.0244 | 2.7512 | 0.0311 | 0.4246 |
| pH/redox coordinate fixture | 51×51 | 230.4096 | 1977.3555 | 40.1624 | 0.5478 | 1.1954 |

Elapsed time includes input hashing/preparation and cooperative scheduling; it is not solver CPU time. SVG measurement is the mean of five string-generation runs. No tolerances were changed for speed. Large SVGs and raw diagnostic serialization still consume main-thread work; worker/lazy diagnostic improvements may be useful later without changing canonical results.

## Actual browser verification

Used the existing real `.local/spana-components.json` through the browser file chooser at the local Vite deployment base. No source file was changed or uploaded.

- System periodic table was visible. Selecting chromium revealed actual Cr²⁺, Cr³⁺ and chromate source component forms; no inferred oxidation mapping was added.
- Selected source carbonate with H+/water and OH−/HCO3− products. Moved directly to Calculation, chose pH 6–10 and explicitly entered carbonate total 0.001 mol/kg H₂O. Valid 1D curves were calculated.
- Fixed-total controls and their slider were adjacent to the graph. Unit choices showed native molality and disabled M/mM/µM/nM with the physical-conversion explanation.
- Hiding OH− left scientific revision 10 unchanged. Changing total from 0.001 to 0.002 retained revision-10 graph metadata and its old total while current revision became 11/stale; the replacement then became current. A hovered sample state with pH 8.7200000000000006 was observed during interaction.
- Ran pH × log carbonate total on an 11×11 grid. All 121 sample cells were retained. Exact midpoint inspection gave pH 8, log total −3 and HCO3− log amount −3.0020406268578839 for that selected reaction set.
- After final source edits, a fresh browser tab was used to avoid Vite HMR retaining objects from an older private-brand module instance. Repeated the supported calculation in the fresh session. Brand checks were not relaxed.
- Deliberately requested pH 6/8/10 × linear total −0.001/0/0.001. All nine coordinates remained: three converged and six failed. The SVG had six hatched cells. Failed values were null and the exact inspection explained that nonpositive totals have no supported finite positive free-activity solution.
- Clicked the actual grid surface to pin index 4 (X=8, Y=0) in this failure case. The exported view retained that pin. Separate numerical-index inspection selected successful grid samples.
- Clicked both export buttons. Read the actual downloaded `adams-grid-r13.json` (79,893 bytes) and SVG (6,798 bytes) from Downloads. JSON had all nine outcomes, six null derived entries with diagnostics, three accepted values, source and unit metadata, shape [3,3], revision 13, nonstale view and pin index 4. Those local download artifacts are not production assets.
- Restored logarithmic totals and exercised the experimental inventory display for carbonate, click-to-pin, zoom, pan and reset. This did not enable Pourbaix.
- Started a 100×100 calculation and clicked the active **Cancel** button. The accepted map remained visible. Engine-level not-run accounting is additionally asserted by permanent tests; no browser inspection of a discarded cancellation object is claimed.
- Started another large calculation, changed both sample counts to 11 while it ran, and observed “Conditions changed — updating. Map shows OLD conditions.” Final SVG metadata was shape [11,11], result revision=current revision=22, stale=false, status=completed. The obsolete large request did not replace it.
- Final browser console error query returned an empty list.

No browser test of a production Pourbaix diagram was attempted because the gate is disabled. No claim of full chemical completeness is made for the selected carbonate demonstration.

## Files changed

Hand-edited existing files:

- `src/App.jsx` — grid dispatch through the existing live controller, shared workspace and progressive disclosure.
- `src/App.css` — graph/fixed-control layout, responsive styling and modern navigation.
- `src/calculations/definition.js` — explicit grid descending-axis validation option and defensible UI defaults.
- `src/calculations/outputs.js` — shared accepted-output implementation with grid entry gate and point diagnostic context.
- `src/solver/prepareSession.js` — two-axis preparation option using the same supported preparation path.
- `src/session/laboratorySession.js` — branded grid request/commit/invalidation and retained plot snapshot.
- `src/chemistry/format.js` — display-only chemical typography.
- `src/components/CalculationWorkspace.jsx` — guided calculation configuration and adjacent fixed conditions.
- `src/components/ComponentSelector.jsx` — human-readable source form choices.
- `src/components/AvailableSpecies.jsx` — workflow heading.
- `src/components/PlotWorkspace.jsx` — grid routing, progressive series controls and unit surface.
- `src/components/ScientificPlot.jsx` — human-readable sample status.
- `src/plots/export.js` — human-readable visible axes/conditions and quantity/unit layout; original technical metadata retained.
- `tests/userEquilibria.test.js` — existing user-record test extended through grid/output.
- `README.md` and `docs/scientific-architecture.md` — current workflow, architecture and limits.

New files:

- `src/calculations/units.js`, `grid.js`, `predominance.js`.
- `src/components/AmountUnitSelect.jsx`, `AxisControls.jsx`, `FixedCondition.jsx`, `GridWorkspace.jsx`, `GridPlot.jsx`.
- `src/plots/gridView.js`, `statusText.js`.
- `tests/phase8Helpers.js`, `units.test.js`, `grid.test.js`, `predominance.test.js`.
- `scripts/report-phase8-performance.js`.
- `docs/phase8-performance.json`, `docs/phase8-report.md`.

The production build regenerated `dist/index.html` and hashed build assets. Package manifests, dependencies, Vite base/deployment configuration, original imported files, numerical point engine and golden fixtures were not changed. There is no Git metadata in this working folder; this inventory records the Phase 8 edits rather than claiming a Git diff.

## Deployment and scientific limits

Existing static deployment setup is preserved, including `base: '/adambritts-site/laboratory/'`. No deployment/publish action was performed. The production audit passed with no Java/oracle/test fixtures in the active graph. No backend or runtime Java dependency was introduced.

The supported domain remains ideal activities, 25 °C, declared 1 bar, explicit direct component reactions, at most one candidate pure solid and mol/kg-H₂O amounts. No general redox closure, complete basis proof, multiple simultaneous solids, gas fugacity, nonideal activity model, temperature/pressure extrapolation or rigorous molarity conversion is claimed. Imported missing metadata stays unknown. User records remain unverified. The selected reaction set is not all chemically possible species. Failed states are not equilibrium values.

## Recommended Phase 9 scope

Define and independently validate the intended pH/redox/phase classification before enabling a Pourbaix label. Start with analytically checkable coupled proton/electron systems and explicit solid-versus-aqueous rules, retaining separate convergence, derived-value and boundary tolerances. Then add broader local reference comparisons and source/basis applicability checks. Worker orchestration and lazy diagnostics may improve large-grid interaction, but should consume the existing immutable grid contract. Density-based conversion needs its own physical-data contract and validation. Do not begin 3D or analytical extrema by treating missing samples as data.

Phase 8 stops here.
