# Wet Lab / System / Calculation parity

## Scientific correction

Analytical Wet Lab now transports component inventories and dilution into the **ordinary Calculation constructor** for the selected System. It uses the same selected components, selected products, conditions, phase policy, source preparation, point solver and accepted-result inspection. No alternate equilibrium engine, redox closure, constants, tolerances or phase-acceptance rules were introduced.

The previous analytical route ran `nonRedoxScope` over the supplied coordinates, including electron-bearing inverse laws and reachable aqueous records, then constructed a separate aqueous compiler scope. This was broader than Calculation's explicit component basis. The existence of an electron law in that screen did not establish that electron activity belonged to the requested problem. The screen remains available for its other contracts and historical structural audit; it no longer controls ordinary analytical Wet Lab admission.

Exact before/after source evidence: `.local/system-wetlab-parity/source-membership.json`. All four old screens refused as `redox-boundary-mismatch`. Current ordinary products are:

| Selected ordinary basis, plus H+/water | Admitted products |
| --- | --- |
| Phosphate | H2PO4-, H3PO4, H4PO4+, HPO4 2-, OH- |
| Carbonate | CO2(aq), H2CO3, HCO3-, OH- |
| Acetate + formate | CH3COOH, HCOOH, OH- |
| Ca2+ + carbonate | The carbonate products, CaCO3(aq), CaHCO3+, CaOH+, and the same four Calculation solid candidates: Ca(OH)2(cr), CaCO3(am), CaCO3(cr), CaO(cr) |

No database record was deleted or altered. A System explicitly containing e- is refused by Acid/base Wet Lab with an explicit separate-contract explanation. Physical/reagent and closed-physical routes remain separate and unchanged.

## Inventory and UX

The stock engine still adds sample moles and delivered titrant moles and divides by the existing model-water mass. Signed analytical H+ equivalents are retained; no electroneutrality constraint or counterion is added. Mixture pH is derived. All selected ordinary components receive their transported total, including exact zero; zero-boundary failures are retained rather than replacing zero by a trace.

System is required. A supplied nonzero coordinate outside it is refused with a route to select it in System. The Wet Lab searchable picker now offers only selected System coordinates and the existing conveniences whose source coordinates are all in that System. It does not silently add chemistry. The visible "Edit chemistry in System" button returns to the periodic table. System edits invalidate experiments through the existing complete System key and revision protections.

Search, apparatus, accepted sample identity, plots, dilution and physical recipe controls are retained. Search descriptions no longer warn of broad redox expansion for a selected ordinary acid/base input. The direct source IDs and optional elemental metadata remain unchanged.

## Component-form audit

The System panel correctly exposes actual HYDRA basis forms, not every equilibrium product. Carbonate, phosphate, acetate, formate and citrate are actual components. Carbonate's HCO3-, H2CO3 and CO2(aq), and phosphate's protonated products are source-defined equilibrium species in these bases. They are not new independent components; selecting all as a basis would introduce dependencies. Existing CH3COOH, B(OH)4- and OH- stock conveniences retain their signed source-coordinate mappings and remain selectable when their underlying basis is in System. No new formula parsing, alias chemistry, duplicate source records or fake components were added. Additional protonated stock conveniences are deferred rather than mislabelled as HYDRA components.

## Direct differential harness

`tests/helpers/wetLabCalculationParity.js` independently creates a Calculation definition from each transported dose inventory. It compares accepted/refused status, prepared System and point input, species IDs, concentrations, log activities, balances and limits, solid phase identities/amounts and pH. It does not use Wet Lab's request-building function to construct the comparison request.

Eight systems are tested at 0, 25, 50 and 100 mL: strong H+/OH-, acetate/H+, acetic acid/OH-, citrate/H+, phosphate/H+, acetate+formate/H+, carbonate/H+, and Ca2+/carbonate. Separate tests require System, reject explicit electrons and reject supplied coordinates outside System. Existing 107-point analytical audit parity and weak-acid checks are retained with explicit System fixtures. The prior tests that expected broad carbonate/Cr redox refusal were updated to the new explicit-System contract, without changing source/golden evidence.

