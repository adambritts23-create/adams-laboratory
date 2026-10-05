# Predominance Area implementation report

## Result and scientific scope

Calculation now offers **Predominance area** as the general diagram definition. It uses two existing source-coordinate axes, with Y controls beside the preview and X controls below it. Fixed composition/activities and conditions are separate; the live summary identifies ranges, units, boundary meaning, database products and admitted products. One Diagram type selector and the shortcut buttons use the existing diagram transition contract.

Conventional X=pH / Y=Eh or pe receives a secondary pH–Eh / Pourbaix descriptor. The existing reviewed oxidation-state pH–Eh route remains available unchanged as a reference-specific workflow. The new map defaults to authoritative oxidation-state interpretation where the prepared registry applies; otherwise it explicitly uses EXPERIMENTAL / UNREVIEWED carrier predominance. Carrier colors are not oxidation-state colors.

Supported coordinate combinations use the existing grid validators and source preparation: pH × Eh, pH × analytical total, Eh × analytical total, and two distinct material totals. The tests exercise both redox and ordinary non-redox preparation. The distributed component must have a positive analytical inventory; unresolved/nonclosing allocation is a gap. No atom-vector or oxidation-state registry is required to rank source-component carriers. No derived-H/imposed-electron mixed boundary is enabled. Ideal 25 °C / declared 1 bar and the existing phase/gas/capacity restrictions remain.

## Actual SPANA method

See `predominance-spana-audit.md` for source anchors and answers to all ten audit questions. Predom calls HALTAFALL at every sampled point. It does not replace those solves with analytical pairwise region construction. It reuses a solver instance and supports continuation, with compact frontier storage. Graphical line intersections are not equilibrium boundary solves.

Adam therefore retains its validated independent point solver. The grid runner can project each result immediately into a compact cell record; its ordinary full-grid output and branding remain intact. No warm start, tolerance change, analytical boundary approximation or SPANA solid-first tie behavior was imported. Failed and unrun points remain dark gaps; ties remain explicit.

Click/keyboard/sample inspection reconstructs the exact input at a sampled coordinate, runs the same solver and verifies the retained classification before presenting the existing Beaker. Full quantitative grids remain available through the existing routes. New compact maps are not falsely branded as rich accepted grids.

## Scientific evidence

Focused logs: `.local/predominance-focused.txt` (5/5), `.local/predominance-ordinary-test.txt` (1/1), `.local/predominance-ui-tests.txt` (8/8). Six new tests live in `tests/predominanceArea.test.js`.

- Fe: all 2,565 points reproduce the stored exact oxidation fractions; counts Fe(0)=422, Fe(II)=581, Fe(III)=1,473, Fe(VI)=89.
- Cu: all 2,565 points reproduce the stored exact oxidation fractions; counts Cu(0)=1,179, Cu(I)=156, Cu(II)=1,230.
- Cr: 2,565 accepted points, eight dominant carriers. Every region/status/accepted-solid identity matches the rich full-grid projection. No oxidation-state metadata is inferred.
- The sampled topology is unchanged: observed displacement relative to the existing sampled reference boundaries is **0 pH units / 0 V**. This establishes projection parity, not subgrid boundary precision or a new independent thermodynamic validation.
- Exact-point inspection matches rich input IDs and result values; endpoint inspection, XY transpose, serialized definitions, analytical axes, ordinary Ca/Cl two-total axes, source-search membership, cancellation, stale definitions and unsupported mixed reservoirs are covered.

## Browser behavior and performance

See `predominance-browser-ui.md` and `predominance-browser-final.json`. The original timer-only and intermediate native-only measurements are retained separately, rather than overwritten. Final scheduling uses browser-native yielding with periodic ordinary UI-task yields. Actual UI cancellation stopped at 152/2,565 accepted points; an unrun endpoint correctly refused quantitative inspection. A 420 px viewport had no horizontal document overflow (405 px client and scroll width); desktop spatial layout and exact Beaker selection were observed.

Final single-run browser measurements, milliseconds:

| System / route | Preparation | Full solves | Region evaluations | Analytical boundary evaluations | Plot including preparation/render | Inspection |
|---|---:|---:|---:|---:|---:|---:|
| Fe full grid | 228.9 | 2565 | 2565 | 0 | 12535.7 | < clock resolution |
| Fe compact | 190.7 | 2565 | 2565 | 0 | 10622.9 | 4.3 |
| Cu full grid | 173.2 | 2565 | 2565 | 0 | 7541.6 | 0.2 |
| Cu compact | 174.2 | 2565 | 2565 | 0 | 5958.3 | 1.8 |
| Cr full grid | 152.1 | 2565 | 2565 | 0 | 14771.9 | 0.1 |
| Cr compact | 191.1 | 2565 | 2565 | 0 | 6718.5 | 2.2 |

Fe/Cu observed latency improved approximately 15%/21%. Cr improved more, but much of that difference is in unchanged solver time; runtime/JIT/load effects are not controlled. It is not defensible to attribute all of the Cr gain to this change. This is not a claim of SPANA-equivalent runtime or a new fast analytical chemical algorithm.

Serialized retained grids: Fe 45.39 MB → 1.41 MB; Cu 29.86 MB → 1.22 MB; Cr 41.37 MB → 0.595 MB (decimal). This measures serialized grid data, not total JavaScript heap. Full-grid inspection projects an already retained state; compact inspection deliberately pays for one exact solve. The harness uses identical simple SVG rendering for route comparison, excludes module/database loading, and waits two animation frames. The actual React interface was checked separately.

## Preservation and delivery

No deployment or push. No Git metadata exists in this directory, so preservation uses the pre-phase hash manifest and prior protected-file list. Source solver mathematics, thermodynamic data, references and allocation registries are protected. Final validation status is recorded below when the single full run completes.

## Final validation — 2026-09-17

The complete regression was run once: **714 tests, 713 passed, one failed, zero cancelled/skipped/todo**, in 723.5 seconds (`predominance-full-regression.txt`). The sole failure was the obsolete assertion in `fastDiagramUx.test.js` that Predominance Area remains unavailable. It now correctly checks the supported two-dimensional setup transition and preserved phase filters. The entire affected file subsequently passed **10/10** (`predominance-focused-recheck.txt`). No production code changed after the full run. This is not a claim of a second clean 714/714 full-suite execution.

All five official goldens and the Fe/Cu exact-reference and Cr 2,565-point/eight-carrier regressions passed in the full run. Production build and artifact audit passed. Lint completed with zero errors and the existing `ExpandedPlot.jsx` effect-cleanup warning. All 33 protected-file hashes and all public asset hashes are unchanged; see `predominance-preservation.json`.

The full suite regenerated `docs/closed-solids-benchmark.json` through the existing evidence writer in `tests/closedPureSolids.test.js:86`, after its scientific assertions. This generated report, including current timings, is retained and disclosed rather than silently restored. It is not a production-science edit.

Actual browser checks also confirmed a 420 px viewport without horizontal overflow, responsive cancellation, and refusal to manufacture exact inspection for an unrun cell. At cancellation the completed 152 equilibria were retained, with remaining cells left as gaps.

Implementation and validation are complete for review. No deployment or push was performed.
