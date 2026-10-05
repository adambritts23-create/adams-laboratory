# Acetate / acetic acid: composition sweep and physical titration

## Result

Both workflows use the imported source reactions and the unchanged equilibrium solver. Calculation exposes a signed analytical H+ equivalent axis without requiring Na/K. Wet Lab adds a reviewed acetic-acid stock and uses the existing volumetric mixing, titration, analytical-view and transient-preview machinery.

No solver, thermodynamic data, redox, phase equilibrium, gas, indicator, tolerance or fraction formula was changed. No deployment or push.

## Source audit

The authoritative basis is `component:CH3COO-`, not permanently conserved molecular acid. The bundled source contains 149 acetate-bearing product records: 146 aqueous, two solids and one gas. The full records, source references and scope decisions are retained in `acetate-evidence.json`. The database SHA256 is `2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a`.

The audit was performed before production edits. Source-bound pins in `acetateSource.js` invalidate the reviewed Wet Lab scope if records change. Production constants and coefficients are read from these records, not copied from a textbook.

Source ID prefix below: `spana:2ac52a30213c9288:`. Formation convention: product = stated component combination.

| Suffix | Carrier | Source component combination | log K |
|---|---|---|---:|
| 79298 | CH3COOH(aq) | H+ + CH3COO- | 4.757 |
| 250448 | OH-(aq) | H2O - H+ | -14.0015 |
| 220132 | Na(CH3COO)(aq) | Na+ + CH3COO- | -0.12 |
| 224689 | NaOH(aq) | Na+ + H2O - H+ | -14.4 |
| 159033 | HCl(aq) | H+ + Cl- | -0.7 |
| 223384 | NaCl(aq) | Na+ + Cl- | -0.76 |

CH3COOH retains its Smith/Martell, NIST SRD46 source reference. Component provenance is the imported Reactions.elb acetate identity; product provenance is the retained Reactions.db record. HCl and NaCl are only admitted in the new acetate scope when chloride is actually supplied. They do not enter the requested acetate/NaOH benchmark. Other aqueous acetate complexes require additional source components and are outside the reviewed physical recipes.

Excluded non-aqueous records: CH3COOH(g), suffix 79376, log K 1.02; Ag(CH3COO)(s), suffix 11755, log K 2.71; Hg2(CH3COO)2(s), suffix 165686, log K 9.49. The solids additionally require Ag+ or Hg2 2+. No non-aqueous chemistry was added.

## Independent reference

`scripts/validation/acetateReference.js` has no production solver or preparation imports. It solves two nested scalar balances by bisection across the whole titration, without changing equations at equivalence.

For free h=[H+], a=[acetate], n=[Na+], retained source formation factors b, k, kn and Kw:

- [HA] = b h a
- [NaA] = k n a
- [NaOH] = kn n / h
- [OH-] = Kw / h
- Cacetate = a + [HA] + [NaA]
- CNa = n + [NaA] + [NaOH]
- BH = h - [OH-] + [HA] - [NaOH]

The reference solves the sodium/acetate balance for each trial h, then the signed proton balance. No production concentrations or pH values seed it. Tests compare all seven admitted carrier amounts, not just pH, and independently check physical charge and component closure.

## Calculation workflow

Select C, then CH3COO- in System; retain H+ and water. Na/K are unnecessary. In Calculation choose Log concentrations and X variable **Analytical H+ equivalent · signed linear scale**. Set -1 to +1 and acetate total 0.5. The explanatory text distinguishes positive acid and negative base equivalents from equilibrium free [H+].

All 81 independently tested samples are accepted. Negative proton equivalents produce positive free H+ and high OH-, with acetate predominating. Positive equivalents protonate acetate; the acid/base transition and water behavior follow the source equations. Both acetate fractions and aqueous speciation reuse the accepted sweep. Signed proton inventory is not used as a fraction denominator. Log solubility remains unavailable for this aqueous-only system.

The native Calculation concentration coordinate is mol/kg H2O. The MEDUSA image uses mol/L: this implementation deliberately does not mislabel native quantities or invent an unsupported molarity conversion. The numerical 0.5, -1 to +1 comparison is source-equivalent in component structure and ideal mass-action behavior, not an independent cross-program or pixel-identical reference.

## Physical benchmark

Sample: 50.00 mL, 0.1000 mol/L CH3COOH. Burette: 100.00 mL, 0.1000 mol/L NaOH. Conditions: ideal, 25 C, existing additive-volume `dilute-ideal-aqueous-volume-v0` convention (1 model kg water per litre solution; not measured solvent mass or density).

