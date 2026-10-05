# Total fractions readability and phase presentation

Presentation-only pass. Total fractions, aqueous speciation, accepted inventories, componentPartitions, solutionSummary, solver, thermodynamics, tolerances, gestures and result-selection code remain unchanged.

## Changes

- Compact legend entries carry explicit Aqueous/Solid badges. A shared denominator note states that both phases use the total analytical component.
- Focusing a Total fractions legend entry displays a compact, conditional carrier readout: formula, phase, exact selected coordinate and existing formatted total fraction; aqueous carriers additionally retain their dissolved fraction. It uses legendReadout on the same derived sample, without a second allocation calculation.
- The existing Beaker component partition appears before the detailed solution summary, with Total component, Dissolved and Solid-bound labels and each accepted solid's total fraction. The existing within-dissolved leader/other summary follows. All values come from the original componentPartitions and solutionSummary functions.
- Formula spans prohibit character wrapping. No side pane or new interaction system was introduced.

## Validation

56/56 focused/relevant regressions passed: totalFractions, fastDiagramUx, workspaceUx, fractionReadout, aqueousFractions, plotGestureInteraction and beakerPresentation. This covers same-sweep switching, normalization preservation, accepted inventory, hover/pin/leave, pointer navigation and keyboard behavior.

Production browser checks (Fe3+ total 1, 51 pH samples):
- All ten carriers have phase badges; both aqueous and solid buttons remain selectable.
- Hematite focus at pH 0 shows 10.1% of total; clicking the plot selects sample 27, pH 7.56, and its focused readout shows >99.9% of total.
- Beaker at the same point reports dissolved <0.1%, solid-bound >99.9%, and within-dissolved Fe(OH)3 69.2% / other forms 30.8%.
- Focusing Fe(OH)2+ shows <0.1% of total and 30.2% of dissolved component. No example percentages were hardcoded.
- Keyboard increment updates Beaker sample to 28. Clear focus resets selection of the carrier and removes the conditional callout. Existing sample selection remains intact.
- No browser console errors.

Build and production artifact audit passed. Lint has no errors and retains the existing ExpandedPlot.jsx cleanup warning. Before/after source and public-file hashes are recorded in .local/total-fractions-readability/hash-review.json; only presentation components and App.css changed. No scientific functions or static data changed.

Production dist rebuilt. No deployment or push. Stopped for review.
