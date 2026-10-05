import fs from 'node:fs'
import {networkBenchmarks} from './networkBenchmarks.js'
const b=await networkBenchmarks(),summary={},capacity=[]
for(const [name,cases] of Object.entries(b)){
 const converted=(Array.isArray(cases)?cases:[cases]).map((c,i)=>{
  const a=c.result.accepted??c.result.candidate,point=a?.closed?.result??a,net=c.compiled.preparedSystemInput?.prepared?.network,inspection=c.compiled.inspection
  const sizes={species:net?.sourceSpecies.length??Object.keys(inspection.metadata).length,reactions:inspection.included.length,rank:net?.algebra.rank??inspection.independentReactionRank,basis:net?.basisIds.length??c.request.selectedIds.length}
  const metrics={name:name+(Array.isArray(cases)?' '+i:''),accepted:c.result.ok,...sizes,...c.result.timing,minimumPivotRatio:point?.minimumPivotRatio,iterations:point?.iterations,pH:a?.inspection?.pH??-point.logActivities[0],Eh:a?.inspection?.Eh??null,maximumCarrierLogError:c.comparison?.maximumCarrierLogError??null}
  capacity.push(metrics)
  return {request:c.request,metrics,status:c.result.status,diagnostics:c.result.diagnostics,sourceFingerprint:c.compiled.sourceFingerprint,metadataVersion:inspection.metadataVersion,sourceLaws:inspection.included.map(r=>({id:r.id,name:r.name,phase:r.phase,reference:r.reference,terms:r.terms,logK:r.logK})),composition:Object.values(inspection.metadata).map(m=>({id:m.id,name:m.name,charge:m.charge,elements:m.elements,sourceIdentity:{id:m.sourceIdentity?.id,reference:m.sourceIdentity?.reference,derivation:m.sourceIdentity?.derivation,componentSha256:m.sourceIdentity?.componentSha256}})),algebra:{rank:sizes.rank,cycleChecks:inspection.cycleChecks??inspection.algebra?.cycleChecks,conservation:inspection.conservation},equilibrium:a?.inspection??{speciesIds:point.speciesIds,concentrations:point.concentrations,logActivities:point.logActivities,residuals:point.residuals},closure:a?.closed?.inspection,phaseDiagnostics:c.result.phaseDiagnostics,comparison:c.comparison}
 })
 summary[name]=Array.isArray(cases)?converted:converted[0]
}
fs.writeFileSync('docs/network-compiler-benchmarks.json',JSON.stringify(summary,null,2))
fs.writeFileSync('docs/network-compiler-capacity.json',JSON.stringify({limitsChanged:false,conditioning:'Minimum pivot ratio from unchanged solver, not a full condition number. Source-species counts include water and formal electron (when present); analytical species include water. Success below capacity does not validate arbitrary networks.',rows:capacity},null,2))
console.log(capacity)
