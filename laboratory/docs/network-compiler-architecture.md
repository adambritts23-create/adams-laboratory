# Source-derived equilibrium compiler — architecture audit (before implementation)

Baseline: calculation-workspace compaction, 644/644 passed, build/artifact passed. No new baseline full run is needed; focused tests precede one final regression.

| Path | Existing preparation and limits |
|---|---|
| Ordinary Calculation / acetate | compatibility.discoverReactionSet uses exact selected component requirements; prepareSessionPoint admits selected source rows, checks standard state and direct-basis dependencies, then prepareChemicalSystem. Signed proton totals are analytical coordinates, not physical charged recipes. Acetate requires no Na/K. |
| Imposed Eh | imposedEh and userPourbaix reuse source reaction-basis preparation, then impose electron activity per point. This is not a closed electron inventory. |
| Pourbaix | source-family discovery, canonical/general reaction basis and existing point/assemblage solver; reviewed Fe/Cu contracts and generic carrier fallback remain separate. |
| Reviewed Fe/peroxide | closedReagents uses immutable scope fingerprints and deliberately excluded chloride-redox rows. Exactly 24 source equations; cannot replace with unrestricted discovery and claim identical scope. |
| General closed | generalClosedReagents discovers forward and single-unknown inverse source connectivity; componentMetadata seeds propagate elemental/charge allocations; physicalBasis eliminates e first; closedRedoxNetwork validates conservation, rank and cycles. Complete-source fingerprint required. A redox-family gate currently excludes non-redox acid/base. |
| Wet Lab | reviewed volumetric recipes -> analytical inventories -> ordinary preparation/point solver; recipe/volume/state contracts are independent of general closed preparation. No extension in this phase. |

Duplicated admission occurs between direct-component discovery and general closed closure. It reflects genuinely different boundary contracts as well as historical separate implementations. A public compiler facade can make the requested boundary explicit and expose one provenance/diagnostic contract while retaining the proven preparation engines. It must not silently change ordinary analytical controls into electroneutral physical recipes.

Current capacity: general closed 64 source species/reactions and 16 basis coordinates; ordinary shared basis defaults to 32. Existing probes cover 27-species Eu, 36-species unrestricted Fe/peroxide, 47-species Fe/Eu and 55-species Fe/Cr. Do not raise guards in this phase.

Metadata: only 12 component identities have source-bound atom/charge seeds. Source element associations are not compositions. Product allocation is transported through signed source laws, never parsed from display formulas. Closed source integrity, row digests and prepared object branding prevent provenance drift. Exact source names are identity keys; ambiguous names/IDs require refusal.

Phase boundary: closed source discovery lists excluded solid/gas laws. solveGeneralClosed computes hypothetical phase activities after aqueous convergence, refuses supersaturated solids or excessive gas fugacity, and retains only a diagnostic candidate. Gas headspace remains unsolved even below that threshold; results remain conditional. Ordinary aqueous preparation needs the same explicit limitation and a post-solve phase check before claiming a complete equilibrium.

Plan: introduce compileEquilibriumNetwork with explicit closed-physical and analytical-component boundaries, shared source/provenance inspection, typed refusal and branded preparation. Reuse existing closed graph/compiler without chemistry-name branches; support ordinary direct aqueous source networks with authoritative seed/transport and existing basis algebra. Retain reviewed scopes as explicit input profiles. Integrate validated closed compilation into the existing Calculation action only. Independent raw-law controls: preserved Fe/peroxide, Fe/Eu two-family, Eu non-Fe, acetate signed totals; Fe/chromate phase refusal. Do not unify Wet Lab/Pourbaix now.

The supplied Nuclear Nightshift image is retained as a user asset; no placement was requested and it will not be inserted into the scientific workspace. Remove only the Calculation beaker portrait.
