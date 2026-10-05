# Wet Lab density and Calculation graph parity

Completed 2026-09-17. Presentation only; no deployment or push.

- Wet Lab retains apparatus | stock editors | results. Inline stock-definition/volume/pH controls, component-concentration-unit rows and compact stock disclosures preserve all fields. Controls remain 40px high in the browser; body text is not reduced. Both single-component stock panels measure about 347px tall at desktop widths. Long explanations and inventory details remain expandable.
- Wet Lab and Calculation now share usePlotGestures.js (fixed-viewport exact sample interaction) and SampleMarker.jsx (dashed selected/preview guide and colored point markers). Calculation's existing derived series, gaps, visible-carrier legends, exports, manual ranges and accepted-result context remain intact. Drag/wheel/pinch cannot mutate 1D/grid bounds. Arrows select adjacent samples; Home/End select endpoints. 3D surfaces retain orbit rotation with pan/zoom disabled.
- Both vessel views reuse BeakerDrawing, VesselAtmosphere and common vessel styling. Calculation has beaker only, using the exact selected inspection state and its existing illustrative liquid level. Wet Lab retains its burette and physical volume-driven fill. Sediment mapping and numerical inventories are unchanged.

Validation:
- 33 focused graph/inspection/Wet Lab/beaker tests passed.
- 27 result-workspace/beaker/fraction regression tests passed. Total: 60 passed, no failures.
- Production build and artifact audit passed. Existing bundle-size warning remains.
- Lint: zero errors; one pre-existing ExpandedPlot.jsx ref-cleanup warning.
- Browser: 1280px and 1440px desktop layouts inspected; 1366px form bounds checked, no horizontal overflow or clipped fieldsets. 390px mobile bounds checked, no horizontal overflow. Form inputs remain 40px high.
- Wet Lab Home/End continue selecting exact cached doses and synchronizing the vessel.
- Calculation Fe(III) control: 51/51 accepted points; click selected index 27, ArrowRight selected 28, End selected 50, Home selected 0. Total-fraction/aqueous-speciation view changes retained index 50. +/- left the SVG viewport unchanged. Selecting index 25 directly produced matching plot/beaker input IDs and eight displayed curve markers. Browser console reported no errors during checks.
- Hash comparison against .local/ui-graph-parity/before.json confirms calculation/chemistry/thermodynamics/beaker numerical helpers and public scientific data unchanged. Only presentation files and the plot interaction test changed; new shared presentation components were added. No System configuration code changed.

Evidence: .local/ui-graph-parity/{focused.txt,regressions.txt,build.txt,artifact-audit.txt,lint-final.txt,changed.json}. Full scientific suite not rerun for this UI-only phase.
