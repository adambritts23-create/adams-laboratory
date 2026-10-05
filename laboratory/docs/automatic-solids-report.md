# Automatic compatible solid phases — review report

Completed locally on 10 September 2026, only in C:\Users\adamb\PycharmProjects\PythonProject\adams-laboratory. No deployment or remote push. Stopped for review.

New ordinary aqueous systems now consider compatible supported solids automatically. The exact Fe(III) example at pH 8.4 accepts Fe2O3(cr), and the Calculation Beaker shows that same accepted inventory. Existing saved and example configurations preserve explicit phase choices.

1. **Verified starting baseline.** Before source edits, all 338 tests passed, zero failed/skipped; all five official benchmarks passed. Build, lint and production audit passed. Lint had the existing ExpandedPlot.jsx line 21 React ref-cleanup warning. The first build attempt lacked filesystem write permission; it passed after project-only permission was granted. Baseline test duration was 282.854 seconds.

2. **Previous behavior.** Automatic repository discovery included aqueous products, while solids required membership in optionalSpecies. Ordinary preparation rejected more than one solid; only explicit mixed/grid configurations used the already validated bounded multi-solid solver. The screenshot therefore reflected an aqueous-only model configuration rather than independent Beaker chemistry.

3. **New default.** New workspace sessions carry solidPhasePolicy = automatic-compatible-solids-v1. In an ordinary aqueous basis with solvent and no electron component, supported compatible solids are included unless excluded. The existing bounded multi-solid solver is selected when such a system includes solids. Explicit example builders use the explicit policy, retaining their original candidate sets and calculation paths. No solver equations, constants, iteration rules, tolerance values or activity models changed.

4. **Exact compatibility.** Resolve current selected component IDs through the repository. For each source record, use effectiveSourceReaction.components: terms must be finite, uniquely named, and contain at least one nonzero coefficient. Every nonzero signed term must name a selected source component. The record must have supported traceable formation data and finite logK; its scientific phase metadata must be solid. Respect phase flags and explicit exclusions. Component/solvent identities are not added as products. No elemental overlap, formula guessing, charge, pH thresholds or iterative/redox closure decides membership. Existing imported phase metadata is consumed directly. All included control rows were checked against their complete source dependencies; unselected phosphate and sulfide components cannot leak into the set.

5. **Water and acid/base.** New system now retains both intrinsic proton and solvent components, matching initial ordinary initialization. H2O remains fixed at log activity zero. The repository OH- formation reaction is automatically available through its exact H+/H2O source terms. OH- is not a periodic-table element or an additional manually required basis choice. No Kw, acid/base reaction or database value was changed. Explicitly removing the proton remains an explicit scientific edit and removes incompatible pH controls/products.

6. **Exclusions.** Solid checkbox changes use the existing chemical-system exclusion array for automatic systems; aqueous exclusions use the same existing mechanism. Changing pH, calculation type, workspace, visibility or selected result sample does not clear exclusions. Recalculation, Reset calculation and serialization preserve them. Component toggles recompute compatible candidates; temporary component removal/readdition preserves recorded exclusions. Existing element removal prunes choices for reactions no longer compatible with the remaining system. New system intentionally starts a fresh inventory and exclusion list. Disabling the solid phase excludes the group without erasing individual exclusions.

7. **Saved and legacy migration.** Deserialization does not add the new policy marker. Unversioned historical sessions preserve selectedSpecies/optionalSpecies/excludedSpecies and their former explicit behavior, including aqueous-only configurations. This avoids silently changing stored scientific intent. Versioned automatic sessions retain their marker and exclusions through saving/loading. Existing validated examples explicitly retain their old phase policy. To obtain the new default from a historical configuration, start New system and define its inventory; historical sessions are not silently upgraded.

8. **Ca in water.** Two candidates: Ca(OH)2(cr), CaO(cr), with no carbonate component. Total Ca = 0.1 mol/kg H2O, pH 0–14 in 29 samples; all converge. At pH 0 both solids are absent and dissolved Ca = 0.10000000000000002. At pH 12 accepted Ca(OH)2(cr) = 0.028630254996603023, dissolved Ca = 0.07136974500339699; CaO(cr) is absent. At pH 14 Ca(OH)2(cr) = 0.09984302046190452, dissolved Ca = 0.0001569795380955242.

