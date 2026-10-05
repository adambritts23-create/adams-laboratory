# SPANA-inspired Calculation UX and Wet Lab polish

Completed locally, 2026-09-17. No deployment or push.

## Production changes

Calculation now has one primary Diagram type selector associated with the setup preview. Existing shortcut buttons are secondary, inside More views and availability. The existing transition handlers still decide whether a result can be reused or needs a different calculation definition. Y/output controls sit beside the preview, X sits below it, and fixed composition and conditions remain separate. Surface setup retains two independent coordinates and a Z response. No synthetic equilibrium curve is drawn in the setup preview.

A compact live problem summary formats the current definition: varied axes, fixed totals/activities, signed H+ totals, temperature, model and declared pressure. It does not calculate chemistry or alter a request. Existing specialized legacy setup panels retain their own summaries. Predominance area retains automatic reviewed-oxidation-state/carrier selection; the explicit interpretation override is in Advanced. Examples no longer require three nested disclosures: one disclosure reaches the existing example buttons.

Wet Lab retains Titration as a subtopic and the existing general solution builders. The accepted-sample readout, dispense controls and graph now lead the right column; scope/sampling explanation and exact inspection follow below. The drawing and solution inputs remain on the left. Header photographs remain available but use compact thumbnails in Calculation/Area/Wet Lab. Mobile stacks the apparatus and full-width inputs; area selectors stack rather than compressing into a narrow row.

## Direct installed SPANA inspection

Inspected the actual Java SPANA Select Diagram Type application, without saving changed definitions or running its plot/export action:

| System / mode | Observed controls and description |
| --- | --- |
| Attickatitrering.dat / Logarithmic | Y log-concentration bounds; X analytical H+ total -1 to +1; fixed acetate total 0.5 in Concentrations box. |
| Same / Fraction | Y changes to percentage bounds 0–100; a Fractions for component selector appears. |
| Same / log Solubilities | Y log-solubility bounds; fraction selector disappears. |
| Same / Relative activities | Y log ratio description and a reference-component selector appear. |
| Same / Calculated pH | Y becomes calculated pH with 0–14 bounds; no fraction/reference selector. |
| Same / Predominance Area | Both axis quantity/component selectors and a region-component selector appear. SPANA also transforms its current range values when changing modes; Adam's existing safer explicit setup transitions were preserved. |
| Fee.dat / Logarithmic | X Eh -3 to +2, electron component; fixed analytical H+ and Fe2+ totals both 1. An explicit use Eh for e- checkbox is present. This is analytical H+, not fixed pH. |
| Same / Calculated Eh | Y becomes Calculated Eh, bounds -1 to +1; X becomes log total concentration of e-. Observing this UI does not establish numerical support in Adam. Adam's unvalidated calculated-electron-balance gate remains unchanged. |
| Cu-O2-SO2.dat / Predominance Area | Independent O2 and SO2 log-pressure coordinates, fixed Cu(s) log activity 0. The same summary distinguishes varied coordinates from fixed activity. Gas equilibrium remains unsupported in Adam; this was a UI reference only. |

The stable frame, contextual Y controls, X beneath the frame and concise problem summary informed this implementation. Relative-activity output remains validation-pending in Adam; no new output mathematics was introduced.

## Actual Adam browser workflows

Used the local application through its ordinary controls, not injected application state. Counts below are logical selections/edits/button actions from the stated starting point, not mouse-down/up events or a controlled usability study.

