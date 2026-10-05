import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { compileCanonicalRedox } from '../src/thermodynamics/canonicalRedox.js'
import { prepareCanonicalRedoxSession, canonicalRedoxTotals } from '../src/solver/prepareCanonicalRedox.js'
import { createRepository } from '../src/thermodynamics/repository.js'
import { automaticAuditSession } from '../scripts/validation/automaticSolidsAudit.js'
import { solveFixedRedox, peToEh } from '../src/solver/redox.js'
import { prepareChemicalSystem } from '../src/solver/models.js'
import { numericalValidationContract as contract } from '../src/solver/validationContract.js'
import { included as mnRows, compile as mnCompile } from '../scripts/validation/mnAudit.js'
const data=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')),repo=createRepository(data)
const record=name=>data.species.find(r=>r.name===name)
const terms=r=>r.metadata.effectiveSourceReaction.components
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-24+contract.comparisonRelativeConcentrationTolerance*Math.abs(b),`${a} versus ${b}`)
const session=name=>automaticAuditSession(repo,[name,'e-'])
const feSession=session('Fe 2+');feSession.chemicalSystem.excludedSpecies=[record('Fe0.932O(cr)').id]
const fe=await prepareCanonicalRedoxSession(feSession,repo),cu=await prepareCanonicalRedoxSession(session('Cu+'),repo),mn=await prepareCanonicalRedoxSession(session('Mn 2+'),repo)
const solve=(p,pH,pe)=>solveFixedRedox(p.system,{pH,Eh:peToEh(pe),totals:{[p.system.components[0].id]:.001}})
const components=[['A',2],['B',3],['C',4],['H+',1,'proton'],['e-',-1,'electron'],['H2O',0,'water']].map(([name,charge,role='ordinary'])=>({id:name,name,charge,role}))
const row=(id,name,charge,logBeta,terms,phase='aqueous')=>({id,name,charge,logBeta,terms,phase,validated:true,provenance:{kind:'synthetic-validation',id}})
const bridge=(id,name,from,e,k)=>row(id,name,components.find(c=>c.name===name).charge,k,[{name:from,coefficient:1},{name:'e-',coefficient:e}])
const ab=bridge('ab','B','A',-1,-3),bc=bridge('bc','C','B',-1,-4),ac=bridge('ac','C','A',-2,-7)
const compile=(records=[ab,bc,ac],extra={})=>compileCanonicalRedox({components,records,selectedIds:['A','C'],...extra})

