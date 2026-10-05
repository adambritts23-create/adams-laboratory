// Independent raw-source reference. No production preparation/compiler/solver imports.
import fs from 'node:fs'
const raw=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json'))
export function closedSolidsReference({names,total,initial,solidIds,charges}) {
 const expressions=new Map(names.map((name,i)=>[name,{k:0,v:names.map((_,j)=>Number(i===j))}]))
 expressions.set('H2O',{k:0,v:names.map(()=>0)})
 const rows=[],derived=[]
 const terms=r=>r.metadata?.effectiveSourceReaction?.components?.filter(t=>t.coefficient)
 const expand=r=>({id:r.id,name:r.name,k:r.logK+terms(r).reduce((n,t)=>n+t.coefficient*expressions.get(t.name).k,0),v:names.map((_,i)=>terms(r).reduce((n,t)=>n+t.coefficient*expressions.get(t.name).v[i],0))})
 let changed=true
 while(changed){changed=false;for(const r of raw.species){
  if(r.phase!=='aqueous'||!terms(r)||rows.some(s=>s.id===r.id)||!terms(r).every(t=>expressions.has(t.name)))continue
  const expression=expand(r);rows.push(r);derived.push(expression);expressions.set(r.name,expression);changed=true
 }}
 const species=[...names.filter(n=>n!=='e-').map(name=>({id:name,name,k:0,v:names.map(n=>Number(n===name))})),...derived.filter((s,i,a)=>!names.includes(s.name)&&s.name!=='H2O'&&a.findIndex(r=>r.name===s.name)===i)]
 const reachable=raw.species.filter(r=>r.phase!=='aqueous'&&terms(r)?.every(t=>expressions.has(t.name))).map(r=>({...expand(r),phase:r.phase,terms:terms(r),logK:r.logK,reference:r.citation}))
 const solids=solidIds.map(id=>{const r=reachable.find(s=>s.id===id&&s.phase==='solid');if(!r)throw Error('Unreachable reference solid');return r})
 const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),N=names.length
 function evaluate(x,active){
  const logs=x.slice(0,N),amounts=x.slice(N),c=species.map(s=>10**(s.k+dot(s.v,logs)))
  const balance=names.map((_,i)=>c.reduce((n,v,j)=>n+species[j].v[i]*v,0)+active.reduce((n,s,j)=>n+s.v[i]*amounts[j],0)-total[i])
  const scales=names.map((_,i)=>Math.max(1e-100,Math.abs(total[i]),c.reduce((n,v,j)=>n+Math.abs(species[j].v[i]*v),0)+active.reduce((n,s,j)=>n+Math.abs(s.v[i]*amounts[j]),0)))
  const residual=[...balance.map((v,i)=>v/scales[i]),...active.map(s=>s.k+dot(s.v,logs))]
  const jac=names.map((_,i)=>[...names.map((_,k)=>Math.LN10*c.reduce((n,v,j)=>n+species[j].v[i]*species[j].v[k]*v,0)/scales[i]),...active.map(s=>s.v[i]/scales[i])])
  active.forEach(s=>jac.push([...s.v,...active.map(()=>0)]))
  return {c,balance,scales,residual,jac,norm:Math.max(...residual.map(Math.abs))}
 }
 function linear(a,b){a=a.map((r,i)=>[...r,b[i]]);for(let k=0;k<b.length;k++){let p=k;for(let j=k+1;j<b.length;j++)if(Math.abs(a[j][k])>Math.abs(a[p][k]))p=j;[a[p],a[k]]=[a[k],a[p]];const d=a[k][k];if(Math.abs(d)<1e-30)throw Error('Singular independent Jacobian');a[k]=a[k].map(v=>v/d);for(let j=0;j<b.length;j++)if(j!==k){const m=a[j][k];a[j]=a[j].map((v,i)=>v-m*a[k][i])}}return a.map(r=>r.at(-1))}
 let active=[],logs=[...initial],history=[],seen=new Set(),iterations=0
 for(let phaseStep=0;phaseStep<24;phaseStep++){
  const key=active.map(s=>s.id).sort().join('|');if(seen.has(key))throw Error('Independent active-set cycle');seen.add(key)
  let x=[...logs,...active.map(()=>0)],s=evaluate(x,active)
  for(let iteration=0;iteration<120&&s.norm>2e-13;iteration++,iterations++){
   const dx=linear(s.jac,s.residual.map(r=>-r));let accepted=false
   for(let step=Math.min(1,4/Math.max(4,...dx.slice(0,N).map(Math.abs)));step>1e-12;step/=2){const nextX=x.map((v,i)=>v+step*dx[i]),next=evaluate(nextX,active);if(Number.isFinite(next.norm)&&next.norm<s.norm){x=nextX;s=next;accepted=true;break}}
   if(!accepted)throw Error(`Independent line search failed: ${s.norm}`)
  }
  if(s.norm>2e-13)throw Error(`Independent balance failed: ${s.norm}`)
  logs=x.slice(0,N)
  const phaseState=reachable.map(r=>({...r,amount:active.includes(r)?x[N+active.indexOf(r)]:0,logSaturation:r.k+dot(r.v,logs)}))
  history.push({activeIds:active.map(s=>s.id),maximumScaledResidual:s.norm,phases:phaseState.map(r=>({id:r.id,amount:r.amount,logSaturation:r.logSaturation}))})
  const negative=active.filter((_,i)=>x[N+i]<0).sort((a,b)=>x[N+active.indexOf(a)]-x[N+active.indexOf(b)]||a.id.localeCompare(b.id))[0]
  if(negative){active=active.filter(r=>r!==negative);continue}
  const violated=solids.filter(r=>!active.includes(r)&&r.k+dot(r.v,logs)>1e-12).sort((a,b)=>(b.k+dot(b.v,logs))-(a.k+dot(a.v,logs))||a.id.localeCompare(b.id))[0]
  if(violated){active.push(violated);continue}
  const sourceLogs=Object.fromEntries(species.map((r,i)=>[r.name,Math.log10(s.c[i])]))
  sourceLogs['e-']=logs[names.indexOf('e-')];sourceLogs.H2O=0
  const maximumMassActionResidual=Math.max(...rows.map(r=>Math.abs(sourceLogs[r.name]-r.logK-terms(r).reduce((n,t)=>n+t.coefficient*sourceLogs[t.name],0))))
  if(maximumMassActionResidual>1e-10)throw Error('Independent source-law inconsistency')
  const componentCharges=charges
  const charge=species.reduce((n,r,i)=>n+dot(r.v,componentCharges)*s.c[i],0)
  return {method:'Independent raw-source-coordinate Newton and bounded active-phase changes; no production imports',names,total,logs,pH:-logs[names.indexOf('H+')],pe:-logs[names.indexOf('e-')],iterations,history,phases:phaseState,carriers:species.map((r,i)=>({id:r.id,name:r.name,amount:s.c[i],coefficients:r.v})),balance:s.balance,maximumScaledResidual:s.norm,maximumMassActionResidual,charge}
 }
 throw Error('Independent phase-change limit')
}
