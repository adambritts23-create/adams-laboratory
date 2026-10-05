# Phase 4 — Live session and solver validation preparation

Date: 2026-09-05. Phase 3 import work was reused. No production equilibrium solver or plotted result was added. The only equilibrium execution was the isolated official Java reference implementation, expressly requested for comparison fixtures.

## 1. Files changed

Added:

- `src/session/laboratorySession.js`: React-independent live session and immutable transitions.
- `src/calculations/definition.js`: calculation schema, source-mode mapping, unit/capability validation and input-coordinate conversion.
- `src/calculations/definition.test.js`: session, condition, unit, serialization and invalidation tests.
- `src/components/CalculationWorkspace.jsx`: live definition controls and explicit no-result placeholder.
- `src/solver/validationContract.js`: proposed reference acceptance criteria; no solve function.
- `scripts/ReferenceProbe.java`: test-only adapter calling unchanged official Java classes and serializing their double values.
- `scripts/run-java-references.js`: reproducible EC execution and full-precision capture.
- `scripts/prepare-java-references.ps1`: prepares pinned Java reference sources/classes under ignored `.local/`.
- `tests/referenceIntegrity.test.js`: source equality, reference integrity, mass-action and balance checks.
- `tests/fixtures/eq-diagr/references.json`: exact inputs, EC stdout/output tables/logs, full-precision values, commands, versions and source hashes.
- `docs/phase4-report.md`: this report.

Modified: `src/App.jsx`, `src/App.css`, `src/components/SystemDefinition.jsx`, `src/solver/contract.js`, `package.json`, `README.md`, `docs/scientific-architecture.md`. `dist/` was rebuilt. Local Java source/classes/input/output reside under `.local/phase4-reference/` and remain outside the browser bundle. The original source ZIP and installation were not changed. Vite base remains `/adambritts-site/laboratory/`; dependencies are unchanged.

## 2. LaboratorySession

The session owns ChemicalSystem, ThermodynamicDataSelection, CalculationDefinition, nullable CalculationResult, AnalysisState and VisualizationState. Source selections retain repository source identifiers; imported record IDs embed the database hash prefix and byte offset. The underlying Phase 3 snapshot retains full hashes and provenance.

System and Calculation workspaces use the same reducer-owned session. Switching views does not change the chemistry or scientific revision and requires no file operation. Calculation edits increment revision and clear results/analysis; system edits reconcile removed components, selected outputs and enabled phases. Temperature and pressure are shared. Removing e− or H+ removes corresponding conditions and resets incompatible calculated-output modes. Existing analytical element totals remain explicitly separate from source-component balances.

Serialization helpers are separate from normal workflow. Deserialization checks the version/shape and discards any persisted result; it is not a complete untrusted-file import validator or a repository resolver. There is no persistence UI in this phase. Result commits, workers, cancellation and debounce are future orchestration work, not a running solver.

## 3. CalculationDefinition

The versioned model contains the scientific output type (codes 0–8), selected species, target component/reference species, fixed component conditions, an independentVariables array, temperature, pressure, ionic-strength mode/value/unit, activity-model selection, enabled phases and Cartesian sampling budget. Each varied condition has its own bounds and point count. Fixed conditions and varied conditions are separate arrays, with exactly one condition per selected component.

The current implemented independent variables are source-component total or activity coordinates. Multiple such axes can describe pH×Eh or pH×total requests. Temperature/pressure are currently fixed; future varying physical parameters require a tagged axis extension and validated thermodynamic evaluator, not a different solver. Calculation dimensionality is independent from the visualization-state dimension. No coordinates are evaluated into equilibrium results.

Modes remain scientific quantities: predominance, fraction, log solubility, log concentration, relative log activity, calculated pe/Eh, calculated pH, log activity and hydrogen affinity. Predominance requires two axes and a target component. Relative activity needs a reference species. Full scientific requirements (including hydrogen-affinity construction and phase classification) still belong to future solver readiness checks. Structural definition validity is not solvability.

## 4. Exact T/TV/LTV/LA/LAV mapping

| Mode | hur | kh at each point | Meaning | Point input |
| --- | ---: | ---: | --- | --- |
| T | 1 | 1 | Fixed signed component total | tot=value |
| TV | 2 | 1 | Linearly varied component total | tot=sample |
| LTV | 3 | 1 | Linearly varied log10 numerical total | tot=10^sample |
| LA | 4 | 2 | Fixed log10 activity | logA=value |
| LAV | 5 | 2 | Varied log10 activity | logA=sample |

