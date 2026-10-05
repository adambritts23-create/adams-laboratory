# Source-derived equilibrium network compiler — Phase 1

## A. What is now general

`src/thermodynamics/equilibriumNetwork.js` exposes `compileEquilibriumNetwork(repository, request)` and `solveEquilibriumNetwork(compiled)`. It provides one versioned, source-fingerprint-bound admission/preparation/inspection boundary, with no element-name or reagent-pair branches. It deliberately composes the existing closed source-graph engine and a direct analytical-component engine; it does **not** claim that those different boundary conditions now share every preparation implementation.

Supported conditions are Ideal, 25 °C, declared 1 bar, mol/kg H2O, fixed unit water activity and aqueous carriers. Selected IDs must belong to the pinned imported snapshot. Physical closed inventories use the existing forward/inverse source reachability, electron elimination, physical basis selection, conservation/rank/cycle checks and unchanged closed solver. A selected electron is rejected because it denotes an imposed reservoir. Abstract analytical components use exact source requirements, source-bound atom/charge seeds, transported product allocation, reaction-basis bookkeeping and the unchanged point solver. They permit signed proton equivalents and do not fabricate or require Na/K.

Compilation returns admitted source laws, IDs/references, components/composition, connectivity, phase exclusions, basis/rank checks, scientific status, prepared solver input and timings. Analytical unreachable rows record missing required components. Closed inspection retains source families, conservation rows, generated cancellations and explicit excluded phases. Failed compilation never produces a branded success or silently invokes another calculation. Solving requires the original branded object.

