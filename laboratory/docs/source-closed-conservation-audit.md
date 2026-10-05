# Source-derived closed conservation: pre-edit mathematical audit

Production source is unchanged at this checkpoint. This experiment receives an already admitted source network; reviewed metadata remains the independent reference and admission path until parity is proven.

The current reaction convention is N[s,r] = productCoefficient * 1(product=s) - sum(reactant coefficients for s). Mass action is N[:,r]^T log(a) = log K_r. The formal electron row is present in half reactions, but the physical closed system has no supplied electron inventory. The existing compiler eliminates that row using integer pairwise half-reaction cancellations and retains ordinary reactions. The experiment uses the same admitted cancellation span, not a new reaction set or changed constants.

For the resulting electron-free physical reaction matrix M, conserved weights satisfy L M = 0. Unit-activity solvent water is a reservoir coordinate, so additionally L[:,water] = 0. Physical H+ remains among participating species; it is not independently fixed or separately conserved. Authoritative charge is one explicit conserved row. Remaining independent rows are anonymous source coordinates. Completeness requires their dimension to equal the physical activity basis dimension minus its solvent coordinate, and rank on that basis must be full. Reaction free coordinates alone are not used as physical inventories.

Current atom dependencies:
- closedRedoxNetwork validates species and source equations against elemental composition, then constructs non-H/O elemental rows, H−2O and charge. It checks rank and transformed inventory closure. Basis transformation and electron cancellation themselves use source coefficients.
- prepareClosedRedox computes analytical solver targets directly from supplied amounts times transformed source coefficients. Those targets do not use atoms. Its extra inventories and some identity-collision checks do.
- prepareClosedSolidExtension currently reads elemental solid weights; the experiment will instead transport each source conservation row through the solid's transformed source coefficients. Positive solids still come from the same coupled solver and complementarity policy.
- solveClosedRedox uses atom rows for additional inventory checks and H/O exchange diagnostics. pe comes from the retained half-reaction equations; charge comes from official charge. Neither requires oxidation-state labels.
- generalClosedReagents/closedPureSolids currently use atom metadata during discovery/transport and semantic source validation. They remain untouched during the initial experiment.
- closedReagents and Wet Lab use atoms for elemental totals, oxidation-state interpretation and water/reaction inspection. Those labels must remain separate from anonymous conservation coordinates.

The experiment independently reconstructs balance targets from source-derived conserved totals, invokes the existing solvePoint implementation with the existing phase policy, and compares to retained accepted results and saved independent references. No atom vector is passed to the conservation derivation. Reviewed elemental row spans are compared afterwards only.

Order: one Cr point, all twelve saved Cr doses, basis-invariance tests, Fe/peroxide, Eu; nitrate and copper only after those pass. Stop at a failed chromium parity or basis-invariance check. No full suite, browser campaign or regenerated independent reference.
