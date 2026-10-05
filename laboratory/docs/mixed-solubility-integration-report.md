# Mixed-system solubility integration

Completed without solver redesign or deployment. Select **Load validated mixed Ca–carbonate–Mg example · opt in** in Calculation (also available from System), then Calculate. The example replaces the draft explicitly; existing defaults and the Mg-only example remain unchanged.

The prepared source basis is Ca 2+, CO3 2-, Mg 2+, H+, H2O. Fixed totals are 0.1, 0.1 and 0.001 mol/kg-H2O, respectively; pH0–14 has29 samples (spacing0.5), ideal25°C, declared1bar and log water activity0. All11 compatible aqueous reactions and all10 audited candidate solids are selected from the repository. No constants are embedded in the example. The definition's mixedSolubility configuration explicitly enables the already validated bounded-multisolid-v1 preparation policy. Mixed mode is restricted to one pH sweep; independent comparison and 2D selection are disabled. Other axis requests fail preparation explicitly. The numerical solver files, constants and tolerances were not edited.

Both curves use the same accepted result/input identity at each pH, rather than independent-system solves:

- Dissolved Ca = m(Ca2+) + m(CaCO3 aqueous) + m(CaHCO3+) + m(CaOH+).
- Dissolved Mg = m(Mg2+) + m(MgCO3 aqueous) + m(MgHCO3+) + m(MgOH+) + 4 m(Mg4(OH)4+4).

Log10 is applied only to a positive dissolved total with a relevant saturated pure solid. The total is the existing solver's stoichiometry-weighted aqueous inventory; displayed contributor rows expose and independently test its reconstruction. Solid inventories are excluded. In this sampled example Ca is available at18/29 points (pH5.5–14) and Mg at9/29 (pH10–14). Earlier points are accepted aqueous equilibria but unavailable **saturation solubility** values. Their dissolved totals and contributions remain inspectable. This preserves the existing scientific distinction between dissolved inventory and solubility.

Inspection exposes coefficients, aqueous molalities, weighted contributions, dissolved total, final log value/unavailable reason, input/system/revision identity, actual active assemblage, all solid amounts/statuses/SIs, balance residuals/limits, search metadata and rejected-subset diagnostics. Original-precision trace JSON is expandable. Stale results keep their old conditions and are labelled old; they are not relabelled as the new equilibrium.

The existing ScientificPlot handles focus/clickable legend, direct labels, hover/pin, zoom/pan/reset, expansion, SVG and numerical JSON. Discrete triangle markers identify the later sample when consecutive accepted assemblages differ:5.5,10,14. An expandable explanation gives the paired sample coordinates and both assemblages. No phase boundary is interpolated and no transition is inferred across unaccepted samples. Numerical export preserves the complete original mixed sweep and exact traces.

## Verification

Four focused integration tests added. They verify explicit opt-in and the unchanged legacy preparation rejection, one shared29-point sweep, all11 aqueous/10 solid rows, weighted totals including coefficient4, quantitative agreement with docs/multisolid-validation.json at pH0,5,5.5,9.5,10,10.5,12,13.5,14, active assemblage agreement, availability counts, discrete markers/focus SVG, exact JSON round trips, stale session/export handling and null cancelled samples without connecting segments or markers.

Browser checked on the current narrow in-app viewport: load example → Calculate → Plot; both curves rendered; hover inspected unsaturation; pinned pH14 showed both values, Mg weighting and all three active solids with inactive statuses; Mg focus retained its direct label and faded Ca; Edit setup retained original totals; changing Mg marked previous results stale; restored audited total and recalculated29/29; expanded/exited plot successfully. No unrelated browser exploration or desktop-width claim.

- Full suite:212 passed,0 failed (all208 previous tests preserved).
- All five golden benchmarks pass; the fixture hash assertion remains unchanged.
- Build: passed; existing large-bundle advisory remains.
- Lint:0 errors,1 pre-existing ExpandedPlot.jsx:21 warning.
- Production boundary audit: passed; database SHA256 remains9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245.
- Golden SHA256 remainsaefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960.

## Exact files changed in this task

Modified:
- src/App.jsx — example actions and mixed-output preflight.
- src/data/solubilityExample.js — source-backed mixed example.
- src/solver/prepareSession.js — explicit definition opt-in to existing policy; pH-only scope gate.
- src/calculations/solubility.js — relevant saturated phase selection for explicitly opted-in prepared systems; legacy one-solid requirement retained otherwise.
- src/calculations/outputDescriptors.js — mixed component-request preflight.
- src/calculations/outputs.js — two branded derived series from one sweep, point traces and sampled changes.
- src/components/CalculationWorkspace.jsx — selectable example and clear mixed-mode setup controls.
- src/components/PlotWorkspace.jsx — derive from the stored mixed definition; shared-equilibrium and availability labels.
- src/components/ScientificPlot.jsx — solid/diagnostic inspection and sampled-change explanation.
- src/plots/export.js — discrete phase-change markers in the existing SVG path.

Added:
- tests/mixedSolubilityIntegration.test.js.
- docs/mixed-solubility-integration-report.md.

Build regenerated dist/index.html and hashed application assets. No database, golden fixture, solver mathematics, tolerance, activity assumption or scientific coefficient changed. No fraction, Pourbaix,3D,beaker or nonideal work. Remaining limits are those of the validated direct ideal pure-solid solver; sample transitions are not exact phase boundaries. No deployment performed. Ready for review.
