import fs from 'node:fs'
import assert from 'node:assert/strict'
import { prepare,point,analytical } from '../tests/redoxHelpers.js'
const evidence={kind:'restricted-redox-foundation-validation',classification:null,points:[]}
for(const solids of [false,true]){
 const system=await prepare(solids)
 for(const [pH,pe] of solids?[[7,-25],[7,0],[7,10],[7,20]]:[[7,10],[7,13.3],[7,16],[3,19.7],[10,8.5]]){
 const trace=await point(system,pH,pe);assert.ok(trace.ok)
 const expected=analytical(pH,pe,solids),actual=trace.result.concentrations[0]
 assert.ok(Math.abs(actual-expected.free)<=1e-25+Math.abs(expected.free)*2e-10)
 evidence.points.push({solids,expected,absoluteFreeError:Math.abs(actual-expected.free),trace})
 }
}
fs.writeFileSync('docs/redox-foundation-validation.json',JSON.stringify(evidence,null,2)+'\n')
console.log(JSON.stringify(evidence.points.map(p=>({pH:p.trace.coordinates.pH,pe:p.trace.coordinates.pe,solids:p.solids,freeError:p.absoluteFreeError,balance:p.trace.result.residuals.componentBalance[0],active:p.trace.result.solids.filter(s=>s.amount>0).map(s=>s.name),maxMassAction:Math.max(...p.trace.result.residuals.massActionLog.map(Math.abs)),maxActiveSI:Math.max(0,...p.trace.result.solids.filter(s=>s.amount>0).map(s=>Math.abs(s.logSaturation)))})),null,2))
