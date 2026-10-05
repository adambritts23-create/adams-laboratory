# Exact conservation-inventory transformation — chromium gates passed

The isolated exact-rational prototype passed the single-point, structural-invariance and twelve-dose chromium gates. No production path was changed or promoted. Existing elemental closed redox remains authoritative.

## A. One-zero diagnostic

At the original 10 mL state, the failed floating projection was reproduced. Only the known structural-zero target for the internal CrOH+ basis coordinate was replaced: 1.214306433183765e-17 → 0. Every other reconstructed target was retained unchanged.

| Metric | Difference from existing production |
|---|---:|
| pH | −4.440892098500626e-16 |
| pe | +7.105427357601002e-15 |
| Eh (V) | +4.440892098500626e-16 |
| Maximum absolute carrier difference (mol/kg H2O) | 1.734723475976807e-18 |
| Maximum absolute carrier log10 ratio | 2.844766026332104e-14 |

The one-zero result's charge residual is −6.60665890467623e-18 mol charge equivalents/kg H2O. Full carrier, solid/saturation and component-residual records are in exact-inventory-zero-diagnostic.json. This intervention was a diagnostic only; no magnitude-based zeroing rule was introduced.

## B. Root cause

The previous prototype formed approximate nullspace rows by floating Gaussian elimination, summed physical inventories with those approximate weights, then performed another floating elimination to recover solver-coordinate targets. The combined row/target transformation failed to preserve exact algebraic cancellation. A target that was structurally zero became 1.214306433183765e-17. Restoring only that target recovered pe and trace-carrier parity, demonstrating that the remaining target roundoff was not the source of the observed 2.599-unit pe shift at this point.

The new method takes supplied physical amounts directly into exact conserved totals; it does not reconstruct them from old elemental totals. No solver tolerance, constant, source coefficient or reaction was changed.

## C. Source coefficient representation

The admitted chromium audit contains 31 aqueous source equations and two admitted solid laws: 127 coefficients, all exact safe integers as represented in the imported source. Distinct values are −8, −6, −5, −4, −3, −2, −1, 1, 2, 3, 4 and 8. Electron cancellation and elimination produce rational quotients, which are retained exactly. Source identities are recorded in exact-inventory-coefficient-audit.json.

This does not establish that all MEDUSA coefficients are integers. The bounded prototype refuses noninteger source coefficients pending a separate representation audit; it does not guess a rational from a rounded decimal. Thermodynamic log K values remain floating point and never enter conservation algebra.

## D. Exact method and inventory semantics

A BigInt numerator/denominator representation with GCD reduction is used for electron cancellation, RREF/nullspace construction, rank, row transformations, conserved totals and inventory projection. The material matrix contains ordinary reactions and the complete electron-cancelled half-reaction span. Water weight is exactly zero. Authoritative charge is explicitly included; H+ remains a participating coordinate. Original half reactions and their log K values remain active in the unchanged equilibrium model.

Each supplied amount is decoded as its exact existing IEEE-754 binary value. This deliberately preserves the admitted production input, including its existing molality/volume conversion; it does not reinterpret user decimals or claim that rounded molality inputs are exact decimal rationals. The final projected target is converted once to Number using nearest rounding with ties to even. Structural zero converts to exact +0.

No epsilon cleanup is used. Round-trip checks include the smallest subnormal and largest finite Number. Tiny nonzero inventory projections at Number.MIN_VALUE, 1e-300 and 1e-30 remain nonzero. Neither arbitrary precision nor new equations enter solvePoint.

## E. Exact single-point result

At 10 mL:
- pH = 3.633028194538202
- pe = 9.191787475602922
- Eh = 0.5437801694973959 V vs SHE
- Cr2O3(cr) = 0.002118169947586859 mol/kg H2O
- Cr2O3 log saturation = 1.7763568394002505e-15; Cr(OH)3(cr) absent

All solver targets, carrier concentrations, pH and pe were exactly equal to the existing production run as JavaScript Numbers. The derived space has five coordinates and exact zero null residual. It spans the same conserved space as the independently retained elemental/H−2O/charge rows. Charge and component closure use the existing acceptance limits; full source-coordinate residuals are retained in the evidence.

## F. Structural invariance at 10 mL

Seven variants passed: canonical, conservation-row reversal, alternating row signs, invertible addition of the charge row to other rows, source-reaction reversal, source-species/component ordering reversal, and a redundant duplicate equation. The redundant equation is used only in conservation analysis; it does not add another thermodynamic law to the production solver.

Every variant had zero observed target, pH, pe, carrier and carrier-log-ratio difference from production. These checks vary structural conservation representation while retaining the production activity basis and point solver; they are not a general campaign over all possible activity bases.

## G. Twelve chromium doses

Doses 0, 1, 2, 3, 5, 7, 10, 14, 15, 20, 50 and 100 mL all passed, using the saved independent reference without regeneration.

| Production parity metric | Maximum difference |
|---|---:|
| Solver target | 0 |
| pH | 0 |
| pe / derived Eh | 0 |
| Carrier concentration | 0 |
| Carrier log10 ratio | 0 |
| Exact structural null residual | 0 |

The harness checks every positive saved carrier using both absolute concentration and log-ratio comparisons, plus saved pH/pe, production accepted-solid identities and amounts, saturation, source-coordinate/charge closure and unchanged point-solver scientific acceptance. Local comparison bounds are pH/pe 1e-8, production carrier log ratio 1e-8 and saved-reference carrier log ratio 1e-7 (allowing saved serialization precision); no global tolerance was modified. All production comparisons were exactly zero, comfortably stricter than those gates.

## H. Limits and minimal future integration

This is validation-only. The admitted source graph and baseline preparation still come through the reviewed production path; only conservation construction and physical target transformation deliberately exclude atom vectors. Phase admission, source identity and independent semantic checks remain in the retained path.

A later integration would need to:
1. Put bounded exact structural algebra behind a versioned compiler contract, with source-coefficient admission and arithmetic/resource limits.
2. Feed exact source-derived inventory targets into the existing preparation path while preserving branding, revisions, phase scope and provenance.
3. Adapt solid conservation checks to transported source-coordinate weights, retaining saturation/complementarity acceptance.
4. Keep elemental and H/O semantic inspection separate and explicitly unavailable where metadata is missing.
5. Validate Fe/peroxide, europium and broader source discovery before claiming general closed-redox support.

No production promotion is justified as a trivial edit yet. No Fe/peroxide, Eu, nitrate, copper, UI, browser, production build, full regression, new independent reference or performance campaign was run. No deployment or push.

Closed-redox validation must include pe/Eh, trace carrier ratios/log concentrations and exact structural inventory checks. Absolute concentration differences alone can hide large potential errors.

Evidence: exact-inventory-zero-diagnostic.json, exact-inventory-coefficient-audit.json, exact-inventory-arithmetic.txt, exact-inventory-single.json, exact-inventory-invariance.json, exact-inventory-chromium.json and exact-inventory-summary.json. Prototype scripts are isolated in scripts/validation/. Stop for review.
