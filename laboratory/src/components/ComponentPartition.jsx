import { componentPartitions, partitionPercent } from '../beaker/componentPartition.js'
import { chemicalLabel } from '../chemistry/format.js'
import { displayNumber } from '../plots/formatNumber.js'

const amount = n => `${displayNumber(n, 'diagnostic')} mol/kg H₂O`
export default function ComponentPartition({ state, partitions = componentPartitions(state) }) {
  if (!partitions.length) return null
  return <section className="component-partition" aria-label="Component partition"><h4>Component partition</h4>
    <small>Share of the supplied component total at this equilibrium.</small>
    {partitions.map(p => <article key={p.id} data-partition-component={p.id}><h5>Total <span className="chemical-formula">{chemicalLabel(p.name)}</span></h5>
      {p.suppliedAs&&<p>Analytical total: {amount(p.suppliedTotal)}<br/>Supplied as: <span className="chemical-formula">{chemicalLabel(p.suppliedAs)}</span></p>}
      {p.ok ? <><p className="partition-percent"><span>Dissolved: <strong data-dissolved-fraction={p.dissolvedFraction}>{partitionPercent(p.dissolvedFraction)} of total <span className="chemical-formula">{chemicalLabel(p.name)}</span></strong></span><span>Solid-bound: <strong data-solid-fraction={p.solidFraction}>{partitionPercent(p.solidFraction)} of total <span className="chemical-formula">{chemicalLabel(p.name)}</span></strong></span></p>
        <div className="partition-track" role="img" aria-label={`${chemicalLabel(p.name)}: ${partitionPercent(p.dissolvedFraction)} of total ${chemicalLabel(p.name)} dissolved, ${partitionPercent(p.solidFraction)} of total ${chemicalLabel(p.name)} in solids`}><span className="partition-solid" style={{width:`${100*Math.max(0,Math.min(1,p.solidFraction))}%`}}/></div><div className="partition-track-labels"><span>Dissolved</span><span>Solid phases</span></div>
        {p.solids.length > 0 && <ul>{p.solids.map(s => <li key={s.id}><span className="chemical-formula">{chemicalLabel(s.name)}</span>{state.redoxPresentation?.carriers[s.id]?.oxidationLabel&&<> · {state.redoxPresentation.carriers[s.id].oxidationLabel}</>} · solid: <strong>{partitionPercent(s.fraction)}</strong> of total {chemicalLabel(p.name)}</li>)}</ul>}
        <details><summary>Amounts and balance</summary><p>Supplied total: {amount(p.suppliedTotal)}</p><p>Dissolved: {amount(p.dissolvedAmount)}</p><p>In solids: {amount(p.solidAmount)}</p>
          {p.solids.map(s => <p key={s.id}>{chemicalLabel(s.name)}: {amount(s.amount)} × {s.coefficient} = {amount(s.componentAmount)} of this component</p>)}
          <p>Balance residual: {amount(p.residual)} · accepted tolerance: {amount(p.balanceTolerance)}</p><small>Percentages are display-rounded. Solid amount is weighted by its source component coefficient.</small>
        </details></> : <p>Partition unavailable: {p.reason}</p>}
    </article>)}
  </section>
}
