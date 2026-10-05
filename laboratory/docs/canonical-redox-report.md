# Canonical redox basis — bounded architecture and validation report

Date: 2026-09-10. Local project only. **Pourbaix remains validation pending.** No public support gate, classification, rendering, deployment or remote push was added.

## 1. Verified baseline

Before scientific edits, the actual current suite passed **408/408**, with no failed, cancelled, skipped or todo tests (188734.6266 ms). All five existing official golden comparisons passed: acid-base, complexation, precipitation, redox and fixed-activity. The baseline build passed using the established `--configLoader native` option. Lint had zero errors and the existing ExpandedPlot ref-cleanup warning. Logs: `.local/canonical-baseline.txt`, `canonical-baseline-build.txt`, `canonical-baseline-lint.txt`.

## 2. Audit and insertion point

Traced imported `effectiveSourceReaction`, legacy effective proton restoration, exact source component names, source formation direction, direct compatibility/discovery, prepareSession, prepareChemicalSystem, fixed-electron-v1, solveFixedRedox, assemblage guards, grid orchestration, Mn offline compiler, redoxFoundation tests and the official redox fixture.

The narrow insertion point is a new **explicit internal preparation sibling**, `prepareCanonicalRedoxSession(session, repository, options)`. It compiles a derived direct basis, then calls the existing branded `prepareChemicalSystem` with fixed-electron-v1 and bounded-multisolid-v1. Neither ordinary prepareSession nor Newton, point, redox, grid or compatibility code changed. It is not imported by the public UI and does not automatically activate for an edited system.

## 3. Data and conserved-inventory model

The compiler receives exact source component IDs/names/roles/charges and source reaction IDs, signed terms, logBeta, phase, charge and provenance. The repository adapter accepts supported imported 298.15 K formation records only, verifies the original species identity and constant, compares effective terms against the preserved raw source reaction, and retains source provenance including offsets.

A supported family is connected by **unit ordinary-component exchanges involving only electron activity**. A bridge has one ordinary reactant with coefficient +1, one ordinary aqueous product and a nonzero signed electron coefficient. Source charge must balance. This source reaction structure, not similar names, element associations or guessed formulas, establishes one unit of conserved source moiety across the family. Proton-coupled product reactions are supported; proton/water-coupled bridges between independent basis species are outside this first bounded model.

There is exactly one canonical ordinary inventory in this phase. The result records all family source IDs and unit weights. `canonicalRedoxTotals` requires the caller to acknowledge every connected family member and supply **one** positive analytical total. Existing independent oxidation-state totals are never silently added, overwritten or interpreted as an exchanging total. The session is unchanged.

## 4. Deterministic basis rule

Choose the lexically smallest exact **source component ID** in the connected family. This is an arbitrary but reproducible coordinate choice whose physical validity comes from reversible validated connectivity and rank, not from oxidation-state ordering. It is independent of UI selection order, source row order and equivalent bridge direction. Current roots are Fe 2+, Cu 2+ and Mn 2+. No production metal-specific branch or table exists.

Directed edges include both the original formation bridge and its algebraic inverse. A sorted traversal assigns each state a representation `log(a_state) = log(a_root) + k_state + e_state log(a_e)`. Dependent state products are synthesized from signed bridge paths with stable component-derived IDs; a reverse-only source bridge therefore still supplies the other aqueous state.

## 5. Transformation mathematics and logBeta

For a target source reaction `log(a_P) = K_P + Σ n_i log(a_i)`, substitute each family term with its canonical representation. Its contribution is:

- root coefficient: `n_i`;
- electron coefficient: `n_i e_i`;
- transformed logBeta: add `n_i k_i`.

Proton and water coefficients retain their original signed values. All target terms are accumulated. The global formation convention is unchanged. Source records are not edited. Integer source and final coefficients are required within the stated bounds; all integer additions/multiplications are exact in the supported JavaScript safe-integer domain. LogBeta uses the stored floating-point constants with a separately stated roundoff tolerance for cycle checks.

## 6. Provenance and reversibility

Every target row retains the original source ID/name, terms, logBeta and full provenance; chosen canonical basis IDs; bridge records and signed multipliers; final coefficients/logBeta; and validation status. Dependent state rows explicitly use the operation `sum-of-signed-bridge-reactions`, including negative multipliers for inverse directions. Other product rows retain their original formation reaction plus the listed bridge additions. Original imported rows remain intact. Source species IDs remain unchanged for ordinary aqueous/solid products; synthesized dependent basis states use `canonical-state:<component ID>`.

## 7. Rank, redundancy and cycles

