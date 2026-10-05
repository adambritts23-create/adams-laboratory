import test from 'node:test'
import assert from 'node:assert/strict'
import {wetLab3DState,nearestWetLabPoint,solidDisplayColor} from '../src/beaker/wetLab3DState.js'
const accepted={id:'dose-25',status:'accepted-v0',pH:6.4,titrantVolumeAddedMl:25,titrantRemainingMl:75,totalVolumeMl:75,initialAnalyte:{volumeMl:50},equilibrium:{derived:{Eh:.32},inspection:{ok:true,solids:[{id:'solid',name:'Example',amount:.01}],visual:{visibleSolidIds:['solid'],bedHeight:38}}}}
test('3D reads exact accepted volume, pH, Eh and positive inventory',()=>{
 const d=wetLab3DState(accepted,100,false,'redox')
 assert.equal(d.volumeMl,75);assert.equal(d.remainingMl,75);assert.equal(d.pH,6.4);assert.equal(d.probeValue,.32);assert.equal(d.visibleSolids.length,1);assert.ok(d.sedimentFraction<=.24)
 assert.equal(wetLab3DState(accepted,100).probeValue,6.4)
})
test('preview and rejected doses cannot leak stale probe readings or solids',()=>{
 for(const d of [wetLab3DState(accepted,100,true),wetLab3DState({...accepted,status:'unavailable'},100)]){assert.equal(d.probeValue,null);assert.equal(d.solids.length,0);assert.equal(d.sedimentFraction,0)}
})
test('rewind clears solids immediately and honors the shared display floor',()=>{
 const initial={...accepted,id:'initial',equilibrium:{inspection:{ok:true,solids:[],visual:{visibleSolidIds:[],bedHeight:0}}}}
 assert.equal(wetLab3DState(initial,100).visibleSolids.length,0)
 const hidden={...accepted,equilibrium:{inspection:{...accepted.equilibrium.inspection,visual:{visibleSolidIds:[],bedHeight:0}}}}
 const d=wetLab3DState(hidden,100);assert.equal(d.solids.length,1);assert.equal(d.visibleSolids.length,0);assert.equal(d.sedimentFraction,0)
})
test('volume scrubber returns an existing point, including boundaries and dense equivalence samples',()=>{
 const points=[0,49.99,50,50.01,100].map(x=>({x,state:{id:String(x)}}))
 assert.equal(nearestWetLabPoint(points,49.995),points[1]);assert.equal(nearestWetLabPoint(points,100),points[4]);assert.equal(nearestWetLabPoint(points,-1),points[0]);assert.equal(nearestWetLabPoint([],50),null)
})

test('absolute solid amount is linear and invariant to dilution',()=>{
 const a={...accepted,mixture:{modelSolventMassKg:.075}}
 const original=wetLab3DState(a,100)
 assert.equal(original.solidMoles,.00075)
 const diluted={...a,totalVolumeMl:150,mixture:{modelSolventMassKg:.15},equilibrium:{...a.equilibrium,inspection:{...a.equilibrium.inspection,solids:[{id:'solid',name:'Example',amount:.005}]}}}
 assert.equal(wetLab3DState(diluted,100).illustrativeSolidMl,original.illustrativeSolidMl)
 const doubled={...a,mixture:{modelSolventMassKg:.15}}
 assert.equal(wetLab3DState(doubled,100).illustrativeSolidMl,2*original.illustrativeSolidMl)
})

test('missing model solvent basis never invents a precipitate quantity',()=>{
 const d=wetLab3DState(accepted,100)
 assert.equal(d.hasAmountBasis,false);assert.equal(d.visibleSolids[0].moles,null);assert.equal(d.illustrativeSolidMl,0)
})

test('phase colours remain stable and tiny positive amounts have no minimum pile',()=>{
 assert.equal(solidDisplayColor('A'),solidDisplayColor('A'))
 assert.notEqual(solidDisplayColor('A'),solidDisplayColor('B'))
 const a={...accepted,mixture:{modelSolventMassKg:1e-9}}
 assert.ok(wetLab3DState(a,100).illustrativeSolidMl<1e-8)
 assert.equal(wetLab3DState(a,100,true).solidMoles,0)
})
