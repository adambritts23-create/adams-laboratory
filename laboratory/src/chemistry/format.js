export function oxidationLabel(species) {
  const entries = Object.entries(species.oxidationStates ?? {})
  return entries.length ? entries.map(([symbol, states]) => `${symbol}: ${states ? states.map(s => `${s.value > 0 ? '+' : ''}${s.value}${states.length > 1 ? ` × ${s.count}` : ''}`).join(', ') : 'unknown'}`).join('; ') : 'Unknown'
}
/** Typography only: original identity is never changed in scientific records. */
export function chemicalLabel(name='') {
  const sub='₀₁₂₃₄₅₆₇₈₉',sup='⁰¹²³⁴⁵⁶⁷⁸⁹'
  let base=name,charge=''
  const m=name.match(/(?:\s+|\^)(\d*)([+-])$/) ?? name.match(/^([A-Z][a-z]?)(\d+)([+-])$/)
  if(m){if(m.length===4){base=m[1];charge=m[2]+m[3]}else{base=name.slice(0,m.index);charge=m[1]+m[2]}}
  else if(/[+-]$/.test(name)){base=name.slice(0,-1);charge=name.slice(-1)}
  return base.replace(/\d/g,d=>sub[Number(d)])+charge.replace(/\d/g,d=>sup[Number(d)]).replaceAll('+','⁺').replaceAll('-','⁻')
}
