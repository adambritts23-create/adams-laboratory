# Source-derived closed redox conservation — stopped at first chromium parity gate

The first chromium experiment did **not** meet pe parity. Per the requested stop rule, no later systems were attempted and no experimental path was promoted. Production source, solver, constants, tolerances, metadata, saved references and UI were not edited. Only isolated validation scripts and reports were added.

## Mathematical result

See source-closed-conservation-audit.md for the audit written before the prototype. The experimental matrix uses species as rows and source reactions as columns, with product minus reactant coefficients. Formal-electron cancellation gives the physical closed reaction span; zero weight on solvent water gives solvent-independent invariants. Authoritative charge is retained explicitly. No element attributes are accepted by the conservation routine.

At the admitted Cr/Cl/Na/H/water network, the derived space has **5 independent conserved coordinates**, has full rank on the five non-solvent basis coordinates, and spans the same space as the existing reviewed elemental/H−2O/charge rows. Maximum observed null residual: 8.881784197001252e-16. These are numerical structural checks, not a proof of general basis invariance or production readiness.

The already admitted chromium source network was obtained through the retained validated path. Cr/Cl atom metadata was stripped, together with all other atom vectors, before the new conservation derivation. Metadata still exists in the independent reference/admission system; this experiment does not claim to have completed metadata-free source discovery.

## First control: 10 mL NaOH

| Quantity | Existing accepted result | Experimental source projection |
|---|---:|---:|
| pH | 3.633028194538202 | 3.633028194538201 |
| pe | 9.191787475602922 | 6.592695684343284 |
| Eh, V vs SHE | 0.5437801694973959 | 0.39001958935541975 |
| Cr2O3(cr), mol/kg H2O | 0.002118169947586859 | 0.0021181699475868606 |

The nominally zero internal basis target associated with CrOH+ changed from exactly 0 to **1.214306433183765e-17 mol/kg H2O** during floating-point reconstruction from anonymous conserved totals. This is an internal transformed coordinate, not a supplied CrOH+ reagent amount. Other target differences are also at floating-point roundoff scale.

The unchanged point solver accepted the reconstructed numerical input under its existing component/phase checks, and pH and bulk solid inventory were effectively identical. Maximum absolute carrier difference was 1.1591113855085454e-17 mol/kg H2O. Nevertheless trace reduced/oxidized carriers changed by many orders of magnitude, and pe differed by -2.599091791259638 (Eh difference -0.1537605801419762 V). An absolute-concentration-only comparison would have concealed this failure.

The observed projection residue and trace sensitivity identify a numerical failure in this prototype's inventory reconstruction. They do **not** establish that atom vectors are mathematically necessary, nor that the accepted production model should be changed. No tolerance was relaxed, no small total was clipped to zero, and no reference was updated to make the experiment pass.

A single diagnostic repeat of the same 10 mL point reproduced the failure and recorded both numerical inputs/results. It was not a continuation to another dose. The harness stopped before its downstream full source-closure and saved-reference assertions; those checks must not be reported as passed. The production baseline itself was solved and accepted through the existing branded path.

## What remains unvalidated

- Twelve-dose chromium parity, including every trace carrier and derived potential.
- Reaction/component ordering and conservation-row sign/order/invertible-combination invariance.
- Simultaneous source-derived solid closure across the full dose set. The one point had the same active solid and saturation within roundoff, but that is insufficient.
- Fe/peroxide, europium, nitrate and copper. None was attempted after the chromium gate failed.
- Metadata-free discovery, production admission, elemental-view unavailability and presentation integration.

The next bounded investigation should address exact or otherwise cancellation-preserving **inventory transformation**, while retaining the existing solver and tolerances. Merely showing that two row spaces have equal rank is insufficient: the physical targets must survive basis conversion at the precision needed by redox traces. This is a recommendation for review, not additional work performed here.

## Constraint-model roadmap

No new production boundary mode was enabled in this phase.

| H+ condition | Electron condition | Current status |
|---|---|---|
| Imposed | Absent/irrelevant | Existing ordinary fixed-pH path. |
| Derived | Absent/irrelevant | Existing closed non-redox physical path. |
| Imposed | Imposed | Existing imposed-Eh and Pourbaix paths in their retained scopes. |
| Imposed | Derived | Requires separate reservoir/conservation admission and validation; not established here. |
| Derived | Imposed | Requires separate reservoir/conservation admission and validation; not established here. |
| Derived | Derived | Existing reviewed elemental closed-redox path retained. General source-only replacement did not pass this gate. |

Anonymous source coordinates must not acquire elemental or oxidation-state labels. Reviewed atoms remain valuable independent checks and semantic metadata. Water exchange inspection also needs an explicit source-derived convention before an atomless production path can replace H/O diagnostics.

## Evidence and scope

- source-conservation-summary.json: compact quantitative outcome.
- source-conservation-cr-first.json: initial failed parity assertion.
- source-conservation-cr-diagnostic.json: repeated same-point targets, nullspace, accepted point candidate and production baseline.
- scripts/validation/sourceConservationPrototype.js: isolated conservation-space derivation and inventory projection.
- scripts/validation/sourceConservationRun.js: unchanged production admission/reference plus existing solvePoint comparison; fails on pe parity.

No full regression, build, 101-point browser run, independent-reference regeneration, deployment or push. Stopped for review as required.
