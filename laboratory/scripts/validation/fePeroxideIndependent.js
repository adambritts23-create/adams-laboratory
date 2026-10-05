// Independent nested scalar inventory reduction using raw source laws.
// No production solver, reaction-basis compiler or closed preparation imports.
import {discovery,request,physicalId,ids,initial} from './fePeroxideAudit.js'
const metadata=new Map(request().species.map(s=>[s.id,s])),rows=discovery.rows.filter(r=>physicalId(r.name)!==ids.F3)
const bisect=(fn,lo,hi,count=62)=>{let a=fn(lo),b=fn(hi);if(!(a<=0&&b>=0))throw Error(`Unbracketed independent root ${a}, ${b}`);for(let i=0;i<count;i++){const mid=(lo+hi)/2;if(fn(mid)>0)hi=mid;else lo=mid}return (lo+hi)/2}
export function independent(peroxide=initial.peroxide){
 const T=initial.Fe,C=initial.chloride
 function state(h,pe,cl){
  const logBase={'Fe 3+':0,'Fe 2+':13.051-pe,H2O2:-59.61-2*Math.log10(h)+2*pe,'H+':Math.log10(h),'Cl-':Math.log10(cl),'e-':-pe,H2O:0}
  const factors=rows.map(r=>({id:physicalId(r.name),n:metadata.get(physicalId(r.name)).elements.Fe??0,c:10**(r.logK+r.metadata.effectiveSourceReaction.components.reduce((v,t)=>v+t.coefficient*logBase[t.name],0))}))
  const a1=1+factors.filter(r=>r.n===1).reduce((v,r)=>v+r.c,0),a2=factors.filter(r=>r.n===2).reduce((v,r)=>v+2*r.c,0)
  const f=2*T/(a1+Math.sqrt(a1*a1+4*a2*T))
  const amounts={[ids.F3]:f,[ids.H]:h,[ids.Cl]:cl,...Object.fromEntries(factors.map(r=>[r.id,r.c*f**r.n]))}
  const sums={Fe:0,Cl:0,H:0,O:0,charge:0,capacity:0}
  for(const [id,n] of Object.entries(amounts)){const s=metadata.get(id);for(const key of ['Fe','Cl','H','O'])sums[key]+=(s.elements[key]??0)*n;sums.charge+=s.charge*n;sums.capacity+=(s.charge-(s.elements.H??0)+2*(s.elements.O??0)-2*(s.elements.Fe??0)+(s.elements.Cl??0))*n}
  return {h,pe,cl,amounts,sums}
 }
 const at=(h,pe)=>{const cl=bisect(cl=>state(h,pe,cl).sums.Cl-C,C*1e-14,C,46);return state(h,pe,cl)}
 const redoxAt=h=>{const pe=bisect(pe=>at(h,pe).sums.capacity-2*peroxide,-5,30,55);return at(h,pe)}
 const h=bisect(h=>redoxAt(h).sums.charge,initial.acid/2,2*initial.acid,50),s=redoxAt(h)
 return {...s,peroxideSupplied:peroxide,pH:-Math.log10(h),Eh:s.pe*8.31446261815324*298.15*Math.LN10/(6.02214076e23*1.602176634e-19),acidRelative:s.sums.H-2*s.sums.O,expectedAcidRelative:initial.acid-2*peroxide,method:'Independent nested scalar balances: analytical Fe quadratic, chloride bisection, electron-capacity bisection, charge bisection; raw imported laws only'}
}
