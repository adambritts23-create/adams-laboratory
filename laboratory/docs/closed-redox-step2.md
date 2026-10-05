# Closed redox Step 2 — production network and preparation contract

## Result and scope

A separate production API now compiles and solves bounded closed-redox aqueous networks through the existing numerical preparation and solver. It is implemented in src/thermodynamics/closedRedoxNetwork.js and src/solver/closedRedox.js. It is not a Wet Lab feature, not a public chemistry-support claim, and not connected to the existing UI or Pourbaix dispatcher. No existing production file was edited.

The initial contract is deliberately explicit: Ideal normalized molal activities, 25 C, declared 1 bar, finite source constants, integer half-reaction coefficients (absolute value at most 64), at most 32 source species/half reactions and 16 physical basis species. All physical species are aqueous ordinary carriers with independently supplied integer elemental composition, charge and static source identity/reference. One explicitly identified formal electron has charge -1 and no elemental composition. No species-name parsing assigns valence or discovers charge. Solids, special H/water reservoir components, fractional source-unit stoichiometry, nonideal models and arbitrary real-database completeness are not newly supported.

## Architecture

1. `compileClosedRedoxNetwork(request)` requires mode `closed-redox`. Source half-reaction terms refer to explicit species IDs and carry source references and an ideal-molal standard-state declaration. It checks exact integer atom/charge bookkeeping before transforming anything.
2. A deterministic spanning set of half-reaction combinations cancels electrons at integer common multiples, retains each multiplier and transforms log K with the same algebra. This is network construction, **not** sequential pairwise chemistry or repeated reaction extents.
3. The unchanged `transformReactionBasis` simultaneously eliminates dependent identities, including the formal electron. Existing rank/cycle/provenance checks remain in force. Reversal/scaling use the existing `scaleReaction` algebra.
4. All physical species, including unchanged spectators, are mapped onto a chosen physical species basis. The electron is never a solver species. The compiler checks that elemental inventories plus charge span the entire basis and reproduce each physical carrier's attributes. This rejects hidden extra valence-state constraints and incomplete/disconnected reaction spaces.
5. `prepareClosedRedox(request)` projects explicitly supplied reagent amounts into signed conserved basis totals, calls unchanged `prepareChemicalSystem` and `createPointInput`, and retains a separate preparation identity. Every numerical constraint is kh=1; no electron activity, electron total or fixed-activity reservoir is supplied.
6. `solveClosedRedox(prepared)` calls unchanged `solvePoint` exactly once for one simultaneous equilibrium. It then checks independent physical inventory/charge reconstruction, electron-free reaction residuals and a common derived pe from every supplied half reaction. Only branded successful results receive closed inspection output; a copied/forged preparation cannot enter the solver.

The new entry point deliberately does not relax `prepareReactionBasisSystem`'s fixed-redox gates, `fixed-electron-v1`, or ordinary `prepareSession`. Signed basis coordinates are only exposed through this distinct closed contract. This is production source with a test/inspection API; the bundle's UI entry remains unchanged and can tree-shake this currently unreferenced feature.

## Mathematical contract

For source half reaction p*P = sum(non-electron nu_i*S_i) + n*e, the mass-action equation is:

p log(aP) = log K + sum(nu_i log(ai)) + n log(ae).

For half reactions with signed electron coefficients n and m, L=lcm(abs(n),abs(m)); combine L/n times the first and -L/m times the second. The electron coefficient is exactly zero and log Knet is the same linear combination of source log K values. Integer cancellation is exact in the bounded safe-integer range; log constants retain normal floating-point algebra. No source constant is edited or fitted.

Let M map physical species amounts c into basis coordinates t=M*c. The existing solver conserves t and derives products by mass action. Static elemental/charge matrix L must satisfy L=L_basis*M and have full rank on the basis. Therefore t corresponds exactly to physical elemental/charge invariants, not to independently frozen starting valences. The extra structural rank threshold is a machine-roundoff bound (128*Number.EPSILON scaled to matrix magnitude), not a change to solver convergence or balance tolerances.

