import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareChemicalSystem,createPointInput} from '../src/solver/models.js'
import {solvePoint} from '../src/solver/point.js'
import {factoredTrace,minimumNormal} from '../src/solver/logConcentration.js'
import {auditPointEquations} from '../src/analysis/pointTrace.js'
import {displayConcentration,displayDissolvedAmount} from '../src/plots/formatNumber.js'
import {saturatedLogSolubility} from '../src/calculations/solubility.js'
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-14,`${a} / ${b}`)
async function fixture(products=[],constraint={kh:1,value:.001},extra={}){
 const p=await prepareChemicalSystem({components:[{id:'A',name:'A',role:'ordinary'}],products:products.map((p,i)=>({id:'p'+i,name:'P'+i,phase:'aqueous',coefficients:[1],sourceRecord:{kind:'synthetic'},...p})),basisStatus:'explicit-direct',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{kind:'synthetic'},...extra});assert.ok(p.ok,JSON.stringify(p.diagnostics))
 const i=await createPointInput(p.system,{revision:0,unit:p.system.unit,temperatureC:25,pressureBar:1,activityModel:'ideal',constraints:[{componentId:'A',...constraint}]});assert.ok(i.ok)
 const r=solvePoint(p.system,i.input);return {system:p.system,input:i.input,result:r}
}
test('ordinary concentrations keep the existing numerical path and exact split',async()=>{
 const {result:r}=await fixture([{logBeta:0}]);assert.ok(r.ok);close(r.concentrations[0],.0005);assert.equal(r.numericalRepresentation,undefined)
})
test('subnormal mass action is checked from retained logs, not a quantized logarithmic round trip',async()=>{
 const p=await fixture([{logBeta:-320}],{kh:2,value:0}),r=p.result;assert.ok(r.ok)
 assert.ok(r.concentrations[1]>0&&r.concentrations[1]<minimumNormal);assert.equal(r.logConcentrations[1],-320)
 assert.ok(Math.abs(Math.log10(r.concentrations[1])+320)>1e-10)
 assert.equal(auditPointEquations(p.system,p.input,r).status,'passed')
})
test('positive traces below exponentiation range retain distinct logs and reconstructable mass action',async()=>{
 const p=await fixture([-400,-500,-800].map(logBeta=>({logBeta}))),r=p.result;assert.ok(r.ok)
 close(r.componentTotals[0],.001);assert.deepEqual(r.logConcentrations.slice(1),[-403,-503,-803]);assert.ok(r.linearConcentrationStatus.slice(1).every(s=>s==='positive-underflow'))
 assert.equal(auditPointEquations(p.system,p.input,r).status,'passed')
 const json=JSON.parse(JSON.stringify(r));assert.equal(json.logConcentrations[2],-503);assert.equal(displayConcentration(r,1),'10^(-403)')
 const forged=structuredClone(r);forged.logConcentrations[1]=-300;assert.equal(auditPointEquations(p.system,p.input,forged).status,'failed')
})
test('fixed positive activity remains distinct from exact zero and unrepresentable overflow remains rejected',async()=>{
 const {result:r}=await fixture([],{kh:2,value:-400});assert.ok(r.ok);assert.equal(r.concentrations[0],0);assert.equal(r.linearConcentrationStatus[0],'positive-underflow');assert.equal(r.logConcentrations[0],-400);assert.equal(displayDissolvedAmount(r,0),'10^(-400)')
 assert.equal((await fixture([],{kh:2,value:400})).result.ok,false)
 assert.equal((await fixture([],{kh:1,value:0})).result.ok,false)
})
test('trace aqueous species coexist with a dominant solid without changing saturation or amount',async()=>{
 const p=await fixture([{logBeta:-400},{phase:'solid',logBeta:4}]),r=p.result;assert.ok(r.ok);close(r.solids[0].amount,.0009);assert.equal(r.solids[0].status,'present');assert.equal(r.logConcentrations[1],-404);assert.equal(auditPointEquations(p.system,p.input,r).status,'passed')
})
test('competing solids retain phase selection with multiple positive log traces',async()=>{
 const p=await fixture([{logBeta:-400},{logBeta:-600},{phase:'solid',logBeta:3},{phase:'solid',logBeta:4}],undefined,{solidPolicy:'bounded-multisolid-v1'}),r=p.result;assert.ok(r.ok);assert.equal(r.solids[0].status,'absent');assert.equal(r.solids[1].status,'present');close(r.solids[1].amount,.0009)
})
test('weighted trace contributions and normalized derivatives factor before materializing',()=>{
 assert.equal(10**-324,0);assert.equal(factoredTrace(-324,[4]),Number.MIN_VALUE)
 close(factoredTrace(-400,[1e300],1e-100),1)
 close(factoredTrace(-400,[-1e200,1e100],1e-100),-1)
})
test('an unrepresentable dissolved inventory retains a finite saturated log-solubility',async()=>{
 const p=await fixture([{phase:'solid',logBeta:400}]),r=p.result;assert.ok(r.ok);close(r.solids[0].amount,.001);assert.equal(r.logConcentrations[0],-400);assert.equal(r.dissolvedComponentLogAmounts[0],-400);assert.equal(saturatedLogSolubility(p.system,r,'A').value,-400);assert.equal(displayDissolvedAmount(r,0),'10^(-400)')
 assert.ok(r.numericalRepresentation.unrepresentableInventoryUpperBound/1e-300<r.iterationTolerance)
})
test('extreme hydrolysis preserves protonation, water activity and analytical inventory',async()=>{
 const p=await prepareChemicalSystem({components:[{id:'A',name:'A',role:'ordinary'},{id:'H',name:'H+',role:'proton'},{id:'W',name:'H2O',role:'water'}],products:[{id:'hyd',name:'hydrolysed',phase:'aqueous',coefficients:[1,-1,1],logBeta:-12,sourceRecord:{kind:'synthetic'}},{id:'prot',name:'protonated',phase:'aqueous',coefficients:[1,1,0],logBeta:-400,sourceRecord:{kind:'synthetic'}}],basisStatus:'explicit-direct',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{kind:'synthetic'}})
 const i=await createPointInput(p.system,{revision:0,unit:p.system.unit,temperatureC:25,pressureBar:1,activityModel:'ideal',constraints:[{componentId:'A',kh:1,value:.001},{componentId:'H',kh:2,value:-100},{componentId:'W',kh:2,value:0}]});const r=solvePoint(p.system,i.input);assert.ok(r.ok);close(r.componentTotals[0],.001);assert.equal(r.logActivities[1],-100);assert.equal(r.logActivities[2],0);assert.equal(r.linearConcentrationStatus[4],'positive-underflow');assert.equal(r.logConcentrations[4],-591);assert.equal(auditPointEquations(p.system,i.input,r).status,'passed')
})
