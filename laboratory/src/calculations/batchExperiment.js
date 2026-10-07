import {sourceComponentMetadata} from '../thermodynamics/sourceComponentMetadata.js'
import {discoverReactionSet,automaticSpeciesPolicy,automaticSolidPolicy} from '../thermodynamics/compatibility.js'
import {createCalculationDefinition} from './definition.js'
import {constructEquilibrium} from '../thermodynamics/equilibriumConstructor.js'
import {solvePoint,isSuccessfulPointResult} from '../solver/point.js'
import {freeze} from '../solver/models.js'
import {wetLabCoordinateMetadata} from './wetLabSolutions.js'
import {sampleInventory} from '../beaker/sampleInventory.js'

const fail=message=>{throw Error(message)}
const sum=(a,b)=>Object.fromEntries([...new Set([...Object.keys(a),...Object.keys(b)])].map(id=>[id,(a[id]??0)+(b[id]??0)]))
function node(values){return freeze({id:crypto.randomUUID(),created:new Date().toISOString(),...values})}
export async function batchSource(repository){const m=await sourceComponentMetadata(repository);if(!m.ok)fail(m.diagnostics.map(d=>d.message).join(' '));return m.sourceFingerprint}
export function createBatchSample({name,moles,volumeMl,sourceFingerprint,sourceName},repository){
 if(!name.trim()||!Number.isFinite(volumeMl)||volumeMl<=0||!sourceFingerprint)fail('Enter a sample name and positive volume.')
 for(const [id,n] of Object.entries(moles)){const c=repository.getComponentById(id);if(!c||['solvent','electron'].includes(c.role)||!Number.isFinite(n)||(n<0&&c.role!=='proton'))fail('Use finite nonnegative component amounts; only proton equivalents may be negative.')}
 return node({name:name.trim(),kind:'solution',moles:{...moles},volumeMl,modelSolventMassKg:volumeMl/1000,sourceFingerprint,sourceName,parents:[],operation:'Create sample',equilibrium:null})
}
export function addBatchReagent(sample,reagent){
 if(sample.sourceFingerprint!==reagent.sourceFingerprint)fail('Samples use different database snapshots. Recreate the reagent with the sample’s database.')
 return node({name:`${sample.name} + ${reagent.name}`,kind:'mixture',moles:sum(sample.moles,reagent.moles),volumeMl:sample.volumeMl+reagent.volumeMl,modelSolventMassKg:sample.modelSolventMassKg+reagent.modelSolventMassKg,sourceFingerprint:sample.sourceFingerprint,sourceName:sample.sourceName,phaseScope:sample.phaseScope,parents:[sample.id,reagent.id],operation:'Add reagent',equilibrium:null})
}
export async function equilibrateBatch(sample,repository){
 if(await batchSource(repository)!==sample.sourceFingerprint)fail('Switch back to this sample’s database before continuing. Its history has been retained.')
 if(!(sample.modelSolventMassKg>0))fail('Add water or a reagent solution to resuspend the retained solids first.')
 const required=repository.getComponents().filter(c=>['proton','solvent'].includes(c.role)||Object.hasOwn(sample.moles,c.id)).map(c=>c.id)
 let chemicalSystem={selectedComponents:required,selectedSpecies:[],enabledPhases:['aqueous','solid','liquid'],temperature:25,pressure:1,activityModel:'ideal',speciesPolicy:automaticSpeciesPolicy,solidPhasePolicy:automaticSolidPolicy,excludedSpecies:[],...sample.phaseScope,solvent:{speciesId:'component:H2O'}}
 chemicalSystem={...chemicalSystem,selectedSpecies:discoverReactionSet(repository,chemicalSystem).selectedSpecies}
 const definition=createCalculationDefinition(chemicalSystem,repository)
 definition.independentVariables=[]
 definition.componentConditions=required.map(id=>repository.getComponentById(id).role==='solvent'?{componentId:id,mode:'LA',quantity:'log-activity',unit:'dimensionless',value:0}:{componentId:id,mode:'T',quantity:'total',unit:'mol/kg-H2O',value:(sample.moles[id]??0)/sample.modelSolventMassKg})
 const prepared=await constructEquilibrium(repository,{adapter:'ordinary',session:{chemicalSystem,calculationDefinition:definition,revision:1}})
 if(!prepared.ok)fail(prepared.diagnostics.map(d=>d.message).join(' '))
 const result=solvePoint(prepared.system,prepared.input)
 if(!result.ok)fail(result.diagnostics.map(d=>d.message).join(' '))
 const equilibrium={ok:true,system:prepared.system,input:prepared.input,result}
 const p=prepared.system.components.findIndex(c=>c.role==='proton')
 return node({...sample,name:sample.name,parents:[sample.id],operation:'Equilibrate',equilibrium,pH:-result.logActivities[p],inventory:sampleInventory(equilibrium,sample.modelSolventMassKg),id:crypto.randomUUID(),created:new Date().toISOString()})
}
export function filterBatch(sample){
 const e=sample.equilibrium
 if(!e?.ok||!isSuccessfulPointResult(e.result))fail('Calculate and accept equilibrium before filtering.')
 const solids=e.result.solids.filter(s=>s.amount>0)
 if(!solids.length)fail('No precipitate is present to retain.')
 const residueMoles=Object.fromEntries(Object.keys(sample.moles).map(id=>[id,0]))
 for(const solid of solids){const p=e.system.products.find(p=>p.id===solid.id);e.system.components.forEach((c,i)=>{if(c.role!=='water')residueMoles[c.id]=(residueMoles[c.id]??0)+p.coefficients[i]*solid.amount*sample.modelSolventMassKg})}
 const filtrateMoles=sum(sample.moles,Object.fromEntries(Object.entries(residueMoles).map(([id,n])=>[id,-n])))
 for(const [id,n] of Object.entries(filtrateMoles)){const c=e.system.components.find(c=>c.id===id);if(c?.role==='ordinary'&&n<0){if(n< -1e-8*Math.max(1e-12,Math.abs(sample.moles[id]??0)))fail('Solid inventory exceeds supplied amount; filtration refused.');filtrateMoles[id]=0;residueMoles[id]=sample.moles[id]??0}}
 const common={sourceFingerprint:sample.sourceFingerprint,sourceName:sample.sourceName,phaseScope:sample.phaseScope,parents:[sample.id],equilibrium:null}
 return [node({...common,name:`${sample.name} · filtrate`,kind:'filtrate',operation:'Filter → filtrate',moles:filtrateMoles,volumeMl:sample.volumeMl,modelSolventMassKg:sample.modelSolventMassKg}),node({...common,name:`${sample.name} · solids`,kind:'solids',operation:'Filter → retained solids',moles:residueMoles,volumeMl:0,modelSolventMassKg:0,inventory:{solids:sample.inventory?.solids??[]}})]
}
export function batchBalance(inputs,outputs){
 const before=inputs.reduce((a,s)=>sum(a,s.moles),{}),after=outputs.reduce((a,s)=>sum(a,s.moles),{})
 return [...new Set([...Object.keys(before),...Object.keys(after)])].map(id=>({id,before:before[id]??0,after:after[id]??0,residual:(after[id]??0)-(before[id]??0)}))
}
export function equilibriumBalance(sample){
 const e=sample.equilibrium,moles={...sample.moles}
 if(!e?.ok)fail('Accepted equilibrium required for a solver balance.')
 e.system.components.forEach((c,i)=>{if(c.role!=='water')moles[c.id]=e.result.componentTotals[i]*sample.modelSolventMassKg})
 return batchBalance([sample],[{moles}])
}
export async function importWetLabBatch(state,repository,name='Wet Lab sample'){
 if(state?.status!=='accepted-v0'||!state.equilibrium?.ok||!isSuccessfulPointResult(state.equilibrium.result)||state.equilibrium.system.components.some(c=>c.role==='electron'))fail('An accepted acid/base Wet Lab sample is required.')
 const moles={}
 for(const [key,n] of Object.entries(state.mixture.moles)){const id=wetLabCoordinateMetadata[key]?.sourceId??key;moles[id]=(moles[id]??0)+n}
 const sample=createBatchSample({name,moles,volumeMl:state.mixture.volumeMl,sourceFingerprint:await batchSource(repository)},repository)
 return node({...sample,operation:'Import Wet Lab sample',phaseScope:state.chemicalSystem?{enabledPhases:state.chemicalSystem.enabledPhases,excludedSpecies:state.chemicalSystem.excludedSpecies??[]}:undefined,equilibrium:state.equilibrium,pH:state.pH,inventory:sampleInventory(state.equilibrium,sample.modelSolventMassKg)})
}
