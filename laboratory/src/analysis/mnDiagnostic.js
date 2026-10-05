import { numericalValidationContract as contract } from '../solver/validationContract.js'
import { freeze } from '../solver/models.js'
import { mnDiagnosticIdentity } from '../data/mnDiagnosticIdentity.js'
export const mnClassificationPolicy=Object.freeze({id:'Mn-diagnostic-interval-dominance-v1',absoluteMolality:contract.comparisonAbsoluteConcentrationTolerance,relativeMolality:contract.comparisonRelativeConcentrationTolerance,negligibleDissolved:contract.sourceAbsoluteBalanceFloor,meaning:'Overlapping numerical comparison intervals are unresolved ties, not exact thermodynamic equality; no phase boundaries inferred.'})
const compare=(a,b)=>a.id<b.id?-1:a.id>b.id?1:0
export function leaders(rows){
 const greatestLower=Math.max(...rows.map(r=>r.weightedMolality-r.comparisonBound))
 return rows.filter(r=>r.weightedMolality+r.comparisonBound>=greatestLower).map(r=>r.id).sort()
}
export function classifyMn(system,outcome,inventory,current=true){
 const unavailable=(status,reason)=>({status,reason,phaseCategory:status,dissolvedCategory:status,aqueous:[],oxidationStates:[],activeSolids:[],inactiveSolids:[],speciesLeaders:[],oxidationLeaders:[],policy:mnClassificationPolicy})
 if(!current)return unavailable('stale','Retained snapshot is not current; its original conditions must be shown.')
 if(!outcome.result?.ok||outcome.status!=='converged')return unavailable(outcome.diagnostics?.some(d=>d.code==='ambiguous-solid-assemblage')?'ambiguous':outcome.status??'unsupported',outcome.diagnostics?.map(d=>d.code).join(', ')||'No accepted state.')
 const r=outcome.result,meta=new Map(inventory.species.map(s=>[s.id,s])),component=system.components.findIndex(c=>c.id==='Mn 2+')
 if(component<0||r.systemId!==system.id)return unavailable('unsupported','Source/system identity mismatch.')
 const aqueous=[{id:'Mn 2+',molality:r.concentrations[component]},...system.aqueousRows.map(j=>({id:system.products[j].id,molality:r.concentrations[system.components.length+j]}))].map(row=>{
 const m=meta.get(row.id);return {...row,name:m?.name,coefficient:m?.coefficient,oxidationState:m?.oxidationState,weightedMolality:m?.coefficient*row.molality,comparisonBound:m?.coefficient*(mnClassificationPolicy.absoluteMolality+mnClassificationPolicy.relativeMolality*Math.abs(row.molality))}
 }).sort(compare)
 if(aqueous.some(a=>!Number.isFinite(a.weightedMolality)||a.weightedMolality<0||!Number.isFinite(a.oxidationState)))return unavailable('unsupported','Incomplete audited Mn contribution metadata.')
 const dissolved=aqueous.reduce((v,a)=>v+a.weightedMolality,0),groups=new Map()
 for(const a of aqueous){const id=String(a.oxidationState),g=groups.get(id)??{id,oxidationState:a.oxidationState,weightedMolality:0,comparisonBound:0,speciesIds:[]};g.weightedMolality+=a.weightedMolality;g.comparisonBound+=a.comparisonBound;g.speciesIds.push(a.id);groups.set(id,g)}
 const oxidationStates=[...groups.values()].sort(compare)
 const activeIds=r.assemblageSelection?.activeSolidIds
 const activeSolids=r.solids.filter(s=>s.status==='present'&&s.amount>0&&(!activeIds||activeIds.includes(s.id))).map(s=>({...s,coefficient:meta.get(s.id)?.coefficient})).sort(compare)
 if(r.solids.some(s=>s.amount>0&&!activeSolids.some(a=>a.id===s.id)))return unavailable('unsupported','Positive solid inventory is inconsistent with accepted active assemblage.')
 const inactiveSolids=r.solids.filter(s=>!activeSolids.some(a=>a.id===s.id)).map(s=>({...s})).sort(compare)
 const negligible=dissolved<=mnClassificationPolicy.negligibleDissolved,speciesLeaders=negligible?[]:leaders(aqueous),oxidationLeaders=negligible?[]:leaders(oxidationStates)
 const phaseCategory=activeSolids.length>1?'multiple-active-solids':activeSolids.length?'one-active-solid':'aqueous-only'
 const dissolvedCategory=negligible?'negligible-dissolved':speciesLeaders.length>1?'tied-mixed-dissolved':'predominant-dissolved-species'
 return {status:'accepted',phaseCategory,dissolvedCategory,dissolved,aqueous,oxidationStates,activeSolids,inactiveSolids,speciesLeaders,oxidationLeaders,policy:mnClassificationPolicy,
 reason:`${activeSolids.length} positive accepted Mn solid phase(s). ${negligible?'Dissolved Mn is at/below the existing absolute balance floor; normalized dominance is not assigned.':speciesLeaders.length>1?'Species comparison intervals overlap: unresolved dissolved tie.':'One species has a separated largest dissolved Mn contribution.'} Oxidation-state totals sum stoichiometrically weighted aqueous Mn.`,
 mixedAqueousAndSolid:activeSolids.length>0&&dissolved>0}
}
export async function loadMnSnapshot(evidenceText,inventoryText){
 const hash=async text=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(n=>n.toString(16).padStart(2,'0')).join('')
 if(await hash(evidenceText)!==mnDiagnosticIdentity.evidenceSha256||await hash(inventoryText)!==mnDiagnosticIdentity.inventorySha256)throw Error('Diagnostic evidence differs from the pinned validated snapshot. Re-audit before loading.')
 const evidence=JSON.parse(evidenceText),inventory=JSON.parse(inventoryText)
 if(evidence.system.id!==inventory.systemId||evidence.grid.counts.converged!==195)throw Error('Validated Mn snapshot identity/count mismatch.')
 return freeze({evidence,inventory,identity:mnDiagnosticIdentity})
}
export function classifySnapshot(snapshot,current=true){return snapshot.evidence.grid.outcomes.map(o=>({index:o.index,pH:o.x,Eh:o.y,pe:-o.input.constraints.find(c=>c.componentId==='e-').value,temperatureC:o.input.temperatureC,classification:classifyMn(snapshot.evidence.system,o,snapshot.inventory,current)}))}
export function mnDiagnosticExport(snapshot,mode,water,current=true){return JSON.stringify({kind:'sampled-Mn-diagnostic-export',snapshot,classification:classifySnapshot(snapshot,current),display:{mode,waterReferences:water},stale:!current,warning:'Sampled classifications, not refined boundaries. Original equilibrium data preserved.'},null,2)}
