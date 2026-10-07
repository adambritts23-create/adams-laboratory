import {commitClosedReagentCalculation} from '../calculations/closedReagentSetup.js'
import {configureImposedEh,commitImposedEh} from '../calculations/imposedEh.js'
import { newWorkspaceDefinition, newComponentDefault, workspaceDefaultsPolicy } from './workspaceDefaults.js'
import {commitUserPourbaix} from '../calculations/userPourbaix.js'
import {commitPublicFeResult} from '../calculations/publicFePourbaix.js'
import { createChemicalSystem, updateChemicalSystem } from '../chemistry/system.js'
import { createCalculationDefinition } from '../calculations/definition.js'
import { isSuccessfulPointResult } from '../solver/point.js'
import { isSweepResult } from '../calculations/sweep.js'
import { isPrepared } from '../solver/models.js'
import { isGridResult } from '../calculations/grid.js'
import { automaticSpeciesPolicy, automaticSolidPolicy, reconcileAutomaticSpecies } from '../thermodynamics/compatibility.js'

export function createLaboratorySession(repository) {
  const chemicalSystem = createChemicalSystem(repository)
  chemicalSystem.selectedElements = chemicalSystem.selectedElements.filter(s => repository.getElements().some(e => e.symbol === s))
  return { schemaVersion: 1, revision: 0, chemicalSystem,
    thermodynamicDataSelection: { sources: repository.getSources(), recordIdentity: 'repository species IDs include source database hash and offset where imported' },
    calculationDefinition: createCalculationDefinition(chemicalSystem, repository), calculationResult: null, pointRequest: null, sweepResult: null, sweepRequest: null, lastPlot: null, lastPoint:null,
    analysisState: { requests: [], results: null }, visualizationState: { workspace: 'system', dimensions: 2 },
    invalidations: [], calculationStatus: 'not-calculated' }
}

/** Neutral discovery state for the modern workspace; legacy demo initializer remains compatible. */
export function createWorkspaceSession(repository, { solidPhasePolicy = automaticSolidPolicy } = {}) {
  const session = createLaboratorySession(repository)
  session.chemicalSystem.selectedElements = []
  session.chemicalSystem = reconcileAutomaticSpecies({ ...session.chemicalSystem, speciesPolicy: automaticSpeciesPolicy, solidPhasePolicy, excludedSpecies: [], optionalSpecies: [] }, repository)
  if (solidPhasePolicy === automaticSolidPolicy) {
    session.defaultsPolicy = workspaceDefaultsPolicy
    session.calculationDefinition = newWorkspaceDefinition(session.chemicalSystem, repository)
    session.visualizationState = { workspace: 'system', dimensions: 1, plot: { type: 'log-concentration' } }
  }
  return session
}

function reconcile(definition, system, repository) {
  const selected = new Set(system.selectedComponents)
  const conditions = [...definition.componentConditions, ...definition.independentVariables]
  const removed = conditions.filter(c => !selected.has(c.componentId))
  const next = structuredClone(definition)
  next.componentConditions = next.componentConditions.filter(c => selected.has(c.componentId))
  next.independentVariables = next.independentVariables.filter(c => selected.has(c.componentId))
  for (const condition of createCalculationDefinition(system, repository).componentConditions) {
    if (!conditions.some(c => c.componentId === condition.componentId)) next.componentConditions.push(newComponentDefault(condition, repository.getComponentById(condition.componentId)))
  }
  next.enabledPhases = [...system.enabledPhases]
  next.output.speciesIds = next.output.speciesIds.filter(id => system.selectedSpecies.includes(id))
  const roles = system.selectedComponents.map(id => repository.getComponentById(id)?.role)
  if ((next.output.type === 'calculated-redox' && !roles.includes('electron')) || (['calculated-pH', 'hydrogen-affinity'].includes(next.output.type) && !roles.includes('proton'))) next.output.type = 'log-concentration'
  if (!selected.has(next.output.componentId)) next.output.componentId = null
  if (!system.selectedSpecies.includes(next.output.referenceSpeciesId)) next.output.referenceSpeciesId = null
  if (next.mixedSolubility) {
    next.mixedSolubility.componentIds = next.mixedSolubility.componentIds.filter(id => selected.has(id))
    if (!next.mixedSolubility.componentIds.length) delete next.mixedSolubility
  }
  if (next.solubilityComparison) {
    const names = new Set(system.selectedComponents.map(id => repository.getComponentById(id)?.name))
    next.solubilityComparison.pairs = next.solubilityComparison.pairs.filter(p => names.has(p.id === 'mg-hydroxide' ? 'Mg 2+' : p.id === 'ca-hydroxide' ? 'Ca 2+' : ''))
    if (!next.solubilityComparison.pairs.length) delete next.solubilityComparison
  }
  return { definition: next, invalidations: removed.map(c => `Removed ${c.quantity} condition for unavailable component ${c.componentId}.`) }
}

