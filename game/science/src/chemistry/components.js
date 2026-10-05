/** Source component identities are distinct from species and from a validated independent basis. */
export function componentRole(name) {
  if (name === 'H+' || name === 'H +') return 'proton'
  if (/^e ?[-\u2013\u2212]$/i.test(name)) return 'electron'
  if (name === 'H2O' || /^H2O\(l\)$/i.test(name)) return 'solvent'
  return 'basis-choice'
}
export function getSystemCapabilities(system, repository) {
  const selected = (Array.isArray(system.selectedComponents) ? system.selectedComponents : []).map(id => repository.getComponentById(id)).filter(Boolean)
  return { redox: selected.some(c => c.role === 'electron'), acidBase: selected.some(c => c.role === 'proton'),
    explicitComponents: repository.getComponents().length > 0, resolvedBasis: false }
}
