import fs from 'node:fs'
import {gzipSync} from 'node:zlib'
import {oxidationFixture,data} from './validation/oxidationFixtures.js'
import {createCalculationDefinition} from '../src/calculations/definition.js'
import {createGridDefinition,runGrid} from '../src/calculations/grid.js'
import {classifyOxidationPoint} from '../src/analysis/oxidationInventory.js'
import {ehToPe} from '../src/solver/redox.js'
import {waterReferences} from '../src/analysis/waterReferences.js'
const f=await oxidationFixture('Fe'),{system,model}=f
const chemical={selectedComponents:system.components.map(c=>c.id),selectedSpecies:system.products.map(p=>p.id),temperature:25,pressure:1,enabledPhases:['aqueous','solid','liquid']}
const definition=createCalculationDefinition(chemical,{getComponentById:id=>{const c=system.components.find(c=>c.id===id);return {...c,role:c.role==='ordinary'?'basis-choice':c.role==='water'?'solvent':c.role}}})
definition.componentConditions=[{componentId:system.components[0].id,mode:'T',quantity:'total',unit:'mol/kg-H2O',value:.001},{componentId:system.components[3].id,mode:'LA',quantity:'log-activity',unit:'dimensionless',value:0}]
definition.independentVariables=[{componentId:system.components[1].id,mode:'LAV',quantity:'pH',unit:'dimensionless',range:{min:0,max:14},points:57},{componentId:system.components[2].id,mode:'LAV',quantity:'Eh',unit:'V-SHE',range:{min:-1,max:1.2},points:45}]
const prepared=await createGridDefinition(system,definition,0);if(!prepared.ok)throw Error(JSON.stringify(prepared))
const started=performance.now(),grid=await runGrid(system,prepared.grid),durationMs=performance.now()-started
const samples=grid.outcomes.map(o=>({index:o.index,ix:o.ix,iy:o.iy,pH:o.x,Eh:o.y,pe:ehToPe(o.y),solverStatus:o.status,diagnostics:o.diagnostics,input:o.input,result:o.result,classification:classifyOxidationPoint(model,system,o.input,o.result,{status:o.status,currentRevision:0})}))
const counts={};for(const s of samples){const k=s.classification.status==='classified'?String(s.classification.predominant):s.classification.status;counts[k]=(counts[k]??0)+1}
const water={water:['H2(g)','O2(g)'].map(name=>{const r=data.species.find(r=>r.name===name);return {name,id:r.id,coefficients:r.metadata.effectiveSourceReaction.components,logBeta:r.logK,temperatureK:r.temperatureReference}})}
const references=[0,14].flatMap(pH=>waterReferences(water,pH))
const evidence={kind:'oxidation-state-predominance-validation',publicSupported:false,scope:f.scope,conditions:{temperatureC:25,pressureBar:1,pressureMeaning:'declared',activityModel:'ideal',total:.001,unit:'mol/kg-H2O',pH:[0,14],Eh:[-1,1.2],EhMeaning:'bounded validation range, not a water-stability range',shape:[57,45]},system,metadata:f.metadata,allocation:model,definition:prepared.grid,counts,solverCounts:grid.counts,durationMs,waterReferences:references,samples}
fs.writeFileSync('docs/oxidation-state-fe-validation.json.gz',gzipSync(JSON.stringify(evidence)+'\n'))
console.log(JSON.stringify({counts,solverCounts:grid.counts,durationMs,largestResidual:Math.max(...samples.filter(s=>s.classification.status!=='unavailable').map(s=>Math.abs(s.classification.residual)))}))
