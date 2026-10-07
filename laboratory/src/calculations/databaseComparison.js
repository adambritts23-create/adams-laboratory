import {compileLibrary,selectDatabaseSources,equation,reactionSignature} from '../thermodynamics/databaseLibrary.js'
import {discoverReactionSet} from '../thermodynamics/compatibility.js'
import {constructEquilibrium} from '../thermodynamics/equilibriumConstructor.js'
import {createSweepDefinition,runSweep} from './sweep.js'
import {deriveOutputs} from './outputs.js'

export const comparisonKey=s=>`${s.name.replace(/\s/g,'')}|${s.phase}`
const fail=message=>{throw Error(message)}
export function comparisonSession(session,source,target){
 const d=structuredClone(session.calculationDefinition),system=structuredClone(session.chemicalSystem)
 if(d.independentVariables.length!==1||d.independentVariables[0].quantity!=='pH'||d.independentVariables[0].mode!=='LAV')fail('Comparison currently supports one imposed-pH axis. Your 3D and other calculations remain available in the normal workspace.')
 if(d.closedReagents||d.imposedEh||d.pourbaix||d.publicFePourbaix||d.solubilityComparison||d.mixedSolubility)fail('Use an ordinary pH speciation calculation for database comparison.')
 if(system.speciesPolicy==='manual'||system.solidPhasePolicy==='manual')fail('Comparison requires automatic species and solid selection.')
 const mappings=[],ids=new Map()
 for(const id of system.selectedComponents){
  const c=source.getComponentById(id)
  if(!c||c.role==='electron')fail('Comparison does not yet map redox or missing components.')
  let other=target.getComponents().find(t=>t.name===c.name)
  if(!other){
   const family=[['NH3','NH4+'],['CO3 2-','HCO3-']].find(a=>a.includes(c.name))
   const condition=d.componentConditions.find(t=>t.componentId===id)
   if(family&&condition?.mode==='T'&&!condition.massInput)other=target.getComponents().find(t=>family.includes(t.name))
  }
  if(!other)fail(`The comparison database has no compatible component for ${c.name}. No zero concentration was substituted.`)
  ids.set(id,other.id);mappings.push({from:c.name,to:other.name})
 }
 const map=id=>ids.get(id)??fail('Unmapped component in calculation.')
 system.selectedComponents=system.selectedComponents.map(map)
 const excluded=(system.excludedSpecies??[]).map(id=>source.getSpeciesById(id)).filter(Boolean)
 system.excludedSpecies=target.getSpecies().filter(s=>excluded.some(e=>comparisonKey(e)===comparisonKey(s))).map(s=>s.id)
 system.selectedSpecies=[]
 system.selectedSpecies=discoverReactionSet(target,system).selectedSpecies
 d.componentConditions=d.componentConditions.map(c=>({...c,componentId:map(c.componentId)}))
 d.independentVariables=d.independentVariables.map(c=>({...c,componentId:map(c.componentId)}))
 d.output={type:'log-concentration',speciesIds:[],componentId:null,referenceSpeciesId:null}
 return {snapshot:{...session,chemicalSystem:system,calculationDefinition:d},mappings,ids}
}
export async function runDatabaseComparison({base,library,source,session,collectionIds},control={}){
 if(collectionIds.length!==2||collectionIds[0]===collectionIds[1])fail('Choose two different databases.')
 const runs=[]
 for(const id of collectionIds){
  if(control.signal?.aborted)fail('Comparison cancelled.')
  const compiled=compileLibrary(base,selectDatabaseSources(base,library,[id]))
  if(compiled.conflicts.some(c=>!c.winner))fail('Resolve conflicts within each selected collection before comparing.')
  const repo=compiled.repository,{snapshot,mappings,ids}=comparisonSession(session,source,repo)
  const p=await constructEquilibrium(repo,{adapter:'ordinary',session:snapshot,options:{sweep:true}})
  if(!p.ok)fail(p.reason??p.diagnostics.map(d=>d.message).join(' '))
  const def=await createSweepDefinition(p.system,snapshot.calculationDefinition,session.revision)
  if(!def.ok)fail(def.diagnostics.map(d=>d.message).join(' '))
  const sweep=await runSweep(p.system,def.sweep,{...control,chunkSize:2})
  if(control.signal?.aborted||control.isCurrent?.()===false)fail('Comparison cancelled or setup changed.')
  const derived=deriveOutputs(p.system,sweep,{type:'log-concentration'},{currentRevision:session.revision})
  if(!derived.ok)fail(derived.diagnostics.map(d=>d.message).join(' '))
  runs.push({id,name:id==='base'?'Spana / base':library.layers.find(l=>l.id===id).name,system:p.system,sweep,derived,mappings,componentIds:Object.fromEntries(ids),records:snapshot.chemicalSystem.selectedSpecies.map(id=>repo.getSpeciesById(id)).filter(Boolean)})
 }
 return {revision:session.revision,runs,differences:reactionDifferences(runs[0].records,runs[1].records)}
}
export function reactionDifferences(left,right){
 const keys=new Set([...left,...right].map(comparisonKey)),rows=[]
 for(const key of keys){
  const a=left.filter(s=>comparisonKey(s)===key),b=right.filter(s=>comparisonKey(s)===key)
  if(a.length===1&&b.length===1){const x=reactionSignature(a[0]),y=reactionSignature(b[0]);if(x?.key===y?.key&&Math.abs(x.logK-y.logK)<1e-10)continue}
  rows.push({name:(a[0]??b[0]).name,phase:(a[0]??b[0]).phase,status:!a.length?'Only in second':!b.length?'Only in first':a.length!==1||b.length!==1?'Multiple source records':reactionSignature(a[0])?.key===reactionSignature(b[0])?.key?'Different log K':'Different reaction basis',left:a.map(s=>({equation:equation(s),logK:s.logK,citation:s.citation})),right:b.map(s=>({equation:equation(s),logK:s.logK,citation:s.citation}))})
 }
 return rows
}
