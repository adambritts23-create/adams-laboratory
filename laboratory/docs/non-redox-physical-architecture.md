# Pre-implementation boundary audit

`compileEquilibriumNetwork` dispatches `closed-physical` exclusively to `discoverGeneralClosed` / `prepareGeneralClosed`. Discovery requires a supplied reagent participating in electron-bearing aqueous chemistry (`no-connected-redox-family`); preparation calls the closed-redox compiler with internal electron elimination. Removing that guard cannot produce a correct non-redox boundary.

The existing `analytical-components` branch already compiles all compatible direct source formation laws, validates atom/charge transport, prepares signed component totals and calls `solvePoint`. Its excluded-phase criteria can be reused. `createPointInput` accepts signed proton totals; those do not constitute physical reagent inputs. It does not impose a separate electroneutrality equation: neutral physical input plus charge-conserving source equations should imply neutral equilibrium, which the new adapter must check explicitly.

Plan: add explicit `closed-physical-nonredox`, transform nonnegative source-bound physical contributions into internal component totals, then share the existing direct aqueous compilation/solve machinery. Preserve a separate physical preparation, source fingerprint, revision and solvent convention in system identity. Return derived pH and explicit unavailable Eh/pe. Leave the existing redox path and all solver code unchanged.

Source-bound components and directly represented aqueous products can be supplied; a product's retained formation coefficients define its conserved coordinates, not its final equilibrium amount. NaOH contributes +Na, −H and +water bookkeeping per supplied formula unit. Water remains fixed activity, not an analytical solute total. Validate total physical charge before solving and equilibrium charge afterwards.

Scope nuance from targeted audit: hypothetical Na metal and reduced boron solid records require electrons; water-only electron reactions also exist. They cannot be numerically phase-tested without an electron potential. The requested aqueous non-redox model must disclose these as outside its boundary, never assign them zero activity. Aqueous electron-transfer connectivity involving a supplied solute (or its reachable ordinary products) must refuse the boundary. Ordinary excluded solid/gas laws that require only the actual non-electron basis retain the existing numerical relevance checks. This is a conditional aqueous model, not proof of stability against every possible electrochemical phase.

HCl is not a clean general non-redox control: chloride has connected aqueous chlorine redox records. Prefer the already validated acetic-acid-only control, using its saved independent reference, rather than suppress chloride chemistry or rewrite the historical restricted HCl/NaOH Wet Lab scope.

Only focused adapter and directly affected compiler tests will run. No full regression, build, browser, artifact audit or repository-wide hashing.
