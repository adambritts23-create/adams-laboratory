import { repositoryFromSnapshot } from '../thermodynamics/snapshot.js'
// Yield between loading stages so the browser can paint honest progress.
const paint=()=>new Promise(resolve=>setTimeout(resolve,30))
export async function loadSnapshotFile(file,onStage){
  const start=performance.now()
  onStage('Loading database…');await paint()
  if(file.size>100*1024*1024)throw Error('Snapshot exceeds the 100 MB browser limit.')
  const reading=performance.now(),text=await file.text(),readMs=performance.now()-reading
  onStage('Validating…');await paint()
  const parsing=performance.now(),snapshot=JSON.parse(text),parseMs=performance.now()-parsing
  const constructing=performance.now(),repository=repositoryFromSnapshot(snapshot),repositoryValidationMs=performance.now()-constructing
  return {repository,name:file.name,recordCount:repository.getSpeciesIdentities().length,
    importedRecordCount:snapshot.species.filter(s=>s.provenance.kind==='imported').length,solventRecordCount:snapshot.species.filter(s=>s.role==='solvent').length,componentCount:repository.getComponents().length,
    loadedAt:new Date().toISOString(),timings:{readMs,parseMs,repositoryValidationMs,totalMs:performance.now()-start},
    summary:snapshot.summary,diagnostics:snapshot.diagnostics,inputManifest:snapshot.inputManifest}
}
export const databaseStatus=(active,stage)=>stage??(active?`Database ready · ${active.recordCount.toLocaleString('en-US')} species records`:'No database loaded')
