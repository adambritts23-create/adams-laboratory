import { diagramTypes, diagramUnavailable } from '../calculations/diagramSetup.js'
import {outputDefinitions} from '../calculations/outputs.js'
import {outputGroups} from '../calculations/outputDescriptors.js'
import { diagramIdentity } from '../plots/diagramIdentity.js'

const quickDiagrams = [
  { id: 'log-concentration', label: 'Log concentrations' },
  { id: 'total-fraction', label: 'Total fractions' },
  { id: 'aqueous-fraction', label: 'Aqueous speciation' },
  { id: 'saturated-log-solubility', label: 'Log solubility' },
  { id: 'predominance', label: 'Predominance area' },
]

export default function DiagramSwitcher({ selected, definition, components, reactionSet, busy, onSelect, onOutput, outputType }) {
  const remaining = diagramTypes.filter(item => !quickDiagrams.some(q => q.id === item.id))
  const reason = id => diagramUnavailable(id, definition, components, reactionSet?.solidCount ?? 0, reactionSet?.automaticSolids, reactionSet?.pourbaixReason)
  const button = item => <button key={item.id} type="button" data-diagram={diagramIdentity(item.id)} aria-pressed={selected === item.id}
    disabled={busy || !!reason(item.id)} title={reason(item.id) ?? item.label} onClick={() => onSelect(item.id)}>
    {item.label}{reason(item.id) && <small>{reason(item.id) === 'Validation pending' ? 'Validation pending' : 'Unavailable'}</small>}
  </button>
  return <nav className="diagram-switcher" aria-label="Quick diagram views">
    <label className="diagram-type-select">Diagram type<select aria-label="Diagram type" value={selected} disabled={busy} onChange={e=>onSelect(e.target.value)}>{diagramTypes.filter(d=>!d.pending).map(d=><option key={d.id} value={d.id} disabled={!!reason(d.id)}>{d.label}</option>)}{selected==='advanced'&&<option value="advanced">{outputDefinitions[outputType]?.label}</option>}</select></label><details className="diagram-shortcuts"><summary>More views and availability</summary><div className="diagram-segments">{quickDiagrams.map(button)}<details className="diagram-more"><summary>More <span aria-hidden="true">▾</span>{remaining.some(x => x.id === selected) && <span className="more-current"> · {remaining.find(x => x.id === selected).label}</span>}{selected==='advanced'&&<span> · {outputDefinitions[outputType]?.label}</span>}</summary>
      <div className="diagram-more-options">{remaining.map(button)}{onOutput&&!definition.closedReagents&&!definition.pourbaix&&!definition.imposedEh&&!definition.solubilityComparison&&<><strong>Specialized views</strong>{[...new Set(Object.values(outputGroups).flat())].filter(id=>!diagramTypes.some(d=>d.id===id)).map(id=><button key={id} aria-pressed={outputType===id} disabled={busy||!!definition.mixedSolubility} onClick={()=>onOutput(id)}>{outputDefinitions[id].label}</button>)}</>}</div>
    </details></div></details>
  </nav>
}
