import { chemicalLabel } from '../chemistry/format.js'
/** Output identity can be chosen before a first map exists. Membership is never changed. */
export default function MapOutput({ session, repository, onView }) {
  const plot = session.visualizationState.plot ?? {}, type = plot.type ?? 'log-concentration'
  if (!['concentration', 'solid-amount', 'log-concentration', 'log-activity', 'fraction'].includes(type)) return null
  const rows = [
    ...session.chemicalSystem.selectedComponents.map(id => repository.getComponentById(id)).filter(c => c && type !== 'solid-amount' && !['solvent', 'electron'].includes(c.role)).map(c => ({ id: c.id, group: 'Free components', name: `Free ${chemicalLabel(c.name)}` })),
    ...session.chemicalSystem.selectedSpecies.map(id => repository.getSpeciesById(id)).filter(s=>s&&(type!=='solid-amount'||s.phase==='solid')&&(type!=='concentration'||s.phase==='aqueous')).map(s => ({ id: s.id, group: s.phase, name: `${chemicalLabel(s.name)}${s.provenance.kind === 'user-defined' ? ' · unverified' : ''}` })),
  ]
  return <label>F species · free or individual<select aria-label="F species" value={plot.gridSeriesId ?? ''} onChange={e => onView({ gridSeriesId: e.target.value })}><option value="">Choose output species</option>{[...new Set(rows.map(r=>r.group))].map(group=><optgroup key={group} label={group}>{rows.filter(r=>r.group===group).map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</optgroup>)}</select></label>
}
