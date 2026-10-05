/** Restricted topology audit; production chemistry remains unchanged. */
import {primary,evaluate,refine,boundaryCriteria} from './mnBoundaries.js'
import {ehToPe} from '../../src/solver/redox.js'
import {enclosurePolicy} from './mnRegionCertificates.js'
import {mnClassificationPolicy} from '../../src/analysis/mnDiagnostic.js'
export const topologyPolicy={maxDepth:6,initialNormalPH:0.000016,initialNormalEh:0.0000016,maxExpansion:12,
 boundaryCriteria,meaning:'Numerical transverse brackets plus an affine-cap/convex-inventory certificate for complete pure-solid segments. Other traces remain partial.'}
export const midpoint=b=>({pH:(b.left.pH+b.right.pH)/2,Eh:(b.left.Eh+b.right.Eh)/2})
const statePair=b=>[b.left.state,b.right.state].sort((a,b)=>a.key.localeCompare(b.key))
export function segmentCandidates(boundaries){
 const groups=new Map()
 for(const b of boundaries){const states=statePair(b),key=states.map(s=>s.key).join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b)}
 const out=[]
 for(const [key,group] of [...groups].sort(([a],[b])=>a.localeCompare(b))){
 const hs=group.map(b=>midpoint(b).pH),es=group.map(b=>midpoint(b).Eh)
 const axis=(Math.max(...hs)-Math.min(...hs))/14>=(Math.max(...es)-Math.min(...es))/3?'pH':'Eh'
 group.sort((a,b)=>midpoint(a)[axis]-midpoint(b)[axis]||a.id.localeCompare(b.id))
 for(let i=1;i<group.length;i++)out.push({id:`segment-${group[i-1].id}--${group[i].id}`,crossingIds:[group[i-1].id,group[i].id],states:statePair(group[i]),key,axis,
 endpoints:[midpoint(group[i-1]),midpoint(group[i])],equality:group[i].analytical??group[i-1].analytical??null,
 condition:statePair(group[i]).every(s=>s.kind==='solid')?'Equal pure-solid free-Mn caps with no lower competitor and positive solid inventory':'Same weighted-aqueous/incipient-saturation transition; continuous enclosure still required'})
 }
 return out
}
const cap=(s,p)=>-(s.logBeta-s.coefficients[1]*p.pH-s.coefficients[2]*ehToPe(p.Eh))/s.coefficients[0]
export function solidSegmentProof(system,candidate){
 if(!candidate.equality||candidate.states.some(s=>s.kind!=='solid'))return {ok:false,reason:'No continuous certificate for this non-pure-solid equality.'}
 const q=candidate.equality,normal=candidate.axis==='pH'?'Eh':'pH',phases=candidate.states.map(s=>system.products.find(p=>p.id===s.ids[0]))
 if(phases.some(p=>!p))return {ok:false,reason:'Missing audited phase.'}
 const projected=candidate.endpoints.map(p=>({...p,[normal]:normal==='Eh'?(q.constant-q.nH*p.pH)/(q.ne*ehToPe(1)):(q.constant-q.ne*ehToPe(p.Eh))/q.nH}))
 if(projected.some(p=>!Number.isFinite(p.pH)||!Number.isFinite(p.Eh)||p.pH<0||p.pH>14||p.Eh< -1.5||p.Eh>1.5))return {ok:false,reason:'Equality leaves the validated coordinate domain.'}
 const maximumProjectionError=Math.max(...projected.map((p,i)=>Math.abs(p[normal]-candidate.endpoints[i][normal])))
 // A crossing refined along the other coordinate has its own projected bound.
 const gradientRatio=normal==='Eh'?Math.abs(q.nH/(q.ne*ehToPe(1))):Math.abs(q.ne*ehToPe(1)/q.nH)
 const permittedProjection=boundaryCriteria[normal]+gradientRatio*boundaryCriteria[candidate.axis]
 if(maximumProjectionError>permittedProjection)return {ok:false,reason:'Numerical crossings disagree with the independently derived equality.'}
 const other=system.solidRows.map(j=>system.products[j]).filter(p=>!phases.some(s=>s.id===p.id))
 const margin=Math.min(...projected.flatMap(p=>other.map(s=>cap(s,p)-cap(phases[0],p))))
 const dissolved=p=>{const logA=cap(phases[0],p);return 10**logA+system.aqueousRows.reduce((v,j)=>{const s=system.products[j];return v+s.coefficients[0]*10**(s.logBeta+s.coefficients[0]*logA-s.coefficients[1]*p.pH-s.coefficients[2]*ehToPe(p.Eh))},0)}
 const maximumDissolved=Math.max(...projected.map(dissolved))
 return {ok:margin>enclosurePolicy.logMargin&&maximumDissolved<.001-mnClassificationPolicy.negligibleDissolved,projected,maximumProjectionError,permittedProjection,
 minimumOtherCapMargin:margin,maximumDissolved,
 reason:'Other-cap differences are affine along the equality, so endpoint minima bound the whole branch. Dissolved sums are convex exponentials of affine coordinates, so endpoint maxima bound the whole branch. Strict margins exclude intervening phases and aqueous-only intervals.'}
}
export async function traceSegment(system,inventory,candidate){
 const normal=candidate.axis==='pH'?'Eh':'pH',samples=[],attempts=[]
 const pair=candidate.states.map(s=>s.key).sort(),proof=solidSegmentProof(system,candidate)
 const evaluatePoint=(p)=>evaluate(system,inventory,p.pH,p.Eh)
 async function cross(t){
 const guess={pH:candidate.endpoints[0].pH+t*(candidate.endpoints[1].pH-candidate.endpoints[0].pH),Eh:candidate.endpoints[0].Eh+t*(candidate.endpoints[1].Eh-candidate.endpoints[0].Eh)}
 let delta=normal==='pH'?topologyPolicy.initialNormalPH:topologyPolicy.initialNormalEh
 for(let n=0;n<topologyPolicy.maxExpansion;n++,delta*=2){
 const lp={...guess,[normal]:guess[normal]-delta},rp={...guess,[normal]:guess[normal]+delta}
 if(lp.pH<0||rp.pH>14||lp.Eh< -1.5||rp.Eh>1.5)return {ok:false,reason:'Transverse bracket leaves supported domain.'}
 const left=await evaluatePoint(lp),right=await evaluatePoint(rp);attempts.push(left,right)
 const keys=[primary(left.classification).key,primary(right.classification).key]
 if(keys.some(k=>!pair.includes(k)))return {ok:false,reason:'Intervening, unavailable or ambiguous state in transverse trace.',encountered:keys}
 if(keys[0]===keys[1])continue
 const r=await refine({id:candidate.id+':'+t,left,right,axis:normal,eligible:true},(h,e)=>evaluate(system,inventory,h,e))
 samples.push({t,...r})
 return r.status==='coordinate-bracketed'?{ok:true,point:midpoint(r)}:{ok:false,reason:r.reason}
 }
 return {ok:false,reason:'No consistent transition bracket within expansion budget.'}
 }
 async function visit(a,b,depth){
 const t=(a+b)/2,r=await cross(t)
 if(!r.ok)return r
 const linear={pH:candidate.endpoints[0].pH+t*(candidate.endpoints[1].pH-candidate.endpoints[0].pH),Eh:candidate.endpoints[0].Eh+t*(candidate.endpoints[1].Eh-candidate.endpoints[0].Eh)}
 const deviation=Math.abs(r.point[normal]-linear[normal])
 if(depth<2||(!proof.ok&&deviation>boundaryCriteria[normal])){
 if(depth===topologyPolicy.maxDepth)return {ok:true,limited:true}
 const l=await visit(a,t,depth+1);if(!l.ok)return l
 return visit(t,b,depth+1)
 }
 return r
 }
 const tracing=await visit(0,1,0)
 const status=!tracing.ok?'rejected':proof.ok?'certified':'partial'
 return {...candidate,status,reason:!tracing.ok?tracing.reason:proof.ok?'State-consistent numerical trace and continuous thermodynamic certificate.':'Point traces do not establish continuous nonlinear topology; not rendered as a certified connection.',proof,samples,attempts,
 maximumBalanceResidual:Math.max(0,...samples.flatMap(s=>[s.left,s.right]).map(p=>Math.abs(p.result?.residuals?.componentBalance?.[0]??0))),
 maximumSaturationResidual:Math.max(0,...samples.flatMap(s=>[s.left,s.right]).flatMap(p=>(p.result?.solids??[]).filter(s=>s.amount>0).map(s=>Math.abs(s.logSaturation))))}
}
export function junctionCandidates(boundaries,outcomes){
 const out=[]
 for(let y=0;y<12;y++)for(let x=0;x<14;x++){
 const i=y*15+x,edgeIds=[[i,i+1],[i+15,i+16],[i,i+15],[i+1,i+16]].map(a=>a.join('-'))
 const edges=boundaries.filter(b=>edgeIds.includes(b.id.replace(/[LR]+$/,''))),states=[...new Map(edges.flatMap(b=>[b.left.state,b.right.state]).map(s=>[s.key,s])).values()].sort((a,b)=>a.key.localeCompare(b.key))
 if(states.length>=3)out.push({id:`junction-cell-${x}-${y}`,box:[outcomes[i].x,outcomes[i+1].x,outcomes[i].y,outcomes[i+15].y],states,crossingIds:edges.map(b=>b.id).sort()})
 }
 return out
}
export async function inspectJunction(system,inventory,candidate){
 let box=[...candidate.box];const levels=[],samples=[]
 // Pure-solid cap equalities can disprove an apparent three-region junction.
 if(candidate.states.length===3&&candidate.states.every(s=>s.kind==='solid')){
 const phases=candidate.states.map(s=>system.products.find(p=>p.id===s.ids[0]))
 const diff=(a,b)=>({k:a.logBeta/a.coefficients[0]-b.logBeta/b.coefficients[0],h:a.coefficients[1]/a.coefficients[0]-b.coefficients[1]/b.coefficients[0],e:a.coefficients[2]/a.coefficients[0]-b.coefficients[2]/b.coefficients[0]})
 const a=diff(phases[0],phases[1]),b=diff(phases[1],phases[2]),det=a.h*b.e-b.h*a.e
 const scale=Math.max(Math.abs(a.h*b.e),Math.abs(b.h*a.e),1)
 if(Math.abs(det)<=Number.EPSILON*32*scale){
 const offset=Math.abs(a.k*b.e-b.k*a.e)
 if(offset>enclosurePolicy.logMargin){
 for(const h of [box[0],box[1]])for(const e of [box[2],box[3]])samples.push(await evaluate(system,inventory,h,e))
 return {...candidate,status:'rejected-not-a-junction',reason:'Distinct parallel equal-cap lines: an intervening region, not a triple point.',equations:[a,b],determinant:det,offset,samples,uncertainty:box}
 }
 }
 }
 for(let depth=0;depth<10;depth++){
 const [a,b,c,d]=box,h=(a+b)/2,e=(c+d)/2,grid=[]
 for(const yy of [c,e,d])for(const xx of [a,h,b]){const p=await evaluate(system,inventory,xx,yy);samples.push(p);grid.push(primary(p.classification).key)}
 const children=[[[a,h,c,e],[0,1,3,4]],[[h,b,c,e],[1,2,4,5]],[[a,h,e,d],[3,4,6,7]],[[h,b,e,d],[4,5,7,8]]].filter(([,ids])=>new Set(ids.map(i=>grid[i])).size>=3)
 levels.push({box:[...box],states:grid,qualifyingChildren:children.map(([b])=>b)})
 if(children.length!==1)break // Multiple or absent candidates do not prove a unique junction.
 box=children[0][0]
 }
 return {...candidate,status:'unresolved',reason:'Multidirectional solver samples suggest a location but do not certify a unique junction or exclude alternatives elsewhere in the original cell. The original uncertainty box is retained.',uncertainty:[...candidate.box],sampledLocalization:box,levels,samples}
}
