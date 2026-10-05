# Phase 3 — Spana investigation and import report

Date: 2026-09-05. This phase imports source data for inspection and system-definition architecture. It does not validate or calculate equilibrium.

## 1–2. External files and exact locations

The supplied virtual folder description resolves to the actual archive `C:\Users\adamb\OneDrive\Desktop\Eq-Diagr_Java.zip`. Its entry prefix is `Eq-Diagr/`. In the table, `!` separates the archive path above from the exact entry path; these are archive members, not extracted Windows folders.

| Archive entry | Inspection |
| --- | --- |
| `!Eq-Diagr/Reactions.db` | Full binary read and conversion; 392,837 bytes |
| `!Eq-Diagr/Reactions.elb` | Full binary read; 3,469 bytes |
| `!Eq-Diagr/References.txt` | Full UTF-8 text parse; 17,310 bytes |
| `!Eq-Diagr/SIT-coefficients.dta` | Full text retained and format investigated; 14,738 bytes |
| `!Eq-Diagr/LICENSE` | GPL version 3 text read; 35,819 bytes |
| `!Eq-Diagr/README.txt` | Installation/source context read; 385 bytes |
| `!Eq-Diagr/DataBase.jar` | Manifest inspected, not executed; 423,551 bytes |
| `!Eq-Diagr/DataMaintenance.jar` | Manifest inspected, not executed; 190,912 bytes |
| `!Eq-Diagr/lib/LibDataBase.jar` | Class inventory inspected: Complex, LibDB, References, Version; 460,929 bytes |
| `!Eq-Diagr/lib/LibChemDiagr.jar` | Class inventory includes Factor; 463,955 bytes |
| `!Eq-Diagr/lib/README-lib.txt` | Library context read |
| `!Eq-Diagr/lib/AbsoluteLayout.jar`, `!Eq-Diagr/lib/jvectClipboard-1.3.jar` | Inventory only, no code inspection |

Manifests identify Java 1.8.0_251/Ant 1.10.4 build tooling. No installed executable was launched. No whole installation was copied into the project.

