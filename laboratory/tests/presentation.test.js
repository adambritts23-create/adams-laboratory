import test from 'node:test'
import assert from 'node:assert/strict'
import {periodicTable,elementStates} from '../src/data/periodicTable.js'
import {axisTicks,bounds} from '../src/plots/geometry.js'
import {seriesLabel} from '../src/plots/presentation.js'
import {figureSvg} from '../src/plots/export.js'
import {gridFixture,calculateGrid} from './phase8Helpers.js'
import {deriveGridOutputs} from '../src/calculations/outputs.js'
import {loadSnapshotFile,databaseStatus} from '../src/components/databaseLoading.js'
import {thermodynamicRepository} from '../src/thermodynamics/index.js'

test('complete periodic layout contains 118 unique conventional positions including detached series',()=>{
  assert.equal(periodicTable.length,118)
  assert.deepEqual(periodicTable.map(e=>e.atomicNumber),Array.from({length:118},(_,i)=>i+1))
  assert.equal(new Set(periodicTable.map(e=>e.symbol)).size,118)
  assert.equal(new Set(periodicTable.map(e=>`${e.row}:${e.column}`)).size,118)
  for(const [symbol,row,column] of [['H',1,1],['He',1,18],['C',2,14],['Fe',4,8],['La',9,4],['Lu',9,18],['U',10,7],['Lr',10,18],['Og',7,18]])assert.deepEqual([periodicTable.find(e=>e.symbol===symbol).row,periodicTable.find(e=>e.symbol===symbol).column],[row,column])
})
test('element availability comes only from nondeprecated source components, independent of selection and identities',()=>{
  const components=[{associations:[{element:'Cr'},{element:'O'}]},{deprecated:true,associations:[{element:'Fe'}]},{associations:[{element:'XX'},{element:'e-'}]}]
  const states=elementStates(components,['Cr','He'],['O'])
  assert.equal(states.length,118);assert.equal(states.find(e=>e.symbol==='Cr').state,'selected');assert.equal(states.find(e=>e.symbol==='O').implicit,true)
  assert.equal(states.find(e=>e.symbol==='Fe').available,false);assert.equal(states.find(e=>e.symbol==='He').state,'unavailable')
  assert.equal(elementStates(components).find(e=>e.symbol==='Cr').state,'available')
})
test('log bounds expand outward and integer major ticks align the -3 decade without changing values',()=>{
  const series=[{points:[{x:0,value:-12.73},{x:14,value:-2.13}]}],original=structuredClone(series),view=bounds(series,{start:0,end:14},true)
  assert.ok(Number.isInteger(view.yMin)&&Number.isInteger(view.yMax));assert.ok(view.yMin<-12.73&&view.yMax>-2.13)
  const ticks=axisTicks(view.yMin,view.yMax,{logarithmic:true});assert.ok(ticks.includes(-3));assert.ok(ticks.every(Number.isInteger));assert.deepEqual(series,original)
})
test('ticks remain bounded for broad ranges and readable for fractional zooms and degenerate views',()=>{
  assert.ok(axisTicks(-300,300,{logarithmic:true}).length<=21)
  const fine=axisTicks(-3.02,-2.98,{logarithmic:true});assert.ok(fine.length>1&&fine.some(v=>!Number.isInteger(v)))
  assert.deepEqual(axisTicks(NaN,1),[]);assert.deepEqual(axisTicks(1,1),[])
  assert.deepEqual(axisTicks(2,-2),axisTicks(-2,2))
})
test('free-component display uses the accepted free amount, never the analytical total',async()=>{
  const {system,definition}=await gridFixture('fixed-activity'),grid=await calculateGrid(system,definition)
  const d=deriveGridOutputs(system,grid,{type:'log-concentration'}),free=d.series[0],original=structuredClone(d)
  assert.equal(free.kind,'free-component');assert.ok(seriesLabel(free,'log-concentration').startsWith('Free '))
  free.points.forEach((p,i)=>assert.equal(p.value,Math.log10(grid.outcomes[i].result.concentrations[0])))
  assert.ok(grid.outcomes.some(p=>p.result.componentTotals[0]!==p.result.concentrations[0]))
  assert.equal(seriesLabel({name:'CO3 2-',kind:'component-total'},'log-concentration'),'CO₃²⁻ component total')
  assert.equal(seriesLabel({name:'CO3 2-',kind:'free-component'},'log-concentration'),'Free CO₃²⁻')
  assert.deepEqual(d,original)
})
test('figure log grid lines use integer decades and display labels preserve canonical series and native units',()=>{
  const d={ok:true,series:[{id:'c',name:'CO3 2-',kind:'free-component',points:[{x:0,value:-3},{x:14,value:-3.5}]}],metadata:{revision:0,axis:{start:0,end:14,quantity:'pH',unit:'dimensionless'},fixedConditions:[],componentNames:{},conditions:{temperature:{value:25,unit:'C'},pressure:{value:1,unit:'bar'},activityModel:'ideal',ionicStrength:{mode:'automatic'}},output:{type:'log-concentration',label:'Log amount',unit:'log10(m / (mol/kg-H2O))'},runStatus:'completed'}}
  const svg=figureSvg(d,['c'],{xMin:0,xMax:14,yMin:-5,yMax:0})
  assert.ok(svg.includes('data-y-tick="-3"'));assert.ok(svg.includes('Free CO₃²⁻'));assert.ok(svg.includes('mol/kg-H2O'));assert.equal(d.series[0].name,'CO3 2-')
})
test('database feedback reports real validated counts and stages, and rejects malformed/oversized files',async()=>{
  const r=thermodynamicRepository,snapshot={kind:'adams-spana-snapshot',artifactVersion:1,complete:true,species:r.getSpecies(),elements:r.getElements(),sources:r.getSources(),components:r.getComponents(),diagnostics:[]}
  const stages=[],active=await loadSnapshotFile({size:100,name:'test.json',text:async()=>JSON.stringify(snapshot)},s=>stages.push(s))
  assert.deepEqual(stages,['Loading database…','Validating…']);assert.equal(active.recordCount,r.getSpeciesIdentities().length)
  assert.equal(databaseStatus(null,null),'No database loaded');assert.ok(databaseStatus(active,null).includes(active.recordCount.toString()));assert.equal(databaseStatus(active,'Validating…'),'Validating…')
  await assert.rejects(()=>loadSnapshotFile({size:101*1024*1024},()=>{}),/100 MB/)
  await assert.rejects(()=>loadSnapshotFile({size:2,text:async()=>'{}'},()=>{}),/complete/)
})

