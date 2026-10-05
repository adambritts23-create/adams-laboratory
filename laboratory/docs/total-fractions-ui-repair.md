# Total fractions UI regression repair

## Cause

Total fractions already used ScientificPlot, usePlotGestures and ResultSelectionContext. No separate solver or interaction renderer had replaced them. The regression was the shared permanent live-readout legend: total and dissolved percentage prose filled an auto-sized value column inside a fixed-width sidebar, while the formula column allowed overflow-wrap:anywhere. This squeezed names into character-by-character wrapping and consumed plot width.

## Repair

ScientificPlot now uses one compact color/focus legend for all its 1D diagrams, including single-series plots, with every visible aqueous and solid carrier. The permanent Species at pH readout is removed. Formula labels stay on one line, with scrolling for constrained containers. Quantitative sample readout remains in the established hover/click inspection, including both denominators for aqueous carriers and total fractions for solids; exact partition/phase/amount data remains available there.

The existing pointer, hover, drag, wheel, keyboard and shared selected-result context were retained unchanged. Beaker code was not modified. No new interaction system or recalculation path was introduced.

## Verification

- 43/43 relevant regression tests passed: total fractions, aqueous fractions, fraction readout, diagram switching and workspace selection/navigation.
- 2/2 new shared gesture-handler tests passed: hover, pin, leave, drag, wheel and keyboard navigation. Executed without process isolation because this workspace blocks child test-process spawning.
- Production preview: Fe3+ total 1, 51/51 pH samples. All ten aqueous/solid legend entries present. Plot click pinned sample 27; keyboard sample increment moved to 28 and the Beaker matched. Switching to Aqueous speciation and back retained sample 28 and the same sweep without recalculation.
- Desktop plot width equals available chart width (855 px); phone-width check also matches (317 px). All ten formulas remain single-line. No browser console errors.
- Production build and artifact audit pass. Lint: zero errors, one existing ExpandedPlot.jsx cleanup warning.
- Before/after hashes across src and public show only src/components/ScientificPlot.jsx and src/App.css changed. All calculation mathematics, normalization, inventories, solver, thermodynamics, tolerance and Beaker source files are byte-identical. Hash evidence and logs: .local/total-fractions-ui/.

Test changes: tests/fastDiagramUx.test.js includes Total fractions in accepted-sweep reuse; tests/plotGestureInteraction.test.js exercises the actual shared handlers through lightweight hook/DOM boundaries.

Production dist rebuilt locally. No deployment or push. Stopped for review.