The ordinary bridge incidence matrix must have rank `number of family states − 1`, leaving exactly one independent conserved inventory. The existing row-normalized rank routine is reused; unit-incidence connected graphs have this rank structurally. Duplicate component identities or duplicate selections reject as redundant. Disconnected selections and absent bridges reject separately. Multiple independent families, nonunit exchanges, unsupported basis bridges and ambiguous source product representations are not guessed into a solution.

Every directed edge is checked against the chosen spanning-tree representation. Integer electron differences must be exactly zero. The fundamental-cycle logBeta residual must be within **1e-10 log units**. This is a roundoff budget for at most seven additions of source constants bounded to magnitude 1000; it is not permission to reconcile materially inconsistent data. Tests inject a 0.001-log-unit inconsistent path and verify rejection. Constants are never averaged. Element/proton/electron terms are not silently dropped.

## 8. Fe validation and reverse-basis equivalence

The full compatible integer Fe subset prepares as 23 products and seven solid candidates. The source Fe0.932O(cr) row has coefficients 0.932 and −0.136; it is explicitly excluded in the validation session, not rounded or altered. Without that exclusion, the request returns source-validation-incomplete identifying this record.

Fe(II)/Fe(III) exchange, hydrolysis and alternate-basis solids share one total. At total 0.001 mol/kg H₂O, the recorded samples (pH, pe) are (2,0), (7,0), (7,13), (10,20). All accepted. Hematite is accepted at the two pH 7 samples; the other two sampled states have no positive solid inventory. This is equilibrium sample evidence, not a phase-region or corrosion claim.

Validation independently re-expresses raw source reactions against Fe(III), prepares that alternate system through the existing engine and compares named species and solid amounts with the canonical Fe(II) solve. The alternate source representation is also compiled back to the common canonical representation. Both checks pass. Selecting either or both Fe source valences produces identical canonical prepared chemistry without changing the editable session.

## 9. Cu validation

The same compiler prepares 18 Cu products and four solid candidates, selecting Cu(II) by the same ID rule. Cu(I) exchange and Cu(I)-based solid pathways transform without a Cu-specific branch. The four recorded coordinates all accepted: Cu(cr) is present at pe 0, and CuO(cr) at the higher-pe samples. An independent Cu(I)-basis solve and compilation back to the common canonical representation pass the same equivalence checks as Fe.

## 10. Mn comparison

The generic preparation has 24 products and seven solid candidates. It agrees in coefficients and logBeta with **every one of the 19 overlapping rows** in the existing independently developed offline Mn compiler. The five extra compatible aqueous products are H2, H2O2, O2, O3 and OH−, expressed through H/e/water source controls. The Mn-named offline inventory did not select them; they add no Mn inventory. No discrepancy in overlapping chemistry was found. Four additional Mn equilibrium samples accepted in the evidence run. Existing Mn topology/classification artifacts were not regenerated or promoted to public support.

## 11. Proton, electron, atoms and charge

Independent curated Fe/Cu atom-count fixtures verify representative metal/H/O balance, including Fe2O3, Fe3O4, Cu2O and CuO. They live only in tests. Production never treats discovery-element associations as atom counts. Generic elemental completeness remains unavailable because imported records lack authoritative full composition metadata.

The existing fixed-electron reservoir remains authoritative: `pe = −log10(a_e)` and `Eh = RT ln(10)/F × pe` with unchanged constants, signs and 25 °C implementation. Electron free concentration is zero and H/e/water component residual entries remain null under their fixed activities. Charge balance is verified for transformed source reactions. Bulk solution electroneutrality is not added as a new equation or claimed as a solved constraint in this reservoir model.

## 12. Solid competition and exclusions

Canonical candidate discovery occurs once during preparation, after family connectivity is established. Null candidateSpeciesIds requests the full source-compatible canonical candidate set; an explicit list bounds a validation subset. Disabled phases and explicit source exclusions are retained. Excluding a solid excludes all records with that same exact phase name, preventing reintroduction through another representation. Alias/synonym equivalence across different source names is not inferred.

The unchanged 12-solid limit and bounded assemblage machinery remain in force. The ordinary electron-bearing assemblage guard is unchanged. Only the explicit new preparation path supplies the existing fixed-electron policy after canonical validation. Tests verify a candidate-only Fe state does not precipitate, accepted hematite has its exact stored amount, and excluding hematite removes it from both canonical candidates and subsequent accepted results. The successful samples establish bounded competition, not universal coexistence uniqueness; existing ambiguous-assemblage failures remain authoritative.

## 13. Numerical evidence

`docs/canonical-redox-validation.json` records source IDs, coefficients, bridge multipliers, canonical inventories, point input IDs, exact solid amounts, inventory errors, fixed electron activity and residuals for 12 samples.

