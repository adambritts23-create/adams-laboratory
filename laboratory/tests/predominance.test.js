import test from 'node:test'
import assert from 'node:assert/strict'
import { gridFixture,calculateGrid } from './phase8Helpers.js'
import { classifyInventoryGrid,classificationPolicy } from '../src/calculations/predominance.js'
test('experimental inventory dominance follows analytical AgCl/free Ag ratio with an explicit tie',async()=>{
  const {system,definition}=await gridFixture()
  const beta=system.products[0].logBeta
  definition.independentVariables[1].range={min:-beta-1,max:-beta+1}
  const grid=await calculateGrid(system,definition),c=classifyInventoryGrid(system,grid,system.components[0].id)
  assert.ok(c.ok);assert.equal(classificationPolicy.pourbaixEnabled,false)
  c.points.forEach(p=>{const ratio=10**(beta+p.y);if(Math.abs(ratio-1)<1e-12)assert.equal(p.status,'tie');else assert.equal(p.winner,ratio>1?system.products[0].id:system.components[0].id)})
})
test('experimental inventory classification counts actual solid amount, not solid activity',async()=>{
  const {system,definition}=await gridFixture('precipitation')
  definition.independentVariables[0]={...definition.independentVariables[0],mode:'LTV',quantity:'total',unit:'mol/kg-H2O',range:{min:-8,max:-2}}
  const grid=await calculateGrid(system,definition),c=classifyInventoryGrid(system,grid,system.components[0].id)
  assert.ok(c.ok)
  const solid=system.products.find(p=>p.phase==='solid').id
  assert.ok(c.points.some(p=>p.winner===solid))
  for(const p of grid.outcomes.filter(p=>p.result?.solids[0].amount===0))assert.notEqual(c.points[p.index].winner,solid)
})
test('classification keeps unavailable points unclassified',async()=>{
  const {system,definition}=await gridFixture(),controller=new AbortController();controller.abort()
  const grid=await calculateGrid(system,definition,0,{signal:controller.signal}),c=classifyInventoryGrid(system,grid,system.components[0].id)
  assert.ok(c.points.every(p=>p.status==='unavailable'&&p.winner===null))
})
