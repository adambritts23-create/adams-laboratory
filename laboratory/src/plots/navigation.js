import { pan, validView } from './geometry.js'

export function dragView(view, dx, dy, width, height) {
  if (!(width > 0 && height > 0)) return view
  return pan(view, -dx / width * (view.xMax - view.xMin), dy / height * (view.yMax - view.yMin))
}
export function zoomViewAt(view, factor, x = 0.5, y = 0.5) {
  if (!(factor > 0) || !Number.isFinite(factor)) return view
  const ax = view.xMin + x * (view.xMax - view.xMin), ay = view.yMin + y * (view.yMax - view.yMin)
  const next = { xMin: ax + (view.xMin - ax) * factor, xMax: ax + (view.xMax - ax) * factor,
    yMin: ay + (view.yMin - ay) * factor, yMax: ay + (view.yMax - ay) * factor }
  return validView(next) ? next : view
}
export function keyboardView(view, key) {
  const dx = (view.xMax - view.xMin) * 0.1, dy = (view.yMax - view.yMin) * 0.1
  return key === 'ArrowLeft' ? pan(view, -dx, 0) : key === 'ArrowRight' ? pan(view, dx, 0)
    : key === 'ArrowUp' ? pan(view, 0, dy) : key === 'ArrowDown' ? pan(view, 0, -dy)
      : ['+', '='].includes(key) ? zoomViewAt(view, 0.7) : key === '-' ? zoomViewAt(view, 1.4) : undefined
}
