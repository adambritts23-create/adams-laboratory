import {searchComponentSystem} from './componentSearch.js'
import {repositoryReactionCatalog} from './compatibility.js'
import {prepareClosedRedox,solveClosedRedox,prepareClosedSolidExtension} from '../solver/closedRedox.js'
import {freeze,identity} from '../solver/models.js'
const preparedSet=new WeakSet(),resultSet=new WeakSet()
export const isClosedReagentResult=r=>resultSet.has(r)
const fail=(code,message,details={})=>freeze({ok:false,status:'unsupported',diagnostics:[{code,message}],...details})

/** Chemical reagent input -> source connectivity -> existing closed compiler.
 * A versioned explicit scope supplies identity metadata, never a reaction outcome.
 */
export async function prepareClosedReagents(repository,request,scope){
 if(!request||!scope||!request.amounts||Object.keys(request).some(k=>!['amounts','description','revision','basisIndex','temperatureC','pressureBar','activityModel','unit','physicalPreparation'].includes(k)))return fail('invalid-closed-reagents','Supply actual reagent amounts and conditions; no electron selection, Eh or pH reservoir.')
 if(request.temperatureC!==25||request.pressureBar!==1||request.activityModel!=='ideal'||request.unit!=='mol/kg-H2O'||!Number.isInteger(request.revision)||request.revision<0)return fail('closed-reagent-conditions','Only ideal 25 C, declared 1 bar and mol/kg-H2O are admitted.')
 const basisIds=scope.bases[request.basisIndex??0]
 if(!basisIds||typeof request.description!=='string'||!Object.keys(request.amounts).length||Object.entries(request.amounts).some(([id,n])=>!scope.metadata[id]||[scope.electronId,scope.waterId].includes(id)||!Number.isFinite(n)||n<0))return fail('invalid-reagent-inventory','Finite nonnegative physical reagent amounts only; electron and solvent totals are forbidden.')
 for(const domain of scope.inventoryDomain??[]){
  let value=0,scale=0
  for(const [id,amount] of Object.entries(request.amounts))for(const [element,weight] of Object.entries(domain.weights)){const term=amount*(scope.metadata[id].elements[element]??0)*weight;value+=term;scale+=Math.abs(term)}
  const roundoff=128*Number.EPSILON*scale
  if(value<domain.min-roundoff||value>domain.max+roundoff)return fail('reagent-inventory-outside-scope','Analytical inventory lies outside the reviewed reagent scope.',{inventory:domain.key,value,min:domain.min,max:domain.max})
 }
 const components=repository.getComponents(),byName=new Map(components.map(c=>[c.name,c])),rows=repositoryReactionCatalog(repository)
 const report={version:scope.version,status:scope.status,scope:scope.description,inputReagentIds:Object.keys(request.amounts),electronSelected:false,internalElectronId:scope.electronId,included:[],excluded:[]}
 for(const [id,digest] of Object.entries(scope.componentDigests))if(await identity(repository.getComponentById(id))!==digest)return fail('reagent-source-changed','A pinned component identity changed.',{discovery:report})
 const reached=new Set(Object.keys(request.amounts).map(id=>scope.metadata[id].name))
 for(const id of [scope.electronId,scope.waterId,scope.protonId])reached.add(scope.metadata[id].name)
 if(scope.componentSystemIds){const search=searchComponentSystem(repository,scope.componentSystemIds);if(!search.ok)return fail('invalid-component-system','Source search failed.');reached.clear();for(const id of [...search.expandedComponentIds,scope.waterId])reached.add(repository.getComponentById(id).name)}
 let changed=!scope.componentSystemIds
 while(changed){changed=false;for(const r of rows){const terms=r.metadata?.effectiveSourceReaction?.components;if(r.phase!=='aqueous'||scope.excludedReactionIds.includes(r.id)||!terms?.every(t=>!t.coefficient||reached.has(t.name)))continue;if(byName.has(r.name)&&!reached.has(r.name)){reached.add(r.name);changed=true}}}
 const eligible=rows.filter(r=>r.metadata?.effectiveSourceReaction?.components?.every(t=>!t.coefficient||reached.has(t.name)))
 const admitted=[]
 for(const r of eligible){
  if(r.phase!=='aqueous'||scope.excludedReactionIds.includes(r.id)){report.excluded.push({id:r.id,name:r.name,phase:r.phase,reason:r.phase!=='aqueous'?'phase-not-admitted':'explicit-conditional-scope-exclusion'});continue}
  const pin=scope.reactions[r.id]
  if(!pin||await identity(r)!==pin.digest)return fail('unreviewed-reagent-source','A discovered aqueous reaction is missing metadata or differs from its pinned source.',{recordId:r.id,discovery:report})
  admitted.push(r);report.included.push({id:r.id,name:r.name,phase:r.phase,reference:r.citation})
 }
 if(admitted.length!==Object.keys(scope.reactions).length)return fail('incomplete-reagent-source-scope','The reviewed reaction set is incomplete; missing records cannot retain this scope claim.',{discovery:report})
 const canonical=name=>byName.get(name)?.id??admitted.find(r=>r.name===name)?.id
 const used=new Set([...Object.keys(request.amounts),...basisIds,scope.electronId,scope.waterId])
 for(const r of admitted){used.add(canonical(r.name));for(const t of r.metadata.effectiveSourceReaction.components)if(t.coefficient)used.add(canonical(t.name))}
 if([...used].some(id=>!scope.metadata[id]))return fail('missing-reagent-metadata','Every admitted carrier requires explicit source-bound composition metadata.',{discovery:report})
 const species=[...used].map(id=>scope.metadata[id])
 const reactions=admitted.map(r=>({id:r.id,productId:canonical(r.name),terms:r.metadata.effectiveSourceReaction.components.map(t=>({id:canonical(t.name),coefficient:t.coefficient})),logK:r.logK,phase:r.phase,unit:{kind:'ideal-molal-standard'},provenance:{reference:r.citation,record:r.provenance}}))
 const input={mode:'closed-redox',conservationMethod:'source-exact-v1',sourceFingerprint:'5fece8b93a3a1fa9a845c73a775c21d0a323dd3853aebb8cb5efdd664943f68c',temperatureC:25,pressureBar:1,activityModel:'ideal',unit:request.unit,revision:request.revision,species,reactions,basisIds,electronId:scope.electronId,solvent:{kind:'fixed-water-activity',speciesId:scope.waterId,logActivity:0},preparation:{amounts:request.amounts,description:request.description,chargePolicy:'electroneutral',...(request.physicalPreparation?{physicalPreparation:request.physicalPreparation}: {})}}
 const prepared=await prepareClosedRedox(input)
 if(!prepared.ok)return freeze({...prepared,discovery:report})
 const value=freeze({ok:true,prepared,discovery:report,scopeId:await identity(scope),requestId:await identity(request),request:structuredClone(request)})
 preparedSet.add(value);return value
}

