# General closed-reagent discovery: scientific and UI review

## Outcome

The Calculation mode gate now comes from a source-network audit. The existing reviewed Fe(II)/H2O2 addition sweep remains an explicit, immutable conditional profile. Other eligible selections use a general single-point closed calculation, with editable supplied amounts and derived pH/Eh. No generic addition sweep was introduced.

The general path is deliberately narrow in metadata coverage. It is not ready to accept arbitrary Wet Lab recipes. It can now explain the difference between a missing source identity, insufficient conservation metadata, a compiler-capacity limitation, conflicting reservoirs, and a numerically converged aqueous state that requires excluded gas/phase inventories.

## 1. Specialization audit

Classes: A = legitimate validation data; B = reusable machinery; C = temporary presentation/preparation specialization; D = scientific gate that must remain.

| Dependency | Class | Treatment |
| --- | --- | --- |
| Exact FeII/H2O2/H+/Cl-/water selection in `closedReagentReason` | A/C | Retained to identify the reviewed sweep profile; no longer the UI's universal availability decision. |
| Fixed 1 µmol/kg Fe, 0.01 acid, 0.010002 chloride and peroxide domain | A/D | Unchanged reviewed recipe and domain; not generalized to other inputs. |
| `fePeroxideScope` source IDs, component/reaction digests and exclusions | A/D | Unchanged. The reviewed profile must still reproduce its exact admitted set. |
| Source-bound elemental/charge metadata in that registry | A/B | Reused as seed identity metadata independent of a reagent pair. New carrier composition is transported through source equations. No new element identities are guessed. |
| Fe oxidation-state allocations | A | Retained for the reference. General discovery does not invent oxidation-state allocations or colors. |
| Source graph, source equations, exact electron cancellation, conservation compiler and solver | B/D | Reused; compiler and solver files unchanged. |
| Peroxide-only sweep coordinate, Fe fraction views and selected-sample readout | A/C | Preserved for the reviewed sweep. General calculations are single points, with generic carrier/reaction inspection. |
| Fe/peroxide-specific source-reaction explanation | A/B/C | Original explanation remains exact. General point UI lists all generated net redox reactions and signed extents, without selecting a named reagent pair. |
| Aqueous-only model, no gas/headspace or solid inventory | D | Explicit scope limitation, with discovered candidates and post-solve diagnostics. |

## 2. General source graph

`generalClosedReagents.js` starts with actual selected component IDs. The existing static seed identities cover FeII, FeIII, H2O2, H+, Cl-, water and formal electron. Electron, solvent and proton identities are available internally for algebra; no electron amount or imposed potential is accepted. A source-bound composition missing for a supplied form is a typed refusal, even if the ordinary database contains many reactions for it.

Source component names are used only as exact imported identity keys. They are never parsed as chemical formulas. An aqueous source record is reachable when all nonzero source terms are known. Its product composition and charge are transported by the signed stoichiometric coefficients. If a known product has exactly one unresolved source component, the inverse source equation can establish that component only when it produces nonnegative integer elemental counts and the independently stored charge. This repeats to closure.

All compatible phase records are then collected, including fractional-stoichiometry solid diagnostics. A fractional carrier is not silently admitted into the integer-only closed compiler. Missing/ambiguous metadata, unsupported source laws and compiler limits are blockers, not reasons to discard inconvenient reactions.

The full imported repository has a canonical, order-independent integrity fingerprint. This is an additional gate; it does not replace or weaken the old per-record checks. It pins source constants, coefficients and provenance without duplicating the database. New repository versions require a deliberate integrity/metadata review.

## 3. Conservation and automatic basis

Supplied forms define the preparation vector. They do not become independently conserved final oxidation-state totals. A structural elimination of the source reaction matrix chooses free physical coordinates, eliminates the formal electron first, and prefers supplied forms/proton/water as free coordinates.

The unchanged closed compiler then proves elemental and charge balance and checks that conservation spans the physical basis. With fixed unit solvent activity, non-H/O elemental inventories, solute H−2O and charge are the constraints. H and O may exchange with solvent only in the 2:1 water ratio. No finite water inventory is invented. Algebraically discovered source components may be supplied to the existing forward preparation with zero amount; this changes no physical inventory.

The actual recipe must be electroneutral with its explicit counterions. Fixed pH is never converted into supplied H+ when entering closed mode; the corresponding supplied amount starts at zero and is shown as an editable reagent amount.

## 4. Redox connectivity and ordinary chemistry

Electron-bearing source laws are identified from the explicit electron identity. The report retains source IDs, electron coefficients and composition-based family groupings. The existing compiler cancels unequal electron coefficients using integer common multiples, checks inverse/cycle-equivalent relations, and solves a single common potential. The new peroxide-only control contains four electron-bearing laws with 2, 2, 4 and 6 electron coefficients.

