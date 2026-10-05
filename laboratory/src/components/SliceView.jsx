import {displayNumber} from '../plots/formatNumber.js'
import { axisDisplayLabel } from '../plots/export.js'
import ScientificPlot from './ScientificPlot.jsx'
export default function SliceView({slice,theme,currentRevision,onExport,onClose}){
  const s=slice.metadata.slice
  return <section className="slice-view"><h3>Exact sampled {s.direction} slice</h3><p>Fixed {axisDisplayLabel(s.fixedAxis,slice.metadata.componentNames)} = {displayNumber(s.fixedCoordinate,s.fixedAxis.quantity)} · {slice.series[0].name}. Gaps retain unavailable grid cells.</p><button onClick={onClose}>Close slice</button><ScientificPlot derived={slice} visibleIds={[slice.series[0].id]} theme={theme} currentRevision={currentRevision} onExport={onExport}/></section>
}
