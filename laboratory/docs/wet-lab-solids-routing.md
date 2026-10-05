# Routing audit before production edits
Ordinary Calculation: prepareSessionPoint -> prepareChemicalSystem (bounded-multisolid-v1 for automatic candidates) -> solvePoint. Repository compatibility discovers candidates; explicit source coefficients map analytical coordinates. Accepted results contain coupled aqueous concentrations, dissolved component amounts and candidate solid amounts/saturations.

Closed physical redox: compileEquilibriumNetwork(closed-physical) -> discoverGeneralClosed -> prepareGeneralClosed -> prepareClosedPureSolids -> solveClosedPureSolids -> closed reagent solver -> shared solvePoint closed-pure-solid-active-set-v1. This wrapper has a bounded reviewed Fe/Cr phase list and requires an electron-balance network; it cannot wrap a non-redox preparation directly.

Physical non-redox: nonRedoxCoordinates transforms source-identified formula-unit moles to signed proton and ordinary totals per model solvent mass. nonRedoxScope refuses connected aqueous redox. Only aqueous scope was admitted; direct source solids/gases were excluded and checked after solving. Required excluded phases withheld acceptance. No coupled solid candidate reached the shared solver.

Wet Lab: prepareWetLabScope and each independent dose requested that aqueous-only boundary. Historical explicitly restricted chloride acid/base retains its reviewed adapter. General states project exact system/input/result through acceptedState, totalFractionState and aqueousFractionState. Apparatus previously drew liquid only. Total Fractions already consumes source-weighted accepted solids; aqueous speciation retains its dissolved denominator. acceptedState.visual applies the established precipitateVisual threshold.

Narrow connection: permit non-redox aqueous + pure-solids, transport neutral source-derived solid compositions, prepare existing bounded-multisolid system and select existing coupled active-set policy. Retain excluded gas and unevaluated electron-dependent phase disclosures. No changes to redox whitelist or solver math.

Control candidate: reviewed boric acid and NaOH solutions. Establish pointwise parity with an independently prepared ordinary Calculation basis before enabling Wet Lab scope. Fixed-pH FeIII is not equivalent to closed physical conditions.
