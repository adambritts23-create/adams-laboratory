# SPANA/MEDUSA Calculation behavioral parity and Wet Lab Titration layout

## 1. Executable/source oracle and scientific interpretation

The installed SPANA window `Select Diagram Type: Attickatitrering.dat` was inspected directly. It showed acetate total 0.5, signed H+ total -1 to +1, 25 °C and fixed ideal ionic strength zero. Its diagram menu included logarithmic, fraction, solubility, relative activity and calculated pH; calculated Eh was absent without an electron component. No native user data were saved or changed.

Ambiguities were traced in the existing pinned upstream Java source, revision `c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7`. New machine-readable calculations call the unchanged official HALTAFALL library through a small I/O adapter. The oracle and raw inputs/outputs are in `.local/spana-parity`; reproducibility instructions are in its README. The library solves equilibria; SPANA/SED/Predom supply diagram conventions around them.

HALTAFALL uses kh=1 for a conserved source-component analytical total and kh=2 for a prescribed logarithmic activity. A prescribed activity replaces that component balance. It is not an extra physical material supply. The solver calculates the implied reservoir-component totals after solving. Source reaction charge checks and analytical solution charge requirements are different questions.

## 2. Behavioral matrix

All newly matched cases use ideal activities, 25 °C, declared 1 bar and unit water activity. Full source/species identities, admitted phases, input constraints and statuses are retained in the raw corpus. [Machine-readable comparison](spana-parity-corpus.json) provides both cold and continuation-enabled Java comparisons. Agreement below refers to identical admitted source equations, not every possible database/system combination.

| Requested case | Setup/evidence | Result and classification |
|---|---|---|
| A, H: acetate / H+, analytical-total sweep | acetate 0.5; signed H total -1…1; 51 samples | Both 51/51; max log-activity difference 3.75e-10. Ordinary analytical semantics preserved. |
| A, I: acetate pH sweep | acetate 0.5; pH 0…14; 101 samples | Both 101/101; max log-activity difference 6.66e-14. |
| B: ordinary Fe hydrolysis | Fe(II) 0.001; pH 0…14; no e; 51 samples | Both 51/51. No automatic physical closed-redox expansion. Corrected routing, category A. |
| C, J: Fe imposed Eh | Fe 0.001; pH 0; Eh -2…2 V; 101 samples | Both 101/101; phase agreement. No physical counterions required. |
| D: Fe/peroxide, source-coordinate model | Fe(II) 1; H total 0; peroxide total 0…1; no e; 51 samples | Java 51; Adam 50. Zero-dose exact-activity boundary remains a gap; 50 overlapping samples agree. Category B: missing exact-zero boundary reduction. This is not the reviewed physical peroxide-addition model. |
| E, L: Cu pH×Eh | Existing matched 57×45 scope | Both 2565/2565; no status/accepted-phase disagreements. Max component-fraction difference about 1.91e-10. |
| F, L: Cr pH×Eh | Existing matched 57×45 scope | Both 2565/2565; no status/accepted-phase disagreements; eight carriers retained in exact regression. Max component-fraction difference about 9.73e-11. |
| C, L: Fe pH×Eh | Existing matched 57×45 scope | Both 2565/2565; no status/accepted-phase disagreements; max fraction difference about 9.76e-11. Exact reviewed oxidation-state evidence remains separate. |
| G: existing U/UO2 basis evidence | `hydra-basis-controls.json`; U(V) and U(VI) basis, total 1e-5; 25×41 grid | Existing official Java evidence: both 1025 accepted, nine carrier labels, zero cross-basis label disagreement, max amount difference 1.1624e-14. Reused as source-basis evidence, not misrepresented as a new Adam U production-parity campaign. |
| K: two material coordinates | Ca and Cl totals, log10 -3…-2; fixed pH 7; 11×11 | Both 121/121; max log-activity difference 4.27e-11. |
| M: material-total Predominance Area | Fe total log10 -5…-3 × pH 0…14; Eh -0.2; 11×11 | Both 121/121; no status/phase disagreement. |
| N: logarithmic concentrations | Matched accepted species vectors above | Existing view uses same accepted results; electron/water are not ordinary material curves. |
| O: fractions | Same vectors, component-weighted totals and dissolved inventory | Total fractions are an intentional Adam extension; aqueous-speciation normalization preserved. No claim that all SPANA Fraction menu variants use the same denominator. |
| P: log solubility | Java dissolved-component totals vs Adam accepted dissolved inventory; saturation eligibility retained | Accepted-saturation quantity retained; genuine unavailable samples remain gaps. No general unsaturated extrapolation or gas inventory added. |
| Q: calculated pH with imposed Eh | Fe total log10 -5…-3; H analytical total 0; Eh -0.2; 51 samples | Both 51/51; max log-activity difference 5.73e-9; max fraction difference about 1.05e-10. New generic production constraint contract admitted, category B resolved. |
| Q: calculated electron balance, pH fixed | Fe log-total sweep, pH 3, analytical e total 0 | Research: Java 51 accepted; Adam 0. Remains unavailable, category B/numerical limitation. |
| Q: both proton/electron balances derived | Fe log-total sweep, H total 0, e total 0 | Research: Java 46 accepted; Adam 8; 38 status disagreements and unacceptable overlapping results. Explicit production gate retained. No tolerance changes or false parity claim. |

