/** Place labels outside the plotting rectangle, with leaders to exact sampled endpoints.
 * Crowded plots use the existing interactive legend instead. No curve values are moved.
 */
export function placeCurveLabels(anchors, top, bottom, spacing = 19) {
  if (anchors.length > 8 || (anchors.length - 1) * spacing > bottom - top) return []
  const labels = anchors.map(a => ({ ...a, labelY: Math.max(top, Math.min(bottom, a.y)) })).sort((a, b) => a.y - b.y || a.id.localeCompare(b.id))
  for (let i = 1; i < labels.length; i++) labels[i].labelY = Math.max(labels[i].labelY, labels[i - 1].labelY + spacing)
  if (labels.length && labels.at(-1).labelY > bottom) {
    labels.at(-1).labelY = bottom
    for (let i = labels.length - 2; i >= 0; i--) labels[i].labelY = Math.min(labels[i].labelY, labels[i + 1].labelY - spacing)
  }
  return labels.some(label => Math.abs(label.labelY - label.y) > spacing * 3) ? [] : labels
}
