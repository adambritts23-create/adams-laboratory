# MEDUSA/SPANA component metadata audit

Decision: STOP at the source-authority boundary. No production metadata, source, tests, thermodynamic data, solver or dist files changed. Audit adapters and reports only. No deployment or push.

## A. Actual source representation

Inspected retained upstream revision c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7 and the accepted byte-identical input files in .local/hydra-basis-audit/input. Reactions.db SHA256 2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a; Reactions.elb SHA256 aebefcdc660d09937aa4d3416cee9dedb159ab7b060769b542627f98ca299592.

Reactions.elb contains 86 element blocks and 168 distinct component names. Each block is an element UTF string, an integer number of entries, then component-name and description UTF pairs. There is no atom-count vector or separate numeric charge field. Element associations are discovery links: acetate is linked to C, nitrate to N, sulfate to S, carbonate to C; they do not provide complete H/O membership, much less multiplicities. Water is under XX. AddDataElem explicitly documents a three-string tuple: element, component formula/name, description.

Evidence: [LibDB.java, binary element reader](../../.local/hydra-basis-audit/upstream/LibDataBase/src/lib/database/LibDB.java#L398), [AddDataElem.java](../../.local/hydra-basis-audit/upstream/LibDataBase/src/lib/database/AddDataElem.java#L38), Adam's src/thermodynamics/importers/spana/binary.js parseElb and components.js normalizeComponents. Source component IDs are generated from exact source names using component: plus encodeURIComponent, not discovered oxidation states.

Reactions.db stores product name, thermodynamic quantities, named component/coefficient pairs, reference and comment. Both the six-slot legacy layout (including its separate proton coefficient) and variable-count layout are read. Coefficients are signed floating-point source values. No independent atomic-composition field exists in the inspected binary schema. There are 4,444 binary reactions; the UI's 4,445 identities include one separately appended application water identity (convert.js).

## B. How charge balance works

The actual call chain is FrameAddData → Complex.isChargeBalanced() → Util.chargeOf(). Util interprets the source name's charge suffix: H+, Na +, CO3-2, SO4 2-, X+10, X 10+, repeated signs and the documented sign variants. This is a defined charge grammar, not a molecular formula parser. It does not count atoms or interpret ligand aliases.

Complex starts with the product's parsed charge and subtracts each coefficient times the reactant's parsed charge. Its check accepts absolute residual <0.001, skips coefficients with magnitude <0.0001 and treats @ deletion entries specially. These are upstream editor rules, not Adam's solver or physical electroneutrality tolerances; none were copied into production.

Evidence: [Util.java:63](../../.local/hydra-basis-audit/upstream/LibChemDiagr/src/lib/common/Util.java#L63), [Complex.java:1387](../../.local/hydra-basis-audit/upstream/LibDataBase/src/lib/database/Complex.java#L1387), [FrameAddData.java:3772](../../.local/hydra-basis-audit/upstream/LibDataBase/src/lib/database/FrameAddData.java#L3772). The retained code also permits warning/confirmation paths for saving an unbalanced reaction; the message is not a certificate of atom balance.

The official, existing compiled Java library was called directly for all 168 actual component names. Adam's existing sourceCharge importer agrees on all 168. This is coverage of the actual catalog, not proof that Adam's smaller parser matches every conceivable legacy name.

The Java unit-level demonstration constructs CH3COO− + H+ → HAc: true. Changing the H+ coefficient to 2 returns false. HAc needs no expanded atom formula for this check. No editor UI was added.

Upstream project: https://github.com/ignasi-p/eq-diagr . The inspected source is the retained pinned revision, not an assertion about every other MEDUSA release or database.

## C. Components versus products

The hypothesis is correct conditionally: trusted component atom vectors and charges can be transported through source coefficients to recover a product. Adam already implements this in the closed-network machinery. Independent metadata for all 4,445 displayed identities is unnecessary.

It does not create the missing component vectors. For an unanchored component such as nitrate, a source equation defines product composition relative to nitrate; it does not independently tell us that nitrate contains one N and three O. The same issue remains for unfamiliar aliases, organometallic component names and historical notation. Inferring an atom grammar solely because formulas look recognizable would exceed the requested authority requirement.

## D–F. Coverage, special cases and pin comparison

| Category | Count |
|---|---:|
| Active authoritative source component identities | 168 |
| Charge outputs recovered using official source grammar | 168 |
| Additional atom vectors established from source schema/grammar | 0 |
| Existing reviewed vectors (including special coordinates) | 15 |
| Existing reviewed ordinary vectors | 12 |
| Special coordinates H+, e−, H2O | 3 |
| Forms accepted by current physical metadata layer | 13 |
| Components lacking a reviewed atom vector | 153 |
| Newly unlocked physical forms | 0 |

The 13 current physical metadata forms include the 12 ordinary vectors plus the existing special supplied H+ row. H+ is not treated as an ordinary element or fixed-pH instruction; its physical/proton bookkeeping is left as implemented. Electron has charge −1 and an empty atom vector; it is not a supplied material row. Water has H2O composition but remains solvent, not an ionic solute option. Neither e− nor water appears in the ionic catalog. No special-coordinate semantics changed.

Every existing networkComposition entry was compared, including componentMetadata's underlying entries: 15/15 charges agree exactly with official Java output. Atom-vector comparison against an independent source vector is unavailable, because the source does not supply those vectors. The report deliberately does not claim a nonexistent independent 15/15 atom verification. Existing reviewed metadata remains untouched.

| Source identity | Source name | Official charge | Existing reviewed atom vector | Physical metadata status |
|---|---|---:|---|---|
| `component:H%2B` | H+ | 1 | {"H":1} | Special proton row, existing behavior |
| `component:e-` | e- | -1 | {} | Unavailable as physical row |
| `component:H2O` | H2O | 0 | {"H":2,"O":1} | Unavailable as physical row |
| `component:Na%2B` | Na+ | 1 | {"Na":1} | Metadata available; scope separate |
| `component:Cl-` | Cl- | -1 | {"Cl":1} | Metadata available; scope separate |
| `component:Cr%203%2B` | Cr 3+ | 3 | {"Cr":1} | Metadata available; scope separate |
| `component:Cu%202%2B` | Cu 2+ | 2 | Not established | Unavailable as physical row |
| `component:NO3-` | NO3- | -1 | Not established | Unavailable as physical row |
| `component:SO4%202-` | SO4 2- | -2 | Not established | Unavailable as physical row |
| `component:CO3%202-` | CO3 2- | -2 | Not established | Unavailable as physical row |
| `component:CH3COO-` | CH3COO- | -1 | {"C":2,"H":3,"O":2} | Metadata available; scope separate |

Complete source associations, all pin values and all 153 unresolved identities/reasons are in results.json. In particular Cu2+, NO3−, sulfate and carbonate charge are established; their atom vectors were not authorized by the inspected source mechanism. 'Not established' here is a provenance finding, not a claim that their chemical formulas are scientifically unknown.

## G. Cu2+ / NO3− preflights

Re-ran only lightweight preflights for balanced nominal Cu2+/2Cl− and Na+/NO3− setups. Both remain UNAVAILABLE at the existing authoritative composition/charge metadata check. The missing fact is the trusted atom vector, not inability to parse the charge. No nitrate redox/gas audit was bypassed, and no downstream chemistry-support claim is made because that stage was not reached.

## H. Product propagation checks

Four actual records passed exact atom-vector and charge assertions using existing trusted component metadata and source coefficients, with no product display-formula parser:

- Acid/base, byte 79298: CH3COOH = H+ + CH3COO− → C2 H4 O2, charge 0.
- Association, byte 135557: FeCl+2 = Fe3+ + Cl− → Fe1 Cl1, charge +2.
- Pure solid, byte 133739: Fe2O3(cr) = 2 Fe3+ − 6 H+ + 3 H2O → Fe2 O3, charge 0.
- Redox, byte 126584: Fe3+ = Fe2+ − e− → Fe1, charge +3; matches the existing reviewed Fe3+ vector.

These validate transport of known vectors; they are not independent evidence for unknown basis compositions.

## I. Remaining limit and safe next step

No general authoritative atom-composition model was established in the inspected component format, reaction format or associated component/editor utilities. Therefore the requested broad production unlock is not scientifically justified under this phase's rules. The required missing input is an authoritative identity-to-composition catalog with atom multiplicities (including aliases/special notation), or an independently documented and validated component atom grammar. Once supplied, it can be bound at import by source identity and compared against current pins; products can continue to inherit vectors from source coefficients. Adding only Cu/nitrate or writing an unverified generic formula parser would not solve the stated task.

## Validation and reproduction

- Official Java adapter: ComponentChargeAudit.java, output official-charge.txt.
- Focused audit: run node docs/component-metadata-audit/audit.mjs from project root after generating official-charge.txt. Assertions passed; output focused.txt; structured evidence results.json.
- 168 official charge comparisons; all 15 current charge pins; 4 product atom/charge checks; balanced/unbalanced reaction demonstration; 2 explicit unchanged preflight refusals.
- No equilibrium sweep, browser chemistry campaign, independent reference regeneration, full regression, build or deployment. Production was not changed, so none was necessary. Last full repository baseline remains 686/686; previous ionic-builder focused result remains 36/36, not re-run here.

Stopped for review as requested when sufficient source authority could not be established.