export async function extendClosedReagentSolids(prepared,solids){
 if(!preparedSet.has(prepared))return fail('unprepared-reagents','Use the branded aqueous reagent preparation.')
 const extended=await prepareClosedSolidExtension(prepared.prepared,solids)
 if(!extended.ok)return extended
 const value=freeze({...prepared,prepared:extended,scopeId:await identity({aqueousScope:prepared.scopeId,solids})})
 preparedSet.add(value);return value
}
function reactionRedistribution(prepared,solved){
 const {network}=prepared,metadata=new Map(network.sourceSpecies.map(s=>[s.id,s])),columns=[]
 const vector=r=>Object.fromEntries(network.sourceSpecies.map(s=>[s.id,(r.productId===s.id?(r.productCoefficient??1):0)-(r.terms.find(t=>t.id===s.id)?.coefficient??0)]))
 for(const c of network.cancellations){if(!Object.values(c.coefficients).some(n=>n!==0))continue;const sign=c.logK<0?-1:1;columns.push({kind:'redox',coefficients:Object.fromEntries(Object.entries(c.coefficients).map(([id,n])=>[id,n*sign])),logK:c.logK*sign,sourceIds:c.sourceIds,sourceMultipliers:c.multipliers.map(n=>n*sign),electrons:c.electronMultiple})}
 for(const r of network.ordinaryReactions)columns.push({kind:'ordinary',coefficients:vector(r),logK:r.logK,sourceIds:[r.id],sourceMultipliers:[1],electrons:0})
 const physical=[...network.physical,...(network.water?[network.water]:[])],delta=physical.map(s=>s.id===network.water?.id?-solved.inspection.waterBalance.waterToSolutes:solved.result.concentrations[solved.result.speciesIds.indexOf(s.id)]-(prepared.preparation.amounts[s.id]??0))
 const matrix=physical.map((s,i)=>[...columns.map(c=>c.coefficients[s.id]??0),delta[i]])
 let rank=0;const pivotRows=[]
 for(let col=0;col<columns.length;col++){let pivot=rank;for(let j=rank+1;j<matrix.length;j++)if(Math.abs(matrix[j][col])>Math.abs(matrix[pivot][col]))pivot=j;if(Math.abs(matrix[pivot]?.[col]??0)<128*Number.EPSILON)return {status:'unavailable',reason:'Dependent reaction extents; no unique source-reaction basis decomposition.'};[matrix[rank],matrix[pivot]]=[matrix[pivot],matrix[rank]];const d=matrix[rank][col];matrix[rank]=matrix[rank].map(n=>n/d);for(let j=0;j<matrix.length;j++)if(j!==rank){const m=matrix[j][col];matrix[j]=matrix[j].map((n,k)=>n-m*matrix[rank][k])}pivotRows.push(rank++)}
 const extents=pivotRows.map(row=>matrix[row].at(-1)),residuals=physical.map((s,i)=>columns.reduce((v,c,j)=>v+(c.coefficients[s.id]??0)*extents[j],0)-delta[i]),limit=Math.max(...solved.inspection.inventories.map(r=>r.limit))
 if(residuals.some(r=>!Number.isFinite(r)||Math.abs(r)>limit))return {status:'unavailable',reason:'Source-reaction extents do not reconstruct the accepted inventory change.',residuals,limit}
 const side=(coefficients,sign)=>Object.entries(coefficients).filter(([id,n])=>id!==network.electronId&&n*sign>0).map(([id,n])=>({id,name:metadata.get(id).name,coefficient:Math.abs(n)}))
 return {status:'available',meaning:'Algebraic source-reaction basis for thermodynamically predicted equilibrium redistribution; signed extents are not rates or a kinetic pathway.',residuals,limit,reactions:columns.map((c,i)=>({...c,reactants:side(c.coefficients,-1),products:side(c.coefficients,1),extent:extents[i],extentUnit:'mol/kg-H2O',halfReactionDirections:c.kind==='redox'?c.sourceIds.map((id,j)=>{const r=network.halves.find(r=>r.id===id),v=Object.fromEntries(Object.entries(vector(r)).map(([k,n])=>[k,n*c.sourceMultipliers[j]]));return {sourceId:id,reference:r.provenance.reference,role:r.terms.find(t=>t.id===network.electronId).coefficient*c.sourceMultipliers[j]>0?'reduction':'oxidation',reactants:side(v,-1),products:side(v,1)}}):[]}))}
}

