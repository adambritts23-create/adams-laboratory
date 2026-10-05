import { useEffect, useState, useMemo } from 'react'

/** Responsive presentation geometry. The result never enters scientific calculations. */
export default function usePlotBox(ref, base, conditionCount) {
  const [size, setSize] = useState(null)
  useEffect(() => {
    const measure = () => { const width = ref.current?.getBoundingClientRect().width; if (width > 0) setSize({ width, height: window.innerHeight, expanded: !!ref.current?.closest('.expanded-plot'), results: !!ref.current?.closest('.results-mode') }) }
    const observer = new ResizeObserver(measure)
    if (ref.current) observer.observe(ref.current)
    window.addEventListener('resize', measure); measure()
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [ref])
  return useMemo(() => {
  if (!size) return base
  // Narrow screens retain a readable aspect ratio rather than an extremely tall SVG.
  const fullHeight = size.width < 700 && !size.expanded ? base.height + conditionCount * 21 : Math.max(360, size.expanded ? size.height - 155 : Math.max(480, Math.min(900, size.height - (size.results ? 300 : 215)))) * base.width / size.width
  const height = fullHeight - conditionCount * 21
  return { ...base, height, bottom: height - (base.height - base.bottom), pixelScale: size.width / base.width }
  }, [size, base, conditionCount])
}
