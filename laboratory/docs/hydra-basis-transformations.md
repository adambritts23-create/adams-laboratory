# Uranium reaction transformation comparison

Signed formation convention: coefficients on the left may be negative; log K belongs to exactly the stored reaction unit. Source snapshot SHA256: 2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a. Water coefficients remain explicit here.

| Source reaction (byte identity; log K) | Java DBSearch result in H+ / e− / UO2²+ / H2O | Independent reconstruction |
|---|---|---|
| 4 H+ + 2 e- + -2 H2O + 1 UO2 2+ → U 4+; **9.038**; byte 346284 | 4 H+ + 2 e- + 1 UO2 2+ + -2 H2O → U 4+; **9.038** | Identical coefficients and log K. Source multipliers: 1 × byte 346284 |
| 1 U 4+ + 1 e- → U 3+; **-9.353**; byte 346107 | 4 H+ + 3 e- + 1 UO2 2+ + -2 H2O → U 3+; **-0.315** | Identical coefficients and log K. Source multipliers: 1 × byte 346107 + 1 × byte 346284 |
| 1 e- + 1 UO2 2+ → UO2+; **1.484**; byte 354522 | 1 e- + 1 UO2 2+ → UO2+; **1.484** | Identical coefficients and log K. Source multipliers: 1 × byte 354522 |
| 1 U 4+ + -4 H+ + 2 H2O → UO2(cr); **4.85**; byte 351365 | 2 e- + 1 UO2 2+ → UO2(cr); **13.888** | Identical coefficients and log K. Source multipliers: 1 × byte 351365 + 1 × byte 346284 |
| 1 U 4+ + -4.6667 H+ + -0.6667 e- + 2.3333 H2O → U3O7(cr); **-0.633**; byte 348584 | -0.6667 H+ + 1.3333 e- + 1 UO2 2+ + 0.3333 H2O → U3O7(cr); **8.405** | Identical coefficients and log K. Source multipliers: 1 × byte 348584 + 1 × byte 346284 |
| 1 U 4+ + -5.3333 H+ + -1.3333 e- + 2.6667 H2O → U3O8(cr); **-6.85**; byte 348696 | -1.3333 H+ + 0.6667 e- + 1 UO2 2+ + 0.6667 H2O → U3O8(cr); **2.188** | Identical coefficients and log K. Source multipliers: 1 × byte 348696 + 1 × byte 346284 |
| 1 U 4+ + -4.5 H+ + -0.5 e- + 2.25 H2O → U4O9(cr); **0.999**; byte 349004 | -0.5 H+ + 1.5 e- + 1 UO2 2+ + 0.25 H2O → U4O9(cr); **10.037** | Identical coefficients and log K. Source multipliers: 1 × byte 349004 + 1 × byte 346284 |
| 1 U 4+ + 3 H+ + 7 e- → UH3(cr); **-80.1**; byte 350096 | 7 H+ + 9 e- + 1 UO2 2+ + -2 H2O → UH3(cr); **-71.062** | Identical coefficients and log K. Source multipliers: 1 × byte 350096 + 1 × byte 346284 |
| 1 UO2 2+ + -1 H+ + 1 H2O → UO2OH+; **-5.25**; byte 357296 | -1 H+ + 1 UO2 2+ + 1 H2O → UO2OH+; **-5.25** | Identical coefficients and log K. Source multipliers: 1 × byte 357296 |
| 1 UO2 2+ + -2 H+ + 3 H2O → UO3·2H2O(cr); **-4.81**; byte 358594 | -2 H+ + 1 UO2 2+ + 3 H2O → UO3·2H2O(cr); **-4.81** | Identical coefficients and log K. Source multipliers: 1 × byte 358594 |

The selected UO2²+ component is an identity row, not an additional dependent species with a formation constant. The source inverse relation at byte 350349 (UV − e− → UVI, log K −1.484), combined with byte 354522 (UVI + e− → UV, log K +1.484), reduces to that identity with log K 0.

U3O7 and U3O8 rows use one U atom and finite four-decimal coefficients. U4O9 likewise uses one U atom, with quarter-formula stoichiometry. Neither DBSearch nor this reconstruction silently multiplies those rows to full-formula units.

Full coefficients, provenance, source multipliers, both U bases and Fe/Cu controls: [hydra-basis-controls.json](hydra-basis-controls.json).