Ordinary source equations enter the same compiled equilibrium problem with zero electron coefficient. Acid/base, water/hydrolysis and complexation inspection categories describe source participation; a detailed mechanism is not inferred from a display formula. Ordinary mass-action residuals, redox laws and conserved inventories are checked simultaneously after solving. No sequential acid/base → redox → complexation approximation is introduced.

The structural closure check can reject an electron that cannot be eliminated or a physical basis not spanned by conserved inventories. A water-only graph does not label every selected inert component redox-active: a supplied non-special reagent must participate in an electron-bearing source law.

## 5. Phases, gases and counterions

Every reachable solid/gas is listed even though this solver path admits aqueous carriers only. Initial exclusions are conditional. After the aqueous solve, retained source equations and accepted activities give hypothetical pure-solid log saturation ratios and normalized gas log fugacities. These are not accepted solid amounts or gas inventories.

An excluded solid above the existing `saturatedSolidLogActivityTolerance` requires an unsupported phase model. A solid below that threshold is marked irrelevant at this particular accepted aqueous state; this is not a domain-wide claim. Unresolvable diagnostics are unavailable. A sum of normalized ideal-gas fugacities above the declared 1-bar reference requires a gas-inventory/headspace model and blocks publication of the candidate as an accepted general result. Below that bound the gas exclusion is still CONDITIONAL: a specified headspace could change the partition even at low fugacity. Neither rule predicts bubble kinetics or overpotential.

Counterions are not automatically spectators. The graph reports their possible ordinary, complexing, redox and phase-forming participation. In the unprofiled Fe/peroxide/chloride graph, chloride redox rows are included. That expanded graph exceeds the unchanged 32-species bound and is refused. The reviewed chloride-redox exclusions apply only inside the original versioned Fe profile. They are never a general chloride policy.

## 6. Scientific status contract

- **SUPPORTED** requires a complete admitted source/metadata network, successful structural conservation closure, supported boundary conditions and no relevant excluded model dimension. No unrestricted real-solution claim follows from this label. The present water-coupled examples have gas candidates and therefore remain conditional.
- **CONDITIONAL** permits the explicitly declared aqueous model after closure checks, while retaining phase/gas or reviewed profile exclusions. Successful numerical convergence is necessary but not sufficient.
- **UNSUPPORTED** includes missing seed identity metadata, changed source repository, incompatible reservoirs, ambiguous conservation, incomplete reviewed source sets, unclosed basis, compiler capacity overflow, unbalanced preparation, unsupported conditions, unresolved phase diagnostics or a required excluded phase/headspace model.

The discovery status, machine-readable reasons, included/excluded rows, families, ordinary chemistry, conservation rows and candidate phases are reusable inspection data. Runtime branding binds an audit to its repository and preparation; a copied or mismatched audit cannot authorize solving.

## 7. Exact Fe/H2O2 preservation

The new audit discovers the same 24 admitted source records and the same 20 exclusions under the reviewed profile. Preparation still uses the original `fePeroxideScope`, `prepareClosedReagents`, `solveClosedReagents` and `closedReagentSweep` implementations.

The new test compares the entire accepted reference object against the original path, including prepared input identity, network algebra, pH/pe/Eh, carrier amounts and generated reaction explanation. They are exactly equal. The original UI sweep tests also reproduce all 21 saved broad-sweep samples exactly and retain selected input/result identity. The existing dense sweep and earlier Step-3/4/5 checks remain in the regression.

## 8. Second real-source control and independent expectation

Candidates considered were an unbuffered peroxide/water system, full Fe/chloride redox chemistry, and a second metal system such as Cu/peroxide or V/Eu. The latter metal choices require additional seed conservation metadata or a broader phase/counterion review; the earlier V/Eu benchmark was intentionally reaction-restricted. Full Fe/chloride discovery exceeds current bounded compiler capacity. Unbuffered aqueous peroxide is the clean first independent generalization: no Fe, no chloride exclusion, no pair-specific scope or dose domain.

Before the production calculation, `generalClosedIndependent.js` derived the expected state directly from the retained raw source laws. Let u = log a(H+) + log a(e−). Then dissolved H2, H2O2, O2 and O3 are simple powers of 10 in u. Charge gives h² = Kw + Ka[H2O2], and H−2O conservation reduces to:

`[H2O2] + [HO2−] + 2[O2] + 3[O3] − [H2] = supplied peroxide`.

Bisection of this independent scalar equation at a supplied dose of 1e-6 mol/kg H2O gives:

