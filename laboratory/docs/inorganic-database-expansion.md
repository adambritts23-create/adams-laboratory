# Inorganic database expansion

Updated 2026-10-06. Calculation and analytical acid/base Wet Lab share source selection. The separate Godot chemistry bridge is unchanged.

## Independent database comparison

In Calculation, expand **Compare databases on one graph** after loading two collections. Run an ordinary imposed-pH sweep independently against each collection, then select a species for overlaid log concentrations/solid amounts or total fractions. A uses a solid line; B uses a dashed line. The normal result and active collection are unchanged. Export SVG or the two numerical runs. Input changes invalidate the comparison; cancellation is supported between solves. Missing species and failed points are gaps, not zero values.

Initial scope is automatic species/phase selection with ideal activities at 25 °C. Fixed analytical NH3/NH4+ and CO3(2−)/HCO3− totals map between source coordinates because pH is imposed. Free activities are not mapped this way. Missing components fail explicitly; grids, derived-redox, closed-reagent and specialized solubility modes are not silently substituted. Reaction differences list native equations, constants and citations; different bases are identified, and this inspection is not a causal attribution or an automatic database merge.

## Optional organic collection

The database selector now offers **Load PSI/Nagra + organic complexes** as a separate collection. Manual file import has an **Include organic complexes** checkbox. The original inorganic collection is retained. This supersedes the earlier organic exclusion for citrate, oxalate and EDTA only.

The optional import admits 104 additional reactions from the pinned official file (1,259 reactions total), including ligand protonation, actinide complexes, competing ions and source solids. Sixteen methane/isosaccharinate records remain excluded; 60 unsupported records remain rejected. CDTA is not included. Original reaction text and constants are preserved; source aliases Cit, Edta and Oxa are expanded to explicit C6H5O7, C10H12N2O8 and C2O4 compositions for atom/charge balance and source-component metadata. No log K values are guessed or averaged.

Spana already includes UO2(CH3COO)+, UO2(CH3COO)2 and UO2(CH3COO)3− (source formation log K 3.1, 5.5 and 6.9), as well as uranyl citrate and EDTA. Select Spana and search for `UO2(CH3COO)` to inspect acetate reactions. These native records have not been copied into PSI or relabelled as independently verified.