9. **Fe(III) in water.** Four candidates: Fe(OH)3(am), Fe(OH)3(s), Fe2O3(cr), FeOOH(cr). Total Fe(III) = 0.1 mol/kg H2O, 51 samples pH 0–14; all converge. At pH 0 no solid is present and dissolved Fe = 0.1. At exact sample 30, pH 8.4, accepted Fe2O3(cr) = 0.04999999999949872 mol/kg H2O and dissolved Fe = 1.0025643935663322e-12 mol/kg H2O. Its amount counts Fe2O3 formula units: the source stoichiometry carries two Fe per solid unit. The other three solids are absent. The accepted result uses an Fe(III) basis without electron/redox closure; this is the result of the current selected equilibrium model, not a kinetic precipitation prediction.

10. **Ca/carbonate.** Four considered candidates: Ca(OH)2(cr), CaCO3(am), CaCO3(cr), CaO(cr); none explicitly excluded in the default control. Each analytical total = 0.1 mol/kg H2O; all 29 samples converge. At pH 0 no solid is present. At pH 12 accepted CaCO3(cr) = 0.09992894106355982; dissolved Ca = 0.00007105893644018662 and dissolved carbonate component = 0.00007105893644018356. At pH 14 accepted Ca(OH)2(cr) = 0.0004319891431656231 and CaCO3(cr) = 0.09940548505259345; dissolved Ca = 0.00016252580424081468 and carbonate = 0.0005945149474067238. Beaker solids equal these exact accepted objects. In the separate control explicitly excluding all four candidates, included count = 0; at pH 12 no solid is present and dissolved Ca = 0.10000000000000002. Full candidate/exclusion states and all sample values are in automatic-solids-evidence.json. Dissolved carbonate means the coefficient-weighted carbonate component inventory, not free carbonate ion alone.

11. **Mixed validated example.** The ten original candidates remain explicit: the four Ca phases above, Mg(OH)2(am), Mg(OH)2(cr), MgCO3(s), MgCO3·3H2O(s), MgCO3·5H2O(s), MgO(cr). All 29 samples converge with the existing totals Ca = 0.1, carbonate = 0.1, Mg = 0.001. At pH 14 the exact original amounts remain Mg(OH)2(cr) = 0.0009999974190573818; Ca(OH)2(cr) = 0.0004319891466332604; CaCO3(cr) = 0.09940548504912593. Dissolved Ca = 0.00016252580424081534, carbonate = 0.0005945149508740985, Mg = 2.58094261823735e-9. Existing tests also preserve all 29 original accepted states.

12. **Negative control.** H+/H2O without solute inventory yields zero compatible solids and zero precipitate at all 29 samples. Ca and Fe acidic samples independently cover considered-but-absent solids. Fully excluded Ca/carbonate covers explicit exclusion rather than absence of database candidates. No neutral aqueous species is relabeled as solid.

13. **Beaker equality and wording.** The Beaker still consumes the exact selected accepted Calculation input/result. Positive solids are the unchanged result.solids entries with amount > 0; no new solve, threshold or saturation inference was added. All 167 samples across the five primary controls have exact Beaker/input/result equality. Phase disclosure metadata is captured in the prepared system identity, so later edits cannot rewrite the description of an older result. Messages distinguish no compatible supported candidates, considered-but-absent, explicit exclusions and positive solid inventory. Stale/failed selections remain unavailable.

14. **Fractions and concentrations.** Aqueous fractions still normalize over the existing coefficient-weighted dissolved denominator only. New Ca, Fe and carbonate controls verify aqueous-only series and a sum of one whenever the existing resolution gate admits the output. Low dissolved values retain the existing unavailable behavior; no tolerance was lowered. The ordinary log-concentration plot retains aqueous curves by default, with separately selectable, labeled solid amounts. No formula/phase label redesign occurred.

15. **Response surfaces and solubility.** Point, sweep and grid preparation consume the same authoritative selectedSpecies membership. A grid test excludes amorphous calcium carbonate and verifies the exact remaining solid set at every accepted grid point; response-solid targets match it. Existing conditional saturation-solubility applicability now recognizes the current automatic multi-solid policy. No second candidate discovery policy is introduced for plots, solubility or Beaker. Failed sweep controls retain unavailable Beakers and null fraction values; existing grid/surface failure and phase-boundary tests remain passing. No interpolation, smoothing, missing-point fill or convergence changes were made.

