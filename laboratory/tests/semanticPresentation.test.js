import test from 'node:test'
import assert from 'node:assert/strict'
import {displayNumber,concentrationDisplayRange,outputNumberType} from '../src/plots/formatNumber.js'
import {bounds,segments,inspectPoint} from '../src/plots/geometry.js'
import {surfaceRange} from '../src/plots/surface3d.js'
import {colorRange} from '../src/plots/scalarMap.js'
const output={type:'log-concentration'},axis={start:0,end:14}
const series=values=>[{id:'x',points:values.map((value,i)=>({x:i,value}))}]
test('semantic pH, Eh, temperature and amount formatting leaves source precision intact',()=>{
 const values=[3.7666633424514,0.438827361,25,0.003044375889,2.8473929471e-47],exact=JSON.stringify(values)
 assert.equal(displayNumber(values[0],'pH'),'3.77');assert.equal(displayNumber(values[1],'Eh'),'0.439');assert.equal(displayNumber(values[2],'temperature'),'25')
 assert.equal(displayNumber(values[3],'concentration'),'0.00304');assert.equal(displayNumber(values[4],'amount'),'2.85e-47')
 assert.equal(displayNumber(0.333333333,'fraction'),'0.3333');assert.equal(displayNumber(1),'1');assert.equal(displayNumber(null),'Unavailable')
 assert.equal(JSON.stringify(values),exact)
})
test('concentration automatic bounds use useful padded data range with a -9 display floor',()=>{
 assert.deepEqual(bounds(series([-11,-3]),axis,true,output),{xMin:0,xMax:14,yMin:-9,yMax:-2})
 const deep=bounds(series([-47,-3]),axis,true,output);assert.equal(deep.yMin,-9);assert.ok(deep.yMax<=0)
 const all=bounds(series([-80,-47]),axis,true,output);assert.equal(all.yMin,-9);assert.ok(all.yMax>all.yMin)
})
test('visual floor preserves exact sub-floor samples, unavailable gaps and inspection values',()=>{
 const s=series([-47.54555123,null,-8]),before=JSON.stringify(s),view=bounds(s,axis,true,output)
 assert.equal(view.yMin,-9);assert.equal(inspectPoint({series:s},0).values[0].value,-47.54555123)
 assert.equal(segments(s[0].points).length,2);assert.equal(JSON.stringify(s),before)
 assert.equal(JSON.parse(before)[0].points[0].value,-47.54555123)
})
test('semantic floor excludes activity, pH, Eh, saturation, fractions and arbitrary response values',()=>{
 for(const type of ['log-activity','calculated-pH','calculated-redox','saturation-index','fraction','aqueous-fraction','delta-G','unknown'])assert.deepEqual(concentrationDisplayRange(-80,-30,{type}),{min:-80,max:-30})
 assert.equal(outputNumberType({type:'aqueous-fraction'}),'fraction')
})
test('2D colors and 3D vertical display ranges honor concentration semantics with manual overrides',()=>{
 const model={min:-47,max:-3,metadata:{output}}
 assert.equal(colorRange(model).min,-9);assert.equal(surfaceRange(model).min,-9)
 assert.equal(surfaceRange(model,{min:-50,max:0}).min,-50)
 assert.equal(colorRange({...model,metadata:{output:{type:'saturation-index'}}}).min,-47)
 assert.equal(surfaceRange({...model,metadata:{output:{type:'calculated-redox'}}}).min,-47)
 assert.equal(model.min,-47)
})
