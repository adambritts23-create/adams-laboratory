import {repo,request,ids,discovery,initial} from './fePeroxideAudit.js'
import {fePeroxideScope as scope} from '../../src/thermodynamics/scopes/fePeroxide.js'
import {prepareClosedReagents,solveClosedReagents} from '../../src/thermodynamics/closedReagents.js'
import {transformReactionBasis} from '../../src/thermodynamics/reactionBasis.js'
import {prepareChemicalSystem,createPointInput} from '../../src/solver/models.js'
import {solvePoint} from '../../src/solver/point.js'
export {repo,ids,scope,initial}
export function reagentRequest(options={}){const q=request(options);return {amounts:q.preparation.amounts,description:q.preparation.description,revision:1,basisIndex:options.basis==='ferric'?1:0,temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O'}}
export async function automatic(options={},repository=repo){const p=await prepareClosedReagents(repository,reagentRequest(options),scope);return p.ok?solveClosedReagents(p):p}
export function exclusions(accepted){
 const a=Object.fromEntries(accepted.inspection.carriers.map(s=>[s.name,Math.log10(s.amount)]));a['e-']=-accepted.inspection.pe;a.H2O=0
 return discovery.excluded.map(s=>({id:s.id,name:s.name,phase:s.phase,logQ:s.logK+s.metadata.effectiveSourceReaction.components.reduce((n,t)=>n+t.coefficient*a[t.name],0),meaning:s.phase==='solid'?'Hypothetical pure-solid log saturation ratio':s.phase==='gas'?'Hypothetical unit-standard gas log fugacity':'Excluded aqueous log molality diagnostic, not accepted inventory'}))
}
export async function controlled(accepted){
 const q=request(),basisIds=[ids.F3,ids.H,ids.e,ids.Cl,ids.W]
 const algebra=transformReactionBasis({basisIds,componentIds:q.species.map(s=>s.id),reactions:q.reactions})
 if(!algebra.ok)return algebra
 const p=await prepareChemicalSystem({components:basisIds.map(id=>q.species.find(s=>s.id===id)),products:q.species.filter(s=>!basisIds.includes(s.id)).map(s=>({...s,sourceRecord:s.sourceIdentity,coefficients:algebra.componentExpressions[s.id].coefficients,logBeta:algebra.componentExpressions[s.id].logK})),basisStatus:'explicit-direct',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{mode:'controlled-cross-check',scope:scope.version}})
 if(!p.ok)return p
 const values={[ids.F3]:initial.Fe,[ids.H]:-accepted.inspection.pH,[ids.e]:-accepted.inspection.pe,[ids.Cl]:initial.chloride,[ids.W]:0}
 const i=await createPointInput(p.system,{constraints:basisIds.map(componentId=>({componentId,kh:[ids.F3,ids.Cl].includes(componentId)?1:2,value:values[componentId]})),unit:'mol/kg-H2O',revision:1,temperatureC:25,pressureBar:1,activityModel:'ideal'})
 if(!i.ok)return i
 const r=solvePoint(p.system,i.input)
 return {ok:r.ok,result:r,system:p.system,input:i.input}
}
export function compareAmounts(a,b){return Math.max(...Object.keys(a).map(id=>Math.abs(Math.log10(a[id])-Math.log10(b[id]))))}
export const amounts=r=>Object.fromEntries(r.inspection.carriers.map(s=>[s.id,s.amount]))

