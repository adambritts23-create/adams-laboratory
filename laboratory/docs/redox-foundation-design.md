# Redox foundation: pre-change audit and bounded design

Audit conducted against the 221-test aqueous-fraction working tree before production edits.

The direct basis stores signed formation coefficients. Electron and solvent free concentrations are suppressed, but their log activities enter every mass-action row. Fixed kh=2 controls are not Newton unknowns and have null balance residuals. Legacy kh=1 electron bookkeeping is not a physical electron inventory and is not suitable for externally imposed potential. Charge neutrality is explicitly not imposed; no spectator ions are inserted.

Numerical pre-change probe, bundled Mn2+/MnO4-, total Mn=0.001 mol/kg-H2O, pH=7: pe=10 gives Mn2+=0.001, MnO4-=3.162277660168379e-20; pe=13.3 gives both 0.0005 (maximum absolute balance residual 1.3010426069826053e-18); pe=16 gives Mn2+=3.162277660168276e-17, MnO4-=0.0009999999999999673. Mass-action residuals zero, electron/proton balance residuals null. Thus no new nonlinear formulation is required for externally fixed potential.

MnO4- formation row: Mn2+ - 8 H+ - 5 e- + 4 H2O, logBeta=-122.5. Charge: 2-8+5=-1. Ratio R=10^(-122.5+8 pH+5 pe), free Mn=T/(1+R). Equal aqueous contributions: pe=(122.5-8 pH)/5, slope -1.6 pe/pH. This is a deliberately restricted two-species equilibrium, not a completeness claim.

Existing Eh conversion uses Eh=ln(10)RT/F pe, volts vs SHE, with R=8.31446261815324 and F=96485.3321233100184; temperature in kelvin. Conversion is temperature dependent but stored-constant solver domain remains 25 C only. No standard-potential correction or reference-electrode offset is invented.

Blockers: no enforced externally-controlled electron policy, explicit multi-solid electron rejection, no validated redox assemblage tests, no complete phase/species selection, and existing inventory-dominance maps are not thermodynamic Pourbaix classification. Existing grid already samples independent pH/Eh coordinates but does not establish these scientific prerequisites.

Bounded implementation: opt-in fixed-electron-v1 policy, requiring explicit proton/electron/water basis, fixed H/e activities and ordinary totals. Preserve all legacy paths. Allow existing bounded multi-solid enumeration only with this policy; unchanged Newton/complementarity checks. Validate MnO2(s) and Mn(cr) as competing candidates using independent saturation and inventory reconstruction. No public Pourbaix enablement. A point foundation may stop before 2D classification because a two-species restriction is insufficient for a trustworthy complete Mn map.

Water: bundled H2(g) has logBeta=0 for 2H+ +2e-; O2(g) has logBeta=-83.09 for -4H+ -4e- +2H2O. For unit gas activity and water activity at 25 C they imply pe=-pH and pe=83.09/4-pH. Gas fugacity/equilibrium is rejected by production preparation, and temperature-adjusted constants are unavailable in the supported solver domain. Therefore no water lines are drawn.
