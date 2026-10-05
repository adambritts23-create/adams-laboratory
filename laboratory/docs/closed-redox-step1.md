# Closed redox equilibrium — Step 1 architecture audit and synthetic benchmark

## Decision: B for the production preparation contract

The existing numerical mathematics supports the minimal closed two-family benchmark. The current production redox preparation/component contract prevents exposing it correctly: it assumes a single family, fixed H/e activities and nonnegative ordinary-component inventories. No solver extension was needed for the synthetic controls; the low-level prepareChemicalSystem boundary can already express the required signed chemical basis. Thus this is B at the supported production-workflow boundary, with an A-like capability demonstrated at the lower-level engine. This is not evidence that a general closed aqueous redox solver is complete.

Do not remove existing Pourbaix restrictions to enable mixing. Add a separately validated closed-system preparation contract in a future phase. No production feature is implemented here.

## Architecture trace

| Stage | Current implementation | Consequence for closed redox |
|---|---|---|
| Imported reactions | thermodynamics/importers/spana preserves source component/reaction identities, coefficients, constants and provenance; repository.js exposes records | Fe2+, Fe3+, uranyl source forms are distinct source identities, not automatically one conserved elemental inventory |
| Ordinary discovery | thermodynamics/compatibility.js: discoverReactionSet requires every source term among explicitly selected names; component identity records are not additional products | Selecting a starting valence alone does not discover and merge its entire redox family |
| Ordinary preparation | solver/prepareSession.js: selected source IDs become ordered components; each componentCondition maps to one kh constraint | kh=1 conserves the **source-component coordinate**, not automatically an element or a literal count of that free valence species |
| Canonical redox | solver/prepareCanonicalRedox.js: connected source states compiled, explicit family-total acknowledgement; fixed-electron-v1 | It explicitly does not silently add/merge independently entered state totals |
| General reaction algebra | thermodynamics/reactionBasis.js: rank-checked signed linear elimination of log-activity relations, constants transformed with coefficients, source traces and consistency checks | Sufficient algebra to eliminate the electron and combine two half reactions in the tiny benchmark; algebra alone does not choose conserved quantities or physical boundary conditions |
| Production transformed preparation | thermodynamics/prepareReactionBasis.js rejects negative ordinary coefficients, always prepares fixed-electron-v1 | This rejects the signed chemical coordinates needed by the demonstrated closed basis, even though the numerical engine accepts them |
| Pourbaix discovery | analysis/redoxDiscovery.js rejects ordinary analytical components outside the selected single-family scope | Two independently selected redox families are not currently a supported mixed Pourbaix/closed preparation |
| Prepared boundary | solver/models.js: immutable, branded ordered components/products; signed product coefficients accepted; ordinary free species included; e-/water suppressed | Electron can be a formal basis activity with zero free molality; its coefficients still enter bookkeeping. Suppression is not elimination of its unknown |
| Point constraints | createPointInput requires a finite kh=1 total or kh=2 log activity for every component; extra electroneutrality explicitly rejected | No missing/free electron constraint type exists. Fixed policy requires all special activities fixed; a no-policy low-level electron kh=1 is technically accepted, but not a physically justified public electron inventory |
| Numerical residuals | solver/point.js evaluate: totals = free basis amount + signed coefficient-weighted aqueous/solid products. solveAssemblage unknowns = log activities for kh=1 plus active solid amounts; kh=2 held fixed | Existing Newton matrix supports signed balances and determines an internal transfer coordinate when a complete, independent chemical constraint set is supplied |
| Acceptance | acceptedScience validates supplied component residuals, mass action, phase complementarity; result branded and source/input identified | No general charge/electroneutrality acceptance check is imposed. The benchmark checks charge independently and shows its conservation follows from its explicit constraints |

A source basis name such as Fe3+ is not itself proof that Fe(III) atoms are conserved. Its kh=1 row conserves the stoichiometric coordinate defined by **all** included reactions. In an ordinary disconnected-valence preparation those coordinates do behave as separately frozen oxidation states. With a valid electron-eliminated cross-family reaction they become signed combinations and the valence species may change. The error to avoid is retaining separate starting-state totals after changing reaction space without transforming the constraints.

