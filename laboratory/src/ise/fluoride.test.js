import test from 'node:test'
import assert from 'node:assert/strict'
import {calculateFluoride,concentrations,fluorideCSV} from './fluoride.js'
test('matches supplied Python example and screenshot',()=>{
 const r=calculateFluoride([56.5,27.5,6.6],2)
 assert.equal(r.initialMgL.toFixed(6),'3.728470')
 assert.equal(r.originalMgL.toFixed(6),'27.031405')
 assert.equal(r.sampleUgG.toFixed(3),'108.126')
 assert.equal(r.uraniumUgG.toFixed(3),'123.572')
 assert.equal(r.meanSlope.toFixed(3),'-56.160')
 assert.equal(r.slopePass,true)
})
test('recovers known concentrations from synthetic responses with dilution',()=>{
 for(const c of [.01,1,20,200]){
  const readings=concentrations(c).map(f=>90-57*Math.log10(f))
  const r=calculateFluoride(readings,2)
  assert.ok(Math.abs(r.initialMgL-c)/c<.001)
  assert.ok(Math.abs(r.regressionSlope+57)<.002)
 }
 const badSlope=calculateFluoride(concentrations(4).map(f=>90-40*Math.log10(f)),2)
 assert.equal(badSlope.slopePass,false)
})
test('invalid readings and masses fail explicitly',()=>{
 for(const e of [[1,1,1],[6.6,27.5,56.5],[NaN,27.5,6.6],[56.5,27.5]])assert.throws(()=>calculateFluoride(e,2))
 for(const mass of [0,-2,NaN])assert.throws(()=>calculateFluoride([56.5,27.5,6.6],mass))
 assert.throws(()=>calculateFluoride([56.5,27.5,6.6],2,0))
})
test('CSV exports the calculated run and safely quotes sample IDs',()=>{
 const csv=fluorideCSV(calculateFluoride([56.5,27.5,6.6],2),'=sample;"x"','2026-10-04T12:00:00Z')
 assert.ok(csv.startsWith('\uFEFF'))
 assert.ok(csv.includes('E2 after further 1.0 mL'))
 assert.ok(csv.includes('108.125620'))
 assert.ok(csv.includes("'="))
 assert.ok(csv.includes('""x""'))
})

test('custom method volumes and uranium fraction propagate to results',()=>{
 const volumes=[1,2],initial=4,readings=concentrations(initial,volumes).map(f=>90-57*Math.log10(f))
 const result=calculateFluoride(readings,3,80,volumes)
 assert.ok(Math.abs(result.initialMgL-initial)<.001)
 assert.ok(Math.abs(result.uraniumUgG-result.sampleUgG/0.8)<1e-9)
 assert.deepEqual(result.additionVolumesMl,volumes)
 assert.throws(()=>calculateFluoride(readings,3,80,[0,2]))
})