| Quantity | Independent / production result |
| --- | --- |
| Derived pH | 7.00075 |
| Derived pe | 12.920992501084005 |
| Derived Eh, production SHE conversion | 0.7643975136460789 V |
| Dissolved O2 | 5e-7 mol/kg H2O |
| Residual H2O2 | 1.7119260563967557e-20 mol/kg H2O |
| Dissolved H2 | 1.1844452696684446e-43 mol/kg H2O |
| Dissolved O3 | 2.457282040283027e-36 mol/kg H2O |

pH and pe agree exactly; all seven solute concentrations agree within 1e-10 log-ratio. Production also passes its unchanged inventory, charge, ordinary-law and common-potential checks. Three gas candidates remain explicitly excluded, so this is an independently checked **conditional aqueous model**, not a gas-complete experimental peroxide decomposition claim. There is no new kinetic model.

## 9. Deliberate refusal controls

At 0.01 mol/kg supplied peroxide, the underlying aqueous solve converges, but the gas fugacity sum exceeds 1 bar. The new phase audit returns `gas-inventory-headspace-required`, marks the candidates required-but-unsupported and withholds an accepted general result. This is the key control showing that convergence does not imply model completeness.

Other tests refuse selected e-, Cu with missing source-bound composition metadata, a water/proton selection with no actual redox-active reagent, source drift, forged/mismatched audit, unsupported temperature/activity model, imposed Eh, negative or unbalanced recipes, reviewed-profile misuse and untruncated full Fe/chloride chemistry.

## 10. UI and sweep boundary

Selecting components triggers discovery in Calculation. The compact **Reaction network** inspection shows status, reasons, redox connections, ordinary reactions, candidates and exclusions. The mode becomes selectable when that audited scope permits preparation. The reviewed Fe selection retains its accepted fixed-recipe addition-sweep UI. Other eligible selections open a single-point form with actual supplied amounts and derived pH/Eh, residual carrier amounts, generic generated redox reactions and phase diagnostics. Unsupported outcomes explain the reason and never fall back to Ordinary.

Ordinary settings remain a separate mode and are restored explicitly. Generic sweeps, generic fraction axes and a new Wet Lab layout were not introduced. The existing Fe sweep and its plot/Beaker behavior remain unchanged.

## 11. Validation and preservation

- Baseline: 584/584 passed, no failures/skips/cancellations.
- Focused generalized discovery, independent control, failures and original Fe UI/chemistry: 31/31 passed.
- Full regression: **594/594 passed**, zero failures, cancellations, skips or todo; 495.800 seconds (`general-closed-regression.txt`). All existing closed-redox, imposed-Eh, ordinary/speciation, Fe/Cu, Pourbaix and golden tests are included. The final affected-path run after the reverse-connection refusal safeguard also passed 31/31.
- Production build and artifact audit passed; `dist` contains the new UI. Native Vite config loading and in-process Node test isolation avoid sandbox child-process restrictions.
- Lint: zero errors; one pre-existing `ExpandedPlot.jsx` effect-cleanup warning.
- React server-render checks pass for the enabled generic form, derived-output wording, candidate-gas inspection and explicit unsupported metadata reason. Interactive browser verification could not complete: the browser tool timed out attaching a webview twice. This is a verification limitation, not a claimed browser pass.
- 370 pre-existing files were fingerprinted. Only `closedReagentSetup.js` (audit before the unchanged reviewed sweep) and `CalculationWorkspace.jsx` changed. All 368 other fingerprinted files are unchanged, including solver equations/tolerances, thermodynamics, provenance, original Step-3/4/5 evidence/tests, existing output mathematics and analysis contracts. New modules/scripts/tests are additive.

Detailed evidence: `general-closed-independent.json`, `general-closed-validation.json`, `general-closed-hashes.json`, and the accompanying test/build/audit logs. No deployment or push was performed.

## 12. Wet Lab readiness and remaining blockers

This is a general, fail-closed architecture with limited authoritative seed metadata, not an arbitrary-reagent product. Composition propagation is source-backed, but no new oxidation-state labels are manufactured from it. New component identities need reviewed elemental/charge metadata and source-integrity review. A larger or fractional network may exceed the unchanged bounded compiler. General solid equilibrium, gas/headspace inventories, nonideal activity models, finite-volume mixing and kinetics remain outside this path.

Fe(II)/dichromate is not automatically trustworthy: the required Cr component metadata and oxygen/redox allocation context, hydrolysis/complexation coverage, counterion redox, potential Cr/Fe solid phases, gas relevance and compiler capacity all need an explicit audit and independent benchmark. Merely finding thermodynamic reactions is insufficient. Uranium was not used. Additional reviewed seed identities should extend the general architecture; adding another pair allowlist is not the intended path.
