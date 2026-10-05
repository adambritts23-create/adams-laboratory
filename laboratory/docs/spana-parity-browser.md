# Browser checks — 2026-09-17

Development URL: http://127.0.0.1:5173/adambritts-site/laboratory/

## Wet Lab
- Wet Lab workspace, Titration experiment button present.
- Desktop default viewport 1265×712: apparatus on left with burette editor above sample editor; curve/results to right.
- Before preparation: explicit setup preview, no equilibrium/pH claimed.
- HCl 0.1 mol/L × 50 mL; NaOH 0.1 mol/L × 100 mL loaded: accepted curve available.
- Selected 50 mL point: pH 7.00075, remaining burette 50 mL, beaker 100 mL.
- Switched graph to Log concentrations: same selected point; H+/OH- both log -7.00075.
- Edited sample volume to 60: old accepted result removed, stale experiment message, setup preview and result placeholder restored.
- 390×844 mobile viewport: stacked layout, input controls remain within width; viewport reset afterwards.

## Calculation
- Loaded Fe example, switched to ordinary log-concentration diagram, selected Fe total/log10 X -5…-3, 51 points.
- Analytical H total 0, fixed Eh -0.2 V vs SHE, ideal25C. No counterion selected.
- UI labels correctly identify calculated pH / imposed fixed Eh.
- Plot completed 51/51. Shared Total fractions retained accepted result.
- Endpoint sample50: total Fe .001, calculated pH about6.05; first point about7.05. Beaker reads accepted sample.
- Calculated pH diagram: existing diagram-transition policy requests Plot again; documented remaining inefficiency. Plot then completed51/51 with correct pH X-total graph.
- No captured browser console errors in final check.

Backend focused tests separately verify exact sample identity, caching, stale/foreign rejection, existing hover behavior, and static Java-vector parity. Browser checks above are recorded observations, not a claim that every possible UI combination was exercised.
