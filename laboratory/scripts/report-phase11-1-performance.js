import fs from 'node:fs'
import { carbonateGrid } from '../tests/phase9Helpers.js'
import { calculateGrid } from '../tests/phase8Helpers.js'
import { deriveGridOutputs } from '../src/calculations/outputs.js'
import { gridDiagnostics } from '../src/analysis/gridDiagnostics.js'
const {system,definition,carbonate}=await carbonateGrid(),measurements=[]
for(const shape of [[21,21],[51,51],[81,61]]){
  const d=structuredClone(definition);d.independentVariables.forEach((a,i)=>a.points=shape[i])
  const start=performance.now(),grid=await calculateGrid(system,d),calculationMs=performance.now()-start
  const derived=deriveGridOutputs(system,grid,{type:'total-dissolved',componentId:carbonate.id}),times=[]
  for(let i=0;i<5;i++){const t=performance.now();gridDiagnostics(grid,derived.series[0]);times.push(performance.now()-t)}
  measurements.push({shape,counts:grid.counts,calculationMs,diagnosticsMedianMs:times.sort((a,b)=>a-b)[2]})
}
const report={date:new Date().toISOString(),scope:'Safe local carbonate grid; diagnostics classified five times on each same calculated result. No solver calls from classification; median CPU times, not browser render measurements.',measurements}
fs.writeFileSync('docs/phase11-1-performance.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))
