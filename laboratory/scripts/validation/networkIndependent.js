// Independent control: direct raw-source mass action and explicit source-coordinate analytical sums.
// No production discovery, basis compiler, preparation, or equilibrium solver imports.
import fs from 'node:fs'
const raw=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json'))
export function independentSourceFamilies({names,total,initial,charges}){
const expressions=new Map(names.map((name,i)=>[name,{k:0,v:names.map((_,j)=>Number(i===j))}]))
expressions.set('H2O',{k:0,v:names.map(()=>0)})
const rows=[],derived=[]
let changed=true
while(changed){changed=false;for(const r of raw.species){
 const terms=r.metadata?.effectiveSourceReaction?.components?.filter(t=>t.coefficient)
 if(r.phase!=='aqueous'||!terms||rows.some(s=>s.id===r.id)||!terms.every(t=>expressions.has(t.name)))continue
 const k=r.logK+terms.reduce((n,t)=>n+t.coefficient*expressions.get(t.name).k,0),v=names.map((_,i)=>terms.reduce((n,t)=>n+t.coefficient*expressions.get(t.name).v[i],0))
 rows.push(r);derived.push({id:r.id,name:r.name,k,v});expressions.set(r.name,{k,v});changed=true
}}
const species=[...names.slice(0,-1).map((name,i)=>({id:name,name,k:0,v:names.map((_,j)=>Number(i===j))})),...derived.filter(s=>!names.includes(s.name)&&s.name!=='H2O')]

function state(x){
 const c=species.map(s=>10**(s.k+s.v.reduce((n,v,j)=>n+v*x[j],0)))
 const sums=names.map((_,i)=>c.reduce((n,v,j)=>n+species[j].v[i]*v,0))
 const scales=names.map((_,i)=>Math.max(1e-100,Math.abs(total[i]),c.reduce((n,v,j)=>n+Math.abs(species[j].v[i]*v),0)))
 const residual=sums.map((s,i)=>(s-total[i])/scales[i])
 const jac=names.map((_,i)=>names.map((_,k)=>Math.LN10*c.reduce((n,v,j)=>n+species[j].v[i]*species[j].v[k]*v,0)/scales[i]))
 return {c,residual,jac,norm:Math.max(...residual.map(Math.abs))}
}
function linear(a,b){a=a.map((r,i)=>[...r,b[i]]);for(let k=0;k<b.length;k++){let p=k;for(let j=k+1;j<b.length;j++)if(Math.abs(a[j][k])>Math.abs(a[p][k]))p=j;[a[p],a[k]]=[a[k],a[p]];const d=a[k][k];if(Math.abs(d)<1e-30)throw Error('Singular independent Jacobian');a[k]=a[k].map(v=>v/d);for(let j=0;j<b.length;j++)if(j!==k){const m=a[j][k];a[j]=a[j].map((v,i)=>v-m*a[k][i])}}return a.map(r=>r.at(-1))}

 let x=[...initial],s=state(x),iteration=0
 for(;iteration<100&&s.norm>1e-12;iteration++){
  const dx=linear(s.jac,s.residual.map(r=>-r));let accepted=false
  for(let step=1;step>1e-10;step/=2){const candidate=x.map((v,i)=>v+step*dx[i]),next=state(candidate);if(Number.isFinite(next.norm)&&next.norm<s.norm){x=candidate;s=next;accepted=true;break}}
  if(!accepted)throw Error('Independent line search failed')
 }
 if(s.norm>1e-12)throw Error('Independent raw balance failed')
 const logs=Object.fromEntries(species.map((r,i)=>[r.name,Math.log10(s.c[i])])),electron=names.indexOf('e-');logs['e-']=x[electron];logs.H2O=0
 const massAction=rows.map(r=>logs[r.name]-r.logK-r.metadata.effectiveSourceReaction.components.reduce((n,t)=>n+t.coefficient*logs[t.name],0))
 const netCharge=charges?species.reduce((n,r,i)=>n+s.c[i]*(names.includes(r.name)?charges[names.indexOf(r.name)]:rows.find(row=>row.name===r.name).charge),0):null
 return {netCharge,maximumMassActionResidual:Math.max(...massAction.map(Math.abs)),method:'Direct raw-source mass action; independent source-coordinate Newton with analytical Jacobian and line search. No production modules.',rows:rows.length,iterations:iteration,maximumScaledBalance:s.norm,pH:-x[names.indexOf('H+')],pe:-x[names.indexOf('e-')],logActivities:Object.fromEntries(names.map((n,i)=>[n,x[i]])),carriers:Object.fromEntries(species.map((r,i)=>[r.name,s.c[i]]))}
}
