import { elementStates } from '../data/periodicTable.js'
export default function ElementSelector({components,selected,implicit,focused,onToggle,electron,electronSelected,onElectron}){
  return <section className="element-panel" aria-labelledby="elements-title">
    <div className="section-heading"><h2 id="elements-title">Elements</h2><small>Available · <span className="selected-key">Selected</span> · <span className="unavailable-key">No data</span></small></div>
    <div className="periodic-scroll"><div className="periodic-table" aria-label="Complete periodic table">
      {electron&&<button type="button" className={`element electron-tile ${electronSelected?'selected':'available'}`} style={{gridRow:1,gridColumn:4}} data-state={electronSelected?'selected':'available'} aria-label="e⁻ electron · special imposed redox condition" aria-pressed={!!electronSelected} title="Electron activity / redox condition · special pseudo-component; not an element or material total" onClick={()=>onElectron(electron.id)}><small>redox</small><strong>e⁻</strong></button>}
      <span className="series-placeholder" style={{gridRow:6,gridColumn:3}}>57–71</span><span className="series-placeholder" style={{gridRow:7,gridColumn:3}}>89–103</span>
      <span className="periodic-caption" style={{gridRow:9,gridColumn:'1 / 4'}}>Lanthanides</span><span className="periodic-caption" style={{gridRow:10,gridColumn:'1 / 4'}}>Actinides</span>
      {elementStates(components,selected,implicit).map(e=><button key={e.symbol} type="button" className={`element ${e.state}`} data-state={e.state} data-focused={focused===e.symbol} aria-pressed={e.state==='selected'}
        aria-label={`${e.name} (${e.symbol})${!e.available?' — no component data':e.implicit?' — included through solvent':''}`}
        title={!e.available?'No component data available for this element in the current database.':e.implicit?'Included through H₂O solvent':`${e.name} — source component data available`}
        style={{gridColumn:e.column,gridRow:e.row}} onClick={()=>onToggle(e.symbol)}><small>{e.atomicNumber}</small><strong>{e.symbol}</strong></button>)}
    </div></div><small className="muted">Availability reflects this database only. H/O are included through water.</small>
  </section>
}