| Workflow | Browser result | Actions / friction |
| --- | --- | --- |
| Acetate logarithmic diagram | Carbon → acetate → Calculation; H+ total -1 to +1, acetate 0.5; 51/51 points | 8 actions from fresh System. No physical-bottle/charge requirement. |
| Fe pH sweep | pH 0–14, Fe 0.001, explicit fixed Eh 0; 57/57 points | 6 actions from Fe area to configured 1D calculation. Fixed potential remains in its existing disclosure. |
| Fe imposed-Eh sweep | Eh -2 to +2, 17 samples, fixed pH 7; 17/17 points | 9 actions from the preceding pH sweep. Input changes visibly mark the retained result stale. |
| Fe pH×Eh area | 2,565/2,565 accepted; exact-point inspection displayed | 4 actions from System example disclosure to plotted area. |
| Cu pH×Eh area | 2,565/2,565 accepted; exact-point inspection displayed | Same four-action example route. |
| Calculated pH | Acetate log total -3 to -1; H+ total 0; 51/51 points | 6 actions from acetate logarithmic output. Existing transition requires explicit new X setup; retained, not silently reinterpreted. |
| Response surface | Fe: X Eh, Y pH, Z log free Fe2+; 5×5, 25/25 converged | 6 actions from Fe Eh sweep. Interactive 3D output remains present. Eleven mesh cells spanning sampled assemblage changes remained open as before. |
| HCl/NaOH Wet Lab | 50 mL 0.1 M HCl; 100 mL loaded 0.1 M NaOH; all 107 existing samples listed | Wet Lab + Prepare, then one Near expected equivalence action selected exactly 49.99 mL, remaining 50.01 mL, beaker 99.99 mL, pH 4.99991. |

Desktop measurement at 1280-pixel viewport: apparatus/setup column top 442.5 px; live readout top 464.5 px; curve section top 629.5 px (before the final compact-header adjustment). The useful result begins 22 px below the setup column; dispense controls account for the intervening curve offset. Scope prose no longer precedes the readout. The later compact header shifts both columns upward together.

390 px: ordinary Calculation/surface, area and Wet Lab showed document width 375 px (scrollbar excluded), with no horizontally overflowing visible inputs/selectors. Area selectors were corrected to full-width stacked rows. 420 px: Calculation and Wet Lab document width 405 px. Mobile apparatus is above its solution inputs, not overlaid on them. Viewport override was reset. Browser error log was empty at the end.

## Performance observation

SPANA's inspected setup-mode changes appeared immediate. Adam's 1D controls completed quickly in browser interaction, whereas the full area and precomputed titration runs visibly require calculation time. This was not a timed, matched end-to-end benchmark and establishes no speed parity. No continuation, solver optimization or work-array changes were made. Focused cached Wet Lab test evidence reports 1,000 preview/view operations in 48.33 ms with solveRuns=1; this is a test-machine observation only.

## Validation and preservation

- 58/58 focused tests passed: diagram transitions/navigation, compaction, boundary inference, SPANA acetate/Fe analytical parity, Wet Lab exact sample/preview/cache adapters.
- 15/15 additional tests passed: three new pure summary formatter tests, Fe/Cu exact area reference controls, Cr area (2,565 accepted/eight carriers), and general ionic Wet Lab preparation/titration controls.
- Total focused validation: 73/73, no failures/skips/cancellations.
- Production build and artifact audit passed. Lint: zero errors, one existing ExpandedPlot.jsx effect-cleanup warning. Build retains its existing large-chunk advisory.
- Preservation comparison of 1,009 pre-edit files: only six existing presentation files changed; no missing/unexpected changed files. All baseline calculation/solver/thermodynamic/analysis/Beaker/backend files, original tests, public data and existing scientific reports retained identical hashes.
- New production files: src/components/ProblemSummary.jsx and src/plots/problemSummary.js. New test: tests/problemSummary.test.js.
- Full repository regression was not rerun: this phase changes layout/presentation and adds a pure formatter, not shared calculation state/routing. This follows the phase's explicit validation condition; it is not a claim of a fresh full-suite result.

Evidence: .local/spana-ux/before.json, preservation.json, focused.txt, additional.txt, build.txt, artifact-audit.txt and lint.txt. The project has no Git repository, so the preserved pre-edit hash inventory is the change baseline.
