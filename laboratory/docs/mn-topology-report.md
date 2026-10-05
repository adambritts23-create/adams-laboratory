# Mn boundary topology and junction audit

## Result
A scientifically supported partial topology was achieved: 25 continuous local pure-solid connections are certified. A complete connected map and exact junctions were not established. Existing region fill and gray uncertainty were preserved. No deployment.

1. **Candidate boundary segments: 71.** Candidates connect consecutive crossings only within the same pair of accepted states and tracked condition. They are ordered along the locally dominant coordinate, not grouped merely by proximity. All endpoint IDs refer to the unchanged 84-crossing evidence. Candidate and crossing ordering is deterministic.

2. **Fully certified segments: 25.** All are pure-solid/pure-solid connections. Intermediate transverse brackets use the existing solver without altered options. Certification additionally checks the complete branch: competing-phase cap differences are affine, so their minimum on the segment is bounded by its endpoints; dissolved inventory on the equal-cap line is a convex sum of exponentials, so its maximum is bounded by endpoint maxima. Strict existing enclosure margins exclude a hidden lower-cap phase or an aqueous-only interval. Thus certification is more than agreement at isolated probes. Numerical traced coordinates are retained; analytical projections are comparison/certification evidence, not replacements for equilibrium results.

3. **Rejected/partial connections.** One candidate, segment-98-99--98-113 (aqueous Mn2+ / Mn3O4), was rejected as a renderable connection because no consistent transverse transition bracket was found within the bounded expansion budget. This is not proof that the physical boundary is absent. Another 45 candidates have successful point traces but no continuous nonlinear enclosure certificate. They remain partial and are not drawn as certified connections. No arbitrary connecting spline is used.

4. **Candidate junction cells: 12.** These are original cells with three or more participating state identities on their edge crossings. They are not twelve proven, distinct physical junctions; adjacent cells can describe the same unresolved feature.

5. **Certified junctions: zero.** Four apparent triple-point candidates were disproved: junction-cell-12-6, -13-6, -8-7 and -9-7 contain distinct parallel Mn3O4/Mn2O3 and Mn2O3/MnO2 equal-cap boundaries. The Mn2O3 region between them must remain. Parallelism is assessed at coefficient roundoff and the nonzero intercept separation excludes an intersection in the supported domain. These are recorded as rejected-not-a-junction, with equations and supporting solver samples. The earlier suggestion to seek an Mn3O4/Mn2O3/MnO2 triple point is therefore not supported by this audited dataset.

6. **Unresolved junction cells: eight.** Three-by-three solver probes and deterministic subcell searches from multiple directions suggest smaller candidate locations for some cells. They do not prove that alternatives elsewhere in the original cell are absent. Consequently each original cell remains the uncertainty box; the smaller sampledLocalization is explicitly only a probe-based estimate. No sampled estimate is presented as an exact triple point or certified mixed region. All participating states, probe controls, statuses, residuals and reasons are available in inspection/export. Existing ambiguous-solid-assemblage behavior remains typed and tested; no phase-amount split is invented on a coexistence line.

7. **Analytical and numerical checks.** The four certified solid-boundary families obey the source-derived relation pe + pH = k, with k approximately −12.38, 7.83, 14.025 and 16.465 respectively for Mn/Mn(OH)2, Mn(OH)2/Mn3O4, Mn3O4/Mn2O3 and Mn2O3/MnO2. Full source-derived numbers, not these rounded report values, are stored. The slope is −RT ln(10)/F at 25 °C, approximately −0.0591593496848 V/pH versus SHE. Independent original-source mass action checks cover recorded accepted evaluations and 31 positions on each certified branch. Maximum recorded independent log-free-activity difference: 9.592326932761353e-14. For certified trace endpoints, maximum Mn balance residual is 1.8995222061946038e-16 mol/kg and maximum active log-saturation residual is 1.4210854715202004e-14. Maximum original-crossing analytical projection difference is 2.9035607085337034e-8 in the corresponding transverse coordinate. These are measurements, not new acceptance tolerances.

The audit contains 21,863 validation-point entries, including repeated endpoints. Transverse bisection retains the previous 1e-6 pH / 1e-7 V coordinate criteria and 32-iteration bound. Adaptive tracing starts with seven interior probes; nonlinear departures can trigger subdivision up to depth six. Transverse brackets have at most twelve expansions. These limits affect topology work only, never chemistry acceptance. Failure or an unexpected state rejects the candidate connection.

