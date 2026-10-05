# Phase 8.1 — graph-first UI correction

Completed locally on 2026-09-06. This is a presentation and workflow pass over Phase 8. **No equilibrium mathematics, preparation semantics, coordinate transformations, derived-output formulas, classification policy, source records, tolerances or golden fixtures were changed. Production Pourbaix remains disabled. No Phase 9 work was started.**

## Verification

| Check | Before editing | Final |
|---|---|---|
| `npm test` | 90 passed | **97 passed; 0 failed, skipped or cancelled** |
| Five official golden comparisons | Passed | Passed unchanged |
| `npm run build` | Passed, 66 modules | Passed, 70 modules |
| `npm run lint` | Passed | Passed |
| `node scripts/audit-production-boundary.js` | Passed | Passed |
| JS / gzip | 331.86 / 101.13 kB | 334.60 / 102.67 kB |
| CSS / gzip | 10.97 / 3.01 kB | 20.01 / 4.93 kB |

Final build: Vite 8.0.13, 185 ms, `index-C5htgGiy.js` and `index-B3yFv1mt.css`. Final full-suite runner duration: 1184.1934 ms. These build/test timings are not browser rendering benchmarks.

Golden SHA-256 remains `aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`. No reference regeneration or tolerance changes were made. The underdetermined-component regression, all five official comparisons, grid cancellation/identity tests, user-record pathway and unit-family restrictions remain covered by the complete suite.

The existing static deployment setup and dependencies are unchanged. Vite base remains exactly `/adambritts-site/laboratory/`. Nothing was published. The existing local development server was used at `http://127.0.0.1:5173/adambritts-site/laboratory/`.

## Problems addressed

The Phase 8 setup and plot controls accumulated vertically before the figure. Source loading lacked sufficiently obvious feedback. Species rows repeated their metadata and inspection controls. The element selector was an incomplete table. Component series labels did not make the free-species versus analytical-total distinction explicit. Log-value ticks were evenly spaced decimals rather than useful decades.

The corrected desktop workspace has a small application/database/navigation header, a compact calculation/output/axis toolbar and a large figure with an attached parameter rail. Secondary information follows the figure in collapsed disclosures. The redesign retains the same session and existing calculation callbacks; there is no save/reopen handoff or alternate live-calculation implementation.

## System view

### Complete periodic table

`data/periodicTable.js` supplies all 118 element identities and conventional display positions, including detached lanthanide and actinide rows and range placeholders in periods 6/7. These are presentation identities, not added thermodynamic data. The original repository element dataset was not expanded or changed.

Availability is derived solely from nondeprecated components returned by the active repository and their element associations. An element without component data remains visible, subdued and disabled, with a tooltip explaining the database limitation. An available element can be selected; selected available elements are highlighted. H/O retain their implicit solvent behavior, and H+/e−/water remain distinct component controls. The demo has no source component records, so its table does not falsely claim available thermodynamic components.

On desktop, source component forms appear beside the table in a compact scrolling region. Selecting an element exposes its actual source forms. The selected-system tray shows component names and the product count. On narrower screens the forms move below the complete table.

### Species browser and inspector

The browser is now a compact table: inclusion checkbox/formula, phase, selection/support status and an information button. It supports text search, phase filtering, selected-only filtering, additional source/oxidation filters, a bounded scrolling region and incremental batches of 50 records. It does not render thousands of large record inspectors.

One secondary inspector shows the selected record's original identity, signed source reaction terms, log K, reference conditions, citations, provenance, quality flags and raw normalized data. Incompatible records remain inspectable but not selectable. Gas/non-solvent liquid calculation limitations and user-defined/unverified labels are visible in the list. Selection still changes chemistry; graph visibility does not.

Ordinary explanatory prose moved into contextual disclosures. Existing scientific restrictions, unavailable output diagnostics and missing-data warnings remain accessible; unsupported calculations still fail through the unchanged preparation path.

## Database loading

The UI now reports **No database loaded → Loading database… → Validating… → Database ready**. The loader yields before file reading and before validation so those stages can paint. It still invokes the existing snapshot parser/repository validator, preserves the 100 MB size limit and leaves the current database unchanged on errors. A load error includes the actual failure reason.

After success, the loading section collapses to the filename and a count from the validated repository's species identities, not the snapshot's untrusted summary count. The real local snapshot displayed **4,445 species records**, including the application solvent record. Loading a different database still starts a new draft, as in Phase 8.

## Calculation and graph controls

Calculation type, output, scientific variable, bounds, samples and Calculate are compact toolbar controls. Two axes use the same layout for 2D. The automatic-update preference remains available under Advanced; the default behavior is unchanged. Duplicate output selectors were removed from the figure cards.

