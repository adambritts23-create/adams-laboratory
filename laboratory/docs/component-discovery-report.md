# General component discovery and intelligent Wet Lab input

## Outcome

Wet Lab analytical inputs now use a searchable, keyboard-accessible modal. Source identity, structural system admission, per-dose equilibrium acceptance, and independent validation remain separate. No analytical redox, solid closure, gas inventory, new solver, or per-species approval table was introduced.

## Candidate audit and rule

The old list contained 169 inputs, not the 4,445 database species: 168 imported HYDRA component forms minus electron and solvent, plus three existing source-coordinate conveniences (OH-, acetic acid, borate). The broad element/oxidation-state variety in the screenshot was legitimate HYDRA component metadata; the flat presentation concealed capability differences.

The same 166 authoritative input forms and three existing conveniences are retained. Candidate inspection requires source-bound identity, finite charge and supported integer source coefficients. Products are not automatically made input coordinates. Optional elemental metadata is reported separately. A single source-law pass derives immediate aqueous, proton, electron, solid and gas hints. These hints do not claim that every component combination is supported or that a solid actually precipitates.

The three conveniences retain their existing source laws: spana:2ac52a30213c9288:250448 (OH-), :79298 (CH3COOH), and :37016 (B(OH)4-). They are labelled source-coordinate conveniences, not physical reagents. Existing recipe descriptions are used only as search text; they do not authorize computation.

## Search and performance

Search uses source formulas, source element associations/descriptions, and existing source-bound descriptions. Unicode charge typography is normalized; formulas are not parsed to invent identities or salts. Empty search shows common proton/convenience inputs first. Results are capped at 20, optionally 50, with refinement for further matches. Exact formula matches rank first.

Candidate metadata is cached by immutable repository snapshot. Search accepts only indexed data: it cannot invoke repository expansion, equilibrium or composition caches. The focused run measured 169 candidates, 653 ms cold catalog construction including source verification, and 250 ms for 1,000 searches (approximately 0.25 ms/search). Actual picker opening/search was responsive in desktop and 390 x 844 browser checks. Results have large button targets and intact formulas; Tab, arrows, Enter and explicit Close are supported.

## Actual Ca/carbonate diagnosis

Inputs are exactly component:Ca%202%2B and component:CO3%202-. No Na, Cl or nitrate is inserted. The browser used 50 mL 0.01 M Ca input and 100 mL 0.01 M carbonate titrant.

The existing connectivity screen finds **connected aqueous redox as the first blocker**, not solely analytical solid closure. Six electron-bearing records are exposed: CH3OH (:81570), CH4 (:81789), CO (:82922), HCHO (:158811), HCOO- (:159546), and the inverse carbonate law (:87994). Prefix throughout is spana:2ac52a30213c9288.

Direct aqueous laws are CaCO3 (:60602), CaHCO3+ (:61567), CaOH+ (:63057), CO2 (:87724), H2CO3 (:151905), HCO3- (:159467), OH- (:250448). Structural solid candidates are Ca(OH)2(cr) (:56505), CaCO3(am) (:60677), CaCO3(cr) (:60759), CaO(cr) (:62870); gas candidate CO2(g) (:87814). Candidate existence does not establish saturation or positive accepted inventory at a requested dose.

Prepare reports: "Analytical redox not yet supported: the selected system contains connected electron-transfer chemistry. No reactions were suppressed." Advanced scope exposes the exact discovered records. Redox support is therefore the first current missing contract; solid/gas requirements still need composition-dependent treatment afterward. No source laws were removed to force a solids-only diagnosis. Machine-readable evidence: .local/component-discovery/calcium-carbonate.json.

## Chromium

Cr3+ remains a selectable HYDRA component with source charge and coefficients. Immediate connectivity marks a potential deferred redox requirement; selected-system admission confirms connected aqueous electron transfer. The browser displays analytical redox deferred, not "chromium unvalidated". No Cr-specific permission branch was added.

## Citrate: diagnosis B

component:cit%203- is a legitimate HYDRA input with authoritative charge -3 and source associations. Its optional reviewed atom vector is absent. The analytical compiler previously consulted the narrower reviewed composition registry and therefore over-required metadata. It now uses the existing authoritative source-component charge registry, as the non-redox physical preparation already did. Missing charge still fails; atom interpretation remains optional. Source balance, charge, rank, phase-scope and numerical acceptance checks are unchanged.

No citrate exception or inferred atom vector was added. Four focused doses for 50 mL 0.1 M citrate and 0.1 M H+ give pH 9.680652653831114, 6.39083863518415, 5.571659816466804 and 3.9594682711693348 at 0, 25, 50 and 100 mL. Positive citrate inventory remains 0.005 mol. Existing numerical residual checks pass, with no counterions. This is integration evidence, not an independent thermodynamic validation. Full residuals and source IDs: .local/component-discovery/citrate.json.

## Browser evidence

- H+ and OH- searches: exact source candidates selected; complete 107-point strong control prepared, with pH 7.00075 at 50 mL.
- Acetate and acetic-acid searches: both discoverable; acetate/H+ curve prepared, pH 8.87927 initially, 3.03308 at 50 mL and 1.47689 at 100 mL.
- Calcium/Ca and carbonate searches: exact component IDs verified in candidate attributes; combined admission gives the actual redox blocker above.
- Cr3+ search: selectable with redox hint; full preflight confirms deferred analytical redox.
- Citrate: selectable; full browser curve prepared, displayed endpoint/intermediate values agree with focused accepted samples above.
- Borate search at 390 x 844: both existing boric-acid and borate forms visible; dialog stays within viewport with scrolling.
- Physical HCl/NaOH remains a separate stock-definition path with reviewed reagent labels and charge-balanced stock contributions. H+ is not silently HCl and OH- is not NaOH.

## Validation and preservation

Focused tests initially passed 19/19; the final diagnostic-only guard passed the six candidate tests again. The guard prevents an ordinary basis-closure failure's source IDs being labelled redox. Full regression is run once because the analytical registry admission changed materially. Build, artifact audit and lint completed; lint retains only the pre-existing ExpandedPlot.jsx cleanup warning. Final counts and preservation results follow after regression completion.

No deployment or push.

### Final validation

Full regression: **753/753 passed**, zero failures/skips, 855.891 seconds; executed once. Production build passed (256 modules; existing large-chunk advisory), artifact audit passed, lint passed with zero errors and the existing ExpandedPlot.jsx:21 warning. Focused initial 19/19 and final candidate 6/6 passed.

SHA-256 comparison covered 1,026 pre-existing source/test/public/docs files: 1,018 unchanged, eight intended production files changed, none missing. All existing tests, thermodynamic assets, solver files and reference/golden evidence remain byte-identical to the task baseline. The test-generated closed-solids report was retained as .local/component-discovery/closed-solids-benchmark.run.json; the original report was restored byte-for-byte from the pre-run backup. New source modules, candidate tests and this report are additional files.

The shared compiler change is limited to selecting the authoritative charge registry and its missing-charge diagnostic; no equilibrium mathematics, constants, tolerances, acceptance criteria or phase policy changed. Physical browser HCl/NaOH control gave pH 1.00000 / 7.00075 / 12.52438 at 0 / 50 / 100 mL. Browser warning/error log was empty. Add component opens the searchable modal; Escape closes it with empty search. Browser evidence is recorded in .local/component-discovery/browser-checks.json.

Ready for review. No deployment or push performed.