The direct analytical branch requires a directly independent selected basis. A known selected product requiring inverse closure is explicitly refused. Imposed-potential/grid boundaries remain on their existing paths; this compiler currently refuses those modes rather than pretending they are closed physical inventories. Metadata coverage is finite: 12 existing curated component seeds plus an additive acetate identity in `networkComposition.js`; derived products use exact source-law transport. Acetate composition is pinned to the imported identity and [PubChem CID 175](https://pubchem.ncbi.nlm.nih.gov/compound/175), C2H3O2(-). No runtime web lookup, formula parsing or oxidation-state guessing occurs.

## B. What remains special-case

- The original reviewed Fe/peroxide profile remains an explicit optional scope. Its chloride-redox exclusions, inventory domain, 24 laws and saved independent reference are unchanged. The unrestricted network is scientifically different and is not relabeled as the reviewed benchmark.
- Existing Fe/Cu Pourbaix contracts, generic carrier mode, imposed-Eh setup, Wet Lab physical recipe catalogue and acetate Wet Lab recipe remain intact.
- Existing source composition seed registries and numerical capacity policies remain curated and bounded.
- Ordinary Calculation still uses its accepted direct sweep preparation. The new compiler's analytical branch is independently validated at point level; this phase does not replace ordinary sweep identity or switch Wet Lab/Pourbaix to a new engine.
- Closed non-redox physical acid/base preparation is not newly enabled. The acid/base validation uses the explicit abstract analytical boundary, preserving the accepted signed-proton contract.

## C. Benchmark evidence

Counts below include water and, for closed networks, the internal formal electron. They are source-network counts, not the number of dissolved physical carriers. Exact amounts, source equations/references, closure diagnostics, comparisons and phase evidence are in `network-compiler-benchmarks.json`.

| Benchmark | Source species / laws / independent rank | Independent reference | Maximum carrier log10 ratio error | Derived pH / Eh |
|---|---:|---|---:|---|
| Reviewed Fe(II)/H2O2, three saved doses | 28 / 24 / 23 | Unmodified Step-5 independent raw-law points | 4.80e-12 | pH 2.00087576–2.00088739; Eh 0.75177790–1.05573400 V |
| Fe/Eu, two soluble metal families | 47 / 42 / 41 | Separate five-coordinate raw-law Newton solve | 2.85e-14 | pH 2.000864378806367; Eh 0.235517789985514 V |
| Eu, no Fe | 29 / 24 / 24 | Separate four-coordinate raw-law Newton solve | 5.69e-14 | pH 2.000864206621187; Eh 0.749676428312461 V |
| Acetate 0.5 mol/kg, proton equivalents -1, 0, .25, .5, 1 | 5 / 2 / 2 | Independent nested scalar balances | 5.41e-15 | pH 14.00150000, 9.22873527, 4.75706079, 2.53029960, 0.30101480; Eh undefined |
| Fe/chromate/K/Cl/H, phase-limited control | 55 / 51 / 48 | Diagnostic aqueous candidate, not accepted equilibrium | Not claimed | Candidate pH 2.00134990; Eh 1.00305992 V |

Fe/Eu inventory: Fe2+ 1e-6, Eu3+ 1e-6, Cl- .010005 and H+ .01 mol/kg H2O. Non-Fe control: Eu3+ 1e-6, Cl- .010003, H+ .01. The source Eu(III)/Eu(II) law is record 120483 (85Bar/Par, Standard Potentials in Aqueous Solution); Fe(III)/Fe(II) source identities are 126513 and 126584 (NEA-Fe 2013). All compatible hydrolysis, association and chloride/water redox laws are retained.

The mixed control contains both real source-supported metal redox families, but Fe(III) and Eu(II) are traces at this preparation (free amounts about 8.47e-16 and 8.14e-17 mol/kg). This demonstrates coupled source-law preparation and equilibrium agreement, **not** extensive electron transfer or validation of arbitrary Fe/Eu concentrations. The independent mixed calculation has maximum scaled balance residual 8.47e-16, mass-action residual 1.43e-14 log units and net charge -3.22e-18 equivalents/kg. It imports only the raw data, uses separate source-coordinate substitution and Newton/linear algebra, and does not call production discovery, compiler, preparation or solver. Duplicate source representation of an already free component is not counted as an additional carrier.

Every accepted closed benchmark retains the unchanged acceptance checks for physical elemental inventories, charge, H-2O/water coupling, ordinary mass action and redox potential consistency. Acetate additionally checks carbon, signed proton equivalents and charge against the **supplied analytical charge**, not forced electroneutrality. This is why negative proton equivalents and omitted counterions do not silently become a neutral physical recipe.

## D. Rejections and limits

Fe/chromate uses Fe2+ 6e-6, chromate 2e-6, K+ 2e-6, Cl- .010012, H+ .010002 mol/kg. The aqueous candidate converges but is withheld: Fe2O3(cr) hypothetical log saturation is 0.973772517355 and FeOOH(cr) is 0.266386258678, above the unchanged solid tolerance. It is not published as complete equilibrium.

Tests also reject missing composition metadata, source fingerprint drift, duplicate/unknown component IDs, selected electrons, unsupported phases/reservoirs/options, unbalanced physical preparation and forged compilation objects. General user exclusions require separate scope validation and are refused; the preserved reviewed profile is explicit. High peroxide was checked in the browser: gas/headspace support is required, with no ordinary fallback.

Excluded gases are never accepted gas inventories. Even when hypothetical fugacities are low, a result with excluded phases remains CONDITIONAL, not a gas-complete equilibrium. No kinetic inference is made.

## Capacity and performance

No capacity limit was changed: closed networks remain limited to 64 source species/reactions and 16 physical basis coordinates; analytical basis transformation retains its existing 32-component limit and point preparation its 16-component/128-product limit. Probes cover 5, 28, 29, 47 and 55 source species. `network-compiler-capacity.json` records rank, compile/preparation/solve timing, iterations and minimum pivot ratio for every case.

On this run cold source verification plus Eu compilation took about 2.2 s. Warm closed compilation was about 0.11–0.28 s, preparation 0.08–0.24 s and solving 0.006–0.026 s. Analytical compilation/preparation was approximately 0.01–0.02 s each. Timings are machine-dependent. Fe/Eu's minimum pivot ratio was about 9.4e-12; this is an existing solver diagnostic, not a full matrix condition number or proof that all networks below the ceiling are well conditioned. No tolerance was relaxed.

## E. Next scientific boundary

Closed solid-inventory closure is the concrete next blocker demonstrated by Fe/chromate. Finite gas/headspace closure is a separate blocker for more gas-producing preparations. Broader authoritative component composition coverage is also necessary before arbitrary database component selections can be supported. Boundary-condition unification remains future architecture, not something achieved merely by this interface.

Future Wet Lab: reviewed physical recipes supply actual component moles and solvent mass; convert to mol/kg using the declared recipe convention, then pass selected IDs and amounts to the closed-physical contract. Abstract signed proton controls must not be substituted for missing neutral recipe bookkeeping. This phase changes no Wet Lab recipes, volume convention or apparatus.

Future Pourbaix: reuse admitted source laws/composition, then supply imposed H/e activities through a separately validated boundary adapter. Existing canonical basis, phase enumeration, result identity, Fe/Cu metadata/support gating and sampled-grid contracts must remain explicit. This phase does not replace them or reinterpret electron activity as a conserved physical inventory.

## F. Calculation, preservation and review status

The existing general Closed reagent / automatic redox action now consumes the compiler. Provenance/timings are behind a concise disclosure, with no new mode or permanent debug panel. The accepted compact ordinary layout and view-switch/sweep machinery are unchanged. The human portrait beside the Calculation beaker was removed; the original vessel drawing, state, inspection and selection handling remain. Wet Lab apparatus is untouched.

The supplied Nuclear Nightshift image was not edited or automatically inserted. No location was specified, and it should not displace scientific controls.

Focused affected-path suite: 48/48 pass; final compiler unit suite: 7/7 pass. Browser: accepted low-peroxide closed calculation, derived pH/Eh, stale-result removal, explicit high-peroxide gas refusal, return to compact ordinary setup and portrait-free selected-result beaker. See `network-compiler-browser.txt`.

Preservation before final validation: all 335 existing source/test/data files hashed; only GeneralClosedPanel.jsx, InteractiveBeaker.jsx and InteractiveBeaker.css changed. New compiler/metadata/tests/validation files are additive. Solver equations, tolerances, imported constants, reviewed source registries, existing tests and ordinary/Pourbaix/Wet Lab implementations are unchanged. See `network-compiler-preservation.json`.

Final validation: full regression run once, 651/651 passed (431.160 seconds), zero failures/cancellations/skips/todo. Production build passed; artifact audit passed. Lint: zero errors and the existing ExpandedPlot effect-cleanup warning. Vite retains its bundle-size advisory. Final hash comparison confirms the same three presentation/integration edits among 335 pre-existing source/test/data files; protected science is unchanged. Existing Fe/Cu references, official goldens, Pourbaix, imposed Eh, reviewed peroxide, acetate and Wet Lab regressions all remain passing. Logs: network-compiler-regression.txt, network-compiler-build.txt, network-compiler-artifact.txt, network-compiler-lint.txt and network-compiler-preservation.json. No deployment or push. Stopped for review.

