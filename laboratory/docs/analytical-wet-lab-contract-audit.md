# Analytical-component Wet Lab: preimplementation contract audit

2026-09-17. Stopped at the explicit solver-level-change condition in section 22 of the task. No production implementation or source modifications were made. No deployment/push. This report is feasibility evidence, not a completed Wet Lab feature.

## Existing contracts

Wet Lab constructs branded physical solutions in wetLabSolutions.js. Its solution constructor requires the specified charge to be zero. The physical preparation adapter independently enforces electroneutrality in nonRedoxPhysical.js. These checks serve the physical/reagent contract and must remain.

Calculation can already prepare signed analytical proton totals: total constraints become kh=1 targets, fixed activity becomes kh=2, with unit water activity. Source stoichiometry forms component balances. The point solver does not add an electroneutrality equation or insert ions. Charge metadata remains source information, not a requirement that the analytical targets sum to zero.

The existing analytical-components branch of equilibriumNetwork.js prepares the H+/water source basis and its OH- reaction. The ordinary constructor also preserves this signed-total semantics. The audit calls the common constructor's current compiler dispatch (named adapter 'physical') with explicit boundary 'analytical-components'; it does NOT use physical preparation, fabricate a stock, or remove a charge check. The overloaded dispatch name is not a new proposed API.

## H+/OH- evidence

Sample: 50 mL, 1 mol/L source OH-. Burette: 100 mL loaded, 1 mol/L H+. Ideal 25 C, declared 1 bar, existing additive-volume convention. For dose v mL, supplied signed H+ equivalents are v/1000 - 0.05 mol, divided by (50+v)/1000 model kg H2O.

OH- identity is spana:2ac52a30213c9288:250448. Its actual source coefficients are H+:-1 and H2O:+1, with unchanged log K=-14.0015. No formula parsing or invented neutral reagent was used.

107/107 independently constructed analytical equilibria passed the existing solver's scientific validation. Every result has exactly these identities: component:H%2B, component:H2O, spana:2ac52a30213c9288:250448. No Na+, Cl-, NO3- or other counterion exists in these results.

| Delivered H+ / mL | Calculated pH |
|---:|---:|
| 0 | 14.001500000000004 |
| 25 | 13.524378745280377 |
| 50 | 7.00075 |
| 75 | 0.6989700043359107 |
| 100 | 0.4771212547196624 |

Full component-balance residuals/limits and mass-action residuals for every dose are in the JSON artifact. This proves analytical computation is possible; stock/UI admission and selected-dose integration have NOT been implemented or validated in this phase.

## Direct Cr3+ versus CrCl3

The exact selected source systems were H+, Cr3+, H2O and H+, Cr3+, Cl-, H2O. Both source audits are structurally calculable, conditional networks. Direct Cr3+ triggers connected electron-transfer source reactions, including records 91458, 96141, 91532 and 91606. Routing it through non-redox chemistry would suppress actual connected chemistry and is not acceptable.

For 0.01 mol/kg Cr3+ alone, specified charge is +0.03 mol equivalents/kg. prepareGeneralClosed rejects this in generalClosedReagents.js:154–155. Calling the existing lower preparation directly also rejects it: prepareClosedReagents sets chargePolicy='electroneutral', and prepareClosedRedox in src/solver/closedRedox.js:17–22 requires that policy and rejects nonzero charge.total. This demonstrates a lower validated-contract restriction, not merely the original Wet Lab bottle check.

The Cr3+ 0.01 + Cl- 0.03 mol/kg control prepares and solves with the existing pure-solid closure path: pH 2.6856409736427747, Eh 0.6416121600148371 V vs SHE. Chloride-connected source chemistry is retained. Direct Cr3+ has no accepted equilibrium because of the restriction above; no meaningful equilibrium difference or matched titration parity is claimed. Detailed discovered identities, phase scope and control inspection are retained in the artifact.

## Exact blocker and minimal coherent next step

No rank failure or invalid balance equation was observed. The discovered Cr network is admitted structurally. The blocker is the closed-redox preparation's enforced zero charge target. Its downstream inventory checks already compare actual conserved inventories with supplied targets, but nonzero-charge preparations cannot currently reach those checks.

The minimal design is an explicit second preparation policy, for example 'specified-analytical-charge', alongside unchanged 'electroneutral'. It must preserve the actual nonzero supplied charge as a conserved target, never zero it, insert a counterion, or add an independent charge-balance equation. Propagate and brand this policy through the general constructor, generalClosedReagents, closedReagents and closedRedox preparation, provenance and inspection. Reject unknown policies and keep all existing physical callers on electroneutral by default. Validate nonzero charge closure with existing propagated tolerances and exact source inventory transformations before exposing it in Wet Lab.

The non-redox analytical branch also needs explicit general phase closure/metadata integration: its present analytical-components entry supports aqueous scope only. Reuse the established phase admission/complementarity checks, not a silent aqueous-only substitute.

Then add separately branded analytical volume stocks and dose construction, source-bound OH- signed coordinate transport, direct-component controls, informational charge disclosure, and stale/exact-sample integration. Keep physical stocks and all historical reviewed references unchanged. Connected redox must dispatch automatically to the extended closed contract; real phase/gas/capacity failures must remain explicit.

This requires editing a solver-level preparation contract in src/solver/closedRedox.js. Section 22 says: 'If a solver-level change appears necessary, stop and explain why before making it.' Accordingly no such edit was made, and the feature was not partially exposed with chromium silently disabled.

## Validation status

Read-only computational audit only: 107 accepted H+/OH- doses; Cr direct general/lower preparation rejection reproduced; matched chloride control solved. Seven central solver/compiler/data files were hashed before/after and unchanged. No full regression/build/lint rerun: production source/build were untouched. Existing physical controls were not rewritten or migrated.

Reproduction: node .local/analytical-wet-lab/contract-audit.mjs
Evidence: .local/analytical-wet-lab/contract-audit.json

Limits remain ideal model, additive-volume/model-solvent convention and existing phase/gas scopes. An analytical stock is not a fully specified macroscopic solution; observables requiring full ionic composition need their own admission contract.