Electron today has three distinct uses: explicit source reaction bookkeeping; suppressed formal basis component in prepared systems; externally prescribed log activity in supported redox/Pourbaix. solveFixedRedox maps pH to log aH and Eh to log ae, fixes water activity, and supplies ordinary totals. It does not solve the closed redox capacity or charge constraints.

## Minimal proposed closed contract

For Aox + n e = Ared and Box + m e = Bred, eliminate e to obtain m Ared + n Box = m Aox + n Bred. Transform log K consistently: log Knet = n log KB - m log KA. The two family inventories alone generally do not determine the redox state. A closed admissible composition must also carry the independent charge/chemical balance information left after eliminating electrons.

For this one-electron benchmark, use physical unknowns cAo,cAr,cBo,cBr (and spectator cX). Equations: Ao+Ar=TA, Bo+Br=TB, X=TX, Ao+Bo-X=0, and Ao*Br/(Ar*Bo)=Knet. No electron molality, electron total or imposed pe appears. The chemical charges are explicitly assigned: Ao and Bo +1, Ar and Br 0, X -1. These are deliberate synthetic species, not real elements.

Equivalent engine coordinates in basis [Ao,Ar,Bo,X]: unknown log activities of those four species; Br is mass-action-derived. The transformed totals are:

- tAo = Ao - Br = Q - TB
- tAr = Ar + Br = TA + TB - Q
- tBo = Bo + Br = TB
- tX = X = TX

where Q=Ao+Bo=TX for this neutral system. The first row can be zero or negative; it is not an Fe(III)-like species inventory. The four constraints are an invertible representation of the independent A, B, X and charge invariants. Do not interpret tAr as a physically free-electron inventory merely because it counts reducing equivalents in this tiny system.

Derive pe after solving: peA=(log KA + log aAo - log aAr)/n; peB=(log KB + log aBo - log aBr)/m. Require consistency of all available coupled families. Eh=(RT ln10/F) pe uses the existing conversion. The synthetic half constants define the formal reference zero; the reported Eh is a synthetic convention control, not a measured physical redox potential of invented A/B species. Net reaction constants alone do not establish an absolute potential zero.

Initial preparation supplies species amounts, solvent basis, counterions, total charge and all required elemental inventories. Project that composition into the independent conserved constraint space. Discard individual valence-state amounts as final constraints unless disequilibrium is explicitly intended. Equal **complete** conserved constraints and reaction scope imply equal equilibrium, regardless of preparation history. Equal A/B totals alone are insufficient if counterions, charge, H/O, reservoirs or redox capacity differ.

For real proton-coupled aqueous chemistry, H/O, counterions, solvent convention and charge dependence must be audited together. Do not blindly replace an electron row with electroneutrality: it may be dependent or leave a degree of freedom. Compute reaction rank and the independent conservation space first. Unknown pH, gases, phases, nonideal activities and mixed systems need separate validation; this benchmark does not certify them. Current low-level positive free-component representation cannot directly represent an arbitrary suppressed charge row, so a physically valid species basis with transformed totals is the minimal candidate approach.

## Independent synthetic solution

Deliberately finite log KA=0 and log KB=2 at Ideal 25 C, declared 1 bar; normalized molality standard 1 mol/kg water. TA=TB=TX=1. No precipitation, hydrolysis, complexes, uranium, fixed Eh or free electron species.

Preparation 1: Ar=1, Bo=1, Ao=Br=0, X=1. Extent x gives Ao=Br=x and Ar=Bo=1-x. Therefore Knet=100=[x/(1-x)]^2, so x=10/11. The only physical root lies in (0,1); x/(1-x) increases strictly there.

Preparation 2: Ao=Ar=Bo=Br=0.5, X=1. It has the same A/B/X totals and charge. Its net forward extent is 10/11-0.5, and it must reach the same state. Initial zeros in preparation 1 are not imposed as zero final species activities.

Expected concentrations: Ao=Br=0.9090909090909091, Ar=Bo=0.09090909090909091, X=1 mol/kg water. pe=1 from both couples; existing conversion gives Eh approximately 0.0591593496847823 V. The analytic expectation in the benchmark is calculated directly from 10/11, independent of the production nonlinear solver and independent of reaction elimination.

