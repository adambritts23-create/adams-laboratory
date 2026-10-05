# Ca–carbonate–Mg capability audit: stop for scientific review

## Decision

The requested full pH 0–14 mixed-system production diagram is **unsupported by the current solver**. No production code or plotting path was changed. The existing typed diagnostic is `unsupported-solid-assemblage`: preparation permits at most one candidate pure solid, not merely one active solid.

There is a genuine thermodynamic blocker, not numerical nonconvergence: every reduced zero/one-solid calculation converged, yet none satisfies all listed solid stability inequalities at the sampled pH values 10–14. Independent closed-form checks demonstrate simultaneous calcite and crystalline Mg(OH)2 at pH 10.5, 11, 12 and 13. At pH 14, even that two-solid assumption violates Ca(OH)2 saturation. A general multiple-solid solver was **not implemented**.

## System and source audit

One shared component basis was used throughout: **Ca 2+, CO3 2-, Mg 2+, H+, H2O**. Fixed analytical totals are Ca = **0.1**, inorganic carbonate = **0.1**, Mg = **0.001 mol/kg H2O**. pH is imposed through proton activity, water activity is one, temperature is 25 °C, pressure is the existing declared 1 bar, and activities are ideal. These amounts are not molarity.

Mg was chosen after inspecting the database because it has direct carbonate, bicarbonate, hydrolysis and pure-solid reactions without electron/redox closure. Its total is one hundredth of Ca: a small secondary inventory that nevertheless tests competition for shared carbonate and precipitation. This is **one mixed solution**, not the earlier independent Mg/Ca overlay. Every candidate diagnostic solve includes both metals and the same carbonate balance.

The bundled source contains these compatible aqueous products:

- Calcium: **CaCO3(aq), CaHCO3+, CaOH+**; free Ca2+ is a basis component.
- Magnesium: **MgCO3(aq), MgHCO3+, MgOH+, Mg4(OH)4+4**; free Mg2+ is a basis component.
- Carbonate acid–base species: **CO2(aq), H2CO3, HCO3-**; free CO3 2- is a basis component.
- **OH-**, contributing zero Ca, Mg and carbonate.

All eleven compatible aqueous products were used; none was removed to ease convergence. The dissolved sums are:

`D_Ca = m(Ca2+) + m(CaCO3) + m(CaHCO3+) + m(CaOH+)`

`D_Mg = m(Mg2+) + m(MgCO3) + m(MgHCO3+) + m(MgOH+) + 4*m(Mg4(OH)4+4)`

`D_C = m(CO3 2-) + m(CO2) + m(H2CO3) + m(HCO3-) + m(CaCO3) + m(CaHCO3+) + m(MgCO3) + m(MgHCO3+)`.

These are source-component molal inventories. Solid contributions are included separately in full component balances, never in dissolved totals.

The actual calcium carbonate solid records are **CaCO3(cr)** (source comment: **calcite**) and **CaCO3(am)**. No separate aragonite or vaterite record was found. Their stored formation log constants are respectively 8.48 and 6.39; at calcite saturation the amorphous record is undersaturated by 2.09 log units under these source conventions.

All ten compatible pure-solid records were audited:

- CaCO3(cr), CaCO3(am), Ca(OH)2(cr), CaO(cr).
- MgCO3(s), MgCO3·3H2O(s), MgCO3·5H2O(s), Mg(OH)2(cr), Mg(OH)2(am), MgO(cr).

The database also contains CO2(g). This audit is conditional on the declared aqueous-plus-pure-solid problem: no gas reservoir or headspace was specified or modeled. It does **not** establish gas–liquid stability, especially in acidic carbonate-rich states. An open/degassing system would require an explicit additional gas treatment. No gas-equilibrium capability is claimed.

## Sampled regions and availability

The offline audit evaluated pH 0–14 in steps of 0.5. At each pH it considered aqueous-only and each of ten single-solid candidates, always with the complete mixed aqueous system. A converged reduced candidate was then checked against **every** listed solid using the original source mass-action equation. These are explicitly labeled diagnostic candidates, not production results for an omitted-phase system.

| Sampled pH | Audit finding | Production availability |
|---|---|---|
| 0, 0.5, …, 5 | Aqueous state satisfies all listed pure-solid inequalities; no solid amount. | Full candidate-set request still rejected. Diagnostic dissolved totals exist; saturated-solid solubility is unavailable. Gas stability not established. |
| 5.5, 6, …, 9.5 | Calcite-only candidate satisfies all listed solid inequalities; positive calcite amount. | Mathematically admissible reduced candidate, but no full-set production phase-selection support was added. Mg is not solid-saturated and its dissolved total must not be labeled saturation solubility. |
| 10, 10.5, …, 14 | No zero/one-solid candidate satisfies all inequalities; every candidate converges numerically but supersaturates an omitted solid. | Unsupported phase assemblage, not a solver-failure gap and not a fabricated phase boundary. |

Calcite onset is bracketed by sampled pH 5 and 5.5; loss of a feasible one-solid assemblage by pH 9.5 and 10. These are sampling brackets, **not precisely located boundaries**. The audit does not prove behavior between every sampled coordinate.

Selected diagnostic evidence (mol/kg H2O):

