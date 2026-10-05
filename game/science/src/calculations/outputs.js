import {isClosedReagentPlot} from './closedReagentPlot.js'
import { aqueousFractionScope, aqueousFractionState, aqueousFractionNumerics } from './aqueousFractions.js'
import {totalFractionScope,totalFractionState} from './totalFractions.js'
import { saturatedLogSolubility, solubilityApplicability } from './solubility.js'
import { freeze, isPrepared } from '../solver/models.js'
import { isSweepResult } from './sweep.js'
import { isSuccessfulPointResult } from '../solver/point.js'
import { toSourceInput } from './definition.js'
import { isGridResult } from './grid.js'
import { outputDescriptor, validateOutputRequest } from './outputDescriptors.js'

const derivedResults = new WeakSet()
export const isDerivedResult = value => derivedResults.has(value)
export const componentOutputTypes = ['saturated-log-solubility', 'total-dissolved', 'log-total-dissolved', 'log-solubility', 'analytical-total']
export const scalarOutputTypes = [...componentOutputTypes, 'calculated-pH', 'calculated-redox']
export const outputDefinitions = Object.freeze({
  'aqueous-fraction': { label: 'Aqueous speciation · dissolved component only', unit: 'dimensionless', formula: 'nu(i,E) m(i) / sum over compatible aqueous species of nu(j,E) m(j); distribution within dissolved inventory only, excluding all solid amounts' },
  'total-fraction': {label:'Total component partition',unit:'dimensionless',formula:'Component coefficient times accepted carrier amount / supplied analytical component total; includes aqueous species and accepted solids, with closure checked at the existing balance tolerance; no renormalization'},
  'saturated-log-solubility': { label: 'Log solubility · saturated solid', unit: 'log10(m / (mol/kg-H2O))', formula: 'log10 of free component plus coefficient-weighted aqueous species molalities at equilibrium with the one relevant saturated pure solid; excludes solid inventory; absent/unsaturated or failed states unavailable' },
  'analytical-total': { label: 'Supplied analytical component total', unit: 'mol/kg-H2O', formula: 'requested total constraint, not the free amount or dissolved sum; unavailable for activity-controlled components' },
  'concentration': { label: 'Individual aqueous species amount', unit: 'mol/kg-H2O', formula: 'accepted individual aqueous species molality; not total dissolved component' },
  'total-dissolved': { label: 'Total dissolved component', unit: 'mol/kg-H2O', formula: 'free basis amount plus sum of aqueous product amounts times actual component coefficients; excludes solids, gases and liquids; not automatically solubility' },
  'log-total-dissolved': { label: 'Log total dissolved component', unit: 'log10(m / (mol/kg-H2O))', formula: 'log10 of total dissolved component from the aqueous stoichiometric sum; zero is unavailable; not automatically solubility' },
  'solid-amount': { label: 'Pure solid amount', unit: 'mol/kg-H2O', formula: 'accepted amount of the selected supported pure solid per kg water; distinct from dissolved component and saturation' },
  'log-concentration': { label: 'Log amount / concentration', unit: 'log10(m / (mol/kg-H2O))', formula: 'log10 numerical aqueous molality or solid amount per kg H2O; suppressed bookkeeping concentrations unavailable' },
  'log-activity': { label: 'Log activity', unit: 'dimensionless log10 activity', formula: 'stored log10 activity; pure solid log activity 0 only when present, absent-solid saturation is not activity' },
  'log-solubility': { label: 'Log dissolved component amount', unit: 'log10(m / (mol/kg-H2O))', formula: 'log10 dissolvedComponentAmounts[target]; nonnegative component inventory only; not necessarily saturated or intrinsic solubility' },
  fraction: { label: 'Component distribution fraction', unit: 'dimensionless', formula: 'nu(species,target) * amount(species) / total(target), including solid inventory; nonnegative component inventory only' },
  'calculated-pH': { label: 'Calculated pH', unit: 'dimensionless', formula: '-log10 a(H+)' },
  'calculated-redox': { label: 'Calculated pe / Eh', unit: 'dimensionless or V-SHE', formula: 'pe=-log10 a(e-); Eh=-log10 a(e-)*R*ln(10)*T/F, existing EC constants' },
})
const products = system => [...system.components.map(c => ({ ...c, phase: c.role === 'water' ? 'liquid' : 'aqueous', kind: c.suppressed ? 'special' : 'free-component', provenance: 'source-component' })), ...system.products.map(p => ({ ...p, kind: 'reaction-product', provenance: p.sourceRecord.kind }))]
const gap = reason => ({ value: null, reason })
const finite = value => Number.isFinite(value) ? { value, reason: null } : gap('nonfinite-derived-value')
const logarithm = value => value > 0 ? finite(Math.log10(value)) : gap(value === 0 ? 'zero-log-undefined' : 'negative-or-unavailable-amount')
// Shared presentation semantics for accepted point consumers, including physical experiments.
export const logConcentrationValue = (system,result,index) => index < system.components.length && system.components[index].suppressed ? gap('suppressed-bookkeeping-concentration') : Number.isFinite(result.logConcentrations?.[index]) ? finite(result.logConcentrations[index]) : logarithm(result.concentrations[index])
export const dissolvedOutputValue = (amount, log = false) => !Number.isFinite(amount) ? gap('unavailable-dissolved-total') : amount < 0 ? gap('negative-dissolved-total-in-source-basis') : log ? logarithm(amount) : finite(amount)

