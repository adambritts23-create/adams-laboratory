import fs from 'node:fs'
import { carbonateGrid } from '../tests/phase9Helpers.js'
import { calculateGrid } from '../tests/phase8Helpers.js'
import { deriveGridOutputs } from '../src/calculations/outputs.js'
import { scientificSummary } from '../src/analysis/summary.js'
import { extractSlice } from '../src/analysis/slices.js'
const {system,definition,carbonate}=await carbonateGrid(),measurements=[]
for(const shape of [[21,21],[51,51],[81,61]]){
  const d=structuredClone(definition);d.independentVariables.forEach((a,i)=>a.points=shape[i])
  const start=performance.now(),grid=await calculateGrid(system,d),calculationMs=performance.now()-start
  const deriveStart=performance.now(),derived=deriveGridOutputs(system,grid,{type:'log-total-dissolved',componentId:carbonate.id}),deriveMs=performance.now()-deriveStart
  let summary;const analysisTimes=[],sliceTimes=[]
  for(let i=0;i<5;i++){const t=performance.now();summary=scientificSummary(system,grid,derived,derived.series[0].id,{threshold:-3});analysisTimes.push(performance.now()-t);const s=performance.now();extractSlice(derived,derived.series[0].id,'horizontal',Math.floor(grid.outcomes.length/2));extractSlice(derived,derived.series[0].id,'vertical',Math.floor(grid.outcomes.length/2));sliceTimes.push(performance.now()-s)}
  measurements.push({shape,counts:grid.counts,calculationMs,deriveMs,summaryMedianMs:analysisTimes.sort((a,b)=>a-b)[2],twoSlicesMedianMs:sliceTimes.sort((a,b)=>a-b)[2],validRegions:summary.analysis.regions.count,brackets:summary.analysis.threshold.brackets.length})
}
const report={date:new Date().toISOString(),scope:'Local Node carbonate calculation and separate derivation/analysis timings. Analysis and two slices measured five times on the same immutable result; medians reported. No solver calls from analysis.',measurements}
fs.writeFileSync('docs/phase10-performance.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))
