# CDTA–actinide and uranium–fluoride review

Reviewed 2026-10-06. This is an implementation research record, **not an installed reaction collection**. Existing source constants are unchanged. CDTA is an explicit exception to the earlier exclusion of new organic chemistry.

## Existing uranium–fluoride coverage

The local Spana snapshot and PSI/Nagra importer both contain the following aqueous families:

- U(IV): UF³⁺, UF₂²⁺, UF₃⁺, UF₄(aq), UF₅⁻ and UF₆²⁻.
- U(VI): UO2F+, UO2F2(aq), UO2F3− and UO2F4(2−).
- Mixed carbonate–fluoride: UO2CO3F−, UO2CO3F2(2−) and UO2CO3F3(3−).

Both sources use cumulative uranyl–fluoride formation log beta values 5.16, 8.83, 10.90 and 11.84. The mixed carbonate values differ numerically because the source bases differ; do not merge those numbers as if they described the same reaction. Spana also contains uranium–fluoride solids absent from the imported PSI subset. Their admission to PSI requires a separate provenance and basis review.

Reference: [NEA thermodynamic update](https://www.oecd-nea.org/dbtdb/pubs/vol5-update-combo.pdf). The installed UF6 analytical feed is a hydrolysis inventory conversion, not dissolved UF6 equilibrium chemistry.

## CDTA candidates

Let L4− denote fully deprotonated trans-CDTA, C14H18N2O8(4−). Do not substitute EDTA constants. Neither local source currently contains CDTA.

### Uranyl: highest priority for the fluoride ISE solution

Chen et al., *Uranium(VI) complexation with trans-1,2-cyclohexanediaminetetraacetic acid in solution: thermodynamic and structural studies*, J. Coordination Chemistry 73 (2020), 3382–3394, [DOI 10.1080/00958972.2020.1855430](https://doi.org/10.1080/00958972.2020.1855430).

The abstract identifies these complexes over pH 3–6:

| Product | Formation reaction to normalize | Import status |
|---|---|---|
| UO2H2L(aq) | UO2(2+) + 2 H+ + L(4−) ⇌ UO2H2L | Constant pending |
| UO2HL− | UO2(2+) + H+ + L(4−) ⇌ UO2HL− | Constant pending |
| UO2L(2−) | UO2(2+) + L(4−) ⇌ UO2L(2−) | Constant pending |
| UO2(OH)L(3−) | UO2(2+) + H2O + L(4−) ⇌ UO2(OH)L(3−) + H+ | Constant pending |

The numerical tables, medium, temperature-specific values and original reaction definitions have not yet been obtained. These four reactions must not be enabled with guessed constants. The pH range makes this study relevant to the approximately pH 5.3 ISE preparation, but does not by itself validate that concentrated matrix.

### Pu(IV): published conditional constants

Friend et al., *Complexation of Plutonium(IV) with trans-1,2-Diaminocyclohexane-N,N,N′,N′-tetraacetic Acid (CDTA) in Acidic Solution*, J. Solution Chemistry (2019), [DOI 10.1007/s10953-019-00859-1](https://doi.org/10.1007/s10953-019-00859-1).

Reported cumulative formation constants in **1.00 M (Na,H)ClO4, 23 ± 1 °C**:

| Reaction | log beta |
|---|---|
| Pu4+ + L4− ⇌ PuL(aq) | 24.2 ± 0.3 |
| Pu4+ + H+ + L4− ⇌ PuHL+ | 25.4 ± 0.2 |
| Pu4+ + 2 H+ + L4− ⇌ PuH2L2+ | 25.8 ± 0.1 |

These are **conditional, not zero-ionic-strength constants**. Before a solver implementation, obtain matching CDTA protonation constants at that medium and retain the medium as a model limitation. Do not combine this table silently with a zero-I ligand model.

The same study reports extrapolated zero-I proton dissociation pKa values at 25 °C of 10.64, 6.75, 4.17, 2.78 and 1.52 in order from HL3− toward H5L+. Consequently the cumulative protonation log beta values relative to L4− are 10.64, 17.39, 21.56, 24.34 and 25.86. The most protonated H6L2+ step is unresolved. These values are recorded for review, not activated independently of a compatible metal-binding dataset.

### Additional actinides

Kelley et al., *Revisiting complexation thermodynamics of transplutonium elements up to einsteinium*, Chem. Commun. 54 (2018), 10578–10581, [DOI 10.1039/C8CC05230A](https://doi.org/10.1039/C8CC05230A), is a primary lead for aminopolycarboxylate binding including CDTA. Extract the individual ligand/metal constants and medium from the paper and supporting information before adding Am, Bk, Cf or Es records. No constants imported from this lead yet.

## Additional fluoride candidate

The 2024 [Raman study of uranyl–fluoride complexation](https://doi.org/10.1039/D4CP01569J) investigates UO2F5(3−) and reports a fifth stepwise K of 0.92. This is K, **not log K**. Its concentrated fluoride medium must be checked before combining it with any cumulative beta4. No fifth-fluoride record is enabled from this number alone.

## Implementation gates

1. Obtain source tables and supporting information; preserve equation, medium, temperature, uncertainty and citation per record.
2. Add an explicitly composed CDTA component and reviewed metadata; ensure both source registries recognize it.
3. Normalize protonation and metal reactions to each source basis with atom/charge checks. Keep conditional collections separately selectable.
4. Test ligand and metal mass balances, protonation limits, and Calculation/Wet Lab parity. Compare against published measurements before calling a model verified.
5. Keep unavailable constants null. Do not replace native fluoride records or interpret the ISE's illustrative ion animation as a speciation calculation.

## ADU review status

Nominal ADU with a supplied trial constant is labelled **Provisional — enabled for testing; review pending**. The previous Spana experiment used formation log K −14.3 for its displayed NH3-based reaction. Its applicability and reaction convention remain unverified; it is not a verified thermodynamic ADU constant and is not transferred unchanged to PSI/Nagra.
