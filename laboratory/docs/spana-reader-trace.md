# Phase 3 reader trace (recorded before parser implementation)

Official repository: https://github.com/ignasi-p/eq-diagr
Pinned source revision: c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7.

## Exact specification sources

- `LibDataBase/src/lib/database/LibDB.java`, `getBinComplex` (lines 633–739): Java DataInputStream big-endian doubles, modified-UTF strings; six-slot and variable-count component layouts; analytic and lookup branches. `readElemFileBinary` (398–489): element UTF, int component count, repeated component UTF / description UTF. ELB associations are not complete elemental compositions (explicit CN/EDTA examples at 386–395).
- `LibDataBase/src/lib/database/Complex.java`: constants EMPTY=-999999.9, ANALYTIC=-888888.8, LOOKUP=-777777.7, NDIM=6; six analytic coefficients; lookup grid documentation; `constant` means logK at 25 °C. `reactionText` renders signed reactants forming one product; `deltaToA`, `logKatTpSat`, `logKatTandP` describe downstream transformations which this importer will not execute. The LOOKUP comment has a typo; use the executable constant -777777.7.
- `LibDataBase/src/lib/database/References.java`, `readRefsFile`: UTF-8 Java Properties.load(Reader). `splitRefs`: comma/semicolon/plus separators, bracketed text is a separate intact token. `isRefThere`: exact then case-insensitive lookup.
- `LibChemDiagr/src/lib/common/Util.java`, `chargeOf`, `getLastCharExcludingChargeAndSignPosition`, `isGas`, `isLiquid`, `isSolid`, `isWater`: source naming conventions. `(l)` belongs to the upstream broad solid/condensed class; Adam's explicit phase model will call it liquid and retain the original suffix.
- `LibChemDiagr/src/lib/kemi/haltaFall/Factor.java`, `readSITdataFiles`, `readSITdata`: current reader consumes species pairs and one epsilon value until END, with optional NoDefaults. Older second/third sections are commented out in this revision.
- `LibDataBase/src/lib/database/LibSearch.java`: database search calls the above readers. No alternate format is to be inferred from a filename.

## External evidence

The user's archive is `C:\Users\adamb\OneDrive\Desktop\Eq-Diagr_Java.zip` with prefix `Eq-Diagr/`. It contains Reactions.db, Reactions.elb, References.txt, SIT-coefficients.dta, LICENSE, README.txt, DataBase.jar, DataMaintenance.jar and lib/. Source archive will remain unchanged and read-only. Java manifests report Java 1.8.0_251 build tooling. LibDataBase.jar contains the official Complex/LibDB/References classes; LibChemDiagr.jar contains Factor.

Legacy comparison: `C:\Users\adamb\OneDrive\Desktop\Complex fr Medusa\COMPLEX.DB` starts `08 00 28 43 48 33 29 32 48 67 ...`; COMPLEX.ELB starts `65 2d 01 00 ...`. These do not match the current Java string/count representation. They will be identified as incompatible legacy-looking files, not reverse-engineered or parsed under an assumed layout. Parsing of Reactions will establish which supported Java layout it uses; filenames alone do not establish this.

The supplied SIT text explicitly describes three END-terminated sections and E1/E2/E3 with temperature in Kelvin. This differs from current Factor.readSITdata. Preserve original text, report mismatch, implement no SIT evaluation or default coefficients.

The bundled LICENSE is GNU GPL version 3; source headers permit GPL-3.0-or-later. This is software licensing evidence, not an independently established permission to redistribute every cited dataset. Generated real data must remain local and outside the static build by default.
