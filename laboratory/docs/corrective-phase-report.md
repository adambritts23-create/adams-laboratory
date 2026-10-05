# Corrective phase report — 2026-09-10

Status: complete; STOP FOR REVIEW. No deployment or remote push. Work remained in C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory.

## 1. Verified baseline and final validation

The accepted starting baseline was verified before source edits: **329 passed, zero failed**. Final full suite: **338 passed, zero failed**. Focused run: **30 passed, zero failed**, including nine new corrective tests.

Both full runs used the unchanged test file globs with Node's in-process test runner, because isolated child processes were blocked in the preceding phase:

`node --test --experimental-test-isolation=none src/chemistry/*.test.js src/thermodynamics/*.test.js src/thermodynamics/importers/*.test.js src/thermodynamics/importers/spana/*.test.js src/calculations/*.test.js tests/*.test.js`

All five official golden benchmarks pass: **acid-base, complexation, precipitation, redox, fixed-activity**. Fixture SHA-256 is unchanged: `aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960`.

- Build: `npm run build -- --configLoader native` passed. Native config loading avoids the previously encountered child-process EPERM restriction. Existing large-chunk advisory remains.
- Lint: `npm run lint` passed with zero errors and one unchanged cleanup-ref warning in ExpandedPlot.jsx.
- Production audit: `node scripts/audit-production-boundary.js` passed.

## 2. Response-surface default, before and after

Before: selecting Response surface did not set a result visualization, so the grid defaulted to 2D Map.

After: selecting Diagram type → Response surface sets `visualizationMode: '3d'` and `responseMode: 'surface-floor'`. This produces **3D Surface / Surface + floor contours**. **2D Map remains selectable**. Subsequent visualization switches are existing plot-view actions and preserve the same grid object, result revision, sample values and selected equilibrium. No chemistry is scheduled by a view switch.

The change is applied at the explicit diagram-selection action; it does not rewrite stored sessions or example presets that bypass that action.

## 3. Ordinary Z response taxonomy

| Family | Available ordinary responses | Secondary target |
| --- | --- | --- |
| Aqueous species | Species concentration; Species log concentration; Species log activity | Compatible aqueous species or free aqueous component |
| Dissolved component | Total dissolved component; Log total dissolved component | Selected ordinary aqueous component |
| Solid / solubility | Solid amount; Log solubility at saturation | Included compatible solid, or component with a relevant included solid |
| Calculated coordinate | Calculated pH | No species target; requires a fixed signed proton-total condition and proton absent from both varied axes |

Eligibility uses current selected component IDs, selected species IDs, source reaction compatibility, source phases, enabled phases and actual axis/condition definitions. Incompatible stale identities are not offered. An unavailable previous target is displayed as unavailable rather than silently substituted. A sole eligible target can be selected automatically after choosing its response family.

The ordinary menu excludes supplied analytical totals, legacy inventory fractions, aqueous fraction surfaces (validated only for 1D pH), general calculated Eh/pe, and diagnostics. Solid molal amounts are not labeled aqueous concentration. Log solubility retains saturation preflight and unsaturated/failed gaps. Activity uses the existing stored log-activity output, without substituting concentration semantics.

## 4. Advanced outputs preserved

Advanced diagram options contains **Advanced Z response**, using the existing OutputControls and MapOutput machinery. Generalized species/activity, dissolved and analytical totals, legacy inventory fractions, solid amounts, saturation solubility and coordinate outputs remain there with existing validation. Unsupported aqueous fraction surfaces remain disabled; diagnostics remain diagnostics. Existing scientific calculation validation is not relaxed.

Browser verification confirmed that the generic selector is hidden initially and visible when Advanced opens; the ordinary dissolved-total selection displays a separate component selector.

## 5–7. What the CaCO3 curve actually means; diagnosis and correction

The reproduced curve is source species **CaCO3**, ID **spana:2ac52a30213c9288:60602**, with authoritative phase **aqueous**. Calcite is a distinct species, **CaCO3(cr)**, ID **spana:2ac52a30213c9288:60759**, with phase **solid**.

Fraction diagram is definition **A: aqueous-only component distribution**. For calcium the plotted CaCO3 value is:

`1 × m(CaCO3 aqueous) / Σ[ν(i,Ca) × m(i aqueous)]`

It is a fraction of **dissolved calcium**, not precipitated calcium and not a fraction normalized by supplied total when solids are present.

At exact pH 12, Ca analytical total = carbonate analytical total = 0.1 mol/kg H2O, 25 °C, ideal, and no solid phases selected:

- CaCO3(aq) molality = **0.09156748162680914 mol/kg H2O**.
- Plotted calcium fraction = **0.9156748162680912**.
- Dissolved Ca = **0.10000000000000002 mol/kg H2O**.
- Dissolved carbonate = **0.1 mol/kg H2O**.
- Authoritative active-solid inventory = **[]**; Beaker precipitate inventory = **[]**.
- No CaCO3(cr) amount or saturation diagnostic was calculated: that candidate was not included. This is not a claim that an excluded solid is undersaturated.

**Neither numerical fraction mapping nor Beaker inventory was wrong in the reproduced states.** The apparent contradiction comes from an aqueous complex being displayed without an explicit aqueous phase suffix. No solid was found masquerading as an aqueous fraction, and no accepted positive solid was missing from the Beaker.

