# Imposed-Eh final interaction and inventory pass

## Conservation audit — presentation issue confirmed

The internal ordinary basis component retains its source Fe²⁺ identity, but the conserved analytical amount is the Fe-component inventory, not the amount of Fe²⁺ ions remaining at equilibrium. Accepted aqueous contributions and positive solid amounts are weighted by the canonical reaction's Fe coefficient. Fe(cr) has coefficient 1; Fe₃O₄ has coefficient 3. The electron constraint is fixed activity (kh=2), not an analytical material total (kh=1).

The existing accepted result provides dissolved Fe and accepted solid amounts; their weighted sum closes to the supplied analytical total within the unchanged balance tolerance. The presentation layer never recomputes an equilibrium or invents a second partition.

Focused controls check pH 0 at the reducing, middle and oxidizing samples. They also verify that selecting supplied Fe³⁺ retains that requested source identity separately while producing the same canonical Fe²⁺ basis and exact concentrations as the same imposed-Eh calculation supplied through Fe²⁺. This confirms that the previous “Total Fe²⁺” text was a basis-name presentation leak, not a conservation error. No solver, phase acceptance, thermodynamic constant or tolerance was changed.

## Presentation changes

- Water references default to on when no explicit preference exists. An explicit user choice to hide them remains a view preference. The toggle never changes the accepted sweep.
- The compact clickable legend is ordered by abundance at the selected/hovered accepted sample. Fraction views use the exact plotted fraction; log-concentration views use the exact logarithmic concentration/amount (a monotonic abundance ordering that retains tiny traces); other applicable views use unrounded linear amounts or accepted concentrations. Failed/unavailable and zero carriers fall last. Ties preserve original catalog order. No species is hidden by ranking.
- The legend's DOM entries keep stable carrier keys. Colors still use the original derived catalog index, never the sorted position. Focus is stored by carrier ID. Selection and hover use the existing shared sample context.
- The Beaker says **Total Fe**, **Analytical total**, and **Supplied as: Fe²⁺** (or the actual requested source form). All dissolved/solid percentages continue to use the original accepted partition, now labeled as fractions of total Fe.
- Oxidation labels use the existing identity-validated registered allocations. Fe(cr) is shown as **Fe(0)**; the aqueous Fe²⁺ leader is shown separately as **Fe(II)**. Mixed-valence magnetite retains **Fe(II) / Fe(III)**. Metadata-pending chemistry gets no inferred oxidation-state label.
- The Beaker reports whether the selected imposed potential is below H₂, inside the nominal window or above O₂. This is reference context only; outside-window potentials can still be calculated.
- Original preparation component ID/name, canonical system identities, allocation version and accepted results remain available in numerical inspection and numerical export. Scientific arrays and fractions are unchanged.

## Actual production-browser verification

Used the rebuilt local production dist at `/adambritts-site/laboratory/`, not merely internal reference arrays. Control: total Fe 0.001 mol/kg H₂O, fixed pH 0, 25 °C, ideal, declared 1 bar, −2 to +2 V, 17 samples.

| Check | Result |
|---|---|
| A: defaults on | Fresh calculation shows the checkbox checked without clicking it. |
| B: visible references | H₂ and O₂ dashed vertical lines and the shaded nominal window are visibly rendered. At pH 0: 0 V and 1.228887591327141 V vs SHE. |
| C: toggle | Disable removes both SVG markers; re-enable restores both. |
| D: reducing ranking | At sample 0 / −2 V, Fe(cr) is the first Fe carrier (second overall after H⁺ in log concentration); first overall in Total fractions. |
| E: oxidizing ranking | At sample 16 / +2 V, Fe³⁺ is the first Fe carrier in log concentration and first overall in Total fractions. |
| F: colors | Every carrier's swatch color remains identical when changing samples in the same view. |
| G: focus | Fe(cr) remains focused when it moves down the ordered legend; Clear focus restores the unfocused state. |
| H: identity | Legend and Beaker expose the same accepted input ID and sample index. Keyboard increment from sample 15 selects sample 16 in both. |
| I: inventory language | Beaker shows Total Fe, Supplied as Fe²⁺, Fe(cr) · Fe(0) · solid, and 100% of total Fe at −2 V. |
| J: view reuse | Switching to Total fractions preserves sweep ID and selected endpoint. No recalculation. |

Actual rendered SVG positions were checked against its viewport: H₂ path x=563, O₂ path x=856.0896905315232, exactly matching their Eh-to-axis mapping for that viewport. These pixel positions are viewport-specific; the physical references are not. Browser console errors: none.

Dynamic ordering did not lose ID-based focus or break keyboard sample navigation in the tested interactions. Labels explain the current-sample abundance ordering. The original catalog still determines curve identity and color.

## Validation

- Focused tests: 19/19 pass.
- Full regressions: 550/550 pass, zero failures/cancellations/skips/todo. Existing Fe/Cu reference, golden, Pourbaix, solubility-gap and closed-redox checks pass.
- Production build and artifact audit pass.
- Lint: zero errors; one pre-existing ExpandedPlot hook warning.
- Hash review: eight existing presentation/integration files changed; protected solver, thermodynamic data, basis/compiler mathematics and water-reference calculation files are unchanged. Two small presentation helpers were added. See `eh-final-hash-review.json`.

No deployment, commit or remote push. Stopped for review.