| System | Products | Solid candidates | Largest absolute inventory error (mol/kg H₂O) |
|---|---:|---:|---:|
| Fe | 23 | 7 | 1.6479873021779667e-17 |
| Cu | 18 | 4 | 4.336808689942018e-19 |
| Mn | 24 | 7 | 3.2959746043559335e-17 |

Existing balance tolerance at these totals is 1e-13 mol/kg H₂O. Reported mass-action residual maxima were zero. Accepted-solid saturation is tested against the existing 1e-8-log-activity bound. Reverse-basis checks pass the existing 2e-10 relative comparison tolerance with a stricter 1e-24 absolute floor for the representative comparisons. No global solver tolerance changed.

A four-point pH × pe grid also passed through the unchanged grid orchestrator, using the same branded prepared system at every sample. No per-point repository lookup or canonical compilation occurs.

## 14. Performance and bounds

Maximum source catalog: 10000 rows and 512 component identities. Maximum family: eight states, at most seven bridge substitutions. Original constants must be finite with magnitude at most 1000. Integer coefficients are bounded to magnitude 1024, with checks after substitution. Maximum products: 128; maximum pure-solid candidates: the existing 12. Rank and traversal run during preparation only. No new global mutable cache was introduced; the repository's existing catalog cache is reused.

In the evidence run, preparation took approximately 58 ms Fe, 35 ms Cu and 27 ms Mn on this local machine, excluding repository construction. These are observations, not browser latency guarantees. The public bundle is unchanged because this is an internal opt-in scientific foundation.

## 15. Unsupported results

Support results are explicit: supported/unsupported plus typed diagnostics. Reasons include invalid-canonical-request, redundant-basis, ambiguous-independent-basis, source-validation-incomplete, disconnected-redox-states, missing-bridge, rank-deficiency, inconsistent-cycle, unsupported-multistep-substitution, unsupported-coefficients, ambiguous-conserved-inventory, ambiguous-source-representation, excluded-redox-state, charge-imbalance, unsupported-candidate-set, unsupported-size and unsupported-phase.

Current scope excludes multiple conserved families, nonunit or ligand/proton-coupled basis exchanges, fractional stoichiometry, user-defined or insufficiently validated source records, unknown composition claims, ambiguous alternative product records and automatic interpretation of separate oxidation-state totals. This is a bounded generic compiler, not an arbitrary chemical-basis eliminator.

## 16. Final checks

Final full regression: **426/426 passed**, zero failures, cancellations, skips or todo (302904.4938 ms). This is the 408-test starting baseline plus 18 new canonical tests. All five official golden comparisons passed unchanged: acid-base, complexation, precipitation, redox and fixed-activity. The 18 new tests also passed a final focused rerun using the existing 2e-10 relative comparison tolerance. The earlier combined canonical/foundation/official-point focused run passed 39 tests before the final grid test was added. Logs: `.local/canonical-final-tests.txt`, `canonical-focused.txt`, `canonical-grid-focused.txt`, `canonical-build.txt`, `canonical-lint.txt`, `canonical-production-audit.json`.

Baseline and final production builds have the same public CSS/JS asset names. The production/artifact audit passed. Lint has zero errors and the pre-existing ExpandedPlot warning; the existing large-bundle advisory remains. No browser/UI work was required because no interface or public capability changed.

## 17. Exact files and preservation

New production scientific files only:

- `src/thermodynamics/canonicalRedox.js` — generic algebra, graph/rank/cycle checks, provenance and bounds.
- `src/solver/prepareCanonicalRedox.js` — explicit internal repository/session adapter and shared-inventory acknowledgement.

New validation/report files:

- `tests/canonicalRedox.test.js` — 18 focused tests.
- `scripts/validate-canonical-redox.js` — offline reproducible numerical evidence.
- `docs/canonical-redox-validation.json`.
- `docs/canonical-redox-report.md`.

All **176 pre-existing protected files** under src, public and tests/fixtures match their pre-edit SHA-256 hashes. No protected file was intentionally changed. Source database records, names, log K, temperatures, golden fixtures, solver equations, ordinary compatibility/discovery, calculations, exports, beaker and UI are preserved. Dist and local validation logs were regenerated only.

## 18. Remaining work before Pourbaix

A later phase must define the public inventory-selection contract, decide how to disclose unsupported source/candidate subsets, validate any broader fractional or multi-inventory algebra, and establish the actual map classification/support contract, ties, failed samples and coexistence behavior. Broader chemical completeness and generic elemental validation require better authoritative composition metadata or separately validated scope. Water-line display and public rendering are not part of this phase.

**Pourbaix remains validation pending. No deployment, remote push or subsequent phase. Stop for review.**