Preparation is a nonnegative list of physical reagent amounts on one kg-water convention. Missing physical species mean zero initially; missing electron amount is required. Charge policy is explicitly electroneutral. Charged preparations are rejected beyond arithmetic roundoff. No counterion, acid, base, charge reservoir or electron inventory is inserted. Spectators are explicitly represented species with conserved supplied totals. A fixed ionic **inventory** is supported; an externally fixed ionic **activity** is a reservoir and is rejected in this initial closed mode. Unknown options, imposed Eh/pe, electron activity/total and fixed-activity options fail closed.

The physical charge equation is encoded by the complete conserved coordinate set, rather than appended to an already square Newton system. The existing `enforceElectroneutrality` gate remains unchanged. Acceptance additionally reconstructs physical charge and elemental totals from the accepted concentrations.

For each half reaction:

pe = [log K + sum(non-electron nu_i log(ai)) - p log(aP)] / n.

A common pe is selected from a deterministic reference half reaction and checked against every other one; potentials are not averaged to conceal disagreements. Eh uses existing `peToEh`. The half-reaction standard-state convention supplies the potential reference; synthetic constants imply a synthetic reference zero, not measured standard potentials for imaginary elements.

The allowed pairwise pe disagreement is the sum of each equation's pe error bound: (existing massActionLogResidualTolerance + explicitly scaled arithmetic roundoff)/abs(n). Existing log residual tolerance is 1e-10. Scaling an equation never loosens the point solver's acceptance. Element/charge outer bounds propagate the existing accepted component-balance limits through absolute physical weights, plus arithmetic roundoff. Net-reaction bounds propagate the same existing log residual tolerance through the exact multipliers. No solver tolerance, scientific balance threshold, convergence gate or source precision allowance is changed.

Finite materialized concentrations are required for these initial common-potential checks. Trace underflow that prevents a finite logarithm causes unsupported/failed inspection rather than a fabricated pe; general extreme-log closed networks need further validation.

## Permanent independently specified controls

All reference compositions below were derived algebraically before invoking the production solver; scripts/validation/closedRedoxControls.js contains these fixed expectations. Tests never regenerate expected values from solver output.

| Control | Half-reaction log K | Family totals | Explicit X- | Expected concentrations | Derived pe |
|---|---|---|---|---|---|
| Original one-electron A/B | 0, 2 | A=1, B=1 | 1 | Ao=Br=10/11; Ar=Bo=1/11 | 1 |
| Unequal 2e/3e A/B | log10(2), log10(3) | A=27, B=8 | 24 | Ao=9, Ar=18, Bo=2, Br=6 | 0 |
| Three competing one-electron families | 0, log10(3), log10(9) | A=1, B=2, C=5 | 1.5 | Ao=Ar=Bo=Co=0.5; Br=1.5; Cr=4.5 | 0 |

All amounts are mol/kg water under the deliberately ideal model. Labels `Cr` in the last row mean **synthetic C-reduced**, not chromium; no real chromium or uranium chemistry is introduced. Oxidized synthetic species have charges equal to their electron counts; reduced forms have charge zero. X is an explicit monovalent inert counterion.

Original derivation: Ar+Bo -> Ao+Br has K=100; starting Ar=Bo=1 gives [x/(1-x)]^2=100 and x=10/11.

Unequal derivation: 3 Ar+2 Bo -> 3 Ao+2 Br has K=9/8. Starting Ar=27, Bo=8 gives Ao=3x, Br=2x, Ar=27-3x, Bo=8-2x. At x=3, the quotient (Ao/Ar)^3*(Br/Bo)^2=(1/2)^3*3^2=9/8. It is strictly increasing on the physical interval 0<x<4. Each independent half reaction gives pe=0. The stored cancellation is the reverse convention, multipliers [3,-2], L=6, log K=3log10(2)-2log10(3)=log10(8/9), with electron residual exactly zero.

