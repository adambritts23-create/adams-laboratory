import { componentRole } from '../../../chemistry/components.js'
/** Aggregate identities by exact source component name, preserving every association and description. */
export function normalizeComponents(entries, { sourceDatabase, sourceFile, importDate, importerVersion }) {
  const byName = new Map()
  for (const block of entries) for (const item of block.components) {
    if (!byName.has(item.name)) byName.set(item.name, { id: `component:${encodeURIComponent(item.name)}`, name: item.name,
      role: componentRole(item.name), associations: [], deprecated: item.name.startsWith('@'),
      provenance: { sourceDatabase, sourceFile, importDate, importerVersion } })
    byName.get(item.name).associations.push({ element: block.element, description: item.description, byteOffset: block.byteOffset, rawBlockBase64: block.rawBase64 })
  }
  return [...byName.values()]
}
