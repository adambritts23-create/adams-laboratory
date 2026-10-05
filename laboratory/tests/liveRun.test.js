import test from 'node:test'
import assert from 'node:assert/strict'
import { createLiveRun } from '../src/calculations/liveRun.js'

test('rapid live edits debounce to the last immutable snapshot and abort superseded work',async()=>{
  const calls=[]
  const live=createLiveRun((snapshot,control)=>calls.push({snapshot,control}),15)
  live.schedule({revision:1});live.schedule({revision:2});live.schedule({revision:3})
  await new Promise(r=>setTimeout(r,35))
  assert.equal(calls.length,1);assert.equal(calls[0].snapshot.revision,3);assert.equal(calls[0].control.isCurrent(),true)
  live.schedule({revision:4})
  assert.equal(calls[0].control.signal.aborted,true);assert.equal(calls[0].control.isCurrent(),false)
  live.cancel();await new Promise(r=>setTimeout(r,35));assert.equal(calls.length,1)
})
