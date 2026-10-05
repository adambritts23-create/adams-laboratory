// Presentation of existing scientific decisions, never a support or chemistry gate.
export function pourbaixReadiness(prepared) {
  if (!prepared) return {label:'Checking redox system…', detail:'Preparing the selected source chemistry.'}
  if (prepared.ok) return {label:'READY TO CALCULATE', detail:prepared.readiness}
  const d=prepared.discovery
  if (d?.canonicalEstablished && !d.inventoryComplete && d.unresolvedCarriers?.length) return {
    label:'CHEMISTRY CONSTRUCTIBLE · METADATA PENDING',
    detail:'The equilibrium system can be constructed with its acid-base and carrier chemistry. Oxidation-state predominance is unavailable until authoritative allocation metadata and its support scope are reviewed.',
  }
  return {label:'UNSUPPORTED', detail:prepared.reason}
}
export function pourbaixScientificLabel(status) {
  return status==='reference-validated'?'REFERENCE VALIDATED':status==='calculated-internally-verified'?'CALCULATED / INTERNALLY VERIFIED':'UNSUPPORTED'
}
// Mixed-valence allocations can contain multiple entries for the same carrier.
// Sum those component contributions before displaying its fraction of total.
export function pourbaixCarrierDetails(point) {
  const carriers=new Map()
  for (const c of point.carriers) {
    const row=carriers.get(c.id)??{id:c.id,name:c.name,phase:c.phase,componentAmount:0}
    row.componentAmount+=c.componentAmount
    carriers.set(c.id,row)
  }
  const all=[...carriers.values()].map(c=>({...c,fraction:c.componentAmount/point.totalInventory})).sort((a,b)=>b.componentAmount-a.componentAmount||a.id.localeCompare(b.id))
  return {all,dominant:point.dominantThermodynamicCarriers.map(c=>all.find(row=>row.id===c.id)),dissolvedFraction:point.dissolvedInventory/point.totalInventory}
}
