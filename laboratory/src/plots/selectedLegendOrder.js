// Display-only ordering. Stable carrier identities and the source color index stay intact.
export function selectedLegendOrder(rows,derived,index,currentRevision,state){
 if(currentRevision!==derived.metadata.revision)return rows
 const type=derived.metadata.output.type
 const score=id=>{
  const series=derived.series.find(s=>s.id===id),point=series?.points[index]
  if(point?.pointStatus!=='converged')return -Infinity
  if(['total-fraction','aqueous-fraction'].includes(type))return Number.isFinite(point.value)?point.value:-Infinity
  if(type==='log-concentration')return Number.isFinite(point.value)?point.value:-Infinity
  if(Number.isFinite(point.linearValue))return point.linearValue>0?Math.log10(point.linearValue):-Infinity
  if(state?.ok){const i=state.result.speciesIds.indexOf(id),amount=state.result.concentrations[i];return amount>0?Math.log10(amount):-Infinity}
  return -Infinity
 }
 return rows.map((row,i)=>({row,i,score:score(row.id)})).sort((a,b)=>a.score===b.score?a.i-b.i:b.score-a.score).map(r=>r.row)
}
