# Wet Lab Phase 2.5 — System-connected experiment preparation

## Scope and implementation

Reviewed HCl/NaOH physical recipes are now gated by the selected System component identities, enabled aqueous phase, included water reaction, and the existing Phase-1 source fingerprints. Missing requirements are listed explicitly. Wet Lab never adds components to System. Only the configured reviewed recipe inventories enter this restricted experiment; other selected chemistry is not silently included.

Sample and Burette panes configure reagent, mol/L concentration and mL volume, and show solute moles from `prepareStockSolution`. Prepare experiment binds the accepted series to its setup revision and System identity. Editing either preparation or changing System disposes the former experience and hides its apparatus/selection until explicit re-preparation. Restoring a former System does not revive an old result. The validated example populates fields only.

Both HCl sample/NaOH titrant and NaOH sample/HCl titrant use the unchanged Phase-1 preparation, dispensing, mixing, titration and exact-state selection APIs. There is no new equilibrium formula. Sampling spans the configured loaded volume with additional coordinates around a reagent-inventory equivalence estimate. The estimate controls navigation only, never pH. Same-reagent preparations have uniform sampling and no equivalence shortcut; insufficient titrant retains the accessible partial experiment.

Apparatus fill, readout, selected curve point and inspection share the accepted state. Capacity, initial beaker volume, axis ticks, labels and accessible controls use the configured experiment. Schematic scaling remains explicitly approximate.

## Browser validation

Tested through the actual System and Wet Lab UI at localhost, with explicitly selected H+, water, Na+ and Cl- and included water chemistry.

| HCl sample | NaOH burette | Equivalence added | Total volume | Accepted pH | Na and Cl mol/kg model H2O at equivalence |
|---|---|---:|---:|---:|---:|
| 50 mL, 0.1 mol/L | 100 mL, 0.1 mol/L | 50 mL | 100 mL | 7.00075 | 0.05 each |
| 25 mL, 0.1 mol/L | 100 mL, 0.1 mol/L | 25 mL | 50 mL | 7.00075 | 0.05 each |
| 50 mL, 0.05 mol/L | 100 mL, 0.1 mol/L | 25 mL | 75 mL | 7.00075 | 0.033333333333 each |
| 50 mL, 0.1 mol/L | 100 mL, 0.2 mol/L | 25 mL | 75 mL | 7.00075 | 0.066666666667 each |

All four inspected states had zero proton-equivalent inventory and H+/OH- concentrations of 9.9827455148e-8 mol/kg model H2O. These values come from accepted equilibrium inspection, not a UI equivalence formula.

Additional browser checks:
- 50 mL of 0.2 M HCl reaches pH 7.00075 at the 100 mL burette endpoint, total volume 150 mL, zero remaining titrant. Apparatus/readout/chart state IDs agree.
- Reverse orientation starts at pH 13.00150 and reaches pH 7.00075 after 50 mL HCl.
- 20 mL loaded HCl burette ends at 20 mL, leaves a 70 mL beaker, disables further increments and omits the unreachable equivalence shortcut.
- The shortcut moves to 24.99 mL for the 25 mL estimate.
- Reset, sample selection and keyboard End navigation work.
- Negative setup input disables preparation and explains the invalid input.
- Editing setup hides the previous apparatus and marks it stale.
- Removing Cl- in System disables HCl and marks the experiment stale. Restoring Cl- still requires preparation.
- Initial H+/water-only System explains both missing recipes; no components are inserted.
- Desktop setup and apparatus layout inspected visually.

## Preservation

The before snapshot covers 799 existing files. Only five pre-existing files changed: App.jsx, wetLabExperience.js, WetLab.jsx, WetLab.css and wetLabExperience.test.js. New implementation files are wetLabSetup.js and wetLabSetup.test.js. All snapshotted solver, thermodynamic data, Phase-1 chemistry/state engine, closed-redox, Pourbaix and analytical-view scientific files are unchanged.

See wet-lab-setup-before.json and wet-lab-setup-changed.json. No deployment or push.

## Validation status

Focused suite: 28/28 passed, zero failures/skips/cancellations/todo (wet-lab-setup-focused.txt).
Full regression: 628/628 passed in 572.892 seconds, zero failures/cancellations/skips/todo. Run exactly once after focused and browser validation (wet-lab-setup-regression.txt). Existing golden/reference regressions pass unchanged.

Production build: passed; dist regenerated (wet-lab-setup-build.txt). Existing bundle-size advisory remains.
Artifact audit: passed; approved source/static assets and boundary checks intact (wet-lab-setup-artifact.txt).
Lint: zero errors; one pre-existing ExpandedPlot.jsx hook-cleanup warning (wet-lab-setup-lint.txt). No new warning from this phase.

Phase complete. No deployment or push. Stopped for review.

