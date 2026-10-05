# Bounded pure-solid active-set design

Prepared systems explicitly opt into `bounded-multisolid-v1`; legacy preparation remains unchanged and retains its rejection of multiple candidates. The new policy is non-redox only. No GPL source is used. Existing aqueous mass action, units, fixed conditions and numerical tolerances remain intact.

Candidate bounds: at most 12 pure solids, at most 1024 enumerated subsets. Canonical solid ordering makes phase selection independent of caller order. Active subsets cannot exceed the rank of candidate solid coefficient rows restricted to total-constrained components (and hence cannot exceed the number of unknown free activities). Dependent subsets receive explicit rank diagnostics; exceeding the search budget fails closed.

Each subset uses the existing scaled Newton equations, extended with one independent scaled amount per active solid and one saturation equation per active solid. Inactive amounts are zero. Acceptance checks all component balances, aqueous mass action, nonnegative solid amounts, active saturation equalities and every inactive saturation inequality. The existing 2e-13 iteration, 1e-12 saturation, balance contract and linear 1e-14 conditioning gate are not loosened.

Enumerate all bounded subsets for multi-candidate requests. Canonical ordering is not an equilibrium selection criterion: different positive phase supports or materially different accepted states produce an explicit ambiguity failure. Equivalent zero-amount boundary representations may collapse to the smallest subset; no amount is clipped or fabricated. Saturated fixed-activity phases whose amounts cannot be determined fail closed.

Validation order: original aqueous/one-solid tests and five golden fixtures, independent synthetic two-solid equations, audited pH12 closed form, independent pH14 phase analysis, then full mixed pH sweep. Diagnostics retain candidates, subsets, convergence/rejection reasons, per-solid saturation/amounts and balances. Existing result/trace/export shapes remain compatible with multiple solid entries. Production UI and specialized solubility output are not automatically broadened by the numerical capability.