/** Derive quantities from validated immutable outputs only; never solve chemistry. */
export function deriveOutputs(system, sweep, request, { currentRevision = sweep?.revision } = {}) {
  const reject = message => freeze({ ok: false, diagnostics: [{ code: 'unsupported-output', message }] })
  if (!isPrepared(system) || !isSweepResult(sweep) || sweep.systemId !== system.id || sweep.status === 'invalidated-stale') return reject('Matching prepared system and non-invalidated sweep required.')
  if (request?.type === 'aqueous-fraction') return deriveAqueousFractions(system,sweep,request,currentRevision)
  if (request?.type === 'total-fraction') return deriveTotalFractions(system,sweep,request,currentRevision)
  if (request?.componentIds) return deriveMixedSolubility(system, sweep, request)
  return deriveAcceptedOutputs(system, sweep, request)
}
export function deriveGridOutputs(system, grid, request) {
  if(request?.type==='total-fraction') return freeze({ok:false,diagnostics:[{code:'unsupported-output',message:'Total fractions require a 1D sweep.'}]})
  if(request?.type==='aqueous-fraction') return freeze({ok:false,diagnostics:[{code:'unsupported-output',message:'Aqueous fractions require a supported 1D sweep.'}]})
  if (!isPrepared(system) || !isGridResult(grid) || grid.systemId !== system.id || grid.status === 'invalidated-stale') return freeze({ok:false,diagnostics:[{code:'unsupported-output',message:'Matching prepared system and non-invalidated branded grid required.'}]})
  return deriveAcceptedOutputs(system, grid, request)
}
// Shared formulas from Phase 7; dimensionality changes coordinates, not chemistry.
function deriveAcceptedOutputs(system, sweep, request) {
  const reject = message => freeze({ ok: false, diagnostics: [{ code: 'unsupported-output', message }] })
  const spec = outputDefinitions[request?.type]
  if (!spec) return reject('This legacy output has no validated Phase 7 transformation.')
  const catalog = products(system), n = system.components.length
  const component = system.components.findIndex(c => c.id === request.componentId)
  if (['fraction', ...componentOutputTypes].includes(request.type) && (component < 0 || system.components[component].suppressed || ['fraction','log-solubility'].includes(request.type) && system.products.some(p => p.coefficients[component] < 0))) return reject('Choose a nonsuppressed component; distribution fractions require nonnegative inventory coefficients.')
  const special = request.type === 'calculated-pH' ? system.components.findIndex(c => c.role === 'proton') : system.components.findIndex(c => c.role === 'electron')
  if (['calculated-pH', 'calculated-redox'].includes(request.type) && special < 0) return reject('Required proton/electron component is absent.')
  if (request.type === 'calculated-redox' && !['pe', 'Eh'].includes(request.redoxQuantity)) return reject('Choose pe or Eh explicitly.')
  const solubility = request.type === 'saturated-log-solubility' ? solubilityApplicability(system, request.componentId) : null
  if (solubility && !solubility.ok) return reject(solubility.reason)
  const scalar = scalarOutputTypes.includes(request.type)
  if (['total-dissolved','log-total-dissolved','analytical-total'].includes(request.type) && system.components[component].role !== 'ordinary') return reject('Component inventory output requires an ordinary component; signed proton/electron bookkeeping balances are not this quantity.')
  const selected = scalar ? [{ id: request.type, name: componentOutputTypes.includes(request.type) ? (solubility ? (solubility.solidIds.length>1?'Total dissolved at accepted solid saturation: ':`Solubility at ${solubility.solidName} saturation: `) : request.type === 'analytical-total' ? 'Supplied analytical total ' : 'Total dissolved ') + system.components[component].name : request.type === 'calculated-pH' ? 'pH' : request.redoxQuantity, phase: 'derived', kind: 'derived', provenance: 'calculated' }]
    : request.type === 'solid-amount' ? catalog.filter(s => s.phase === 'solid') : request.type === 'concentration' ? catalog.filter(s => s.phase === 'aqueous' && s.kind !== 'special') : catalog
  const unit = request.type === 'calculated-redox' ? request.redoxQuantity === 'Eh' ? 'V-SHE' : 'dimensionless' : spec.unit
  const label = solubility ? `Log total dissolved ${system.components[component].name} · equilibrium with an accepted saturated solid` : request.type === 'fraction' ? `Component fraction: ${system.components[component].name}` : componentOutputTypes.includes(request.type) ? `${request.type === 'analytical-total' ? 'Supplied analytical total' : request.type === 'total-dissolved' ? 'Total dissolved' : 'Log total dissolved'} ${system.components[component].name}` : request.type === 'calculated-redox' ? `Calculated ${request.redoxQuantity}` : spec.label
  const series = selected.map(species => ({ id: species.id, name: isClosedReagentPlot(sweep)&&species.id===sweep.closed.axis.reagentId?'Residual equilibrium '+species.name:species.name, phase: species.phase, kind: species.kind, provenance: species.provenance,
    points: sweep.outcomes.map(outcome => {
      const base = { index: outcome.index, x: outcome.coordinate, pointStatus: outcome.status, diagnostic:outcome.diagnostics?.[0]?.message??null, revision:sweep.revision,runDisposition:outcome.diagnostics?.[0]?.code??null, ...(sweep.kind==='grid'?{y:outcome.y,ix:outcome.ix,iy:outcome.iy,pointId:outcome.pointId,revision:sweep.revision,runDisposition:outcome.diagnostics?.[0]?.code??null}:{}) }
      const r = outcome.result
      if (outcome.status !== 'converged' || outcome.scientificAcceptance !== 'passed' || !isSuccessfulPointResult(r) || r.systemId !== sweep.systemId || r.inputId !== outcome.input?.id || r.revision !== sweep.revision) return { ...base, ...gap(outcome.status === 'converged' ? 'unaccepted-point' : outcome.status) }
      const index = catalog.findIndex(s => s.id === species.id)
      let value
      switch (request.type) {
        case 'saturated-log-solubility': value = saturatedLogSolubility(system, r, request.componentId); break
        case 'concentration': value = r.linearConcentrationStatus?.[index]==='positive-underflow' ? gap('positive-trace-use-retained-log-concentration') : finite(r.concentrations[index]); break
        case 'solid-amount': value = finite(r.solids.find(s => s.id === species.id)?.amount); break
        case 'total-dissolved': value = r.dissolvedComponentAmounts[component]===0&&Number.isFinite(r.dissolvedComponentLogAmounts?.[component]) ? gap('positive-trace-use-retained-log-concentration') : dissolvedOutputValue(r.dissolvedComponentAmounts[component]); break
        case 'log-total-dissolved': value = Number.isFinite(r.dissolvedComponentLogAmounts?.[component]) ? finite(r.dissolvedComponentLogAmounts[component]) : dissolvedOutputValue(r.dissolvedComponentAmounts[component], true); break
        case 'analytical-total': value = outcome.input.constraints[component].kh === 1 ? finite(outcome.input.constraints[component].value) : gap('activity-controlled-component-has-no-supplied-total'); break
        case 'log-concentration': value = logConcentrationValue(system,r,index); break
        case 'log-activity': {
          const solid = r.solids.find(s => s.id === species.id)
          value = solid ? solid.status === 'present' ? finite(0) : gap('absent-solid-activity-unavailable') : finite(r.logActivities[index]); break
        }
        case 'log-solubility': value = Number.isFinite(r.dissolvedComponentLogAmounts?.[component]) ? finite(r.dissolvedComponentLogAmounts[component]) : logarithm(r.dissolvedComponentAmounts[component]); break
        case 'fraction': {
          const coefficient = index < n ? Number(index === component) : system.products[index - n].coefficients[component]
          if(coefficient!==0&&r.linearConcentrationStatus?.[index]==='positive-underflow'){value=gap('positive-trace-use-retained-log-concentration');break}
          value = r.componentTotals[component] > 0 ? finite(coefficient * r.concentrations[index] / r.componentTotals[component]) : gap('nonpositive-total-fraction-undefined'); break
        }
        case 'calculated-pH': value = finite(-r.logActivities[special]); break
        case 'calculated-redox': value = finite(request.redoxQuantity === 'pe' ? -r.logActivities[special] : r.logActivities[special] / toSourceInput({ mode: 'LA', quantity: 'Eh', unit: 'V-SHE' }, 1, r.temperatureC).value); break
      }
      const linearValue = solubility ? value.linearValue : request.type === 'analytical-total' ? value.value : ['log-concentration','concentration','solid-amount'].includes(request.type) ? (index < n && system.components[index].suppressed ? null : r.concentrations[index]) : componentOutputTypes.includes(request.type) ? r.dissolvedComponentAmounts[component] : null
      return { ...base, ...value, ...(solubility?{saturationTrace:{controllingSolidId:value.solidId??null,solids:r.solids,logValue:value.value,linearValue:value.linearValue,reason:value.reason}}:{}), linearValue: Number.isFinite(linearValue) ? linearValue : null, linearUnit: Number.isFinite(linearValue) ? 'mol/kg-H2O' : null, ...(r.numericalRepresentation?{numericalRepresentationVersion:r.numericalRepresentation.version,linearValueStatus:r.linearConcentrationStatus?.[index]??'component-inventory-approximation',retainedLogConcentration:r.logConcentrations?.[index]??null}:{}) }
    }) }))
  const body = { ok: true, schemaVersion: 1, transformationVersion: 'derived-1d-1', request: structuredClone(request), series,
    metadata: { systemId: sweep.systemId, sweepId: sweep.sweepId, ...(sweep.kind==='grid'?{gridId:sweep.gridId,axes:sweep.definition.axes,shape:sweep.shape,order:sweep.order}:{}), revision: sweep.revision, runStatus: sweep.status,
      axis: sweep.definition.axis, fixedConditions: sweep.definition.fixedConditions, conditions: { temperature: sweep.definition.calculationDefinition.temperature, pressure: sweep.definition.calculationDefinition.pressure, activityModel: sweep.definition.calculationDefinition.activityModel, ionicStrength: sweep.definition.calculationDefinition.ionicStrength },
      componentNames: Object.fromEntries(system.components.map(c => [c.id, c.name])), sourceIdentity: sweep.sourceIdentity, method: sweep.method,
      output: { ...spec, ...(solubility ? { applicability: solubility } : {}), label, type: request.type, unit, componentId: ['fraction',...componentOutputTypes].includes(request.type) ? request.componentId : null, redoxQuantity: request.type === 'calculated-redox' ? request.redoxQuantity : null }, warnings: [...sweep.warnings, 'Derived display values are separate from raw solver quantities; Logarithms of zero amounts and unavailable quantities remain gaps.'] } }
  body.series = body.series.map(s => ({...s, descriptor:outputDescriptor(request.type,s,body.metadata.output)}))
  const derived = freeze(body)
  derivedResults.add(derived); return derived
}


