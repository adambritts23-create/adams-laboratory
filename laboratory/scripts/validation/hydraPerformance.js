import fs from 'node:fs'
import process from 'node:process'
import {registerHooks} from 'node:module'
let structural=0;globalThis.recordStructure=()=>structural++
registerHooks({load(url,context,next){const r=next(url,context);if(url.endsWith('/src/thermodynamics/closedRedoxNetwork.js'))return {...r,source:String(r.source).replace('const network={ok:true','globalThis.recordStructure(); const network={ok:true')};return r}})
const {repo}=await import('./nonRedoxPhysicalBenchmark.js'),{prepareWetLabStocks,mixedWetLabSetup,defaultWetLabSetup}=await import('../../src/calculations/wetLabSetup.js'),{prepareWetLabScope,runTitration}=await import('../../src/calculations/wetLabTitration.js')
const setup=sample=>({sample,titrant:{reagent:'NaOH',concentrationMolPerL:.1,volumeMl:100}}),cases={HCl:defaultWetLabSetup,Acetate:setup({reagent:'CH3COOH',concentrationMolPerL:.1,volumeMl:50}),Cr:setup({reagent:'CrCl3',concentrationMolPerL:.01,volumeMl:50}),Mixed:mixedWetLabSetup},results=[]
for(const [name,q] of Object.entries(cases)){
 const count=structural,stocks=prepareWetLabStocks(q,0),t0=performance.now(),context=await prepareWetLabScope(repo,stocks,{enabledPhases:['aqueous','solid']},0),prepareMs=performance.now()-t0,series=await runTitration(context,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,additionVolumesMl:Array.from({length:101},(_,i)=>i),revision:0})
 const points=series.states.map(s=>({dose:s.titrantVolumeAddedMl,status:s.status,pH:s.pH,pe:s.equilibrium.derived?.pe??null,ids:s.equilibrium.result?.speciesIds,concentrations:s.equilibrium.result?.concentrations,logs:s.equilibrium.result?.logActivities,solids:s.equilibrium.result?.solids,diagnostics:s.diagnostics})),timings=series.states.map(s=>s.equilibrium.compilerResult?.timing).filter(Boolean)
 const row={name,prepareMs,totalMs:series.elapsedMs,structuralCompiles:structural-count,compileMs:timings.reduce((a,t)=>a+t.compileMs+t.prepareMs,0),solveMs:timings.reduce((a,t)=>a+t.solveMs,0),accepted:points.filter(p=>p.status==='accepted-v0').length,points};results.push(row);fs.writeFileSync('docs/hydra-performance-'+process.argv[2]+'.json',JSON.stringify(results,null,2));console.log(JSON.stringify({...row,points:undefined}))
}
