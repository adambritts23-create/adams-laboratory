/** Offline Mn–H–O audit only. Not imported by the public application. */
import fs from 'node:fs'
import { prepareChemicalSystem } from '../../src/solver/models.js'
import { fixedElectronPolicy, ehToPe } from '../../src/solver/redox.js'
import { multiSolidPolicy } from '../../src/solver/assemblages.js'
export const database = JSON.parse(fs.readFileSync(new URL('../../public/data/thermodynamic-default.json',import.meta.url)))
export const basis=['Mn 2+','H+','e-','H2O']
export const conversion=database.species.find(s=>s.name==='Mn 3+')
const terms=s=>s.metadata?.effectiveSourceReaction?.components??[]
const allowed=[...basis,'Mn 3+']
// Independently transcribed product atom counts (Mn,H,O), not discovery-element metadata.
export const atoms={ 'Mn 3+':[1,0,0], 'Mn(cr)':[1,0,0], 'Mn(OH)2':[1,2,2], 'Mn(OH)2(am)':[1,2,2],
 'Mn(OH)3-':[1,3,3], 'Mn(OH)4-2':[1,4,4], 'Mn2(OH)3+':[2,3,3], 'Mn2OH+3':[2,1,1],
 'Mn3O4(s)':[3,0,4], 'MnO(cr)':[1,0,1], 'MnO2(s)':[1,0,2], 'MnO4 2-':[1,0,4],
 'MnO4-':[1,0,4], 'MnO4-3':[1,0,4], 'MnOH+':[1,1,1], 'a-MnOOH(s)':[1,1,2],
 'Mn(OH)2+':[1,2,2], 'Mn2O3(cr)':[2,0,3], 'MnOH+2':[1,1,1] }
export const inventory=database.species.filter(s=>s.name.includes('Mn')||s.discoveryElements?.includes('Mn')||terms(s).some(c=>c.name.includes('Mn')))
export const audit=inventory.map(s=>{
 const foreign=terms(s).filter(c=>!allowed.includes(c.name)).map(c=>c.name)
 const reason=s.name==='Mn 2+'?'basis-identity-reverse-reaction':!terms(s).length?'missing-reaction':foreign.length?'outside-Mn-H-O-components':!['aqueous','solid'].includes(s.phase)?'unsupported-phase':!Number.isFinite(s.logK)?'missing-constant':'included'
 return {id:s.id,name:s.name,phase:s.phase,charge:s.charge,logK:s.logK,reaction:terms(s),reason,foreignComponents:foreign,provenance:s.provenance}
})
export const included=inventory.filter(s=>audit.find(a=>a.id===s.id).reason==='included')
export function compile(record){
 const coefficients=basis.map(name=>terms(record).filter(c=>c.name===name).reduce((sum,c)=>sum+c.coefficient,0))
 const factor=terms(record).filter(c=>c.name==='Mn 3+').reduce((sum,c)=>sum+c.coefficient,0)
 if(factor)basis.forEach((name,i)=>{coefficients[i]+=factor*(terms(conversion).find(c=>c.name===name)?.coefficient??0)})
 const logBeta=record.logK+factor*conversion.logK
 const [mn,h,e,w]=coefficients, expected=atoms[record.name]
 if(!expected||mn!==expected[0]||h+2*w!==expected[1]||w!==expected[2]||2*mn+h-e!==record.charge)throw Error('Atom/charge audit failed: '+record.name)
 return {id:record.id,name:record.name,phase:record.phase,coefficients,logBeta,sourceRecord:{kind:'offline-audited-explicit-reaction',original:record.provenance,
 conversion:factor?{factor,record:conversion.provenance,operation:'source row + factor times Mn3+ formation row; logBeta adds identically'}:null}}
}
export function specification(){return {basisStatus:'explicit-direct',redoxPolicy:fixedElectronPolicy,solidPolicy:multiSolidPolicy,
 components:basis.map((name,i)=>({id:name,name,role:['ordinary','proton','electron','water'][i]})),products:included.map(compile),
 unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{kind:'offline-Mn-H-O-audit',revision:database.sourceRevision,records:included.map(s=>s.id),conversionId:conversion.id}}}
