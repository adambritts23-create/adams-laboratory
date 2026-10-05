import fs from 'node:fs'
import crypto from 'node:crypto'
import {discovery,ids} from './fePeroxideAudit.js'
const v=JSON.parse(fs.readFileSync('docs/closed-redox-step5-validation.json'))
const expected=JSON.parse(fs.readFileSync('docs/closed-redox-step5-independent-points.json'))
const fmt=x=>Number(x).toPrecision(15),main=v.controls[0].accepted
const independentState=state=>main.inspection.carriers.reduce((n,c)=>n+(c.allocation?.states.find(s=>s.oxidationState===state)?.count??0)*expected[0].amounts[c.id],0)
const independentExtent=expected[0].peroxideSupplied-expected[0].amounts[ids.P]-expected[0].amounts['spana:2ac52a30213c9288:175307']
const half=main.inspection.redistribution.reactions.find(r=>r.sourceIds.some(id=>id.endsWith(':152743')))
const all=[...v.sweep.samples,...v.dense.samples],excluded=all.flatMap(s=>s.exclusions)
const maxSolid=Math.max(...excluded.filter(s=>s.phase==='solid').map(s=>s.logQ)),maxGas=Math.max(...excluded.filter(s=>s.phase==='gas').map(s=>s.logQ))
const chlorineCounts={82236:2,82394:1,82497:1,82605:1,82715:1,159101:1,159212:1}
const chlorineCapacity={82236:2,82394:2,82497:5,82605:4,82715:6,159101:2,159212:4}
const excludedCl=Math.max(...all.map(s=>s.exclusions.filter(x=>x.phase==='aqueous').reduce((n,x)=>n+chlorineCounts[Number(x.id.split(':').at(-1))]*10**x.logQ,0)))
const excludedCapacity=Math.max(...all.map(s=>s.exclusions.filter(x=>x.phase==='aqueous').reduce((n,x)=>n+chlorineCapacity[Number(x.id.split(':').at(-1))]*10**x.logQ,0)))
const before=JSON.parse(fs.readFileSync('docs/closed-redox-step5-before-hashes.json'))
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const comparison=Object.entries(before).map(([path,previous])=>({path,previous,current:hash(path),unchanged:previous===hash(path)}))
const added=['src/thermodynamics/closedReagents.js','src/thermodynamics/scopes/fePeroxide.js','src/calculations/closedReagentSweep.js'].map(path=>({path,sha256:hash(path)}))
fs.writeFileSync('docs/closed-redox-step5-hashes.json',JSON.stringify({comparison,added},null,2))
const row=r=>`| ${r.id} | ${r.name} = ${r.metadata.effectiveSourceReaction.components.map(t=>`${t.coefficient} ${t.name}`).join(' + ')} | ${r.logK} | ${r.temperatureReference+' K'} | ${r.citation.replace(/\r?\n/g,' ')} |`
const text=`# Closed redox Step 5 — automatic Fe(II)/peroxide discovery and addition benchmark

## Decision and scope

The bounded backend benchmark is supported by the imported reaction data and passes the independent calculation. Actual reagents discover 24 admitted source reactions, internally introduce the formal electron connection, and solve through the unchanged closed compiler and point solver. No selected e−, imposed pH/pe/Eh, electron inventory, special Fe oxidation algorithm, or source constant changes are used.

The accepted candidate is **1e−6 mol/kg total Fe supplied as Fe2+, 0.01 mol/kg supplied H+, 0.010002 mol/kg chloride, and 2.5e−7 mol/kg H2O2**, at ideal 25 °C, declared 1 bar and unit solvent-water activity. The addition domain is 0–1e−6 mol/kg H2O2 at the same Fe/counterion inventory. H+ is a supplied analytical reagent, not a fixed activity; pH is derived. This corresponds to an idealized FeCl2/acid preparation with explicit countercharge, not a finite-volume mixing recipe.

The initially investigated 1e−3 mol/kg Fe preparation was rejected: the aqueous result supersaturated excluded Fe solids. Its old probe files and explicitly named rejected-1mM artifacts are retained as rejected evidence, not accepted references. The independent calculation was repeated for the lower-total candidate before its production result was accepted.

The versioned metadata scope gates Fe, Cl and H−2O inventories. Its arithmetic allowance is 128 machine epsilons times the summed absolute inventory terms, solely for equivalent preparation arithmetic. It does not change solver or scientific acceptance tolerances. Source/component digests, complete reaction-set presence and static atom/charge identities are checked. Missing, additional or modified admitted source records invalidate this scope.

## Imported sources and exact admitted network

Every reaction below uses the imported formation convention: product = sum of the signed source components, with log activity(product) = logK + sum(coeff × log activity(component)). Negative coefficients therefore appear on the opposite chemical side. Electron/proton/water coefficients are shown explicitly. All records are aqueous in this scope. Imported thermal metadata is preserved, but this benchmark uses only the audited 298.15 K constants; source reference pressure is unspecified. Full original provenance, raw source tokens and thermodynamic metadata are retained in closed-redox-step5-sources.json.

| Source reaction ID | Imported formation relation | log K | Reference temperature | Imported provenance |
|---|---|---:|---|---|
${discovery.rows.map(row).join('\n')}

Both inverse Fe source records are retained for cycle consistency; they are not two independent chemical processes. The 28 identities include formal electron and solvent water; there are 26 modeled physical aqueous carriers. Fe chloride/hydrolysis complexes, the Fe hydrolysis dimer, ferrate, HCl, OH−, HO2− and dissolved H2/O2/O3 are admitted. Fe oxidation allocations are explicit source-identity metadata (existing reviewed Fe assignments plus explicit chloride assignments), not inferred from names.

## Exclusions and phase audit

All solids and gas phases are excluded from the equilibrium model; nine compatible Fe solids and four gas source records are diagnosed using the accepted activities. Fe0.932O(cr) is a diagnostic source-law evaluation only, not a broadened canonical/closed compiler phase. Seven chloride redox records are explicitly excluded. Their source identities and reasons are retained in every preparation discovery report.

| Source ID | Carrier | Phase | Exclusion |
|---|---|---|---|
${discovery.excluded.map(r=>`| ${r.id} | ${r.name} | ${r.phase} | ${r.phase==='aqueous'?'Conditional counterion-redox exclusion':'Phase not admitted'} |`).join('\n')}

Across all 38 sampled states, maximum hypothetical pure-solid log saturation is **${fmt(maxSolid)}**; maximum individual hypothetical gas log fugacity is **${fmt(maxGas)}** under the source unit-standard convention. No checked solid saturates. These gas diagnostics are not a headspace material balance and do not imply gas kinetics or measured partial pressures. Maximum excluded chlorine inventory evaluated at the restricted solution is **${fmt(excludedCl)} mol/kg**, and its electron-capacity contribution is **${fmt(excludedCapacity)} mol/kg**. Both are below the existing 2e−14 mol/kg absolute balance floor. This is a bounded perturbation diagnostic, not a complete chlorine-redox solution. Domain restrictions and conditional labeling remain necessary; neither zero excluded inventory nor general phase stability is claimed.

## Independent thermodynamic derivation

Imported relations:

- Fe2+ = Fe3+ + e−, logK = 13.051.
- H2O2 = −2H+ −2e− +2H2O, logK = −59.61.

Reverse the peroxide formation relation and twice the Fe reduction relation to obtain:

**2 Fe2+ + H2O2 + 2 H+ → 2 Fe3+ + 2 H2O**

**logK = 59.61 − 2×13.051 = 33.508**, with two electrons cancelling exactly.

The independently relevant oxygen redistribution is **2 H2O2 → O2(aq) + 2 H2O**, logK = 2×59.61 −85.988 = **33.232**. Accordingly excess supplied peroxide cannot be assumed to remain as peroxide.

Let F = 1e−6, C = 0.010002, A = 0.01 and D = supplied peroxide, all mol/kg. The independent equations are:

- sum Fe atoms × carrier molality = F;
- sum Cl atoms × carrier molality = C;
- sum charge × carrier molality = 0;
- sum (H atoms −2 O atoms) × carrier molality = A−2D;
- solvent a(H2O)=1; solvent exchange closes H and O with one shared water transfer.

Equivalently, electron capacity B = Q −(H−2O) −2Fe +Cl = 2D. Electron is not counted as a material species. The independent script uses raw formation laws: Fe2+/Fe3+ = 10^(13.051−pe), H2O2 = 10^(−59.61−2log aH+ +2pe). At trial H+, pe and Cl−, the Fe balance is a stable quadratic including the Fe dimer. Nested scalar bracketed balances solve chloride, electron capacity and charge. This calculation imports no production equilibrium solver, closed compiler or reaction-basis transformer. Saved expected values precede acceptance of the production controls.

## Expected versus production equilibrium

Amounts are mol/kg H2O; Fe states include all admitted component-weighted carriers, not just the free ions.

| Quantity at D=2.5e−7 | Independent | Production |
|---|---:|---:|
| Fe(II), all carriers | ${fmt(independentState(2))} | ${fmt(main.inspection.elements.Fe.states[2])} |
| Fe(III), all carriers | ${fmt(independentState(3))} | ${fmt(main.inspection.elements.Fe.states[3])} |
| Fe/peroxide source-basis extent | ${fmt(independentExtent)} | ${fmt(half.extent)} |
| pH | ${fmt(expected[0].pH)} | ${fmt(main.inspection.pH)} |
| pe | ${fmt(expected[0].pe)} | ${fmt(main.inspection.pe)} |
| Eh, V vs SHE | ${fmt(expected[0].Eh)} | ${fmt(main.inspection.Eh)} |
| Free H+ | ${fmt(expected[0].amounts[ids.H])} | ${fmt(main.inspection.carriers.find(s=>s.id===ids.H).amount)} |
| Residual H2O2 | ${fmt(expected[0].amounts[ids.P])} | ${fmt(main.inspection.carriers.find(s=>s.id===ids.P).amount)} |

Total Fe = ${fmt(main.inspection.elements.Fe.total)}; final Fe(II) = ${fmt(main.inspection.elements.Fe.states[2])}; Fe(III) = ${fmt(main.inspection.elements.Fe.states[3])}; Fe(VI) = ${fmt(main.inspection.elements.Fe.states[6])}. No inventory was rounded to complete conversion. The full independent/production carrier comparison is in the evidence JSON; maximum log10-molality discrepancy over the three control doses is ${fmt(Math.max(...v.controls.map(c=>c.independentMaxLogDifference)))}.

| Carrier | Accepted molality at benchmark |
|---|---:|
${main.inspection.carriers.map(s=>`| ${s.name} | ${fmt(s.amount)} |`).join('\n')}

## Generated reaction explanation and extent

The production result exposes reactants/products, integer coefficients, logK, source IDs/multipliers, half-reaction oxidation/reduction direction and citations, electron count, signed extent and units. It is generated from the existing compiler cancellation algebra, not by inspecting final concentrations to invent an equation.

Independently, its extent is D minus residual H2O2 minus HO2− (the sole admitted ordinary peroxide-family deprotonation product). This follows from the peroxide material coordinate of the source basis. The Fe/peroxide net basis reaction above has extent **${fmt(half.extent)} mol/kg** at the benchmark. Fe(II) is oxidized to Fe(III); peroxide oxygen is reduced toward solvent water in that source combination. All ordinary-reaction and redox basis extents together reconstruct every accepted solute change and solvent transfer within the existing inventory limits. Floating-point signed trace extents are retained rather than interpreted as kinetic turnover.

These are **algebraic source-reaction-basis extents**, not unique physical pathways or rates. At excess oxidant the Fe/peroxide basis extent exceeds half the total Fe because a negative Fe/O2 coupled-reaction extent cancels the additional formal Fe turnover. The combined redistribution gives oxygen production without claiming a catalytic mechanism. No Fenton kinetics, radical intermediates, induction times or reaction rates are modeled.

## Invariance, laws and equivalent controls

Both supported bases (FeII/peroxide/H/Cl/water and FeIII/peroxide/H/Cl/water), both equivalent preparation histories and both source orders pass. The alternative history converts a partial source-balanced amount before preparation and conserves Fe, Cl, charge and H−2O. All combinations return the same final composition; the eight-way combinations are regression tested.

At D=2.5e−7, 5e−7 and 1e−6, a separate generic source-basis transformation prepares **FeIII/H+/e−/Cl−/H2O**, fixes H+ and e− to the closed result's derived values, and keeps the same Fe/Cl analytical totals and water convention. The ordinary point solver reproduces every carrier. Maximum controlled-vs-closed log10-molality discrepancy: ${fmt(Math.max(...v.controls.map(c=>c.controlledMaxLogDifference)))}. This is conditional endpoint equivalence; the controlled problem replaces proton/electron balance with reservoirs and is never labeled closed redox. No analytical Fe/counterion total was altered to obtain agreement; matching composition also reproduces the closed charge/proton-water invariants.

Every accepted sample passes existing physical inventory, common-potential, ordinary mass-action, net-reaction and water-transfer checks. Across the sampled sweep, maximum absolute physical inventory residual is ${fmt(Math.max(...all.flatMap(s=>s.checks.inventories.map(x=>Math.abs(x.residual)))))} mol/kg. Maximum ordinary log-law residual is ${fmt(Math.max(...all.flatMap(s=>s.checks.nonRedoxReactions.map(x=>Math.abs(x.residual)))))}. The unchanged mass-action tolerance is 1e−10; individual physical balance limits propagate the existing component tolerances plus roundoff and are preserved with each sample. At the benchmark the Fe limit is 4.842170943040401e−14, H−2O limit 1.068421709430404e−12 and charge limit 2.068621709430404e−12 mol/kg. None were enlarged.

## General addition-sweep integration — B, small extension

The existing analytical-total axis provides range/coordinate validation. Its ordinary sweep runner cannot itself reconstruct closed reagent conservation/preparation at every coordinate. The new reusable closed-reagent runner therefore uses those same axis rules but independently rediscovers/prepares/solves each dose through the unchanged closed solver. It has no Fe-specific titration mathematics, imposed potential, continuation seed or interpolated failures.

Broad sweep: **21/21 accepted**, D=0..1e−6. Local sweep: **17/17 accepted**, D=4.999e−7..5.001e−7. The nominal requirement **5e−7** is derived as total Fe × peroxide coefficient / FeII coefficient from the generated net reaction; it is not a switch in the solver.

| Added H2O2 | Final FeII | Final FeIII | Residual H2O2 | Dissolved O2 | Derived pH | Derived Eh / V |
|---:|---:|---:|---:|---:|---:|---:|
${v.controls.map(c=>{const i=c.accepted.inspection;return `| ${fmt(c.dose)} | ${fmt(i.elements.Fe.states[2])} | ${fmt(i.elements.Fe.states[3])} | ${fmt(i.carriers.find(s=>s.id===ids.P).amount)} | ${fmt(i.carriers.find(s=>s.name==='O2').amount)} | ${fmt(i.pH)} | ${fmt(i.Eh)} |`}).join('\n')}

The oxidant-limited benchmark is nearly 50/50 FeII/FeIII. At nominal equivalence a finite FeII remainder and dissolved oxygen coexist. In the excess region the extra oxygen inventory goes primarily into dissolved O2; no textbook completion rule is imposed. Each sample retains exact system/input/result identities, source scope and request identity, carrier molalities, component-weighted Fe state inventory, derived pH/pe/Eh and acceptedSolids=[]. Fe state fractions can be read as state inventory / conserved Fe. The data contract is ready for later inspection/Beaker adapters; **no public plot/Beaker or Wet Lab interface is added** in this phase. The selected-sample accessor returns the exact accepted object and rejects stale revision/scope, failed samples, incomplete sweeps and forged results. Out-of-domain additions stay explicit gaps; invalid negative doses/reversed ranges are rejected.

## Preservation, verification and readiness

${comparison.filter(r=>r.unchanged).length}/${comparison.length} pre-existing source/public files match their before-phase SHA256 values. Added production files only: closedReagents.js (discovery/result contract), scopes/fePeroxide.js (versioned bounded source metadata), and closedReagentSweep.js (independent addition runner). No existing solver/compiler, UI, thermodynamic data, Fe/Cu references, fractions/solubility mathematics or source constants changed. No research .local dependency was introduced. Scripts and tests use the normal imported public data artifact.

Full regression: **575/575 pass**, zero failures/cancellations/skips/todo (427.533 seconds). Focused Step-5 tests: **13/13 pass**, including the final missing-source scope gate. All previous closed-redox benchmarks, Fe/Cu exact references, imposed-Eh/Pourbaix behavior and five official goldens remain intact. Production build and artifact audit pass. Lint: zero errors, one pre-existing ExpandedPlot hooks warning. The existing bundle-size advisory remains. Node tests used --experimental-test-isolation=none because this sandbox rejects the child-process spawn used by default test isolation; no tests were skipped. Detailed logs are retained beside this report.

Ready for a **restricted internal Mix-two-beakers prototype using the reviewed preparation contract**, not a general experimental simulation or a publicly validated mixing tool. Before a real mixing UI, define solvent-mass/volume dilution and reagent recipes/counterions, scope/phase/gas warnings, failure presentation and adapters to existing plots/Beaker. General concentrations, precipitates, finite headspace, nonideal activities, finite-water depletion, kinetics and radicals remain outside this benchmark. Independent evidence here is a separate mathematical implementation using the same imported source constants; it is not a new external experimental or HALTAFALL validation campaign.

No deployment or push. Stop for review.
`
fs.writeFileSync('docs/closed-redox-step5.md',text)
console.log({unchanged:comparison.filter(r=>r.unchanged).length,total:comparison.length,excludedCl,excludedCapacity,maxSolid,maxGas})
