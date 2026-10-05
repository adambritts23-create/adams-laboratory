import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {physical,ids,repo} from '../scripts/validation/networkBenchmarks.js'
import {closedSolidsReference} from '../scripts/validation/closedSolidsReference.js'
import {closedPureSolidIds} from '../src/thermodynamics/closedPureSolids.js'
import {prepareClosedSolidExtension,solveClosedRedox} from '../src/solver/closedRedox.js'
import {solvePoint,closedSolidActivePolicy} from '../src/solver/point.js'
import {acceptedState} from '../src/beaker/acceptedState.js'
import {totalFractionState} from '../src/calculations/totalFractions.js'
import {saturatedLogSolubility} from '../src/calculations/solubility.js'
import {automaticAuditSession,runAutomaticControl} from '../scripts/validation/automaticSolidsAudit.js'
const amounts={[ids.F]:6e-6,'component:CrO4%202-':2e-6,'component:K%2B':2e-6,[ids.Cl]:.010012,[ids.H]:.010002}
const options={phases:['aqueous','pure-solids'],solidIds:closedPureSolidIds}
const control=await physical(amounts,options)
const reference=closedSolidsReference({names:['Fe 2+','CrO4 2-','K+','Cl-','H+','e-'],total:[6e-6,2e-6,2e-6,.010012,.010002,0],initial:[-9,-15,-5.7,-2,-2,-17],charges:[2,-2,1,-1,1,-1],solidIds:closedPureSolidIds})
test('coupled Fe/chromate agrees with independent raw-source nine-phase reference',()=>{
 assert.ok(control.result.ok,JSON.stringify(control.result.diagnostics))
 const a=control.result.accepted
 assert.ok(Math.abs(a.inspection.pH-reference.pH)<1e-8)
 assert.ok(Math.abs(a.inspection.pe-reference.pe)<1e-8)
 for(const c of a.inspection.carriers.filter(c=>c.phase==='aqueous')){
  const r=reference.carriers.find(s=>s.name===c.name);assert.ok(r,c.name)
  assert.ok(Math.abs(Math.log10(c.amount/r.amount))<1e-8,c.name)
 }
 assert.equal(a.result.solids.filter(s=>s.amount>0).length,1)
 for(const s of a.result.solids){const r=reference.phases.find(p=>p.id===s.id);assert.ok(Math.abs(s.amount-r.amount)<4e-14);assert.ok(Math.abs(s.logSaturation-r.logSaturation)<1e-8);assert.ok(s.amount>0?Math.abs(s.logSaturation)<=a.result.saturationTolerance:s.logSaturation<=a.result.saturationTolerance)}
 assert.ok(a.closed.inspection.inventories.every(r=>r.ok));assert.ok(a.closed.inspection.potentials.every(r=>r.ok));assert.ok(a.closed.inspection.waterBalance.ok)
 assert.equal(a.result.phaseSelection.history.length,2)
 assert.equal(control.compiled.inspection.networkSpeciesCount,64)
 assert.ok(control.result.phaseDiagnostics.filter(r=>r.phase==='solid').every(r=>r.logActivity<0))
 assert.ok(control.result.gasFugacitySum<1)
 assert.ok(reference.maximumMassActionResidual<1e-10);assert.ok(Math.abs(reference.charge)<1e-12)
 const partition=totalFractionState(a.system,a.input,a.result,ids.F)
 assert.ok(partition.ok,partition.reason);assert.equal(partition.total,6e-6)
 assert.ok(Math.abs(partition.sumFractions-1)<1e-10)
 assert.ok(Math.abs(partition.totalDissolved-a.inspection.elements.Fe.dissolved)<4e-14)
 const state=acceptedState(a.system,a.input,a.result)
 assert.equal(state.result,a.result);assert.ok(state.visual.bedHeight>0)
})
test('candidate ordering is immaterial in independently evaluated source reference',()=>{
 const reversed=closedSolidsReference({names:reference.names,total:reference.total,initial:[-9,-15,-5.7,-2,-2,-17],charges:[2,-2,1,-1,1,-1],solidIds:[...closedPureSolidIds].reverse()})
 assert.equal(reversed.pH,reference.pH);assert.equal(reversed.pe,reference.pe)
 assert.deepEqual(reversed.history,reference.history)
})
test('more acidic exact physical recipe remains fully aqueous with zero solid amounts',async()=>{
 const x=await physical({...amounts,[ids.Cl]:.100012,[ids.H]:.100002},options)
 assert.ok(x.result.ok,JSON.stringify(x.result.diagnostics))
 const a=x.result.accepted
 assert.ok(a.result.solids.every(s=>s.amount===0&&s.logSaturation<0))
 assert.equal(acceptedState(a.system,a.input,a.result).visual.bedHeight,0)
 assert.ok(Math.abs(a.inspection.elements.Fe.dissolved-6e-6)<4e-14)
})
test('unchanged ordinary Fe(III) pH zero bridge uses the same bounded phase selector',async()=>{
 const c=await runAutomaticControl(repo,'closed-solid selection bridge',automaticAuditSession(repo,['Fe 3+'],[1],2))
 const o=c.sweep.outcomes[0],r=solvePoint(c.system,o.input,{phaseSelection:closedSolidActivePolicy})
 assert.ok(r.ok,JSON.stringify(r.diagnostics))
 const i=c.system.components.findIndex(s=>s.name==='Fe 3+'),p=totalFractionState(c.system,o.input,r,c.system.components[i].id)
 assert.ok(p.ok);assert.ok(Math.abs(p.totalDissolved-.8989408591996729)<4e-14)
 assert.ok(Math.abs(r.solids.find(s=>s.name==='Fe2O3(cr)').amount-.0505295704001635)<4e-14)
 assert.ok(Math.abs(p.sumFractions-1)<1e-12)
 assert.ok(acceptedState(c.system,o.input,r).visual.bedHeight>0)
 assert.ok(Math.abs(saturatedLogSolubility(c.system,r,c.system.components[i].id).value-(-.046268879310268275))<1e-12)
})
test('aqueous-only contract retains the original solid-required refusal',async()=>{
 const x=await physical(amounts)
 assert.equal(x.result.ok,false);assert.equal(x.result.diagnostics[0].code,'relevant-solid-or-unresolved-phase')
 assert.ok(Math.abs(x.result.phaseDiagnostics.find(r=>r.name==='Fe2O3(cr)').logActivity-.9737725173551786)<1e-10)
})
test('unreviewed phase class is explicitly refused',async()=>{
 const x=await physical(amounts,{phases:['aqueous','solid-solutions']})
 assert.equal(x.compiled.ok,false);assert.equal(x.compiled.diagnostics[0].code,'unsupported-boundary-condition')
})
test('production candidate ordering and composition/capacity refusal are explicit',async()=>{
 const aqueous=await physical(amounts),base=aqueous.compiled.preparedSystemInput.prepared,solids=control.result.solidScope.admitted
 const reversed=await prepareClosedSolidExtension(base,[...solids].reverse()),r=solveClosedRedox(reversed)
 assert.ok(r.ok);assert.deepEqual(r.result.solids,control.result.accepted.result.solids)
 const invalid=await prepareClosedSolidExtension(base,[{...solids[0],elements:{Cr:-1}}])
 assert.equal(invalid.ok,false);assert.equal(invalid.diagnostics[0].code,'missing-solid-composition')
 const excess=await prepareClosedSolidExtension(base,[...solids,solids[0]])
 assert.equal(excess.ok,false);assert.equal(excess.diagnostics[0].code,'invalid-solid-scope')
 assert.equal(solveClosedRedox({...reversed}).ok,false)
})
test('persist compact phase evidence only after the focused scientific assertions',()=>{
 const a=control.result.accepted
 fs.writeFileSync('docs/closed-solids-benchmark.json',JSON.stringify({timing:control.result.timing,networkSpeciesCount:control.compiled.inspection.networkSpeciesCount,scope:control.result.solidScope,phaseDiagnostics:control.result.phaseDiagnostics,gasFugacitySum:control.result.gasFugacitySum,inspection:a.inspection,conservation:a.closed.inspection,solids:a.result.solids,phaseSelection:a.result.phaseSelection,reference},null,2)+'\n')
})
