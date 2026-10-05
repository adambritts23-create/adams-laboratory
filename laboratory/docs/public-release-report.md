# Public web release preparation — 7 September 2026

Implemented and verified locally; **not deployed to GitHub Pages**. This directory has no Git metadata or configured remote/deployment credentials. The target remains https://adambritts23-create.github.io/adambritts-site/laboratory/ . Publish the complete contents of `dist/` at that site's `laboratory/` directory using the existing site's deployment process. Preserve the exact Vite base `/adambritts-site/laboratory/`.

## Existing state and scope

Before release edits: 172 tests passed, zero skips/failures; lint/build/production audit passed. Build already contained unfinished Phase 11.2 additions: `src/analysis/pointTrace.js`, `src/components/ScientificTrace.jsx`, and its integration in `src/components/GridWorkspace.jsx`. These were preserved untouched during this release task. No Phase 11.2 completion is claimed. Without Git metadata an exhaustive historical working-tree diff cannot be established.

Baseline JS: 984.01 kB (269.96 kB gzip); baseline CSS 24.59 kB. The pre-existing large chunk warning remained. Browser validation subsequently exposed an unrelated output-switching crash documented below; green baseline tests did not cover that interaction.

## Default source and provenance

The actual configured source was `.local/spana-components.json`: 36,269,385 bytes, 4,445 species identities and 168 component forms. It contains 4,444 imported records plus the existing explicit solvent identity. No alternative database was invented.

`node scripts/prepare-public-data.js` validates a publication copy with the existing repository constructor. It removes only machine-specific absolute archive-location prefixes, retaining archive-relative entries such as `Eq-Diagr/Reactions.db`. Scientific fields, raw record metadata, coefficients, identities, logK, citations, source hashes and record provenance remain unchanged. Compact JSON whitespace and path-prefix removal reduce the asset to **22,908,068 bytes**. The original local snapshot is unchanged. A permanent test compares every scientific metadata object and the entire path-normalized snapshot.

Public asset: `public/data/thermodynamic-default.json`; built asset: `dist/data/thermodynamic-default.json`; exact served path: **`/adambritts-site/laboratory/data/thermodynamic-default.json`**. SHA-256: `9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245`.

Both development and production now fetch this separate static asset through `BASE_URL`, then use the unchanged `loadSnapshotFile → repositoryFromSnapshot → createRepository` pipeline. A page-level shared promise prevents duplicate fetching/parsing across StrictMode subscribers. Loading and validation stages are visible; failures remain errors with a manual chooser, never a fabricated ready database. Reload starts a fresh session and source load; normal HTTP caching is permitted. The dataset is not embedded in JavaScript or duplicated in distribution.

The source disclosure identifies bundled/default versus manual data, attributes the Spana/MEDUSA/DataBase ecosystem associated with Ignasi Puigdomenech, and retains record-level citations and fingerprints. This is provenance, not a new claim about redistribution rights or a software-license change.

Manual Choose database remains available. A successful manual load replaces the repository and starts a new draft; it does not merge sources. Failed manual validation retains the prior source. Existing generation guards prevent an obsolete automatic completion from replacing a later manual selection.

## Artwork and theme

The supplied original AI-generated PNG is preserved at `public/artwork/adam-laboratory.png` (**2,186,504 bytes**). A CSS crop retains Adam's face/upper body and glowing U-marked beaker in a 64×64 header thumbnail. The surrounding generated screens are incidental decoration; the alt text and title explicitly identify decorative AI artwork. No depicted graph, chemical label, instrument reading or notebook content enters application science.

Artwork has no pointer interaction, stays outside every plot/control/diagnostic surface and is hidden at widths ≤900 px. The desktop header reserves its height to prevent overlap; measured portrait bottom 77 px versus source disclosure top 80 px. It does not narrow the scientific workspace. Only a restrained warm thumbnail border was added; plot colors and dark surfaces were not recolored. No image editing/generation or scientific graphic reuse occurred.

## Validation

