# Exact source-derived closed conservation — general controls and new source networks

Exact source-derived conservation passed Fe/peroxide and europium, building on the retained twelve-dose chromium checkpoint. Nitrate and copper both reached complete source-only conservation spaces without adding atom vectors. Neither new preparation is claimed as an accepted complete equilibrium.

## A. Exact algebra

The successful BigInt rational prototype was retained. Integer source stoichiometry, rational row operations and exact binary decoding of supplied Number inventories preserve structural cancellation until final nearest/ties-to-even Number conversion. No epsilon clipping or solver tolerance changes occurred. Electron-free reaction combinations preserve the full closed material reaction span; solvent water has zero invariant weight; charge remains explicit. Electron half-reaction mass action is retained.

The combined Fe/Eu control audit covers 41 source equations and 113 coefficients, all safe integers. The full repository also contains 77 noninteger coefficient occurrences. This is not a universal integer assumption: the prototype explicitly refuses noninteger source structure pending a source precision/semantics audit. Finite binary numbers are rational as stored, but their intended chemical precision must not be invented by approximate rationalization. log K is never included in structural conservation algebra.

## B. Reviewed Fe(II)/peroxide

All three saved doses (2.5e-7, 5e-7 and 1e-6 mol/kg H2O peroxide supplied, 1e-6 total supplied Fe(II)) passed under the historical reviewed scope. No counterion-redox exclusions were broadened.

Source-derived solver targets, pH, pe and every carrier matched the existing production run exactly. Saved independent pH/pe and every saved positive carrier also passed; maximum carrier log10-ratio difference against saved independent values was 4.796179087622945e-12. Source mass-action residuals and charge/source-coordinate closure passed. Derived and reviewed conserved subspaces matched. No atom vector entered conservation construction.

## C. Europium

The existing Eu3+ / H+ / Cl− preparation passed. pe = 12.672154651918053. Production target, pH, pe and carrier differences were zero. Maximum saved-independent carrier log10-ratio difference was 5.684710415331999e-14. Source laws, charge and conservation checks passed, with matching source-derived/reviewed conserved subspaces. The existing docs/open-closed-independent.json was read, not regenerated.

## D. Basis invariance

Six additional structural variants were run for both Fe and Eu: reversed conservation rows, sign changes, exact invertible row combinations, reaction order reversal, source-species order reversal and a redundant equivalent structural equation. All twelve runs had zero pH, pe and carrier/log-ratio difference from their production control. The retained chromium evidence already contains seven variants and all twelve saved doses with zero differences; it was not restarted.

These are invariance tests of conservation representation with the retained production activity basis. They do not establish every possible numerical activity-basis choice. Redundant structural equations were not injected as new thermodynamic physics.

## E. Na+/NO3−

At 0.010 mol Na+ plus 0.010 mol NO3− in one model kg H2O, physical admission and electroneutrality passed. Source-only forward/inverse discovery retained 25 aqueous equations and disclosed ten excluded phase records. No nitrate atom vector or electron-reaction suppression was used.

Four independent solvent-free conserved coordinates were derived with exact zero null residual. Targets in the source-selected physical basis were [0, 0.01, 0.01, 0, 0], including unit-activity-water log target 0. The unchanged point solver then failed with **singular-or-ill-conditioned**. Status: **UNAVAILABLE / equilibrium-not-accepted**. No pH/pe, phase stability, or accepted nitrate equilibrium is claimed. This task did not tune solver seeds/tolerances or mask the failure.

## F. Cu2+/2Cl−

At 0.010 mol Cu2+ plus 0.020 mol Cl− in one model kg H2O, source-only discovery retained 35 aqueous equations and disclosed eleven excluded phase records. Four independent conserved coordinates had exact zero null residual. No Cu atom vector was supplied.

