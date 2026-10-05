// Exact structural algebra extracted from the validated Cr/Fe/Eu prototype.
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a
export class Q {
 constructor(n,d=1n){if(!d)throw Error('zero denominator');if(d<0n){n=-n;d=-d}const g=gcd(n,d);this.n=n/g;this.d=d/g;if(this.n.toString(2).length>16384||this.d.toString(2).length>16384)throw Error("Exact structural arithmetic capacity exceeded")}
 static number(v){if(!Number.isFinite(v))throw Error('finite input required');if(v===0)return new Q(0n);const b=new DataView(new ArrayBuffer(8));b.setFloat64(0,v);const bits=b.getBigUint64(0),sign=bits>>63n?-1n:1n,exponent=Number((bits>>52n)&2047n),mantissa=(bits&((1n<<52n)-1n))+(exponent?1n<<52n:0n),power=(exponent||1)-1023-52;return power>=0?new Q(sign*mantissa*(1n<<BigInt(power))):new Q(sign*mantissa,1n<<BigInt(-power))}
 add(b){return new Q(this.n*b.d+b.n*this.d,this.d*b.d)}
 neg(){return new Q(-this.n,this.d)}
 sub(b){return this.add(b.neg())}
 mul(b){return new Q(this.n*b.n,this.d*b.d)}
 div(b){return new Q(this.n*b.d,this.d*b.n)}
 number(){
  if(!this.n)return 0
  const sign=this.n<0n?-1:1,n=this.n<0n?-this.n:this.n,d=this.d
  let exponent=n.toString(2).length-d.toString(2).length
  if(exponent>=0?n<(d<<BigInt(exponent)):(n<<BigInt(-exponent))<d)exponent--
  const shift=Math.max(52-exponent,0)>1074?1074:52-exponent
  const numerator=shift>=0?n<<BigInt(shift):n,denominator=shift>=0?d:d<<BigInt(-shift)
  let q=numerator/denominator;const r=numerator%denominator
  if(2n*r>denominator||(2n*r===denominator&&q%2n))q++
  const value=sign*Number(q)*2**(-shift)
  if(!Number.isFinite(value))throw Error('Final inventory exceeds Number range')
  return value
 }
 toJSON(){return this.n+'/'+this.d}
}
const zero=()=>new Q(0n),one=()=>new Q(1n),sum=a=>a.reduce((x,y)=>x.add(y),zero())
function reduced(matrix){const a=matrix.map(r=>[...r]),pivots=[];let k=0;for(let j=0;j<(a[0]?.length??0)&&k<a.length;j++){let p=k;while(p<a.length&&!a[p][j].n)p++;if(p===a.length)continue;[a[p],a[k]]=[a[k],a[p]];const divisor=a[k][j];a[k]=a[k].map(v=>v.div(divisor));for(let i=0;i<a.length;i++)if(i!==k&&a[i][j].n){const factor=a[i][j];a[i]=a[i].map((v,c)=>v.sub(factor.mul(a[k][c])))}pivots.push(j);k++}return {a,pivots}}
const rank=a=>reduced(a).pivots.length
export function deriveConservation({species,reactions,electronId,waterId,basisIds}){
 if(species.some(s=>Object.hasOwn(s,'elements')))throw Error('No atom inputs allowed')
 const physical=species.filter(s=>s.id!==electronId),halves=reactions.filter(r=>r.terms.some(t=>t.id===electronId&&t.coefficient)),ordinary=reactions.filter(r=>!halves.includes(r))
 // This prototype admits precisely the audited bounded integer source coefficients.
 if(reactions.some(r=>!Number.isSafeInteger(r.productCoefficient??1)||r.terms.some(t=>!Number.isSafeInteger(t.coefficient))))throw Error('Non-integer source requires a separate exactness audit')
 const vector=r=>physical.map(s=>Q.number(s.id===r.productId?(r.productCoefficient??1):0).sub(Q.number(r.terms.find(t=>t.id===s.id)?.coefficient??0)))
 const e=r=>Q.number(r.terms.find(t=>t.id===electronId).coefficient),anchor=halves[0];if(!anchor)throw Error('Missing electron reactions')
 const av=vector(anchor),rows=[...ordinary.map(vector),...halves.slice(1).map(r=>vector(r).map((v,i)=>v.div(e(r)).sub(av[i].div(e(anchor))))),physical.map(s=>s.id===waterId?one():zero())]
 const rr=reduced(rows),free=physical.map((_,i)=>i).filter(i=>!rr.pivots.includes(i)),nullRows=free.map(j=>physical.map((_,i)=>i===j?one():rr.pivots.includes(i)?rr.a[rr.pivots.indexOf(i)][j].neg():zero()))
 const charge=physical.map(s=>Q.number(s.charge)),chosen=[charge]
 if(rows.some(r=>sum(r.map((v,i)=>v.mul(charge[i]))).n))throw Error('Source charge not conserved exactly')
 for(const v of nullRows)if(rank([...chosen,v])>chosen.length)chosen.push(v)
 const columns=basisIds.filter(id=>id!==waterId).map(id=>physical.findIndex(s=>s.id===id))
 if(chosen.length!==free.length||free.length!==columns.length||rank(chosen.map(r=>columns.map(i=>r[i])))!==columns.length)throw Error('Incomplete physical conservation space')
 if(rows.some(r=>chosen.some(v=>sum(r.map((x,i)=>x.mul(v[i]))).n)))throw Error('Nonzero exact null residual')
 return {physicalIds:physical.map(s=>s.id),dimension:chosen.length,maxNullResidual:0,exact:chosen.map(weights=>({weights,basisWeights:basisIds.map(id=>weights[physical.findIndex(s=>s.id===id)])})),conservation:chosen.map((weights,i)=>({key:i?'source-coordinate-'+i:'charge',weights:weights.map(v=>v.number()),basisWeights:basisIds.map(id=>weights[physical.findIndex(s=>s.id===id)].number())}))}
}
export function projectExact(derived,amounts,basisIds,waterId,variant=0){
 let rows=derived.exact.map(r=>({...r,weights:[...r.weights],basisWeights:[...r.basisWeights]}))
 if(variant===1)rows.reverse()
 if(variant===2)rows=rows.map((r,i)=>i%2?{weights:r.weights.map(v=>v.neg()),basisWeights:r.basisWeights.map(v=>v.neg())}:r)
 if(variant===3)rows=rows.map((r,i)=>i?{weights:r.weights.map((v,j)=>v.add(rows[0].weights[j])),basisWeights:r.basisWeights.map((v,j)=>v.add(rows[0].basisWeights[j]))}:r)
 const supplied=derived.physicalIds.map(id=>Q.number(amounts[id]??0)),totals=rows.map(r=>sum(r.weights.map((v,i)=>v.mul(supplied[i])))),columns=basisIds.flatMap((id,i)=>id===waterId?[]:[i])
 const rr=reduced(rows.map((r,i)=>[...columns.map(j=>r.basisWeights[j]),totals[i]]));if(rr.pivots.length!==columns.length)throw Error('Exact inventory projection rank failure')
 return basisIds.map((id,i)=>id===waterId?zero():rr.a[columns.indexOf(i)].at(-1))
}
export const projectInventory=(...args)=>projectExact(...args).map(v=>v.number())

