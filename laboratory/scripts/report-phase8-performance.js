import fs from 'node:fs'
import process from 'node:process'
import { gridFixture,calculateGrid,vary } from '../tests/phase8Helpers.js'
import { definitionFor,reconstruct } from '../tests/phase6Helpers.js'
import { deriveGridOutputs } from '../src/calculations/outputs.js'
import { gridModel,gridBounds,gridSvg } from '../src/plots/gridView.js'
const measurements=[]
for(const name of ['fixed-activity','precipitation','pH-redox'])for(const size of [11,21,51]){
  const start=performance.now(),{system,input,definition}=await gridFixture(name,size)
  let d=definition
  if(name==='precipitation')d.independentVariables[0]={...d.independentVariables[0],mode:'LTV',quantity:'total',unit:'mol/kg-H2O',range:{min:-8,max:-2}}
  if(name==='pH-redox'){d=vary(definitionFor(system,input),'H+','LAV',6,8,size,'pH');d=vary(d,'e-','LAV',0.5,0.8,size,'Eh')}
  const preparationMs=performance.now()-start,grid=await calculateGrid(system,d)
  grid.outcomes.filter(p=>p.result?.ok).forEach(p=>reconstruct(system,p.input,p.result))
  const outputStart=performance.now(),derived=deriveGridOutputs(system,grid,{type:'log-concentration'}),transformationMs=performance.now()-outputStart
  const modelStart=performance.now(),model=gridModel(derived),view=gridBounds(derived.metadata),modelMs=performance.now()-modelStart
  const svgStart=performance.now();for(let i=0;i<5;i++)gridSvg(model,view)
  measurements.push({case:name,shape:grid.shape,counts:grid.counts,preparationMs,...grid.timing,transformationMs,visualizationModelMs:modelMs,svgGenerationMeanMs:(performance.now()-svgStart)/5})
}
fs.writeFileSync(new URL('../docs/phase8-performance.json',import.meta.url),JSON.stringify({runtime:process.version,generatedAt:new Date().toISOString(),note:'Local Node CPU/orchestration and SVG preparation timings, not browser paint timings. All coordinates retained. Existing reference constants only; no new Java goldens.',measurements},null,2)+'\n')
console.table(measurements.map(({case:name,shape,counts,solvingMs,elapsedMs,transformationMs,visualizationModelMs,svgGenerationMeanMs})=>({case:name,shape:shape.join('x'),failed:counts.failed,solvingMs,elapsedMs,transformationMs,visualizationModelMs,svgGenerationMeanMs})))
