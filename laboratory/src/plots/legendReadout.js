import { partitionPercent } from '../beaker/componentPartition.js'
import { chemicalLabel } from '../chemistry/format.js'
import { inspectPoint } from './geometry.js'
import { displayNumber, outputNumberType } from './formatNumber.js'
import { seriesLabel } from './presentation.js'
import { axisDisplayLabel } from './export.js'

/** Existing derived samples only; rounding is presentation and never mutates the sample. */
export function legendReadout(derived, index, currentRevision, componentLabel=null) {
  const sample = inspectPoint(derived, index), stale = derived.metadata.revision !== currentRevision
  const axis = derived.metadata.axis
  const coordinate = displayNumber(sample.x, axis.quantity)
  return { heading: `Species at ${axis.quantity === 'pH' ? 'pH' : axisDisplayLabel(axis, derived.metadata.componentNames)} ${coordinate}`,
    unit: derived.metadata.output.unit,
    rows: derived.series.map((s, i) => {
      const point = sample.values[i], valid = !stale && Number.isFinite(point.value) && point.pointStatus === 'converged'
      const label = seriesLabel(s, derived.metadata.output.type)
      return { id: s.id, label: s.phase === 'aqueous' && !label.endsWith('(aq)') ? `${label} (aq)` : label,
        value: valid ? point.value : null, text: valid ? (derived.metadata.output.type==='total-fraction' ? `${partitionPercent(point.value)} of total ${chemicalLabel(componentLabel??point.fractionTrace.component)}${Number.isFinite(point.dissolvedFraction)?` · ${partitionPercent(point.dissolvedFraction)} of dissolved ${chemicalLabel(point.fractionTrace.component)}`:''}` : derived.metadata.output.type === 'aqueous-fraction' && point.fractionTrace?.component ? `${partitionPercent(point.value)} of dissolved ${chemicalLabel(point.fractionTrace.component)}` : displayNumber(point.value, outputNumberType(derived.metadata.output))) : 'Unavailable',
        reason: stale ? 'Old conditions — recalculate' : point.reason ?? point.pointStatus ?? 'No sample' }
    }) }
}
