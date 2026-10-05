import {configureArea} from './predominanceArea.js'
import { createCondition } from './definition.js'
import {configurePourbaixDefinition} from './userPourbaix.js'

// Presentation choices over existing calculation paths. No chemistry is inferred here.
export const diagramTypes = [
  { id: 'log-concentration', label: 'Log concentrations' },
  { id: 'total-fraction', label: 'Total fractions / total component partition' },
  { id: 'aqueous-fraction', label: 'Aqueous speciation' },
  { id: 'saturated-log-solubility', label: 'Log solubilities' },
  { id: 'predominance', label: 'Predominance area' },
  { id: 'relative-activity', label: 'Relative activities', pending: true },
  { id: 'calculated-pH', label: 'Calculated pH / Eh' },
  { id: 'surface', label: 'Response surface' },
  { id: 'pourbaix', label: 'Reviewed oxidation-state pH–Eh' },
]

export function diagramType(definition, plot = {}) {
  if(definition.predominanceArea)return 'predominance'
  if(definition.pourbaix||definition.publicFePourbaix==='fe-v1')return 'pourbaix'
  if ((definition.dimensions ?? definition.independentVariables.length) === 2) return 'surface'
  if (definition.solubilityComparison) return 'saturated-log-solubility'
  const type = plot.type ?? 'log-concentration'
  if (definition.mixedSolubility) return ['total-fraction','aqueous-fraction'].includes(type) ? type : 'saturated-log-solubility'
  return diagramTypes.some(d => !d.pending && d.id === type) ? type : 'advanced'
}

export function diagramUnavailable(id, definition, components, solidCount, automaticSolids = false, pourbaixReason = null) {
  if(definition.closedReagents)return ['log-concentration','total-fraction','aqueous-fraction'].includes(id)?null:'This reviewed closed-reagent mode supports Log concentrations, Total fractions and Aqueous speciation. pH/Eh are shown in selected-result inspection.'
  if(definition.imposedEh&&['log-concentration','total-fraction','aqueous-fraction','saturated-log-solubility'].includes(id))return null
  if(id==='predominance')return components.filter(c=>c.role!=='solvent').length<2?'Select at least two distinct source coordinates in System.':!components.some(c=>c.role==='basis-choice')?'Select a material source component.':null
  if(id==='pourbaix')return pourbaixReason
  if (diagramTypes.find(d => d.id === id)?.pending) return 'Validation pending'
  if (definition.gridMultiSolid && id !== 'surface') return 'The current multi-solid configuration requires Response surface.'
  if (definition.mixedSolubility && !['total-fraction','aqueous-fraction', 'saturated-log-solubility'].includes(id)) return 'The current mixed-system path supports solubilities and aqueous fractions.'
  if (id === 'saturated-log-solubility' && !definition.mixedSolubility && (automaticSolids ? solidCount < 1 : solidCount !== 1)) return 'Select exactly one relevant pure solid in System.'
  if (['aqueous-fraction', 'calculated-pH'].includes(id) && !components.some(c => c.role === 'proton')) return 'Select a proton component in System.'
  if (['total-fraction','aqueous-fraction'].includes(id) && !components.some(c => c.role === 'basis-choice')) return 'Select a component to distribute in System.'
  return null
}

export function selectDiagram(definition, plot, id, components) {
  if(definition.closedReagents&&['log-concentration','total-fraction','aqueous-fraction'].includes(id))return {definition,plot:{...plot,type:id,componentId:'component:Fe%202%2B',visibleIds:null,focusedSeriesId:null,yRange:null}}
  if (!diagramTypes.some(d => d.id === id && !d.pending)) throw new Error('Unavailable diagram type')
  if(definition.imposedEh&&['log-concentration','total-fraction','aqueous-fraction','saturated-log-solubility'].includes(id))return {definition,plot:{...plot,type:id,visibleIds:null,focusedSeriesId:null,yRange:null}}
  if(id==='predominance')return {definition:configureArea(definition,components),plot:{type:'predominance',live:false}}
  if(id==='pourbaix')return {definition:configurePourbaixDefinition(definition,components),plot:{type:'pourbaix',live:false}}
  const next = structuredClone(definition), dimensions = id === 'surface' ? 2 : 1
  delete next.predominanceArea
  delete next.imposedEh
  delete next.publicFePourbaix
  delete next.pourbaix
  const removed = next.independentVariables.splice(dimensions)
  for (const axis of removed) {
    const c = components.find(c => c.id === axis.componentId)
    if(!['proton','electron'].includes(c.role))next.componentConditions.push(createCondition(c,'T'))
  }
  next.dimensions = dimensions
  // Do not silently discard an explicit multi-solid surface policy.
  if (definition.gridMultiSolid && dimensions !== 2) throw new Error('Keep Response surface for this multi-solid configuration.')
  next.solubilityComparison = null
  if (id === 'calculated-pH') {
    const proton = components.find(c => c.role === 'proton')
    next.independentVariables = next.independentVariables.filter(a => a.componentId !== proton.id)
    next.componentConditions = next.componentConditions.filter(c => c.componentId !== proton.id)
    const existing = definition.componentConditions.find(c => c.componentId === proton.id && c.mode === 'T')
    next.componentConditions.push(existing ?? createCondition(proton, 'T', 'total'))
  }
  const ordinary = components.filter(c => c.role === 'basis-choice')
  const componentId = ordinary.some(c => c.id === plot.componentId) ? plot.componentId : ordinary.length === 1 ? ordinary[0].id : null
  const type = id === 'surface' ? (['total-fraction','aqueous-fraction'].includes(plot.type) ? 'log-concentration' : plot.type ?? 'log-concentration') : id
  return { definition: next, plot: { type, componentId, visibleIds: null, focusedSeriesId: null, classify: false, colorRange: null, yRange: null,
    ...(id === 'surface' ? { visualizationMode: '3d', responseMode: 'surface-floor' } : {}) } }
}

export function defaultVisibleSeries(series, type) {
  return series.filter(s => type !== 'log-concentration' || s.phase === 'aqueous' && s.kind !== 'special').map(s => s.id)
}
