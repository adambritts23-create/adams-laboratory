import NumberField from './NumberField.jsx'
export default function RedoxControls({ system, enabled, setField }) {
  return <fieldset><legend>Redox control · future solver input</legend>
    {!enabled && <p className="hint">Select an electron component from the source component catalog to enable redox conditions. This capability is derived from ChemicalSystem, not element or species names.</p>}
    <div className="fields"><label>Redox mode<select disabled={!enabled} value={system.redoxMode} onChange={e => { setField('redoxMode', e.target.value); setField('redoxValue', null) }}>
      <option value="none">None specified</option><option value="fixedEh">Fixed Eh</option><option value="fixedPe">Fixed pe</option><option value="range">Range</option>
    </select></label>
    {['fixedEh', 'fixedPe'].includes(system.redoxMode) && <NumberField label={system.redoxMode === 'fixedEh' ? 'Eh (V vs SHE)' : 'pe (dimensionless)'} value={system.redoxValue} onChange={v => setField('redoxValue', v)} />}
    {system.redoxMode === 'range' && <>
      <label>Range quantity<select value={system.redoxRange.quantity} onChange={e => setField('redoxRange', { quantity: e.target.value, min: null, max: null })}><option value="pe">pe</option><option value="Eh">Eh (V vs SHE)</option></select></label>
      {['min', 'max'].map(key => <NumberField key={key} label={`${system.redoxRange.quantity} ${key}${system.redoxRange.quantity === 'Eh' ? ' (V vs SHE)' : ''}`} value={system.redoxRange[key]} onChange={v => setField('redoxRange', { ...system.redoxRange, [key]: v })} />)}
    </>}
    </div><p className="hint">No Eh/pe conversion, electron balance or redox equilibrium is implemented. Species oxidation filters do not impose a redox condition.</p>
  </fieldset>
}