function deriveMixedSolubility(system,sweep,request) {
  const check=validateOutputRequest(system,request)
  if(!check.ok) return freeze(check)
  if(sweep.definition.axis.quantity!=='pH') return freeze({ok:false,diagnostics:[{code:'unsupported-output',message:'Mixed solubility requires a pH axis.'}]})
  const outputs=request.componentIds.map(componentId=>deriveAcceptedOutputs(system,sweep,{type:request.type,componentId}))
  const failure=outputs.find(o=>!o.ok); if(failure) return failure
  const series=outputs.map((o,k)=>{
    const componentId=request.componentIds[k], scope=solubilityApplicability(system,componentId)
    const name='Total dissolved '+system.components[scope.index].name
    return {...o.series[0],id:componentId,name,descriptor:{...o.series[0].descriptor,seriesId:componentId,componentId},points:o.series[0].points.map((p,index)=>{
      const outcome=sweep.outcomes[index], r=outcome.result
      const accepted=outcome.scientificAcceptance==='passed' && isSuccessfulPointResult(r) && r.inputId===outcome.input?.id && r.systemId===system.id && r.revision===sweep.revision
      const contributors=scope.contributors.map(c=>{
        const j=system.speciesIds.indexOf(c.id), molality=accepted?r.concentrations[j]:null
        return {...c,molality,weightedMolality:molality===null?null:molality*c.coefficient}
      })
      return {...p,trace:{component:system.components[scope.index].name,componentId,solid:accepted?r.solids.filter(s=>scope.solidIds.includes(s.id)&&['present','saturated-zero-amount'].includes(s.status)).map(s=>s.name).join(', ')||'No relevant saturated solid':'Equilibrium unavailable',
        contributors,weightedDissolvedTotal:accepted?r.dissolvedComponentAmounts[scope.index]:null,logSolubility:p.value,unavailableReason:p.reason,
        activeAssemblage:accepted?r.solids.filter(s=>s.amount>0).map(s=>s.name):null,solids:accepted?r.solids:null,residuals:accepted?r.residuals:null,selection:accepted?r.assemblageSelection:null,attempts:r?.attempts??[],diagnostics:outcome.diagnostics,
        inputId:outcome.input?.id??null,systemId:system.id,revision:sweep.revision}}
    })}
  })
  const changes=[]
  for(let i=1;i<sweep.outcomes.length;i++){
    const a=series[0].points[i-1].trace.activeAssemblage,b=series[0].points[i].trace.activeAssemblage
    if(a&&b&&JSON.stringify(a)!==JSON.stringify(b)) changes.push({index:i,previousX:sweep.coordinates[i-1],x:sweep.coordinates[i],from:a,to:b})
  }
  const body={...outputs[0],request:structuredClone(request),series,metadata:{...outputs[0].metadata,phaseChanges:changes,output:{type:request.type,label:'Log total dissolved component · saturated',unit:'log10(m / (mol/kg-H2O))',formula:'One shared mixed equilibrium at each pH; coefficient-weighted aqueous component totals, excluding solids. Each curve requires a relevant saturated pure solid. Unsaturated or invalid samples are gaps; their accepted dissolved totals remain inspectable.'}}}
  const result=freeze(body); derivedResults.add(result); return result
}


