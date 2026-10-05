# Phase 5 numerical benchmark comparison

Unchanged golden SHA-256: `aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`.

All concentration, total, dissolved and solid amounts use mol/kg H₂O. Logs are base 10. Relative difference is unavailable when the reference is zero; absolute comparison still applies. Full arrays, inputs, IDs and residuals are in phase5-benchmarks.json.

## acid-base — PASS

Exact source input:

```text
2, 1, 0, 0
H+
H2O
OH-, -14.0015, -1, 1
1
LA,-7
LA,0
```

Iterations: 0. Maximum absolute balance residual: 0. Maximum absolute mass-action log residual: 0.

| Quantity / identity | Official | Adam’s solver | Absolute difference | Relative difference | Limit | Pass |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| concentrations / H+ | 9.9999999999999943e-8 | 9.9999999999999995e-8 | 5.29395592e-23 | 5.29395592e-16 | 4.00200000e-14 | true |
| concentrations / H2O | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 4.00000000e-14 | true |
| concentrations / OH- | 9.9655208013476494e-8 | 9.9655208013476825e-8 | 3.30872245e-22 | 3.32017013e-15 | 4.00199310e-14 | true |
| logActivities / H+ | -7.0000000000000000 | -7.0000000000000000 | 0.00000000e+0 | 0.00000000e+0 | 1.00000000e-8 | true |
| logActivities / H2O | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |
| logActivities / OH- | -7.0015000000000009 | -7.0015000000000001 | 8.88178420e-16 | 1.26855448e-16 | 1.00000000e-8 | true |
| componentTotals / H+ | 3.4479198652344837e-10 | 3.4479198652317044e-10 | 2.77932686e-22 | 8.06088009e-13 | 4.00000690e-14 | true |
| componentTotals / H2O | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 4.00000000e-14 | true |
| dissolvedComponentAmounts / H+ | 3.4479198652344837e-10 | 3.4479198652317044e-10 | 2.77932686e-22 | 8.06088009e-13 | 4.00000690e-14 | true |
| dissolvedComponentAmounts / H2O | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 4.00000000e-14 | true |
| logActivityCoefficients / H+ | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |
| logActivityCoefficients / H2O | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |
| logActivityCoefficients / OH- | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |

Solids: [].

First solve: 0.919 ms; mean of 100 repeated fixed-input solves: 0.040 ms. These are local observations, not a performance guarantee or sweep implementation.

## complexation — PASS

Exact source input:

```text
2, 1, 0, 0
Ag+
Cl-
AgCl, 3.31, 1, 1
1
T,0.00001
T,0.001
```

Iterations: 6. Maximum absolute balance residual: 4.336808689942018e-19. Maximum absolute mass-action log residual: 0.

| Quantity / identity | Official | Adam’s solver | Absolute difference | Relative difference | Limit | Pass |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| concentrations / Ag+ | 0.0000033024408903414269 | 0.0000033024408877221423 | 2.61928464e-15 | 7.93135965e-10 | 4.06604882e-14 | true |
| concentrations / Cl- | 0.00099330244088244638 | 0.00099330244088772254 | 5.27616145e-15 | 5.31173713e-12 | 2.38660488e-13 | true |
| concentrations / AgCl | 0.0000066975591175543457 | 0.0000066975591122778522 | 5.27649349e-15 | 7.87823354e-10 | 4.13395118e-14 | true |
| logActivities / Ag+ | -5.4811649469846788 | -5.4811649473291340 | 3.44455131e-10 | 6.28434164e-11 | 1.00000000e-8 | true |
| logActivities / Cl- | -3.0029184973174816 | -3.0029184973151750 | 2.30659936e-12 | 7.68119201e-13 | 1.00000000e-8 | true |
| logActivities / AgCl | -5.1740834443021608 | -5.1740834446443085 | 3.42147644e-10 | 6.61271986e-11 | 1.00000000e-8 | true |
| componentTotals / Ag+ | 0.000010000000000000001 | 0.0000099999999999999940 | 6.77626358e-21 | 6.77626358e-16 | 4.20000000e-14 | true |
| componentTotals / Cl- | 0.0010000000000000000 | 0.0010000000000000005 | 4.33680869e-19 | 4.33680869e-16 | 2.40000000e-13 | true |
| dissolvedComponentAmounts / Ag+ | 0.000010000000007895773 | 0.0000099999999999999940 | 7.89577855e-15 | 7.89577855e-10 | 4.20000000e-14 | true |
| dissolvedComponentAmounts / Cl- | 0.0010000000000000007 | 0.0010000000000000005 | 2.16840434e-19 | 2.16840434e-16 | 2.40000000e-13 | true |
| logActivityCoefficients / Ag+ | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |
| logActivityCoefficients / Cl- | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |
| logActivityCoefficients / AgCl | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |

