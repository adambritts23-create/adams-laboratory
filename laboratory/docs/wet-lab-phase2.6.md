# Wet Lab Phase 2.6 — analytical views and transient preview

## Implemented contract

The experience now distinguishes committed selection, transient preview and displayed state. Preview validates membership in the current branded series without selecting or dispensing. Pointer leave/cancel/blur restores committed state. Click/tap selects through the original selectTitrationState contract; keyboard and sample-selector navigation remain available. Dispensing increments are based on committed inventory, not preview inventory.

The displayed state object drives apparatus, remaining/delivered/total volume, pH, graph cursor, legend and equilibrium inspection. A visible PREVIEW notice retains the committed volume. All four displayed sections carry the same state ID. No interpolation or equilibrium calculation occurs on pointer movement.

The compact selector offers Titration curve, Log concentrations, Total fractions and Aqueous speciation. Every view uses titrant volume in mL, retaining the configured titrant label. Switching views clears transient preview and retains committed selection.

## Presentation bridge and scientific boundaries

wetLabAnalysis.js consumes current experience points and validates their original branded series membership. It retains the original state/input/result references and state index/revision. It does not serialize scientific objects, forge a calculation sweep, or import a solver. Disposed experiences, copied/foreign points and stale cached-adapter access are rejected.

Log concentrations use the same extracted logConcentrationValue function as Calculation: retained finite logarithms take precedence, zeros/invalid values remain gaps, suppressed bookkeeping concentrations remain unavailable. This extraction changes no formula. The admitted aqueous catalog comes from each accepted prepared system, not hard-coded HCl/NaOH species names. Absent zero-dose sodium/chloride carriers remain gaps.

Total fractions call totalFractionState unchanged; aqueous speciation calls aqueousFractionState unchanged. Only ordinary component identities are offered. Sodium and chloride have valid positive inventories when supplied; their single-carrier fractions are 1. Signed proton-equivalent balance and solvent water are not positive material denominators and are excluded. At zero dose, an absent titrant spectator has an unavailable fraction, not a fabricated fraction or trace inventory. Fractions retain per-sample denominator and closure behavior of the existing contracts.

Carrier colors are stable by identity across view types; legend order follows abundance at the displayed state. Focus/clear-focus operates on carrier identity, and formulas stay unbroken. The current catalog has four aqueous carriers. Cached derived series are reused on hover/view changes.

## Log solubility audit — not enabled

The existing solubilityApplicability contract rejects current states because no relevant pure solid exists. saturatedLogSolubility additionally requires an accepted present or saturated-zero-amount phase, verified log saturation within the existing tolerance, and a positive dissolved inventory. Dissolved concentration alone is not solubility.

A future precipitation titration first needs reviewed reagent chemistry, prepared candidate solids, accepted phase/saturation inventories and appropriate component identity at each volume. The presentation bridge can then call the existing solubility functions per accepted state and preserve unsaturated/failed gaps. No solubility mathematics or phase support was added here.

## Future recipe integration

A future reviewed acetate recipe would first extend the validated physical/chemistry preparation scope. Its accepted ordinary component and admitted species would flow into the same volume-axis bridge, log catalog and existing fraction functions. Neither graph nor analysis adapter needs current carrier-name branches. No acetate, indicator, new redox, solid or gas chemistry was added.

## Validation evidence

Focused: 45/45 passed, including both orientations, standard coordinates 0/25/49.99/50/50.01/100 mL, a 25 mL sample, preview/leave/commit/reset, immutable input/result references, forged/foreign/stale rejection, fraction parity and log-value parity with existing contracts.

Performance: 1,000 cached preview/view operations took 30.29 ms in the focused run; solveRuns remained 1 (the initial prepared series). This measures adapter operations, not a browser frame-rate claim. Repeated moves within the same nearest state skip a React state update. Derived scientific outputs are cached; rendering only reads them.

Browser checks through the real System-selected H+/water/Na+/Cl- workflow:
- Standard committed 25 mL, pointer preview 50.01 mL: pH 9.00150, total volume 100.01 mL, remaining 49.99 mL; all four displayed state IDs identical.
- Pointer leave restores 25 mL, pH 1.47712 and 75 mL total volume. Click commits 50.01 mL and removes preview status.
- Switching to Log concentrations retains the committed state; pointer preview reorders the legend by actual displayed abundance.
- Both fraction views preview cached physical states and retain zero-dose sodium gaps. Keyboard endpoint navigation works.
- Exact 49.99 mL sample selection gives pH 4.99991 and 99.99 mL total volume. Exact near-equivalence preview identity is also covered by backend tests; dense samples can fall within the same physical screen pixel.
- Custom 25 mL sample reaches pH 7.00075 at 25 mL added, total 50 mL. Reverse configuration starts at pH 13.00150 and labels HCl addition correctly.
- Carrier focus and clear focus work; desktop graph/legend visually inspected. Browser warning/error log empty.
- Click path is hover-independent and serves tap selection; physical touch hardware was not used.

## Preservation and final checks

Phase-1 engine, Phase-2.5 preparation, physical convention, fraction/solubility functions, thermodynamic source data, solver and other chemistry remain unchanged. The only shared Calculation change extracts its existing logarithmic presentation expression into a common function used by both consumers.

See wet-lab-analytical-before.json and wet-lab-analytical-changed.json for hashes, and wet-lab-analytical-focused.txt for focused results.

Full regression: 635/635 passed, zero failures/cancellations/skips/todo, 543.041 seconds. Run once after focused and browser validation (wet-lab-analytical-regression.txt). Existing scientific golden/reference regressions passed. Production build passed and dist regenerated (wet-lab-analytical-build.txt); existing bundle-size advisory remains. Artifact audit passed (wet-lab-analytical-artifact.txt). Lint completed with zero errors and the one pre-existing ExpandedPlot.jsx hook-cleanup warning (wet-lab-analytical-lint.txt). No deployment or push. Phase complete; stopped for review.

