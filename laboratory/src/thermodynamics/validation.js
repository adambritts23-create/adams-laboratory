import { phases } from './schema.js'

const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const numeric = (value) => typeof value === 'number' && Number.isFinite(value)
const text = (value) => typeof value === 'string' && value.trim().length > 0
const strings = (value) => Array.isArray(value) && value.every(text)

/** Diagnostics are data, so importers and UI can display identical messages. */
export function validateSpecies(record, { elementSymbols, allowedPhases = phases } = {}) {
  const diagnostics = []
  const fail = (path, message) => diagnostics.push({ recordId: record?.id ?? null, path, severity: 'error', message })
  const warn = (path, message) => diagnostics.push({ recordId: record?.id ?? null, path, severity: 'warning', message })
  if (!object(record)) { fail('', 'Record must be an object.'); return diagnostics }
  if (record.schemaVersion !== 1) fail('schemaVersion', 'Expected schema version 1.')
  for (const key of ['id', 'name', 'displayName', 'formula']) if (!text(record[key])) fail(key, 'Required non-empty string.')
  if (!allowedPhases.includes(record.phase)) fail('phase', 'Unknown phase; register it explicitly before import.')
  if (!['solute', 'solvent'].includes(record.role)) fail('role', 'Expected solute or solvent.')
  if (!numeric(record.charge) && !(record.charge === null && (record.phase !== 'aqueous' || record.provenance?.kind === 'user-defined'))) fail('charge', 'Aqueous charge must be numeric; user-defined unknown charge may be explicit null.')
  const composition = record.elementalComposition
  if (composition === null && ['imported', 'user-defined'].includes(record.provenance?.kind)) {
    warn('elementalComposition', 'Source does not provide product atom counts; discovery links are not composition.')
  } else if (!object(composition) || !Object.keys(composition).length) fail('elementalComposition', 'Non-empty atom-count map required, or explicit null for an imported record.')
  else for (const [symbol, count] of Object.entries(composition)) {
    if (!/^[A-Z][a-z]?$/.test(symbol) || (elementSymbols && !elementSymbols.includes(symbol))) fail(`elementalComposition.${symbol}`, 'Unknown element symbol.')
    if (!Number.isInteger(count) || count <= 0) fail(`elementalComposition.${symbol}`, 'Atom count must be a positive integer; ambiguous compositions require explicit support.')
  }
  if (record.discoveryElements != null && (!strings(record.discoveryElements) || new Set(record.discoveryElements).size !== record.discoveryElements.length || record.discoveryElements.some(s => !/^[A-Z][a-z]?$/.test(s) || (elementSymbols && !elementSymbols.includes(s))))) fail('discoveryElements', 'Expected unique known element symbols or null.')
  if (record.oxidationStates !== null) {
    if (!object(record.oxidationStates)) fail('oxidationStates', 'Expected an element map or null.')
    else for (const [symbol, states] of Object.entries(record.oxidationStates)) {
      if (!object(composition) || !(symbol in composition)) fail(`oxidationStates.${symbol}`, 'Element is absent from composition.')
      if (states === null) continue
      if (!Array.isArray(states) || !states.length || states.some(s => !object(s) || !Number.isInteger(s.value) || !Number.isInteger(s.count) || s.count <= 0)) {
        fail(`oxidationStates.${symbol}`, 'Expected non-empty { value: integer, count: positive integer } array or null.')
      } else if (new Set(states.map(s => s.value)).size !== states.length || states.reduce((sum, s) => sum + s.count, 0) !== composition?.[symbol]) {
        fail(`oxidationStates.${symbol}`, 'Distinct oxidation states must account for all atoms of this element.')
      }
    }
  }
  for (const key of ['logK', 'temperatureReference', 'pressureReference']) {
    if (record[key] !== null && !numeric(record[key])) fail(key, 'Must be a finite number or null, not a numeric string.')
  }
  for (const key of ['temperatureReference', 'pressureReference']) if (numeric(record[key]) && record[key] <= 0) fail(key, 'Reference must be positive.')
  for (const key of ['source', 'sourceDatabase', 'sourceRecordId', 'citation', 'logKConvention']) if (record[key] !== null && !text(record[key])) fail(key, 'Expected a non-empty string or null.')
  if (record.componentStoichiometry !== null && (!object(record.componentStoichiometry) || !Object.keys(record.componentStoichiometry).length || Object.entries(record.componentStoichiometry).some(([id, n]) => !text(id) || !numeric(n) || n === 0))) fail('componentStoichiometry', 'Expected non-zero signed numeric coefficients or null.')
  if (record.formationReaction !== null) {
    const reaction = record.formationReaction
    if (!object(reaction) || !text(reaction.equation) || !object(reaction.stoichiometry) || !Object.keys(reaction.stoichiometry).length || Object.values(reaction.stoichiometry).some(n => !numeric(n) || n === 0)) fail('formationReaction', 'Expected equation and non-zero signed species coefficients, or null.')
  }
  if (record.temperatureModel !== null && (!object(record.temperatureModel) || !text(record.temperatureModel.type) || !object(record.temperatureModel.parameters) || Object.values(record.temperatureModel.parameters).some(v => v !== null && !numeric(v)))) fail('temperatureModel', 'Expected named model with numeric/null parameters, or null.')
  if (record.activityModelCompatibility !== null && !strings(record.activityModelCompatibility)) fail('activityModelCompatibility', 'Expected model-name array or null (unknown).')
  for (const key of ['notes', 'qualityFlags']) if (!strings(record[key])) fail(key, 'Expected string array.')
  if (typeof record.deprecated !== 'boolean') fail('deprecated', 'Expected boolean.')
  if (!object(record.metadata)) fail('metadata', 'Expected metadata object.')
  const provenance = record.provenance
  if (!object(provenance)) fail('provenance', 'Explicit provenance is required, including for demo fixtures.')
  else {
    if (!['demo', 'imported', 'user-defined'].includes(provenance.kind)) fail('provenance.kind', 'Expected demo, imported or user-defined.')
    for (const key of ['sourceDatabase', 'sourceRecordId']) if (!text(provenance[key])) fail(`provenance.${key}`, 'Source identity required.')
    if (record.sourceDatabase !== provenance.sourceDatabase || record.sourceRecordId !== provenance.sourceRecordId) fail('provenance', 'Normalized source identity must agree with provenance.')
    if (!object(provenance.original)) fail('provenance.original', 'Original source snapshot required.')
    else {
      for (const key of ['speciesName', 'reaction', 'logK', 'citation']) if (!(key in provenance.original)) fail(`provenance.original.${key}`, 'Preserve this source field explicitly; null means absent.')
    }
    for (const key of ['comments', 'qualityFlags']) if (!strings(provenance[key])) fail(`provenance.${key}`, 'Expected string array.')
    if (provenance.kind === 'imported' && (!text(provenance.importDate) || !Number.isFinite(Date.parse(provenance.importDate)) || !text(provenance.importerVersion))) fail('provenance', 'Imported records require an import date and importer version.')
    if (provenance.kind === 'demo' && (['logK', 'temperatureReference', 'temperatureModel', 'pressureReference'].some(key => record[key] !== null) || provenance.original?.logK !== null)) fail('logK', 'Non-thermodynamic demo records must not contain thermodynamic values, including in the original snapshot.')
  }
  if (numeric(record.logK) && (!text(record.logKConvention) || provenance?.original?.logK == null)) fail('logK', 'A constant requires its explicit convention and preserved original source value.')
  if (numeric(record.logK) && (record.formationReaction === null || !numeric(record.temperatureReference) || !numeric(record.pressureReference) || !text(record.citation))) warn('logK', 'Source constant retained; incomplete reaction/reference metadata means this record is not solver-ready.')
  return diagnostics
}

export function validateDataset(records, options) {
  if (!Array.isArray(records)) return [{ recordId: null, path: '', severity: 'error', message: 'Dataset must be an array.' }]
  const seen = new Set()
  return records.flatMap(record => {
    const diagnostics = validateSpecies(record, options)
    if (seen.has(record?.id)) diagnostics.push({ recordId: record?.id, path: 'id', severity: 'error', message: 'Duplicate species ID.' })
    seen.add(record?.id)
    return diagnostics
  })
}