Solids: [].

First solve: 1.121 ms; mean of 100 repeated fixed-input solves: 0.081 ms. These are local observations, not a performance guarantee or sweep implementation.

## precipitation — PASS

Exact source input:

```text
2, 1, 1, 0
Ag+
Cl-
AgCl, 3.31, 1, 1
AgCl(s), 9.75, 1, 1
1
T,0.001
T,0.001
```

Iterations: 3. Maximum absolute balance residual: 0. Maximum absolute mass-action log residual: 0.

| Quantity / identity | Official | Adam’s solver | Absolute difference | Relative difference | Limit | Pass |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| concentrations / Ag+ | 0.000013335214325129987 | 0.000013335214321633268 | 3.49671972e-15 | 2.62216987e-10 | 4.26670429e-14 | true |
| concentrations / Cl- | 0.000013335214318136455 | 0.000013335214321633213 | 3.49675868e-15 | 2.62219909e-10 | 4.26670429e-14 | true |
| concentrations / AgCl | 3.6307805477010047e-7 | 3.6307805477010174e-7 | 1.27054942e-21 | 3.49938368e-15 | 4.00726156e-14 | true |
| concentrations / AgCl(s) | 0.00098630170762009986 | 0.00098630170762359663 | 3.49676885e-15 | 3.54533387e-12 | 2.37260342e-13 | true |
| logActivities / Ag+ | -4.8749999998861195 | -4.8749999999999991 | 1.13879572e-10 | 2.33599123e-11 | 1.00000000e-8 | true |
| logActivities / Cl- | -4.8750000001138813 | -4.8750000000000009 | 1.13880461e-10 | 2.33600945e-11 | 1.00000000e-8 | true |
| logActivities / AgCl | -6.4400000000000004 | -6.4399999999999995 | 8.88178420e-16 | 1.37915904e-16 | 1.00000000e-8 | true |
| logActivities / AgCl(s) | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |
| componentTotals / Ag+ | 0.0010000000000000000 | 0.0010000000000000000 | 0.00000000e+0 | 0.00000000e+0 | 2.40000000e-13 | true |
| componentTotals / Cl- | 0.0010000000000000000 | 0.0010000000000000000 | 0.00000000e+0 | 0.00000000e+0 | 2.40000000e-13 | true |
| dissolvedComponentAmounts / Ag+ | 0.000013698292379900088 | 0.000013698292376403370 | 3.49671802e-15 | 2.55266710e-10 | 4.27396585e-14 | true |
| dissolvedComponentAmounts / Cl- | 0.000013698292372906555 | 0.000013698292376403316 | 3.49676038e-15 | 2.55269802e-10 | 4.27396585e-14 | true |
| logActivityCoefficients / Ag+ | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |
| logActivityCoefficients / Cl- | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |
| logActivityCoefficients / AgCl | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |
| logActivityCoefficients / AgCl(s) | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |

Solids: [{"id":"spana:2ac52a30213c9288:16756","name":"AgCl(s)","amount":0.0009863017076235966,"logSaturation":0,"status":"present","activity":1}].

First solve: 0.699 ms; mean of 100 repeated fixed-input solves: 0.072 ms. These are local observations, not a performance guarantee or sweep implementation.

## redox — PASS

Exact source input:

```text
2, 1, 0, 0
Fe 2+
e-
Fe 3+, -13.051, 1, -1
1
T,0.00001
LA,-13
```

Iterations: 5. Maximum absolute balance residual: 1.6940658945086007e-21. Maximum absolute mass-action log residual: 0.

