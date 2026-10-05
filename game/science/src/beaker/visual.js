/** Qualitative drawing only, never physical volume or precipitation logic. */
export function precipitateVisual(solids,context=null) {
  const inventory = solids.reduce((sum, s) => sum + s.amount, 0)
  const visible=solids.filter(s=>{
    if(!(s.amount>0))return false
    if(!context)return s.amount>1e-12
    const {system,input,result}=context,product=system.products.find(p=>p.id===s.id)
    if(!product)return false
    const controlled=system.components.flatMap((c,i)=>c.role==='ordinary'&&product.coefficients[i]>0&&input.constraints[i].kh===1?[{amount:s.amount*product.coefficients[i],total:input.constraints[i].value,tolerance:result.residuals.componentBalanceLimits[i]}]:[])
    return controlled.length?controlled.some(c=>c.amount>Math.max(c.tolerance,c.total*1e-6)):s.amount>1e-12
  })
  const visibleInventory=visible.reduce((sum,s)=>sum+s.amount,0)
  return { inventory,visibleInventory,visibleSolidIds:visible.map(s=>s.id),hiddenSolidIds:solids.filter(s=>!visible.includes(s)).map(s=>s.id),bedHeight: visibleInventory > 0 ? 2 + 54 * visibleInventory / (visibleInventory + 0.005) : 0,
    mapping: 'Display only: a solid needs more than 0.0001% (one millionth) of at least one supplied analytical component total and more than its existing balance tolerance. Without a supplied total, the display floor is 1e-12 mol/kg H₂O solid. Exact accepted amounts remain in inspection. Bed height = 2 + 54 S/(S + 0.005) for visible solid inventory S; otherwise zero. The shared vessel renderer additionally caps this at 24% of displayed liquid depth so a shallow fill is not visually overwhelmed. Height is illustrative; Calculation liquid level is fixed. These are schematic, not thermodynamic data or calibrated volume.' }
}
