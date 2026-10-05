import assert from 'node:assert/strict'
import {solveFixedRedox} from '../../src/solver/redox.js'
import {componentBalanceTolerance} from '../../src/solver/validationContract.js'
// Audit-only independent mass action, not imported by production. Constants match
// Adam's declared SI convention; neither its Eh conversion nor compiler is used.
export const nernstSlope=8.31446261815324*298.15*Math.LN10/Number('96485.3321233100184')
export const ironMetalSourceId='spana:2ac52a30213c9288:127500'
const ferricSourceId='spana:2ac52a30213c9288:126584'
export function rawFeAudit(repository,system){
 const metal=repository.getSpeciesById(ironMetalSourceId),ferric=repository.getSpeciesById(ferricSourceId)
 assert.equal(metal.logK,-15.89)
 assert.deepEqual(metal.componentStoichiometry,{'Fe 2+':1,'e-':2})
 const rows=system.products.map(p=>{const r=repository.getSpeciesById(p.id==='canonical-state:component:Fe%203%2B'?ferricSourceId:p.id);assert.ok(r);return r})
 const coefficients=r=>{
  const c={'Fe 2+':0,'H+':0,'e-':0,H2O:0};let logK=r.logK
  for(const t of r.metadata.effectiveSourceReaction.components){if(t.name==='Fe 3+'){c['Fe 2+']+=t.coefficient;c['e-']-=t.coefficient;logK+=t.coefficient*ferric.logK}else{assert.ok(Object.hasOwn(c,t.name));c[t.name]+=t.coefficient}}
  return {coefficients:Object.values(c),logK}
 }
 for(const [i,r] of rows.entries()){const a=coefficients(r),p=system.products[i];assert.deepEqual(a.coefficients,p.coefficients);assert.ok(Math.abs(a.logK-p.logBeta)<1e-12)}
 function saturatedInventory(Eh,pH=0){
  const pe=Eh/nernstSlope,logFe2=2*pe-metal.logK,logFe3=ferric.logK+logFe2+pe
  const activities={'Fe 2+':logFe2,'Fe 3+':logFe3,'e-':-pe,'H+':-pH,H2O:0}
  let dissolved=10**logFe2
  for(const r of rows.filter(r=>r.phase==='aqueous')){const terms=r.metadata.effectiveSourceReaction.components,feCount=terms.filter(t=>['Fe 2+','Fe 3+'].includes(t.name)).reduce((s,t)=>s+t.coefficient,0);dissolved+=feCount*10**(r.logK+terms.reduce((s,t)=>s+t.coefficient*activities[t.name],0))}
  return dissolved
 }
 const transition=(total,fraction=1)=>{let lo=-1,hi=0;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(saturatedInventory(mid)<total*fraction)lo=mid;else hi=mid}return (lo+hi)/2}
 return {metal,ferric,transition,saturatedInventory,standardPotential:nernstSlope*metal.logK/2}
}
export async function auditFeMetal(repository,system,total){
 const raw=rawFeAudit(repository,system),id=system.components[0].id
 const point=async Eh=>{const p=await solveFixedRedox(system,{pH:0,Eh,totals:{[id]:total}});assert.ok(p.ok,JSON.stringify(p.diagnostics));return p.result}
 const metalAmount=r=>r.solids.find(s=>s.id===ironMetalSourceId).amount
 const expected=raw.transition(total),expectedHalf=raw.transition(total,.5)
 let lo=expected-.002,hi=expected+.002
 for(let i=0;i<32;i++){const mid=(lo+hi)/2,r=await point(mid);if(metalAmount(r)>0)lo=mid;else hi=mid}
 const disappearance={lower:lo,upper:hi,midpoint:(lo+hi)/2}
 lo=expectedHalf-.002;hi=expectedHalf+.002
 for(let i=0;i<32;i++){const mid=(lo+hi)/2,r=await point(mid);if(metalAmount(r)>total/2)lo=mid;else hi=mid}
 const half=(lo+hi)/2,reducing=await point(-2),dissolved=reducing.dissolvedComponentAmounts[0],solid=metalAmount(reducing)
 assert.ok(Math.abs(total-dissolved-solid)<=componentBalanceTolerance(total,total))
 assert.ok(Math.abs(disappearance.midpoint-expected)<1e-8)
 assert.ok(Math.abs(half-expectedHalf)<1e-8)
 return {total,pH:0,temperatureC:25,pressureBarDeclared:1,activity:'ideal',standardPotential:raw.standardPotential,nernstSlope,expectedDisappearance:expected,calculatedDisappearance:disappearance,expectedHalfPartition:expectedHalf,calculatedHalfPartition:half,atMinus2:{total,dissolved,solids:reducing.solids,metalAmount:solid,metalFraction:solid/total,balanceResidual:total-dissolved-solid,balanceTolerance:componentBalanceTolerance(total,total)},source:{id:raw.metal.id,reaction:raw.metal.metadata.effectiveSourceReaction,logK:raw.metal.logK,citation:raw.metal.citation,provenance:raw.metal.provenance}}
}
