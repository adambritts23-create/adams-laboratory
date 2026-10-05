# Imposed potential integration

The e⁻ tile occupies row 1 / column 4 of the periodic-table layout, above the transition-metal block. It dispatches the existing component toggle with the source electron ID, never an element symbol. The companion component control describes it as “electron activity / redox condition.” Selecting it creates an explicit imposed-potential request.

## Boundary conditions and scope

- Sweep Eh: fixed user pH, user Eh minimum/maximum/sample count, Eh in volts vs SHE as X. Each sample fixes electron log activity through the existing conversion and solves independently.
- Fixed Eh: a user-imposed Eh with a one-dimensional pH sweep, using the same discovery and sweep runner.
- Closed redox remains separate and unchanged. Neither route invokes the closed-redox compiler/solver. No electron analytical total is supplied.
- The existing single-family oxide/hydroxide preparation scope applies. Additional analytical families, unsupported phases or unsupported transformations retain their existing rejection behavior. Ideal activity at 25 °C and declared 1 bar is retained; gas inventories are not solved.
- Source-connected redox forms share one analytical inventory. Source basis labels such as Fe2+ identify that conserved basis, not an independently fixed oxidation-state total.
- Carrier curves do not infer oxidation states. Missing oxidation allocations do not by themselves prevent an algebraically constructible carrier calculation, using the existing generic reaction-basis fallback. This does not grant independent validation or an oxidation-state map.

## Result contract

`imposedEh.js` prepares through existing source redox discovery, reaction-basis transformation and fixed-electron preparation. It builds a normal branded one-dimensional sweep and runs `runSweep` once. The snapshot binds the source request, prepared system, scientific revision, included/excluded phase disclosure and scope identity. Forged, restored/unbranded, stale or differently scoped results cannot provide accepted inspection.

Log concentration, total fraction, aqueous speciation and single-component saturated log-solubility views reuse that snapshot through the established diagram-navigation path. Only aqueous-speciation axis eligibility changed; normalization, dissolved floor and inventory functions did not. The separate mixed-solubility overlay remains pH-only. Log solid amounts remain formula-unit amounts per kg water; total fractions remain component weighted. Zero/nonaccepted amounts and undefined solubility retain gaps. No sediment rules changed.

The existing plot selection context supplies the exact input/result to the Beaker and inspection. The readout explicitly identifies fixed pH and imposed Eh, or varied pH and fixed imposed Eh. Changing a view does not change scientific revision or run a solver.

## Focused control

Fe total 0.001 mol/kg H2O, fixed pH 7, Eh −2 to +2 V vs SHE, 17 samples:

- 17 accepted independent equilibria.
- Every concentration and accepted solid record exactly agrees with separately executed `solveFixedRedox` at the same coordinate.
- All total-fraction samples close within the unchanged balance tolerance.
- Aqueous-speciation values exactly match `aqueousFractionState`; below-resolution dissolved inventories retain its existing unavailable behavior.
- Saturated log solubility has 13 defined values and four genuine gaps.
- Both endpoints use the exact accepted input/result in inspection.
- All four curve views reuse the same branded sweep.
- Invalid/reversed/equal ranges, invalid sample counts, blank inputs, stale pH/ranges and changed phase scope are rejected.
- Fixed imposed Eh +0.35 V, pH 6–8 at three samples: 3 accepted points with explicit imposed-Eh labeling.

This is internal integration evidence, not independent validation of the full −2 to +2 V range.

## Browser verification

Verified against the built local production preview, not a deployed site:

- e⁻ tile visible above the transition-metal block and synchronized with the component checkbox.
- Element-only Fe plus e⁻ opens the imposed-potential setup and calculates 17/17 samples.
- Total fractions, aqueous speciation and log solubility switch without recalculation; the selected endpoint remains shared.
- Solid legend entry focuses and Clear focus restores curves.
- Editing fixed pH invalidates Beaker inspection until recalculation.
- Fixed-Eh setup exposes pH limits/sampling and produces 3/3 accepted points.

No deployment or push performed. Full check results and protected-file comparisons are recorded alongside this report.

Final validation: 540/540 regressions passed; zero failures/cancellations/skips/todo. Build and production artifact audit passed. Lint: zero errors, one pre-existing ExpandedPlot warning. 204 pre-existing source/public files unchanged; protected scientific files unchanged.