EC.readConcentrations prepares the samples; EC.main assigns tot/logA and calls HaltaFall.haltaCalc. SED follows the same per-point boundary. Display pH/pe/Eh coordinates transform to logA first. Increasing pH/Eh bounds therefore map to decreasing electron/proton logA bounds; endpoint order must not be silently sorted after transformation. The app stores increasing user-coordinate bounds and transforms individual coordinates.

Signed source-basis totals are allowed; these are not arbitrary nonnegative elemental inventories. LTV can represent only positive totals. Molarity is a valid distinct draft unit but the source-input conversion rejects it pending an explicit conversion basis.

## 5. H+ and pH

H+ is a selected component with its own column, not analytical hydrogen atom content. Fixed pH p means LA=-p, kh=2 and ChemConcs.logA[H+]=-p. Varied pH uses LAV with the same negation per point. HALTAFALL converts stored log10 activity to its internal natural logarithm via ln(10)*logA, preserves fixed-activity variables and computes their component totals as outputs.

A total-proton constraint (kh=1) is a different problem: proton activity/pH is then calculated. With H+ absent as a component, the pH input capability is unavailable in this app. The upstream plot reader can identify a proton species for calculated output where present; controlling pH still requires a suitable component basis. The app deliberately requires explicit proton selection and does not infer capability from an element or a formula substring.

## 6. e−, pe and Eh

The electron component has noll=true: it participates algebraically in reactions/activity constraints while its species concentration is zero. Fixed pe p maps to LA=-p; varied pe maps to LAV. Fixed/varied Eh E maps to logA(e−)=-E*F/[R*ln(10)*(T+273.15)]. EC/SED then place this in ChemConcs.logA with kh=2; HaltaFall consumes the natural-log form in its mass-action equations. Total(e−) can be a signed algebraic output and is not a dissolved electron concentration.

A source detail matters for reproducibility: Spana.MainFrame uses R=8.31446 and F=96485.309, whereas EC.tablePrint uses R=8.31446261815324 and F=96485.3321233100184. The new input helper explicitly uses EC’s constants, parsed to IEEE-754 doubles. This small rounded-constant difference must be declared in a strict Spana UI round-trip comparison. Temperature is required for Eh conversion; pe itself is dimensionless. Potential is stored in V versus SHE; EC tables display mV. No concentration/activity conversion occurs here.

Pourbaix requires proton and electron control, two independent axes and a declared computed predominance rule. Explicit e− selection remains the domain gate. No Pourbaix calculation exists yet.

## 7. Water

ReadChemSyst identifies jWater and sets water concentration suppression flags for aqueous systems. EC explicitly rejects water T/TV/LTV and states that calculations are made for 1000 g of water. Water is not a 55.5 mol/L analytical-total input. In the ideal reference cases water has LA=0, activity one, and C(H2O)=0 in the bookkeeping array. That zero does not mean the solvent is absent.

The nonideal Factor layer can calculate water activity from osmotic coefficient and summed molalities. The current app only permits LA=0 water in calculation definitions and labels nonideal water handling as future work. It does not invent or apply water activity corrections.

## 8. Matrix construction

The exact writer path is DataBase `ExitDialog.saveDataFile`, following `DBSearch.searchComplexes`. It writes component counts/names in the selected order. For each reaction product it evaluates the source thermal model at the requested conditions and writes logK, then looks up each selected component by name, writes its reaction coefficient or zero. The normal writer formats constants/coefficients, so precision can be reduced at file export. Our benchmarks retain the exact stored 25 °C constants instead of reproducing export rounding.

`ReadChemSyst.readChemSyst` reads na,nx,nrSol,solidC, sets mSol=nrSol+solidC and Ms=na+nx+mSol, reads ordered component names and product records, assigns lBeta[i-Na]=storedLogK and copies each coefficient row directly into a[i-Na]. No atomic-composition reconstruction is involved. The component species themselves supply the identity-basis contributions to component balances; product rows are signed source-component coefficients.

Solid components are handled through suppressed fictive aqueous component entries plus added identity solid-product rows (coefficient one, logK zero). Solid reaction products occupy the final product block. Electron, solvent and disabled species flags are distinct from the stoichiometric columns. A pure solid’s equilibrium condition uses unit activity when present; amount and saturation are separate quantities.

