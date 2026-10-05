/** Offline boundary audit. No changes to the prepared chemistry or solver options. */
import {classifyMn} from '../../src/analysis/mnDiagnostic.js'
import {solveFixedRedox,ehToPe} from '../../src/solver/redox.js'
export const boundaryCriteria=Object.freeze({pH:1e-6,Eh:1e-7,maxIterations:32,
 meaning:'Final accepted endpoint separation, not a solver tolerance or permission to interpolate geometry.'})
export function primary(c){
 if(c.status!=='accepted')return {key:c.status,kind:'unavailable',ids:[]}
 if(c.activeSolids.length)return {key:'solid:'+c.activeSolids.map(s=>s.id).sort().join('|'),kind:'solid',ids:c.activeSolids.map(s=>s.id).sort()}
 if(c.speciesLeaders.length!==1)return {key:'aqueous-unresolved:'+c.speciesLeaders.join('|'),kind:'tie',ids:c.speciesLeaders}
 return {key:'aqueous:'+c.speciesLeaders[0],kind:'aqueous',ids:c.speciesLeaders}
}
export function detectBrackets(snapshot){
 const states=snapshot.evidence.grid.outcomes.map(o=>({pH:o.x,Eh:o.y,sourceIndex:o.index,input:o.input,result:o.result,diagnostics:o.diagnostics,
 classification:classifyMn(snapshot.evidence.system,o,snapshot.inventory)}))
 const xs=[...new Set(states.map(p=>p.pH))].sort((a,b)=>a-b),ys=[...new Set(states.map(p=>p.Eh))].sort((a,b)=>a-b)
 const at=new Map(states.map(p=>[`${p.pH}/${p.Eh}`,p])),brackets=[]
 for(const a of states)for(const b of [at.get(`${xs[xs.indexOf(a.pH)+1]}/${a.Eh}`),at.get(`${a.pH}/${ys[ys.indexOf(a.Eh)+1]}`)]){
 if(!b)continue
 const left=primary(a.classification),right=primary(b.classification)
 if(left.key===right.key)continue
 const type=[left.kind,right.kind].sort().join('/'),eligible=[left,right].every(p=>['solid','aqueous'].includes(p.kind)&&p.ids.length===1)
 brackets.push({id:`${a.sourceIndex}-${b.sourceIndex}`,axis:a.pH===b.pH?'Eh':'pH',left:a,right:b,type,eligible,
 condition:type==='solid/solid'?'Equal free-Mn activity caps of competing pure phases, both at saturation':type==='aqueous/solid'?'Incipient pure-solid saturation with total Mn balance':type==='aqueous/aqueous'?'Equal stoichiometrically weighted dissolved contributions':'Unresolved classification; no unique equality assumed'})
 }
 return brackets
}
export async function evaluate(system,inventory,pH,Eh){
 const raw=await solveFixedRedox(system,{pH,Eh,totals:{'Mn 2+':.001}})
 const outcome={status:raw.ok?'converged':'failed',result:raw.result,diagnostics:raw.diagnostics}
 return {pH,Eh,input:raw.input,result:raw.result,diagnostics:raw.diagnostics,classification:classifyMn(system,outcome,inventory)}
}
export async function refine(bracket,run,criteria=boundaryCriteria){
 let left=bracket.left,right=bracket.right
 const samples=[],ends=[primary(left.classification),primary(right.classification)]
 const finish=(status,reason)=>({bracketId:bracket.id,status,reason,axis:bracket.axis,criteria,left,right,samples,
 uncertainty:{pH:[Math.min(left.pH,right.pH),Math.max(left.pH,right.pH)],Eh:[Math.min(left.Eh,right.Eh),Math.max(left.Eh,right.Eh)]}})
 if(!bracket.eligible)return finish('unresolved','Endpoint tie, unavailable state or multi-solid assemblage needs a separately justified equality.')
 for(let n=0;n<criteria.maxIterations;n++){
 if(Math.abs(right[bracket.axis]-left[bracket.axis])<=criteria[bracket.axis])return finish('coordinate-bracketed','Opposite accepted classifications enclosed; thermodynamic equality and topology still require independent checks.')
 const middle=await run((left.pH+right.pH)/2,(left.Eh+right.Eh)/2);samples.push(middle)
 const state=primary(middle.classification)
 if(state.kind==='unavailable'||state.kind==='tie')return finish('unresolved','Intermediate equilibrium is unavailable or its dissolved comparison is unresolved; retained without crossing it.')
 if(state.key===ends[0].key)left=middle
 else if(state.key===ends[1].key)right=middle
 else return finish('intervening-state','A third accepted state invalidates this two-state bracket. Do not connect endpoints as one boundary.')
 }
 return finish('unresolved','Physical-coordinate refinement budget exhausted.')
}
export async function refineTransitions(bracket,run,depth=0){
 const result=await refine(bracket,run)
 if(result.status!=='intervening-state')return result
 if(depth>=8)return {...result,reason:'Eight-level intervening-state subdivision budget exhausted; topology remains unresolved.'}
 const middle=result.samples.at(-1)
 result.children=[]
 for(const [left,right,suffix] of [[result.left,middle,'L'],[middle,result.right,'R']]){
 const states=[primary(left.classification),primary(right.classification)]
 const child={...bracket,id:bracket.id+suffix,left,right,type:states.map(s=>s.kind).sort().join('/'),eligible:states.every(s=>['solid','aqueous'].includes(s.kind)&&s.ids.length===1)}
 result.children.push(await refineTransitions(child,run,depth+1))
 }
 return result
}
// Independent algebra for pure-phase caps in the original Mn2+/H+/e-/water basis.
export function solidEquality(system,bracket){
 if(bracket.type!=='solid/solid')return null
 const [a,b]=[bracket.left,bracket.right].map(p=>system.products.find(s=>s.id===primary(p.classification).ids[0]))
 const coefficients=a.coefficients.map((v,i)=>v/a.coefficients[0]-b.coefficients[i]/b.coefficients[0])
 const constant=a.logBeta/a.coefficients[0]-b.logBeta/b.coefficients[0]
 const nH=coefficients[1],ne=coefficients[2],factor=ehToPe(1)
 const coordinate=bracket.axis==='Eh'?ne===0?null:(constant-nH*bracket.left.pH)/(ne*factor):nH===0?null:(constant-ne*ehToPe(bracket.left.Eh))/nH
 return {phaseIds:[a.id,b.id],constant,nH,ne,coordinate,EhSlopePerPH:ne===0?null:-nH/(ne*factor),equation:'constant - nH*pH - ne*pe = 0',sourceRecords:[a.sourceRecord,b.sourceRecord]}
}
export function aqueousEquality(system,left,right,axis){
 const states=[primary(left.classification),primary(right.classification)]
 if(states.some(s=>s.kind!=='aqueous'||s.ids.length!==1))return null
 const [a,b]=states.map(s=>system.products.find(p=>p.id===s.ids[0])??(s.ids[0]==='Mn 2+'?{id:'Mn 2+',logBeta:0,coefficients:[1,0,0,0]}:null))
 if(!a||!b||a.coefficients[0]!==b.coefficients[0])return null // Free activity does not cancel for unequal Mn counts.
 const constant=a.logBeta-b.logBeta,nH=a.coefficients[1]-b.coefficients[1],ne=a.coefficients[2]-b.coefficients[2]
 const coordinate=axis==='Eh'?ne===0?null:(constant-nH*left.pH)/(ne*ehToPe(1)):nH===0?null:(constant-ne*ehToPe(left.Eh))/nH
 return {speciesIds:[a.id,b.id],constant,nH,ne,coordinate,EhSlopePerPH:ne===0?null:-nH/(ne*ehToPe(1)),equation:'Equal Mn stoichiometry cancels free activity and weighting: constant - nH*pH - ne*pe = 0'}
}
