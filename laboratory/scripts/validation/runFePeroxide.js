import fs from 'node:fs'
import assert from 'node:assert/strict'
import {automatic,controlled,exclusions,amounts,compareAmounts,reagentRequest,repo,scope,ids,initial} from './fePeroxideChecks.js'
import {runClosedReagentSweep} from '../../src/calculations/closedReagentSweep.js'
const expected=JSON.parse(fs.readFileSync('docs/closed-redox-step5-independent-points.json'))
const controls=[]
for(const e of expected){const r=await automatic({peroxide:e.peroxideSupplied});assert.ok(r.ok,JSON.stringify(r));const c=await controlled(r);assert.ok(c.ok,JSON.stringify(c));const controlAmounts=Object.fromEntries(c.result.speciesIds.map((id,i)=>[id,c.result.concentrations[i]]));controls.push({dose:e.peroxideSupplied,accepted:r,independentMaxLogDifference:compareAmounts(amounts(r),e.amounts),controlledMaxLogDifference:compareAmounts(amounts(r),controlAmounts),exclusions:exclusions(r)})}
const invariance=[]
for(const basis of ['reagents','ferric'])for(const history of [0,1]){const r=await automatic({basis,history});assert.ok(r.ok,JSON.stringify(r));invariance.push({basis,history,maxLogDifference:compareAmounts(amounts(r),expected[0].amounts),pH:r.inspection.pH,pe:r.inspection.pe})}
const sweep=await runClosedReagentSweep(repo,reagentRequest(),scope,{reagentId:ids.P,min:0,max:initial.Fe,points:21})
const dense=await runClosedReagentSweep(repo,reagentRequest(),scope,{reagentId:ids.P,min:initial.Fe/2-1e-10,max:initial.Fe/2+1e-10,points:17})
const compact=s=>({status:s.status,counts:s.counts,samples:s.outcomes.map(o=>({index:o.index,dose:o.coordinate,status:o.status,diagnostics:o.diagnostics,...(o.accepted?{pH:o.accepted.inspection.pH,pe:o.accepted.inspection.pe,Eh:o.accepted.inspection.Eh,Fe:o.accepted.inspection.elements.Fe,carriers:o.accepted.inspection.carriers,exclusions:exclusions(o.accepted),checks:o.accepted.closed.inspection}: {})}))})
fs.writeFileSync('docs/closed-redox-step5-validation.json',JSON.stringify({initial,controls,invariance,sweep:compact(sweep),dense:compact(dense)},null,2))
console.log(JSON.stringify({controls:controls.map(c=>({dose:c.dose,independent:c.independentMaxLogDifference,controlled:c.controlledMaxLogDifference})),invariance,sweep:sweep.counts,dense:dense.counts,maxSolid:Math.max(...sweep.outcomes.filter(o=>o.accepted).flatMap(o=>exclusions(o.accepted).filter(s=>s.phase==='solid').map(s=>s.logQ))),maxGas:Math.max(...sweep.outcomes.filter(o=>o.accepted).flatMap(o=>exclusions(o.accepted).filter(s=>s.phase==='gas').map(s=>s.logQ)))},null,2))
