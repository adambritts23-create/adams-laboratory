# General reaction-basis implementation review

Recommendation **B — FURTHER REACTION-BASIS FOUNDATION REQUIRED**.

The independent general transformer reproduces all coefficients and log K values
in the previous Fe, Cu, UO2²⁺ and UO2⁺ audit tables exactly. The unchanged HALTAFALL
harness solves the new Adam-generated uranium inputs at all 1,025 points in each
basis, with output exactly equal to the previous official controls. Adam's own
unchanged solver accepts only 836 points per basis. Its existing numerical
underflow rejection prevents the remaining 189 strongly reducing points from
being accepted. This is an additional numerical-domain blocker, not merely missing
uranium oxidation-state metadata. The all-points-converge acceptance requirement
has **not** been met.

## Starting baseline and protected boundary

The actual initial run passed 480/480 tests, zero failures/cancellations/skips/todo,
in 322,377.1128 ms. All five official golden controls, exact Fe/Cu regressions,
build and artifact audit passed. Lint had zero errors and the existing
`ExpandedPlot.jsx` effect-cleanup warning. The previous audit's 332 production
files matched their hashes before implementation.

The solver, thermodynamic asset, water constants, existing oxidation allocations,
accepted numerical evidence and public support labels remain unchanged. Before
and after hashes are recorded in `general-reaction-basis-preservation.json`.
There was no deployment, remote push, public uranium enablement, or unrelated UI
change. No GPL code was imported or copied into production. The reference Java
library and its existing harness remain isolated in `.local/hydra-basis-audit`.
Production modules have no dependency on that directory or on audit documents.

## Architecture

`reactionBasis.js` implements independent rectangular elimination of reaction
equations. Each source row means:

`productCoefficient × log a(product) = log K + Σ coefficient × log a(component)`.

The caller provides ordered selected basis IDs and dependent component IDs.
Dependent columns are ordered by exact ID; source equations are ordered by exact
source ID. Deterministic magnitude pivoting resolves the dependent coordinates.
Log K and source-reaction multiplier columns undergo the same operations as
stoichiometric columns. Every redundant bridge equation is checked after
elimination, including inverse relations and reactions forming a selected basis
component. Rank deficiency, unknown identities, contradictory cycles and invalid
coefficients are typed failures. There is no source-order last-record override,
averaging, coefficient rationalization or formula parser in this engine.

`sourceReactionBasis.js` joins exact identities already established by the
importer and verifies the unchanged imported source reaction. It discovers
dependent reservoir chemistry, including peroxide, through source reactions.
All original temperature models, source constants, reaction IDs and citations
remain available. This is an independently written adapter, not a port of the
legacy database-search implementation.

`prepareReactionBasis.js` checks imported charge bookkeeping, nonnegative
analytical inventory coefficients and consistent duplicate product
representations. It prepares the existing numerical system boundary. Unsupported
gas products are explicitly omitted from Adam's aqueous/pure-solid calculation;
they are retained in the algebra and in the separate full HALTAFALL input.
They have zero uranium inventory in this control.

Generic source discovery now runs this algebraic preparation before oxidation
metadata gating. For already supported chemistry, it compares every product's
new coefficients and log K exactly against the existing canonical representation.
Only on exact agreement does it retain that representation's serialization and
system identity. Thus existing reference hashes remain meaningful; the legacy
representation is not a fallback around an algebra failure. General expressions
are attached separately to preparation, outside the retained system identity.
The older bounded compiler remains available to its existing internal callers.

## Versioned expression contract

Version: `reaction-basis-v1`. Each expression records:

- Product identity, selected basis IDs, signed coefficient vector and log K.
- Eliminated component IDs and original source-reaction IDs with multipliers.
- Original product coefficient, original terms, original log K and provenance.
- Source reaction unit, normalization factor and retained source comment.
- Source precision and separate arithmetic/source bookkeeping allowances.
- Phase and available charge/inventory/element checks.
- Temperature-model linear combination and constituent validity domains.

Temperature models are retained as a linear combination with their exact
multipliers. Non-reference-temperature evaluation is not implemented. Unknown
pressure or validity metadata stays unknown; an intersection descriptor does not
claim a new validated temperature/pressure range. Production preparation remains
the existing ideal 25 °C, declared 1 bar domain.

## Fractional source units and precision

Finite signed coefficients are preserved as stored binary64 values. Scaling a
reaction changes its product coefficient, reactant coefficients and log K
together; reversal is scaling by −1. Normalization divides the entire equation
by the product coefficient. Provenance records that operation.

Source reaction units are explicitly distinguished from display formulas.
For the audited U3O8 and U4O9 rows, one source unit carries one analytical uranium
unit. No factor of three or four is inferred from the displayed name. The
unmodified source comments remain attached. This algebra does not supply a
uranium oxidation-state allocation.

The importer does not provide uncertainty scalars, so production source-cycle
checks currently permit arithmetic roundoff only. Stored `0.6667` is never
changed to `2/3`. The engine also accepts explicit, provenance-supported absolute
source-error bounds; it does not infer such bounds from a displayed number of
digits. Its arithmetic allowance is `128 × Number.EPSILON × operation scale`,
separate from solver tolerances. Duplicate transformed product comparisons use
the existing bounded compiler's 1e−10 log K arithmetic allowance and 1e−12
coefficient comparison; no constants are averaged.