Acid supplies 0.005 mol acetate plus 0.005 mol proton equivalent with no counterion. Delivered NaOH supplies nonnegative Na moles and negative proton equivalents. Water, acid protonation, sodium acetate and aqueous NaOH association equilibrate simultaneously. Molecular CH3COOH is not conserved.

| NaOH delivered / mL | Calculated pH |
|---:|---:|
| 0 | 2.881372439952 |
| 10 | 4.151843342883 |
| 25 | 4.746879866108 |
| 40 | 5.345327989497 |
| 45 | 5.696600823329 |
| 49 | 6.431888968188 |
| 49.9 | 7.438456135362 |
| 49.99 | 8.351212782131 |
| 50 | 8.716842813868 |
| 50.01 | 9.082396407169 |
| 50.1 | 9.993981392045 |
| 51 | 10.988820844371 |
| 55 | 11.670602067650 |
| 75 | 12.292604881408 |
| 100 | 12.513366964919 |

All 15 requested points are accepted. Maximum absolute pH difference against the independent reference: **1.616484723854228e-13**. Exact concentrations, residuals and reference results are in `acetate-evidence.json`; regenerate with `node scripts/validation/runAcetateEvidence.js`.

Initial acid partially dissociates. At 25 mL, the acetate inventory is approximately 49.973% CH3COOH, 48.822% free acetate and 1.2048% sodium acetate. Thus half inventory equivalence is close to, but not exactly, pH=pKa=4.757. Sodium association is included rather than silently suppressed. At 50 mL pH emerges as 8.71684 from hydrolysis and source equilibria; it is not forced to 7. Excess base controls the later region while those same equations remain satisfied.

## Cross-workflow consistency and preservation

For every requested physical dose, a separate ordinary Calculation point was prepared with the same analytical acetate, sodium and signed proton totals in the equivalent numerical model coordinate. All carrier amounts agree within 1e-10 mol/kg model water. At zero supplied Na its component and carriers are absent; no trace Na is fabricated. These are equivalent states, not equivalent experimental X axes.

The historical restricted HCl/NaOH source scope is intentionally unchanged: OH-/H+/water plus free spectators, without the new association reactions. Its original version/source identity and physical convention object remain intact. The old `volumeConvention.scope` string describes that historical benchmark; the new prepared-system source identity and each acetate state's scientificStatus explicitly identify the acetate scope. An acetate experiment must not inherit the historical no-ion-pairing validation claim.

## Browser and interaction checks

Local browser checks completed before the full regression:

- C + acetate + H+/water, without Na/K: 51/51 default UI samples accepted across -1 to +1, acetate 0.5.
- Actual H+, OH-, acetate and acetic-acid curves and signed analytical axis label visible.
- Switching Calculation to Total fractions and Aqueous speciation explicitly reported reuse without recalculation.
- Added Na for the physical titrant; selected acetic acid in the existing Sample dropdown and prepared the 50/100 mL experiment.
- All four Wet Lab views available; source sodium acetate and NaOH appear in log concentration inspection.
- Browser transient preview showed a different accepted dose while committed 10 mL remained unchanged; pointer leave restored 10 mL, 90 mL burette, 60 mL beaker. Clicking 25 mL committed 25 mL, 75 mL burette/beaker and pH 4.74688.
- Exact 10-to-25 preview, restoration and identity are additionally tested programmatically, along with all analytical views and unchanged solve count.

## Validation artifacts

- `acetate-before.json`: pre-edit file hashes.
- `acetate-preservation.json`: comparison against that snapshot.
- `acetate-focused.txt`: 55/55 affected tests pass.
- `acetate-regression.txt`: single full regression run (completion recorded below).
- `acetate-evidence.json`: complete source audit and independent numerical comparison.
- `acetate-build.txt`, `acetate-artifact.txt`, `acetate-lint.txt`: final production checks.

Validation is internal source-law and cross-workflow evidence under the stated ideal volume convention. It is not an experimental accuracy claim, an independent MEDUSA run, or a validated nonideal/density conversion.

## Final checks

Completed 2026-09-16:

- Full regression, run once: **641/641 passed**, zero failures/cancellations/skips/todo; 541.793 seconds.
- Existing golden and reference regression checks passed.
- Production `dist` build passed (existing large-chunk advisory).
- Production artifact/import-boundary audit passed.
- Lint: zero errors; one existing `ExpandedPlot.jsx` effect-cleanup warning.
- Snapshot comparison: 417 pre-existing files checked; solver, thermodynamic data and reference/golden artifacts unchanged. The ten changed pre-existing files are listed in `acetate-preservation.json`; new production metadata, focused tests and independent evidence scripts are separate.

Ready for review. Nothing deployed or pushed.
