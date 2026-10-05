import {problemSummary} from '../plots/problemSummary.js'
export default function ProblemSummary({definition,components}){
 if(definition.closedReagents||definition.imposedEh||definition.pourbaix||definition.solubilityComparison)return null
 const summary=problemSummary(definition,components)
 return <section className="problem-summary" aria-label="Live calculation summary"><strong>Problem summary</strong><div><b>Varied</b>{summary.varied.length?summary.varied.map((s,i)=><span key={i}>{s}</span>):<span>Choose an X coordinate</span>}</div><div><b>Fixed</b>{summary.fixed.length?summary.fixed.map((s,i)=><span key={i}>{s}</span>):<span>No additional fixed component totals</span>}</div><small>{summary.conditions} · water activity 1</small></section>
}
