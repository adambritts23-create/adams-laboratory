import process from 'node:process'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import { carbonateGrid } from '../tests/phase9Helpers.js'
import { createGridDefinition, runGrid } from '../src/calculations/grid.js'
import { deriveGridOutputs } from '../src/calculations/outputs.js'
import { gridModel, gridSvg, gridBounds } from '../src/plots/gridView.js'
const { system, definition } = await carbonateGrid()
const measurements = []
for (const shape of [[21,21],[51,51],[81,61]]) {
  const d=structuredClone(definition);d.independentVariables.forEach((a,i)=>a.points=shape[i])
  const prepared=await createGridDefinition(system,d,0);if(!prepared.ok)throw new Error(JSON.stringify(prepared))
  const start=performance.now(),grid=await runGrid(system,prepared.grid),elapsedMs=performance.now()-start
  const renderStart=performance.now(),derived=deriveGridOutputs(system,grid,{type:'log-concentration'}),model=gridModel(derived),svg=gridSvg(model,gridBounds(model.metadata)),presentationMs=performance.now()-renderStart
  const controller=new AbortController();let abortAt
  const timer=setTimeout(()=>{abortAt=performance.now();controller.abort()},50)
  const partial=await runGrid(system,prepared.grid,{signal:controller.signal});clearTimeout(timer)
  measurements.push({shape,...grid.counts,elapsedMs,pointsPerSecond:grid.counts.requested*1000/elapsedMs,presentationMs,svgBytes:Buffer.byteLength(svg),cancellation:{requestedAfterMs:50,responseMs:abortAt?performance.now()-abortAt:null,status:partial.status,...partial.counts}})
}
const report={recordedAt:new Date().toISOString(),runtime:process.version,platform:process.platform,scope:'Local Node run; carbonate automatic aqueous system, ideal 25 C, cold independent points, default chunk 20. Wall time includes result assembly. Presentation is model/SVG string construction, not browser paint. No thermodynamic source records included.',measurements}
fs.writeFileSync('docs/phase9-performance.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))
