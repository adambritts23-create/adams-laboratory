# MEDUSA component-basis physical preparation

Missing atom vectors are no longer a universal physical-admission requirement. This phase does not add an atom catalogue, formula parser, solver, constants, gas model or cache. No deployment or push.

## A. Previous atom dependencies

| Location / use | Finding and disposition |
|---|---|
| wetLabIons ionicMetadata | Previously rejected a source form without elements. Now checks authoritative source identity and finite charge. |
| physicalPreparation / nonRedoxCoordinates | Previously required reviewed atom entries before source coordinates. Now admits pinned component identity and charge; transports known atoms only when complete. Negative physical inputs, electron/solvent solute inputs, ambiguous/unsupported source products and unbalanced preparation still refuse. |
| equilibriumNetwork direct physical path | Previously required atoms for every selected component and transported product. Source coefficient/charge transport now works without atoms; existing charge consistency and neutral-solid checks remain. Known atom data still receive consistency checks. |
| reactionBasis | Rank, source equation transformation and log-K transformation use stoichiometric coefficients. Its existing optional elemental check already skips unavailable vectors. No changes. |
| ordinary solver and nonRedoxChargeCheck | Component balances and charge use component coefficients and source charge. No atom requirement or solver changes. |
| generalClosedReagents discovery | Exact source connectivity can identify electron reactions without atoms. Its existing closed preparation still requires reviewed composition for all participating carriers. No chemistry changes. |
| closedRedoxNetwork | Explicit elemental rows, H−2O and charge define solvent-independent conserved inventories; rank and transformed-inventory checks rely on those rows. Retained unchanged. |
| closedPureSolids | Redox solid conservation uses the same reviewed physical inventories. Retained unchanged. Direct non-redox solid balances use source coefficients. |
| presentation | Component-based concentrations/fractions remain meaningful. Element totals and oxidation-state aggregates cannot be invented from missing metadata. Wet Lab separates component and elemental metadata status. |
| provenance | Identity, pinned snapshot, charge convention and metadata version do not require atoms. Source changes refuse. Ionic stocks now carry the component-metadata version, while reviewed recipes retain their existing version. |

## B. Physical component-basis model

For supplied contribution j with nonnegative physical moles n_j and retained signed source coefficients a_ij, the internal conserved coordinate is b_i = sum_j a_ij n_j. Source components use the unit coordinate vector. The solver concentration coordinate is b_i / declared model solvent mass.

Only the internal proton-equivalent coordinate may be negative. Source water coefficients remain provenance, with unit solvent activity rather than a dissolved-water analytical inventory. No electron is supplied as material. Charge is sum_j n_j z_j; the existing charge tolerance and no-implicit-counterion rule remain intact.

Metadata version: medusa-component-coordinates-v1. The full imported component/reaction fingerprint must match the existing audited snapshot. Existing sourceCharge grammar is reused, backed by the earlier 168/168 comparison with official Util.chargeOf in docs/component-metadata-audit/. This is charge notation handling, not atom-count or oxidation-state inference.

## C. Equilibrium equations

Mass action remains log(a_j) = log(K_j) + sum_i a_ij log(a_i). Component closure remains the sum of component-weighted aqueous and accepted solid amounts equaling b_i. Rank/basis transformation, activities and all numerical acceptance tolerances remain unchanged.

A focused 0.010 mol/kg-water Li+/acetate control passes without a lithium atom vector. It compiles through closed-physical-nonredox and the existing ordinary solver, closes source-component balances and mass action, and reports Eh as not determined. It is CONDITIONAL scope, not new independent experimental validation. Its existing phase disclosure retains electron-dependent Li(cr) outside the declared non-redox boundary.

## D. Redox scope

Source/electron stoichiometry suffices to discover connected half reactions, choose reaction-matrix free coordinates and transform equilibrium laws. It does not by itself satisfy the current validated closed-redox preparation contract: closedRedoxNetwork constructs conserved rows for non-H/O elements plus H−2O and charge, verifies their rank, and checks their transformed inventories. Merely deleting its metadata guard would remove those conservation checks.

Atom vectors are not claimed to be a universal mathematical necessity. A fully source-derived solvent-independent nullspace inventory is a possible separate compiler extension, but has not been implemented or validated here. The current network-specific refusal is unsupported-component-redox-conservation. It retains missing identity details, admitted preparation/coordinates and the actual electron-reaction source IDs. No electron reaction is suppressed to obtain a non-redox solution.

## E. Solids

For the direct non-redox path, source coefficients suffice for component balance, saturation index and accepted solid inventory; elemental vectors are optional diagnostics. Existing candidate scope, charge-neutrality check, phase closure, gas refusal and solver acceptance remain. Closed-redox solids still use the reviewed conservation basis. This phase does not claim broad new solid or gas validation.

## F–G. Nitrate and copper

| Preparation | Physical admission | Next actual result |
|---|---|---|
| Na+ 0.010 + NO3− 0.010 mol in 1 model kg water | Accepted, charge zero; nitrate atoms unavailable | Seven connected aqueous electron-reaction records; unsupported-component-redox-conservation, missing NO3− reviewed conservation metadata. |
| Cu2+ 0.010 + Cl− 0.020 mol in 1 model kg water | Accepted, charge zero; copper atoms unavailable | Nine connected aqueous electron-reaction records; unsupported-component-redox-conservation, missing Cu2+ reviewed conservation metadata. |

The corresponding Wet Lab structural preflights are UNAVAILABLE with the downstream conservation explanation, not a physical metadata refusal. Counts include connected chloride chemistry where applicable. No claim that either experiment solves is made.

## H. Preservation and validation

25/25 focused tests passed with zero failures/cancellations/skips/todo (component-physical-focused.txt). After the final ionic-stock metadata-version correction, the six ionic tests passed again (component-physical-stock-version-tests.txt). These are repeated controls, not six additional distinct tests. Changed-file lint passed with zero errors/warnings (component-physical-lint.txt). See component-physical-preservation.json for hash evidence. The selected preservation set covers 38 solver, analysis, source-data, reference and redox/basis metadata files; no differences against the completed unified-physical baseline.

Focused controls cover all twelve saved independent Cr doses (pH, pe, aqueous carriers, accepted solids, inventory closure), Fe/peroxide references, europium, acetate/borate, source fingerprints, forged objects, revisions, charge failures and shared analytical sample identity. No independent reference was regenerated. The prior repository-wide baseline remains 686/686; no new full-suite claim is made.

## I. Presentation limits

Wet Lab reports Component metadata and Elemental metadata separately, followed by the existing actual compiler/preflight status. Missing atom data are absent, not an empty vector suggesting zero atoms. Source-component concentration and fraction views remain available for supported non-redox results. Element inventory and oxidation-state interpretations remain unavailable without their reviewed metadata. Setup edits retain existing revision/stale-result behavior.

Production build and browser experiment campaign were intentionally not repeated in this focused phase. Stop for review.
