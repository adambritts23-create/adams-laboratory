import test from 'node:test'
import assert from 'node:assert/strict'
import {iseFrame,additionSeconds} from './model.js'
test('fluoride additions retain exact mass and volume across all three measurements',()=>{
 for(const [stage,volume,mass,mv] of [[0,58,0,56.5],[1,58.5,.5,27.5],[2,59.5,1.5,6.6]]){
  const frame=iseFrame(stage)
  assert.equal(frame.volumeMl,volume);assert.equal(frame.addedFluorideMg,mass);assert.equal(frame.potentialMv,mv)
 }
 for(let stage=0;stage<2;stage++){
  const final=iseFrame(stage,additionSeconds),next=iseFrame(stage+1)
  assert.equal(final.volumeMl,next.volumeMl);assert.equal(final.addedFluorideMg,next.addedFluorideMg)
  assert.ok(Math.abs(final.potentialMv-next.potentialMv)<1e-10)
 }
})
test('second addition is two half-mL pulses with a stopped interval',()=>{
 assert.equal(iseFrame(1,.25).flowing,false)
 assert.equal(iseFrame(1,.75).flowing,true)
 assert.equal(iseFrame(1,1.25).flowing,false)
 assert.equal(iseFrame(1,1.25).volumeMl,59)
 assert.equal(iseFrame(1,1.5).flowing,true)
 assert.equal(iseFrame(1,2).volumeMl,59.5)
 assert.equal(iseFrame(1,2).flowing,false)
 assert.equal(iseFrame(1,100).volumeMl,59.5)
 assert.equal(iseFrame(2,100).volumeMl,59.5)
})

test('illustrative fluoride counts increase by two then four',()=>{
 assert.deepEqual([0,1,2].map(stage=>iseFrame(stage).fluorideVisualCount),[3,5,9])
 assert.equal(iseFrame(0,additionSeconds).fluorideVisualCount,5)
 assert.equal(iseFrame(1,additionSeconds).fluorideVisualCount,9)
})

test('custom addition volumes drive mass and level consistently',()=>{
 const f=iseFrame(2,null,[56,27,6],[1,2])
 assert.equal(f.volumeMl,61);assert.equal(f.addedFluorideMg,3)
 assert.equal(iseFrame(1,9,[56,27,6],[1,2]).volumeMl,61)
})