Legacy comparison read the first 128 bytes only of `C:\Users\adamb\OneDrive\Desktop\Complex fr Medusa\COMPLEX.DB` and `C:\Users\adamb\OneDrive\Desktop\Complex fr Medusa\COMPLEX.ELB`. Other copies under `C:\Users\adamb\OneDrive\Desktop\Eq-Calcs_32\` were discovered but not interpreted.

The source files were not moved, renamed, overwritten or reorganized. The import manifest records hashes and confirms unchanged source input after conversion. Key SHA-256 values:

| File | SHA-256 |
| --- | --- |
| Reactions.db | `2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a` |
| Reactions.elb | `aebefcdc660d09937aa4d3416cee9dedb159ab7b060769b542627f98ca299592` |
| References.txt | `0b3a2a7c46f39409670a6005e2537bfe98adf31f21d05193a45eb2cb51276ddf` |
| SIT-coefficients.dta | `cbcf223b25c351001881bdc7b6b1e8edaf868d4d18007edfc7ec93ab3a7538b0` |

## 3. Official specification and methods

Primary source: [official eq-diagr repository](https://github.com/ignasi-p/eq-diagr), pinned to revision `c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7`. Source was read before implementing the parser; see [reader trace](spana-reader-trace.md). Source downloads remained in the temporary directory `C:\Users\adamb\AppData\Local\Temp\adams-eq-diagr-source`, outside the bundle.

| Official file/class | Specification role |
| --- | --- |
| [LibDB.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/LibDataBase/src/lib/database/LibDB.java) | `getBinComplex`, `readElemFileBinary`, `setElementNames`: DB, ELB and identity catalog |
| [Complex.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/LibDataBase/src/lib/database/Complex.java) | Sentinel constants, reaction representation, `reactionText`, `deltaToA`, `logKatTpSat`, `logKatTandP` |
| [References.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/LibDataBase/src/lib/database/References.java) | `readRefsFile`, `splitRefs`, `isRefThere` |
| [LibSearch.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/LibDataBase/src/lib/database/LibSearch.java) | Reader use during database search |
| [Util.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/LibChemDiagr/src/lib/common/Util.java) | `chargeOf`, charge/sign helper, `isGas`, `isLiquid`, `isSolid`, `isWater` naming conventions |
| [Factor.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/LibChemDiagr/src/lib/kemi/haltaFall/Factor.java) | `readSITdataFiles`, `readSITdata`; activity-model boundary |
| [DBSearch.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/DataBase/src/database/DBSearch.java) | `searchComplexes`, `scanDataBases`, `getOneComplex`; selected components and redox closure |
| DataBase `FrameDBmain.java` | Component selection context |
| DataMaintenance `DataMaintenance.java` | Conversion paths use the same official readers |
| [Chem.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/LibChemDiagr/src/lib/kemi/chem/Chem.java) | `ChemSystem`, `ChemConcs`, `Diagr`, `DiagrConcs` input/output definitions |
| [ReadChemSyst.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/LibChemDiagr/src/lib/kemi/readWriteDataFiles/ReadChemSyst.java) | `readChemSystAndPlotInfo`: chemical system plus diagram constraints |
| [Select_Diagram.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/Spana/src/spana/Select_Diagram.java) | Diagram selection, concentration mode conversion, `updateUseEhCheckBox` |
| [SED.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/SED/src/simpleEquilibriumDiagrams/SED.java) | `doCalculations`, sweep preparation and per-point `haltaCalc` |
| [Plot.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/SED/src/simpleEquilibriumDiagrams/Plot.java) | `storePlotData`, `drawPlot`: result transformations |
| [Predom.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/Predom/src/predominanceAreaDiagrams/Predom.java), PredomData.java | Two-variable calls and `findTopSpecies` classification |
| [EC.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/EC/src/ec/EC.java) | `main`, `readConcentrations`: non-plot calculation interface |
| [HaltaFall.java](https://github.com/ignasi-p/eq-diagr/blob/c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7/LibChemDiagr/src/lib/kemi/haltaFall/HaltaFall.java) | Constructor, `haltaCalc`, `haltaCancel`: solver boundary |

## 4. DB format

The Java reader consumes consecutive unframed records using big-endian DataInputStream values. Strings use Java modified UTF-8 with a two-byte byte-length prefix, not ordinary UTF-8. There is no global format/version header or original record identifier in this layout.

A record starts with product-name UTF, logK double, then a double selecting the thermal representation:

- Ordinary branch: deltaH followed by deltaCp doubles; units kJ/mol and J/(mol K). Missing numeric sentinel is -999999.9.
- Analytic branch: marker -888888.8, maximum temperature double and six coefficient doubles.
- Lookup branch: marker -777777.7, maximum temperature double; after references/comments, float rows of lengths 9, 11, 14, 14, 14. Complex documents a temperature/pressure grid. The executable LOOKUP constant resolves a typo in its comment.

Next comes a UTF field. A positive integer selects a variable number of component-name UTF/coefficient double pairs. Otherwise it is the first name of six fixed slots, followed by a separate proton double. The official reader adds H+ when absent and the proton field is materially nonzero. Raw slots and separate proton count are preserved alongside the effective reaction. References UTF and comment UTF follow.

Coefficients are signed source-basis coefficients forming one named product. `Complex.constant` is log10 formation K at 25 °C; imported temperatureReference is 298.15 K. No reference-pressure scalar is stored, so pressureReference stays null. Upstream derives temperature/pressure validity and analytic forms; this importer does not execute those transformations. It preserves raw thermal metadata and any analytic/lookup arrays without evaluation.

Phase and charge are naming conventions, not separate binary fields. The importer handles documented charge suffixes and aqueous/default, gas, solid and explicit liquid suffixes while retaining the original name. This is not a general chemical formula or oxidation parser. Upstream groups liquids into a broad condensed/solid predicate; the app retains its separate liquid phase.

Upstream catches EOFException and returns null, including mid-record EOF. The importer instead flags truncation with its offset and stops; it does not guess the next unframed record boundary. Analytic/lookup source bounds are represented in the reader; raw data is not promoted into validated extrapolation rules.

## 5. ELB format and components

Repeated element UTF, signed big-endian int32 component count, then component-name UTF / description UTF pairs. Associations may be many-to-many. They are not atom counts: the official source explicitly discusses CN and EDTA cases. Original descriptions, duplicate associations, order and offsets are preserved.

The supplied file has 86 blocks and 168 distinct exact component names. It includes special e− and XX blocks; XX is an unknown/linkage label, not an invented chemical element. H₂O is recognized explicitly as solvent. Multiple Fe, Cr, Cu and ligand forms remain separate choices. Species oxidation numbers are not inferred from these descriptions.

The source supports deletion/overlay conventions. This phase retains and diagnoses directives but does not apply database overlay merging. No such directives were needed by the imported source file.

## 6. References

References.readRefsFile uses UTF-8 Java Properties.load(Reader): escapes, continuations, property separators and Unicode escapes matter. Reference codes within reaction records split at commas, semicolons and plus signs while bracketed segments stay intact. Resolution tries exact then case-insensitive matches; ambiguous case variants remain unresolved rather than guessed.

145 bibliography entries were parsed. Both original abbreviated codes and resolved text are retained. Twenty unresolved token occurrences are bracketed annotations/estimates rather than unresolved ordinary bibliographic keys. They remain preserved with unavailable resolution. Original reference text and raw reaction reference fields remain available for audit.

## 7. SIT

The supplied text describes three END-terminated sections, slash comments and species names linked by source naming conventions:

1. Cation/anion pairs with E1, E2, E3 and epsilon = E1 + E2*T + E3*T*T, T in kelvin.
2. Neutral species versus background electrolyte, without distinguishing the salt, again E1/E2/E3.
3. Neutral self-interaction. Its header calls the quantity epsilon; the supplied example still contains three numeric values.

The pinned current Factor.readSITdata reads a pair and one epsilon, with optional NoDefaults; older section handling is commented out. The supplied file and current reader therefore differ. The full text and provenance are preserved with an explicit version-mismatch warning. No coefficient parsing into an activity model, default coefficients or SIT calculation is implemented.

## 8. Current versus legacy

All 4,444 Reactions records conform to the Java variable-count layout. The parser also supports the older six-slot branch documented in the same Java reader. This is not a claim that every historical COMPLEX.DB uses that branch.

The inspected legacy COMPLEX.DB begins `08 00 28 43 48 33 29 32 48 67`; its ELB begins `65 2d 01 00`. These do not match the current Java representation. The official project describes the older Visual Basic MEDUSA/HYDRA lineage separately. No undocumented legacy format was reverse-engineered, and no legacy import is claimed. Layout is detected per Java record, while source revision and importer version are recorded separately from an unavailable embedded database version.

## 9. Static application architecture

Read-only local source → Node conversion → validated local JSON snapshot → browser local file read → ThermodynamicRepository → UI. No backend was introduced. This preserves static GitHub Pages deployment while acknowledging browser filesystem permissions. Binary parsing stays outside React. The artifact is ignored under `.local/`, not placed in public/ or imported by the production bundle.

## 10. Files added and changed

Added in Phase 3:

- `scripts/spana-source.js`, `scripts/import-spana.js`.
- `src/thermodynamics/importers/spana/binary.js`, `references.js`, `names.js`, `normalize.js`, `convert.js`, `components.js`, `spana.test.js`.
- `src/thermodynamics/snapshot.js`.
- `src/chemistry/components.js`.
- `src/data/elementIdentities.js`.
- `src/components/DatabaseSource.jsx`, `src/components/ComponentSelector.jsx`.
- `docs/spana-reader-trace.md`, `docs/phase3-report.md`.

Changed in Phase 3:

- `.gitignore`, `package.json`, `README.md`.
- `src/App.jsx`, `src/App.css`.
- `src/components/ElementSelector.jsx`, `AvailableSpecies.jsx`, `SpeciesDetails.jsx`, `SystemDefinition.jsx`, `RedoxControls.jsx`.
- `src/chemistry/system.js`, `validation.js`, `system.test.js`.
- `src/thermodynamics/schema.js`, `validation.js`, `repository.js`, `importers/pipeline.js`.
- `docs/scientific-architecture.md`, `docs/importers.md`.

Generated outputs: latest `.local/spana-components.json`; earlier development snapshots `.local/spana.json` and `.local/spana-final.json` remain local. `dist/` was rebuilt by Vite. No dependency migration or deployment change was made. This inventory describes this phase, not historical Phase 1/2 edits; the working folder has no Git metadata for a baseline diff.

## 11–12. Repository and provenance

Repository supports elements, component identity/element queries, direct species-by-components queries, species-by-source, ID, text, phase and genuinely known oxidation metadata. Returned records remain separated from storage access. The demo remains the default source; loading a snapshot replaces the active catalog and starts a fresh draft. Only an explicitly labeled application water identity is added to the real catalog, with no demo solutes mixed in.

Each source record retains sourceDatabase/file, source-format label, pinned source revision, importer version/date, database hash, byte offset/length, raw bytes, original name, ordered reaction coefficients, original logK, original reference code, resolved citation, thermal branch and diagnostics. IDs derived from offsets are labeled as such. Missing embedded IDs, pressure reference, product composition and oxidation states stay null. The normalized logK retains the real source value even when solver metadata is incomplete; solverReady remains false. Full input hashes, ELB metadata, reference text and SIT text accompany the artifact.

## 13–14. Results and limitations

| Result | Count |
| --- | ---: |
| Parsed/accepted source reactions | 4,444 |
| Rejected source records | 0 |
| Aqueous | 3,438 |
| Solid | 962 |
| Gas | 40 |
| Source liquid | 4 |
| Additional application solvent identity | 1 |
| Source variable-count layout | 4,444 |
| Source deltaH/deltaCp representation | 4,444 |
| ELB blocks / component choices | 86 / 168 |
| Bibliography entries | 145 |
| Unresolved reference token occurrences | 20 |
| Structural validation warning occurrences | 8,888 |

The two routine warnings per source record concern unknown composition and incomplete solver metadata; accepted does not mean solver-ready. Analytic, lookup and six-slot support is fixture-tested but absent from this particular database. Other record-level notes retain missing links or reference annotations. No source constants were invented or numerically transformed.

Unsupported work includes legacy binary decoding, multi-database overlays, basis independence checks, duplicate reconciliation, Spana redox closure, transformed constants, atom-count reconstruction and numerical activity/temperature/pressure evaluation. Charge handling follows tested naming conventions, not arbitrary formula recognition. Raw bytes remain the audit source if an untested naming case appears.

## 15–16. Validation

`npm test`: 23 passing, zero failures/skips in the verified local run. Tests cover modified UTF (including NUL/surrogates and malformed input), variable/six-slot reactions and proton handling, analytic and lookup arrays, truncation, ELB associations/descriptions, Properties escapes/continuations, reference matching, phase/charge conventions, normalized values, repository queries, ZIP errors, unknown linkage, explicit component selection and electron-gated redox reset. Existing domain tests remain active; the previous no-electron redox expectation was updated to enforce the requested domain rule, not bypass validation.

The local integration test reparses all imported raw records and compares source names, logK and coefficients, plus representative real repository queries. This is source-backed preservation and byte round-trip testing, not independent numerical validation against an executed Java solver. Synthetic thermal fixtures do not claim measured thermodynamic data.

`npm run build` and `npm run lint` pass. Production JavaScript is about 231 kB before gzip, confirming the roughly 36 MB local database is not bundled. Browser checks loaded the real snapshot, inspected aqueous/solid UO2CO3 and source provenance, exercised component filtering, enabled redox with e− and disabled/reset it on removal. The Calculate path reports unavailable solver/incomplete metadata; no result is produced. No browser console errors were observed.

## 17. Licensing

The supplied LICENSE is GNU GPL version 3; inspected official source headers permit GPL-3.0-or-later. This is evidence about software/source licensing. It does not independently establish redistribution rights for every database datum or literature entry. Bibliographic sources are retained per record, and unresolved annotations remain explicit. No whole installation or official Java implementation was bundled, and no real database was published. Assess source reuse obligations and dataset redistribution separately before a solver port or public data release. The application’s license has not been reclassified by this report.

## 18. Diagram and solver definitions

Chem.Diagr stores plotType, compX, compY, compMain, Eh display choice and ranges. Plot types are: 0 predominance, 1 fraction, 2 log solubility, 3 log concentration, 4 relative log activity, 5 calculated pe/Eh, 6 calculated pH, 7 log activity, 8 hydrogen affinity.

These modes are more than visual styles. Plot.storePlotData/drawPlot derive quantities from equilibrium outputs: fractions use component-weighted species concentration divided by component total; log solubility uses dissolved component amounts; log concentration uses species C; relative activity uses logA differences; calculated pH/pe use negative proton/electron log activity. Predom calls the solver across a two-variable grid and classifies the dominant species/phase for compMain.

ChemSystem supplies component/species counts, stoichiometry matrix a, global formation constants lBeta, solids and special flags. ChemConcs.kh=1 supplies total concentration and solves activities; kh=2 supplies log activity and obtains totals. Outputs include C, logA, solub, logf, ionicStrCalc and diagnostics. HaltaFall consumes ChemSystem plus a FactorInterface and exposes haltaCalc/haltaCancel. EC demonstrates calculation without rendering. This boundary motivates separate future calculation and visualization objects.

## 19. Sweeps

Chem.DiagrConcs stores per-component hur modes: 1 T fixed total, 2 TV varied total, 3 LTV varied log total, 4 LA fixed log activity, 5 LAV varied log activity, with cLow/cHigh. SED prepares sampled inputs, exponentiates LTV values, supplies tot or logA at each point and calls HaltaFall. Predom varies two inputs before solving and classifying.

Select_Diagram converts pH/pe controls to negative log activity; Eh uses the temperature-dependent factor R*ln(10)*(T+273.15)/F, so log(a_e) = -Eh/factor. No conversion is executed in this phase.

The described iodine example (log concentration versus Eh, fixed pH 2, 25 °C, total 1, fixed ionic strength, Eh 0.3–2 V) maps conceptually to plotType 3, electron LAV, proton LA=-2 and iodine T. A future implementation must state and validate total-concentration units rather than silently equate source molality and app mol/L. This mapping generates no iodine calculation or curve.

## 20. Electron capability

DBSearch detects selected e− and performs repeated database scans and reaction substitutions to discover redox-related basis choices. Its transformations also combine constants. This importer preserves those reactions but deliberately does not implement that search closure.

Spana detects an electron component to enable Eh-related controls and checks proton/electron availability for Pourbaix. In Adam’s Laboratory, selected explicit source electron identity drives `getSystemCapabilities`; UI controls and domain validation use it. Selecting an element or filtering oxidation states does not grant redox capability. Removing e− clears the redox draft. This prepares future fixed pe/Eh and sweeps without pretending to calculate redox chemistry.

## 21–22. Deliberately unimplemented and next phase

No solver, activity coefficients, thermodynamic interpolation, mass-balance calculation, equilibrium result, plotted curve, Pourbaix boundary, 3D surface or optimization has been implemented. The source importer is not a solver. Basis choices do not certify an independent basis.

Phase 4 should first add a live LaboratorySession and declarative CalculationDefinition, then resolve basis/units/special-component semantics against official reference systems. Establish independent Java comparison cases and numerical tolerances before implementing a point solver. Report the approach before that implementation. Only validated results should later drive sweeps, diagrams, Pourbaix, multidimensional slices and AnalysisEngine. The full plan and data-flow responsibilities are in [scientific architecture](scientific-architecture.md).
