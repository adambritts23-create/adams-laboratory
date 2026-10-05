import { parseDb, parseElb } from './binary.js'
import { parseReferences } from './references.js'
import { componentLinks, normalizeSpanaRecord, IMPORTER_VERSION, SOURCE_REVISION } from './normalize.js'
import { validateSpecies } from '../../validation.js'
import { elementIdentities } from '../../../data/elementIdentities.js'
import { elements as compactElements } from '../../../data/elements.js'
import { demoSpecies, demoSource } from '../../../data/species.js'
import { normalizeComponents } from './components.js'

export function convertSpana({ db, elb, referencesText = '', context, sitText = null }) {
  const parsedDb = parseDb(db), parsedElb = parseElb(elb), references = parseReferences(referencesText)
  const diagnostics = [...parsedDb.diagnostics.map(d => ({ ...d, file: 'Reactions.db' })), ...parsedElb.diagnostics.map(d => ({ ...d, file: 'Reactions.elb' })), ...references.diagnostics.map(d => ({ ...d, file: 'References.txt' }))]
  if (!parsedDb.complete || !parsedElb.complete) return { complete: false, diagnostics, rawRecords: parsedDb.records.length }
  const { links, diagnostics: linkDiagnostics } = componentLinks(parsedElb.entries, elementIdentities.map(e => e.symbol))
  diagnostics.push(...linkDiagnostics)
  const species = [], rejectedRecords = []
  for (const raw of parsedDb.records) {
    const record = normalizeSpanaRecord(raw, { ...context, references: references.mapping, links })
    const problems = validateSpecies(record, { elementSymbols: elementIdentities.map(e => e.symbol) })
    diagnostics.push(...problems)
    if (problems.some(d => d.severity === 'error')) rejectedRecords.push({ record, diagnostics: problems })
    else species.push(record)
  }
  const usedSymbols = new Set(['H', 'O', ...species.flatMap(s => s.discoveryElements ?? [])])
  const elements = elementIdentities.filter(e => usedSymbols.has(e.symbol)).map(e => ({ ...e, ...compactElements.find(c => c.symbol === e.symbol) }))
  const counts = key => Object.fromEntries([...new Set(parsedDb.records.map(r => key(r)))].map(value => [value, parsedDb.records.filter(r => key(r) === value).length]))
  return {
    artifactVersion: 1, kind: 'adams-spana-snapshot', complete: true, importerVersion: IMPORTER_VERSION, sourceRevision: SOURCE_REVISION,
    species: [...species, structuredClone(demoSpecies.find(s => s.id === 'water'))], elements,
    components: normalizeComponents(parsedElb.entries, { sourceDatabase: context.sourceDatabase, sourceFile: context.elbSourceFile ?? 'unspecified-element-file', importDate: context.importDate, importerVersion: IMPORTER_VERSION }),
    sources: [{ id: context.sourceDatabase, name: 'Spana/DataBase · local imported records', citation: null, sourceFile: context.sourceFile }, demoSource],
    componentMetadata: parsedElb.entries, references: { originalText: referencesText, entries: references.entries, sourceFile: context.referenceSourceFile },
    sit: sitText === null ? null : { originalText: sitText, sourceFile: context.sitSourceFile,
      status: 'preserved-not-parsed', warning: sitText.includes('three sections') && sitText.includes('E1, E2, E3')
        ? 'Supplied three-section E1/E2/E3 file differs from the pinned current Factor reader. No coefficients applied.'
        : 'SIT text retained without interpretation. Version-specific format verification is required; no coefficients applied.' },
    diagnostics, rejectedRecords,
    summary: { parsed: parsedDb.records.length, accepted: species.length, rejected: rejectedRecords.length,
      layouts: counts(r => r.layout), temperatureModels: counts(r => r.thermal.kind), elementBlocks: parsedElb.entries.length,
      references: references.entries.length, unresolvedReferenceTokens: species.flatMap(s => s.metadata.sourceReferenceResolutions).filter(r => !r.citation).length,
      note: 'One separately labeled application water identity is added; no demo solutes are mixed into the imported reaction catalog.' },
  }
}
