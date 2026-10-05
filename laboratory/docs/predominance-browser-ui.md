# Predominance Area browser interaction evidence

Development browser: local Vite application, September 17, 2026. Existing UI checks survived the restart; no completed implementation was reverted.

- Loaded the Fe example and selected Diagram type → Predominance area through the shared selector. It retained pH 0–14 / 57 samples, Eh −1–1.2 V / 45 samples and total 0.001 mol/kg H2O.
- Visible source summary: 28 database products, 8 database solids, 3 database gases; 18 admitted products and 7 admitted solids. Database membership and admitted equilibrium scope are distinct.
- Desktop screenshot verified Y controls beside preview, X below, composition and conditions to the right. Corrected an inherited two-column Calculation CSS constraint during development; final area layout spans the workspace.
- Full Fe map displayed 2565 / 2565 accepted equilibria. Selected sample 2564 showed pH 14, Eh 1.2 V, oxidation state 6, and the Beaker's exact aqueous equilibrium (no accepted solid). Home key restored sample 0. No graphical interpolation was used for inspection.
- Changed X maximum to 13: previous map became explicitly stale and was hidden. Swap X/Y produced X Eh −1→1.2 and Y pH 0→13 in the live summary.
- Final scheduling check after restart: clicked Plot diagram and then Cancel through the actual app. Status became **152 / 2565 accepted equilibria · cancelled**. The unrun coordinates remained gaps. Native-only yielding had previously delayed browser control, so final code yields to ordinary timer/UI tasks periodically as well as browser scheduler continuations.

Timing experiment uses `.local/predominance/browser.html` in the browser, shared production preparation/runner/classifier and identical simple SVG renderer for both routes. Two animation frames are awaited after insertion. It excludes initial module/database download. These timings isolate calculation/storage/rendering rather than claiming the harness is the complete React application or a SPANA runtime benchmark. Actual application interaction/Beaker was checked separately above.
