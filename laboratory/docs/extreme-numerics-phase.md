# Extreme-numerics audit and general log-domain hardening

The general hardening passes validation. Both uranium bases now accept 1,025/1,025 points without changing reaction algebra, source constants, scientific tolerances, or phase-selection rules. Public uranium and uranium oxidation-state metadata remain disabled. No deployment or remote push was performed.

## Verified baseline and final checks

The actual pre-edit baseline passed 491/491 tests, all five official goldens, exact Fe/Cu reference fractions and system identities, and exact general reaction-basis controls. Build and artifact audit passed. Lint had zero errors and the existing ExpandedPlot effect-cleanup warning. Baseline duration: 345.774 s.

The final suite passes 500/500 tests, zero failures/cancellations/skips/todo, in 366.285 s. All five goldens, exact Fe/Cu regressions and reaction-basis controls pass unchanged. Build and artifact audit pass; lint retains only that same warning. The suite uses Node's no-process-isolation mode because child-process spawning is restricted in this environment; Vite uses its native config loader. These are execution-environment accommodations, not scientific changes.

The before/after SHA-256 manifest in [extreme-numerics-protected-hashes.json](extreme-numerics-protected-hashes.json) covers 566 existing files: precisely the ten intended files changed; 556 remain byte-identical. Source thermodynamic data, physical constants, reaction-basis implementation, oxidation-state registries, accepted evidence and golden fixtures remain unchanged. The approved thermodynamic asset SHA-256 remains 9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245. Research .local sources and GPL reference code are absent from production dependencies, as verified by the artifact audit.

## Root cause and all 189 failures

There are two underlying floating-point mechanisms, with three operational categories per basis:

- 28 points: initial fixed-reservoir aqueous underflow (first trigger O3).
- 158 points: positive trace underflow on the equilibrium/solid-seeded path.
- 3 points: nonzero subnormal concentrations whose log-of-rounded-linear round trip exceeds the existing mass-action tolerance.

Both bases fail at the same coordinates before hardening. All 189 reference points have zero HALTAFALL error flags and select UH3(cr). The full coordinate table and distributions are in [extreme-numerics-failure-map.md](extreme-numerics-failure-map.md); the compressed JSON preserves all 1,025 pre-change point records per basis, individual trace species, initial/retry triggers and diagnostics. The three subnormal cases are pH 9.5/Eh −1.5, pH 6/Eh −1.3 and pH 2.5/Eh −1.1. Multiple trace species can coexist at a point; the categories identify the operative rejection path rather than mutually exclusive chemistry.

At pH 0, Eh −2 V, the matched electron coordinate is log a(e−)=33.80700026499754. Initial UVI basis log activity is −5. Adam computes aqueous mass-action logs spanning −357.9820015899852 to +96.10600079499262, but linear materialization stops at O3: 10^(−357.9820015899852) rounds to zero and the old power helper throws. These ranges describe computed logs, not a successfully materialized full concentration vector. Initial UH3 saturation log is about +228.201; it is a logarithmic phase constraint, not an exponentiated solid concentration.

The existing solid seed gives log a(UO2²+)=−233.20100238497787. It satisfies the UH3 saturation relation without a new solver algorithm, but the old helper still rejects O3 and several uranium oligomer traces. The smallest equilibrium aqueous log is −954.7040095399116. H2 has log activity +64.53100052999508. Neither trace positivity nor positivity of its rounded linear approximation is needed to determine the conserved U inventory or the stable solid.

Binary64 has minimum normal 2.2250738585072014e−308 (log10 −307.6526555685888) and minimum positive subnormal 2^−1074, displayed as 5e−324 (log10 −323.3062153431158). The mathematical half-minimum rounding boundary has log10 approximately −323.60724533877976. This Node runtime returns zero at exponent −323.6072453387798 and a positive subnormal at adjacent tested exponent −323.60724533877976. Even 10^−320 is quantized: log10 of its materialized value is approximately −320.000004834948. Rejecting that round trip at 1e−10 confuses representation error with violation of mass action.

## Adam path versus unchanged HALTAFALL

Adam's pre-change src/solver/point.js power helper (old lines 16–18) required every exponentiated aqueous concentration to remain positive. evaluate computes source log mass action and then free/aqueous linear concentrations before component balances. solveAssemblage uses log-activity unknowns and scaled solid amounts, a scaled Newton Jacobian and compensated component sums. acceptedScience then formerly checked every aqueous equation through log10(linear C). singleTotalSeed already provided the monotone single-total and solid-saturation initialization retry. Active-set enumeration, rank checks, absent-solid saturation and nonnegative accepted amounts are unchanged.

Other exponentiation boundaries were audited: point.js freeComponentActivities is an optional linear display/export value (null when unrepresentable, retained logActivities authoritative); calculations/definition.js lines 40 and 81 convert and validate log-total input bounds; unit conversion performs analogous input-domain conversion. Those analytical-input restrictions remain unchanged. The new logConcentration helper is the only new materialization path. Ordinary source log K and coefficients are never transformed to evade a numerical failure.