Corrections are presentation-only: all aqueous fraction curve labels now carry **(aq)**; the fraction result explains its dissolved-only normalization; the Beaker states when **no solid phases were included in the calculation**. No precipitate was forced into the result.

The user's exact saved run/selected species list was not supplied. This diagnosis reproduces the stated inputs under explicit phase choices; it does not claim to reconstruct an unavailable saved session.

## 8–10. Authoritative solid controls, Beaker equality, and fractions

All quantities below retain exact numerical precision in the JSON evidence. All shown samples were converged and scientifically accepted. Calcium and carbonate analytical totals are 0.1 each; the mixed example additionally supplies Mg total = 0.001 mol/kg H2O.

| Configuration | pH | CaCO3(aq) fraction | Accepted positive solids (mol/kg H2O) | Beaker equals inventory |
| --- | ---: | ---: | --- | --- |
| Ca/carbonate without selected solids | 12 | 0.9156748162680912 | None | Exact match |
| Ca/carbonate with calcite selected | 0 | 3.4941696686306745e-15 | None | Exact match |
| Ca/carbonate with calcite selected | 12 | 0.07805150776845146 | CaCO3(cr) = 0.09992894106355982 | Exact match |
| Validated mixed-solid example | 14 | 0.03412539415194148 | Mg(OH)2(cr) = 0.0009999974190573818; Ca(OH)2(cr) = 0.0004319891466332604; CaCO3(cr) = 0.09940548504912593 | Exact match |

With calcite selected at pH 0, its amount is 0 and log saturation is **−10.200656010526238** (absent). At pH 12 its accepted amount is **0.09992894106355982**, status present, log saturation **0**. Dissolved Ca is **0.00007105893644018636**, dissolved carbonate **0.00007105893644018383**. The aqueous CaCO3 fraction is **0.07805150776845146**; the solid is outside fraction normalization.

At pH 14 in the mixed example, CaCO3(cr), Ca(OH)2(cr), and Mg(OH)2(cr) all have positive accepted amounts and log saturation 0. Dissolved Ca = **0.00016252580424081534**; dissolved carbonate = **0.0005945149508740985**. All three solids appear in the Beaker inventory.

Tests examine **all 87 exact samples** (29 in each configuration), not interpolated positions. They assert identical input/result objects; exact equality between fraction-trace solids, authoritative result solids, and Beaker positive solids; unchanged dissolved totals; and aqueous-only fractions summing to one within the existing 1e-12 normalization tolerance. No tolerance was changed. Failed samples have unavailable fractions and no fabricated Beaker equilibrium.

## 11. Failed response-surface points

No solver, tolerance, gap handling, interpolation or mesh-generation changes were made. A focused real grid containing failed samples verifies that failed points do not acquire valid surface vertices or triangles. Existing grid, response, 3D, phase-gap, numerical export and golden tests remain passing.

The reported 1020/1071 run was not supplied with its exact axes/ranges/phase configuration, so that specific count was not reconstructed. Its failures will remain visible/unavailable under unchanged semantics; they are not filled in.

## 12–14. Browser and release checks

- Browser-created response surface: 25/25 points, default 3D Surface and Surface + floor contours, visible rendered surface.
- 2D → 3D switch: same selected input ID and retained 25/25 completed state.
- Ordinary Z menu for carbonate/pH offered only five compatible responses; calculated pH, solids, general Eh and generalized totals/fractions were absent.
- Secondary component selector and hidden/expanded Advanced generic selector verified.
- The later mixed-fraction browser walkthrough timed out. It was not retried. Its exact scientific-state consistency is covered by automated tests; that additional visual walkthrough remains incomplete.

## 15. Exact files changed or added

- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/src/calculations/diagramSetup.js
- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/src/calculations/surfaceResponses.js
- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/src/components/CalculationWorkspace.jsx
- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/src/components/SurfaceResponseControls.jsx
- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/src/components/PlotWorkspace.jsx
- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/src/components/InteractiveBeaker.jsx
- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/src/plots/presentation.js
- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/scripts/validation/fractionBeakerAudit.js
- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/tests/correctivePhase.test.js
- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/docs/corrective-fraction-beaker-evidence.json
- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/docs/corrective-phase-report.md

Generated verification logs (inside the same source project):

- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/.local/corrective-baseline.txt
- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/.local/corrective-solid-audit.json
- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/.local/corrective-final-tests.txt
- C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/.local/corrective-production-audit.json

Local production build regenerated dist/index.html and dist/assets/index-Bvp6OV7R.js; existing copied public assets/CSS remain governed by the artifact audit. No external website/deployment copy was touched.

## 16. Remaining limitations and scope

- The original saved manual run was not provided; exact evidence belongs to the documented reproduced configurations.
- Ordinary Z eligibility is UI filtering, not proof that every selected numeric input converges. Existing scientific preflight remains authoritative.
- Aqueous distribution surfaces and general redox closure remain unsupported. No new chemistry was introduced.
- Solid selection remains explicit in System. An aqueous-only selected model does not test excluded solid stability.
- Existing large-bundle and cleanup-ref warnings remain. Mixed-fraction browser walkthrough is incomplete after one timeout.
- This folder is not a Git checkout; no commit or remote push was made.

No next phase started. **STOP FOR REVIEW.**
