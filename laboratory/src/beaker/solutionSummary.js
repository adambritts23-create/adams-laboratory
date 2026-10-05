/** Display projection of accepted dissolved contributions; never a new solve. */
export function solutionSummary(state) {
  if (!state?.ok) return []
  return state.components.map(c => {
    const rows=c.contributors
    const total=c.totalDissolved
    const unavailable={id:c.id,name:c.name,ok:false}
    if (!(total>0) || !Number.isFinite(total) || !rows.length || rows.some(r=>!Number.isFinite(r.weightedMolality)||r.weightedMolality<0)) return unavailable
    const sum=rows.reduce((s,r)=>s+r.weightedMolality,0)
    if (Math.abs(sum-total)>1e-30+1e-10*Math.max(sum,total)) return unavailable
    const leader=[...rows].sort((a,b)=>b.weightedMolality-a.weightedMolality||a.id.localeCompare(b.id))[0]
    return {id:c.id,name:c.name,ok:true,leader,leaderFraction:leader.weightedMolality/total,
      otherFraction:rows.filter(r=>r.id!==leader.id).reduce((s,r)=>s+r.weightedMolality,0)/total}
  })
}