The independent source is ignasi-p/eq-diagr commit c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7, locally pinned at .local/hydra-basis-audit/upstream/LibChemDiagr/src/lib/kemi/haltaFall/HaltaFall.java:

- cBer, lines 2521–2544: retains lnA, derives lnC=lnA−lnG, caps its upper value at 80.5904784, then Math.exp(lnC). Lower underflow may become zero without rejecting the chemical state. Explicit noll suppression separately sets concentration zero.
- lnaBas, approximately 2583–2610: forms source mass action in logarithmic activities.
- lnaBer1, approximately 2548–2578: active-solid equations transform lnKmi into basis log activities.
- totBer, from approximately 2625: sums signed linear inventories and compares its own tolY; the mononuclear adjustment adds log(y0)−log(y). tolY construction around 809–813 includes a 2e−14 floor.
- fasta, from 1672, especially 1750–1769: tests saturation from logarithmic quantities. Solid-amount handling around 1874 uses its own negative-amount tolerance.
- nog, approximately 1246–1299: exports c.logA from retained lnA even when linear C underflows.

HALTAFALL survives because it retains logs and permits negligible linear traces to round to zero. It is also binary64; this is not evidence of arbitrary precision. Its upper cap makes H2 linear concentration approximately 1e35 at the representative extreme point, while Adam's finite log 64.531 corresponds to approximately 3.4e64. That fixed-reservoir species does not carry U. We compare its logarithmic activity, disclose the linear difference, and do not copy the cap or claim agreement of every nonconserved reservoir concentration. HALTAFALL's tolerances, source code and phase allowances were not copied into production.

## Implementation decision A and invariants

A narrowly scoped representation correction is justified by the trace audit and independent equilibrium evidence. This is not a general arbitrary-precision solver or a wholesale log-domain Newton rewrite.

1. Retain finite log concentrations when positive aqueous or free concentrations become subnormal or round to zero. Status distinguishes exact-zero (suppressed/absent), positive-underflow, positive-subnormal and finite-positive. Policy version: positive-log-concentration-v1. Ordinary results retain their previous shape and arithmetic. Chemical identity and exact-zero semantics are preserved.
2. Factor trace stoichiometric weights and normalized Jacobian terms before exponentiation. A concentration that is individually unrepresentable can therefore still contribute a representable weighted inventory or derivative. Ordinary terms retain their original arithmetic. Source coefficients and conserved component equations are preserved.
3. For traces, validate retained log C against independently re-evaluated source log mass action, and verify that the exported linear approximation is the actual binary64 materialization. Independent pointTrace inspection repeats source-law and inventory checks and rejects forged logs. Ordinary log-of-linear checks remain. The equation tolerance is unchanged; the lossy round trip is no longer mistaken for chemical evidence.
4. Retain stable positive dissolved-inventory log sums where coefficients are nonnegative. Signed/reservoir sums do not acquire an invented positive-log interpretation. Component closure remains checked with the original tolerance. There is no renormalization or arbitrary scientific concentration cutoff.
5. Log outputs and saturation-solubility inspection use retained logs. A requested linear trace output returns an explicit gap with a typed reason instead of physical zero. Point and beaker numerical readouts show the retained exponent. Full numerical exports contain the logs, status and policy whenever this extension is needed. No layout redesign was made.

A positive quantity may be unrepresentable without being mathematically zero. Its contribution may also be scientifically negligible, but that is assessed against inventory and existing tolerance, not inferred from its name or a convenient percentage. Each unrepresentable weighted term has conservative absolute bound Number.MIN_VALUE; each component reports an aggregate bound of (aqueous rows+1) times that value. At the existing maximum species count and minimum balance scale 1e−300 this lost contribution is below about 7e−22 normalized, much smaller than the unchanged 2e−13 iteration tolerance. The bound covers only unrepresentable weighted terms, not all rounding or cancellation errors. Existing acceptance checks still govern those other errors. No global concentration floor was introduced.

## Synthetic and regression controls

Nine added tests cover ordinary exact arithmetic; nonzero subnormal round-trip loss; multiple traces at −400/−500/−800; retained source laws and forged-log rejection; fixed activities; dominant solids; competing solids; weighted and normalized underflow rescue; all-dissolved underflow with saturated log solubility; and extreme acid-base/hydrolysis chemistry. Existing tests formerly requiring every ±400 formation case to fail now require valid conserved inventory and retained source-law logs. A +400 formation constant can legitimately require a −403 free activity; a fixed +400 activity still rejects overflow. Malformed inputs, impossible analytical totals, singularity and other rejection controls remain.

No chemistry-specific exceptions, species-name dispatch, uranium thresholds or tolerance weakening were added.

