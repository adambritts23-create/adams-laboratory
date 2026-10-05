// Audit/reference only. Never imported by production. No new bottle enabled.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createRepository} from '../../src/thermodynamics/repository.js'
import {discoverGeneralClosed} from '../../src/thermodynamics/generalClosedReagents.js'
import {nonRedoxScope} from '../../src/thermodynamics/nonRedoxPhysical.js'
import {networkComposition} from '../../src/thermodynamics/networkComposition.js'
import {preparationCharge} from '../../src/thermodynamics/reagentPreparation.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork,equilibriumSourceFingerprint} from '../../src/thermodynamics/equilibriumNetwork.js'
import {closedSolidsReference} from './closedSolidsReference.js'
const raw=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')),repo=createRepository(raw)
const ids={Cr:'component:Cr%203%2B',Cl:'component:Cl-',Na:'component:Na%2B',H:'component:H%2B',W:'component:H2O'}
const selected=[ids.Cr,ids.Cl,ids.H,ids.W],baseNames=['Cr 3+','Cl-','Na+','H+','e-'],known=new Set([...baseNames,'H2O'])
const terms=r=>r.metadata?.effectiveSourceReaction?.components?.filter(t=>t.coefficient!==0)
let changed=true
while(changed){changed=false;for(const row of raw.species)if(row.phase==='aqueous'&&terms(row)?.length&&terms(row).every(t=>known.has(t.name))&&!known.has(row.name)){known.add(row.name);changed=true}}
const reachable=raw.species.filter(r=>terms(r)?.length&&terms(r).every(t=>known.has(t.name))).map(r=>({id:r.id,name:r.name,phase:r.phase,terms:terms(r),logK:r.logK,reference:r.citation,provenance:r.provenance}))
const sourceIds=reachable.filter(r=>r.phase==='solid').map(r=>r.id),start=performance.now()
const initialAudit=await discoverGeneralClosed(repo,selected),sodiumAudit=await discoverGeneralClosed(repo,[...selected,ids.Na]),registry=await networkComposition(repo)
const coordinates={[ids.Cr]:.0005/.06,[ids.Cl]:.0015/.06,[ids.Na]:.001/.06,[ids.H]:-.001/.06}
const charge=preparationCharge(coordinates,registry.entries)
const q={boundary:'closed-physical',selectedIds:selected,amounts:{[ids.Cr]:.01,[ids.Cl]:.03,[ids.H]:0},revision:0,temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O',sourceFingerprint:equilibriumSourceFingerprint,phases:['aqueous','pure-solids'],solvent:'unit-water-activity'}
const compiled=await compileEquilibriumNetwork(repo,q),initial=compiled.ok?solveEquilibriumNetwork(compiled):compiled
const preparationAttempt=await compileEquilibriumNetwork(repo,{...q,amounts:undefined,preparation:{provenance:'Physical NaOH source record request'}})
const audit={sourceFingerprint:equilibriumSourceFingerprint,recipeCandidate:{status:'NOT ENABLED',identity:'Idealized dissolved chromium(III) chloride formula-unit preparation; no dissolution kinetics or hydrate claim',formula:'CrCl3',elements:{Cr:1,Cl:3},formulaCharge:0,suppliedForms:{[ids.Cr]:1,[ids.Cl]:3},source:'https://webbook.nist.gov/cgi/cbook.cgi?Name=CrCl3',sourceAccessed:'2026-09-16',sourceMeaning:'NIST formula Cl3Cr and CAS 10025-73-7 establish substance stoichiometry; existing source-bound Cr(III)/chloride metadata establishes the proposed supplied-coordinate mapping, not final equilibrium species.',hydrateWater:0,recipeVersion:'crcl3-onboarding-audit-v1',metadataVersion:registry.version,conditions:{temperatureC:25,pressureBar:1,activityModel:'ideal',volumeConvention:'dilute-ideal-aqueous-volume-v0'}},identities:Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,{component:repo.getComponentById(id),metadata:registry.entries[id]}])),nonRedox:nonRedoxScope(repo,[...selected,ids.Na]),initialRedox:{canCalculate:initialAudit.canCalculate,reasons:initialAudit.reasons,counts:{aqueous:initialAudit.included.length,solids:initialAudit.candidateSolids.length,gases:initialAudit.candidateGases.length}},sodiumRedox:{canCalculate:sodiumAudit.canCalculate,reasons:sodiumAudit.reasons},signedDosePreparation:{coordinates,check:charge,explanation:'Negative proton equivalents are legitimate transformed coordinates, but the current closed-redox entry treats all supplied amounts as nonnegative physical solutes.'},physicalContributionAttempt:preparationAttempt,initialResult:initial.ok?{ok:true,inspection:initial.accepted.inspection,phaseDiagnostics:initial.phaseDiagnostics}:initial,reachable,discoveryMs:performance.now()-start}
fs.writeFileSync('docs/cr-reagent-source-audit.json',JSON.stringify(audit,null,2)+'\n')
assert.equal(audit.nonRedox.diagnostics[0].code,'redox-boundary-mismatch');assert.equal(sodiumAudit.reasons[0].code,'missing-conservation-metadata');assert.equal(charge.code,'invalid-reagent-inventory');assert.ok(initial.ok)
// Independent raw-source laws and independent bounded Newton/phase changes.
// Previous logarithms seed Newton only; all physical totals and phases start afresh.
const reference=[],volumes=[0,1,2,3,5,7,10,14,15,20,50,100];let previous=null
for(const volumeMl of volumes){
 const mass=(50+volumeMl)/1000,names=volumeMl?baseNames:baseNames.filter(n=>n!=='Na+'),totalByName={'Cr 3+':.0005/mass,'Cl-':.0015/mass,'Na+':volumeMl*.0001/mass,'H+':-volumeMl*.0001/mass,'e-':0}
 const initialLogs=names.map(n=>previous?.[n]??(n==='Cr 3+'?-3:n==='Cl-'?-2:n==='Na+'?Math.log10(totalByName[n]):n==='H+'?-3:-10))
 const solids=sourceIds.filter(id=>volumeMl||!reachable.find(r=>r.id===id).terms.some(t=>t.name==='Na+'))
 const t=performance.now(),r=closedSolidsReference({names,total:names.map(n=>totalByName[n]),initial:initialLogs,charges:names.map(n=>n==='Cr 3+'?3:n==='Cl-'||n==='e-'?-1:1),solidIds:solids})
 previous=Object.fromEntries(names.map((n,i)=>[n,r.logs[i]]))
 const phase=r.phases.filter(p=>p.phase==='solid'),gasSum=r.phases.filter(p=>p.phase==='gas').reduce((n,p)=>n+10**p.logSaturation,0),i=names.indexOf('Cr 3+'),dissolvedCr=r.carriers.reduce((n,c)=>n+c.coefficients[i]*c.amount,0),solidCr=phase.reduce((n,p)=>n+p.v[i]*p.amount,0)
 assert.ok(Math.abs(dissolvedCr+solidCr-totalByName['Cr 3+'])<1e-10);assert.ok(phase.every(p=>p.amount>=0&&(p.amount>0?Math.abs(p.logSaturation)<1e-10:p.logSaturation<=1e-10)));assert.ok(gasSum<1);assert.ok(r.maximumMassActionResidual<1e-10)
 reference.push({volumeMl,totalVolumeMl:50+volumeMl,physicalMoles:{Cr:.0005,Cl:.0015,NaOH:volumeMl*.0001},reference:r,dissolvedCr,solidCr,solidCrFraction:solidCr/totalByName['Cr 3+'],gasSum,elapsedMs:performance.now()-t})
}
assert.ok(Math.abs(initial.accepted.inspection.pH-reference[0].reference.pH)<1e-9);assert.ok(Math.abs(initial.accepted.inspection.pe-reference[0].reference.pe)<1e-9)
fs.writeFileSync('docs/cr-reagent-independent-reference.json',JSON.stringify({status:'RESEARCH REFERENCE ONLY; NOT PRODUCTION ONBOARDING VALIDATION',method:'Existing independent raw-source reference; original cumulative inventories at every point. Prior log activities are numerical starting guesses only, no phase/history inventory reuse.',points:reference},null,2)+'\n')
console.log(JSON.stringify({nonRedox:audit.nonRedox.diagnostics,sodiumRedox:audit.sodiumRedox,signedDose:charge,reachable:reachable.length,points:reference.map(p=>({v:p.volumeMl,pH:p.reference.pH,pe:p.reference.pe,solidFraction:p.solidCrFraction,positive:p.reference.phases.filter(s=>s.amount>0).map(s=>s.name)}))},null,2))
