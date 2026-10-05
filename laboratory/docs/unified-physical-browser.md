# Browser verification — unified physical preparation

Local development application, 2026-09-16. Actual UI controls used; no injected calculation state.

- Ordinary reagent selector: Chromium(III) chloride; sample 50.00 mL, 0.0100 mol/L.
- Burette: NaOH, 0.1000 mol/L, 100.00 mL loaded.
- 101 calculated samples (0–100 mL); 0 unavailable options; no browser error logs.
- 0 mL: pH 2.68564, derived Eh 0.64161 V vs SHE; no sediment.
- 10 mL: pH 3.63303, derived Eh 0.54378 V; sediment present; Total Cr shows Cr2O3(cr) 50.836%, Cr3(OH)4+5 28.918%.
- Aqueous speciation at 10 mL: Cr3(OH)4+5 58.819% of dissolved Cr; no solid series.
- Log concentrations includes Cr2O3(cr) with solid phase marker; axis says carrier log concentration.
- ArrowRight moves 10 → 11 mL and updates exact pH/Eh, beaker volume and burette remainder.
- Home selects 0 mL. Pointer preview at 19 mL shows pH 11.75999, Eh -0.20077 V and sediment while commitment remains 0 mL. Leaving graph restores 0 mL and removes sediment.
- End selects 100 mL: pH 12.74367, derived Eh -0.28225 V; 150 mL beaker, empty burette, persistent sediment.
- Solid legend selection focuses the carrier; Clear focus restores the view.

An initial development run was invalidated correctly by HMR source edits. The completed demonstration above was performed after those calculation changes. The only subsequent component edit corrected the log-view axis/phase wording and retained the accepted experiment.