function deriveAqueousFractions(system,sweep,request,currentRevision) {
  const scope=aqueousFractionScope(system,request.componentId)
  if(!scope.ok || (!['pH','Eh','total'].includes(sweep.definition.axis.quantity)&&!isClosedReagentPlot(sweep))) return freeze({ok:false,diagnostics:[{code:'unsupported-output',message:scope.reason??'Aqueous fractions require a 1D pH, imposed-Eh or analytical-total sweep.'}]})
  const stale=currentRevision!==sweep.revision
  const samples=sweep.outcomes.map(o=>{
    const r=o.result, accepted=!stale && o.status==='converged' && o.scientificAcceptance==='passed' && isSuccessfulPointResult(r) && r.systemId===system.id && r.inputId===o.input?.id && r.revision===sweep.revision
    const state=accepted?aqueousFractionState(system,r,request.componentId):{ok:false,reason:stale?'stale-aqueous-fraction':o.status==='converged'?'unaccepted-point':o.status}
    return {state,trace:{component:isClosedReagentPlot(sweep)&&scope.component.id===system.components[0].id?'Fe':scope.component.name,componentId:scope.component.id,equilibriumStatus:stale?'stale':o.status,reason:state.reason,revision:sweep.revision,inputId:o.input?.id??null,systemId:system.id,
      totalDissolved:state.totalDissolved??null,contributors:state.contributors??scope.contributors.map(c=>({...c,molality:null,weightedMolality:null,fraction:null})),sumFractions:state.sumFractions??null,
      activeAssemblage:accepted?r.solids.filter(s=>s.amount>0).map(s=>s.name):null,solids:accepted?r.solids:null,residuals:accepted?r.residuals:null,selection:accepted?r.assemblageSelection:null,attempts:r?.attempts??[],diagnostics:o.diagnostics}}
  })
  const series=scope.contributors.map(c=>({id:c.id,name:c.name,phase:'aqueous',kind:c.kind,provenance:'calculated',points:samples.map(({state,trace},i)=>({index:i,x:sweep.coordinates[i],value:state.ok?state.contributors.find(row=>row.id===c.id).fraction:null,reason:state.reason,pointStatus:sweep.outcomes[i].status,revision:sweep.revision,diagnostic:state.ok?null:state.reason,fractionTrace:trace}))}))
  const base=deriveAcceptedOutputs(system,sweep,{type:'concentration'})
  const output={...outputDefinitions['aqueous-fraction'],type:'aqueous-fraction',componentId:scope.component.id,label:'Aqueous speciation · dissolved '+(isClosedReagentPlot(sweep)&&scope.component.id===system.components[0].id?'Fe (all admitted oxidation states)':scope.component.name),numerics:aqueousFractionNumerics}
  const body={...base,request:structuredClone(request),series:series.map(s=>({...s,descriptor:outputDescriptor('aqueous-fraction',s,output)})),metadata:{...base.metadata,runStatus:stale?'invalidated-stale':sweep.status,output,defaultYRange:[0,1]}}
  const derived=freeze(body);derivedResults.add(derived);return derived
}

