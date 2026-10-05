import test from 'node:test'
import assert from 'node:assert/strict'
import { KF_DEFAULTS, kfState, FARADAY, WATER_MOLAR_MASS } from '../src/kf/coulometry.js'
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8, `${a} != ${b}`)
test('0.5 g / 600 ppm sample transfers and titrates 300 micrograms in six minutes',()=>{
  const mid=kfState(KF_DEFAULTS,180), end=kfState(KF_DEFAULTS,360)
  close(mid.measuredUg,150)
  assert.ok(mid.currentMa>8.92 && mid.currentMa<8.94)
  close(end.measuredUg,300);close(end.recoveredPpm,600)
  close(end.chargeC,300e-6/WATER_MOLAR_MASS*2*FARADAY)
  close(end.currentMa,0);assert.equal(end.complete,true)
})
test('current-limited run accumulates water then consumes backlog after transfer',()=>{
  const config={...KF_DEFAULTS,maxCurrentMa:1}
  const atTransferEnd=kfState(config,360)
  assert.ok(atTransferEnd.residualUg>250)
  assert.equal(atTransferEnd.complete,false)
  close(atTransferEnd.currentMa,1)
  const end=kfState(config,atTransferEnd.finishSeconds)
  close(end.residualUg,0);close(end.measuredUg,300)
})
test('mass and charge conserved at every sample; rewind is deterministic',()=>{
  for(const maxCurrentMa of [1,10,400]){
    const config={...KF_DEFAULTS,maxCurrentMa}
    for(let t=0;t<4000;t+=7){
      const s=kfState(config,t)
      close(s.remainingUg+s.residualUg+s.measuredUg,s.totalUg)
      close(s.chargeC/(2*FARADAY)*WATER_MOLAR_MASS*1e6,s.measuredUg)
      assert.ok(s.currentMa<=maxCurrentMa)
    }
  }
  close(kfState(KF_DEFAULTS,0).measuredUg,0)
  close(kfState(KF_DEFAULTS,180).measuredUg,150)
})
test('rejects invalid inputs and unsupported instrument current',()=>{
  for(const value of [0,-1,NaN,Infinity]) assert.throws(()=>kfState({...KF_DEFAULTS,rateUgMin:value},0))
  assert.throws(()=>kfState({...KF_DEFAULTS,maxCurrentMa:401},0))
  assert.throws(()=>kfState({...KF_DEFAULTS,waterPpm:1000001},0))
  assert.throws(()=>kfState(KF_DEFAULTS,-1))
})
