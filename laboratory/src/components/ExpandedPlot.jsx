import { useEffect, useRef, useState } from 'react'

/** Keep the same mounted plot and scientific snapshot; only its layout changes. */
export default function ExpandedPlot({ children, available }) {
  const [expanded, setExpanded] = useState(false), host = useRef(null), toggle = useRef(null)
  useEffect(() => {
    if (!expanded) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    toggle.current?.focus()
    const key = event => {
      if (event.key === 'Escape') { event.preventDefault(); setExpanded(false) }
      if (event.key === 'Tab') {
        const items = [...host.current.querySelectorAll('button, input, select, textarea, summary, a[href], [tabindex="0"]')].filter(e => !e.disabled && e.getClientRects().length)
        const first = items[0], last = items.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', key); toggle.current?.focus() }
  }, [expanded])
  return <div ref={host} className={expanded ? 'plot-inspection-frame expanded-plot' : 'plot-inspection-frame'} role={expanded ? 'dialog' : undefined} aria-modal={expanded || undefined} aria-label={expanded ? 'Expanded scientific plot' : undefined}>
    {available && <div className="expand-toolbar"><button ref={toggle} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Exit expanded view' : 'Expand plot'}</button>{expanded && <span>Esc to exit · same calculated data</span>}</div>}
    {children}
  </div>
}