The calculated-electron experiments are historical research outputs retained before the final gate. They are not admitted production calculations. `--extra --prepare` now regenerates only the supported mixed-boundary/material-area cases.

## 3. Analytical totals and physical charge

In the ideal SPANA calculation, `Fe2+ total = 1` is an independent source-component coordinate. It is not a literal bottle of naked charged iron and does not require entering chloride solely to satisfy a physical preparation check. H+ and e- imposed activities are thermodynamic reservoirs. Signed analytical H+ equivalents are legal; negative physical reagent amounts are not thereby authorized.

This conclusion is scoped carefully. HALTAFALL's nonideal `Factor.java` does account for missing background countercharge in ionic-strength/activity bookkeeping (fictitious inert X-/M+ and SIT Na+/Cl- terms). It would be incorrect to describe all nonideal SPANA models as simply ignoring electroneutrality. This phase does not implement those models.

Wet Lab still requires physical charge completion, explicit/intrinsic counterions, nonnegative supplied amounts, additive-volume/model-solvent conventions and provenance. Its chemistry engine and preparation checks are unchanged (category D).

## 4. H+, electron and automatic boundaries

Normal Calculation now bases reaction connectivity on the selected HYDRA source system. No e selection means no electron-driven forward expansion. An explicit Eh/pe coordinate or fixed potential includes the electron condition. Electron selection is special, not an element or a conserved physical reagent.

- pH axis/fixed pH: imposed H activity.
- Eh/pe axis/fixed potential: imposed electron activity.
- Analytical H total with imposed potential: derived pH and fixed electron activity, now supported by `analytical-proton-fixed-electron-v1`.
- Analytical electron balance: unavailable pending reliable differential validation.
- Explicit physical Closed reagent mode: existing validated closed chemistry remains separate and derives its outputs under its existing contract.

The new contract reuses the same transformed laws, point solver and acceptance checks. It admits a proton balance while requiring fixed electron activity; it does not invent an electron mass inventory. No Newton equation, equilibrium constant, numerical floor or solver tolerance was changed.

## 5. Diagram parity and browser verification

The existing general diagram model, structured axes and Y-side/X-below arrangement remain. One-dimensional log concentrations, total fractions and aqueous speciation reuse accepted samples. Predominance Area supports pH×Eh and admitted material-total axes; boundaries remain sampled.

Browser verification on the final development code:

- Fe total log10 -5…-3, 51 samples, H total 0 and fixed Eh -0.2: 51/51 calculated through the ordinary Calculation controls without counterions.
- Log concentrations → Total fractions preserved the accepted 51-sample result. Selecting endpoint 50 updated the Beaker to total Fe 0.001 and calculated pH about 6.05; endpoint 0 was about pH 7.05.
- Calculated-pH output is available and its adapter uses these same results, but changing to that diagram currently marks the result stale via the existing diagram-transition policy and requests Plot again. This remaining routing inefficiency is disclosed; it is not claimed as seamless cached-view parity.
- Fixed electron balance is clearly reported unavailable. No silent fallback to physical or ordinary non-redox chemistry.

