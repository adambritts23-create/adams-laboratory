# Phase 11 — interactive chemical response surfaces

Completed 6 September 2026. Phase 12 has not started. No deployment was performed.

**Solver mathematics unchanged. Thermodynamic constants unchanged. Sampled equilibrium values unchanged.** No equilibrium values are filled, fitted, smoothed or resampled. Polygon interiors and contour crossings use explicitly labeled visualization interpolation between accepted samples; they are not additional equilibrium calculations.

## Renderer and architecture

Three.js **0.185.1**, pinned exactly, supplies WebGL projection, indexed geometry, ray picking and standard OrbitControls. It runs entirely in the browser, is bundled locally, and needs no backend, external plotting service, API key, Python or Java runtime. Three.js was chosen to control conservative cell masking directly while using established camera and rendering machinery. See the official [WebGLRenderer documentation](https://threejs.org/docs/pages/WebGLRenderer.html), [BufferGeometry](https://threejs.org/docs/pages/BufferGeometry.html) and [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html).

The unchanged calculation path is ChemicalSystem → CalculationDefinition → point/grid engine → GridResult. Existing output derivation and Phase 10 analysis feed GridWorkspace. Its memoized model is shared by 2D Map and 3D Surface. No renderer imports the solver or starts a calculation.

- `surface3d.js` prepares exact sample records and deterministic masked topology independently of WebGL.
- `threeSurfaceRenderer.js` owns GPU buffers, camera, picking, labels and optional overlays. Scientific coordinates remain JavaScript doubles; normalized Float32 buffers are display coordinates only.
- `Surface3D.jsx` connects view state, inspection, analysis, slices and exports. `SurfaceControls.jsx` contains display controls. Camera and pin changes are excluded from scene-preparation dependencies.
- `surfaceLifecycle.js` catches renderer initialization failures. Cleanup disposes geometry, textures, controls and the WebGL context when the view unmounts.
- `surfaceFigure.js` makes a labeled PNG figure. Existing numerical grid export remains separate.

View state includes camera, aspect, Z range, color limits, contours, mesh, extrema and the shared pinned sample. Switching views preserves output, revision, grid identity, conditions and pin. The existing session reducer treats these as visualization actions, not chemistry changes. Rendering is on demand rather than an idle animation loop.

## Scientific geometry and inspection

X-fast row/column indices and exact stored X/Y coordinates are retained. Each record preserves displayed F, its underlying linear value when available, status, units and metadata. Z comes only from existing Phase 10 output definitions, including individual species, activities, dissolved component inventories and supported solid quantities. Total dissolved remains distinct from solubility.

Each lattice quad receives two triangles **only if all four corners are converged with finite F**. A single failed, unrun, cancelled or derived-unavailable corner removes the entire quad. Wire edges and contours follow the same mask. Disconnected valid regions cannot acquire a bridging triangle. Isolated accepted samples can appear as points without inventing a surface around them.

Optional base footprints are non-data guides: red crosses for failure, gray dots for unrun/cancelled states and purple dashes for unavailable derived values. They have no assigned scientific Z. Failure means equilibrium was not established, not that a chemical phase was identified.

Automatic Z bounds use the accepted output model; nulls never enter its bounds. A constant output receives coordinate-frame padding, not changed values. Empty output receives an empty coordinate frame. Manual Z bounds clip geometry without clamping source values. Color limits saturate display colors only. Auto, Cube and Data proportional aspects affect appearance; the latter depends on the displayed units.

Hover/click ray picking snaps to an actual accepted vertex of the hit primitive. It never reports the interpolated triangle-interior Z as a solved point. Numeric sample selection also reaches failed/unrun states. Inspection displays 17 significant digits, X/Y/Z identities and units, underlying linear value, row/column indices, status and original point diagnostics/input. Original fixed conditions remain available in the surface conditions panel.

Minimum/maximum markers use Phase 10 AnalysisEngine indices and coordinates without recomputing extrema. Incomplete coverage retains the sampled-subset warning. Horizontal/vertical slices reuse exact existing rows/columns, retain unavailable gaps, and add a non-data outline at the selected sampled coordinate. Optional surface and base contours use the existing masked, piecewise-linear contour helper; they are never labeled thermodynamic boundaries.

## Performance

Local measurements; not hardware-independent guarantees. Node chemistry timing includes grid setup/orchestration. Surface preparation is the median of five preparations of the same result and excludes derivation/analysis. The benchmark uses supported carbonate chemistry from the existing local source and does not export its constants. Reproduce with `node scripts/report-phase11-performance.js`; raw aggregate measurements are in `phase11-performance.json`.

| Grid | Accepted points | Triangles | Chemistry, ms | Preparation median, ms | Browser scene + first render submission, ms | Latest zoom frame submission, ms |
|---|---:|---:|---:|---:|---:|---:|
| 21×21 | 441 | 800 | 349.24 | 0.47 | 65.70 | 0.30 |
| 51×51 | 2,601 | 5,000 | 2,013.96 | 7.84 | 147.00 | 0.50 |
| 81×61 | 4,941 | 9,600 | 3,876.54 | 19.66 | 193.80 | 0.60 |

Browser measurements used the local Codex in-app browser with mesh, both contour overlays and sampled extrema enabled, so they include more than the clean default. Initial runs ranged from about 62–158 ms; later runs above demonstrate normal variability. A latest-frame measurement after zoom separates interaction submission from scene construction. Mean submission across seven frames, including initial rendering, was 8.51 / 9.67 / 8.87 ms respectively. These are CPU submission timings, **not measured GPU completion or a certified FPS**. Orbit and zoom were responsive in direct browser operation at all three sizes. Camera operations retained the existing grid.

## Real browser verification

Local URL: `http://127.0.0.1:5173/adambritts-site/laboratory/`.

1. **Complete carbonate surface:** pH 0–14 × log10 carbonate total −6 to −1; HCO3− log amount. All three requested grid sizes converged. Verified surface, numeric color scale, orbit drag, wheel/button zoom, reset, exact hover, click/pin, numeric inspection, minimum/maximum, mesh, both contour modes, manual Z/color ranges and reset, Auto/Cube aspect, and dark/light theme.
2. **Same-result output and view changes:** at 21×21 sample 220 (pH 7, log10 total −3.5), total dissolved carbonate was `0.00031622776601683805` mol/kg H2O, while free carbonate was `1.2145801621721075e-7` mol/kg H2O. Changing Z and switching 2D→3D→2D retained the same grid ID and revision. Pin 220 survived switching. Both horizontal and vertical exact slices were opened; the vertical slice reported exactly pH 7.
3. **Genuine rejected states:** pH 0–14 × linear carbonate total −0.001 to +0.001, 21×21. Existing solver diagnostics rejected nonpositive totals: 210 converged, 231 failed, 0 unrun. The renderer produced only 360 triangles, leaving the rejected region absent with red footprints. Inspection returned unavailable Z and the original diagnostic. These deliberately invalid inputs test failure visualization; they are not a chemically meaningful negative-concentration experiment.
4. **Cancellation:** an 81×61 descending total grid was cancelled during calculation. It retained 640 converged samples, 4,301 unrun and 1,104 valid triangles. The rest was empty apart from explicitly non-data footprints. Sample 4,940 remained cancelled/unavailable, distinct from failure.
5. **Stale state:** axis edits displayed “Conditions changed — updating. Map shows OLD conditions.” while retaining the old surface. Replacement occurred when the new result was available. Automated tests independently check original conditions/revision retention.
6. **Exports:** inspected the generated 1,400×1,000 PNG, including axes, Z definition, scale, interpolation legend and original conditions. Copied/parsing the separate full numerical JSON confirmed all 441 requested outcomes, 3D view, pin 220, camera and scientific summary. PNG is expressly raster-only.
7. **Fallback/access:** tested a throwing renderer factory without modifying the retained grid. The UI catches initialization/context failure and exposes 2D fallback; numerical inspection, analysis, exact slices and export remain available. Hardware/WebGL-disabled browser testing was not forced on this machine. Browser console error inspection was empty.

## Verification and static build

- **162 tests passed, zero failures and zero skips:** all original 150 plus 12 focused Phase 11 tests. Coverage includes exact topology/data, four-corner holes, disconnected regions, log/zero handling, extrema, exact slices, view-only state, cancellation/export, stale metadata and initialization failure.
- All five unchanged official golden benchmarks passed: acid-base, complexation, precipitation, redox and fixed-activity. Fixture-integrity test passed; SHA-256 remains `aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`.
- `npm run build`, `npm run lint` and `node scripts/audit-production-boundary.js` passed.
- Production audit: five files, 999,949 bytes; local source absent. The strict import boundary explicitly admits Three.js and OrbitControls; private sources, reference tooling and golden fixtures remain outside production.
- Vite base remains `/adambritts-site/laboratory/`. No deployment configuration or publishing change; existing static GitHub Pages setup remains usable.

The JavaScript bundle increased from approximately 388.72 kB (118.86 kB gzip) to **960.62 kB (262.95 kB gzip)**. CSS is 24.22 kB (5.89 kB gzip). Vite's >500 kB chunk warning remains visible. This is the principal cost of the renderer choice. Static imports preserve the existing auditable import graph; no CDN or runtime plotting service is introduced.

## Files changed

Added:

- `src/components/Surface3D.jsx`, `src/components/SurfaceControls.jsx`
- `src/plots/surface3d.js`, `src/plots/threeSurfaceRenderer.js`, `src/plots/surfaceFigure.js`, `src/plots/surfaceLifecycle.js`
- `tests/phase11.test.js`
- `scripts/report-phase11-performance.js`
- `docs/phase11-performance.json`, `docs/phase11-report.md`

Updated:

- `package.json`, `package-lock.json` — exact Three.js dependency
- `src/components/GridWorkspace.jsx` — shared 2D/3D result and exact slices
- `src/components/GridPlot.jsx` — shared persistent pin
- `src/components/AnalysisPanel.jsx` — hide the 2D-only domain overlay control in 3D
- `src/App.css` — responsive surface layout, scale and controls
- `scripts/audit-production-boundary.js` — explicit renderer import allowlist
- `README.md`, `docs/scientific-architecture.md`

Dependency installation updated generated `node_modules`; the existing build regenerated ignored `dist/`. No solver source, thermodynamic source record, golden fixture or deployment configuration was edited.

## Limitations and Phase 12 recommendation

3D requires WebGL2; 2D is the scientific fallback. Figure export is PNG, not vector SVG, and uses current viewport raster resolution. Labels can overlap from extreme camera angles, dense non-data footprints can look crowded, and data-proportional aspect can compress a numerically narrow axis. Reset camera/Auto aspect and optional-overlay controls recover a readable view. Picking snaps within the hit primitive rather than suggesting arbitrary locations are solved. No GPU/FPS guarantee or exhaustive device/browser matrix is claimed.

The existing restricted chemistry scope remains unchanged: no general redox closure, validated Pourbaix classification, nonideal activities, arbitrary simultaneous solids, gas fugacity equilibrium or temperature/pressure extrapolation.

For Phase 12, prioritize cross-browser/WebGL-loss accessibility tests and export/label ergonomics, then independently review difficult supported chemical bases using retained diagnostics and references before widening scientific claims. Any solver/basis change needs its own scientific validation gate. Phase 12 is not implemented here.
