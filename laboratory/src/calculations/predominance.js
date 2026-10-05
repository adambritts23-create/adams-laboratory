import { deriveGridOutputs } from './outputs.js'
import { freeze } from '../solver/models.js'

export const classificationPolicy = Object.freeze({ id:'largest-component-inventory-fraction-v1', experimental:true, pourbaixEnabled:false, tieTolerance:1e-10,
  definition:'Largest stoichiometrically weighted component inventory fraction, including the free component and any present candidate solid. This is selected-species inventory dominance, not general phase stability or validated Pourbaix classification.' })
export function classifyInventoryGrid(system, grid, componentId) {
  const output=deriveGridOutputs(system,grid,{type:'fraction',componentId})
  if(!output.ok)return output
  const ci=system.components.findIndex(c=>c.id===componentId)
  const candidates=output.series.filter((s,j)=>j<system.components.length?j===ci:system.products[j-system.components.length].coefficients[ci]>0)
  const points=grid.outcomes.map((p,i)=>{
    const entries=candidates.map(s=>({id:s.id,value:s.points[i].value}))
    if(entries.some(e=>e.value===null))return {index:i,x:p.x,y:p.y,status:'unavailable',winner:null,tiedIds:[],reason:output.series[0].points[i].reason??'unavailable-inventory'}
    const max=Math.max(...entries.map(e=>e.value)), tied=entries.filter(e=>max-e.value<=classificationPolicy.tieTolerance).map(e=>e.id)
    return {index:i,x:p.x,y:p.y,status:tied.length===1?'classified':'tie',winner:tied.length===1?tied[0]:null,tiedIds:tied,reason:null}
  })
  return freeze({ok:true,policy:classificationPolicy,candidates:candidates.map(({id,name,phase,provenance})=>({id,name,phase,provenance})),points,metadata:output.metadata})
}

/** Sampled aqueous predominance only: solids reported separately, never assigned priority. */
export const dissolvedFormPolicy = Object.freeze({ id: 'aqueous-component-fraction-v1', pourbaixEnabled: false, tieTolerance: 1e-10,
  definition: 'Largest coefficient-weighted aqueous contribution divided by total dissolved component. Ties remain ties; solids are separate state metadata; no interpolation or phase-stability claim.' })
export function classifyDissolvedFormGrid(system, grid, componentId) {
  const output = deriveGridOutputs(system, grid, { type: 'fraction', componentId })
  if (!output.ok) return output
  const ci = system.components.findIndex(c => c.id === componentId)
  if (system.components[ci]?.role !== 'ordinary') return freeze({ ok: false, diagnostics: [{ code: 'unsupported-classification', message: 'Ordinary nonnegative component inventory required.' }] })
  const candidates = output.series.filter((s, j) => s.phase === 'aqueous' && (j < system.components.length ? j === ci : system.products[j - system.components.length].coefficients[ci] > 0))
  const points = grid.outcomes.map((p, i) => {
    const base = { index: p.index, pointId: p.pointId, ix: p.ix, iy: p.iy, x: p.x, y: p.y, pointStatus: p.status, revision: grid.revision }
    const entries = candidates.map(s => ({ id: s.id, value: s.points[i].value }))
    const sum = entries.reduce((a, e) => a + (e.value ?? 0), 0)
    if (!entries.length || entries.some(e => e.value === null) || !(sum > 0)) return { ...base, status: 'unavailable', winner: null, tiedIds: [], reason: candidates[0]?.points[i].reason ?? 'nonpositive-dissolved-inventory', solids: [] }
    const fractions = entries.map(e => ({ id: e.id, value: e.value / sum }))
    const max = Math.max(...fractions.map(e => e.value)), tiedIds = fractions.filter(e => max - e.value <= dissolvedFormPolicy.tieTolerance).map(e => e.id)
    return { ...base, status: tiedIds.length === 1 ? 'classified' : 'tie', winner: tiedIds.length === 1 ? tiedIds[0] : null, tiedIds, fractions, reason: null, solids: p.result.solids }
  })
  return freeze({ ok: true, policy: dissolvedFormPolicy, candidates: candidates.map(({ id, name, phase, provenance }) => ({ id, name, phase, provenance })), points, metadata: output.metadata })
}