test('canonical basis: deterministic source identity, incidence rank and one inventory independent of order',()=>{
 const a=compile(),b=compile([ac,bc,ab],{selectedIds:['C','A']})
 assert.ok(a.ok);assert.deepEqual(a,b);assert.equal(a.components[0].id,'A');assert.equal(a.validation.rank,2)
 assert.equal(a.validation.dependentBasisCount,2);assert.deepEqual(a.inventory.weights.map(x=>x.coefficient),[1,1,1])
 assert.equal(a.products.find(p=>p.name==='C').logBeta,-7)
})
test('canonical basis: reversed bridge direction yields equivalent state even without a forward product row',()=>{
 const forward=compile([ab],{selectedIds:['B']}),reverse=compile([bridge('ab','A','B',1,3)],{selectedIds:['A']})
 assert.ok(forward.ok&&reverse.ok)
 for(const key of ['components','inventory'])assert.deepEqual(forward[key],reverse[key])
 assert.deepEqual(forward.products.map(({id,name,coefficients,logBeta})=>({id,name,coefficients,logBeta})),reverse.products.map(({id,name,coefficients,logBeta})=>({id,name,coefficients,logBeta})))
 assert.equal(reverse.products[0].sourceRecord.transformations[0].multiplier,-1)
})
test('canonical rejection: disconnected, missing, redundant and unsupported bridge structures',()=>{
 assert.equal(compile([ab]).diagnostics[0].code,'disconnected-redox-states')
 assert.equal(compile([],{selectedIds:['A']}).diagnostics[0].code,'missing-bridge')
 assert.equal(compile([ab],{selectedIds:['A','A']}).diagnostics[0].code,'redundant-basis')
 const bad=structuredClone(ab);bad.terms[0].coefficient=2
 assert.equal(compile([bad],{selectedIds:['A']}).diagnostics[0].code,'source-validation-incomplete')
})
test('canonical cycles: consistent alternatives accepted; inconsistent logBeta or electron bookkeeping rejected without averaging',()=>{
 const before=JSON.stringify([ab,bc,ac]);assert.ok(compile().ok)
 const bad={...ac,logBeta:-7.001};const out=compile([ab,bc,bad]);assert.equal(out.diagnostics[0].code,'inconsistent-cycle');close(out.diagnostics[0].logBetaResidual,.001)
 const wrong=structuredClone(ac);wrong.terms[1].coefficient=-1
 assert.equal(compile([ab,bc,wrong]).diagnostics[0].code,'source-validation-incomplete')
 assert.equal(JSON.stringify([ab,bc,ac]),before)
})
test('canonical substitution: exact signed integer H/e coefficients, logBeta and reconstructable multipliers',()=>{
 const target=row('oxide','oxide',0,2,[{name:'B',coefficient:2},{name:'H+',coefficient:-6},{name:'H2O',coefficient:3}],'solid')
 const p=compile([ab,target],{selectedIds:['A']});assert.ok(p.ok)
 const oxide=p.products.find(p=>p.id==='oxide');assert.deepEqual(oxide.coefficients,[2,-6,-2,3]);assert.equal(oxide.logBeta,-4)
 assert.deepEqual(oxide.sourceRecord.original.coefficients,target.terms);assert.equal(oxide.sourceRecord.transformations[0].multiplier,2)
 assert.equal(oxide.logBeta,oxide.sourceRecord.original.logBeta+oxide.sourceRecord.transformations.reduce((sum,t)=>sum+t.multiplier*t.bridge.logBeta,0))
 assert.ok(Object.isFrozen(oxide.sourceRecord.original));assert.deepEqual(target.terms[0],{name:'B',coefficient:2})
})
test('canonical exclusions apply to every source representation of a phase',()=>{
 const target=row('s1','solid',0,2,[{name:'B',coefficient:1},{name:'H+',coefficient:-3},{name:'H2O',coefficient:1}],'solid')
 const p=compile([ab,target,{...target,id:'s2'}],{selectedIds:['A'],excludedIds:['s1']});assert.ok(p.ok);assert.equal(p.products.length,1);assert.equal(p.omitted.length,2)
 assert.equal(compile([ab],{selectedIds:['A'],excludedIds:['ab']}).diagnostics[0].code,'excluded-redox-state')
})
test('canonical source and inventory gates: Fe fractional oxide stays explicit, independent totals are never silently merged',()=>{
 assert.ok(fe.ok&&cu.ok&&mn.ok)
 assert.equal(fe.system.redoxPolicy,'fixed-electron-v1')
 assert.equal(canonicalRedoxTotals(fe,{componentIds:[fe.system.components[0].id],total:.001}).ok,false)
 assert.deepEqual(canonicalRedoxTotals(fe,{componentIds:fe.canonical.inventory.sourceComponentIds,total:.001}).totals,{[fe.system.components[0].id]:.001})
 assert.equal(fe.pourbaixEnabled,false);assert.equal(fe.system.components.filter(c=>c.role==='ordinary').length,1)
})
test('canonical unbounded Fe request reports unsupported source coefficients instead of rounding',async()=>{
 const p=await prepareCanonicalRedoxSession(session('Fe 2+'),repo);assert.equal(p.ok,false);assert.equal(p.diagnostics[0].recordId,record('Fe0.932O(cr)').id)
})
test('canonical Fe and Cu exchange, alternate basis solids and fixed potential conserve total and residual contract',async()=>{
 for(const p of [fe,cu])for(const [pH,pe] of [[2,0],[7,0],[7,13],[10,20]]){
  const x=await solve(p,pH,pe);assert.ok(x.ok,JSON.stringify(x.diagnostics));close(x.result.componentTotals[0],.001)
  const solid=x.result.solids.reduce((sum,s)=>sum+s.amount*p.system.products.find(r=>r.id===s.id).coefficients[0],0)
  close(x.result.dissolvedComponentAmounts[0]+solid,.001)
  assert.equal(x.result.concentrations[2],0);assert.deepEqual(x.result.residuals.componentBalance.slice(1),[null,null,null]);close(x.result.logActivities[2],-pe)
  x.result.residuals.massActionLog.forEach(v=>{if(v!==null)assert.ok(Math.abs(v)<=contract.massActionLogResidualTolerance)})
  for(const s of x.result.solids.filter(s=>s.amount>0))assert.ok(Math.abs(s.logSaturation)<=contract.saturatedSolidLogActivityTolerance)
  const alternate=p.system.products.find(r=>r.name===(p===fe?'Fe 3+':'Cu+'))
  close(x.result.logActivities[p.system.speciesIds.indexOf(alternate.id)]-x.result.logActivities[0],alternate.logBeta-pe*alternate.coefficients[2])
 }
})
test('canonical solids: candidates alone do not precipitate, exclusion survives, accepted amount remains exact',async()=>{
 const clear=await solve(fe,2,0);assert.ok(clear.ok);assert.ok(clear.result.solids.every(s=>s.amount===0))
 const active=await solve(fe,7,0);assert.equal(active.result.solids.find(s=>s.amount>0).name,'Fe2O3(cr)')
 const s=structuredClone(feSession);s.chemicalSystem.excludedSpecies.push(record('Fe2O3(cr)').id)
 const p=await prepareCanonicalRedoxSession(s,repo);assert.ok(p.ok);assert.ok(!p.system.products.some(p=>p.name==='Fe2O3(cr)'))
 const x=await solve(p,7,0);assert.ok(x.ok);assert.ok(!x.result.solids.some(p=>p.name==='Fe2O3(cr)'))
 assert.equal(JSON.parse(JSON.stringify(active)).result.solids.find(s=>s.amount>0).amount,active.result.solids.find(s=>s.amount>0).amount)
})
test('canonical Mn agrees with independent existing offline compiler for every overlapping row',()=>{
 assert.ok(mn.ok)
 for(const r of mnRows){const expected=mnCompile(r),actual=mn.system.products.find(p=>p.name===r.name);assert.ok(actual,r.name);assert.deepEqual(actual.coefficients,expected.coefficients);close(actual.logBeta,expected.logBeta)}
})
// Independently curated atom counts, deliberately confined to validation.
const atoms={'Fe 2+':[1,0,0],'Fe 3+':[1,0,0],'Fe(OH)2(cr)':[1,2,2],'Fe2O3(cr)':[2,0,3],'Fe3O4(cr)':[3,0,4],'Cu 2+':[1,0,0],'Cu+':[1,0,0],'Cu2O(cr)':[2,0,1],'CuO(cr)':[1,0,1]}
test('canonical representative Fe/Cu products preserve independent metal/H/O counts',()=>{
 for(const p of [fe,cu])for(const r of p.system.products.filter(p=>atoms[p.name])){
  const [m,h,,w]=r.coefficients;assert.deepEqual([m,h+2*w,w],atoms[r.name],r.name)
 }
})
// Independent alternative source coordinate solve. Re-express directly from imported
// rows against the other basis; do not use the canonical compiler's transformed rows.
async function reversePrepared(p,otherName){
 const primary=p.system.components[0].name,bridgeRecord=record(primary),bridgeTerms=terms(bridgeRecord)
 assert.equal(bridgeTerms.find(t=>t.name===otherName).coefficient,1)
 const basis=[otherName,'H+','e-','H2O'],names=p.system.products.map(p=>p.name).filter(n=>n!==otherName).concat(primary)
 const spec={basisStatus:'explicit-direct',redoxPolicy:'fixed-electron-v1',solidPolicy:'bounded-multisolid-v1',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{kind:'independent-reverse-source-coordinate-validation'},components:basis.map((name,i)=>({id:name,name,role:['ordinary','proton','electron','water'][i]})),products:names.map(name=>{
  const r=record(name),a=basis.map(n=>terms(r).find(t=>t.name===n)?.coefficient??0),factor=terms(r).find(t=>t.name===primary)?.coefficient??0
  basis.forEach((n,i)=>{a[i]+=factor*(bridgeTerms.find(t=>t.name===n)?.coefficient??0)})
  return {id:name,name,phase:r.phase,coefficients:a,logBeta:r.logK+factor*bridgeRecord.logK,sourceRecord:r.provenance}
 })}
 const prepared=await prepareChemicalSystem(spec);assert.ok(prepared.ok);return {system:prepared.system}
}
test('reverse Fe and Cu physical equilibrium equivalence under independent alternative source-coordinate solve',async()=>{
 for(const [p,name] of [[fe,'Fe 3+'],[cu,'Cu+']]){
  const reverse=await reversePrepared(p,name)
  for(const [pH,pe] of [[2,0],[7,0],[7,13]]){
   const [x,y]=await Promise.all([solve(p,pH,pe),solve(reverse,pH,pe)]);assert.ok(x.ok&&y.ok,JSON.stringify([x.diagnostics,y.diagnostics]))
   for(let i=0;i<p.system.speciesIds.length;i++){
    const n=[...p.system.components,...p.system.products][i].name,j=[...reverse.system.components,...reverse.system.products].findIndex(s=>s.name===n)
    close(x.result.concentrations[i],y.result.concentrations[j])
   }
   for(const s of x.result.solids)close(s.amount,y.result.solids.find(v=>v.name===s.name).amount)
  }
 }
})
test('source selection of either Fe valence compiles to identical prepared chemistry',async()=>{
 const s=structuredClone(feSession);s.chemicalSystem.selectedComponents=s.chemicalSystem.selectedComponents.map(id=>id===fe.system.components[0].id?repo.getComponents().find(c=>c.name==='Fe 3+').id:id)
 const p=await prepareCanonicalRedoxSession(s,repo);assert.ok(p.ok);assert.deepEqual(p.system,fe.system)
})

