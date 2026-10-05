import {loadWetLabIons} from './wetLabIons.js'
import {prepareWetLabStockEquilibria} from './wetLabStockPH.js'
import {wetLabError} from './wetLabSolutions.js'
import {prepareWetLabScope,runTitration,selectTitrationState} from './wetLabTitration.js'
import {defaultWetLabSetup,auditWetLabRecipes,prepareWetLabStocks,wetLabSampling} from './wetLabSetup.js'

// Sampling only; all pH values come from the Phase-1 engine.
export const titrationSamples=wetLabSampling(prepareWetLabStocks(defaultWetLabSetup)).coordinates
export async function createWetLabExperience(repository,{chemicalSystem,setup=defaultWetLabSetup,revision=1,isCurrent:preparationCurrent=()=>true,onSolve=()=>{}}={}){
 const performanceStart=performance.now(),counts={stock:0,dose:0}
 const countSolve=kind=>{counts[kind]++;onSolve(kind)}
 const availability=await auditWetLabRecipes(repository,chemicalSystem)
 const stocks=await prepareWetLabStockEquilibria(repository,setup,revision,await loadWetLabIons(repository),chemicalSystem,{onSolve:countSolve})
 const stockPreparationMs=performance.now()-performanceStart
 for(const stock of Object.values(stocks))for(const row of stock.contributions)if(!['ionic','component'].includes(row.kind)&&!availability.available.some(r=>r.id===row.reagent))wetLabError('unavailable-recipe',`Recipe ${row.reagent} is unavailable. ${availability.recipes.find(r=>r.id===row.reagent)?.reasons.join(' ')??''}`)
 const context=await prepareWetLabScope(repository,stocks,chemicalSystem,revision)
 const sampling=wetLabSampling(stocks)
 const request={analyteStock:stocks.sample,analyteVolumeMl:stocks.sample.volumeMl,titrantStock:stocks.titrant,revision}
 let current=true,epoch=0,selected=null,preview=null,solveRuns=0
 const points=new Map()
 function add(series){for(const [i,p] of series.curve.entries())points.set(p.x,Object.freeze({...p,series,index:i}))}
 async function calculate(volumes,isCurrent){solveRuns++;const series=await runTitration(context,{...request,additionVolumesMl:volumes},{isCurrent:()=>preparationCurrent()&&isCurrent(),onSolve:countSolve,yieldControl:()=>new Promise(resolve=>setTimeout(resolve,0))});return series}
 const seriesStart=performance.now()
 add(await calculate(sampling.coordinates,()=>current))
 const seriesMs=performance.now()-seriesStart
 function validate(point){
  if(!current||points.get(point?.x)!==point)wetLabError('stale-or-foreign-point','This sample does not belong to the current Wet Lab experiment.')
  return selectTitrationState(point.series,point.index,{seriesId:point.series.id,revision:request.revision})
 }
 function choose(point){selected=validate(point);preview=null}
 function snapshot(){return Object.freeze({selected,preview,displayed:preview??selected,points:Object.freeze([...points.values()].sort((a,b)=>a.x-b.x)),capacityMl:request.titrantStock.volumeMl,solveRuns,equilibriumSolveCount:counts.stock+counts.dose,solveCounts:{...counts},timings:{stockPreparationMs,seriesMs},stocks,sampling,scope:context.scope,systemKey:availability.systemKey,setupRevision:revision})}
 choose(points.get(0))
 return Object.freeze({
  snapshot,
  validate,
  preview(point){const state=validate(point);preview=state.status==='accepted-v0'?state:null;return snapshot()},
  clearPreview(){if(!current)wetLabError('stale-or-foreign-point','Experiment is no longer current.');preview=null;return snapshot()},
  select(point){epoch++;choose(point);return snapshot()},
  async setVolume(raw){
   if(!['string','number'].includes(typeof raw))wetLabError('invalid-volume','Enter a numeric total volume.')
   if(typeof raw==='string'&&!raw.trim())wetLabError('invalid-volume',`Enter a total volume between 0 and ${request.titrantStock.volumeMl} mL.`)
   const volume=typeof raw==='number'?raw:Number(raw)
   if(!current||!Number.isFinite(volume)||volume<0||volume>request.titrantStock.volumeMl)wetLabError('invalid-volume',`Enter a total volume between 0 and ${request.titrantStock.volumeMl} mL.`)
   const token=++epoch
   if(!points.has(volume))add(await calculate([volume],()=>current&&token===epoch))
   if(!current||token!==epoch)wetLabError('stale-titration','A newer selection replaced this request.')
   choose(points.get(volume));return snapshot()
  },
  reset(){epoch++;choose(points.get(0));return snapshot()},
  dispose(){current=false;epoch++},
 })
}