function deriveTotalFractions(system,sweep,request,currentRevision){
 const scope=totalFractionScope(system,request.componentId)
 if(!scope.ok)return freeze({ok:false,diagnostics:[{code:'unsupported-output',message:scope.reason}]})
 const samples=sweep.outcomes.map(o=>{
  const accepted=currentRevision===sweep.revision&&o.status==='converged'&&o.scientificAcceptance==='passed'&&o.result?.revision===sweep.revision
  return accepted?totalFractionState(system,o.input,o.result,request.componentId):{ok:false,reason:currentRevision!==sweep.revision?'stale-total-fraction':o.status}
 })
 const series=scope.contributors.map(c=>({...c,provenance:'calculated',points:samples.map((state,i)=>({index:i,x:sweep.coordinates[i],value:state.ok?state.contributors.find(r=>r.id===c.id).fraction:null,reason:state.reason,pointStatus:sweep.outcomes[i].status,revision:sweep.revision,fractionTrace:{component:isClosedReagentPlot(sweep)&&scope.component.id===system.components[0].id?'Fe':scope.component.name,...state},dissolvedFraction:state.ok?state.contributors.find(r=>r.id===c.id).dissolvedFraction:null}))}))
 const base=deriveAcceptedOutputs(system,sweep,{type:'concentration'}),output={...outputDefinitions['total-fraction'],type:'total-fraction',componentId:scope.component.id,label:'Total fractions · '+(isClosedReagentPlot(sweep)&&scope.component.id===system.components[0].id?'Fe (all admitted oxidation states)':scope.component.name)}
 const body={...base,request:structuredClone(request),series:series.map(s=>({...s,descriptor:outputDescriptor('total-fraction',s,output)})),metadata:{...base.metadata,output,defaultYRange:[0,1],runStatus:currentRevision===sweep.revision?sweep.status:'invalidated-stale'}}
 const derived=freeze(body);derivedResults.add(derived);return derived
}

