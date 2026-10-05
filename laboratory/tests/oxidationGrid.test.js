import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {oxidationFixture} from '../scripts/validation/oxidationFixtures.js'
import {solveFixedRedox} from '../src/solver/redox.js'
import {classifyOxidationPoint} from '../src/analysis/oxidationInventory.js'
const evidence=JSON.parse(gunzipSync(fs.readFileSync('docs/oxidation-state-fe-validation.json.gz')))
test('calculated Fe evidence has exact grid coverage, inventory closure and unaltered accepted samples',()=>{
 assert.equal(evidence.samples.length,57*45);assert.equal(evidence.solverCounts.converged,2565)
 for(const s of evidence.samples){const c=s.classification;assert.equal(s.index,s.iy*57+s.ix);assert.equal(c.inputId,s.result.inputId);assert.equal(c.status,'classified');assert.ok(Math.abs(c.fractions.reduce((n,f)=>n+f.amount,0)-.001)<=c.tolerance);assert.equal(c.total,.001);assert.equal(s.result.logActivities[2],s.input.constraints[2].value)}
 assert.deepEqual(Object.keys(evidence.counts).sort(),['0','2','3','6'])
})
test('offline figure cells and large labels correspond to actual classified grid points',()=>{
 const view=JSON.parse(fs.readFileSync('docs/oxidation-state-fe-view.json')),svg=fs.readFileSync('docs/oxidation-state-fe-map.svg','utf8')
 assert.equal(view.cells.length,evidence.samples.length);assert.equal((svg.match(/data-sample=/g)??[]).length,2565)
 for(const c of view.cells)assert.equal(c.state,evidence.samples[c.index].classification.predominant)
 for(const label of view.labels){const cell=view.cells.find(c=>label.x>=c.x&&label.x<=c.x+c.w&&label.y>=c.y&&label.y<=c.y+c.h);assert.equal(cell.state,label.state)}
 assert.match(svg,/not physical appearance/);assert.match(svg,/gas equilibrium not solved/)
})
test('independent rerun of one exact point in every displayed state reproduces the saved classification',async()=>{
 const f=await oxidationFixture('Fe');assert.equal(f.system.id,evidence.system.id)
 for(const n of [0,2,3,6]){const s=evidence.samples.find(s=>s.classification.predominant===n),x=await solveFixedRedox(f.system,{pH:s.pH,Eh:s.Eh,totals:{[f.system.components[0].id]:.001}});assert.ok(x.ok);const c=classifyOxidationPoint(f.model,f.system,x.input,x.result,{currentRevision:0});assert.equal(c.predominant,n);assert.deepEqual(x.input.constraints.map(({componentId,kh,value})=>({componentId,kh,value:value===0?0:value})),s.input.constraints.map(({componentId,kh,value})=>({componentId,kh,value:value===0?0:value}))); for(const f of c.fractions)assert.ok(Math.abs(f.fraction-s.classification.fractions.find(v=>v.oxidationState===f.oxidationState).fraction)<1e-10)}
})
