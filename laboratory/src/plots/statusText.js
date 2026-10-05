export function pointStatusText(point) {
  if(point.reason==='stale-aqueous-fraction')return 'Old equilibrium: aqueous fractions unavailable for the current setup.'
  if(point.reason==='dissolved-total-below-fraction-resolution')return 'Dissolved total is at or below the fraction resolution floor; normalization is unavailable.'
  if(point.reason==='relevant-solid-not-saturated')return 'Relevant solid is unsaturated/absent; saturation solubility is unavailable.'
  if(point.reason==='solid-saturation-not-established')return 'Accepted pure-solid saturation has not been established.'
  if(point.reason==='invalid-dissolved-inventory')return 'A finite positive dissolved component inventory is required.'
  if(point.reason==='suppressed-bookkeeping-concentration')return 'No concentration is defined for this special component.'
  if(point.reason==='zero-log-undefined')return 'Zero amount; its logarithm is undefined.'
  if(point.reason==='absent-solid-activity-unavailable')return 'Solid is absent; no actual solid activity is reported.'
  if(point.pointStatus==='not-run')return 'Not calculated: this run was cancelled or superseded.'
  if(point.pointStatus==='failed'||point.status==='unavailable')return point.diagnostic??'Equilibrium could not be calculated at this coordinate.'
  return point.reason?'This quantity is unavailable under the selected conditions.':'Calculated'
}
