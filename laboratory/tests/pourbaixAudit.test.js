import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRepository } from '../src/thermodynamics/repository.js'
import { sourceCharge, effectiveComponents } from '../src/thermodynamics/importers/spana/names.js'
import { ehToPe, peToEh } from '../src/solver/redox.js'
import { automaticAuditSession } from '../scripts/validation/automaticSolidsAudit.js'
import { prepareSessionStructure } from '../src/solver/prepareSession.js'
import { discoverReactionSet, usesAutomaticSolids } from '../src/thermodynamics/compatibility.js'
const data=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json'))
const repo=createRepository(data), record=name=>data.species.find(s=>s.name===name)

test('Pourbaix audit: signed imported Fe/Cu/Mn electron reactions conserve representative atoms and charge',()=>{
  // Independent atom counts for this audit only, never a production formula adapter.
  const atoms={'Fe 2+':{Fe:1},'Fe 3+':{Fe:1},'Cu+':{Cu:1},'Cu 2+':{Cu:1},'Mn 2+':{Mn:1},'H+':{H:1},'e-':{},H2O:{H:2,O:1},'Fe3O4(cr)':{Fe:3,O:4},'Cu(cr)':{Cu:1},'MnO4-':{Mn:1,O:4},'MnO2(s)':{Mn:1,O:2}}
  for(const name of ['Fe 2+','Fe 3+','Cu+','Cu 2+','Cu(cr)','Fe3O4(cr)','MnO4-','MnO2(s)']){
    const r=record(name), terms=r.metadata.effectiveSourceReaction.components
    assert.equal(terms.reduce((s,t)=>s+t.coefficient*sourceCharge(t.name),0),sourceCharge(name))
    for(const e of ['Fe','Cu','Mn','H','O'])assert.equal(terms.reduce((s,t)=>s+t.coefficient*(atoms[t.name][e]??0),0),atoms[name][e]??0)
    assert.deepEqual(terms,effectiveComponents(r.provenance.original.raw))
    assert.equal(r.logK,r.provenance.originalLogK)
  }
})
test('Pourbaix audit: reciprocal redox constants and electron signs agree with formation direction',()=>{
  for(const [reduced,oxidized,k] of [['Fe 2+','Fe 3+',13.051],['Cu+','Cu 2+',2.833]]){
    assert.equal(record(reduced).logK,k);assert.equal(record(oxidized).logK,-k)
    assert.equal(record(reduced).componentStoichiometry['e-'],1)
    assert.equal(record(oxidized).componentStoichiometry['e-'],-1)
    // log(a_reduced/a_oxidized) = K - pe; more positive Eh favors oxidation.
    assert.ok(k-ehToPe(peToEh(k+1))<0)
  }
})
test('Pourbaix audit: 25 C Eh/pe magnitude, sign and round trip remain source-aligned',()=>{
  assert.ok(Math.abs(peToEh(1)-0.05915934968478112)<1e-12)
  for(const pe of [-20,-1,0,1,20])assert.ok(Math.abs(ehToPe(peToEh(pe))-pe)<1e-13)
  assert.ok(ehToPe(-0.5)<0);assert.ok(ehToPe(0.5)>0)
})
test('Pourbaix audit: selecting both oxidation bases is rejected rather than merging analytical totals',async()=>{
  for(const pair of [['Fe 2+','Fe 3+'],['Cu+','Cu 2+'],['Mn 2+','Mn 3+']]){
    const s=automaticAuditSession(repo,[...pair,'e-'])
    const p=await prepareSessionStructure(s,repo)
    assert.equal(p.ok,false);assert.ok(p.diagnostics.some(d=>d.code==='redundant-basis'))
  }
})
test('Pourbaix audit: direct FeII basis cannot discover ferric oxides by canonical substitution',()=>{
  const s=automaticAuditSession(repo,['Fe 2+','e-'])
  const discovery=discoverReactionSet(repo,s.chemicalSystem)
  const hematite=discovery.rows.find(r=>r.species.name==='Fe2O3(cr)')
  assert.equal(hematite.compatible,false);assert.deepEqual(hematite.missing,['Fe 3+'])
  assert.equal(usesAutomaticSolids(s.chemicalSystem,repo),false)
})
test('Pourbaix audit: ordinary preparation cannot activate cross-oxidation multi-solid policy',async()=>{
  const s=automaticAuditSession(repo,['Fe 3+','e-'])
  s.chemicalSystem={...s.chemicalSystem,selectedSpecies:[...s.chemicalSystem.selectedSpecies,record('Fe2O3(cr)').id,record('Fe3O4(cr)').id]}
  s.calculationDefinition.gridMultiSolid=true
  const p=await prepareSessionStructure(s,repo)
  assert.equal(p.ok,false);assert.ok(p.diagnostics.some(d=>d.code==='unsupported-redox-assemblage'))
})
