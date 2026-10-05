import ComponentSearch from './ComponentSearch.jsx'
import { chemicalLabel } from '../chemistry/format.js'
export default function SelectedSystem({ system, repository, onRemove, reactionSet, onReview }) {
  const components = system.selectedComponents.map(id => repository.getComponentById(id)).filter(Boolean)
  const solids = reactionSet?.rows.filter(r => r.compatible && r.species.phase === 'solid') ?? []
  const item = (record, type) => <button key={record.id} className="tray-item" title={`Remove ${record.name} from selection`} onClick={() => onRemove({ type, id: record.id })}>{chemicalLabel(record.name)}{record.provenance?.kind === 'user-defined' ? ' · USER-DEFINED' : ''} ×</button>
  return <section className="selected-tray" aria-label="Selected system"><h2>Selected system</h2>
    <div><strong>Element discovery</strong>{system.selectedElements.map(symbol => <button key={symbol} onClick={() => onRemove({ type: 'toggleElement', symbol })}>{symbol} ×</button>)}{!system.selectedElements.length && <small>None</small>}</div>
    <div><strong>Ordinary component basis</strong>{components.filter(c => c.role === 'basis-choice').map(c => item(c, 'toggleComponent'))}</div>
    <div><strong>Special components</strong>{components.filter(c => ['proton', 'electron'].includes(c.role)).map(c => item(c, 'toggleComponent'))}</div>
    <div><strong>Solvent</strong><span>H₂O · fixed solvent identity</span></div>
    {reactionSet ? <div><strong>Automatic reaction set</strong><span>{reactionSet.aqueousCount} aqueous · {reactionSet.solidCount} considered solids · {reactionSet.excludedCount} aqueous reactions excluded · {reactionSet.gasCount} compatible gases unsupported</span><button onClick={onReview}>Review reaction set</button>{reactionSet.rows.filter(r => r.included && r.acidBase).map(r => <small key={r.species.id}>{chemicalLabel(r.species.name)} · automatic proton/solvent equilibrium</small>)}</div> : <div><strong>Product species ({system.selectedSpecies.length})</strong>{system.selectedSpecies.map(id => repository.getSpeciesById(id)).filter(Boolean).map(s => item(s, 'toggleSpecies'))}</div>}
    {reactionSet && <details><summary>{reactionSet.automaticSolids ? 'Phases considered automatically' : 'Phases considered · explicit selections'} · {reactionSet.solidCount} solids</summary>
      <p>{reactionSet.automaticSolids ? 'Compatible supported solids participate unless you exclude them. Equilibrium determines which are present.' : 'This configuration retains explicit phase choices.'}</p>
      {!solids.length && <p>No compatible solid phases in the current database.</p>}
      {solids.map(r => <label className="inline-check" key={r.species.id}><input type="checkbox" aria-label={`Consider solid ${r.species.name}`} checked={r.included} disabled={!r.eligible} onChange={() => onRemove({ type: 'toggleSpecies', id: r.species.id })}/>{chemicalLabel(r.species.name)} · {r.status}</label>)}
    </details>}
    <ComponentSearch repository={repository} selectedIds={system.selectedComponents}/>
  </section>
}
