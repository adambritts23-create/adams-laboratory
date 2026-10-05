import { useState } from 'react'

export default function UserComponents({ records, context, onChange }) {
  const [editing, setEditing] = useState(null), [name, setName] = useState(''), [symbols, setSymbols] = useState('')
  const [citation, setCitation] = useState(''), [notes, setNotes] = useState(''), [message, setMessage] = useState('')
  const attempt = fn => { try { fn(); setMessage('Source structure accepted · USER-DEFINED · UNVERIFIED. Select the component form separately to include it.') } catch (error) { setMessage(error.message) } }
  const open = (r, duplicate = false) => { setEditing(duplicate ? null : r); setName(duplicate ? '' : r.name); setSymbols(r.associations.map(a => a.element).join(' ')); setCitation(r.citation ?? ''); setNotes(r.notes ?? '') }
  const save = () => attempt(() => {
    const now = new Date().toISOString()
    const raw = { schemaVersion: 1, id: editing?.id ?? `user-component:${crypto.randomUUID()}`, name,
      associations: symbols.trim().split(/[\s,]+/).map(element => ({ element, description: editing?.associations.find(a => a.element === element)?.description ?? 'User-entered discovery association; not elemental stoichiometry' })),
      sourceType: 'user-defined', citation: citation || null, notes: notes || null, createdAt: editing?.createdAt ?? now, modifiedAt: now }
    onChange(editing ? records.map(r => r.id === editing.id ? raw : r) : [...records, raw])
    setEditing(null); setName(''); setSymbols(''); setCitation(''); setNotes('')
  })
  return <section className="card"><h2>Custom components</h2><p>USER-DEFINED · UNVERIFIED. Ordinary aqueous basis identities only. Element links aid discovery; they do not define composition, charge, oxidation state or a thermodynamic reaction. Direct basis preparation remains required.</p>
    <label>Component identity<input value={name} onChange={e => setName(e.target.value)} /></label>
    <label>Associated elements (symbols separated by spaces)<input value={symbols} onChange={e => setSymbols(e.target.value)} /></label>
    <button className="secondary" disabled={!context.length} onClick={() => setSymbols(context.join(' '))}>Use focused elements as associations</button>
    <label>Component reference<input value={citation} onChange={e => setCitation(e.target.value)} /></label>
    <label>Component notes<textarea value={notes} onChange={e => setNotes(e.target.value)} /></label>
    <button onClick={save}>{editing ? 'Save component edit' : 'Add custom component'}</button><p role="status">{message}</p>
    <ul>{records.map(r => <li key={r.id}><strong>{r.name}</strong> · USER-DEFINED · UNVERIFIED
      <button onClick={() => open(r)}>Edit {r.name}</button><button onClick={() => open(r, true)}>Duplicate {r.name}</button>
      <button onClick={() => attempt(() => { onChange(records.filter(p => p.id !== r.id)); if (editing?.id === r.id) setEditing(null) })}>Remove {r.name}</button>
      <details><summary>Inspect {r.name}</summary><pre>{JSON.stringify(r, null, 2)}</pre></details>
    </li>)}</ul>
  </section>
}
