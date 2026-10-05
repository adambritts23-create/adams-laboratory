import { surfaceResponses, selectSurfaceResponse } from '../calculations/surfaceResponses.js'
import { chemicalLabel } from '../chemistry/format.js'

export default function SurfaceResponseControls({ session, repository, onView }) {
  const plot = session.visualizationState.plot ?? {}
  const choices = surfaceResponses(session.chemicalSystem, session.calculationDefinition, repository)
  const type = plot.type ?? 'log-concentration', choice = choices.find(c => c.type === type)
  const key = choice?.target === 'component' ? 'componentId' : 'gridSeriesId'
  const target = choice?.targets.find(t => t.id === plot[key])
  return <>
    <label>Z response<select aria-label="Z response" value={choice ? type : ''} onChange={e => {
      const next = choices.find(c => c.type === e.target.value)
      if (next) onView(selectSurfaceResponse(next, plot))
    }}>
      {!choices.some(c=>c.type==='saturated-log-solubility')&&<small>Log solubility unavailable: no eligible dissolved component with a compatible solid in this admitted scope.</small>}
    {!choice && <option value="">Advanced output · see Advanced Z response</option>}
      {[...new Set(choices.map(c => c.group))].map(group => <optgroup key={group} label={group}>
        {choices.filter(c => c.group === group).map(c => <option key={c.type} value={c.type}>{c.label}</option>)}
      </optgroup>)}
    </select></label>
    {choice?.target && <label>{choice.target === 'component' ? 'Component' : choice.target === 'solid' ? 'Solid' : 'Species'}
      <select aria-label={`Z ${choice.target}`} value={target?.id ?? ''} onChange={e => onView({ [key]: e.target.value, colorRange: null, surfaceZRange: null })}>
        <option value="">{plot[key] && !target ? 'Previous selection unavailable · choose again' : `Choose ${choice.target}`}</option>
        {choice.targets.map(t => <option key={t.id} value={t.id}>{t.free ? 'Free ' : ''}{chemicalLabel(t.name)}{t.phase === 'aqueous' ? ' (aq)' : ''}</option>)}
      </select>
    </label>}
    {type === 'saturated-log-solubility' && choice && <small>Log₁₀ total dissolved selected component (mol/kg H₂O), using the same saturation-qualified output as 1D Log solubility. It is not solid amount or Ksp. Unsaturated or failed samples remain gaps.</small>}
    {type === 'solid-amount' && choice && <small>Accepted solid amount per kg water; not aqueous concentration.</small>}
    {!choice && <small>This output is outside the ordinary response families for these conditions. Review Advanced Z response or choose a response above.</small>}
  </>
}
