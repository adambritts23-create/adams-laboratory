import { references, prepareReference } from './pointHelpers.js'
import { definitionFor, vary as varyOne } from './phase6Helpers.js'
import { createGridDefinition, runGrid } from '../src/calculations/grid.js'
export function vary(d,...args) { const next=varyOne(d,...args);next.independentVariables=[...d.independentVariables.filter(a=>a.componentId!==args[0]),...next.independentVariables];return next }
export async function gridFixture(name='fixed-activity', points=3) {
  const c = name==='pH-redox' ? (()=>{const a=references.cases.find(c=>c.id==='acid-base'),r=references.cases.find(c=>c.id==='redox');return {...a,components:[...a.components,...r.components],conditions:[...a.conditions,...r.conditions],sourceRecords:[...a.sourceRecords,...r.sourceRecords]}})() : references.cases.find(c=>c.id===name)
  const {system,input}=await prepareReference(c)
  let d=definitionFor(system,input)
  d=vary(d,system.components[0].id,'LAV',-7,-5,points)
  d=vary(d,system.components[1].id,'LAV',-4,-2,points)
  return {system,input,definition:d}
}
export async function calculateGrid(system,d,revision=0,options) {
  const prepared=await createGridDefinition(system,d,revision)
  if(!prepared.ok)throw new Error(JSON.stringify(prepared))
  return runGrid(system,prepared.grid,options)
}