test('canonical Fe/Cu re-expression onto alternate source basis compiles back to common physical representation',async()=>{
 for(const [p,name] of [[fe,'Fe 3+'],[cu,'Cu+']]){
  const reverse=await reversePrepared(p,name),basis=reverse.system.components
  const records=reverse.system.products.map(r=>({id:r.name,name:r.name,phase:r.phase,charge:record(r.name).charge,logBeta:r.logBeta,terms:r.coefficients.map((coefficient,i)=>({name:basis[i].name,coefficient})).filter(t=>t.coefficient!==0),validated:true,provenance:{kind:'independent-alternative-basis-fixture',original:r.sourceRecord}}))
  const compiled=compileCanonicalRedox({components:repo.getComponents().map(c=>({id:c.id,name:c.name,role:c.role==='basis-choice'?'ordinary':c.role==='solvent'?'water':c.role,charge:c.name==='H+'?1:c.name==='e-'?-1:c.name==='H2O'?0:record(c.name)?.charge??0})),records,selectedIds:p.canonical.inventory.sourceComponentIds})
  assert.ok(compiled.ok,JSON.stringify(compiled.diagnostics))
  for(const r of compiled.products){const expected=p.system.products.find(x=>x.name===r.name);assert.ok(expected);assert.deepEqual(r.coefficients,expected.coefficients);close(r.logBeta,expected.logBeta)}
 }
})
test('canonical bounded graph rejects oversized families and source candidates with missing bridges',()=>{
 const bigComponents=Array.from({length:9},(_,i)=>({id:'Q'+i,name:'Q'+i,role:'ordinary',charge:i})).concat(components.filter(c=>c.role!=='ordinary'))
 const records=Array.from({length:8},(_,i)=>row('edge'+i,'Q'+(i+1),i+1,-1,[{name:'Q'+i,coefficient:1},{name:'e-',coefficient:-1}]))
 assert.equal(compileCanonicalRedox({components:bigComponents,records,selectedIds:['Q0']}).diagnostics[0].code,'unsupported-size')
 const foreign=row('outside','outside',4,1,[{name:'C',coefficient:1}])
 assert.equal(compile([ab,foreign],{selectedIds:['A'],productIds:['outside']}).diagnostics[0].code,'missing-bridge')
})
test('canonical alternate basis selection order and existing independent inventories do not alter ordinary session input',async()=>{
 const s=structuredClone(feSession),before=JSON.stringify(s)
 s.chemicalSystem.selectedComponents.push(repo.getComponents().find(c=>c.name==='Fe 3+').id)
 const changed=JSON.stringify(s),p=await prepareCanonicalRedoxSession(s,repo)
 assert.ok(p.ok);assert.deepEqual(p.system,fe.system);assert.equal(JSON.stringify(s),changed);assert.notEqual(changed,before)
})

