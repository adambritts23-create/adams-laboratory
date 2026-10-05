import { useState } from 'react'
import UserComponents from './UserComponents.jsx'
import UserEquilibria from './UserEquilibria.jsx'
import { exportUserChemistry, importUserChemistry } from '../thermodynamics/userComponents.js'

export default function UserChemistry({ base, data, context, onChange }) {
  const [tab, setTab] = useState('components'), [json, setJson] = useState(''), [message, setMessage] = useState('')
  const attempt = fn => { try { fn(); setMessage('Source-only collection processed. USER-DEFINED · UNVERIFIED.') } catch (error) { setMessage(error.message) } }
  return <section className="custom-chemistry" aria-label="Custom chemistry editor">
    <p>Focused context: {context.join(' · ') || 'None'}. No chemical definition is inferred.</p>
    <div className="custom-tabs"><button aria-pressed={tab === 'components'} onClick={() => setTab('components')}>Custom components</button><button aria-pressed={tab === 'species'} onClick={() => setTab('species')}>Custom species / reaction</button></div>
    {tab === 'components' ? <UserComponents records={data.components} context={context} onChange={components => onChange(components, data.records)} /> :
      <UserEquilibria base={data.componentRepository} records={data.records} components={data.componentRepository.getComponents()} onChange={records => onChange(data.components, records)} />}
    <details><summary>Custom chemistry collection · import / export</summary><p>Versioned source-only JSON preserves custom components and reactions. Imported database records and calculated results are excluded. Import replaces this custom collection only; collisions and missing dependencies are rejected. Changing the database clears this collection: export your work first.</p>
      <label>Custom chemistry JSON<textarea rows="8" value={json} onChange={e => setJson(e.target.value)} /></label>
      <button onClick={() => attempt(() => setJson(exportUserChemistry(base, data.components, data.records)))}>Export custom collection</button>
      <button onClick={() => attempt(() => { const value = importUserChemistry(json, base); onChange(value.components, value.records) })}>Import custom collection</button>
      <p role="status">{message}</p>
    </details>
  </section>
}