## 9. Basis dependence

DBSearch.redoxChecks warns about potentially related choices such as Fe(II)/Fe(III), but permits an explicit Continue. It is not a generic proof of independence. In the traced writer/reader path no general component-basis rank certification was found. HALTAFALL does perform singularity handling for solid-combination submatrices; that is not equivalent to a general semantic basis-independence test.

Do not rank-test the product-only a matrix and call that basis validation: even an entirely free-component system has a valid identity basis with no product rows. Adam’s future basis preparation must track reaction-equivalent choices, enforce supported constraint combinations and diagnose redundant thermodynamic relationships before solving. Current component choices remain an unresolved draft; this phase establishes the contract rather than certifying arbitrary systems.

## 10. DBSearch redox closure

With e− selected, DBSearch constructs potential redox-component lists, scans for reactions compatible with the selected/discovered components and repeats when new components appear. For example Fe(II)−e− can expose Fe(III). It then substitutes newly discovered redox-component reactions into dependent reactions: coefficients are multiplied by the substituted coefficient and accumulated; constants and thermal representations are correspondingly combined, subject to source availability/range rules. Selection/exclusion and duplicate/overlay behavior also matter.

This differs from Phase 3’s direct component-compatible query. No closure algorithm or constant transformation was ported into the importer or React. A future basis-preparation module needs independent comparison with official constructed systems, including cycles, missing metadata and dependent choices.

## 11–12. Units and remaining ambiguities

| Quantity | Official convention | App convention / conversion |
| --- | --- | --- |
| Aqueous C, component tot, dissolved solub | mol per 1000 g H2O in EC | `mol/kg-H2O` for source inputs; `mol/L-solution` remains distinct |
| Solid amount in C array | mol per kg H2O bookkeeping basis | same explicit basis; not volume fraction or mass fraction |
| logA, logK, logf | base-10, dimensionless relative to the relevant standard states | retained explicitly; no concentration/activity substitution |
| pH, pe | −log10 proton/electron activity | dimensionless coordinates |
| Eh | temperature-dependent activity coordinate; EC displays mV | V-SHE internally, explicit 1000 factor for mV display |
| Temperature | °C in ChemConcs | °C; +273.15 only for Kelvin-dependent formulas |
| Pressure | bar in ChemConcs | bar, positive; model-domain validation still future |
| Ionic strength | molal convention | `mol/kg-H2O` default; molarity separately labeled |
| Charge balance | sum z*m in Factor | equivalents/kg H2O; enforce zero only when the problem actually imposes it |
| Water activity/phi | dimensionless, nonideal Factor output | ideal activity-one assumption only implemented |

Molarity-to-molality conversion requires solvent mass per solution volume, generally solution density plus composition/solute mass information. Pure-water density alone does not justify an exact conversion for a solution. Existing mol/L elemental drafts are preserved, never relabeled as molal component totals. EC’s ideal activity assumption makes numerical molal concentration equal to activity for ordinary dissolved species relative to its standard state; that is a declared reference assumption, not a general conversion.

Factor.calcIonicStr adds a monovalent counterion contribution from absolute electric imbalance: I=0.5*(sum z²*m + abs(electricBalance)). Its SIT implementation also handles counterion interactions. A future model must state whether to reproduce this background-ion convention; blindly applying only 0.5*sum z²*m would differ. The current ideal benchmarks do not evaluate ionic strength, osmotic coefficients or charge balancing.

Gas/fugacity standard states, closed gas inventories, density conversion, nonideal temperature/pressure validity and realistic mixed-phase units need dedicated contracts/cases. They are not silently resolved by the phase labels.

## 13. Official Java reference execution

The original archive contains no EC.jar, and its older LibChemDiagr.jar does not match the pinned 2026 EC API. A compile attempt established that mismatch; the bundled library was not modified. Matching official EC and LibChemDiagr sources at revision `c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7` were therefore compiled separately under `.local/phase4-reference/`. The program reports EC 2026-03-04 and library 2025-10-30. Runtime/compiler: JetBrains OpenJDK 21.0.10+1-b1163.108. A SecurityManager deprecation warning arose during compilation; compilation succeeded.

