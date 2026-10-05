import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareClosedRedox,solveClosedRedox,isClosedRedoxResult} from '../src/solver/closedRedox.js'
import {compileClosedRedoxNetwork} from '../src/thermodynamics/closedRedoxNetwork.js'
import {scaleReaction} from '../src/thermodynamics/reactionBasis.js'
import {closedControl} from '../scripts/validation/closedRedoxControls.js'
const near=(a,b,t=1e-11)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<t,`${a} vs ${b}`)
const runs=[]
for(const kind of ['original','unequal','three'])for(const alternate of [false,true])for(const history of [0,1]){
 const c=closedControl(kind,alternate,history),p=await prepareClosedRedox(c.request);assert.ok(p.ok,JSON.stringify(p));const r=solveClosedRedox(p);assert.ok(r.ok,JSON.stringify(r));runs.push({kind,alternate,history,c,p,r})
}
for(const kind of ['original','unequal','three'])test(`closed ${kind}: independent concentrations, inventories, charge and simultaneous half laws`,()=>{
 for(const {c,r,p} of runs.filter(r=>r.kind===kind)){
  for(const [id,value] of Object.entries(c.expected))near(r.result.concentrations[r.result.speciesIds.indexOf(id)],value)
  assert.ok(isClosedRedoxResult(r));assert.ok(r.inspection.inventories.every(x=>x.ok));assert.ok(r.inspection.netReactions.every(x=>x.ok));near(r.inspection.inventories.find(x=>x.key==='charge').actual,0)
  for(const couple of r.inspection.potentials){near(couple.pe,c.definition.pe);near(couple.Eh,8.31446261815324*298.15*Math.LN10/96485.33212*c.definition.pe,1e-10)}
  for(let i=0;i<c.definition.counts.length;i++){
   const f=String.fromCharCode(65+i),ox=r.result.concentrations[r.result.speciesIds.indexOf(f+'o')],red=r.result.concentrations[r.result.speciesIds.indexOf(f+'r')]
   near(ox+red,c.definition.totals[i]);near(Math.log10(red/ox)+c.definition.counts[i]*r.inspection.pe,c.definition.logs[i])
  }
  const electrons=c.definition.counts.map((n,i)=>{const f=String.fromCharCode(65+i);return n*(r.result.concentrations[r.result.speciesIds.indexOf(f+'r')]-(c.request.preparation.amounts[f+'r']??0))}).reduce((a,b)=>a+b,0);near(electrons,0)
  assert.ok(p.input.constraints.every(x=>x.kh===1&&x.componentId!=='E'));assert.ok(!p.system.speciesIds.includes('E'));assert.ok(p.network.cancellations.every(x=>x.electronResidual===0))
 }
})
test('unequal two/three electron stoichiometry cancels exactly at six with transformed log K',()=>{
 const p=runs.find(r=>r.kind==='unequal').p,c=p.network.cancellations[0];assert.equal(c.electronMultiple,6);assert.deepEqual(c.multipliers,[3,-2]);assert.equal(c.electronResidual,0)
 near(c.logK,3*Math.log10(2)-2*Math.log10(3));assert.deepEqual(c.coefficients,{Ao:-3,Ar:3,Bo:2,Br:-2,X:0,E:0})
})
test('all controls preserve equilibrium across preparations and supported bases, not preparation provenance',()=>{
 for(const kind of ['original','unequal','three']){
  const cases=runs.filter(r=>r.kind===kind)
  for(const row of cases)for(const [id] of Object.entries(row.c.expected))near(row.r.result.concentrations[row.r.result.speciesIds.indexOf(id)],cases[0].r.result.concentrations[cases[0].r.result.speciesIds.indexOf(id)])
  for(const alternate of [false,true]){const [a,b]=cases.filter(r=>r.alternate===alternate);assert.deepEqual(a.p.input.constraints,b.p.input.constraints);assert.equal(a.p.equilibriumId,b.p.equilibriumId);assert.notEqual(a.p.preparationId,b.p.preparationId)}
 }
})
test('three simultaneous couples are invariant to reaction order, reversal and scaling',async()=>{
 const base=closedControl('three')
 for(const reactions of [[...base.request.reactions].reverse(),base.request.reactions.map((r,i)=>scaleReaction(r,i===1?-2:3))]){
  const p=await prepareClosedRedox({...base.request,reactions});assert.ok(p.ok,JSON.stringify(p));const r=solveClosedRedox(p);assert.ok(r.ok,JSON.stringify(r));assert.equal(r.inspection.potentials.length,3)
  for(const [id,value] of Object.entries(base.expected))near(r.result.concentrations[r.result.speciesIds.indexOf(id)],value)
 }
})
test('reservoir or electron-total inputs cannot enter closed mode',async()=>{
 for(const key of ['Eh','pe','electronActivity','electronTotal','fixedActivities']){const c=closedControl();assert.equal((await prepareClosedRedox({...c.request,[key]:0})).diagnostics[0].code,'closed-reservoir-conflict')}
 const c=closedControl();c.request.preparation.amounts.E=1;assert.equal((await prepareClosedRedox(c.request)).diagnostics[0].code,'invalid-reagent-inventory')
})
test('missing counterions, source metadata or invalid composition fail before solving',async()=>{
 for(const edit of [c=>delete c.request.preparation.amounts.X,c=>c.request.species[0].charge=2,c=>delete c.request.species[0].sourceIdentity,c=>c.request.reactions[0].terms[1].coefficient=.5,c=>c.request.species[0].phase='solid',c=>c.request.reactions[0].unit.kind='different-standard']){const c=closedControl();edit(c);assert.equal((await prepareClosedRedox(c.request)).ok,false)}
})
test('rank gates reject underdetermined/disconnected families and contradictory reaction cycles',()=>{
 const c=closedControl();c.request.reactions.push({...c.request.reactions[0],id:'contradiction',logK:1});assert.equal(compileClosedRedoxNetwork(c.request).ok,false)
 const d=closedControl('three');d.request.reactions.pop();assert.equal(compileClosedRedoxNetwork(d.request).ok,false)
})
test('forged preparations cannot solve and inspection branding cannot be copied',()=>{
 assert.equal(solveClosedRedox(structuredClone(runs[0].p)).ok,false);assert.equal(isClosedRedoxResult(structuredClone(runs[0].r)),false)
})
