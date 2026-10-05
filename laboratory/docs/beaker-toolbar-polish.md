# Beaker semantics and plot toolbar polish

Implemented 2026-09-10 in the local project; no deployment.

- Retained current glass and phase drawing, cyan aqueous fill and soft green accepted solids. Existing text explicitly identifies illustrative phase colors, not physical compound appearance or concentration.
- Aqueous fraction legend labels explicitly say percent of dissolved component. Beaker component partition labels and accessibility descriptions explicitly say percent of total component in solids or dissolved. Detailed fraction table names its dissolved denominator. Authoritative component identities are preserved.
- Removed redundant 1D/2D zoom and reset buttons while retaining direct gestures and keyboard navigation/Home reset. SVG and numerical JSON exports share an Export disclosure. 3D exports retain PNG/JSON, with camera reset retained and redundant zoom buttons removed.
- Export controls have 44px targets, keyboard Escape closes the disclosure and restores focus. Long legend readouts wrap.

Validation: 28 focused tests passed (fractionReadout, workspaceUx, resultBeaker, solutionSummary). Production build and boundary audit passed. Lint has zero errors and one existing ExpandedPlot ref cleanup warning. Full suite was not repeated for this presentation-only pass.

Browser: accepted Ni sample at pH 8.96 displays 78.4% of dissolved Ni²⁺ in the legend, >99.9% of total Ni²⁺ in solids in component partition. Export options and Escape focus return checked. At 390px viewport no horizontal page or legend value overflow. No browser console errors. Existing export callbacks retained; download contents not revalidated in this pass.
