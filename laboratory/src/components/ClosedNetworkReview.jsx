import {chemicalLabel} from '../chemistry/format.js'
export default function ClosedNetworkReview({audit}){
 if(!audit)return <p role="status">Auditing closed-reagent source network…</p>
 const list=rows=>rows.length?<ul>{rows.map(r=><li key={r.id??r.sourceId}><span style={{whiteSpace:'nowrap'}}>{chemicalLabel(r.name??r.productId)}</span> · {r.classification??r.category??`${r.electronCoefficient} formal electrons`} {r.reason??''}</li>)}</ul>:<p>None discovered.</p>
 return <details><summary>Reaction network · {audit.status} · {audit.included.length} admitted reactions</summary>{audit.reasons.map((r,i)=><p key={i}>{r.code}: {r.message}</p>)}<h4>Redox connections</h4>{list(audit.families)}<h4>Ordinary chemistry</h4>{list(audit.ordinary)}<h4>Candidate solids</h4>{list(audit.candidateSolids)}<h4>Candidate gases</h4>{list(audit.candidateGases)}<h4>Excluded aqueous reactions</h4>{list(audit.excluded.filter(r=>r.phase==='aqueous'))}<p>Phase exclusion is not evidence of absence. Gas diagnostics are equilibrium fugacity references, not gas-evolution kinetics. A finite headspace is not modeled.</p></details>
}
