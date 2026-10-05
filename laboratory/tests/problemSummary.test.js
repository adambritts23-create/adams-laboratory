import test from 'node:test'
import assert from 'node:assert/strict'
import {problemSummary} from '../src/plots/problemSummary.js'
const components=[{id:'h',name:'H+',role:'proton'},{id:'ac',name:'CH3COO-',role:'basis-choice'},{id:'e',name:'e-',role:'electron'}]
const conditions={temperature:{value:25},pressure:{value:1},activityModel:'ideal'}
test('live summary preserves signed analytical totals and leaves its definition unchanged',()=>{
 const d={...conditions,independentVariables:[{componentId:'h',quantity:'total',mode:'TV',range:{min:-1,max:1},points:51,unit:'mol/kg-H2O'}],componentConditions:[{componentId:'h',mode:'T',value:0,unit:'mol/kg-H2O'},{componentId:'ac',mode:'T',value:.5,unit:'mol/kg-H2O'}]};const before=structuredClone(d),s=problemSummary(d,components)
 assert.match(s.varied[0],/-1 → 1 mol\/kg H₂O/);assert.equal(s.fixed.length,1);assert.match(s.fixed[0],/0.5 mol\/kg H₂O/);assert.deepEqual(d,before)
})
test('live summary distinguishes imposed potential, fixed pH, zero inventory and missing values',()=>{
 const s=problemSummary({...conditions,independentVariables:[{componentId:'e',quantity:'Eh',range:{min:-2,max:2},points:17}],componentConditions:[{componentId:'h',quantity:'pH',mode:'LA',value:7},{componentId:'ac',mode:'T',value:0,unit:'mol/kg-H2O'}]},components)
 assert.match(s.varied[0],/-2 → 2 V vs SHE/);assert.match(s.fixed[0],/pH: 7/);assert.match(s.fixed[1],/: 0 mol\/kg H₂O/)
 assert.match(problemSummary({...conditions,independentVariables:[{quantity:'pH',range:{min:null,max:NaN}}]},components).varied[0],/not set → not set/)
})
test('live summary identifies both surface coordinates and retains logarithmic scale',()=>{
 const s=problemSummary({...conditions,independentVariables:[{quantity:'pH',range:{min:0,max:14},points:5},{componentId:'ac',mode:'LTV',range:{min:-5,max:-3},points:7,unit:'mol/kg-H2O'}]},components)
 assert.match(s.varied[0],/^X/);assert.match(s.varied[1],/^Y.*log₁₀.*-5 → -3/)
})