| Quantity / identity | Official | Adam’s solver | Absolute difference | Relative difference | Limit | Pass |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| concentrations / Fe 2+ | 0.0000052932426862728306 | 0.0000052932426862728111 | 1.94817578e-20 | 3.68049586e-15 | 4.10586485e-14 | true |
| concentrations / e- | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 4.00000000e-14 | true |
| concentrations / Fe 3+ | 0.0000047067573137272100 | 0.0000047067573137271914 | 1.86347248e-20 | 3.95914291e-15 | 4.09413515e-14 | true |
| logActivities / Fe 2+ | -5.2762781938808381 | -5.2762781938808399 | 1.77635684e-15 | 3.36668533e-16 | 1.00000000e-8 | true |
| logActivities / e- | -13.000000000000000 | -13.000000000000000 | 0.00000000e+0 | 0.00000000e+0 | 1.00000000e-8 | true |
| logActivities / Fe 3+ | -5.3272781938808382 | -5.3272781938808400 | 1.77635684e-15 | 3.33445481e-16 | 1.00000000e-8 | true |
| componentTotals / Fe 2+ | 0.000010000000000000001 | 0.000010000000000000003 | 1.69406589e-21 | 1.69406589e-16 | 4.20000000e-14 | true |
| componentTotals / e- | -0.0000047067573137272100 | -0.0000047067573137271914 | 1.86347248e-20 | 3.95914291e-15 | 4.09413515e-14 | true |
| dissolvedComponentAmounts / Fe 2+ | 0.000010000000000000040 | 0.000010000000000000003 | 3.72694497e-20 | 3.72694497e-15 | 4.20000000e-14 | true |
| dissolvedComponentAmounts / e- | -0.0000047067573137272100 | -0.0000047067573137271914 | 1.86347248e-20 | 3.95914291e-15 | 4.09413515e-14 | true |
| logActivityCoefficients / Fe 2+ | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |
| logActivityCoefficients / e- | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |
| logActivityCoefficients / Fe 3+ | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |

Solids: [].

First solve: 0.102 ms; mean of 100 repeated fixed-input solves: 0.034 ms. These are local observations, not a performance guarantee or sweep implementation.

## fixed-activity — PASS

Exact source input:

```text
2, 1, 0, 0
Ag+
Cl-
AgCl, 3.31, 1, 1
1
LA,-6
LA,-3
```

Iterations: 0. Maximum absolute balance residual: 0. Maximum absolute mass-action log residual: 0.

| Quantity / identity | Official | Adam’s solver | Absolute difference | Relative difference | Limit | Pass |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| concentrations / Ag+ | 9.9999999999999868e-7 | 9.9999999999999995e-7 | 1.27054942e-21 | 1.27054942e-15 | 4.02000000e-14 | true |
| concentrations / Cl- | 0.00099999999999999937 | 0.0010000000000000000 | 6.50521303e-19 | 6.50521303e-16 | 2.40000000e-13 | true |
| concentrations / AgCl | 0.0000020417379446695277 | 0.0000020417379446695316 | 3.81164826e-21 | 1.86686459e-15 | 4.04083476e-14 | true |
| logActivities / Ag+ | -6.0000000000000000 | -6.0000000000000000 | 0.00000000e+0 | 0.00000000e+0 | 1.00000000e-8 | true |
| logActivities / Cl- | -3.0000000000000000 | -3.0000000000000000 | 0.00000000e+0 | 0.00000000e+0 | 1.00000000e-8 | true |
| logActivities / AgCl | -5.6899999999999995 | -5.6899999999999995 | 0.00000000e+0 | 0.00000000e+0 | 1.00000000e-8 | true |
| componentTotals / Ag+ | 0.0000030417379446695266 | 0.0000030417379446695317 | 5.08219768e-21 | 1.67082036e-15 | 4.06083476e-14 | true |
| componentTotals / Cl- | 0.0010020417379446689 | 0.0010020417379446695 | 6.50521303e-19 | 6.49195816e-16 | 2.40408348e-13 | true |
| dissolvedComponentAmounts / Ag+ | 0.0000030417379446695266 | 0.0000030417379446695317 | 5.08219768e-21 | 1.67082036e-15 | 4.06083476e-14 | true |
| dissolvedComponentAmounts / Cl- | 0.0010020417379446689 | 0.0010020417379446695 | 6.50521303e-19 | 6.49195816e-16 | 2.40408348e-13 | true |
| logActivityCoefficients / Ag+ | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |
| logActivityCoefficients / Cl- | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |
| logActivityCoefficients / AgCl | 0.0000000000000000 | 0.0000000000000000 | 0.00000000e+0 | n/a (zero) | 1.00000000e-8 | true |

Solids: [].

First solve: 0.130 ms; mean of 100 repeated fixed-input solves: 0.012 ms. These are local observations, not a performance guarantee or sweep implementation.
