import {compileSourceConservation} from './sourceConservation.js'
import {transformReactionBasis,scaleReaction} from './reactionBasis.js'
import {freeze} from '../solver/models.js'
export const closedRedoxVersion='closed-redox-aqueous-v1'
export const aqueousClosureVersion='closed-redox-aqueous-closure-v2'
// Only immutable reaction structure is reused. Inventories and revisions are prepared per sample.
const structures=new Map()
const structureKey=value=>value===undefined?'undefined':typeof value==='number'?'number:'+String(Object.is(value,-0)?'-0':value):value===null?'null':Array.isArray(value)?'array:['+value.map(structureKey).join(',')+']':typeof value==='object'?'object:{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+structureKey(value[k])).join(',')+'}':typeof value+':'+JSON.stringify(value)
const fail=(code,message)=>freeze({ok:false,diagnostics:[{code,message}]})
const integer=n=>Number.isSafeInteger(n)&&Math.abs(n)<=64
const gcd=(a,b)=>b?gcd(b,a%b):a
// Structural rank only, not an equilibrium convergence tolerance.
function rank(rows){
 if(!rows.length)return 0
 const a=rows.map(r=>[...r]);let k=0
 for(let c=0;c<a[0].length&&k<a.length;c++){
  let p=k;for(let j=k+1;j<a.length;j++)if(Math.abs(a[j][c])>Math.abs(a[p][c]))p=j
  if(Math.abs(a[p][c])<=128*Number.EPSILON*Math.max(1,...a.flat().map(Math.abs)))continue
  ;[a[k],a[p]]=[a[p],a[k]];const d=a[k][c];a[k]=a[k].map(x=>x/d)
  for(let j=k+1;j<a.length;j++){const m=a[j][c];a[j]=a[j].map((x,i)=>x-m*a[k][i])}k++
 }return k
}
/** Explicit source IDs and static scientific attributes; never name/valence inference.
 * A spanning set of electron-free equations describes one simultaneous network.
 */
