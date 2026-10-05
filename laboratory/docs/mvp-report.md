# Chemistry MVP implementation and scientific scope

## General constructor

`src/thermodynamics/equilibriumConstructor.js` provides the shared entry for ordinary Calculation, general physical Wet Lab, reviewed canonical imposed preparation, and general source-basis imposed preparation. It dispatches to existing validated adapters and preserves their original result objects/brands and system identities. It does not unify their genuinely different balance equations or introduce a solver. Physical inventories, source identities, solvent/phase scope and revisions remain owned by those adapters.

This is a common construction interface, not a claim that every historical path has been eliminated. Reviewed HCl/NaOH compatibility and the reviewed Fe/peroxide experiment retain their explicitly restricted historical adapters. Ordinary source-basis calculations still have their existing availability checks.

## Hydrogen and electron boundaries

| H+ | Electron | Status / balance meaning |
|---|---|---|
| Imposed | Not connected | Existing activity-constrained ordinary calculation; proton balance replaced by reservoir activity. |
| Derived | Not connected | Signed proton/source inventory or closed non-redox physical preparation; electron potential not determined. |
| Imposed | Imposed | Existing source-basis/canonical imposed calculation; proton and electron reservoirs replace corresponding balances. |
| Imposed | Derived | Unavailable; mixed reservoir/closed conservation not validated. |
| Derived | Imposed | Unavailable; mixed reservoir/closed conservation not validated. |
| Derived | Derived | Closed source-connected physical equilibrium, subject to existing charge, source and phase checks. |

Supported here means a supported contract within an admitted source system, not universal solvability. Electron is never a supplied conserved reagent. Gas reservoirs cannot be inferred from H/e reservoirs.

## Calculation

The primary mode dropdown is replaced by compact Hydrogen boundary / Electron boundary controls under Equilibrium constraints. Transitions use existing definition edits and stale-result invalidation. Changing the hydrogen boundary removes incompatible varied-H coordinates and clears its numeric value rather than reinterpreting pH as a material total. Closed physical preparation remains a separate input adapter, accessible from the source-network disclosure. Existing output tabs remain the only primary view selector. The closed panel identifies both activities as derived. Browser checks are in `mvp-browser-check.json`.

## Pourbaix

Discovery now obtains HYDRA product membership from the same `searchComponentSystem` oracle used by the inspector. The retained material/phase scope is separately disclosed. Reviewed serialization and exact Fe/Cu system identities remain intact. General basis construction goes through the common entry. Extra selected independent source components can supply explicit fixed analytical totals; rank/stoichiometry/phase checks remain authoritative. No new element branches or oxidation-state inference were added.

The small Cu/chloride experiment (0.001 total Cu, 0.02 chloride; pH 2/6/10, Eh -0.5/0/+0.5) is experimental/unreviewed: 6 accepted points and 3 genuine gaps. It is evidence of integration, not independent validation or a continuous supported domain. Unsupported and failed points are not filled. Source systems still must admit a nonnegative independent inventory basis, supported phase count and source precision. Full arbitrary multi-family chemistry is not claimed.

`mvp-pourbaix-focused.txt` records the first Fe/Cu reference-gate pass. `mvp-final-focused.txt` records 33 later focused checks including retained Fe/Cu full-grid fractions/topology, Cr full-grid carrier behavior, uranium readiness, imposed-Eh behavior, constructor and general chloride controls.

## Wet Lab

All four 101-point series (HCl, acetate, CrCl3, mixed acid/base) were rerun twice and compared exactly against the saved independent-per-dose construction output. Cu/chloride, nitrate and a multicomponent Na/K/chloride preparation were additionally executed through the actual Wet Lab stock/preparation/solve APIs; see `mvp-wetlab-controls.json`. No example recipes were added.

The physical scope still declares Ideal 25 C, 1 bar and the existing additive-volume/model-solvent convention. Charge and source identities remain required. Derived pH/pe, accepted solids, source-component views and optional elemental views retain their existing contracts. Focused inspection tests establish zero new solves during cached preview/view operations. Historical restricted compatibility scope is explicitly retained; this phase does not turn that restricted chemistry into general chlorine redox.

## Gas audit

No gas boundary was added. Current gas records support excluded-phase activity/fugacity diagnostics; that does not establish a gas inventory or an imposed fugacity problem.