Three chemical bases were tested: [Ao,Ar,Bo,X], [Ao,Bo,Br,X], [Ar,Bo,Br,X]. The existing transformReactionBasis eliminates formal E in all three; its charge and elemental bookkeeping checks pass. The benchmark-only adapter supplies physical species expressions to unchanged prepareChemicalSystem/createPointInput/solvePoint. It does not use the production fixed-electron wrapper. It never materializes the transformed formal electron as an aqueous product.

## Evidence and negative controls

All six basis/preparation combinations converged. Maximum observed A/B closure error 4.44e-16 mol/kg, net charge residual 4.44e-16 equivalents/kg, transfer mismatch 3.33e-16 mol/kg. Both log half-reaction residuals are zero to 1.11e-16. Derived pe values agree to floating-point precision. Each pair of equivalent preparations generates identical transformed constraints and identical input IDs. Across bases, concentrations agree to a few 1e-16.

The deliberately disconnected state-total control holds each valence carrier as an independent component with no exchange reaction. Two finite, neutral preparations with identical A/B/X totals retain different concentrations and fail Knet=100. That locates inappropriate memory in disconnected reaction discovery plus separately imposed source-state totals, not in an iterative solver's history. The exact-zero disconnected case is not used as evidence of memory: current positive-activity boundary handling would reject it.

Negative gate controls confirm an explicit electron basis with no electron constraint is rejected, and enforceElectroneutrality=true remains unsupported. A charge-free two-total request would therefore not silently become a correct closed system. No test changes these existing gates.

Evidence: [closed-redox-synthetic-evidence.json](closed-redox-synthetic-evidence.json). Reusable benchmark-only helper: scripts/validation/closedRedoxSynthetic.js. Tests: tests/closedRedoxSynthetic.test.js. Six added tests cover independent solution, both half laws/pe, basis/history invariance, charge gate, frozen-state counterexample and missing-electron-constraint rejection. A first test assertion distinguished IEEE -0 from +0 in a transformed zero coefficient; it was corrected to the existing exact -0 representation, with no numerical tolerance changes.

## Coexistence and next-phase recommendation

- Fe/Cu validated calculations retain current source identities, contracts, references and exact results.
- Pourbaix retains its open electron/proton reservoirs, prescribed Eh, single-family scope and existing water overlays. None of these boundary conditions is a default for closed mixing.
- General reaction transformation is reusable algebra; a future closed adapter must independently establish conservation, charge, rank, source provenance, supported species and physically admissible transformed totals. Do not relax negative-conserved-inventory in the existing fixed-Eh wrapper globally.
- Future Beaker mixing must conserve the complete preparation inventories per common solvent amount, then build one coupled equilibrium. It must not simply add separately frozen valence totals or combine individually equilibrated diagrams. Display totals should use validated elemental mappings, because arbitrary signed solver coordinates are not meaningful nonnegative partition denominators.
- Recommend a bounded, separately branded closed-preparation adapter and charge/inventory acceptance contract next, initially for this synthetic class. Do not promise general wet-lab redox, oxygen/water equilibration, kinetics or arbitrary multi-element chemistry from this control.

## External context

USGS distinguishes initial-solution valence disequilibrium from batch mixing, where redox equilibration can change pH and pe even at unchanged elemental totals: [PHREEQC MIX](https://water.usgs.gov/water-resources/software/PHREEQC/documentation/phreeqc3-html/phreeqc3-27.htm). Its [SOLUTION documentation](https://water.usgs.gov/water-resources/software/PHREEQC/documentation/phreeqc3-html/phreeqc3-48.htm) also distinguishes pe/speciation controls from general redox equilibrium and cautions against simply adjusting pe for charge balance. These are conceptual corroboration, not an external numerical validation of the synthetic result. No external runtime dependency was added.

## Validation and preservation

Relevant pre-addition baseline: 36/36 passed. Final benchmark and relevant regressions: 53/53 passed, zero failures/cancellations/skips/todo (13.602 s). Production build and artifact audit passed. Lint: zero errors, one pre-existing ExpandedPlot.jsx cleanup warning. Logs are in .local/closed-redox-step1/. All 215 checked src/public files are byte-identical; see closed-redox-step1-hashes.json. All src/public hashes were recorded before work and compared afterward. This phase adds only benchmark helper/tests/report/evidence; no production science or UI code is changed. No deployment or push. Stop for review.