- **177 tests passed, zero failures/skips**: all 172 retained plus five focused release tests covering base paths, shared loading/stages/source identity, failures, replacement semantics, scientific field preservation, exact asset allowlisting and responsive artwork rules.
- All five unchanged official golden benchmarks pass: acid-base, complexation, precipitation, redox and fixed activity. The existing golden-hash integrity assertion passes.
- Lint passes. Production build passes (109 modules). Existing >500 kB chunk warning remains.
- Final JS **984,862 bytes**, approximately **270.30 kB gzip**; CSS **25,021 bytes**, 6.08 kB gzip. Database and artwork are separately served. Seven production files total **26,119,555 bytes**.
- Production audit accepts only the two specifically named assets with exact byte sizes and SHA-256 manifests. It rejects changed/duplicate/unreviewed data and all other binary assets, local paths, development endpoints, oracle markers and fixture imports. Application size limits and source-fingerprint exclusion remain enforced outside the explicitly approved data asset. No oracle executable, archive, unrelated desktop file or private path is in `dist`.

Production preview: **http://127.0.0.1:4173/adambritts-site/laboratory/**.

Actual browser observations:

1. Two fresh production-preview page loads showed loading/validation and then **Database ready · 4,445 species records · Bundled Spana/MEDUSA snapshot**, without file selection.
2. Carbon → carbonate, with the existing proton/solvent choices, automatically included four aqueous reactions.
3. A pH 0–14 carbonate sweep at total 0.001 mol/kg water returned **51/51 calculated, zero failed** and real labeled species curves.
4. A fresh 21×21 pH 0–14 × log carbonate total −6 to −1 map returned **441/441 converged**. Total dissolved output, axes and fixed solvent condition displayed normally. Sampled range was approximately 9.9999999999999424e−7 to 0.10000000000001599 mol/kg water.
5. Switched the same map to 3D Surface and used Zoom 3D in. The surface rendered and fresh-tab console errors were empty. No unrelated 3D debugging was undertaken.
6. The original manual file input remains in the source disclosure; replacement behavior was exercised through the automated loader/repository test. An actual OS file-picker override was not performed.
7. Screenshot and DOM geometry confirmed nonoverlapping header artwork, face/beaker crop, and separation from the 3D canvas. Responsive hiding is tested in CSS; an explicit narrow-viewport browser resize was not completed with the available browser controls.
8. Image DOM URL and successful production source fetch use the configured subpath. Shared single-fetch behavior is directly counted in the provider test. Browser resource-timing inspection was unavailable in the restricted DOM evaluator; no unsupported network-count measurement is claimed. A second fresh page load succeeded; a browser reload command was not separately exercised.

The 22.91 MB source imposes a real first-load download/parse cost, especially on slow connections. No network-speed guarantee is claimed. The original 2.19 MB image is also a separate download; further image compression would be a separate asset optimization. No premature numerical or rendering optimization was introduced.

## Unrelated issue discovered, left unchanged

Reproduction: calculate the 51-point carbonate 1D curves; change Calculation to 2D map, then select Total dissolved component before choosing its inventory component. The retained 1D result is derived with an incomplete output request. `deriveOutputs` correctly returns an unsupported-output object without `series`, but **`src/components/PlotWorkspace.jsx:23`** reads `derived?.series.find(...)`. Optional chaining protects `derived`, not its absent `series`. Browser throws `TypeError: Cannot read properties of undefined (reading 'find')` and the view becomes blank.

This file/path predates this release and was not edited. This is an output-selection UI failure, not evidence of wrong equilibrium values. A later narrowly scoped correction should guard unsuccessful derivation before reading series and add the interaction regression. It was deliberately not repaired under the instruction to document unrelated defects. Start a fresh system/preview and fully configure the map before calculating to avoid this tested path.

## Exact release file inventory

Modified: `src/components/defaultSource.js`, `src/components/DatabaseSource.jsx`, `src/App.jsx`, `src/App.css`, `scripts/production-artifacts.js`, `scripts/audit-production-boundary.js`, `README.md`, `docs/scientific-architecture.md`.

Added: `scripts/prepare-public-data.js`, `scripts/public-data-manifest.json`, `scripts/public-artwork-manifest.json`, `public/data/thermodynamic-default.json`, `public/artwork/adam-laboratory.png`, `tests/publicRelease.test.js`, `docs/public-release-report.md`.

Regenerated ignored `dist/` with the normal build. Vite configuration/base, package files, original source snapshot, golden fixtures, unfinished trace files, solver mathematics, Newton behavior, thermodynamic constants, scientific tolerances, units and plot-output semantics were **not changed by this release task**. No new phase was started.
