import { useState } from 'react'
import { exportUserEquilibria, importUserEquilibria, userReferenceState } from '../thermodynamics/userEquilibria.js'

export default function UserEquilibria({ base, records, components, onChange }) {
  const [product, setProduct] = useState(''), [display, setDisplay] = useState(''), [phase, setPhase] = useState('aqueous')
  const [logK, setLogK] = useState(''), [citation, setCitation] = useState(''), [terms, setTerms] = useState({})
  const [editing,setEditing]=useState(null),[notes,setNotes]=useState(''),[charge,setCharge]=useState(''),[pressure,setPressure]=useState('unknown')
  const [json, setJson] = useState(''), [message, setMessage] = useState('')
  const attempt = fn => { try { fn(); setMessage('Source structure accepted. USER-DEFINED · UNVERIFIED. Select the new species in the browser to include it.') } catch (error) { setMessage(error.message) } }
  const add = () => attempt(() => {
    const now = new Date().toISOString()
    const raw = { schemaVersion: 1, id: editing?.id ?? `user:${crypto.randomUUID()}`, productId: product, displayName: display || product,
      phase, charge: charge === '' ? null : Number(charge), logK: logK === '' ? null : Number(logK), temperatureK: 298.15, pressureBar: pressure === 'unknown' ? null : 1,
      referenceState: userReferenceState, sourceType: 'user-defined', citation: citation || null, notes: notes || null, createdAt: editing?.createdAt ?? now, modifiedAt: now,
      terms: components.filter(c => terms[c.id] !== undefined && terms[c.id] !== '').map(c => ({ componentId: c.id, coefficient: Number(terms[c.id]) })) }
    onChange(editing ? records.map(r=>r.id===editing.id?raw:r) : [...records, raw]); setEditing(null); setProduct(''); setDisplay(''); setLogK(''); setTerms({}); setNotes(''); setCitation(''); setCharge(''); setPressure('unknown')
  })
  const open=(record,duplicate=false)=>{setEditing(duplicate?null:record);setProduct(duplicate?'':record.productId);setDisplay(duplicate?'':record.displayName);setPhase(record.phase);setLogK(String(record.logK));setCitation(record.citation??'');setNotes(record.notes??'');setCharge(record.charge??'');setPressure(record.pressureBar===1?'1':'unknown');setTerms(Object.fromEntries(record.terms.map(t=>[t.componentId,String(t.coefficient)])))}
  return <section className="card"><h2>User-defined equilibria</h2>
    <p>USER-DEFINED · UNVERIFIED. Define one product from explicit signed repository-component terms. No formula, charge, stoichiometry or constant is inferred. Supported reference: ideal molal formation at 298.15 K. Creating a record does not select it for calculation.</p>
    <label>Product identity<input value={product} onChange={e => setProduct(e.target.value)} /></label>
    <label>Display name<input value={display} onChange={e => setDisplay(e.target.value)} /></label>
    <label>Product phase<select value={phase} onChange={e => setPhase(e.target.value)}><option>aqueous</option><option>solid</option></select></label>
    <label>Formation logK at 298.15 K<input type="number" step="any" value={logK} onChange={e => setLogK(e.target.value)} /></label>
    <label>Citation (optional)<input value={citation} onChange={e => setCitation(e.target.value)} /></label>
    <label>Charge (blank = unknown)<input type="number" step="1" value={charge} onChange={e=>setCharge(e.target.value)}/></label>
    <label>Reference pressure<select value={pressure} onChange={e=>setPressure(e.target.value)}><option value="unknown">Unknown</option><option value="1">1 bar (explicit declaration)</option></select></label>
    <label>Equilibrium notes<textarea value={notes} onChange={e=>setNotes(e.target.value)}/></label>
    <fieldset><legend>Explicit signed terms (blank means absent; select products separately)</legend><label>Add reaction term<select value="" onChange={e=>setTerms({...terms,[e.target.value]:''})}><option value="">Choose a repository component</option>{components.filter(c=>!(c.id in terms)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{components.filter(c=>c.id in terms).map(c => <label key={c.id}>Coefficient for {c.name}<input type="number" step="any" value={terms[c.id] ?? ''} onChange={e => setTerms({ ...terms, [c.id]: e.target.value })} /></label>)}</fieldset>
    <button onClick={add}>{editing?'Save equilibrium edit':'Validate and add equilibrium'}</button>
    <p role="status">{message}</p>
    <ul>{records.map(r => <li key={r.id}>{r.displayName} · user-defined, unverified · {r.citation ? 'user-attributed' : 'provenance incomplete'} <button onClick={()=>open(r)}>Edit {r.displayName}</button> <button onClick={()=>open(r,true)}>Duplicate {r.displayName}</button> <details><summary>Inspect {r.displayName}</summary><pre>{JSON.stringify(r,null,2)}</pre></details> <button onClick={() => attempt(() => {onChange(records.filter(p => p.id !== r.id));if(editing?.id===r.id)setEditing(null)})}>Remove {r.displayName}</button></li>)}</ul>
    <details><summary>Source-only JSON import/export</summary><p>Copy exported JSON to save it locally. Import replaces this user collection after validation; no calculated results are accepted. Changing databases resets this collection, so export first. Scientific values are retained exactly as supplied.</p>
      <label>User equilibrium JSON<textarea rows="12" value={json} onChange={e => setJson(e.target.value)} /></label>
      <button onClick={() => attempt(() => setJson(exportUserEquilibria(records, base)))}>Export user JSON</button>
      <button onClick={() => attempt(() => onChange(importUserEquilibria(json, base)))}>Import user JSON</button>
    </details>
  </section>
}
