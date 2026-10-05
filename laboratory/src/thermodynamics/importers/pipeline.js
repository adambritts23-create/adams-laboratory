import { validateDataset, validateSpecies } from '../validation.js'

/**
 * Format adapter contract:
 * parse(input) -> { records: [{ raw, sourceRecordId }], diagnostics: [] }
 * normalize(rawClone, context) -> { status: 'supported', record } |
 *   { status: 'unsupported' | 'malformed', message }
 * context supplies sourceDatabase, importDate and importerVersion (not scientific defaults).
 * normalize must explicitly preserve original speciesName/reaction/logK/citation.
 * Nothing in this runner interprets an external file format or converts conventions.
 */
export async function runImporter(adapter, input, context, validationOptions) {
  const records = [], diagnostics = []
  let parsed
  try { parsed = await adapter.parse(input) } catch (error) {
    return { records, diagnostics: [{ severity: 'error', kind: 'malformed', message: `Parse failed: ${error.message}` }] }
  }
  if (!parsed || !Array.isArray(parsed.records) || !Array.isArray(parsed.diagnostics)) return { records, diagnostics: [{ severity: 'error', kind: 'malformed', message: 'Parser must return records and diagnostics arrays.' }] }
  diagnostics.push(...parsed.diagnostics)
  for (const entry of parsed.records) {
    try {
      if (!entry || !('raw' in entry) || typeof entry.sourceRecordId !== 'string' || !entry.sourceRecordId.trim()) throw new Error('Missing raw record or original record identifier.')
      const originalRaw = structuredClone(entry.raw)
      const result = await adapter.normalize(structuredClone(entry.raw), { ...context, sourceRecordId: entry.sourceRecordId })
      if (['unsupported', 'malformed'].includes(result?.status)) {
        diagnostics.push({ recordId: entry.sourceRecordId, severity: result.status === 'unsupported' ? 'warning' : 'error', kind: result.status, message: result.message })
        continue
      }
      if (result?.status !== 'supported' || !result.record?.provenance) throw new Error('Normalizer must provide a supported record with provenance.')
      const record = structuredClone(result.record)
      record.provenance.original = { ...record.provenance.original, raw: originalRaw }
      if (record.provenance.kind !== 'imported' || record.sourceRecordId !== entry.sourceRecordId || record.sourceDatabase !== context.sourceDatabase || record.provenance.importDate !== context.importDate || record.provenance.importerVersion !== context.importerVersion) throw new Error('Normalized provenance does not match import context.')
      const errors = validateSpecies(record, validationOptions)
      diagnostics.push(...errors.map(d => ({ ...d, kind: d.severity === 'error' ? 'malformed' : 'incomplete' })))
      if (!errors.some(d => d.severity === 'error')) records.push(record)
    } catch (error) { diagnostics.push({ recordId: entry?.sourceRecordId ?? null, severity: 'error', kind: 'malformed', message: error.message }) }
  }
  const duplicates = validateDataset(records, validationOptions).filter(d => d.path === 'id')
  diagnostics.push(...duplicates.map(d => ({ ...d, kind: 'malformed' })))
  const duplicateIds = new Set(duplicates.map(d => d.recordId))
  return { records: records.filter(r => !duplicateIds.has(r.id)), diagnostics }
}
