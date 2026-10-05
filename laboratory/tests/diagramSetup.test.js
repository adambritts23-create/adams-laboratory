import test from 'node:test'
import assert from 'node:assert/strict'
import { diagramType, diagramUnavailable, selectDiagram, defaultVisibleSeries } from '../src/calculations/diagramSetup.js'
import { createCondition } from '../src/calculations/definition.js'
import { references, prepareReference } from './pointHelpers.js'
import { definitionFor, vary } from './phase6Helpers.js'
import { createSweepDefinition, runSweep } from '../src/calculations/sweep.js'
import { deriveOutputs } from '../src/calculations/outputs.js'

const components=[{id:'H',role:'proton'},{id:'Ca',role:'basis-choice'},{id:'water',role:'solvent'}]
const definition=()=>({dimensions:2,independentVariables:[{...createCondition(components[0],'LAV','pH'),range:{min:2,max:12}},{...createCondition(components[1],'LTV','total'),range:{min:-6,max:-2}}],componentConditions:[createCondition(components[2],'LA')],enabledPhases:['aqueous','solid','liquid']})

test('diagram transition preserves chemistry and axis ranges, returns a removed axis to an explicit unset fixed condition',()=>{
  const d=definition(), before=JSON.stringify(d)
  const next=selectDiagram(d,{},'aqueous-fraction',components)
  assert.equal(JSON.stringify(d),before)
  assert.deepEqual(next.definition.enabledPhases,d.enabledPhases)
  assert.deepEqual(next.definition.independentVariables,[d.independentVariables[0]])
  assert.equal(next.definition.componentConditions.find(c=>c.componentId==='Ca').value,null)
  assert.equal(next.plot.componentId,'Ca')
  assert.equal(next.plot.type,'aqueous-fraction')
  assert.equal(diagramType(next.definition,next.plot),'aqueous-fraction')
  assert.equal(new Set([...next.definition.independentVariables,...next.definition.componentConditions].map(c=>c.componentId)).size,3)
})

test('calculated pH is dependent: the proton sweep becomes an explicit signed total, without inventing an amount',()=>{
  const next=selectDiagram(definition(),{},'calculated-pH',components)
  assert.ok(next.definition.independentVariables.every(c=>c.componentId!=='H'))
  const h=next.definition.componentConditions.find(c=>c.componentId==='H')
  assert.equal(h.mode,'T');assert.equal(h.value,null)
  assert.equal(diagramUnavailable('calculated-pH',definition(),components.filter(c=>c.id!=='H'),1),'Select a proton component in System.')
})

test('pending diagrams and multi-solid policies cannot be silently replaced by ordinary diagrams',()=>{
  assert.equal(diagramUnavailable('pourbaix',definition(),components,1),null)
  for(const id of ['relative-activity']) {
    assert.equal(diagramUnavailable(id,definition(),components,1),'Validation pending')
    assert.throws(()=>selectDiagram(definition(),{},id,components))
  }
  assert.equal(diagramUnavailable('predominance',definition(),components,1),null)
  assert.equal(diagramType(selectDiagram(definition(),{},'predominance',components).definition),'predominance')
  const d={...definition(),gridMultiSolid:true}
  assert.ok(diagramUnavailable('log-concentration',d,components,3))
  assert.throws(()=>selectDiagram(d,{},'log-concentration',components))
  assert.equal(selectDiagram(d,{},'surface',components).definition.gridMultiSolid,true)
  assert.ok(diagramUnavailable('saturated-log-solubility',definition(),components,0))
})

test('response surface preserves axes and clears incompatible fraction output without altering source identity',()=>{
  const d=definition(), next=selectDiagram(d,{type:'aqueous-fraction',componentId:'removed'},'surface',components)
  assert.deepEqual(next.definition.independentVariables,d.independentVariables)
  assert.equal(next.plot.type,'log-concentration');assert.equal(next.plot.componentId,'Ca')
  assert.equal(diagramType(next.definition,next.plot),'surface')
})

test('ordinary log concentration curves derive only from the accepted system and leave exact results intact',async()=>{
  const {system,input}=await prepareReference(references.cases.find(c=>c.id==='complexation'))
  const d=vary(definitionFor(system,input),system.components[0].id,'LTV',-8,-4,3)
  const prepared=await createSweepDefinition(system,d,0), sweep=await runSweep(system,prepared.sweep)
  const before=JSON.stringify(sweep), derived=deriveOutputs(system,sweep,{type:'log-concentration'})
  assert.equal(derived.ok,true)
  const ids=defaultVisibleSeries(derived.series,'log-concentration')
  assert.ok(ids.length>1)
  assert.ok(ids.every(id=>system.speciesIds.includes(id)))
  assert.ok(derived.series.filter(s=>ids.includes(s.id)).every(s=>s.phase==='aqueous'&&s.kind!=='special'))
  assert.equal(JSON.stringify(sweep),before)
  const catalog=[{id:'aq',phase:'aqueous'},{id:'solid',phase:'solid'},{id:'water',phase:'liquid'},{id:'electron',phase:'aqueous',kind:'special'}]
  assert.deepEqual(defaultVisibleSeries(catalog,'log-concentration'),['aq'])
  assert.deepEqual(defaultVisibleSeries(catalog,'solid-amount'),catalog.map(s=>s.id))
})