Validation checks all imported reaction balances/support, unchanged native constants and equations, ligand availability in Wet Lab, and converged aqueous uranyl–citrate, uranyl–oxalate and uranyl–EDTA calculations at pH 5.3, 0.001 mol/kg U and 0.01 mol/kg ligand. These are integration checks, not experimental validation. Source conditions and ideal-activity limitations still apply. The NEA [organic ligand review](https://www.oecd-nea.org/dbtdb/pubs/vol9-organic-ligands.pdf) provides further reviewed data for oxalate, citrate, EDTA and isosaccharinate; it has not been imported independently.

## Using the sources

Open Database in Calculation, Wet Lab or the Database workspace. Load PSI/Nagra 2020 or Spana + uranium reactions. Original Spana remains available separately. Changing collections clears affected results. Save the library from the Database workspace to retain imported sources and trial values across sessions.

PSI/Nagra PHREEQC v2-1 (2026-02-02) is recognized by SHA-256 `da0f984daceb9d67b37508deced89510d37df6ce374938a55b215e677ae5e4ce`. The importer admits 1,155 reactions, omits 55 master identities, excludes 123 organic reactions and reports 60 unsupported formulas. The local official file is gitignored; it is not distributed as source code. Public bundling requires a separate redistribution-rights check. Users can import their own official file from https://www.psi.ch/en/les/database.

Reactions retain original equations, constants, citations and explicit basis transformations. Different constants require a source choice; they are never averaged. Source selection isolates component registries as well as reactions. Combined-source Wet Lab remains unavailable pending an audit. Physical/redox Wet Lab and SIT activity corrections are not enabled for PSI/Nagra.

## Uranium extension in both databases

The extension adds missing entries to each source without overwriting original records. Spana already supplies HO2-, so its existing value is retained. PSI receives the hydroperoxide dissociation reaction as well.

| Entry | Status and provenance |
|---|---|
| Studtite UO2(O2)(H2O)4(s) | Dissolution log K = -2.7 ± 0.2; reverse formation +2.7. Gimenez et al. 2014, https://doi.org/10.1016/j.apgeochem.2014.07.004 |
| UO2(O2)(OH)2 2- | Meca et al. 2011 Eq. 1, log beta 28.1 ± 0.1; rebased using four OH- dissociations. https://doi.org/10.1039/c0dt01672a |
| UO2(O2)2(OH)2 4- | Same paper Eq. 2, log beta 36.8 ± 0.2; rebased using six OH- dissociations. |
| HO2- | Same paper explicit pKa = 11.6; PSI extension only. |
| AUC (NH4)4UO2(CO3)3(s) | Provisional conditional estimate from ORNL CF-60-5-114 §1.1.1 (1960), https://doi.org/10.2172/4179323. Mean dissolved uranium 1.4175 g/L at 2 M total ammonium salts. Assume [NH4+] = 4 M and all dissolved U is uranyl tricarbonate: Ksp ≈ 1.525, log Ksp ≈ +0.183 for AUC → 4 NH4+ + UO2(CO3)3⁴−. This is our estimate, NOT a published thermodynamic constant. Formation log K = selected-source tricarbonate log beta − conditional log Ksp, plus source ammonium basis conversion. High-salt activity, protonation and molarity/molality corrections omitted; table temperature unspecified, 25 °C assumed. |
| Metastudtite UO2(O2)(H2O)2(s) | Distinct hydrate; constant pending. Studtite's value is not reused. |
| ADU nominal (NH4)2U2O7(s) | Explicit hypothetical stoichiometric surrogate; trial constant required. |
| ADU candidates 2UO3·NH3·3H2O and UO3·NH3·H2O | Reported compositions, not established universal ADU identities. Trial constants required. https://pmc.ncbi.nlm.nih.gov/articles/PMC11872519/ |

Use **Test AUC / ADU / peroxide / UF6** to view equations and enter experimental constants. AUC is first in the editor and enabled by default with its provisional estimate. Database search accepts AUC, ADU and descriptive names as well as formulas. Unknown constants remain null and excluded from calculation until supplied. Trial values are visibly labelled and export with the library; original literature provenance remains available. Clear a trial field to disable an unknown phase, or restore the known literature value. Fit one ADU candidate at a time: the literature describes variable, often multiphase material rather than a single definite ADU phase.

Constants are for the displayed formation reaction, not bare Ksp. PSI uses NH4+/HCO3- coordinates; Spana uses NH3/CO3 2-. Trial values cannot be transferred unchanged between these equations. Known constants are explicitly rebased using each source's own auxiliary reactions. The ideal 25 C approximation does not implement peroxide decomposition, radiolysis, kinetics or peroxo-carbonate complexes. Uncertainties are retained as metadata but are not propagated by the solver.

## UF6 hydrolysed analytical feed

Wet Lab offers `UF6 · hydrolysed feed (experimental)` under U and F. The inventory conversion assumes complete hydrolysis in excess liquid water: UF6 + 2 H2O -> UO2F2 + 4 HF. One mole supplies one uranyl, six fluoride and four proton equivalents; subsequent speciation uses the selected database. This is not a UF6(aq) equilibrium or kinetic model. Source for the overall reaction: https://pmc.ncbi.nlm.nih.gov/articles/PMC9056877/ (water-vapour study; the liquid-feed completion assumption is explicit).

## Validation and numerical recovery

Tests cover atom/charge balance, reaction directions, basis conversion, trial enable/reset, record tampering, and source-preserving Spana/PSI selection. Studtite is checked against its independent dissolution law. UF6 analytical Wet Lab doses match Calculation in both sources.

The reported 1 mol/kg each NH4+, carbonate and uranyl pH sweep failed at pH 3.36 when a precipitating assemblage started from a poorly conditioned estimate. Solid retries now use a converged aqueous estimate when available; positive ordinary multi-total systems have a bounded coordinate mass-balance initializer as a fallback. All existing Newton, mass balance, saturation and nonnegative-solid acceptance criteria are unchanged. The full 51-point pH 0-14 regression now converges. Numerical convergence at these high concentrations does not validate the ideal-activity approximation.

Other possible sources remain under investigation: USGS PHREEQC collections, OECD NEA electronic TDB and ThermoChimie. Organic scope is limited to the optional collection described above.

## Spana-preferred combined collection

`Combine / manage databases → Combine · prefer Spana` builds a separate selectable collection. It retains the Spana records and its uranium extension unchanged, including any trial values in the loaded Spana extension. PSI-only reactions are translated to the existing Spana coordinates using explicit Spana auxiliary reactions and log-K addition. Formula aliases for citrate, EDTA, oxalate and arsenous acid are recognized. Missing or ambiguous transformations are reported and omitted. Constants are never averaged. This is a provisional mixed-source model, not a claim of thermodynamic consistency across source evaluations; use ideal 25 °C calculations and inspect provenance.

The inorganic import currently adds 482 reactions, retains Spana for 584 matches and omits 89 unsupported coordinate cases. Build from the loaded organic PSI collection to include eligible organic supplements. Rebuild after editing a source. Source validation reconstructs supplementary equations and checks the intact primary collection. Calculation, analytical acid/base Wet Lab and Batch share the resulting collection. Other redox/physical Wet Lab contracts are unchanged.

## Reaction Engineering MVP

The Batch tab stores named immutable sample snapshots. Add a reagent solution, equilibrate, filter into filtrate and retained-solids snapshots, and continue either branch. An accepted acid/base Wet Lab beaker can be transferred directly. Imported phase exclusions are retained. Each sample is pinned to its database fingerprint; a database change preserves history but blocks incompatible continuation.

Inventories are source-component moles, including signed analytical proton equivalents. Equilibrium uses the ordinary constructor and accepted solver results. Filtration partitions those inventories using accepted solid stoichiometry. Addition and filtration balance tables compare input and output moles; equilibrium balance compares supplied amounts to solver-reconstructed totals. Masses of solids are displayed when formula weights are available.

This is an ideal analytical model at 25 °C: unspecified countercharge, additive volumes, 1 model kg water/L solution, unit water activity. It is not a full elemental solvent/density balance. Filtration assumes complete solid removal and no retained liquid. No kinetics, gas exchange, washing, entrainment, CSTR flow calculation or optimization is included. History remains in the mounted workspace until the page closes; JSON export is an audit record, not an executable replay/import format.

Validation: `tests/spana-preferred.test.js`, `tests/batch-experiment.test.js`, and existing database-library tests cover primary-record preservation, basis conversion and tamper rejection, supported Wet Lab metadata, precipitation, filtering, resuspension, phase-scope preservation, source mismatch rejection and component conservation. Browser checks cover combined selection, the full silver-chloride branch workflow, and accepted Wet Lab transfer.
