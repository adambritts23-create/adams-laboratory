import { solubilityPairs } from '../calculations/independentSolubility.js'

export default function IndependentSolubilitySetup({ config, conditions, onChange, allowedPairIds=solubilityPairs.map(p=>p.id) }) {
  return <section aria-label="Independent solubility setup">
    <p>Independent metal–H–O solutions on one pH axis. Each includes all compatible aqueous species and its own pure solid; the metals are not mixed.</p>
    <div className="compact-conditions">{solubilityPairs.filter(p=>allowedPairIds.includes(p.id)).map(pair => {
      const selected = config.pairs.find(p => p.id === pair.id)
      return <fieldset key={pair.id}><label className="inline-check"><input type="checkbox" checked={!!selected} onChange={() => onChange({ ...config, pairs: selected ? config.pairs.filter(p => p.id !== pair.id) : [...config.pairs, { id: pair.id, total: 0.001 }] })}/>{pair.label}</label>
        {selected && <label>{pair.element} total (mol/kg H₂O)<input type="number" step="any" value={selected.total ?? ''} onChange={e => onChange({ ...config, pairs: config.pairs.map(p => p.id === pair.id ? { ...p, total: e.target.value === '' ? null : Number(e.target.value) } : p) })}/></label>}</fieldset>
    })}</div>
    <div className="axis-range">{[['min', 'pH minimum'], ['max', 'pH maximum'], ['points', 'pH samples']].map(([key, label]) => <label key={key}>{label}<input type="number" step={key === 'points' ? 1 : 'any'} value={config[key] ?? ''} onChange={e => onChange({ ...config, [key]: e.target.value === '' ? null : Number(e.target.value) })}/></label>)}</div>
    <p>{conditions.temperature.value} °C · {conditions.pressure.value} bar (declared) · {conditions.activityModel} · ionic strength: {conditions.ionicStrength.mode}</p>
    <small>Y: log₁₀(total dissolved component molality). Unsaturated and failed samples remain unavailable. Existing temperature, pressure and activity assumptions apply.</small>
  </section>
}
