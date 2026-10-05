import { gridDiagnostics } from './gridDiagnostics.js'
import { isPrepared } from '../solver/models.js'
import { isGridResult } from '../calculations/grid.js'
import { isSweepResult } from '../calculations/sweep.js'
import { isDerivedResult } from '../calculations/outputs.js'
import { analyzeSamples } from './samples.js'

const diagnosticLabels = {
  'numerical-nonconvergence':'Nonlinear solver did not converge',
  'singular-or-ill-conditioned':'Rank or conditioning check failed',
  'inconsistent-or-boundary-total':'Requested total is inconsistent or requires unsupported zero-activity reduction',
  'invalid-prepared-input':'Invalid prepared input',
  'coordinate-transformation-failure':'Requested coordinate could not be transformed',
  'no-consistent-solid-assemblage':'No supported solid assemblage passed numerical/scientific acceptance',
  'underdetermined-solid-inventory':'Constraints do not determine solid inventory',
  'inconsistent-fixed-constraints':'Inconsistent fixed constraints',
  'overflow':'Floating-point range exceeded', 'underflow':'Below representable floating-point range',
  'cancelled':'Cancelled before calculation', 'invalidated-stale':'Superseded before calculation',
}
/** Deterministic facts from matched, trusted result snapshots, never chemical explanations. */
export function scientificSummary(system, result, derived, seriesId, { currentRevision=result?.revision, threshold=null }={}) {
  if(!isPrepared(system)||(!isGridResult(result)&&!isSweepResult(result))||!isDerivedResult(derived)||system.id!==result.systemId||derived.metadata.systemId!==system.id||derived.metadata.revision!==result.revision||(result.gridId??result.sweepId)!==(derived.metadata.gridId??derived.metadata.sweepId))return {ok:false,status:'unavailable',reason:'Matching accepted calculation and derived identities required.'}
  const series=derived.series.find(s=>s.id===seriesId)
  if(!series)return {ok:false,status:'unavailable',reason:'Choose an available analysis output identity.'}
  const analysis=analyzeSamples(series.points,{shape:result.shape??null,threshold}), groups=new Map()
  const counts={requested:result.outcomes.length,calculated:0,failed:0,unrun:0,cancelled:0,invalidated:0,derivedUnavailable:0,validValues:analysis.validCount}
  result.outcomes.forEach((p,i)=>{
    if(p.status==='converged')counts.calculated++
    else if(p.status==='failed')counts.failed++
    else {counts.unrun++;if(p.diagnostics?.[0]?.code==='cancelled')counts.cancelled++;if(p.diagnostics?.[0]?.code==='invalidated-stale')counts.invalidated++}
    const value=series.points[i]
    if(p.status==='converged'&&Number.isFinite(value.value))return
    if(p.status==='converged')counts.derivedUnavailable++
    const code=p.status==='converged'?value.reason??'derived-unavailable':p.diagnostics?.[0]?.code??p.status
    const key=p.status+':'+code
    if(!groups.has(key))groups.set(key,{status:p.status,code,category:p.status==='converged'?'Derived output unavailable':diagnosticLabels[code]??'Unclassified diagnostic — inspect exact code and details',count:0,representative:{index:p.index,x:p.coordinate,...(p.y!==undefined?{y:p.y,ix:p.ix,iy:p.iy}:{}),diagnostics:p.diagnostics??[],attempts:p.result?.attempts??[],derivedReason:value.reason??null}})
    groups.get(key).count++
  })
  const stale=currentRevision!==result.revision
  return {ok:true,kind:'ScientificResultSummary',schemaVersion:1,systemId:system.id,resultId:result.gridId??result.sweepId,revision:result.revision,currentRevision,stale,
    selectedComponents:system.components.map(c=>({id:c.id,name:c.name,role:c.role})),reactionSpecies:system.products.map(p=>({id:p.id,name:p.name,phase:p.phase})),
    fixedConditions:result.definition.fixedConditions,independentVariables:result.definition.axes??[result.definition.axis],conditions:derived.metadata.conditions,
    output:{...derived.metadata.output,seriesId:series.id,seriesName:series.descriptor?.name??series.name,descriptor:series.descriptor},counts,calculationCoverage:counts.requested?counts.calculated/counts.requested:0,analysis,
    gridDiagnostics:result.kind === 'grid' ? gridDiagnostics(result,series) : null,
    failures:[...groups.values()],activeSolids:result.outcomes.filter(p=>p.status==='converged'&&p.result?.solids?.length).map(p=>({index:p.index,solids:p.result.solids})),
    sourceIdentity:result.sourceIdentity,method:result.method,warnings:[...new Set([...derived.metadata.warnings,...result.outcomes.flatMap(p=>p.status==='converged'?p.result.warnings??[]:[])])],
    limitations:['Extrema apply only to accepted finite samples; no global minimum or maximum established.','Numerical equilibrium was not established at failed requested states; failure is not a phase boundary.','Total dissolved component is distinct from free species, solid amount and solid-referenced solubility.','General redox closure, validated Pourbaix, nonideal models, multiple simultaneous solids and compound-dose decomposition remain unsupported.']}
}
export function summaryText(s){
  if(!s?.ok)return s?.reason??'Analysis unavailable.'
  const e=s.analysis.extrema.minimum,position=e?`X=${e.x}${e.y!==undefined?`, Y=${e.y}`:''}, sample ${e.index}`:''
  return `${s.stale?'OLD CONDITIONS. ':''}${s.counts.calculated} of ${s.counts.requested} requested states were calculated successfully (${(100*s.calculationCoverage).toFixed(1)}%). ${e?`Minimum sampled ${s.output.seriesName}: ${e.value} ${s.output.unit}${s.output.type.startsWith('log-')&&e.linearValue!==null?` (${e.linearValue} ${e.linearUnit})`:''} at ${position}.`:'No accepted finite values exist for this output.'} ${s.counts.failed} states did not establish numerical equilibrium; ${s.counts.unrun} were unrun and ${s.counts.derivedUnavailable} calculated states lack this output. Extrema exclude all unavailable values.`
}
