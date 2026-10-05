import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {ironCeriumExample} from '../src/data/ironCeriumExample.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork,equilibriumSourceFingerprint} from '../src/thermodynamics/equilibriumNetwork.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const example=ironCeriumExample(repo)
const request=amounts=>({boundary:'closed-physical',selectedIds:example.chemicalSystem.selectedComponents,
 sourceFingerprint:equilibriumSourceFingerprint,phases:example.calculationDefinition.generalClosed.phases,
 solvent:'unit-water-activity',amounts,revision:0,temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O'})
test('iron cerium preset has explicit neutral inventory and no imposed pH or electron',()=>{
 assert.ok(!example.chemicalSystem.selectedComponents.includes('component:e-'))
 assert.equal(example.calculationDefinition.generalClosed.amounts['component:Cl-'],.010004)
 assert.equal(example.calculationDefinition.imposedEh,undefined)
})
test('source Fe/Ce mixture conserves both metals and charge and obeys independent net mass action',async()=>{
 let lastFeII=Infinity
 for(const dose of [2.5e-7,5e-7]){
  const amounts={...example.calculationDefinition.generalClosed.amounts,'component:Ce%204%2B':dose,'component:Cl-':.010002+4*dose}
  const compiled=await compileEquilibriumNetwork(repo,request(amounts))
  assert.ok(compiled.ok,JSON.stringify(compiled.diagnostics))
  const result=solveEquilibriumNetwork(compiled)
  assert.ok(result.ok,JSON.stringify(result.diagnostics))
  const a=result.accepted,rows=a.inspection.carriers,values=Object.fromEntries(rows.map(r=>[r.name,r.amount]))
  // Independent four-ion net reaction quotient, no solver basis or returned logK used.
  // Source constants: Ce(IV)+e -> Ce(III):29.08; Fe(III)+e -> Fe(II):13.051.
  const logQ=Math.log10(values['Fe 3+'])+Math.log10(values['Ce 3+'])-Math.log10(values['Fe 2+'])-Math.log10(values['Ce 4+'])
  assert.ok(Math.abs(logQ-(29.08-13.051))<1e-7)
  const iron=rows.reduce((n,r)=>n+(r.elements?.Fe??0)*r.amount,0)
  // Explicit independently counted Ce carriers in this source network.
  const cerium=rows.filter(r=>r.name.startsWith('Ce')).reduce((n,r)=>n+(r.name.startsWith('Ce6(')?6:r.name.startsWith('Ce2(')?2:1)*r.amount,0)
  assert.ok(Math.abs(iron-1e-6)<1e-13)
  assert.ok(Math.abs(cerium-dose)<1e-13)
  assert.ok(a.closed.inspection.inventories.every(r=>r.ok))
  assert.ok(a.closed.inspection.inventories.some(r=>r.key==='charge'&&r.ok))
  assert.ok(values['Ce 4+']<dose*1e-12)
  assert.ok(values['Fe 3+']>0&&values['Fe 2+']<lastFeII)
  lastFeII=values['Fe 2+']
  assert.ok(Number.isFinite(a.inspection.Eh)&&Number.isFinite(a.inspection.pH))
 }
})
test('missing counterions cannot silently become a closed redox solution',async()=>{
 const amounts={...example.calculationDefinition.generalClosed.amounts,'component:Cl-':0}
 const compiled=await compileEquilibriumNetwork(repo,request(amounts))
 assert.equal(compiled.ok,false)
 assert.ok(compiled.diagnostics.some(d=>d.code==='unbalanced-preparation'))
})
