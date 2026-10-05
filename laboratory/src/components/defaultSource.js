import { loadSnapshotFile } from './databaseLoading.js'

export const defaultDatabaseUrl = base => `${base.endsWith('/') ? base : base + '/'}data/thermodynamic-default.json`
/** One fetch and validated repository per page, including StrictMode subscribers. */
export function createDefaultSourceProvider({ enabled, fetchSource, name = 'Bundled Spana/MEDUSA snapshot' }) {
  let pending, stage = null
  const listeners = new Set()
  return async onStage => {
    if (!enabled) return null
    listeners.add(onStage)
    if (stage) onStage(stage)
    if (!pending) pending = (async () => {
      const start=performance.now()
      const report = value => { stage = value; for (const listener of listeners) listener(value) }
      report('Loading thermodynamic source…')
      const response = await fetchSource()
      if (!response.ok) throw Error('Thermodynamic source unavailable. Choose a database to enable database-backed chemistry.')
      const blob = await response.blob()
      const loaded=await loadSnapshotFile({ name, size: blob.size, text: () => blob.text() }, report)
      loaded.origin='default'
      loaded.timings.automaticSourceMs=performance.now()-start
      return loaded
    })()
    try { return await pending } finally { listeners.delete(onStage) }
  }
}

export const loadDefaultSource = createDefaultSourceProvider({
  enabled: true,
  fetchSource: () => fetch(defaultDatabaseUrl(import.meta.env?.BASE_URL ?? '/adambritts-site/laboratory/')),
})
