# Calculation workspace compaction

The primary output buttons (including More) are the sole output-view selector. The duplicate Diagram type and secondary output selects were removed from Calculation. Existing diagram transitions and accepted-sweep reuse remain the authority for whether an output can reuse a result.

The ordinary axis editor now presents Quantity → Component → Scale, using the existing legal combinations and defaults. Signed analytical H+ equivalents retain the linear total control; electrons have no analytical-total option. Fixed totals, conditions and axes share a horizontal desktop row. Plot stays alongside calculation mode; setup remains visible above the accepted result. Specialized calculation setups retain their existing contracts.

Long setup explanations, examples and advanced settings are expandable. Calculation photographs are reduced and the setup portrait removed; Wet Lab apparatus is unchanged. Plot labels, scientific status, units, denominator information and stale-result indications remain visible.

## Verification

- Focused UI/state/acetate tests: 27 passed.
- Browser: 51/51-point signed H+ acetate sweep; Log concentrations → Total fractions → Aqueous speciation reused the same accepted sweep without recalculation.
- Desktop 1440 × 900: full ordinary setup visible; aqueous-speciation graph starts at approximately y=857 px. No horizontal overflow. Long compositions and specialized setups may require more vertical space.
- Mobile 390 × 844: controls stack without horizontal overflow.
- Production build and artifact audit passed.
- Lint: zero errors; pre-existing ExpandedPlot ref-cleanup warning remains.
- Protected-file check: 68 solver/thermodynamic/data/reference files unchanged against the surviving pre-acetate manifest; see calculation-compact-preservation.json.
- Full regression: 644/644 passed, with zero failures, cancellations, skips or todo; see calculation-compact-regression.txt.

No solver, thermodynamic data, output mathematics, sweep identity or Wet Lab apparatus changes. No deployment or push.

