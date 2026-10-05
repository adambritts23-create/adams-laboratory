# Closed reagent Calculation UI integration

## Result and supported scope

The Calculation workspace now exposes **Closed reagent / automatic redox** for the reviewed Fe(II)/H2O2 component selection without e-. It runs the unchanged Step-5 `runClosedReagentSweep`: each supplied dose independently discovers, prepares and solves its closed equilibrium. There is no ordinary-sweep fallback.

Select Fe2+, H2O2, H+, Cl- and H2O in System, then choose the closed mode in Calculation. Alternatively, open **Load example… → Load reviewed Fe(II) / H2O2 closed addition**. The reviewed recipe is displayed explicitly: Fe 1e-6 mol/kg H2O supplied as Fe(II), H+ 0.01, Cl- 0.010002, ideal 25 C, 1 bar declared, water activity 1. Only the supplied peroxide range and sample count are editable within this mode. Ordinary settings are preserved separately and restored by explicitly selecting the ordinary mode.

The supported addition interval remains 0 to 1e-6 mol/kg H2O. Unsupported doses remain gaps; unsupported selections, selected electrons, changed source data, custom reaction exclusions/additions, stale results and cancellation cannot produce an ordinary result in their place. No new chemical scope is claimed. Solids, gas inventories and chloride redox retain the Step-5 exclusions. pH and Eh are outputs; no fixed-pH or imposed-potential inputs are exposed in closed setup.

## Accepted-result presentation

The presentation bridge retains the exact accepted input and result objects for every sample. Its runtime brand is required by shared output/selection adapters. It does not call a solver. Log concentrations, Total fractions and Aqueous speciation share this one accepted sweep; view changes do not recalculate it. The fraction views use the unchanged component-weighted mathematics for conserved Fe across all admitted oxidation states. Reactive peroxide is not presented as a separately conserved final material inventory.

The X axis explicitly says **Supplied H2O2**. Its species curve explicitly says **Residual equilibrium H2O2**. The existing Beaker/inspection panel displays derived pH and Eh versus SHE, supplied and residual peroxide, the generated source-algebra net redox reaction and signed extents. It uses the same selected accepted sample as the plot. Source reactions remain inspection details; no kinetic pathway or Fenton/radical model is implied. Log solubility and Pourbaix remain unavailable in this bounded aqueous closed mode.

Numerical JSON exports retain each input, result and generated closed inspection alongside the shared prepared system. Repeated full prepared networks are omitted from each sample's export wrapper. JSON's standard conversion of signed zero to zero is covered by serialization comparison; in-memory scientific objects remain unchanged.

## Reference check

The 21-dose UI integration run is strictly equal to every saved Step-5 broad-sweep pH, Eh and carrier amount. At supplied peroxide 2.5e-7 mol/kg H2O:

- Derived pH: 2.0008757578290273.
- Derived Eh: 0.7517778984871895 V versus SHE.
- Residual peroxide: 6.4136494180820145e-31 mol/kg H2O.
- Generated primary reaction: 2 Fe2+ + H2O2 + 2 H+ → 2 Fe3+ + 2 H2O.

These are the existing conditional Step-5 results, not a new independent validation campaign.

## Verification

- Focused integration, original Step-5 chemistry, artifact approval and output/export tests: **31/31 passed** (`closed-reagent-ui-focused.txt`).
- Full regression: **584/584 passed**, zero failures, cancellations, skips or todo; 413.345 seconds (`closed-reagent-ui-final-regression.txt`). Existing Fe/Cu references, Pourbaix/imposed-Eh behavior and official golden checks pass. Node used `--experimental-test-isolation=none` to avoid the sandbox's blocked test-worker child-process spawn; no test files were omitted.
- Production build: passed with `npm run build -- --configLoader native`. The native loader avoids the Windows sandbox's blocked config-bundler child process. Existing large-chunk advisory remains.
- Production artifact audit: passed (`closed-reagent-ui-artifact.txt`). The first production inclusion of Step-5 metadata required a pinned approval manifest for that exact unchanged registry. Altered, duplicated and extra payloads are tested as rejected; the artifact detector itself is unchanged.
- Lint: zero errors, one existing `ExpandedPlot.jsx` effect-cleanup warning.
- Built-page browser check: reviewed example, 21/21 calculated samples, selected benchmark readout, all three views, unchanged selected input identity across view switches, and explicit return to ordinary setup.
- Hash comparison: 229 pre-existing files checked; all **72 protected files unchanged**, including solver, thermodynamics/source data, analysis contracts, closed-reagent runner, original Step-5 test and reference evidence. Details: `closed-reagent-ui-before-hashes.json` and `closed-reagent-ui-after-hashes.json`.

The initial full regression caught an export-layer dependency on a calculation module. That dependency was removed without changing the existing architecture test. A newly added export round-trip assertion was also corrected to compare serialized values: JSON does not distinguish negative zero from zero. Neither correction changes chemistry. Earlier logs are preserved separately. No deployment or push was performed.
