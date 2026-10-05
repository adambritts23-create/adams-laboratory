# Fe(cr) imposed-Eh audit and water-reference presentation

## Scientific diagnosis

Fe(cr) is a legitimate accepted phase in the discovered Fe redox network. It was not suppressed or changed. The imported source formation reaction is:

Fe²⁺ + 2e⁻ ⇌ Fe(cr), log10 K = −15.89 at 298.15 K.

Source species/reaction record: `spana:2ac52a30213c9288:127500`, Eq-Diagr/Reactions.db byte offset 127500, length 72, database SHA256 `2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a`. The record cites Lemire et al., *Chemical Thermodynamics of Iron. Part 1*, OECD NEA (2013). This is the citation preserved by the imported record, not a claim that the original book was independently re-extracted during this audit.

The canonical Fe²⁺, H⁺, e⁻, H₂O basis gives coefficients [1, 0, 2, 0] and the same log K. The Fe³⁺ source relation has log K = −13.051 for Fe²⁺ − e⁻ → Fe³⁺. Substitution into all original source reactions independently reproduces every prepared product coefficient and log K (within 1e−12 for floating arithmetic), including hydrolysis, dimers, ferrate and solids. In a Fe³⁺ basis the metal relation is equivalently Fe³⁺ + 3e⁻ → Fe(cr), log K = −2.839; no second conserved electron inventory is introduced.

## Independent transition calculation

The audit uses raw imported source reactions and a separate mass-action/Nernst calculation. It does not call the production basis compiler or Eh conversion to obtain its expected values. It compares those values against independently executed full fixed-Eh equilibrium solves. This is independent algebra/numerics with the same thermodynamic dataset, not a new external-reference campaign or experimental validation.

Following the [IUPAC Nernst convention](https://goldbook.iupac.org/terms/view/09068), with pure metal activity 1 and ideal aqueous activity normalized to the molality standard state:

E = E° + (RT ln10 / 2F) log10 a(Fe²⁺)

RT ln10/F = 0.05915934968478233 V at 25 °C; E° = (RT ln10/F)(−15.89)/2 = −0.47002103324559563 V vs SHE.

At metal saturation, log10 a(Fe²⁺) = 2E/(RT ln10/F) − log K. Raw source mass action gives every aqueous Fe carrier; their component-weighted sum gives dissolved Fe. The disappearance boundary is where that sum reaches the supplied analytical total. Hydrolysis/dimer terms are retained; total Fe is not blindly substituted for free Fe²⁺.

Conditions: fixed pH 0, 25 °C, declared 1 bar, ideal activity, a(H₂O)=1, the existing discovered seven-solid model. Two totals are reported because the request did not specify the current total.

| Total Fe (mol/kg H₂O) | Independent metal disappearance (V SHE) | Calculated disappearance (V SHE) | Independent 50/50 solid/dissolved (V SHE) | Calculated 50/50 (V SHE) |
|---|---:|---:|---:|---:|
| 0.001 | −0.5587600577829732 | −0.5587600577834388 | −0.5676644271725204 | −0.5676644271720548 |
| 1 | −0.4700210332557998 | −0.47002103325626543 | −0.4789254026453468 | −0.4789254026458124 |

The solver disappearance is bracketed to about 9.3e−13 V; this is numerical agreement with the given constants, not physical accuracy at that precision. Both transition definitions agree within the regression threshold of 1e−8 V. Disappearance and equal partition are different boundaries. The existing 17-point sweep remains sampled at 0.25 V spacing; its straight segments are not newly refined equilibrium boundaries.

At −2 V, dissolved Fe is 1.8880111609992823e−52 mol/kg H₂O for both totals. Accepted Fe(cr) amounts are respectively 0.001 and 1 mol/kg H₂O; all other accepted solid amounts are zero. The metal fraction rounds to 1 and the numerical balance residual to 0 because the dissolved remainder is far below subtraction resolution, not because dissolved Fe is mathematically zero. The unchanged component-balance tolerance is satisfied. Full solid statuses, source provenance, unrounded values, and transition brackets are in `fe-metal-eh-audit.json`.

## Water reference presentation

The optional **Show water-stability references** checkbox is off by default. It adds vertical dashed H₂ and O₂ markers and a restrained shaded nominal water-stability window to each compatible Eh-axis view. The annotation is stored with the accepted imposed-Eh result, outside the sweep definition. View toggles do not change the numerical request, sweep identity, selected sample, bounds, curves or gaps.

The new adapter calls the existing source-identity-checked `prepareWaterContext` and `waterContext`; these use the unchanged Pourbaix `waterReferences` calculation. No second water formula was added. At pH 0 / 25 °C the positions are exactly:

- H₂: 0 V vs SHE.
- O₂: 1.228887591327141 V vs SHE.

pH 7 is also checked against the identical registered Pourbaix output. The supported reference scope remains 25 °C; unsupported temperature/source identity produces an unavailable annotation. A fixed-Eh pH scan does not get vertical Eh markers.

Assumptions: unit normalized H₂/O₂ gas fugacity, a(H₂O)=1, SHE. Source reference-pressure scalar is unavailable; the application's pressure is declared. Gas inventories are not solved. Reference markers do not constrain, clip, reject or invalidate equilibria outside the window and do not model gas evolution kinetics, overpotential or electrode kinetics.

SVG metadata includes the displayed reference annotation and its source information. Numerical JSON includes it in view metadata plus the original accepted sweep. Offscreen markers are simply not drawn in the current viewport; equilibrium data are untouched.

## Readability and inspection

Log-concentration solid legends now use compact labels such as **Fe(cr) · solid**. Exact accepted formula-unit amounts and mol/kg H₂O units remain in export and Beaker inspection; the plot's sample inspection additionally exposes the original-precision solid amount. No fraction denominator, solid inventory or sediment display rule changed.

## Verification

- Focused audit/interaction regressions: 14/14 pass.
- Production preview: Fe, pH 0, 0.001 mol/kg, −2 to +2 V, 17/17 accepted; marker toggle, focused metal curve, Total fractions view reuse, endpoint sample/Beaker synchronization and shortened solid labels verified. Browser errors: none.
- Build passes; production artifact audit passes.
- Lint: zero errors, one pre-existing ExpandedPlot hook warning.
- Hash review: only five existing presentation/integration files changed; solver, thermodynamic data, closed-redox mathematics and existing Pourbaix reference calculations unchanged. Two production annotation/rendering helpers were added. Audit code remains under scripts/validation and is not a production dependency.
- Full regression: 545/545 pass; zero failures, skips, cancellations or todo. Existing golden/reference checks remain intact. Results are recorded in `eh-water-regression.txt` and `eh-water-validation.json`.

No deployment or remote push. Stopped for review.