export async function prepare(){const p=await prepareChemicalSystem(specification());if(!p.ok)throw Error(JSON.stringify(p));return p.system}
/** Independent source-coordinate reconstruction. Does not evaluate compiled solver rows. */
export function sourceAmount(record,free,pH,pe){
 const logMn3=Math.log10(free)+conversion.logK+pe
 const logs={'Mn 2+':Math.log10(free),'Mn 3+':logMn3,'H+':-pH,'e-':-pe,H2O:0}
 return 10**(record.logK+terms(record).reduce((sum,c)=>sum+c.coefficient*logs[c.name],0))
}
export function analytical(pH,pe,total=.001){
 // All included aqueous products are monomers or dimers. T=A*a+B*a^2.
 let A=1,B=0
 for(const r of included.filter(s=>s.phase==='aqueous')){
 const n=atoms[r.name][0],factor=sourceAmount(r,1,pH,pe)
 if(n===1)A+=factor;else if(n===2)B+=2*factor;else throw Error('Quadratic oracle domain exceeded')
 }
 const root=2*total/(A+Math.sqrt(A*A+4*B*total))
 const caps=included.filter(s=>s.phase==='solid').map(r=>({id:r.id,name:r.name,logFreeCap:-Math.log10(sourceAmount(r,1,pH,pe))/atoms[r.name][0]})).sort((a,b)=>a.logFreeCap-b.logFreeCap)
 const free=Math.min(root,10**caps[0].logFreeCap)
 const aqueous=[{id:'Mn 2+',name:'Mn 2+',coefficient:1,molality:free,weightedMolality:free},...included.filter(s=>s.phase==='aqueous').map(r=>{
 const molality=sourceAmount(r,free,pH,pe),coefficient=atoms[r.name][0];return {id:r.id,name:r.name,coefficient,molality,weightedMolality:coefficient*molality}
 })]
 const dissolved=aqueous.reduce((sum,r)=>sum+r.weightedMolality,0)
 return {free,aqueous,dissolved,caps,solid:free<root?{...caps[0],amount:(total-dissolved)/atoms[caps[0].name][0]}:null}
}
export const classificationCriterion={id:'sampled-Mn-inventory-and-assemblage-v1',meaning:'Accepted pure-solid assemblage and full aqueous Mn inventory; inventory leader is not a global stability label.',tieRule:'Exact numeric maxima only; full inventory retained, no near-equality tolerance or phase-boundary interpolation.',threshold:null}
export const inventoryLeaders = rows => { const maximum=Math.max(...rows.map(a=>a.weightedMolality));return rows.filter(a=>a.weightedMolality===maximum).map(a=>a.id) }
export function classify(system,outcome,current=true){
 if(!current||outcome.status!=='converged'||!outcome.result?.ok)return {status:!current?'stale':outcome.diagnostics?.some(d=>d.code==='ambiguous-solid-assemblage')?'ambiguous':outcome.status??'unsupported',criterion:classificationCriterion,aqueous:null,solids:null,leaders:null,diagnostics:outcome.diagnostics??[]}
 const r=outcome.result,n=system.components.length
 const aqueous=[{id:system.components[0].id,name:system.components[0].name,coefficient:1,molality:r.concentrations[0],weightedMolality:r.concentrations[0]},...system.aqueousRows.map(j=>({id:system.products[j].id,name:system.products[j].name,coefficient:system.products[j].coefficients[0],molality:r.concentrations[n+j],weightedMolality:system.products[j].coefficients[0]*r.concentrations[n+j]}))]
 const solids=r.solids.map(s=>({...s,coefficient:system.products.find(p=>p.id===s.id).coefficients[0],weightedMolality:system.products.find(p=>p.id===s.id).coefficients[0]*s.amount}))
 const leaders=inventoryLeaders([...aqueous,...solids])
 return {status:'accepted',criterion:classificationCriterion,aqueous,solids,leaders,exactInventoryTie:leaders.length>1,
 assemblage:solids.filter(s=>s.amount>0).map(s=>s.id),mixedAqueousAndSolid:solids.some(s=>s.amount>0)&&aqueous.some(s=>s.molality>0),dissolvedMolality:aqueous.reduce((sum,a)=>sum+a.weightedMolality,0)}
}
export function coordinates(outcome){return {pH:outcome.x,Eh:outcome.y,pe:ehToPe(outcome.y),referenceElectrode:'SHE',potentialUnit:'V',temperatureC:25,logProtonActivity:-outcome.x,logElectronActivity:-ehToPe(outcome.y)}}
import { createCalculationDefinition } from '../../src/calculations/definition.js'
export function gridDefinition(system){
 const chemical={selectedComponents:system.components.map(c=>c.id),selectedSpecies:system.products.map(p=>p.id),temperature:25,pressure:1,enabledPhases:['aqueous','solid','liquid']}
 const d=createCalculationDefinition(chemical,{getComponentById:id=>{const c=system.components.find(c=>c.id===id);return {...c,role:c.role==='ordinary'?'basis-choice':c.role==='water'?'solvent':c.role}}})
 d.componentConditions=[{componentId:'Mn 2+',mode:'T',quantity:'total',unit:'mol/kg-H2O',value:.001},{componentId:'H2O',mode:'LA',quantity:'log-activity',unit:'dimensionless',value:0}]
 d.independentVariables=[{componentId:'H+',mode:'LAV',quantity:'pH',unit:'dimensionless',range:{min:0,max:14},points:15},{componentId:'e-',mode:'LAV',quantity:'Eh',unit:'V-SHE',range:{min:-1.5,max:1.5},points:13}]
 return d
}