export function updateLaboratorySession(session, action, repository) {
  if(action.type==='closedReagentResult')return commitClosedReagentCalculation(session,action.result)
  if(action.type==='imposedEhResult')return commitImposedEh(session,action.result)
  if(action.type==='userPourbaixResult')return commitUserPourbaix(session,action.result)
  if(action.type==='publicFeResult')return commitPublicFeResult(session,action.result)
  if (action.type === 'loadExample') return { ...action.session, revision: session.revision + 1,
    loadedExample: { id: action.id, label: action.label, edited: false }, lastPlot: null, calculationResult: null, sweepResult: null, gridResult: null }
  if (action.type === 'newSystem' && session.chemicalSystem.speciesPolicy === automaticSpeciesPolicy) {
    return { ...createWorkspaceSession(repository), revision: session.revision + 1 }
  }
  if (action.type === 'newSystem' || action.type === 'resetCalculation') {
    const next = createLaboratorySession(repository)
    next.chemicalSystem = action.type === 'resetCalculation' ? structuredClone(session.chemicalSystem) : {
      ...next.chemicalSystem, selectedElements: [], selectedSpecies: [],
      selectedComponents: repository.getComponents().filter(c => c.role === 'solvent').map(c => c.id),
    }
    next.calculationDefinition = createCalculationDefinition(next.chemicalSystem, repository)
    if (action.type === 'newSystem' && session.chemicalSystem.speciesPolicy === automaticSpeciesPolicy) next.chemicalSystem = reconcileAutomaticSpecies({ ...next.chemicalSystem, speciesPolicy: automaticSpeciesPolicy, excludedSpecies: [], optionalSpecies: [] }, repository)
    next.revision = session.revision + 1
    next.visualizationState = { workspace: action.type === 'newSystem' ? 'system' : 'calculation', dimensions: 2 }
    return next
  }
  if (action.type === 'beginGrid') {
    if (action.revision !== session.revision || !isPrepared(action.system) || action.system.id !== action.systemId) return session
    return {...session,lastPoint:null,gridRequest:{revision:action.revision,systemId:action.systemId,gridId:action.gridId,system:action.system},gridResult:null,sweepRequest:null,sweepResult:null,pointRequest:null,calculationResult:null,calculationStatus:'calculating-grid'}
  }
  if (action.type === 'gridResult') {
    const r=action.result,p=session.gridRequest
    if (!p || !isGridResult(r) || r.status==='invalidated-stale' || r.revision!==session.revision || r.systemId!==p.systemId || r.gridId!==p.gridId) return session
    return {...session,gridRequest:null,gridResult:r,calculationStatus:r.status,...(r.status!=='invalidated-stale'?{lastPlot:{system:p.system,grid:r}}:{})}
  }
  if (action.type === 'plotView') return { ...session, visualizationState: { ...session.visualizationState, plot: { ...session.visualizationState.plot, ...action.patch } } }
  if (action.type === 'beginSweep') {
    if (action.revision !== session.revision) return session
    if (action.system && (!isPrepared(action.system) || action.system.id !== action.systemId)) return session
    return { ...session, lastPoint:null,gridResult:null,gridRequest:null,sweepRequest: { revision: action.revision, systemId: action.systemId, sweepId: action.sweepId, system: action.system }, sweepResult: null, calculationResult: null, pointRequest: null, calculationStatus: 'calculating-sweep' }
  }
  if (action.type === 'sweepResult') {
    const r = action.result, p = session.sweepRequest
    if (!p || !isSweepResult(r) || r.status === 'invalidated-stale' || r.revision !== session.revision || r.systemId !== p.systemId || r.sweepId !== p.sweepId) return session
    return { ...session, sweepRequest: null, sweepResult: r, calculationStatus: r.status,
      ...(p.system ? { lastPlot: { system: p.system, sweep: r } } : {}) }
  }
  if (action.type === 'workspace') return { ...session, visualizationState: { ...session.visualizationState, workspace: ['intro','database','calculation','beaker','wet-lab','kf-titration','ise','engineering'].includes(action.workspace) ? action.workspace : 'system' } }
  if (action.type === 'beginPoint') {
    if (action.revision !== session.revision) return session
    return { ...session, pointRequest: { revision: action.revision, systemId: action.systemId, inputId: action.inputId, system:action.system,input:action.input }, sweepRequest: null, sweepResult: null, calculationResult: null, calculationStatus: 'calculating-point' }
  }
  if (action.type === 'pointResult') {
    const r = action.result, pending = session.pointRequest
    if (!pending || !isSuccessfulPointResult(r) || r.revision !== session.revision || r.systemId !== pending.systemId || r.inputId !== pending.inputId) return session
    return { ...session, calculationResult: r, ...(pending.system&&pending.input?{lastPoint:{system:pending.system,input:pending.input,result:r}}:{}), pointRequest: null, calculationStatus: 'converged-point' }
  }
  if (action.type === 'pointFailure') {
    if (action.revision !== session.revision) return session
    return { ...session, lastPoint:null, calculationResult: null, pointRequest: null, calculationStatus: 'point-unavailable' }
  }
  let chemicalSystem = session.chemicalSystem, calculationDefinition = session.calculationDefinition, invalidations = []
  if (action.type === 'system') {
    chemicalSystem = updateChemicalSystem(chemicalSystem, action.action, repository)
    if (chemicalSystem === session.chemicalSystem) return session
    if (['toggleElement','toggleSelectedElement'].includes(action.action.type) && chemicalSystem.speciesPolicy === automaticSpeciesPolicy && JSON.stringify(chemicalSystem.selectedComponents) === JSON.stringify(session.chemicalSystem.selectedComponents)) return { ...session, chemicalSystem }
    const reconciled = reconcile(calculationDefinition, chemicalSystem, repository)
    calculationDefinition = reconciled.definition; invalidations = reconciled.invalidations
    if(action.action.type==='toggleComponent'&&repository.getComponentById(action.action.id)?.role==='electron'){
      if(chemicalSystem.selectedComponents.includes(action.action.id))calculationDefinition=configureImposedEh(calculationDefinition,chemicalSystem.selectedComponents.map(id=>repository.getComponentById(id)).filter(Boolean))
      else delete calculationDefinition.imposedEh
    }
    // Physical conditions are shared by both views; existing mol/L constraints are never converted.
    calculationDefinition.temperature.value = chemicalSystem.temperature
    calculationDefinition.pressure.value = chemicalSystem.pressure
  } else if (action.type === 'calculation') {
    calculationDefinition = structuredClone(action.definition)
    chemicalSystem = { ...chemicalSystem, temperature: calculationDefinition.temperature.value, pressure: calculationDefinition.pressure.value }
  } else if (action.type === 'sources') {
    repository = action.repository
    chemicalSystem = { ...chemicalSystem, selectedSpecies: chemicalSystem.selectedSpecies.filter(id => repository.getSpeciesById(id)),
      selectedComponents: chemicalSystem.selectedComponents.filter(id => repository.getComponentById(id)),
      selectedElements: chemicalSystem.selectedElements.filter(symbol => repository.getElements().some(e => e.symbol === symbol)) }
    chemicalSystem = reconcileAutomaticSpecies(chemicalSystem, repository)
    calculationDefinition = reconcile(calculationDefinition, chemicalSystem, repository).definition
  } else return session
  const removedBasis = session.chemicalSystem?.selectedComponents?.some(id => !chemicalSystem.selectedComponents.includes(id))
  const lostPlotBasis = removedBasis && (session.lastPlot?.system || session.lastPlot?.comparison)
  return { ...session, revision: session.revision + 1, chemicalSystem, calculationDefinition,
    ...(session.loadedExample ? { loadedExample: { ...session.loadedExample, edited: true } } : {}),
    ...(lostPlotBasis ? { lastPlot: null } : {}),
    ...(removedBasis ? { visualizationState: { ...session.visualizationState, plot: { ...calculationDefinition.output, live: false } } } : {}),
    ...(calculationDefinition.imposedEh&&!session.calculationDefinition.imposedEh?{visualizationState:{...session.visualizationState,plot:{type:'log-concentration',live:false}}}:{}),
    thermodynamicDataSelection: { ...session.thermodynamicDataSelection, sources: repository.getSources() },
    lastPoint:null,gridResult:null,gridRequest:null,calculationResult: null, sweepResult: null, sweepRequest: null, ...(session.pointRequest !== undefined ? { pointRequest: null } : {}), analysisState: { ...(removedBasis ? { requests: [] } : session.analysisState), results: null }, invalidations, calculationStatus: 'not-calculated' }
}

export function serializeSession(session) { return JSON.stringify(session) }
export function deserializeSession(text) {
  const value = JSON.parse(text)
  if (value?.schemaVersion !== 1 || !value.chemicalSystem || value.calculationDefinition?.schemaVersion !== 1) throw new Error('Unsupported session document.')
  // Imported/persisted results require independent verification before use.
  return { ...value, lastPoint:null, gridResult:null,gridRequest:null,calculationResult: null, sweepResult: null, sweepRequest: null, pointRequest: null, lastPlot: null, analysisState: { ...value.analysisState, results: null }, calculationStatus: 'not-calculated' }
}

