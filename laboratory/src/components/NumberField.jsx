export default function NumberField({ label, value, onChange, ...attributes }) {
  return <label>{label}<input type="number" step="any" value={value ?? ''} onChange={event => onChange(event.target.value === '' ? null : Number(event.target.value))} {...attributes} /></label>
}
