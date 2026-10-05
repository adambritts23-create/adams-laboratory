# Wet Lab primary action UX

2026-09-17. Prepare experiment moved into a prominent desktop-sticky Titration setup header with live admission status and actual blocking reason. Examples/presets and advanced chemistry scope are secondary disclosures. Successful preparation focuses and reveals the right-hand results; cached sample selection does not repeat that focus move. Scientific preparation, solvers and inventories unchanged.

Validation: 9/9 focused tests (primary-action contracts and existing Wet Lab experience regressions), production build and artifact audit passed. Lint: zero errors, one existing ExpandedPlot warning. Browser confirmed desktop sticky action while editing, actual invalid-volume reason, successful default HCl/NaOH preparation and focus on Titration results.

Outstanding scientific requirement: current physical-stock backend rejects non-charge-balanced stocks in wetLabSolutions.js. No analytical-component stock mode exists in this working tree. This UI does not introduce a charge-based disable rule; it follows actual preflight admission. The request to allow omitted counterions in analytical-component mode remains unimplemented and requires that separate preparation contract. No bypass or fictitious allowed status was added.

No deployment or push.
