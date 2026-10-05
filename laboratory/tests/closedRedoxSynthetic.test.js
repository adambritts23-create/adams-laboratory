import test from 'node:test'
import assert from 'node:assert/strict'
import {benchmark,bases,preparations,expected,frozenControl} from '../scripts/validation/closedRedoxSynthetic.js'
import {prepareChemicalSystem,createPointInput} from '../src/solver/models.js'
const near=(a,b,t=1e-12)=>assert.ok(Math.abs(a-b)<t,`${a} vs ${b}`)
const runs=[];for(const basis of bases)for(const prep of preparations)runs.push(await benchmark(basis,prep))
test('closed two-couple synthetic equilibrium agrees with independent analytic extent without electron input',()=>{
 for(const r of runs){for(const id of ['Ao','Ar','Bo','Br','X'])near(r.concentrations[id],expected[id]);assert.ok(r.constraints.every(c=>c.kh===1&&c.componentId!=='E'));assert.ok(r.result.ok);near(r.checks.A,1);near(r.checks.B,1);near(r.checks.charge,0);near(r.checks.electronTransfer,0)}
})
test('both half reactions give common derived pe and satisfy net K=100',()=>{
 for(const r of runs){near(r.checks.massActionA,0);near(r.checks.massActionB,0);near(r.checks.netLogK,2);near(r.checks.peA,1);near(r.checks.peB,1);near(r.checks.Eh,expected.Eh,1e-10)}
})
test('three chemical bases and two equivalent preparation histories preserve the same final state',()=>{
 for(const r of runs)for(const id of ['Ao','Ar','Bo','Br','X'])near(r.concentrations[id],runs[0].concentrations[id]);for(let i=0;i<runs.length;i+=2){assert.deepEqual(runs[i].constraints,runs[i+1].constraints);assert.equal(runs[i].result.inputId,runs[i+1].result.inputId)}
 const b=runs[0];assert.deepEqual(b.constraints.map(c=>c.value),[0,1,1,1]);assert.equal(b.algebra.componentExpressions.Br.logK,2);assert.deepEqual(b.algebra.componentExpressions.Br.coefficients,[-1,1,1,-0])
})
test('charge is independently audited; generic additional electroneutrality remains explicitly unsupported',()=>{
 for(const r of runs){assert.equal(r.chargeRequest.ok,false);assert.ok(r.chargeRequest.diagnostics.some(d=>d.code==='unsupported-constraint'))}
})
test('disconnected state-total constraints preserve inappropriate preparation memory',async()=>{
 const one=await frozenControl({amounts:{Ao:.2,Ar:.8,Bo:.8,Br:.2,X:1}}),two=await frozenControl(preparations[1]);assert.ok(one.ok&&two.ok);assert.notDeepEqual(one.concentrations,two.concentrations);near(one.concentrations[0],.2);near(two.concentrations[0],.5)
 // Neither satisfies the required net K: their disconnected species set cannot exchange electrons.
 for(const r of [one,two])assert.ok(Math.abs(Math.log10(r.concentrations[0]*r.concentrations[3]/(r.concentrations[1]*r.concentrations[2]))-2)>1)
})
test('an unconstrained explicit electron basis is rejected rather than silently prescribing Eh',async()=>{
 const p=await prepareChemicalSystem({components:[{id:'Ao',name:'Ao',role:'ordinary'},{id:'Bo',name:'Bo',role:'ordinary'},{id:'e',name:'e-',role:'electron'}],products:[],basisStatus:'explicit-direct',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{synthetic:true}});assert.ok(p.ok)
 const i=await createPointInput(p.system,{constraints:[{componentId:'Ao',kh:1,value:1},{componentId:'Bo',kh:1,value:1}],revision:0,unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,activityModel:'ideal'});assert.equal(i.ok,false);assert.ok(i.diagnostics.some(d=>d.code==='invalid-constraint'))
})