| pH | Calcite-only D_Ca | Calcite-only D_Mg | Crystalline Mg(OH)2 log saturation | Interpretation |
|---|---:|---:|---:|---|
| 0 | 0.1 | 0.001 | -19.85000020 | No saturated solid; dissolved totals only |
| 5.5 | 0.04542177696 | 0.001 | -8.872793654 | Calcite present |
| 6.5 | 0.006481995133 | 0.001 | -6.865970308 | Carbonate-speciation transition sample |
| 9.5 | 0.0001746011863 | 0.001 | -0.862488558 | Calcite-only candidate remains admissible |
| 10 | 0.0001198400703 | 0.001 | +0.124233214 | Reject: omitted Mg hydroxide supersaturated |
| 12 | 0.00007652381625 | 0.001 | +3.479048109 | Reject: strong omitted-phase supersaturation |
| 14 | 0.0003099574118 | 0.001 | +5.586610955 | Reject; Ca(OH)2 also supersaturated |

Positive log saturation means supersaturation under the stored formation convention. Values in rejected rows are evidence about an inconsistent reduced assemblage, **not accepted mixed-system equilibrium predictions**. Carbonate speciation, each aqueous coefficient/contribution, all solid saturation indices, source records and balance checks are retained in `mixed-carbonate-audit.json` at full serialization precision.

## Independent validation and coexistence proof

For each reduced candidate, aqueous amounts were independently reconstructed as `10^(b_j + sum_i nu_ji log(a_i))` from original stored reactions. The audit compares these with returned concentrations, reconstructs Ca, Mg and carbonate inventories including the candidate solid, and checks all omitted-solid inequalities. Regression tests use the existing component-balance tolerance contract and a 1e-10 mass-action log check. No tolerance was changed.

For a stronger independent witness, a closed-form calcite–brucite state was derived from the source equations at fixed pH. This helper is a specific offline mathematical check, not a generalized or production multi-solid solver:

- Calcite saturation fixes `a_Ca * a_CO3 = 10^(-b_calcite)`.
- Brucite saturation fixes `log(a_Mg) = -b_brucite - 2*pH`.
- Equal supplied Ca and carbonate totals imply `D_Ca = D_C`, because calcite removes one of each and brucite removes no carbonate.
- CaCO3(aq) and CaHCO3+ cancel in that difference. Write `A = 1 + 10^(b_CaOH+pH)` and `B = 1 + 10^(b_CO2-2pH) + 10^(b_H2CO3-2pH) + 10^(b_HCO3-pH) + 10^(b_MgCO3+log(a_Mg)) + 10^(b_MgHCO3+log(a_Mg)-pH)`.
- Then `a_CO3 = sqrt(10^(-b_calcite)*A/B)`; every aqueous amount follows directly from mass action, without production-solver activities.

At **pH 12**, this gives:

- Dissolved Ca and carbonate: approximately **7.106082562e-5 mol/kg H2O** each.
- Dissolved Mg: **3.316124568e-7 mol/kg H2O**.
- Calcite amount: **0.0999289391744 mol/kg H2O**.
- Crystalline Mg(OH)2 amount: **0.000999668387543 mol/kg H2O**.
- Both active-solid log saturations are zero; every other listed solid has nonpositive log saturation.

Thus two positive solid amounts coexist while satisfying all three component balances and the complete listed solid inequalities. The same checks pass at pH 10.5, 11 and 13.

At **pH 14**, the two-solid formula produces **Ca(OH)2(cr) log saturation +0.287124579**. That witness is explicitly rejected as a complete assemblage. An additional or changed active assemblage is required; a three-solid equilibrium was **not** computed or asserted as validated. Ca(OH)2 was not presumed to control calcium from the earlier hydroxide example.

## Smallest defensible next solver phase — requires review

Add a bounded, validated multi-candidate pure-solid active-set capability for this exact direct Ca–carbonate–Mg basis. For each candidate active subset, solve the existing component balances together with `log saturation = 0` for its active solids; unknowns are free component log activities and active-solid amounts. Require nonnegative solid amounts, the unchanged mass-action/balance tolerances, and nonpositive saturation for **every inactive candidate**. Check rank and reject dependent polymorph constraints rather than accepting arbitrary solutions.

Start validation with the explicit calcite/brucite closed-form witness and one-solid limits. Do not promise pH 0–14 completion with a two-active-solid cap: the pH 14 Ca(OH)2 violation requires evaluating whether a third active solid or another subset is feasible. Preserve separate diagnostics for unsupported subset size, singular/inconsistent constraints, numerical failure, unsaturation and validated phase transitions. Gas scope must remain explicit and separate. No general redox closure, nonideal model or GPL solver port is needed for this proposed bounded phase.

## Checks and exact files changed

**201 tests pass**, preserving all 198 previous tests plus three new capability regressions. All five golden benchmarks remain unchanged and passing; fixture SHA-256 is `aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`. Build and production-boundary audit pass. Lint exits successfully with the pre-existing ExpandedPlot.jsx warning; the existing bundle-size advisory remains. The production bundle content filenames remain unchanged.

New files only:

- `tests/mixedCarbonateAudit.js` — offline shared-basis candidate audit and specific analytical witness.
- `tests/mixedCarbonateCapability.test.js` — three regression tests for typed rejection, mixed-state balances/phase stability and simultaneous-solid evidence.
- `docs/mixed-carbonate-audit.json` — source provenance and numerical audit, explicitly not a production equilibrium result.
- `docs/mixed-carbonate-report.md` — this report.

The build regenerated `dist/` without changing application source. No production code, existing tests, constants, solver tolerances, golden data, UI, independent comparison, numerical export precision or deployment configuration was changed. No new diagram was added that would conceal missing phases. No deployment occurred. Work stops here for review.