An independent normalized-oxide composition control quantifies four-decimal
rounding: hydrogen residual approximately 0.0001 and oxygen residual
approximately 0.0000333333 per source unit. An explicitly supplied hydrogen bound
of `0.5e−4 + 2 × 0.5e−4 = 1.5e−4` accepts that source-precision residue. Removing
the declared allowance rejects it. This test does not create a production
composition registry: the imported products generally lack independent elemental
composition, and that check remains explicitly `metadata-unavailable`. Charge
checks use the existing imported charge convention and all prepared uranium
products pass without a source-precision exception.

## Numerical evidence

| Control | Result |
|---|---|
| Fe reaction table | All coefficients and log K exactly unchanged |
| Cu reaction table | All coefficients and log K exactly unchanged |
| UO2²⁺ table | All 34 audited rows exactly reproduced |
| UO2⁺ table | All 34 audited rows exactly reproduced |
| New Adam inputs through HALTAFALL | 1,025/1,025 per basis; flags 0; exact prior output |
| Adam accepted uranium points | 836/1,025 in each basis |
| Adam unsupported uranium points | 189/1,025 in each basis |
| Accepted carrier-label disagreements | 0 against reference; 0 between bases |
| Accepted solid-assemblage disagreements | 0 against reference |
| Maximum accepted UO2²⁺ reference amount difference | 1.105565868074563e−14 mol/kg H2O |
| Maximum accepted UO2⁺ reference amount difference | 1.1870858435776219e−14 mol/kg H2O |
| Maximum accepted cross-basis amount difference | 1.395910297075087e−18 mol/kg H2O |
| Explicit/implicit ideal-water difference, accepted points | 0 |

The existing 4e−14 absolute concentration comparison criterion was retained.
No failed point was included in accepted counts or given a carrier label.
The original HALTAFALL topology is unchanged. In Adam, 189 of the 244 reference
UH3-region points fail; only 55 are accepted. Other carrier counts agree.

Reference comparisons use identical pe, with the previous harness's documented
Eh conversion factor 0.05915934523391366 V. Adam's physical constants remain
unchanged. The difference between that factor and Adam's conversion must not be
misrepresented as a reaction-basis discrepancy.

Water coefficients remain present throughout the algebra. The comparison applies
`log a(H2O)=0` afterward. Because the existing fixed-redox interface requires an
explicit solvent slot, the implicit control retains that slot but zeros the water
column only after transformation. It does not delete water during source algebra.
Equivalence is established for the accepted points; both representations retain
the same unsupported points.

Fe keeps system ID
`8ead3d660c3c240620da3c69fa3a4b55810695c1dce8216e166f9579043386a1`,
counts 422/581/1473/89, exact fractions and the original phase scope.
Cu keeps system ID
`fa745a9d951a38cac972a421932facd4634655ad14203aec20dd7feb9ed47a05`,
counts 1179/156/1230 and exact fractions. The selected-total/ranges workflow,
suppression disclosure and stale-result gates pass focused regressions.
Fe0.932O remains explicitly outside the accepted reference phase scope.

## Remaining blocker and recommendation

At pH 0, Eh −2 V, every assemblage attempt and its initialization retry reports
underflow. The existing `point.js` rejects a concentration for which `10 ** log`
becomes zero. Existing hardening tests explicitly require that rejection.
This is an intentional unsupported numerical range, not a demonstrated defect
authorizing an unplanned solver rewrite. `general-reaction-basis-underflow-control.json`
retains the complete representative diagnostic.

Generic discovery can now algebraically construct the audited uranium system.
It cannot claim a fully supported uranium equilibrium grid. Public uranium needs
both a separately reviewed numerical-domain solution and authoritative
oxidation-state/support metadata, including mixed valence. The phase therefore
stops for review with recommendation **B**, not recommendation A.

## Files and reproduction

Added production modules: `src/thermodynamics/reactionBasis.js`,
`src/thermodynamics/sourceReactionBasis.js`,
`src/thermodynamics/prepareReactionBasis.js`.
Modified production module: `src/analysis/redoxDiscovery.js`.

Added tests: `tests/reactionBasis.test.js`, `tests/generalBasisEquilibrium.test.js`.
Updated `tests/userPourbaix.test.js` to expect resolved uranium algebra while
preserving the public metadata rejection. Added independent validation runner
`scripts/validation/generalBasisAudit.js`.

Evidence: this report, `general-reaction-basis-tables.md`,
`general-reaction-basis-validation.json`, `general-reaction-basis-samples.json.gz`,
`general-reaction-basis-preservation.json`,
`general-reaction-basis-underflow-control.json`, and the two copied, compressed
unchanged `reaction-basis-UVI/UV-haltafall-reference.ndjson.gz` fixtures.
Final command results are recorded in `general-reaction-basis-checks.json`.
The final complete suite passed **491/491 tests** in 336,396.0827 ms, with zero
failures/cancellations/skips/todo. All five goldens, build and artifact audit
passed; lint reported zero errors and the same one pre-existing warning.
All 549 pre-existing files outside the two intentional modifications matched
their starting hashes. The passing regression suite does not assert full uranium
support: the separate all-points-converge scientific acceptance remains false.
Scratch scripts, raw new HALTAFALL output and command logs are isolated under
`.local/reaction-basis-phase`.

Run the normal complete suite with `--experimental-test-isolation=none` on this
host (process-isolated Node tests encounter an environmental spawn EPERM).
The numerical audit can be reproduced by importing and invoking
`uraniumBasisAudit()` from the validation runner. The existing unchanged
`UraniumControl` Java harness reads the generated `UVI-adam.dat` and `UV-adam.dat`.
