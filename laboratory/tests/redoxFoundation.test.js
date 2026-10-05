import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { prepareChemicalSystem,createPointInput } from '../src/solver/models.js'
import { ehToPe,peToEh,solveFixedRedox } from '../src/solver/redox.js'
import { prepare,point,analytical,specification } from './redoxHelpers.js'
import { reconstruct,definitionFor,vary } from './phase6Helpers.js'
import { createSweepDefinition,runSweep } from '../src/calculations/sweep.js'
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-25+Math.abs(b)*2e-10,`${a} vs ${b}`)
test('redox: electron intensive semantics, independent H/e, no electron balance',async()=>{
 const s=await prepare(),x=await point(s,7,13.3);assert.ok(x.ok);reconstruct(s,x.input,x.result)
 assert.equal(s.components[2].suppressed,true);assert.equal(x.result.concentrations[2],0)
 assert.deepEqual(x.result.residuals.componentBalance.slice(1),[null,null,null]);close(x.result.concentrations[0],.0005)
 const changed=await point(s,8,13.3);assert.equal(changed.input.constraints[2].value,x.input.constraints[2].value);assert.equal(changed.input.constraints[1].value,-8)
 const bad=await createPointInput(s,{...x.input,constraints:x.input.constraints.map((c,i)=>i===2?{...c,kh:1,value:0}:c)})
 assert.equal(bad.ok,false);assert.ok(bad.diagnostics.some(d=>d.code==='invalid-redox-constraint'))
})
test('redox: SHE conversion magnitude, round trip and temperature dependence',()=>{
 close(peToEh(1),.05915934968478112)
 for(const t of [0,25,50])for(const pe of [-20,0,20])assert.ok(Math.abs(ehToPe(peToEh(pe,t),t)-pe)<1e-13)
 close(peToEh(1,50)/peToEh(1,25),323.15/298.15)
 assert.equal(ehToPe(1,-273.15),null);assert.equal(ehToPe(NaN),null)
})
test('redox: analytical aqueous equilibrium and quantitative proton-coupled slope',async()=>{
 const s=await prepare()
 for(const pH of [3,7,10]){const pe=(122.5-8*pH)/5;const x=await point(s,pH,pe);assert.ok(x.ok);close(x.result.concentrations[0],.0005);close(x.result.concentrations[4],.0005);reconstruct(s,x.input,x.result)}
 close(peToEh((122.5-8*8)/5)-peToEh((122.5-8*7)/5),-1.6*peToEh(1))
})
test('redox: existing sweep changes oxidation-state ordering according to mass action',async()=>{
 const s=await prepare(),x=await point(s,7,10)
 const d=vary(definitionFor(s,x.input),'e-','LAV',10,16,7,'pe'),p=await createSweepDefinition(s,d,0);assert.ok(p.ok)
 const r=await runSweep(s,p.sweep);assert.equal(r.counts.converged,7)
 let previous=-1
 for(const o of r.outcomes){const a=analytical(7,o.coordinate);close(o.result.concentrations[0],a.free);close(o.result.concentrations[4],a.permanganate);assert.ok(o.result.concentrations[4]>previous);previous=o.result.concentrations[4];reconstruct(s,o.input,o.result)}
})
test('redox: pure-solid assemblage agrees with independent saturation bounds and candidate order',async()=>{
 const s=await prepare(true),spec=specification(true);spec.products.reverse();const reversed=await prepareChemicalSystem(spec);assert.ok(reversed.ok)
 for(const [pH,pe] of [[7,-25],[7,0],[7,10],[7,20]]){
 const x=await point(s,pH,pe);assert.ok(x.ok,JSON.stringify(x.result));const a=analytical(pH,pe,true)
 close(x.result.concentrations[0],a.free);close(x.result.concentrations[s.speciesIds.indexOf(s.products.find(p=>p.name==='MnO4-').id)],a.permanganate)
 const active=x.result.solids.filter(p=>p.amount>0);assert.deepEqual(active.map(p=>p.name),a.solid?[a.solid.name]:[]);if(a.solid)close(active[0].amount,a.solid.amount)
 reconstruct(s,x.input,x.result);const y=await point(reversed.system,pH,pe);assert.deepEqual(y.result.concentrations,x.result.concentrations);assert.deepEqual(y.result.solids,x.result.solids)
 }
})
test('redox: unsupported conditions, missing controls and failed states remain explicit',async()=>{
 const s=await prepare();assert.equal((await solveFixedRedox(s,{pH:7,Eh:NaN})).ok,false)
 assert.equal((await solveFixedRedox(s,{pH:7,Eh:0,temperatureC:50,totals:{'Mn 2+':.001}})).ok,false)
 const zero=await solveFixedRedox(s,{pH:7,Eh:0,totals:{'Mn 2+':0}});assert.equal(zero.ok,false);assert.equal(zero.result.result,null);assert.equal(zero.contributions,null)
 const spec=specification(true);delete spec.redoxPolicy;assert.equal((await prepareChemicalSystem(spec)).ok,false)
 const missing=specification();missing.components=missing.components.slice(0,3);assert.equal((await prepareChemicalSystem(missing)).ok,false)
})
test('redox: exact JSON trace preserves provenance, balances, coefficients and no classification claim',async()=>{
 const x=await point(await prepare(true),7,10),copy=JSON.parse(JSON.stringify(x));assert.deepEqual(copy,x)
 assert.equal(copy.coordinates.referenceElectrode,'SHE');assert.equal(copy.classification,null)
 assert.ok(copy.system.products.every(p=>p.sourceRecord));assert.equal(copy.contributions[0].aqueous.length,2)
 assert.ok(copy.contributions[0].aqueous.every(p=>p.coefficient===1));assert.ok(copy.result.assemblageSelection)
})
test('redox: immutable golden and bundled source artifacts',()=>{
 for(const [path,hash] of [['tests/fixtures/eq-diagr/references.json','aefc0949b585ef290595088c8ed852a1eb591be25dff24563a44a2cf98d40960'],['public/data/thermodynamic-default.json','9fa7db6f4a13a88073a0ca214c412690846674f6b3f442e336baf1586c45d245']])assert.equal(createHash('sha256').update(fs.readFileSync(path)).digest('hex'),hash)
})
