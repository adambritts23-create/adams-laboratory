import fs from 'node:fs'
import {registerHooks} from 'node:module'
let captured
registerHooks({load(url,context,next){const r=next(url,context);if(url.endsWith('/src/thermodynamics/closedPureSolids.js'))return {...r,source:String(r.source).replace('const extended=await extendClosedReagentSolids(prepared.prepared,solids)','globalThis.captureSolidScope({sourceSpecies:base.network.sourceSpecies.length,sourceReactions:base.network.halves.length+base.network.ordinaryReactions.length,solids,excluded}); const extended=await extendClosedReagentSolids(prepared.prepared,solids)')};return r}})
globalThis.captureSolidScope=x=>{captured=x}
const {physical,ids}=await import('./networkBenchmarks.js')
const c=await physical({[ids.F]:6e-6,'component:CrO4%202-':2e-6,'component:K%2B':2e-6,[ids.Cl]:.010012,[ids.H]:.010002},{phases:['aqueous','pure-solids']})
fs.writeFileSync('docs/production-source-blocker.json',JSON.stringify({request:c.request,diagnostics:c.compiled.diagnostics,captured},null,2))
console.log(JSON.stringify({diagnostics:c.compiled.diagnostics,sourceSpecies:captured.sourceSpecies,sourceReactions:captured.sourceReactions,solids:captured.solids.map(s=>({id:s.id,name:s.name})),excluded:captured.excluded.map(s=>({name:s.name,reason:s.reason}))},null,2))
