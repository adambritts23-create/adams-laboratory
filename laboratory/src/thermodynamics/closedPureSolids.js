import {extendClosedReagentSolids,solveClosedReagents} from './closedReagents.js'
import {freeze} from '../solver/models.js'
import {numericalValidationContract as tolerance} from '../solver/validationContract.js'
export const closedPureSolidScopeVersion='source-pure-solids-v2'
// Explicit bounded source identities, not formula parsing or element-specific solve branches.
// Formation constants and composition are taken exclusively from the pinned source equations.
export const closedPureSolidIds=Object.freeze([127500,130902,131188,131294,133739,134486,139276,93877,94801].map(n=>`spana:2ac52a30213c9288:${n}`))
const preparations=new WeakSet()
const fail=(code,message,details={})=>freeze({ok:false,status:'UNSUPPORTED',diagnostics:[{code,message}],...details})
export async function prepareClosedPureSolids(repository,prepared,solidIds){
 const audit=prepared.audit,base=prepared.prepared.prepared,byName=new Map(repository.getComponents().map(c=>[c.name,c.id])),solids=[],excluded=[]
 if(solidIds?.some(id=>!audit.candidateSolids.some(s=>s.id===id)))return fail('invalid-solid-scope','A requested phase is outside the source component system.')
 for(const row of audit.candidateSolids){
  if(solidIds&&!solidIds.includes(row.id)){excluded.push({...row,reason:'explicit-restricted-phase-scope'});continue}
  const elements={},coefficients=base.system.components.map(()=>0);let charge=0,logBeta=row.logK,valid=true,atomsKnown=true
  for(const term of row.terms){
   const id=byName.get(term.name),metadata=audit.metadata[id],expression=base.network.algebra.componentExpressions[id]
   if(!metadata||!expression){valid=false;continue}
   charge+=term.coefficient*metadata.charge;logBeta+=term.coefficient*expression.logK
   expression.coefficients.forEach((n,i)=>{coefficients[i]+=term.coefficient*n})
   if(!metadata.elements)atomsKnown=false
   for(const [element,count] of Object.entries(metadata.elements??{}))elements[element]=(elements[element]??0)+term.coefficient*count
  }
  for(const key of Object.keys(elements))if(elements[key]===0)delete elements[key]
  if(!valid||charge!==0||row.terms.some(t=>!Number.isSafeInteger(t.coefficient))||(atomsKnown&&Object.values(elements).some(n=>!Number.isSafeInteger(n)||n<0))){excluded.push({...row,reason:'missing-solid-composition: source transport does not establish neutral nonnegative integer composition'});continue}
  solids.push({...row,classification:'admitted-pure-solid',reason:'Source-bound neutral integer pure-solid law; presence determined only by coupled equilibrium',...(atomsKnown?{elements}:{elementalStatus:'unavailable'}),charge,coefficients,logBeta,role:'ordinary',sourceIdentity:{id:row.id,reference:row.reference,terms:row.terms,logK:row.logK,scope:closedPureSolidScopeVersion}})
 }
 if(solidIds&&solids.length!==solidIds.length)return fail('invalid-solid-scope','A requested source solid failed admission.',{excluded})
 if(!solids.length)return fail('unsupported-solid-scope','No reachable solid belongs to this bounded source scope.',{excluded})
 const extended=await extendClosedReagentSolids(prepared.prepared,solids)
 if(!extended.ok)return extended
 const value=freeze({ok:true,prepared:extended,audit,basisSelection:prepared.basisSelection,solidScope:{version:closedPureSolidScopeVersion,selection:solidIds?{kind:'explicit-source-ids',ids:[...solidIds].sort()}:{kind:'general-source'},admitted:solids,excluded},excluded:[...audit.excluded.filter(r=>r.phase!=='solid'),...excluded]})
 preparations.add(value);return value
}
export function solveClosedPureSolids(prepared){
 if(!preparations.has(prepared))return fail('unprepared-solid-network','Use the source-bound solid preparation.')
 const accepted=solveClosedReagents(prepared.prepared)
 if(!accepted.ok)return accepted
 const network=prepared.prepared.prepared.network
 const logs=Object.fromEntries(accepted.inspection.carriers.filter(c=>c.phase==='aqueous').map(c=>[c.name,Math.log10(c.amount)]))
 logs[network.sourceSpecies.find(s=>s.id===network.electronId).name]=-accepted.inspection.pe;logs[network.water.name]=0
 const phaseDiagnostics=prepared.excluded.map(r=>({...r,logActivity:r.logK+r.terms.reduce((n,t)=>n+t.coefficient*logs[t.name],0)}))
 const required=phaseDiagnostics.filter(r=>!Number.isFinite(r.logActivity)||r.phase==='solid'&&r.logActivity>tolerance.saturatedSolidLogActivityTolerance)
 const gasFugacitySum=phaseDiagnostics.filter(r=>r.phase==='gas').reduce((n,r)=>n+10**r.logActivity,0)
 if(required.length||gasFugacitySum>1)return fail(required.length?'excluded-solid-phase-required':'gas-phase-required','The coupled candidate requires an excluded phase; it is not an accepted result.',{candidate:accepted,phaseDiagnostics,gasFugacitySum})
 return freeze({ok:true,status:'CONDITIONAL',accepted,audit:prepared.audit,basisSelection:prepared.basisSelection,solidScope:prepared.solidScope,phaseDiagnostics,gasFugacitySum})
}