export function solveClosedReagents(prepared){
 if(!preparedSet.has(prepared))return fail('unprepared-reagents','Use the branded reagent discovery/preparation path.')
 const solved=solveClosedRedox(prepared.prepared)
 if(!solved.ok)return freeze({...solved,discovery:prepared.discovery})
 const carriers=prepared.prepared.network.physical.map(s=>({id:s.id,name:s.name,phase:s.phase,amount:solved.result.concentrations[solved.result.speciesIds.indexOf(s.id)],elements:s.elements,allocation:s.allocation??null}))
 const elements={}
 for(const s of carriers.filter(()=>carriers.every(c=>c.elements!==undefined)))for(const [element,count] of Object.entries(s.elements)){if(['H','O'].includes(element))continue;const row=elements[element]??={total:0,dissolved:0,solidBound:0,states:{},unresolved:0};row.total+=count*s.amount;if(s.phase==='solid')row.solidBound+=count*s.amount;else row.dissolved+=count*s.amount;if(s.allocation?.element===element&&s.allocation.states.reduce((n,r)=>n+r.count,0)===count)for(const a of s.allocation.states)row.states[a.oxidationState]=(row.states[a.oxidationState]??0)+a.count*s.amount;else row.unresolved+=count*s.amount}
 const net= reactionRedistribution(prepared.prepared,solved)
 const value=freeze({ok:true,status:'conditional-equilibrium',mode:'closed-reagents',requestId:prepared.requestId,scopeId:prepared.scopeId,discovery:prepared.discovery,closed:solved,system:solved.system,input:solved.input,result:solved.result,inspection:{pH:solved.inspection.pH,pe:solved.inspection.pe,Eh:solved.inspection.Eh,carriers,elements,elementalMetadata:carriers.every(c=>c.elements!==undefined)?'available':'unavailable',acceptedSolids:solved.result.solids.filter(s=>s.amount>0),redistribution:net,scientificStatus:'Conditional source scope; equilibrium only, no kinetics or radicals modeled.'}})
 resultSet.add(value);return value
}
