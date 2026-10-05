import { amountUnits, convertAmount } from '../calculations/units.js'
export default function AmountUnitSelect({ label='Concentration unit', unit='mol/kg-H2O', compact=false }) {
  return <label className="unit-choice">{compact?<span className="sr-only">{label}</span>:label}<select value={unit} onChange={()=>{}} title="Molarity conversion requires supported solution density and composition information.">
    {['mol/kg-H2O','M','mM','µM','nM'].map(id=><option key={id} value={id} disabled={!convertAmount(1,unit,id).ok}>{amountUnits[id].label}{!convertAmount(1,unit,id).ok?' — conversion unavailable':''}</option>)}
  </select>{!compact&&<small title="Molarity needs validated density/composition data. Mol/kg H₂O is not M.">Molarity conversion unavailable</small>}</label>
}
