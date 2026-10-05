/** Element clicks focus discovery. They never select a component or infer chemistry. */
export function elementInteraction(symbol, components, selected = [], implicit = []) {
  const forms = components.filter(c => !c.deprecated && c.associations.some(a => a.element === symbol))
  return { symbol, formIds: forms.map(c => c.id), available: !!forms.length, customEntry: true,
    discover: !!forms.length && !selected.includes(symbol) && !implicit.includes(symbol) }
}
