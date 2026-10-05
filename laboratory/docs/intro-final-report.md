# Final Intro-pane polish

The supplied 2454 × 1224 wide artwork is used unchanged. Source: C:/Users/adamb/AppData/Local/Temp/codex-clipboard-97c69ddd-dcb0-42dd-bbf1-c6de845365fa.png.

Production source: public/artwork/laboratory-intro.png (4,187,398 bytes). Built copy: C:/Users/adamb/PycharmProjects/PythonProject/adams-laboratory/dist/artwork/laboratory-intro.png. Original, public and dist SHA256 all match: F77DF1895A02E5CFA9198C17015B4974C4A73A304A40BDDFD6C3E571583929B3. The original PNG was retained to preserve the supplied artwork exactly without another format dependency.

Desktop image width is 94% of the available pane, capped at its native 2454px width. At 650px and below it uses 100% of the pane. Height is automatic, with contain sizing. The previous viewport-height stage and measurement effect were removed. The real, accessible Enter laboratory button is immediately below, with an 8px gap; the button painted into the supplied artwork is unchanged.

Browser checks:
- 1280 × 900: image 1165.59 × 581.37px, full composition visible, no horizontal overflow.
- 1920 × 1080: image 1654.40 × 825.17px, native ratio and complete composition, no horizontal overflow.
- 420 × 844: image 400 × 199.51px, full composition and entry control visible, no horizontal overflow.
- 390 × 844: image 370 × 184.55px, full composition and entry control visible, no horizontal overflow.
- No image crop at any checked width. Both remaining header portraits are present. Entry button opens System; Intro navigation returns correctly. No browser console errors observed.

Validation:
- Final production build passed using the existing local Vite wrapper; existing large-bundle warning remains.
- Production artifact audit passed.
- Lint passed with zero errors and one existing ExpandedPlot.jsx hook-cleanup warning.
- Scientific suite intentionally not run for this presentation-only task.
- Hash comparison against the pre-edit snapshot identified only the four intended source/asset files below. Chemistry and calculation source files were unchanged.

Files changed:
- src/components/IntroPane.jsx
- src/App.css
- public/artwork/laboratory-intro.png
- scripts/public-intro-manifest.json
- docs/intro-final-report.md (this report)

Generated output: dist/ rebuilt; validation evidence in .local/intro-final/ (before.json, build.log, audit.log, lint.log).

The previous Intro artwork was replaced in place, avoiding an unused duplicate production asset. Other artwork and the two retained header portraits were left unchanged. Original user uploads outside the project were not touched.

No deployment, push, git initialization, or website destination changes. Ready for review.