The aqueous candidate passed the existing point solver and source-coordinate/charge/potential checks (candidate pH 4.672530609681158, candidate pe 13.955996137974916). It was then rejected by phase disclosure: **CuCl2·3Cu(OH)2(cr)** has hypothetical log saturation 1.5378464245888157, so the aqueous-only candidate requires a solid outside this probe's admitted inventory scope. Status: **UNAVAILABLE / excluded-phase-required**. These candidate values are diagnostic, not an accepted complete copper result. Gas-reference fugacity sum was 2.655259617934799e-9; the actual blocking result was the solid requirement.

## G. Solids

The retained chromium experiment transported anonymous conserved weights through solid source coefficients and used the existing coupled pure-solid active-set solver. Its twelve-dose parity includes solid identities, amounts and saturation. No second solid algorithm or formula parsing was introduced. The generic aqueous-only probe deliberately does not claim generalized solid admission; it refuses the copper candidate when a missing solid is relevant.

## H. Production integration

**Nothing was promoted.** The known-control numerical gates pass, but the isolated source-discovery probe is not yet the complete branded production preparation/inspection contract. A production promotion must reconcile optional elemental/water semantics, solid extension, source-admission failures, revision/branding checks and reviewed-route cross-validation. The smallest integration is documented in exact-general-production-design.md. This is an integration design, not an assertion that the application now exposes atomless redox calculations.

All work in this continuation is confined to validation scripts and reports. Production solver, constants, tolerances, source data, reviewed metadata, UI and application routing remain unchanged. Because no production integration occurred, the conditional full-regression/build/artifact-audit/lint sequence was not triggered.

## I. Calculation and Wet Lab architecture

No modes were cosmetically merged. The focused source audit confirms:

| H+ | e− | Existing status |
|---|---|---|
| imposed | irrelevant | Ordinary fixed-pH calculation exists. |
| derived | irrelevant | Closed non-redox physical preparation exists. |
| imposed | imposed | Existing imposed-pH/Eh sweeps and Pourbaix paths. |
| imposed | derived | Separate reservoir/conservation boundary work required; current closed compiler rejects imposed activities. |
| derived | imposed | Separate reservoir/conservation boundary work required; not established by this closed prototype. |
| derived | derived | Reviewed closed redox exists; exact source-only conservation now passes the known-control prototype gates. |

Exact nullspace construction does not automatically supply all reservoir combinations: each imposed activity changes which material exchanges and balance constraints are allowed. The current closed compiler explicitly refuses fixedActivities/Eh/pe inputs.

Wet Lab already supplies component identities, physical amounts, charge and fingerprint to unified preparation. Once the production contract above is implemented, it can consume source-only conservation generically without reagent-specific routing. Element totals, elemental fractions and oxidation-state interpretation must remain optional reviewed semantics. Anonymous coordinates must never be labelled Total Cu or Total N.

## J. Remaining limits and evidence

- Ideal 25 °C, declared 1 bar and current model-solvent convention only.
- Existing 64-species/reaction and 16-basis bounds; no network truncation.
- Current bounded solid admission; no gas/headspace inventory model.
- Explicit unsupported status for unaccepted numerical equilibria.
- Noninteger source coefficients need a separate representation/admission audit.
- Reviewed semantic metadata remains necessary for element/oxidation-state labels, not for the demonstrated source conservation algebra.
- No performance caching or profiling, browser titration, deployment or push.

Evidence: exact-general-fe.json, exact-general-eu.json, exact-general-invariance.json, exact-general-coefficients.json, exact-general-nitrate.json, exact-general-copper.json and exact-general-summary.json. Earlier exact-inventory chromium artifacts remain unchanged. No independent evidence was regenerated.

Scientific conclusion: source stoichiometry can provide the complete conserved inventory space without atom vectors for these admitted networks. The next blockers observed were numerical acceptance for nitrate and phase closure for copper, rather than missing elemental composition. Production integration remains a separate uncompleted step; stopped for review with its concrete design.
