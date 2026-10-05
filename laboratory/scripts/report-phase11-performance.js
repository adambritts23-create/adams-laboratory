import fs from 'node:fs'
import { carbonateGrid } from '../tests/phase9Helpers.js'
import { calculateGrid } from '../tests/phase8Helpers.js'
import { deriveGridOutputs } from '../src/calculations/outputs.js'
import { scientificSummary } from '../src/analysis/summary.js'
import { gridModel } from '../src/plots/gridView.js'
import { prepareSurface } from '../src/plots/surface3d.js'
const {system,definition,carbonate}=await carbonateGrid(),measurements=[]
for(const shape of [[21,21],[51,51],[81,61]]){
  const d=structuredClone(definition);d.independentVariables.forEach((a,i)=>a.points=shape[i])
  const start=performance.now(),grid=await calculateGrid(system,d),calculationMs=performance.now()-start
  const derived=deriveGridOutputs(system,grid,{type:'log-total-dissolved',componentId:carbonate.id}),model=gridModel(derived)
  const summary=scientificSummary(system,grid,derived,model.series.id),times=[]
  let surface
  for(let i=0;i<5;i++){const t=performance.now();surface=prepareSurface({...model,analysis:summary.analysis});times.push(performance.now()-t)}
  measurements.push({shape,counts:grid.counts,calculationMs,preparationMedianMs:times.sort((a,b)=>a-b)[2],triangles:surface.triangles.length})
}
const report={date:new Date().toISOString(),scope:'Local Node carbonate chemistry and separate surface preparation; five preparations of the same grid, median. Browser rendering timings are separately documented in phase11-report.md.',measurements}
fs.writeFileSync('docs/phase11-performance.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))