## Calcium/carbonate

At 50 mL 0.01 M Ca stock with 0.01 M carbonate titrant, Calculation's existing multi-solid policy is reusable. At 25, 50 and 100 mL, both paths accept the same phases/inventories and pH 9.152868845788785, 9.903655424606601 and 10.871227454968214. Exact solids, saturation and residuals are in `.local/system-wetlab-parity/calcium-carbonate.json`.

At zero added carbonate, both paths refuse the same exact-zero selected-component boundary (`inconsistent-or-boundary-total`). This is an existing point-solver limit; no redox warning, zero-to-trace substitution, interpolation or aqueous-only fallback is used. The displayed curve preserves this gap. No new solid solver or separate analytical-solid compiler was needed for the accepted positive-dose states.

## Stock pH investigation — deferred

Calculation can solve a fixed-pH stock and exposes source-coefficient-weighted component amounts. A future stock adapter could obtain the conserved signed proton inventory from the accepted complete inventory (aqueous plus admitted solids), then release the proton reservoir on mixing. It must also define whether suspended solids are transported, how stock preparation and source scope are branded, and how imposed-pH preparation is converted to conserved inventory. Those are additional scientific contracts and tests, so no stock-pH field is enabled here. Two stock pH values would never remain simultaneously imposed after mixing.

## Browser verification

Actual local browser checks, separate from backend tests:

- Default H+/OH-: 107 calculated samples; selected 50 mL pH 7.00075, with no Na/Cl inputs.
- Phosphate selected in System with e- absent: Calculation 5/5 pH samples; Wet Lab curve prepared, pH 12.57412 / 9.70052 / 4.71893 at 0 / 50 / 100 mL.
- Carbonate: Calculation 5/5; Wet Lab pH 11.65426 / 8.33939 / 3.91618 at the same doses.
- Acetate + formate: both checked in System; Calculation 5/5; Wet Lab two-component sample accepted, pH 8.89979 / 4.25632 / 2.60832.
- Citrate selected through System: Calculation 5/5 without requiring an atom vector.

A reusable visible-UI strong-control smoke procedure is retained in `tests/browser/strongAnalyticalWetLabSmoke.js`, taking the browser Playwright handle and starting from the default System. It asserts the 107 samples and selected equivalence pH.

No deployment or push. Final validation results will be appended below.

### Further browser results

Citrate Wet Lab: pH 9.68065 / 5.57166 / 3.95947 at 0 / 50 / 100 mL after selecting citrate in System. Ca/carbonate Calculation: 5/5 pH samples; Wet Lab: 100 accepted positive-dose samples and the genuine zero-dose gap. At 50 mL, inspection displays pH 9.903655424606601 and CaCO3(cr) inventory 4.884264755178e-3 mol/kg model water (4.884264755178e-4 mol in the beaker), log saturation 0. Total fractions and aqueous speciation switch while retaining the exact selected 50 mL state. Browser error/warning log was empty.

## Final validation

- Full repository regression run once: **762/762 passed**, zero failures/skips, 877.195 seconds.
- Focused candidate/analytical/parity tests: 21/21; final parity/boundary tests: 9/9.
- Production build and artifact audit: passed. Existing large-bundle advisory remains.
- Lint: zero errors, one pre-existing ExpandedPlot.jsx cleanup warning. Added browser/helper files also pass targeted lint.
- SHA-256 baseline: 1,031 pre-existing files, 1,023 unchanged, eight intended files changed, none missing. Changes are six Wet Lab/UI source files and two migrated contract tests. Solver, Calculation preparation, source constants/data, reference/golden assets and previous reports remain unchanged.
- The full suite regenerates the closed-solids report; its run output is saved locally and the original report restored byte-for-byte. Preservation evidence: `.local/system-wetlab-parity/preservation.json`.

New files: the reusable differential helper, nine parity/boundary tests, permanent strong-control browser smoke procedure, this report and local validation artifacts. Stock-pH preparation remains explicitly deferred. No deployment or push. Stop for review.
