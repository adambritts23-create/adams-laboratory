/** Conservative rectangular enclosures. Unproved boxes remain explicitly unresolved. */
import {ehToPe} from '../../src/solver/redox.js'
import {mnClassificationPolicy as policy} from '../../src/analysis/mnDiagnostic.js'
const logMargin=1e-9 // Geometry enclosure guard in log10 units; never used by the solver.
export const enclosurePolicy={maxDepth:9,logMargin,meaning:'Conservative interval certification of interiors; remaining boxes are unresolved, not phase boundaries.'}
const corners=b=>[[b[0],b[2]],[b[0],b[3]],[b[1],b[2]],[b[1],b[3]]]
const interval=values=>[Math.min(...values),Math.max(...values)]
const root=(A,B)=>2*.001/(A+Math.sqrt(A*A+4*B*.001))
export function certify(system,box){
 const vertices=corners(box),rows=system.aqueousRows.map(j=>system.products[j]),solids=system.solidRows.map(j=>system.products[j])
 const logFactor=(p,h,e)=>p.logBeta-p.coefficients[1]*h-p.coefficients[2]*ehToPe(e)
 const cap=(p,h,e)=>-logFactor(p,h,e)/p.coefficients[0]
 for(const s of solids){
 if(!solids.every(t=>t.id===s.id||vertices.every(([h,e])=>cap(t,h,e)-cap(s,h,e)>logMargin)))continue
 // Each contribution is exp(affine); its sum is convex and bounded above by vertex maxima.
 const maxD=Math.max(...vertices.map(([h,e])=>10**cap(s,h,e)+rows.reduce((v,p)=>v+p.coefficients[0]*10**(logFactor(p,h,e)+p.coefficients[0]*cap(s,h,e)),0)))
 if(maxD<.001-policy.negligibleDissolved)return {key:'solid:'+s.id,name:s.name,kind:'solid',certificate:'Strict cap ordering and convex vertex upper bound on dissolved inventory',maxD}
 }
 const factors=rows.map(p=>({p,range:interval(vertices.map(([h,e])=>logFactor(p,h,e)))}))
 if(factors.some(({p})=>![1,2].includes(p.coefficients[0])))return null
 const sums=end=>factors.reduce((v,{p,range})=>{v[p.coefficients[0]-1]+=p.coefficients[0]*10**range[end];return v},[1,0])
 const min=sums(0),max=sums(1),free=[root(...max),root(...min)]
 if(!free.every(v=>Number.isFinite(v)&&v>0))return null
 if(!solids.every(s=>vertices.every(([h,e])=>logFactor(s,h,e)+s.coefficients[0]*Math.log10(free[1])< -logMargin)))return null
 const weights=[{id:'Mn 2+',name:'Mn 2+',n:1,low:free[0],high:free[1]},...factors.map(({p,range})=>({id:p.id,name:p.name,n:p.coefficients[0],low:p.coefficients[0]*10**range[0]*free[0]**p.coefficients[0],high:p.coefficients[0]*10**range[1]*free[1]**p.coefficients[0]}))]
 const error=w=>w.n*policy.absoluteMolality+policy.relativeMolality*w.high
 const winner=weights.find(w=>weights.every(v=>v.id===w.id||w.low-error(w)>v.high+error(v)))
 return winner?{key:'aqueous:'+winner.id,name:'Aqueous '+winner.name,kind:'aqueous',certificate:'Monotonic quadratic free-activity enclosure, negative saturation upper bounds and separated weighted-species intervals'}:null
}
export function regions(system){
 const tiles=[],unresolved=[]
 function visit(box,depth){
 const proof=certify(system,box)
 if(proof){tiles.push({box,...proof});return}
 if(depth===enclosurePolicy.maxDepth){unresolved.push(box);return}
 const [a,b,c,d]=box,h=(a+b)/2,e=(c+d)/2
 for(const next of [[a,h,c,e],[h,b,c,e],[a,h,e,d],[h,b,e,d]])visit(next,depth+1)
 }
 visit([0,14,-1.5,1.5],0)
 return {policy:enclosurePolicy,tiles,unresolved}
}
