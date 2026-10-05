# Import architecture

The generic adapter runner is `src/thermodynamics/importers/pipeline.js`. The concrete Spana importer separates byte decoding, reference parsing, normalization and repository validation. React never parses binary data.

`scripts/import-spana.js` reads a folder or selected ZIP entries through `scripts/spana-source.js`, calls `convertSpana`, attaches SHA-256 manifests and checks source hashes after conversion. Output is a new `.local/*.json` file. ZIP entries use stored/deflate compression, CRC validation and a 64 MiB entry limit; encrypted archives, ZIP64 and unsupported compression are unsupported. No extraction occurs. Existing outputs and symlink output directories are refused.

The version-1 `adams-spana-snapshot` contains normalized species, explicit source components, element identities, source registry, raw ELB blocks, original reference/SIT text, diagnostics, summary and input hashes. `snapshot.js` validates it before creating a repository. The browser picker has a 100 MiB limit and reads into memory. This data acquisition step is not a required future system-to-diagram file workflow.

Record IDs combine a database hash prefix and byte offset. An offset is an importer ID, not an original database ID: originalRecordId remains null. Records preserve names, ordered coefficients, offset/length, raw Base64 bytes, thermal branch, original logK, references, citations, source paths, timestamp and importer version. Missing numeric sentinels normalize to null but remain recoverable in raw records. Non-finite raw values use explicit representations in JSON.

Repository queries cover elements, components, species, source, phase, oxidation, identifier and text. `getComponentsByElement` preserves source associations; `getSpeciesByComponents` compares exact effective reaction names. Component choices are distinct from analytical element totals and a validated independent basis. Element discovery uses associations only; unknown links do not make records universally compatible.

Malformed binary input stops with an offset diagnostic because unframed records cannot safely be resynchronized. Invalid normalized records remain in rejectedRecords with diagnostics. Missing scientific metadata yields warnings and solverReady=false. Actual stored constants are retained without claiming calculation readiness. Overlay directives remain auditable and are excluded as selectable reactions. No duplicate merging, redox closure, constant recombination, temperature interpolation or SIT evaluation occurs.

See [Phase 3 findings](phase3-report.md) for the pinned specification, counts and limitations. New formats require separate adapters and source-backed fixtures; a `.DB` extension does not establish compatibility.
