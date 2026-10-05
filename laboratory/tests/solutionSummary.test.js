import test from 'node:test'
import assert from 'node:assert/strict'
import {solutionSummary} from '../src/beaker/solutionSummary.js'
const state=()=>({ok:true,components:[{id:'component',name:'Component',totalDissolved:0.01,contributors:[{id:'a',name:'A',weightedMolality:0.00982},{id:'b',name:'B',weightedMolality:0.00018}]}]})
test('solution summary uses dissolved inventory, not analytical total or solid amount',()=>{
 const s=state(),before=structuredClone(s);s.solids=[{amount:10}]
 const [row]=solutionSummary(s)
 assert.equal(row.leader.id,'a');assert.ok(Math.abs(row.leaderFraction-.982)<1e-14);assert.ok(Math.abs(row.otherFraction-.018)<1e-14)
 assert.deepEqual(s.components,before.components)
})
test('solution summary rejects signed, empty, nonfinite and inconsistent denominators',()=>{
 for(const value of [0,NaN,Infinity,-1,.1]){const s=state();s.components[0].totalDissolved=value;assert.equal(solutionSummary(s)[0].ok,false)}
 const s=state();s.components[0].contributors[1].weightedMolality=-.001;assert.equal(solutionSummary(s)[0].ok,false)
 assert.deepEqual(solutionSummary({ok:false}),[])
})
test('solution summary is deterministic across contributor order and handles multiple components independently',()=>{
 const s=state();s.components.push({...s.components[0],id:'second',contributors:[...s.components[0].contributors].reverse()})
 const rows=solutionSummary(s);assert.equal(rows.length,2);assert.equal(rows[0].leader.id,rows[1].leader.id)
 assert.equal(rows[0].leaderFraction,rows[1].leaderFraction)
})
