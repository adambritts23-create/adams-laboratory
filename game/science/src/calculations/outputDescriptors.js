import {totalFractionScope} from './totalFractions.js'
import { aqueousFractionScope } from './aqueousFractions.js'
import { multiSolidPolicy } from '../solver/assemblages.js'
import { solubilityApplicability } from './solubility.js'
/** Shared scientific identities for selectors, inspection, analysis and export. */
export const outputGroups = {
  Species: ['concentration', 'log-concentration', 'log-activity'],
  'Component totals': ['total-dissolved', 'log-total-dissolved', 'analytical-total', 'total-fraction', 'fraction', 'aqueous-fraction'],
  Solids: ['solid-amount', 'saturated-log-solubility'], Coordinates: ['calculated-pH', 'calculated-redox'],
}
export function outputDescriptor(type, series, definition) {
  const quantity = type === 'total-fraction' ? 'total-component-fraction' : type === 'aqueous-fraction' ? 'aqueous-component-fraction' : type === 'saturated-log-solubility' ? 'saturated-component-solubility' : type === 'analytical-total' ? 'supplied-analytical-total'
    : ['total-dissolved', 'log-total-dissolved', 'log-solubility'].includes(type) ? 'total-dissolved-component'
      : series.phase === 'solid' ? 'solid-quantity' : series.kind === 'free-component' ? 'free-component'
        : series.kind === 'reaction-product' ? 'individual-species' : 'derived-output'
  const name = quantity === 'free-component' ? `Free ${series.name}` : series.name
  return { id: JSON.stringify([type, series.id, definition.componentId ?? null, definition.redoxQuantity ?? null]), type, quantity, seriesId: series.id, componentId: definition.componentId ?? null, name, label: ['saturated-component-solubility','total-dissolved-component','supplied-analytical-total'].includes(quantity) ? definition.label : `${name} · ${definition.label}`, unit: definition.unit, formula: definition.formula, provenance: series.provenance }
}
export function validateOutputRequest(system, request, { requireSeries = false, definition = null } = {}) {
  const fail = message => ({ ok: false, diagnostics: [{ code: 'incompatible-output', message }] })
  if (request.type === 'total-fraction') {
    const scope=totalFractionScope(system,request.componentId)
    if(!scope.ok)return fail(scope.reason)
    if(requireSeries)return fail('Total fractions require a 1D sweep.')
    return {ok:true,diagnostics:[]}
  }
  if (request.type === 'aqueous-fraction') {
    const scope=aqueousFractionScope(system,request.componentId)
    if(!scope.ok) return fail(scope.reason)
    if(requireSeries || definition && (definition.independentVariables.length!==1 || !['pH','Eh','total'].includes(definition.independentVariables[0].quantity)&&!definition.closedReagentView)) return fail('Fraction diagrams require a 1D pH, imposed-Eh or analytical-total sweep; fraction surfaces are unsupported.')
    return {ok:true,diagnostics:[]}
  }
  if (request.componentIds) {
    if (system.solidPolicy !== multiSolidPolicy || requireSeries || request.type !== 'saturated-log-solubility' || !Array.isArray(request.componentIds) || !request.componentIds.length || new Set(request.componentIds).size !== request.componentIds.length) return fail('Explicit mixed 1D solubility components are required.')
    for (const componentId of request.componentIds) { const check=validateOutputRequest(system,{type:request.type,componentId},{definition}); if(!check.ok) return check }
    return {ok:true,diagnostics:[]}
  }
  const componentTypes = ['saturated-log-solubility', 'fraction', 'total-dissolved', 'log-total-dissolved', 'log-solubility', 'analytical-total']
  if (![...Object.values(outputGroups).flat(), 'log-solubility'].includes(request.type)) return fail('Choose a supported F/Z output.')
  if (componentTypes.includes(request.type)) {
    const index = system.components.findIndex(c => c.id === request.componentId), c = system.components[index]
    if (!c || c.suppressed || c.role !== 'ordinary') return fail('Choose an existing ordinary component for this inventory output.')
    if (request.type === 'analytical-total' && definition && ![...definition.componentConditions,...definition.independentVariables].some(c => c.componentId === request.componentId && ['T','TV','LTV'].includes(c.mode))) return fail('This component is activity-controlled; no analytical total was supplied. Choose total dissolved instead if that is the intended quantity.')
    if (['fraction', 'log-solubility'].includes(request.type) && system.products.some(p => p.coefficients[index] < 0)) return fail('This distribution output requires nonnegative inventory coefficients; the selected source basis is signed.')
  }
  if (['calculated-pH', 'calculated-redox'].includes(request.type)) {
    if (!system.components.some(c => c.role === (request.type === 'calculated-pH' ? 'proton' : 'electron'))) return fail('The required proton/electron identity is absent.')
    if (request.type === 'calculated-redox' && !['pe', 'Eh'].includes(request.redoxQuantity)) return fail('Choose pe or Eh explicitly.')
  }
  if (request.type === 'saturated-log-solubility') { const scope = solubilityApplicability(system, request.componentId); if (!scope.ok) return fail(scope.reason) }
  const scalar = [...componentTypes.filter(t => t !== 'fraction'), 'calculated-pH', 'calculated-redox'].includes(request.type)
  if (scalar) return { ok: true, diagnostics: [] }
  const catalog = [...system.components.map(c => ({ ...c, phase: c.role === 'water' ? 'liquid' : 'aqueous' })), ...system.products]
  const compatible = catalog.filter(s => request.type === 'solid-amount' ? s.phase === 'solid' : request.type === 'concentration' || request.type === 'log-concentration' ? !s.suppressed && (s.phase === 'aqueous' || request.type === 'log-concentration' && s.phase === 'solid') : true)
  if (!compatible.length) return fail('No selected species supports this quantity or phase.')
  if (requireSeries && !compatible.some(s => s.id === request.seriesId)) return fail('Choose an existing compatible F species. Missing or excluded identities are not replaced.')
  return { ok: true, diagnostics: [] }
}

