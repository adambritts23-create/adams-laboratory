import { logGridTicks } from './geometry.js'

/** Prioritize the current integer decade without crowding neighboring labels. View only. */
export function logLandmarks(min, max, position, pixelHeight = 220) {
  const ticks = logGridTicks(min, max, pixelHeight), current = Math.round(position)
  if (Math.abs(current - position) > 1e-10) return ticks
  const separation = (max - min) * 24 / pixelHeight
  return ticks.map(t => ({ ...t, major: t.value === current || (t.major && Math.abs(t.value - current) >= separation) }))
}
