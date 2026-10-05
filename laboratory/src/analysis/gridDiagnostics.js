/** Classification of reported evidence only. Unknown/mixed failures stay broad. */
export const diagnosticCategories = {
  CALCULATED: 'Equilibrium calculated; output available',
  CALCULATED_OUTPUT_UNAVAILABLE: 'Equilibrium calculated; requested output unavailable',
  FAILED_NONCONVERGENCE: 'Reported numerical non-convergence',
  FAILED_SINGULAR_OR_UNDERDETERMINED: 'Reported singularity, conditioning or underdetermination',
  FAILED_INVALID_STATE: 'No accepted state for the reported constraints or numerical range',
  FAILED_UNSUPPORTED_CHEMISTRY: 'Unsupported chemistry or formulation',
  INVALID_INPUT: 'Invalid input or coordinate transformation',
  CANCELLED_OR_UNRUN: 'Cancelled, superseded or not run',
  FAILED_UNCLASSIFIED: 'Equilibrium not established; no single reported cause',
}
const codes = {
  FAILED_NONCONVERGENCE: ['numerical-nonconvergence'],
  FAILED_SINGULAR_OR_UNDERDETERMINED: ['singular-or-ill-conditioned','underdetermined-solid-inventory'],
  FAILED_INVALID_STATE: ['inconsistent-or-boundary-total','inconsistent-fixed-constraints','overflow','underflow','negative-solid-amount','solid-saturation','ambiguous-solid-assemblage','balance-residual','fixed-activity-residual','mass-action-residual'],
  FAILED_UNSUPPORTED_CHEMISTRY: ['unsupported-basis-transformation','unsupported-activity-model','unsupported-conditions','unsupported-ionic-strength','thermodynamic-data-unavailable','unsupported-phase','unsupported-solid-assemblage','unsupported-component','unsupported-size','unsupported-constraint'],
  INVALID_INPUT: ['redundant-basis','invalid-system','unprepared-system','unit-incompatibility','unit-or-coordinate-incompatibility','invalid-water-constraint','invalid-revision','invalid-component','duplicate-component','invalid-special-component','invalid-species','disabled-phase','missing-provenance','invalid-prepared-input','invalid-options','coordinate-transformation-failure','invalid-definition','invalid-grid-definition','invalid-input','invalid-constraint','missing-component','missing-species','invalid-stoichiometry'],
}
const classifyCode = code => Object.entries(codes).find(([, values]) => values.includes(code))?.[0] ?? null
export function cellDiagnostic(outcome, point, descriptor) {
  const rawDiagnostic = outcome.diagnostics ?? [], attempts = outcome.result?.attempts ?? []
  const available = outcome.status === 'converged' && outcome.scientificAcceptance === 'passed' && Number.isFinite(point?.value)
  let category
  if (outcome.status === 'converged') category = available ? 'CALCULATED' : 'CALCULATED_OUTPUT_UNAVAILABLE'
  else if (outcome.status === 'not-run') category = 'CANCELLED_OR_UNRUN'
  else {
    const reported = rawDiagnostic.map(d => classifyCode(d.code)).filter(Boolean)
    // An assemblage wrapper alone does not certify nonconvergence or a chemical cause.
    // Retain all per-attempt evidence for inspection instead of guessing a dominant cause.
    category = reported.length && new Set(reported).size === 1 ? reported[0] : 'FAILED_UNCLASSIFIED'
  }
  return { index:outcome.index, x:outcome.x ?? outcome.coordinate, y:outcome.y, ix:outcome.ix, iy:outcome.iy,
    calculationStatus:outcome.status, normalizedDiagnosticCategory:category, explanation:diagnosticCategories[category],
    rawDiagnostic, attempts, iterations:outcome.result?.iterations ?? null, residuals:outcome.result?.residuals ?? null,
    requestedOutputStatus:available ? 'AVAILABLE' : outcome.status === 'converged' ? 'UNAVAILABLE' : 'NOT_CALCULATED',
    requestedOutputValue:available ? point.value : null, requestedOutputUnits:descriptor?.unit ?? null, outputReason:point?.reason ?? null,
    input:outcome.input ?? null, transformed:outcome.transformed ?? null }
}
export function gridDiagnostics(grid, series) {
  const cells = grid.outcomes.map((o,i) => cellDiagnostic(o,series.points[i],series.descriptor)), groups = new Map()
  for (const cell of cells) {
    const key=cell.normalizedDiagnosticCategory
    if(!groups.has(key))groups.set(key,{category:key,explanation:cell.explanation,count:0,representatives:[]})
    const g=groups.get(key);g.count++;if(g.representatives.length<3)g.representatives.push(cell.index)
  }
  const axes = [0,1].map(axis=>grid.coordinates[axis].map((coordinate,index)=>({coordinate,index,requested:axis===0?grid.shape[1]:grid.shape[0],calculated:0,available:0})))
  let xMin=Infinity,xMax=-Infinity,yMin=Infinity,yMax=-Infinity
  for(const c of cells){const calculated=c.calculationStatus==='converged',available=c.requestedOutputStatus==='AVAILABLE';for(const [axis,i] of [[0,c.ix],[1,c.iy]]){if(calculated)axes[axis][i].calculated++;if(available)axes[axis][i].available++}if(calculated){xMin=Math.min(xMin,c.x);xMax=Math.max(xMax,c.x);yMin=Math.min(yMin,c.y);yMax=Math.max(yMax,c.y)}}
  return {schemaVersion:1,cells,groups:[...groups.values()],countsByCategory:Object.fromEntries([...groups].map(([k,g])=>[k,g.count])),axes,
    calculatedRanges:xMin===Infinity?null:{x:[xMin,xMax],y:[yMin,yMax]},
    warning:'Ranges bound successful samples only, not a continuous validated domain. Solver failure is not a chemical boundary.'}
}