Three-couple derivation: at pe=0 the reduced/oxidized ratios are 1,3,9, yielding the table's composition and oxidized charge sum 1.5. More generally Q(pe)=sum(n_i*T_i/(1+10^(logKi-n_i*pe))) is strictly increasing for these positive totals. Thus Q(pe)=1.5 has the unique root pe=0. This establishes a simultaneous unique solution without choosing a reaction order.

Each control uses two different physical bases (all oxidized species plus one reduced reference, or the converse), and two distinct initial preparations with equal complete physical inventories. The original preparations are the accepted Step-1 endpoint and half/half mixture. The other second preparations are halfway along their admissible reaction extents toward the independently specified equilibrium; their purpose is equal physical constraints, not a new reference generated by solving. All twelve combinations solve through the production API. Original Step-1 three-basis tests remain unchanged in the suite.

Three-couple controls additionally reverse source reaction ordering and reverse/scale complete half-reaction equations. They retain one simultaneous solve and the same accepted state. Separate preparation IDs remain distinct while equal transformed constraints produce equal equilibrium input IDs within each basis. No history-specific final valence total is imposed.

## Observed results

From docs/closed-redox-step2-evidence.json (reproduce with `node scripts/validation/reportClosedRedox.js`):

- 12 basis/preparation combinations plus 2 ordering/scaling controls accepted.
- Maximum concentration error against independent expectations: 7.105427357601002e-15 mol/kg water.
- Maximum physical inventory/charge residual across controls: 7.105427357601002e-15 in the respective conserved units.
- Maximum absolute pe error: 2.7755575615628914e-16.
- Maximum within-network pe disagreement: 2.220446049250313e-16, approximately 1.31e-17 V at 25 C.
- Original control Eh approximately 0.0591593496847823 V; unequal and three-couple Eh zero to floating-point precision.
- Exact electron cancellation and source multiplier/log K transformation retained in inspection evidence.

Ten permanent tests in tests/closedRedoxProduction.test.js cover independent inventories, each half law, common potential, electron transfer, LCM cancellation, history/basis invariance, simultaneous order/reversal/scaling, missing counterions/metadata, contradictory/disconnected networks, imposed reservoirs and forged preparations. Failed systems keep typed diagnostics and do not get accepted inspection branding.

## Preservation and remaining real-chemistry blockers

The original Fe/Cu metadata/references, fixed-Eh solver wrappers, Pourbaix paths, thermodynamic data, all existing tolerances, fractions, plots and Beaker code are unchanged. No existing test was weakened or edited. The initial relevant baseline was 27/27 passing. Full regression: 531/531 passed in 400.020 seconds, zero failures/cancellations/skips/todo. This includes all existing Fe/Cu, Pourbaix and five golden/reference checks plus the ten new production controls. Build and artifact audit passed. Lint has zero errors and its one existing ExpandedPlot.jsx cleanup warning. All 215 pre-existing src/public files are byte-identical; full before/after hashes and hashes of the two new production files are in docs/closed-redox-step2-hashes.json. Logs are under .local/closed-redox-step2/.

Before any real-chemistry support claim: curate authoritative composition/charge and standard-state metadata for all included carriers, connect source database discovery to this separate contract, prove completeness and rank for supported families, validate real half-reaction normalization (including fractional source units), audit proton/water/H/O conservation and spectators, establish materiality/trace handling, and independently cross-validate bounded real multi-family systems. Solids, gases, nonideal corrections, unknown-pH solvent treatment, general mixing and UI wiring require further phases. This implementation does not infer oxidation states or extend real element support.

No Wet Lab UI, uranium, Fe/U model, Beaker mixing, titration, half-cell model, deployment or push. Stop for review.

