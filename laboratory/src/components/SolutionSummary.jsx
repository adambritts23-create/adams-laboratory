import { solutionSummary } from '../beaker/solutionSummary.js'
import { partitionPercent } from '../beaker/componentPartition.js'
import { chemicalLabel } from '../chemistry/format.js'
export default function SolutionSummary({state}) {
  if(!state.ok)return null
  const rows=solutionSummary(state)
  return <section className="beaker-phase-card solution-card" aria-label="Solution composition"><h4><span className="phase-dot" aria-hidden="true"/>Solution (aqueous)</h4>
    {rows.map(c=><div key={c.id} className="solution-component"><strong>Within dissolved <span className="chemical-formula">{chemicalLabel(c.name)}</span></strong>{c.ok?<><p><span className="chemical-formula">{chemicalLabel(c.leader.name)} (aq){state.redoxPresentation?.carriers[c.leader.id]?.oxidationLabel&&<> · {state.redoxPresentation.carriers[c.leader.id].oxidationLabel}</>}</span><small data-dissolved-fraction={c.leaderFraction}>{partitionPercent(c.leaderFraction)} of dissolved {chemicalLabel(c.name)}</small></p>{c.otherFraction>0&&<p>Other aqueous forms<small>{partitionPercent(c.otherFraction)} of dissolved {chemicalLabel(c.name)}</small></p>}</>:<p>Dissolved percentages unavailable for this component.</p>}</div>)}
    {!rows.length&&<p>No ordinary component inventory in this calculation.</p>}
  </section>
}
