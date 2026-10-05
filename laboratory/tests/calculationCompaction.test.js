import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {axisOptions,chooseAxisOption} from '../src/calculations/axisOptions.js'
import {createCondition} from '../src/calculations/definition.js'
const components=[{id:'h',name:'H+',role:'proton'},{id:'e',name:'e-',role:'electron'},{id:'a',name:'CH3COO-',role:'basis-choice'},{id:'w',name:'H2O',role:'solvent'}]
test('structured axis choices preserve signed protons, electron activities and ordinary total scales',()=>{
 const options=axisOptions(components,'log-concentration')
 assert.deepEqual(options.filter(o=>o.component.id==='h'&&o.quantity==='total').map(o=>o.mode),['TV'])
 assert.deepEqual(options.filter(o=>o.component.id==='a'&&o.quantity==='total').map(o=>o.mode),['LTV','TV'])
 assert.ok(!options.some(o=>o.component.id==='e'&&o.quantity==='total'));assert.ok(!options.some(o=>o.component.id==='w'))
 assert.ok(axisOptions(components,'aqueous-fraction').every(o=>['pH','Eh','total'].includes(o.quantity)))
 assert.ok(axisOptions(components,'calculated-pH').every(o=>o.component.id!=='h'))
})
test('structured selection retains prior axis defaults, fixed-component handoff and input immutability',()=>{
 const d={dimensions:1,activityModel:'ideal',independentVariables:[createCondition(components[0],'LAV','pH')],componentConditions:[createCondition(components[2],'T','total'),createCondition(components[3],'LA','log-activity')]},before=structuredClone(d)
 const option=axisOptions(components).find(o=>o.component.id==='a'&&o.mode==='TV'),next=chooseAxisOption(d,0,option,components)
 assert.deepEqual(d,before);assert.equal(next.independentVariables[0].componentId,'a');assert.equal(next.independentVariables[0].points,51)
 assert.ok(!next.componentConditions.some(c=>c.componentId==='h')); assert.ok(!next.componentConditions.some(c=>c.componentId==='a'))
 const signed=chooseAxisOption(d,0,axisOptions(components).find(o=>o.component.id==='h'&&o.mode==='TV'),components)
 assert.equal(signed.independentVariables[0].quantity,'total');assert.deepEqual(signed.componentConditions,d.componentConditions)
})
test('Calculation keeps one primary definition selector and separate retained result workspace',()=>{
 const ui=fs.readFileSync('src/components/CalculationWorkspace.jsx','utf8')
 assert.doesNotMatch(ui,/aria-label="Diagram type"|<ObserverPortrait/)
 assert.match(ui,/<OutputControls hideSelector/);assert.match(ui,/<section className="calculation-setup">/)
 assert.match(ui,/className="graph-column" hidden=\{!snapshot\|\|!results\}/)
 assert.match(ui,/diagramTransition\(session,id,components,reactionSet\)/)
 assert.match(ui,/scrollIntoView/)
})