Preparation is reproducible using `scripts/prepare-java-references.ps1` with a JDK path. Then run `npm run reference:java` (PHASE4_JAVA can select the executable). The existing Phase 3 `.local/spana-components.json` supplies exact source records. The default executable is `C:/Program Files/JetBrains/PyCharm 2025.3.3/jbr/bin/java.exe`.

EC command shape: `java -Djava.awt.headless=true -cp .local/phase4-reference/classes ec.EC <absolute-case.dat> -m=-1 -t=25 -tol=1e-10 -d=3`. The adapter command uses the same class directory and `ReferenceProbe <absolute-case.dat> 1e-10`, then `1e-12`. The fixture records complete executable/argument arrays for each run, input hashes, all library source hashes, EC hash and adapter hash. The adapter only reads the official input, sets constraints and invokes official Factor/HaltaFall; it contains no solver algorithm.

All five are deliberately restricted species-set benchmarks, not full-database predictions or generally electroneutral closed solutions. They use ideal activities, 25 °C and the 1 bar reference setting. Omitted spectator ions and open fixed-activity reservoirs are not silently supplied.

| Case | Components and constraints | Source reactions / logK |
| --- | --- | --- |
| acid-base | H+ LA=-7; H2O LA=0 | OH− from −H+ +H2O; −14.0015 |
| complexation | Ag+ T=1e−5; Cl− T=1e−3 | AgCl from Ag+ +Cl−; 3.31 |
| precipitation | Ag+ T=1e−3; Cl− T=1e−3 | AgCl 3.31; AgCl(s) 9.75, both coefficients (1,1) |
| redox | Fe²+ T=1e−5; e− LA=−13 | Fe³+ from Fe²+ −e−; −13.051 |
| fixed-activity | Ag+ LA=−6; Cl− LA=−3 | AgCl; 3.31 |

All input totals are mol/kg H2O. Source byte records and citations are attached to every benchmark reaction. No thermodynamic value was invented.

## 14. Exact outputs captured

The complete EC tables/logs and round-trippable Java double output are in `tests/fixtures/eq-diagr/references.json`. Below are selected values from the full-precision 1e−12 capture; these are official Java outputs, not results computed by Adam’s Laboratory:

| Case | Selected captured values |
| --- | --- |
| acid-base | C(H+)=9.999999999999994e−8; C(OH−)=9.96552080134765e−8; logA(OH−)=−7.001500000000001 |
| complexation | C(Ag+)=3.302440890341427e−6; C(Cl−)=9.933024408824464e−4; C(AgCl)=6.697559117554346e−6 |
| precipitation | C(AgCl(s))=9.863017076200999e−4; dissolved Ag=1.3698292379900088e−5; logA(AgCl(s))=0 |
| redox | C(Fe²+)=5.293242686272831e−6; C(Fe³+)=4.70675731372721e−6; logA(e−)=−13; C(e−)=0 |
| fixed-activity | C(AgCl)=2.0417379446695277e−6; total Ag=3.0417379446695266e−6; total Cl=1.0020417379446689e−3 |

All adapter captures have errFlags=0 at both requested tolerances. Captured values were identical between 1e−10 and 1e−12 for these cases. The official absolute balance floor limits what that comparison proves. For example the complexation Ag balance residual is about 7.90e−15 mol/kg, within that floor, not exact zero. EC’s rounded tables are preserved for independent execution-path comparison; they are not the full-precision golden data.

## 15. Proposed numerical validation contract

These proposed thresholds apply only to the five simple ideal cases. They are not a universal license to accept arbitrary ill-conditioned or nonideal systems.