8. **Intervening regions.** No additional phase was added to the chemistry. The real intermediate Mn2O3 region found previously is preserved. A permanent test constructs the would-be Mn3O4→MnO2 shortcut from actual source equations and verifies that the lower competing Mn2O3 cap rejects it. The four false junction detections independently confirm why this region cannot be collapsed.

9. **Original 195-state consistency.** All original states remain unchanged and compatible with the displayed interiors. The same 187 samples lie inside certified interiors; the same eight are explicitly unresolved at the enclosure level. No new region polygons were created. The original sampled diagnostic, dissolved-species and oxidation-state alternatives, and exact point inspection remain available.

10. **Gray area.** Unchanged: 4,676 unresolved enclosure boxes, approximately 1.78375244140625% of the plotted coordinate area. This percentage measures display-coordinate area, not probability or physical uncertainty. The eight junction search boxes are drawn as uncertainty annotations without erasing existing evidence or filling their interior as a new phase.

11. **Visualization achieved.** The development view now offers certified interiors, interiors plus certified boundaries, interiors plus original sampled points, and the original diagnostic sampled map. Only the 25 certified segments are rendered as continuous local connections. Clicking a segment exposes its ID, competing phase names, endpoint crossings, tracked equality, supporting transverse samples, residual maxima and whole-branch proof. Clicking an unresolved junction exposes its states, retained uncertainty cell, probe localization and reason. General region clicks still select an explicitly identified original stored sample, not an invented equilibrium at the cursor. Optional analytical water dashes remain distinct, under unchanged unit-normalized-fugacity/unit-water-activity assumptions, 25 °C/SHE, with the source gas reference-pressure scalar still unavailable. No gas equilibrium is implied.

Browser checks covered loading the pinned snapshot, region and topology artifacts; expanded boundary view; inspection of segment-10-25--11-26; and inspection of unresolved junction-cell-8-0. A screenshot and standalone SVG are included. A fully connected conventional diagram is not claimed: 45 partial traces, one rejected candidate and eight unresolved junction cells prevent certification of global region closures.

12. **Final test count: 267 passing.** Ten focused topology tests passed, followed by the full suite. Lint, build and production audit pass. The existing ExpandedPlot ref warning and existing bundle-size warning remain.

13. **Baseline preserved.** All 257 previous tests and five unchanged golden benchmarks pass. Solver mathematics, constants, tolerances, redox semantics, bounded initialization retry, candidate chemistry, activity assumptions, solubility/fraction behavior and 3D behavior are unchanged. Production bundle content/name remains unchanged; this is development-only.

14. **Exact final files changed in this phase.**

Modified:
- src/components/MnDiagnostic.jsx

Added:
- scripts/validation/mnTopology.js
- scripts/validate-mn-topology.js
- src/plots/mnTopology.js
- src/data/mnTopologyIdentity.js
- tests/mnTopology.test.js
- docs/mn-topology-validation.json.gz
- docs/mn-topology-view.json
- docs/mn-topology.svg
- docs/mn-topology-browser.png
- docs/mn-topology-report.md

Build output was regenerated. Earlier scientific evidence and region files were not modified. The temporary uncompressed topology JSON was replaced with a losslessly compressed copy; it was not discarded without preservation.

15. **Export and limitations.** The full gzip JSON preserves the original snapshot, intermediate numerical results, rejected attempts, segment traces, junction probes, conditions, residuals and source-boundary SHA256. Decompression restores exact JSON bytes and is checked against a pinned SHA256. Compression reduces approximately 443 MB of verbose evidence to about 27 MB without rounding numbers. The smaller browser artifact retains validation summaries and links to the complete evidence. SHA256 verification gates browser loading. No continuity claim is made for nonlinear traces lacking an enclosure proof; no exact unique solid-amount partition is inferred at coexistence. The global topology remains incomplete.

16. **Smallest recommended next phase.** Certify the single aqueous Mn2+/Mn3O4 connection between crossings 98-99 and 98-113 using a bounded continuation and whole-interval saturation/monotonicity check. Keep the current solver unchanged and require a continuity certificate before rendering that branch or reducing its gray uncertainty. Do not seek a triple point between the demonstrated parallel pure-solid boundaries.

Stopped for review at the explicit partial result.