export function compileClosedRedoxNetwork(request){
 if(!request||request.mode!=='closed-redox'||request.temperatureC!==25||request.pressureBar!==1||request.activityModel!=='ideal'||request.unit!=='mol/kg-H2O')return fail('closed-redox-scope','Explicit closed-redox, Ideal 25 C, declared 1 bar and mol/kg-H2O required.')
 if(['Eh','pe','electronActivity','electronTotal','fixedActivities'].some(k=>Object.hasOwn(request,k)))return fail('closed-reservoir-conflict','Closed redox does not accept electron totals, imposed potential or fixed activity reservoirs.')
 const allowed=['mode','temperatureC','pressureBar','activityModel','unit','species','reactions','basisIds','electronId','preparation','revision','solvent','conservationMethod','sourceFingerprint']
 if(Object.keys(request).some(k=>!allowed.includes(k)))return fail('unsupported-closed-option','Unknown closed-system options cannot be silently interpreted as reservoirs or totals.')
 if(request.conservationMethod!==undefined&&request.conservationMethod!=='source-exact-v1')return fail('unsupported-conservation-method','Unknown conservation contract.')
 const {species,reactions,basisIds,electronId}=structuredClone(request)
 const sourceExact=request.conservationMethod==='source-exact-v1',reviewedComplete=Array.isArray(species)&&species.every(s=>s?.elements!==undefined)
 if(!Array.isArray(species)||!Array.isArray(reactions)||!Array.isArray(basisIds)||species.length>64||reactions.length<2||reactions.length>64||basisIds.length>16)return fail('invalid-closed-network','At most 64 source species/reactions and 16 physical basis IDs are supported; no chemistry is truncated.')
 if(species.some(s=>!s||typeof s.id!=='string'||!s.id||typeof s.name!=='string'||!s.sourceIdentity||typeof s.sourceIdentity.reference!=='string'||!integer(s.charge)||(!s.elements&&!sourceExact)||(s.elements&&(Array.isArray(s.elements)||Object.hasOwn(s.elements,'charge')||Object.values(s.elements).some(n=>!integer(n)||n<0))))||new Set(species.map(s=>s.id)).size!==species.length)return fail('closed-metadata-required','Unique source identities, static references and explicit integer element/charge metadata required.')
 const electron=species.find(s=>s.id===electronId)
 if(!electron||electron.role!=='electron'||electron.charge!==-1||Object.values(electron.elements??{}).some(n=>n!==0)||species.filter(s=>s.role==='electron').length!==1||basisIds.includes(electronId))return fail('invalid-electron-identity','One explicit formal electron identity, excluded from physical basis, is required.')
 const waters=species.filter(s=>s.role==='water'),water=waters[0],solvent=request.solvent
 if(waters.length>1||Boolean(water)!==Boolean(solvent))return fail('invalid-closed-solvent','One explicit water identity and fixed-water solvent convention must be supplied together.')
 if(water&&(water.phase!=='liquid'||water.charge!==0||water.elements.H!==2||water.elements.O!==1||Object.keys(water.elements).some(k=>!['H','O'].includes(k))||!basisIds.includes(water.id)||solvent.kind!=='fixed-water-activity'||solvent.speciesId!==water.id||solvent.logActivity!==0||Object.keys(solvent).some(k=>!['kind','speciesId','logActivity'].includes(k))))return fail('invalid-closed-solvent','Only explicit H2O solvent at unit activity, retained in the basis, is supported; no water inventory.')
 const physical=species.filter(s=>s.id!==electronId&&s.id!==water?.id)
 if(physical.some(s=>s.phase!=='aqueous'||!['ordinary','proton'].includes(s.role)||(!sourceExact&&!Object.values(s.elements).some(n=>n>0))))return fail('unsupported-closed-carrier','Only aqueous solute carriers and explicitly declared solvent water are admitted.')
 const protons=physical.filter(s=>s.role==='proton')
 if(protons.length>1||protons.some(s=>s.charge!==1||s.elements.H!==1||Object.keys(s.elements).some(k=>k!=='H')))return fail('invalid-closed-proton','Proton identity requires explicit H=1, charge +1 metadata.')
 if(basisIds.some(id=>!physical.some(s=>s.id===id)&&id!==water?.id)||new Set(basisIds).size!==basisIds.length)return fail('invalid-closed-basis','Basis must contain unique physical species identities.')
 const ids=new Set(species.map(s=>s.id)),allReactions=[...reactions].sort((a,b)=>String(a?.id).localeCompare(String(b?.id)))
 if(allReactions.some(r=>!r||!r.provenance||typeof r.provenance.reference!=='string'||!r.unit||r.unit.kind!=='ideal-molal-standard'||r.phase!=='aqueous'||!ids.has(r.productId)||r.productId===electronId||!integer(r.productCoefficient??1)||(r.productCoefficient??1)===0||!Number.isFinite(r.logK)||!Array.isArray(r.terms)||r.terms.some(t=>!ids.has(t.id)||!integer(t.coefficient))||new Set(r.terms.map(t=>t.id)).size!==r.terms.length))return fail('unsupported-half-reaction','Explicit balanced integer reactions with consistent ideal standard states and static source references required.')
 const halves=allReactions.filter(r=>r.terms.some(t=>t.id===electronId&&t.coefficient!==0)),ordinaryReactions=allReactions.filter(r=>!halves.includes(r))
 if(!halves.length)return fail('missing-redox-network','At least one real electron-bearing half reaction is required.')
 const elements=reviewedComplete?[...new Set(species.flatMap(s=>Object.keys(s.elements)))].sort():[]
 for(const r of allReactions)for(const key of ['charge',...elements]){
  const value=id=>key==='charge'?species.find(s=>s.id===id).charge:species.find(s=>s.id===id).elements[key]??0
  if((r.productCoefficient??1)*value(r.productId)!==r.terms.reduce((n,t)=>n+t.coefficient*value(t.id),0))return fail('half-reaction-bookkeeping','Source half reaction does not exactly conserve declared composition and charge.')
 }
 const anchor=halves[0],e=r=>r.terms.find(t=>t.id===electronId).coefficient
 const cancellations=halves.slice(1).map(r=>{
  const multiple=Math.abs(e(anchor)*e(r))/gcd(Math.abs(e(anchor)),Math.abs(e(r)))
  const factors=[multiple/e(anchor),-multiple/e(r)],scaled=[scaleReaction(anchor,factors[0]),scaleReaction(r,factors[1])]
  const coefficients=Object.fromEntries(species.map(s=>[s.id,scaled.reduce((n,h)=>n+(h.productId===s.id?(h.productCoefficient??1):0)-(h.terms.find(t=>t.id===s.id)?.coefficient??0),0)]))
  return {sourceIds:[anchor.id,r.id],multipliers:factors,electronMultiple:multiple,electronResidual:coefficients[electronId],coefficients,logK:scaled.reduce((n,h)=>n+h.logK,0)}
 })
 if(cancellations.some(c=>c.electronResidual!==0||!Number.isFinite(c.logK)||Object.values(c.coefficients).some(n=>!Number.isSafeInteger(n))))return fail('electron-cancellation-failed','Exact bounded integer cancellation failed.')
 const attributes=Object.fromEntries(species.map(s=>[s.id,{charge:s.charge,elements:s.elements}]))
 const structuralKey=structureKey({species,reactions,basisIds,electronId,solvent:request.solvent,conservationMethod:request.conservationMethod,sourceFingerprint:request.sourceFingerprint})
 if(structures.has(structuralKey))return structures.get(structuralKey)
 const algebra=transformReactionBasis({basisIds,componentIds:species.map(s=>s.id),reactions:allReactions,attributes,...(species.length>32?{capacity:'closed-aqueous-64-v1'}:{})})
 if(!algebra.ok)return algebra
 // Conserved solute quantities must annihilate the solvent composition.
 // Fixed H2O permits H/O exchange only in the ratio 2:1; H-2O is conserved.
 const rows=!reviewedComplete?[]:water?[...elements.filter(k=>!['H','O'].includes(k)).map(key=>({key,value:s=>s.elements[key]??0})),{key:'H-2O',value:s=>(s.elements.H??0)-2*(s.elements.O??0)}]:elements.map(key=>({key,value:s=>s.elements[key]??0}))
 rows.push({key:'charge',value:s=>s.charge})
 const conservation=rows.map(({key,value})=>({key,weights:physical.map(value),basisWeights:basisIds.map(id=>value(species.find(s=>s.id===id)))}))
 const closedColumns=basisIds.flatMap((id,i)=>id===water?.id?[]:[i])
 if(reviewedComplete&&rank(conservation.map(r=>closedColumns.map(i=>r.basisWeights[i])))!==closedColumns.length)return fail('unclosed-physical-inventory','Solvent-independent elemental inventories and charge do not span the closed basis; hidden preparation constraints would remain.')
 for(const row of conservation)for(let j=0;j<physical.length;j++){
  const v=algebra.componentExpressions[physical[j].id].coefficients.reduce((n,c,i)=>n+c*row.basisWeights[i],0)
  if(Math.abs(v-row.weights[j])>128*Number.EPSILON*Math.max(1,Math.abs(v),Math.abs(row.weights[j])))return fail('transformed-inventory-mismatch','Physical composition is inconsistent with the reaction basis.')
 }
 const network={ok:true,sourceFingerprint:request.sourceFingerprint??null,version:water||ordinaryReactions.length?aqueousClosureVersion:closedRedoxVersion,physical,halves,ordinaryReactions,water:water??null,protonId:protons[0]?.id??null,electronId,basisIds:[...basisIds],conservation,cancellations,algebra,sourceSpecies:species}
 if(request.conservationMethod==='source-exact-v1'){
  try{network.sourceConservation=compileSourceConservation(network,reviewedComplete?conservation:null);if(!reviewedComplete)network.conservation=network.sourceConservation.conservation.map(r=>({...r,sourceDerived:true,weights:physical.map(s=>r.weights[network.sourceConservation.physicalIds.indexOf(s.id)])}))}catch(error){return fail('source-conservation-invalid',error.message)}
 }
 const result=freeze(network)
 if(structures.size>=32)structures.delete(structures.keys().next().value)
 structures.set(structuralKey,result)
 return result
}
