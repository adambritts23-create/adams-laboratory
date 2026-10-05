import { useEffect, useId, useRef, useState } from 'react'

const adamArtwork = {
  thumbnail: 'artwork/adam-workspace.png', image: 'artwork/adam-workspace.png',
  title: 'Adam’s Laboratory artwork', alt: 'Adam at a desk with multiple monitors showing laboratory-themed displays',
  caption: 'Image supplied by Adam. Depicted laboratory content is not scientific data.',
}

// Media state is local and independent of the mounted scientific workspace.
export default function AdamMedia({ media = adamArtwork, baseUrl = import.meta.env.BASE_URL }) {
  const [open, setOpen] = useState(false), [failed, setFailed] = useState(false)
  const dialog = useRef(null), trigger = useRef(null)
  useEffect(() => {
    if (!open) return
    const host = dialog.current, button = trigger.current
    host.showModal()
    return () => { host.close(); button?.focus() }
  }, [open])
  const titleId = useId()
  const available = !failed && !!media?.image
  return <>
    <button className={`adam-media-trigger ${media?.portrait ? 'portrait' : ''}`} ref={trigger} type="button" aria-label={media?.controlLabel ?? (media?.portrait ? 'Open Adam portrait' : 'Open Adam artwork')} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} title={media?.controlLabel ?? (media?.portrait ? 'Open Adam portrait' : 'Open Adam artwork')}>
      {available ? <img src={`${baseUrl}${media.thumbnail ?? media.image}`} alt="" onError={() => setFailed(true)}/> : <span aria-hidden="true">A</span>}
      <span className="adam-expand-mark" aria-hidden="true">↗</span>
    </button>
    <dialog className="adam-media-dialog" ref={dialog} aria-labelledby={titleId} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => { if (event.target === dialog.current) { const r = dialog.current.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) setOpen(false) } }}>
      <div className="adam-media-heading"><h2 id={titleId}>{media?.title ?? 'Adam’s Laboratory'}</h2><button type="button" autoFocus onClick={() => setOpen(false)}>Close artwork</button></div>
      {open && (available ? <img className="adam-expanded-image" src={`${baseUrl}${media.image}`} alt={media.alt ?? 'Adam artwork'} onError={() => setFailed(true)}/> : <p role="status">Artwork unavailable. Adam’s Laboratory is ready to use.</p>)}
      {media?.caption && <p>{media.caption}</p>}
    </dialog>
  </>
}