The fixed-condition rail shares the graph surface and is separated by a restrained rule rather than a detached form card. It shows the component, explicit total/activity meaning, exact current number, native units and a styled draggable control. Positive totals use the existing logarithmic movement and debounce path. Exact numeric inputs have no convenience-slider min/max restriction. Axis components never simultaneously appear as fixed controls.

The graph view box now uses more horizontal plotting space and proportions that fit the desktop workflow. 1D and 2D navigation, exact sample inspection and export remain. Point inspection is collapsible and opens on a pin/inspection interaction; it no longer consumes a large permanent block. Visibility uses compact checkbox labels with detailed provenance in secondary views. User-defined provenance remains marked unverified.

Figure conditions are generated from the accepted snapshot. Visible condition names use chemical typography and identify component totals explicitly. Raw technical metadata remains unchanged. Editing a live input still leaves the old graph marked stale until an accepted current generation replaces it.

## Integer log axes

The renderer's `bounds` accepts a presentation-only logarithmic option. It expands padded bounds outward to integers. `axisTicks` uses integer major ticks for ordinary log ranges, including −3 in the carbonate example. Broad ranges use a larger integer step; tightly zoomed sub-decade ranges can use fractional ticks. Invalid/degenerate bounds yield no tick set instead of invalid geometry.

Horizontal grid lines use those same tick values. No calculated values are rounded, resampled or replaced. Inspection continues to show the actual 17-significant-digit values. The change applies to log amount/concentration, log activity and log dissolved amount, not to equilibrium or sweep calculations.

## Total versus free carbonate audit

The existing output layer uses `log10(result.concentrations[index])` for an ordinary free-component concentration series. It does **not** substitute `componentTotals`. No analytical-total reference curve was being injected into the plotted species series.

A free carbonate curve can approach the imposed carbonate total when that free species carries almost all of the selected component inventory. That does not make it a total series. Conversely, with HCO3− selected, the free carbonate amount differs substantially from the total at lower pH.

The presentation now labels the curve **Free CO₃²⁻**, and the fixed control/printed condition **CO₃²⁻ component total**. Product curves retain their species names, while dissolved-component output remains separately identified. A display helper distinguishes these kinds without editing canonical names, IDs or derived quantities. No extra reference line or new output formula was added.

A permanent test verifies that plotted free values equal accepted free concentrations and differ from component totals where complexation occurs. Additional label assertions prevent a component-total display from being named as a free-species curve. This test reuses existing reference-based data; no new thermodynamic constants were introduced.

## Actual browser review

Used the existing real `.local/spana-components.json`, loaded through the browser file chooser. The following interactions were performed; screenshots were inspected inline during the work.

1. Observed **Loading database…**, followed by **Database ready · 4,445 species records** and a collapsed source area. The separate Validating stage is covered by the loader stage test; no claim is made that a screenshot captured that short-lived stage.
2. Inspected the complete table. At the reviewed selection there were 118 rendered element buttons: 80 available-unselected, 4 selected and 34 unavailable. Helium and other unavailable elements remained visible with the no-component-data explanation.
3. Toggled carbon and selected its source carbonate component with the existing H+/water components. Selected HCO3− and OH− through the compact species table.
4. Selected chromium and observed actual Cr³⁺/chromic, Cr²⁺/chromous and CrO₄²⁻/chromate source forms, then deselected chromium. No inferred redox forms were introduced.
5. Opened the HCO3− inspector, which showed its original source ID, formation-constant convention, actual source log K, reference temperature and resolved citations. Closed the inspector without changing membership.
6. Moved directly to Calculation, selected pH 0–14 with 51 samples and entered carbonate total 0.001 mol/kg H₂O. Ran the accepted 1D calculation.
7. At **1440 × 900**, with page scroll at zero, the final 1D SVG occupied **1164 × 604 CSS pixels**, beginning at **y=253** and ending at **y=857**. Its fixed-condition rail began at y=193, was 205 pixels wide and 480 pixels high. The graph, both axes, printed conditions and live control were visible in the desktop viewport. Figure area plus the adjacent rail occupied approximately 62% of the entire viewport, or about 71% below the application/navigation header; these measurements describe the reviewed case, not every possible system.
8. Observed integer Y ticks −16 through 2, including a visible −3 grid line. The free-carbonate label and component-total control were distinct.
9. Physically dragged the carbonate slider. During the update, SVG metadata retained result revision 7 and total 0.001 while current revision was 15 and stale=true. It then committed revision 15 with total 0.01412537544622754 and stale=false. The old labels did not inherit the new input prematurely.
10. Hid and showed OH− using the compact visibility controls. Both result and scientific revision remained 15. Restored carbonate total to 0.001.
11. Clicked the plot to pin an actual sample. In the final 51-point run, sample 27 was pH **7.5600000000000005**; free CO₃²⁻ log amount was **−5.7677420159666397**, HCO3− **−3.0007420159666403**, and OH− **−6.4414999999999996**. Water concentration remained explicitly unavailable. These are observed results of the selected source reaction set, not added fixtures.
12. Checked the unit menu: mol/kg H₂O enabled; M, mM, µM and nM disabled with conversion-unavailable labels. No physical conversion was added.
13. Ran pH × log carbonate total (−4 to −2), 11 × 11. The accepted grid reported 121 requested positions, shape [11,11], completed status, matching result/current revision 25 and stale=false. Selected HCO3− and clicked to pin an actual grid sample. The final 2D SVG was 1369 × 618 CSS pixels, starting at y=284.5; its figure extended to approximately the lower viewport edge. It remained a sampled quantity map, not a Pourbaix diagram.
14. Tested **760 × 900** as a narrower breakpoint, including editing the total input and returning to System. The page's content width was 745 pixels, with no page-wide horizontal overflow. The full periodic table fit, and forms stacked below it. Calculation controls wrapped, with a 709 × 368-pixel SVG and fixed controls below the figure. This narrower workflow requires scrolling; it is not presented as a fully viewport-contained mobile instrument.
15. Browser console error queries were empty. Temporary viewport overrides were reset. The local tab was left with the carbonate workspace for further testing.

