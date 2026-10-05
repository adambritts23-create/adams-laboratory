import { useEffect, useMemo, useState } from 'react'

export default function ExportPanel({ artifact, onClose }) {
  const [message, setMessage] = useState('')
  const previewLimit = 12000, truncated = artifact.text.length > previewLimit
  const url = useMemo(() => URL.createObjectURL(new Blob([artifact.text], { type: artifact.type })), [artifact])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return <details className="export-panel" open><summary>Export ready · {artifact.filename}</summary>
    <p>Save the file, or copy its exact contents if downloads are unavailable in this browser. This export keeps the conditions and revision at the moment you requested it.</p>
    <a href={url} download={artifact.filename}>Save {artifact.filename}</a>{' '}
    <button onClick={async () => { try { await navigator.clipboard.writeText(artifact.text); setMessage('Copied exact export contents.') } catch { setMessage('Copy is unavailable. Use Save to download the complete file.') } }}>Copy export contents</button>
    <button onClick={onClose}>Close export</button>
    <label>{truncated ? 'Export preview (first 12,000 characters only)' : 'Export contents'}<textarea readOnly rows="6" value={artifact.text.slice(0, previewLimit)} /></label>{truncated && <p>Preview truncated for responsiveness. Save and Copy retain all {artifact.text.length.toLocaleString()} characters and every sampled cell.</p>}<p role="status">{message}</p>
  </details>
}
