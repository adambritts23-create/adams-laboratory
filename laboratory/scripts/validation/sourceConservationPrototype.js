// Isolated mathematical experiment; not a production admission path.
export function rref(rows){
 const a=rows.map(r=>[...r]),pivots=[];let k=0
 if(!a.length)return {a,pivots}
 const limit=128*Number.EPSILON*Math.max(1,...a.flat().map(Math.abs))
 for(let c=0;c<a[0].length&&k<a.length;c++){
  let p=k;for(let j=k+1;j<a.length;j++)if(Math.abs(a[j][c])>Math.abs(a[p][c]))p=j
  if(Math.abs(a[p][c])<=limit)continue
  ;[a[k],a[p]]=[a[p],a[k]];const d=a[k][c];a[k]=a[k].map(v=>v/d)
  for(let j=0;j<a.length;j++)if(j!==k){const d=a[j][c];a[j]=a[j].map((v,i)=>v-d*a[k][i])}
  pivots.push(c);k++
 }
 return {a,pivots}
}
export const rank=rows=>rref(rows).pivots.length
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0)
export function deriveConservation({species,reactions,electronId,waterId,basisIds}){
 // Species contain only source identity, role and charge. No element attributes.
 if(species.some(s=>Object.hasOwn(s,'elements')))throw Error('Atom vectors must be withheld from source conservation')
 const physical=species.filter(s=>s.id!==electronId),halves=reactions.filter(r=>r.terms.some(t=>t.id===electronId&&t.coefficient)),ordinary=reactions.filter(r=>!halves.includes(r))
 const vector=r=>physical.map(s=>(s.id===r.productId?(r.productCoefficient??1):0)-(r.terms.find(t=>t.id===s.id)?.coefficient??0))
 const e=r=>r.terms.find(t=>t.id===electronId).coefficient,anchor=halves[0]
 if(!anchor)throw Error('No connected electron reaction')
 const rows=[...ordinary.map(vector),...halves.slice(1).map(r=>vector(r).map((v,i)=>v/e(r)-vector(anchor)[i]/e(anchor)))]
 rows.push(physical.map(s=>s.id===waterId?1:0))
 const rr=rref(rows),free=physical.map((_,i)=>i).filter(i=>!rr.pivots.includes(i)),nullRows=free.map(j=>physical.map((_,i)=>i===j?1:rr.pivots.includes(i)?-rr.a[rr.pivots.indexOf(i)][j]:0))
 const charge=physical.map(s=>s.charge),chosen=[charge]
 if(rows.some(r=>Math.abs(dot(r,charge))>128*Number.EPSILON*Math.max(1,r.reduce((n,v,i)=>n+Math.abs(v*charge[i]),0))))throw Error('Source network does not conserve authoritative charge')
 for(const v of nullRows)if(rank([...chosen,v])>chosen.length)chosen.push(v)
 const closedBasis=basisIds.filter(id=>id!==waterId),indices=closedBasis.map(id=>physical.findIndex(s=>s.id===id))
 if(chosen.length!==free.length||free.length!==closedBasis.length||rank(chosen.map(r=>indices.map(i=>r[i])))!==closedBasis.length)throw Error('Source conserved space incomplete on physical basis')
 const conservation=chosen.map((weights,i)=>({key:i===0?'charge':'source-coordinate-'+i,weights,basisWeights:basisIds.map(id=>weights[physical.findIndex(s=>s.id===id)])}))
 return {physicalIds:physical.map(s=>s.id),conservation,reactionRank:rr.pivots.length-1,dimension:free.length,maxNullResidual:Math.max(...rows.flatMap(r=>chosen.map(v=>Math.abs(dot(r,v)))))}
}
export function projectInventory(derived,amounts,basisIds,waterId,variant=0){
 let rows=derived.conservation.map(r=>({...r,weights:[...r.weights],basisWeights:[...r.basisWeights]}))
 if(variant===1)rows.reverse()
 if(variant===2)rows=rows.map((r,i)=>({...r,weights:r.weights.map(v=>v*(i%2?-1:1)),basisWeights:r.basisWeights.map(v=>v*(i%2?-1:1))}))
 if(variant===3)rows=rows.map((r,i)=>i===0?r:{...r,weights:r.weights.map((v,j)=>v+rows[0].weights[j]),basisWeights:r.basisWeights.map((v,j)=>v+rows[0].basisWeights[j])})
 const columns=basisIds.flatMap((id,i)=>id===waterId?[]:[i]),totals=rows.map(r=>dot(r.weights,derived.physicalIds.map(id=>amounts[id]??0)))
 const matrix=rows.map((r,i)=>[...columns.map(j=>r.basisWeights[j]),totals[i]]),reduced=rref(matrix)
 if(reduced.pivots.length!==columns.length)throw Error('Inventory projection rank failure')
 return basisIds.map((id,i)=>id===waterId?0:reduced.a[columns.indexOf(i)].at(-1))
}
