// Standalone feasibility calculation. No production imports, no UI/build/test execution.
import fs from 'node:fs'
import crypto from 'node:crypto'
const raw=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json','utf8'))
const terms=r=>r.metadata?.effectiveSourceReaction?.components??[]
const selected=['H+','H2O','CH3COO-','B(OH)3','Na+','K+','Cl-','NO3-']
const reachable=raw.species.filter(r=>terms(r).length&&terms(r).every(t=>selected.includes(t.name)))
const source=reachable.map(r=>({id:r.id,name:r.name,phase:r.phase,charge:r.charge,logK:r.logK,terms:terms(r),citation:r.citation,provenance:r.provenance}))
for(const r of reachable)if(!(r.provenance.kind==='imported'&&r.provenance.dbSha256&&r.logK===r.provenance.originalLogK&&r.temperatureReference===298.15&&r.metadata.sourceFormat==='spana-java-binary'&&r.logKConvention?.startsWith('log10 formation constant for one named product')))throw Error('Unusable source '+r.id)
const spectatorNames=['H+','H2O','e-','Fe 2+','Fe 3+','NO3-','Cl-']
const spectatorAudit=raw.species.filter(r=>terms(r).some(t=>['Cl-','NO3-'].includes(t.name))&&terms(r).every(t=>spectatorNames.includes(t.name))).map(r=>({id:r.id,name:r.name,phase:r.phase,logK:r.logK,terms:terms(r),citation:r.citation}))
const charges={'H+':1,'CH3COO-':-1,'B(OH)3':0,'Na+':1,'K+':1}
const volumes=[0,2.5,5,7.5,9.5,10,10.5,12.5,15,17.5,19.5,20,20.5,22,25,50,100]
function linear(a,b){a=a.map((r,i)=>[...r,b[i]]);const n=b.length;for(let i=0;i<n;i++){let p=i;for(let j=i+1;j<n;j++)if(Math.abs(a[j][i])>Math.abs(a[p][i]))p=j;[a[p],a[i]]=[a[i],a[p]];if(Math.abs(a[i][i])<1e-25)throw Error('singular');const d=a[i][i];for(let k=i;k<=n;k++)a[i][k]/=d;for(let j=0;j<n;j++)if(j!==i){const q=a[j][i];for(let k=i;k<=n;k++)a[j][k]-=q*a[i][k]}}return a.map(r=>r[n])}
function solve(v,{salt=null}={}){
 const liters=(50+v)/1000,totals={'CH3COO-':.001/liters,'B(OH)3':.001/liters,'Na+':(.1*v/1000+(salt==='Na+'?.0005:0))/liters,'K+':(salt==='K+'?.0005:0)/liters}
 const basis=['H+',...Object.keys(totals).filter(k=>totals[k]>0)],ordinary=basis.slice(1),allowed=[...basis,'H2O']
 const rows=source.filter(r=>r.phase==='aqueous'&&r.terms.every(t=>allowed.includes(t.name)))
 const carriers=[...basis.map((name,i)=>({name,charge:charges[name],logK:0,vector:basis.map((_,j)=>i===j?1:0)})),...rows.map(r=>({...r,vector:basis.map(k=>r.terms.find(t=>t.name===k)?.coefficient??0)}))]
 const scales=[Object.values(totals).reduce((a,b)=>a+b,0),...ordinary.map(k=>totals[k])]
 const weights=carriers.map(r=>[r.charge,...ordinary.map(k=>r.vector[basis.indexOf(k)])])
 function evaluate(x){const logs=carriers.map(r=>r.logK+r.vector.reduce((s,c,j)=>s+c*x[j],0)),amounts=logs.map(l=>10**l),sums=scales.map((_,i)=>amounts.reduce((s,c,j)=>s+c*weights[j][i],0));const residual=sums.map((s,i)=>(s-(i?totals[ordinary[i-1]]:0))/scales[i]);const jac=scales.map((scale,i)=>basis.map((_,k)=>amounts.reduce((s,c,j)=>s+weights[j][i]*c*carriers[j].vector[k]*Math.LN10,0)/scale));return {logs,amounts,sums,residual,jac,norm:Math.max(...residual.map(Math.abs))}}
 let x=basis.map(k=>k==='H+'?-6:Math.log10(totals[k])-.3),e=evaluate(x),iterations=0
 for(;iterations<100&&e.norm>2e-13;iterations++){let step=linear(e.jac,e.residual.map(n=>-n));const cap=Math.max(1,...step.map(n=>Math.abs(n)/2));step=step.map(n=>n/cap);let f=1,next;while(f>1e-10){next=evaluate(x.map((z,j)=>z+f*step[j]));if(Number.isFinite(next.norm)&&next.norm<e.norm)break;f/=2}if(f<=1e-10)throw Error('line search '+v);x=x.map((z,j)=>z+f*step[j]);e=next}
 if(e.norm>2e-12)throw Error('convergence '+v)
 const amounts=Object.fromEntries(carriers.map((r,i)=>[r.name,e.amounts[i]])),logBasis=Object.fromEntries(basis.map((k,i)=>[k,x[i]]));logBasis.H2O=0
 const phaseChecks=source.filter(r=>r.phase!=='aqueous'&&r.terms.every(t=>allowed.includes(t.name))).map(r=>({id:r.id,name:r.name,phase:r.phase,logActivity:r.logK+r.terms.reduce((s,t)=>s+t.coefficient*logBasis[t.name],0)}))
 const familyFractions=Object.fromEntries(['CH3COO-','B(OH)3'].map(k=>[k,Object.fromEntries(carriers.flatMap((r,i)=>{const w=r.vector[basis.indexOf(k)];return w?[[r.name,w*e.amounts[i]/totals[k]]]:[]}))]))
 const massActionResidual=Math.max(0,...rows.map(r=>Math.abs(Math.log10(amounts[r.name])-r.logK-r.terms.reduce((s,t)=>s+t.coefficient*logBasis[t.name],0))))
 return {volumeMl:v,pH:-x[0],totalVolumeMl:liters*1000,totals,amounts,familyFractions,chargeResidual:e.sums[0],componentResiduals:Object.fromEntries(ordinary.map((k,i)=>[k,e.sums[i+1]-totals[k]])),maxScaledResidual:e.norm,massActionResidual,phaseChecks,iterations}
}
const benchmark=volumes.map(v=>solve(v)),sodiumSalt=volumes.map(v=>solve(v,{salt:'Na+'})),potassiumSalt=volumes.map(v=>solve(v,{salt:'K+'}))
const comparison=sodiumSalt.map((n,i)=>({volumeMl:n.volumeMl,NaPH:n.pH,KPH:potassiumSalt[i].pH,deltaPH:potassiumSalt[i].pH-n.pH,NaAcetateFraction:n.familyFractions['CH3COO-']['Na(CH3COO)']??0,KCaseNaAcetateFraction:potassiumSalt[i].familyFractions['CH3COO-']['Na(CH3COO)']??0,KAcetateFraction:potassiumSalt[i].familyFractions['CH3COO-']['K(CH3COO)']??0,deltaFreeAcetateFraction:potassiumSalt[i].familyFractions['CH3COO-']['CH3COO-']-n.familyFractions['CH3COO-']['CH3COO-'],deltaFreeBorateFraction:potassiumSalt[i].familyFractions['B(OH)3']['B(OH)4-']-n.familyFractions['B(OH)3']['B(OH)4-']}))
const all=[...benchmark,...sodiumSalt,...potassiumSalt]
for(const p of all){
 if(Math.abs(p.chargeResidual)>1e-12||Object.values(p.componentResiduals).some(n=>Math.abs(n)>1e-12)||p.massActionResidual>1e-12)throw Error('Prototype balance check failed')
 for(const f of Object.values(p.familyFractions))if(Math.abs(Object.values(f).reduce((a,b)=>a+b,0)-1)>1e-10)throw Error('Family closure failed')
 if(p.phaseChecks.some(q=>q.phase==='solid'&&q.logActivity>=0))throw Error('Second family requires solid closure at '+p.volumeMl)
}
const output={scope:'Independent Ideal 25 C simultaneous aqueous family/charge balance; additive volumes, 1 model kg water/L. No production solver imports.',sourceFileSha256:crypto.createHash('sha256').update(fs.readFileSync('public/data/thermodynamic-default.json')).digest('hex'),source,recipe:{sampleMl:50,aceticAcidM:.020,boricAcidM:.020,titrant:'0.1000 M NaOH',loadedMl:100},counterionRecipe:'50 mL: 10 mM acetic acid + 10 mM Na/K acetate + 20 mM boric acid; same 0.1000 M NaOH titrant',benchmark,sodiumSalt,potassiumSalt,comparison,summary:{solves:all.length,maxChargeResidual:Math.max(...all.map(p=>Math.abs(p.chargeResidual))),maxComponentResidual:Math.max(...all.flatMap(p=>Object.values(p.componentResiduals).map(Math.abs))),maxMassActionResidual:Math.max(...all.map(p=>p.massActionResidual)),maxSolidLogActivity:Math.max(...all.flatMap(p=>p.phaseChecks.filter(q=>q.phase==='solid').map(q=>q.logActivity))),maxGasActivitySum:Math.max(...all.map(p=>p.phaseChecks.filter(q=>q.phase==='gas').reduce((s,q)=>s+10**q.logActivity,0))),maxAbsDeltaPH:Math.max(...comparison.map(p=>Math.abs(p.deltaPH)))}}
output.spectatorAudit=spectatorAudit
output.checks='51 simultaneous equilibria: charge/components <1e-12 model molal, family closure <1e-10, mass action <1e-12 log10 units; all reachable solids undersaturated. These are standalone prototype checks, not production tolerance changes.'
fs.writeFileSync('docs/mixed-solution-feasibility.json',JSON.stringify(output,null,2)+'\n')
console.log(JSON.stringify(output.summary,null,2));console.table(benchmark.map(p=>({mL:p.volumeMl,pH:p.pH,acetateFree:p.familyFractions['CH3COO-']['CH3COO-'],borateFree:p.familyFractions['B(OH)3']['B(OH)4-'],NaAc:p.familyFractions['CH3COO-']['Na(CH3COO)']??0})));console.table(comparison)