test('canonical prepared system feeds existing pH/pe grid with one preparation and fixed electron controls',async()=>{
 const {createGridDefinition,runGrid}=await import('../src/calculations/grid.js')
 const {createCalculationDefinition}=await import('../src/calculations/definition.js')
 const system=fe.system,chemical={selectedComponents:system.components.map(c=>c.id),selectedSpecies:system.products.map(p=>p.id),temperature:25,pressure:1,enabledPhases:['aqueous','solid','liquid']}
 const definition=createCalculationDefinition(chemical,{getComponentById:id=>{const c=system.components.find(c=>c.id===id);return {...c,role:c.role==='ordinary'?'basis-choice':c.role==='water'?'solvent':c.role}}})
 definition.componentConditions=[{componentId:system.components[0].id,mode:'T',quantity:'total',unit:'mol/kg-H2O',value:.001},{componentId:system.components[3].id,mode:'LA',quantity:'log-activity',unit:'dimensionless',value:0}]
 definition.independentVariables=[{componentId:system.components[1].id,mode:'LAV',quantity:'pH',unit:'dimensionless',range:{min:2,max:7},points:2},{componentId:system.components[2].id,mode:'LAV',quantity:'pe',unit:'dimensionless',range:{min:0,max:13},points:2}]
 const prepared=await createGridDefinition(system,definition,0);assert.ok(prepared.ok,JSON.stringify(prepared))
 const result=await runGrid(system,prepared.grid);assert.equal(result.counts.converged,4)
 for(const outcome of result.outcomes){assert.equal(outcome.input.systemId,system.id);close(outcome.result.componentTotals[0],.001);close(outcome.result.logActivities[2],-outcome.y)}
})