No production Pourbaix interaction or mobile-device test is claimed. No external database upload, new import snapshot or deployment was performed.

## New permanent tests

`tests/presentation.test.js` adds seven tests:

- all 118 unique element identities/positions, including detached series;
- availability from source components rather than static element presence or selection;
- integer log bounds and −3 major-tick alignment without data mutation;
- bounded broad-range and fractional-zoom tick strategies;
- free-component versus total semantics against accepted existing-reference calculations;
- figure tick/label/native-unit preservation;
- real validated record counts, loading stages, and malformed/oversized load rejection.

All previous tests remain. Scientific tests were not replaced with HTML/CSS snapshots.

## Files changed

New files:

- `src/data/periodicTable.js` — complete display identities and source availability mapping.
- `src/plots/presentation.js` — display-only series semantics and log-output identification.
- `src/components/OutputControls.jsx` — shared compact output selector.
- `src/components/databaseLoading.js` — staged UI loading around unchanged repository validation.
- `tests/presentation.test.js` — seven presentation/loader regression tests.
- `docs/phase8-1-report.md` — this report.

Updated files:

- `src/App.jsx`, `src/App.css` — compact shell, System layout, selected tray, graph-first layout and attached responsive controls.
- `src/components/ElementSelector.jsx`, `ComponentSelector.jsx` — complete table and compact source forms.
- `src/components/AvailableSpecies.jsx`, `SpeciesDetails.jsx` — searchable table and one secondary inspector.
- `src/components/DatabaseSource.jsx` — loading/ready/error feedback and actual record count.
- `src/components/CalculationWorkspace.jsx`, `AxisControls.jsx`, `FixedCondition.jsx`, `AmountUnitSelect.jsx` — compact setup and precise instrument controls.
- `src/components/PlotWorkspace.jsx`, `ScientificPlot.jsx`, `GridWorkspace.jsx`, `GridPlot.jsx` — view controls, typography, series labels and exact inspection presentation.
- `src/plots/geometry.js`, `export.js`, `gridView.js` — axis ticks, figure proportions and display labels/conditions.
- `README.md` — Phase 8.1 report pointer and current UI guidance.

The build regenerated `dist/index.html` and hashed assets. No files in `src/solver/`, `src/calculations/`, `src/session/` or `src/thermodynamics/` were changed in this pass. The original `src/data/elements.js` and source/golden datasets were preserved. This directory has no Git metadata; the inventory is based on the actual edits, not a claimed Git diff.

## Remaining UI limits

Desktop is the priority. Narrow screens stack controls and require scrolling; very small screens use a horizontally scrollable conventional periodic table. Dense figures with many curves can still have overlapping direct labels; visibility/search and exact inspection remain available. Only 50 species rows are initially rendered, with explicit incremental loading rather than virtualization. Snapshot parsing/validation is still synchronous after a painted progress stage, so a large file can briefly occupy the main thread. The CSS retains earlier selectors beneath scoped correction rules and could benefit from a future maintenance-only consolidation.

No new scientific functionality was added. Phase 8 restrictions, molality/molarity separation and the disabled production Pourbaix gate remain in force. Stop after Phase 8.1.
