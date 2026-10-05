# Local experimental carrier Pourbaix fallback

Implemented locally, 2026-09-11. No deployment or push.

The opt-in **Calculate experimental carrier map** button appears in Pourbaix setup only in a Vite development build on localhost / 127.0.0.1 / IPv6 loopback, when ordinary discovery establishes constructible chemistry but reports incomplete oxidation-state allocation metadata. The public Plot diagram action and its metadata gate remain unchanged. Production builds omit the experimental dependency tree; the artifact audit explicitly verifies this boundary.

The experiment repeats the existing generic discovery and general source reaction-basis preparation, then calls the unchanged grid runner and point solver. It adds no species-name parsing, oxidation-state assignments, source constants, metadata registry or support claim. Carrier ranking uses source-basis coefficient times calculated carrier amount, across aqueous species and accepted solids, divided by the requested analytical total. It is not a solid-first rule. Amounts are reported in source reaction normalization and conserved source-basis equivalents, without inferring formula-unit/elemental normalization for other elements.

The largest contribution wins, with no majority requirement. Top fractions within an absolute 1e-8 fraction difference are a symmetric tie, without an order-selected winner. Fractions retain their raw values. The summed inventory must close within the existing componentBalanceTolerance(total,total); missing/nonfinite inventory is a gap, never renormalized. Failed/uncalculated/unbranded outcomes are gaps. The user input gate retains the existing small-total restriction. All oxidation-state readouts say unclassified / metadata pending.

Carrier colors are computed from exact source IDs, with deterministic hue separation over the sorted set of dominant carrier IDs. They encode neither oxidation states nor physical appearance. A changed set of carriers may change the palette. The sampled map has no boundary interpolation/refinement. This experimental map does not draw water-reference overlays or solve a gas inventory.

Click or hover selects a sampled equilibrium; arrow keys and the sample field provide keyboard access. Inspection includes pH/Eh/pe, carrier identity, phase, amount, total-inventory fraction, dissolved inventory, accepted solids, balance residual/tolerance, solver diagnostics and support/metadata status. The optional beaker receives the same accepted result object. Changed conditions unmount the experimental result and cancel an in-flight run; no experimental result is committed into the public session result gate.

## Chromium control

Total 1 mol/kg H2O; pH 0–14 (57 samples); Eh -1 to +1 V vs SHE (45 samples); Ideal, 25 C, 1 bar declared. Fixed H+/electron/water activities. This is the requested grid; its Eh step is 2/44 = 0.0454545... V.

Prepared system: f983401384320f9d4fc7d6af62a2aa4b4bf1a835958480739b94fcfa42190943.

**2,565 / 2,565 equilibria accepted; zero solver failures, zero map gaps, zero ties; exactly eight unique dominant carriers.** All 21 prepared conserved-component carriers remain available to the classifier. This is an internal smoke result, not independent chromium validation.

| Exact display identity | Phase | Dominant samples | Example pH | Example Eh / V | Source identity |
|---|---|---:|---:|---:|---|
| CrH(s) | solid | 202 | 0 | -1 | spana:2ac52a30213c9288:95613 |
| Cr2O3(cr) | solid | 1307 | 9.25 | -1 | spana:2ac52a30213c9288:94801 |
| Cr 2+ | aqueous | 75 | 2.5 | -0.6818182 | component:Cr%202%2B |
| Cr3(OH)4+5 | aqueous | 121 | 2.5 | -0.4545455 | spana:2ac52a30213c9288:94983 |
| Cr 3+ | aqueous | 288 | 0 | -0.4090909 | spana:2ac52a30213c9288:91532 |
| CrO4 2- | aqueous | 436 | 13.75 | 0 | spana:2ac52a30213c9288:96141 |
| CrO2(cr) | solid | 64 | 8 | 0.5454545 | spana:2ac52a30213c9288:95947 |
| Cr2O7-2 | aqueous | 72 | 7 | 0.6818182 | spana:2ac52a30213c9288:94892 |

Distinct Cr 3+ and Cr3(OH)4+5 regions expose hydrolysis; Cr2O7-2 and CrO4 2- remain separate acid-base/condensation carriers. No oxidation-state interpretation is assigned to these regions. Candidate CrH(s) is retained exactly as supplied by the source chemistry, not replaced by an assumed metallic carrier. Numerical evidence is in .local/carrier-experiment/cr-smoke.json (research only).

## Validation

- Normal suite: **507/507 passed**, no failures/cancellations/skips/todo (425.453 s). Includes all five official golden benchmarks and exact full-grid Fe/Cu fractions/topology.
- Final focused experimental tests after display/gap-guard adjustments: **4/4 passed** (17.451 s): Cr full-grid smoke, public gates including U and Fe/Cu fallback rejection, failed/forged gaps, cancellation.
- Production build and artifact audit: passed. No experimental implementation/chunk shipped in dist. Build retains its existing bundle-size advisory.
- Lint: zero errors, one pre-existing ExpandedPlot.jsx effect-cleanup warning.
- Browser: selected Cr through ordinary System UI; ran requested grid; confirmed eight carriers and zero failures; checked legend selection, keyboard sample selection, exact map/beaker sample agreement (2460), and stale result removal after editing total. Final local page retains the Cr control for review. Development hot-reload errors during an intermediate export rename were resolved; the final interface was recalculated successfully.
- Existing source/science/data/evidence hashes compared before/after: only PourbaixSetup.jsx and audit-production-boundary.js changed among pre-existing files. Solver, basis algebra, thermodynamic data, Fe/Cu metadata and public support contracts are unchanged. Full hash inventory: carrier-experiment-hashes.json.

## Exact changed files

- src/components/PourbaixSetup.jsx — DEV-only, loopback-only lazy entry; public setup otherwise unchanged.
- scripts/audit-production-boundary.js — explicitly audit the guarded lazy entry and reject experimental code in production artifacts; other dynamic imports still fail closed.
- src/experimental/carrierPourbaix.js — new generic local orchestration and carrier inspection.
- src/components/ExperimentalCarrierPourbaix.jsx — new opt-in map, legend, inspection and same-result beaker.
- src/components/ExperimentalCarrierPourbaix.css — scoped local styles.
- tests/experimentalCarrier.test.js — four focused tests.
- docs/carrier-experiment-phase.md — this report.
- docs/carrier-experiment-hashes.json — before/after evidence.
- Generated local artifacts: .local/carrier-experiment/{before.json,report.mjs,smoke.mjs,smoke.log,cr-smoke.json,tests.log,focused.log,build.log,lint.log,audit.log}; regenerated dist remains public-only and was not deployed.

Public Fe/Cu oxidation-state behavior is unchanged. U and other metadata-pending public oxidation-state maps remain blocked. Stopped for review; no further scientific scope is claimed.
