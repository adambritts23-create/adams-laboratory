# Calculation setup UX refactor — 2026-09-09

Scope: existing Adam's Laboratory source project only. No deployment, remote push, solver changes, thermodynamic data changes, or Beaker architecture changes. The supplied brief ends at acceptance test A's “relevant species” bullet.

## Baseline

- Existing source directory is not a Git checkout.
- React calculation setup lives in CalculationWorkspace; authoritative chemistry and invalidation remain in laboratorySession and App. PlotWorkspace retains result inspection and synchronized Beaker state.
- Before edits: 324 tests passed, zero failures.
- Five golden benchmarks: acid-base, complexation, precipitation, redox, fixed-activity — all pass. Golden fixture SHA-256 remains aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960.
- Mn Pourbaix UI remains behind import.meta.env.DEV and collapsed development diagnostics.

## Implemented

- Scientific diagram selector replaces the primary dimensional selector: Log concentrations, Fraction diagram, Log solubilities, Calculated pH / Eh, Response surface; Predominance, Relative activities, and Pourbaix are disabled with validation-pending labels.
- Log concentration defaults show authoritative aqueous species; optional solid curves retain exact amounts and explicitly identify solid amount per kg water.
- Fraction setup asks for the distributed component and permits only the validated pH axis. A sole ordinary component is selected automatically when choosing the diagram.
- Solubility uses the existing saturated-solid interpretation; single-solid and explicit mixed-system paths retain their restrictions and phase rules. No arbitrary concentration is relabeled solubility.
- Calculated pH asks for a signed proton balance and another varied component. General calculated Eh remains unavailable in the ordinary setup. Existing specialized coordinate outputs remain accessible in Advanced.
- Response surface exposes X/Y axes, ranges, samples, Z response and species. Existing grid and 3D calculations are unchanged. Explicit multi-solid surface configurations cannot silently lose their phase policy by switching diagram types.
- Plot diagram action has a chart icon at the top and a second action at the bottom. Standalone point calculation remains in diagnostics.
- Compact component rows retain value, native unit and disclosed alternative controls/mass input. Molarity conversion remains unavailable when unsupported.
- Specialized outputs, manual Y limits and independent-system comparison are disclosed under Advanced diagram options; examples and phase details remain collapsed.
- Output patches and definition changes reach automatic recalculation together, avoiding use of the previous output family during diagram transitions.

## Validation

- Final full suite: 329 passed, zero failed (five new regression tests).
- Command: node --test --experimental-test-isolation=none src/chemistry/*.test.js src/thermodynamics/*.test.js src/thermodynamics/importers/*.test.js src/thermodynamics/importers/spana/*.test.js src/calculations/*.test.js tests/*.test.js
- npm test could not spawn isolated child processes (EPERM); the same full suite ran in Node's in-process mode, without changing package scripts or expectations.
- Build: npm run build -- --configLoader native — passed. Default config loader also encountered spawn EPERM; native loading avoided that process dependency.
- npm run lint — zero errors; one existing warning in ExpandedPlot.jsx about a cleanup ref. Build retains the large-bundle warning.
- node scripts/audit-production-boundary.js — passed.
- Logs: .local/calculation-ux-baseline.txt, .local/calculation-ux-final-tests.txt, .local/calculation-ux-production-audit.json.

Browser checks against a local production preview:

- H+/water pH 2–12 log concentrations: 51/51 points; H+ and OH- automatically visible; synchronized Beaker.
- Selected Ca2+ in System and entered 0.001 mol/kg water: 51/51 points; Ca2+, CaOH+, H+, OH- only, without Mg/Mn species.
- Calcium aqueous fraction diagram: 51/51 points, fraction-specific setup, 0–1 plot.
- Calcium response surface: 5 x 5 grid, 25/25 points, X/Y/sample and Z-species controls.
- Calculated pH versus calcium total with signed proton total 0: 51/51 points; pH is dependent.
- Manual pH Y range 6–8: applied to display; same result identity and scientific revision retained.
- Desktop visual inspection and 390-pixel mobile inspection: compact layout and no horizontal overflow. Temporary viewport override reset.
- Solubility and 3D numerical regressions are covered by the full suite; no additional manual solubility/3D browser walkthrough was performed.

No unrelated pre-existing issue was expanded into this phase.
