/** Fixed data viewport. Shared exact-sample interactions; never mutates plot bounds. */
export default function usePlotGestures({sample,preview,pin,count,pinned}) {
  const select = index => {
    if (!Number.isInteger(index) || index < 0 || index >= count) return
    preview(null)
    pin(index)
  }
  return {
    tabIndex: 0,
    onPointerMove: e => { if(e.pointerType !== 'touch') preview(sample(e)) },
    onPointerLeave: () => preview(null),
    onPointerCancel: () => preview(null),
    onBlur: () => preview(null),
    onClick: e => select(sample(e)),
    onKeyDown: e => {
      if(e.ctrlKey || e.metaKey || e.altKey || !count) return
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return
      e.preventDefault()
      select(e.key === 'Home' ? 0 : e.key === 'End' ? count-1 : Math.max(0,Math.min(count-1,pinned+(e.key === 'ArrowLeft' ? -1 : 1))))
    },
  }
}