- **Parser equality:** names, signed coefficients, source logK, raw bytes and hashes must match exactly. No floating tolerance is used to excuse altered source data.
- **Status:** errFlags must be zero and outputs finite. NaN placeholders for quantities that were not evaluated must be explicitly unavailable, never silently interpreted as zero.
- **Component balance:** reconstruct each kh=1 balance from component concentrations plus signed product coefficients times species amounts. Use an outer bound max(2e−14, requestedTolerance*max(abs(total), min(smallestNonzeroTotal,1e−6))) in mol/kg H2O. The 2e−14 floor and scaled inner-loop scheme come from HaltaFall.haltaCalc; actual inner-loop bounds may be tighter. For kh=2, totals are outputs and must not be compared to a nonexistent input total.
- **Cross-solver concentration/dissolved/solid comparison:** proposed absolute 4e−14 plus relative 2e−10 times magnitude for these well-conditioned benchmarks. The absolute term allows two solvers’ 2e−14 balance floors; the relative term allows both requested outer tolerances. It is not sufficient by itself: check log activities, mass action, balances and phase status too. For new ill-conditioned systems derive uncertainty from residual/Jacobian sensitivity rather than relaxing this globally.
- **Log activities:** proposed absolute 1e−8 log10 units for these benchmarks, with imposed LA checked to rounding accuracy and mass-action residual <=1e−10 log10 units. A 2e−14 concentration floor at the smallest free concentration (~1e−7) alone would permit a larger logarithmic uncertainty; direct activity and mass-action checks deliberately impose a stricter independent criterion. The present reference outputs satisfy these checks with substantial margin. Extension to trace species needs conditioning-aware criteria.
- **Solids/saturation:** positive present-solid amount and abs(log activity)<=1e−8 for the saturated AgCl benchmark, plus amount/balance checks. Absent-solid saturation inequality and complementarity near onset need additional bracketing cases; no onset tolerance has been certified.
- **Charge:** enforce zero only for an explicitly closed electroneutral benchmark. Otherwise compare the declared electric-balance output, including spectator/background convention. None of these ideal captures establishes a nonideal charge-balance tolerance.
- **Ionic strength/log activity coefficients:** acceptance is not established by ideal cases. Future nonideal references must match model, counterion convention, temperature and stopping tolerance; logf convergence is separate from component balance.
- **Rendering:** no numerical diagram tolerance exists yet. Pixel differences cannot validate chemistry. Future sampled output/contour convergence must precede visual regression criteria.

The contract is declared in `src/solver/validationContract.js`; fixture tests verify source equality, successful capture, mass action, balances and the present saturated-solid condition without implementing a solver.

## 16. Tests, build and lint

All 33 tests pass: 23 retained tests plus seven session/definition tests and three reference-integrity tests. They exercise T/TV/LTV/LA/LAV, pH/redox capability, removal invalidation, unit distinctions, multidimensional sampling budgets, serialization, state lifetime, exact source preservation and numerical reference invariants.

`npm run build` and `npm run lint` pass after fixing explicit Node imports and the decimal-to-double constant representation. The production bundle is approximately 247 kB JavaScript before gzip; official Java sources and reference fixtures are not imported into it. No production solver or fake chart was introduced.

## 17. Remaining scientific and implementation uncertainties

General basis resolution/redox closure is documented but not implemented or independently verified across arbitrary systems. Nonideal activity models, solvent activity, gas/fugacity handling, density conversion, thermal models, pressure ranges, missing metadata, phase-onset behavior and redundant choices require further cases. Five restricted ideal points do not validate a general numerical solver.

Current session serialization is an internal reproducibility helper, not a hardened interchange format. Source-component arrays support multidimensional definitions but physical-parameter sweep variants and advanced output semantics require further schema extensions. The UI makes no solvability claim and displays no result.

The official software is GPL-3.0-or-later; unchanged reference source remains local with its headers. Small source-data fixtures retain citations/provenance and have not been published. Software reuse obligations and thermodynamic data redistribution remain separate decisions. The application license has not been reclassified.

## 18. Proposed point-solver architecture — awaiting review

After review, introduce a basis-preparation boundary that resolves exact ordered source components, reaction transformations and special flags; a thermodynamic evaluator that supplies valid lBeta at requested conditions; and a point solver accepting immutable kh/tot/logA inputs in explicit units. Recreate the solver for a changed basis; change only conditions between compatible point calls, matching the official warning about mutating ChemSystem after solver construction.

Return concentrations, log activities, dissolved component amounts, solid amounts/saturation, model diagnostics, convergence, units and full input/data identity. Sweep orchestration should own sampling, cancellation and revision checks. AnalysisEngine should operate on validated named quantities, keeping minimum dissolved amount distinct from maximum precipitate. Rendering should consume results/slices without computing chemistry. A later 3D view displays multidimensional calculated data rather than introducing a separate chemistry engine.

Stop point respected: Adam’s Laboratory’s production point solver has not been implemented. Review this report before authorizing that phase.

Browser verification: the Calculation workspace loaded with an explicit unavailable-result message. Editing temperature from 25 to 30 °C, switching to System, then returning to Calculation retained 30 °C in the same session. No browser console errors were observed. This checks live state behavior, not chemical correctness.