export function sourcePhysicalBasis(species,reactions,selected){
 const priority=s=>s.role==='electron'?0:s.role==='water'?5:s.role==='proton'?4:selected.includes(s.id)?3:2
 const order=[...species].sort((a,b)=>priority(a)-priority(b)||a.id.localeCompare(b.id))
 const rows=reactions.map(r=>order.map(s=>Q.number((r.productId===s.id?(r.productCoefficient??1):0)-(r.terms.find(t=>t.id===s.id)?.coefficient??0))))
 const pivots=reduced(rows).pivots;return order.filter((_,i)=>!pivots.includes(i)).map(s=>s.id)
}

export const sourceConservationVersion='source-conservation-exact-v1'
export function compileSourceConservation(network,reviewed){
 const {sourceSpecies:species,halves,ordinaryReactions,basisIds,electronId,water}=network
 const d=deriveConservation({species:species.map(({id,role,charge})=>({id,role,charge})).sort((a,b)=>a.id.localeCompare(b.id)),reactions:[...halves,...ordinaryReactions].sort((a,b)=>a.id.localeCompare(b.id)),basisIds,electronId,waterId:water?.id})
 if(reviewed){const rows=reviewed.map(r=>d.physicalIds.map(id=>Q.number(id===water?.id?0:r.weights[network.physical.findIndex(s=>s.id===id)])));if(rank(rows)!==d.dimension||rank([...rows,...d.exact.map(r=>r.weights)])!==d.dimension)throw Error('Reviewed/source conserved subspaces disagree')}
 return {...JSON.parse(JSON.stringify(d)),version:sourceConservationVersion,reviewedSpan:reviewed?'matched':'unavailable',provenance:{sourceFingerprint:network.sourceFingerprint??null,phaseScope:{kind:'aqueous',admittedSolids:[]},algorithm:sourceConservationVersion,coefficientRepresentation:'safe-integer-source/exact-rational-v1',componentIds:species.map(s=>s.id).sort(),reactionIds:[...halves,...ordinaryReactions].map(r=>r.id).sort(),solvent:water?.id??null}}
}
export function projectSourceInventory(d,amounts,basisIds,waterId){
 const q=s=>{const [n,k]=s.split('/');return new Q(BigInt(n),BigInt(k))}
 return projectInventory({...d,exact:d.exact.map(r=>({weights:r.weights.map(q),basisWeights:r.basisWeights.map(q)}))},amounts,basisIds,waterId)
}