Wet Lab is now the workspace and Titration its experiment. The apparatus is on the left, with burette solution/concentration/loaded volume in the upper adjacent box and sample solution/concentration/initial volume below; results are on the right. The apparatus appears before calculation as a labelled setup preview. After preparation it uses the same accepted state as inspection. At 390 px the workspace stacks and editable fields remain usable.

The browser HCl 0.1 mol/L, 50 mL / NaOH 0.1 mol/L, 100 mL control produced the existing sampled curve. Selecting 50 mL gave pH 7.00075, 50 mL remaining and 100 mL beaker volume. Switching to log concentrations retained this selection. Editing sample volume to 60 mL invalidated the old experiment and hid its live results until preparation. No second equilibrium or new partition calculation was introduced by the layout.

## 6. Reaction and phase parity

The existing seven independently captured Java search cases remain regression controls in `tests/hydraSearch.test.js`. Product names and original source reaction identities are checked, including implicit water and electron-triggered expansion. No second search algorithm was added. The new corpus records admitted product IDs/phase identities and input source matrices.

Eligible solids remain distinct from accepted positive inventory. Phase comparison at a 1e-12 reporting floor agrees for matched accepted production cases. This floor is not a solver tolerance or a replacement for Beaker sediment rules. Gas records remain disclosed according to existing support scope; no finite headspace, gas loss, gas evolution kinetics or automatic gas material balance was added. Explicit exclusions still change the model.

The Java corpus independently validates solving identical admitted laws. It does not independently prove Adam's basis compilation; the existing HYDRA/source-transformation evidence supplies that distinct layer. Database/snapshot mismatches (category F) must be established by actual identities, not invoked speculatively to excuse numerical differences.

Additional [output comparison](spana-parity-output-comparison.json) reconstructs dissolved inventory from the matched matrices and compares it with official Java `solub`. Fe/Cu/Cr saturated log-solubility differences are at most 2.23e-14 log units; accepted unambiguous largest-carrier labels have zero disagreements. Derived pH differs by at most 5.73e-9 across the new mixed-boundary control. The output comparison also contains a recovered-inventory normalized diagnostic; the primary corpus compares component contributions against the imposed analytical total and remains the Total fractions reference. No production renormalization was introduced.

## 7. Numerical execution and measured performance

HALTAFALL reuses solver/work arrays; Predom calls equilibrium at every grid node, resetting continuation at each column and reusing within the column. Its two-column frontier buffer is graphical storage, not skipping thermodynamic solves. The new probe compares continuation disabled/enabled in the supplied traversal order; that order is not claimed to be an exact Predom UI timing.

| Case | Adam total / solving ms | Java cold / continuation solving ms |
|---|---:|---:|
| Acetate signed total, 51 | 49.26 / 18.49 | 3.28 / 2.41 |
| Fe hydrolysis, 51 | 37.84 / 14.89 | 1.93 / 1.79 |
| Acetate pH, 101 | 75.32 / 14.43 | 2.38 / 2.43 |
| Fe Eh, 101 | 465.40 / 383.63 | 6.58 / 5.37 |
| Fe pH×Eh, 2565 | 13025.41 / 10696.67 | 44.74 / 27.96 |
| Cu pH×Eh, 2565 | 7174.09 / 5202.77 | 44.61 / 25.77 |
| Cr pH×Eh, 2565 | 16082.78 / 13794.72 | 58.78 / 44.59 |

These are single local observations, not isolated benchmarks. Java timing excludes process startup, file I/O and plotting. Adam total includes orchestration and accepted-result construction. Even solve-only numbers show a substantial gap. Adam independently initializes samples and performs its own accepted-phase/residual checks; source structure shows more per-sample construction, while Java retains mutable work arrays. The measurements do not apportion the gap causally between these factors and runtime differences.

Continuation improved these Java grid controls without materially changing accepted outputs, but no JavaScript continuation implementation or solver optimization was introduced. Porting it requires validated initial-state transfer and cold fallback, especially around phase changes and failed electron-balance cases. Separate Wet Lab performance was not changed.

## 8. Implemented changes