16. **Counts and performance.** Counts remain bounded and chemically relevant. Representative local timings below are diagnostic observations, not fixed performance promises. Discovery uses a repository catalog cache; solver candidate limits remain 12 solids, 1024 enumerated assemblages, 16 components and 128 products. Exceeding a limit yields an explicit preparation/search failure, never truncates the scientific phase set.

| Control | Compatible candidates | Samples | Discovery ms | Sweep ms |
|---|---:|---:|---:|---:|
| Ca water | 2 | 29 | 11.79 | 73.46 |
| FeIII water | 4 | 51 | 9.72 | 104.50 |
| Ca carbonate | 4 | 29 | 13.41 | 124.19 |
| Mixed validated | 10 | 29 | 9.06 | 3298.23 |
| Water negative | 0 | 29 | 8.05 | 17.40 |
| Ca carbonate all solids explicitly excluded | 4 | 29 | 0.03 | 36.15 |

17. **Final tests.** 355 passed, zero failed/cancelled/skipped, including 17 new automatic-phase tests. Full suite duration 228.755 seconds. Focused automatic and workspace-ownership run: 25 passed. Tests run with the complete existing glob list and Node --experimental-test-isolation=none because the sandbox blocks worker process spawning. The final subsequent edit only clarified two aqueous-exclusion count labels; final build and lint cover those labels.

18. **Official golden benchmarks.** All five passed unchanged: acid-base, complexation, precipitation, redox, fixed-activity. references.json SHA-256 remains aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960. The thermodynamic asset remains unchanged and the artifact audit checks its approved hash.

19. **Build, lint, audit and browser.** Final Vite build passed with --configLoader native. Existing large-chunk advisory remains. Lint passed with zero errors and the one unchanged ExpandedPlot.jsx warning. Production audit status passed. Browser walkthrough loaded the bundled database, selected Fe then Fe3+, observed four checked solid candidates, plotted all 51 pH samples, and verified pH 8.4 Beaker data-solid-id/amount = spana:2ac52a30213c9288:133739 / 0.04999999999949872. At pH 0 the Beaker reported four considered solids and none present. Excluding all four, navigating to Calculation and recalculating yielded no precipitate, explicit exclusion wording and dissolved Fe = 0.1 at pH 8.4. Browser startup was slow but succeeded; no Windows settings were altered.

20. **Exact files changed/added.** Paths below are relative to the sole authorized project root. Existing examples and the historical fraction audit only receive an explicit-policy marker. The historical phase83 custom fixture keeps explicit behavior; workspaceOwnership now permits intrinsic H+ on New system.

- scripts/validation/fractionBeakerAudit.js
- src/beaker/acceptedState.js
- src/calculations/diagramSetup.js
- src/calculations/surfaceResponses.js
- src/chemistry/system.js
- src/components/CalculationWorkspace.jsx
- src/components/InteractiveBeaker.jsx
- src/components/OutputControls.jsx
- src/components/ReactionReview.jsx
- src/components/SelectedSystem.jsx
- src/data/metalLigandSurfaceExample.js
- src/data/solubilityExample.js
- src/data/surfaceExamples.js
- src/session/laboratorySession.js
- src/solver/prepareSession.js
- src/thermodynamics/compatibility.js
- tests/phase83.test.js
- tests/workspaceOwnership.test.js
- scripts/validation/automaticSolidsAudit.js
- tests/automaticSolids.test.js
- docs/automatic-solids-evidence.json
- docs/automatic-solids-report.md

Generated dist output was rebuilt. Local scratch backups, test/build/lint/audit logs and changed-file inventory are under .local/automatic-*; no source database, numerical solver, fraction normalization, golden fixture, remote repository or deployed site was modified.

21. **Remaining scientific limits.** Compatibility is exact direct-basis compatibility within the selected database, not a claim of complete real-world chemistry. No basis transformations, redox closure, gas equilibrium expansion, kinetic/metastable selection, solid solutions, nonideal activities or general Pourbaix work were added. The ideal 25 °C / declared 1 bar and molality restrictions remain. Competing phases follow the existing solver's acceptance and ambiguity rules; degenerate or unsolvable systems remain explicit failures. Candidate/search-size limits are unchanged. A saved legacy aqueous-only configuration remains aqueous-only until the user creates a new system or explicitly changes its phase choices. This phase is complete and awaits review.
