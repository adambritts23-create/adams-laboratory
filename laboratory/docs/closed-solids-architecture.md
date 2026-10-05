# Closed physical equilibrium with solids: pre-implementation audit

The accepted starting evidence is the network compiler's 651/651 regression report. This phase has not rerun that suite. `closed-solids-before.json` records the current source/test/data hashes before edits.

## Existing machinery

`solver/point.js` already solves aqueous activities and active solid amounts together. Solid amounts enter every total balance through the prepared signed stoichiometric matrix. Its inner convergence limits are 2e-13 scaled balance and 1e-12 log saturation. Negative amounts are refused without a negativity allowance. Positive active phases must be saturated; inactive phases may not be supersaturated. Present, saturated-zero-amount and absent are distinct. The outer validation contract's 1e-8 saturation comparison is not an excuse to weaken the inner solver.

`solver/assemblages.js` enumerates independent subsets for the existing bounded multi-solid policy, with 12 candidates and 1,024 subsets. That policy is used by ordinary precipitation and fixed-electron Pourbaix preparation. It must remain unchanged for existing consumers. It does not meet this phase's prohibition on arbitrary subset enumeration for a new closed path.

`solver/models.js` pins prepared source identity and accepts aqueous products and pure-solid products. There are at most 16 basis components and 128 products; the closed compiler separately allows 64 source species/reactions. These limits are not to be enlarged. An opt-in deterministic phase-selection policy can reuse the point solver's Newton equations and scientific acceptance checks, while bounding phase changes, detecting revisited sets and retaining phase-change history.

`thermodynamics/generalClosedReagents.js` discovers source equations forward and through resolvable inverse component connections. It already retains reachable solids/gases as excluded source laws and checks their hypothetical saturation/fugacity after the aqueous solve. `closedRedoxNetwork.js` currently admits aqueous physical carriers only. `closedRedox.js` also validates all ordinary/half reactions as equalities: an absent solid must never be inserted into those unconditional equality checks. Source solid laws can instead be transformed using the already established aqueous basis (including its eliminated-electron expression), with separate complementarity checks and extended physical conservation weights.

`calculations/solubility.js` requires a relevant saturated pure solid, an accepted branded point and a nonnegative ordinary-component inventory. A signed physical basis is not automatically a valid solubility/fraction denominator. Do not bypass its refusal or invent another log-solubility definition.

`beaker/acceptedState.js` reads the exact branded numerical result; eligibility is not presence. `beaker/visual.js` requires positive component-weighted inventory above both its balance tolerance and one millionth of the analytical total (or the existing 1e-12 fallback). Drawing height is schematic. Total fractions and aqueous speciation need the existing valid conserved-component projection; physical element totals must not be confused with signed transformed coordinates.

## Targeted source audit

The exact supplied Fe/chromate recipe reproduces the previous withheld aqueous result: Fe2O3(cr) log saturation 0.9737725173551786 and FeOOH(cr) 0.26638625867758925. Twenty-three solid source records are reachable, including Cr solids, Fe solids, mixed Fe/Cr solids and K phases. Therefore admitting all candidates would exceed the established 12-solid bound and the closed source-species bound. A reviewed bounded subset must disclose exclusions and recheck every excluded source law at the final state. No candidate may be selected merely to obtain convergence.

Fe0.932O(cr) has fractional source coefficients. FeOHCrO4(cr)'s retained source equation transports negative hydrogen inventory without solvent compensation. Such records cannot be admitted by guessing their displayed formulas or silently repairing source constants/equations. Their source laws remain visible in the exclusion audit.

## Future interfaces (not implemented here)

Pourbaix uses imposed electron activity; this compiler derives potential from a closed preparation. Phase identity/status can be shared, but reservoir boundaries and signed-basis inventory adapters need explicit reconciliation before unification.

Wet Lab must eventually convert physical reagent inventories at volume V into one simultaneous aqueous+solid equilibrium and then project its accepted state into apparatus/analytical views. Multiple supplied acid/base families and other compatible reagents must coexist in the sample. Do not implement sequential hand-coded neutralizations or assume distinct pKa values yield visibly separate endpoints. No Wet Lab, gas/headspace, kinetic or metastable extension belongs to this phase.