- Automatic inference now follows selected HYDRA source connectivity rather than mistakenly routing an ordinary analytical Calculation through physical closed-preparation checks.
- Generic analytical-proton/fixed-electron preparation policy, with strict input guards; source-basis construction and solver mathematics reused.
- Explicit unavailable diagnostics for unvalidated calculated-electron combinations; preparation failures expose their actual reason.
- Clear analytical-condition labels and H/e explanation; ordinary setup remains automatic.
- Wet Lab/Titration hierarchy and apparatus-adjacent input layout with existing result adapters and stale-state protection.
- Additional static independent Java fixtures and four focused regression tests; old references are untouched.

## 9. Intentional differences

Adam's reviewed oxidation-state predominance is an extension (C), not SPANA's solid-first carrier labeling. Experimental carrier maps remain marked separately. Total fractions retain their explicit total-component denominator, while aqueous speciation retains its dissolved denominator. Symmetric ties, unavailable gaps, exact provenance, physical Wet Lab checks (D) and modern layout are preserved. Legacy order-sensitive labeling/graphical smoothing and obsolete capacity assumptions are not copied (E).

## 10. Remaining gaps and priority

1. General calculated electron-balance diagrams: source/numerical investigation required. Strong mismatches prohibit a public equivalence claim.
2. Fe/peroxide analytical zero-dose point: Adam returns `inconsistent-or-boundary-total` because a zero total with only nonnegative contributions has no finite positive free-activity solution. Exact zero-activity boundary reduction is not implemented, although the official engine accepts this endpoint. The separate validated physical Fe/peroxide path is unchanged.
3. General calculated-pH diagram transition currently requests recalculation even when the underlying accepted sweep is usable; adapter mathematics already works.
4. Further arbitrary coupled redox source bases and gases remain subject to existing compiler/support checks. A Fe/peroxide/e source selection can be overcomplete rather than automatically equivalent to a physical closed experiment.
5. Full nonideal SPANA activity/background-ion parity and general gas inventories are not established.
6. A safely validated Adam continuation path could address the measured speed gap; none is claimed here.

## 11. Final validation

The single [full regression](spana-parity-full-regression.txt) finished in 878.20 seconds: **724 tests, 723 passed, one failed, zero cancelled/skipped/todo**. The only failure was an obsolete constructor-contract assertion expecting four supported boundary combinations and rejecting derived H / imposed e. The newly independently tested contract correctly has five supported combinations. That test expectation was corrected; no production change was needed after the full run. The [focused constructor and SPANA parity rerun](spana-parity-final-focused.txt) passed **9/9**. The full suite was not repeated, so this is not a claim of a clean 724/724 full rerun. All five official golden controls, exact Fe/Cu references, Cr 2565/eight-carrier regression, and reviewed closed-reagent/Wet Lab scientific controls passed in the full run.

Final [production build](spana-parity-build.txt) passed: 248 modules, dist/index.html and required assets/data/artwork produced. The existing chunk-size advisory remains. The existing local build launcher bypasses only sandbox-blocked Windows mapped-drive enumeration; no production build configuration was changed. [Artifact audit](spana-parity-artifact-audit.txt) passed, including approved static assets, runtime import boundaries and absence of Java/oracle fixtures in production. [Lint](spana-parity-lint.txt) completed with zero errors and one pre-existing ExpandedPlot.jsx ref-cleanup warning; that file is unchanged.

[Preservation](spana-parity-preservation.json): 43 protected files compared, zero protected changes, zero missing checkpoint files. Source database/static assets, numerical point solver and tolerances, reviewed metadata and old reference fixtures remain unchanged. The existing full-suite test regenerated docs/closed-solids-benchmark.json (tests/closedPureSolids.test.js:86); this generated artifact is explicitly listed rather than silently restored. Eight production source files and three existing test files have intentional changes, plus the new parity test and reports.

Earlier focused checks passed: 35 integration/UI-state tests and six Predominance Area tests, including exact Fe/Cu references and Cr 2565/eight-carrier control. New differential fixture tolerances (1e-12 absolute + 2e-9 relative concentration; 1e-8 log activity) reflect the observed Java comparison, and do not change production acceptance tolerances.

No deployment or push. Research/oracle files are local validation dependencies only.

Preservation uses the pre-edit SHA-256 checkpoint because this project directory has no Git repository. Expected edits are limited to Calculation routing/constraint admission, the two UI components and layout, and their regression expectations. The final comparison lists every changed/new/missing file rather than relying on conversation history. Browser observations are recorded in [browser checks](spana-parity-browser.md).