## Full uranium comparison

Controls use total U 1e−5 mol/kg H2O, 25 °C, 1 bar declared, ideal activities, pH 0–12 at 0.5, Eh −2 to +2 at 0.1: 1,025 points per basis. The reference's documented Eh-to-pe conversion is used to compare identical pe; Adam's physical constants remain unchanged. The exact same prepared components, coefficients, log K and species order were additionally exported to the unchanged HALTAFALL library and solved afresh.

| Metric | UO2²+ basis | UO2+ basis |
|---|---:|---:|
| Adam accepted | 1025 | 1025 |
| HALTAFALL error flags | 0 | 0 |
| Carrier-label disagreements | 0 | 0 |
| Solid-assemblage disagreements | 0 | 0 |
| Maximum carrier amount difference, mol/kg H2O | 1.105565868074563e−14 | 1.1870858435776219e−14 |
| Maximum total/dissolved U difference, mol/kg H2O | 1.124709490308868e−14 | 1.3458796184191539e−14 |
| Maximum log-activity difference | 1.953807782228978e−9 | 2.2558950263373845e−9 |
| Maximum Adam component-balance residual | 1.3738874404464751e−18 | 1.8058742435461683e−18 |

All amount differences satisfy the unchanged 4e−14 criterion; logarithmic differences satisfy the existing 1e−8 comparison criterion. Explicit versus implicit ideal-water controls have zero difference. Cross-basis maximum carrier amount difference is 1.395910297075087e−18, with zero label disagreements. The unchanged prior official reference fixtures also pass; they were not regenerated to fit Adam.

Both bases have carrier counts UH3(cr) 244, UO2(cr) 275, U3+ 3, U4+ 8, U4O9(cr) 16, UO2(OH)3− 86, U3O8(cr) 7, UO3·2H2O(cr) 189, UO2²+ 197. These are carrier controls, not a newly supported uranium oxidation-state map.

Fe retains exact system identity 8ead3d660c3c240620da3c69fa3a4b55810695c1dce8216e166f9579043386a1 and counts 422/581/1473/89. Cu retains fa745a9d951a38cac972a421932facd4634655ad14203aec20dd7feb9ed47a05 and counts 1179/156/1230. Their exact reference fractions, not merely counts, pass regression.

## Performance

Single fresh-process runs on this machine; no claim of a reproducible speedup. Full Fe/Cu workflow time and U solve-only time are distinct measurements.

| Control | Before, ms | After, ms |
|---|---:|---:|
| Fe 2565-point workflow | 10748.984 | 10325.149 |
| Cu 2565-point workflow | 6056.836 | 5601.505 |
| UVI 1025 requested solves | 5999.481 (836 accepted) | 5551.346 (1025 accepted) |
| UV 1025 requested solves | 4217.453 (836 accepted) | 4008.002 (1025 accepted) |
| Ordinary acid-base, 1000 point solves | 50.977 | 38.959 |

No material slowdown was observed. These measurements do not establish performance for arbitrary systems.

## Files and evidence

Existing implementation files changed: src/solver/point.js; src/analysis/pointTrace.js; src/calculations/outputs.js; src/calculations/solubility.js; src/plots/formatNumber.js; src/components/PointResult.jsx; src/components/InteractiveBeaker.jsx. New implementation: src/solver/logConcentration.js. Existing tests changed: tests/pointHardening.test.js, tests/pointSolver.test.js, tests/generalBasisEquilibrium.test.js. Added tests/logConcentration.test.js.

New report/evidence files: this report, extreme-numerics-validation.json, extreme-numerics-protected-hashes.json, extreme-numerics-failure-map.md, extreme-numerics-failure-map.json.gz and extreme-numerics-traces.json.gz. The traces preserve every accepted result using the trace extension, with its full linear/log/status values and exact-prepared reference species. Research scripts, Java harness, prepared inputs and run logs remain under .local/extreme-numerics; none is a runtime dependency. Earlier accepted scientific evidence remains historical and unchanged.

## Limits and next-phase interpretation

Finite upper overflow, difficult signed cancellation, ill-conditioned Jacobians, search-budget limits and broader multicomponent robustness remain bounded by existing rejection logic. This phase does not establish an unlimited numerical domain, arbitrary analytical totals or support for all thermodynamic databases. Linear numbers remain binary64 approximations; consumers of extended results must honor the accompanying status/log contract. No real compound-color or gas-inventory claim follows from this work.

Future interpretation only: primary map color is oxidation state; secondary information is actual carrier, acid-base/hydrolysis form and solid form. The equilibrium engine preserves those species rather than collapsing their chemistry. Uranium metadata must be sourced and independently scoped in a subsequent phase before public support. This phase enables no public uranium feature.

A. GENERAL NUMERICAL DOMAIN HARDENING VALIDATED; READY FOR BOUNDED URANIUM OXIDATION-STATE SUPPORT