An open gas reservoir must explicitly bind a source gas identity/activity and replace the appropriate independent balance combination, with declared fugacity standard state. Merely admitting a gas record as an aqueous product would incorrectly count its activity as molality. A finite headspace requires a separate amount/activity relation using volume, temperature and pressure conventions, and its contributions in every relevant closed conservation equation. Existing pure-solid complementarity is not that relation. These changes need dedicated boundary validation, so both remain explicitly unsupported. No gas kinetics, nucleation or overpotential is claimed.

## Performance

A three-point acetate CPU profile found full-database structured cloning dominant (several seconds including startup), versus millisecond point solves. `nonRedoxScope` now reuses only frozen structural connectivity results for trusted immutable repository snapshots and exact ordered selected support, bounded to 32 entries. Mutable repositories remain uncached. The catalog comes from the existing frozen repository catalog. Zero-dose support remains a different key. No inventory, accepted equilibrium, dose, revision or preview state is cached.

Cold means first execution of each experiment in one fresh process; repository load is outside measured prepare time. Warm means repeating the same experiments in that process. These are adapter timings, not browser frame rate. Timings include real independent solves at every dose. Existing compiler timers combine some physical/phase preparation work; the CPU profile distinguishes cloning from numerical solving but is not an exhaustive seven-category instrumentation system.

| 101 points | Previous cached phase (s) | MVP first sweep (s) | MVP warm sweep (s) |
|---|---:|---:|---:|
| HCl | 0.070 | 0.065 | 0.110 |
| Acetate | 123.280 | 3.755 | 3.459 |
| Chromium | 84.766 | 19.154 | 19.710 |
| Mixed | 119.018 | 4.535 | 3.974 |

Cold preparation: 0.007 / 1.496 / 1.482 / 0.112 s respectively. Warm preparation: 0.002 / 0.050 / 0.222 / 0.058 s. Chromium remains the slow case. Full exact comparison includes pH, pe, carrier IDs, concentrations, log activities, solids (amount/status/saturation), diagnostics and accepted/unavailable status: 404/404 in each run. Evidence: `mvp-performance-run.txt`, `hydra-performance-mvp-cold-final.json`, `hydra-performance-mvp-warm-final.json`, compared to the unchanged `hydra-performance-before.json`.

## Reaction search and limits

The inspector retains aqueous/solid/gas/electron-transfer groups and expands source identity, reaction, log K and provenance on demand. Formula labels remain intact. Database membership does not imply admitted equilibrium inventory or phase stability.

Remaining limits include mixed imposed/derived redox reservoirs, finite/open gas boundaries, nonideal closed physical models, source precision/fractional admission, existing capacity bounds, missing reviewed oxidation/elemental metadata, and kinetics/nucleation/hysteresis. Additional Pourbaix totals are independent source coordinates, not automatically merged oxidation-state totals. General systems are internally checked and may have gaps; they do not inherit external reference claims.

## Validation

Initial repaired-baseline checks: 6/6. Historical pre-repair full suite remains 701/703. New constructor/reuse tests pass; later focused integration 41/41 and final focused group 33/33. Final full regression/build/audit/lint/hash results will be appended after completion. No deployment or push.

Final validation completed:

- Full repository regression: **708/708 passed**, zero failures/cancellations/skips/todo; 386194.5222 ms. One full run in this phase, no rerun needed. All five official golden benchmark checks pass.
- Production build: passed, 245 modules; `dist/index.html` and production assets generated. Existing large-chunk warning remains. The existing local Vite launcher avoids the environment's unavailable `net use` subprocess; project configuration and dependencies are unchanged.
- Artifact audit: passed; approved thermodynamic data SHA-256 remains `9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245`. No unintended local files shipped.
- Lint: zero errors, one pre-existing `ExpandedPlot.jsx` cleanup-ref warning.
- Preservation: **33 protected files unchanged**, including solver files, numerical tolerances, source-reduction mathematics, data and all 14 previously pinned independent/golden reference files. `mvp-preservation.json` lists hashes and the 12 modified existing source files. New files: `equilibriumConstructor.js`, `equilibriumConstraints.js`, `EquilibriumConstraints.jsx`, `tests/mvpConstructor.test.js`.
- No deployment or push. Stopped for review.
