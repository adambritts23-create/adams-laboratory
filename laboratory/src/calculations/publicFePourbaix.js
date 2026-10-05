import {prepareFeCandidate} from '../analysis/prepareFeCandidate.js'
import {fePourbaixCandidate,inspectRegisteredFePoint} from '../analysis/fePourbaixContract.js'
import {runBoundedPourbaix} from './boundedPourbaix.js'
import {freeze} from '../solver/models.js'
import {publicFeSetupReason} from './fePublicSetup.js'
const results=new WeakSet()
export const isPublicFeResult=value=>results.has(value)
export async function runPublicFePourbaix(session,repository,control={}){
 const preparation=await prepareFeCandidate(repository),reason=publicFeSetupReason(session,preparation,{axes:true})
 if(reason)return {ok:false,reason}
 if(control.isCurrent&&!control.isCurrent())return {ok:false,reason:'Calculation superseded.'}
 const pourbaix=await runBoundedPourbaix(preparation,session.calculationDefinition,session.revision,fePourbaixCandidate,control)
 if(!pourbaix.ok)return {ok:false,reason:'No supported Fe map: '+pourbaix.reason,grid:pourbaix.grid}
 const {system,model,waterModel}=preparation,{grid,support:assessment}=pourbaix
 const points=grid.outcomes.map(o=>inspectRegisteredFePoint(model,system,o.input,o.result,{currentRevision:session.revision,waterModel,status:o.status}))
 const value=freeze({ok:true,system,grid,preparation,points,pourbaix,support:{...assessment,publicEnabled:true,version:'public-bounded-fe-pourbaix-v1'}})
 results.add(value);return value
}
export function commitPublicFeResult(session,result){
 if(!results.has(result)||result.grid.revision!==session.revision||session.calculationDefinition.publicFePourbaix!=='fe-v1'||publicFeSetupReason(session,result.preparation,{axes:true}))return session
 return {...session,lastPoint:null,lastPlot:{system:result.system,grid:result.grid,publicFe:result},gridResult:result.grid,sweepResult:null,gridRequest:null,sweepRequest:null,pointRequest:null,calculationResult:null,calculationStatus:'completed'}
}
export function publicFeSample(result,index,currentRevision){
 if(!results.has(result)||currentRevision!==result.grid.revision||!Number.isInteger(index))return null
 const p=result.points[index],o=result.grid.outcomes[index]
 return o?.status==='converged'&&['classified','tie'].includes(p?.status)&&p.inputId===o.input.id?p:null
}
