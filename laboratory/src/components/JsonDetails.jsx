import { useState } from 'react'
/** Avoid serializing thousands of full point results while diagnostics are collapsed. */
export default function JsonDetails({ title, value }) {
  const [open, setOpen] = useState(false)
  return <details open={open}><summary onClick={e => { e.preventDefault(); setOpen(!open) }}>{title}</summary>{open && <pre>{JSON.stringify(value, null, 2)}</pre>}</details>
}
