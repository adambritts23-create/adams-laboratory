import { chemicalLabel } from '../chemistry/format.js'
export default function ComponentSelector({ components, selected, discoveryElements = [], onToggle, physical = false }) {
  if (!components.length) return null
  return <section className="component-panel" aria-labelledby="components-title">
    <h2 id="components-title">Component forms</h2>
    <small className="muted">From the selected elements and solvent</small>
    <div className="component-options">{components.map(c => <label className={`species-row component-form ${selected.includes(c.id)?'is-selected':''}`} key={c.id}>
      <input type="checkbox" checked={selected.includes(c.id)} disabled={c.role === 'solvent'||(c.role==='basis-choice'&&c.associations.some(a=>!discoveryElements.includes(a.element)))} onChange={() => onToggle(c.id)} />
      <span className="component-form-name" title={c.role==='electron'?'Electron activity / redox condition · special pseudo-component':`${c.name} — ${c.associations.map(a=>a.description).filter(Boolean).join('; ')} · ${c.role}`}>{chemicalLabel(c.name)}{c.provenance?.kind==='user-defined'&&<b className="user-badge"> · USER-DEFINED · UNVERIFIED</b>}<small>{c.role==='electron'?'electron activity / redox condition':c.associations.map(a => `${a.element}: ${a.description || '(no description)'}`).join('; ')}</small></span>
      {c.role==='basis-choice'&&c.associations.some(a=>!discoveryElements.includes(a.element))&&<small>Focus {c.associations.filter(a=>!discoveryElements.includes(a.element)).map(a=>a.element).join(', ')} to expose this multi-element form.</small>}
    </label>)}</div>
    {!physical&&<details><summary>About component forms</summary><p>H₂O is the solvent; H+ controls acid/base activity. e− enables supported pe/Eh coordinates. General redox closure is unavailable.</p></details>}
  </section>
}
