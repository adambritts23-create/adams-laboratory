import {compileWetLabAnalytical} from './wetLabAnalytical.js'
import {constructEquilibrium} from '../thermodynamics/equilibriumConstructor.js'
import {acetateSource} from './acetateSource.js'
import {freeze,identity,prepareChemicalSystem,createPointInput} from '../solver/models.js'
import {solvePoint} from '../solver/point.js'
import {acceptedState} from '../beaker/acceptedState.js'
import {volumeConvention,dispenseVolume,mixSolutions,isWetLabSolution,wetLabRecipes,wetLabError} from './wetLabSolutions.js'
import {solveEquilibriumNetwork,equilibriumSourceFingerprint} from '../thermodynamics/equilibriumNetwork.js'

const H='component:H%2B',Na='component:Na%2B',Cl='component:Cl-',W='component:H2O',OH='spana:2ac52a30213c9288:250448'
const pins={
 [H]:'2da5dab5e8e60e3e4fa4123752ecafcf9561b3a085085f4f5276fab7eb4cc827',
 [Na]:'8d27187b6d344dc61bee5dff9dddadbb380ce7be6f4cb33539cf1514f4e5bc48',
 [Cl]:'7c2c9547366635b0b4837037dd59353e7223456401995c185ded4f358ad125f8',
 [W]:'79e0284ad6b9ac1d04863204551ab5f62244ed724fcaaac8ca587a7342c91b50',
 [OH]:'8e0891028ef1d0eaa2084dfaff88a4b62fe8d350c71e76598ab2a06138532a96',
}
const contexts=new WeakSet(),seriesObjects=new WeakSet()
const generalContexts=new WeakMap()
const physicalRequest=(mixture,revision,phases)=>({boundary:'physical-preparation',revision,temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O',sourceFingerprint:equilibriumSourceFingerprint,phases,solvent:'unit-water-activity',preparation:{...(mixture.preparationContract==='simplified-redox'?{counterionModel:'inert-background'}:{}),provenance:JSON.stringify(mixture.provenance),solventCoordinate:{convention:volumeConvention.id,volumeMl:mixture.volumeMl,modelSolventMassKg:mixture.modelSolventMassKg},contributions:mixture.contributions.flatMap(r=>(r.sourceParts??[{sourceId:r.sourceId,coefficient:1}]).map((part,i)=>({id:`${r.id}/${i}`,sourceId:part.sourceId,moles:r.moles*part.coefficient,provenance:JSON.stringify({recipe:r.reagent,recipeVersion:r.recipeVersion,formulaUnitMoles:r.moles,intrinsicComponents:r.intrinsicComponents,sourceFingerprint:mixture.sourceFingerprint,revision:mixture.preparationRevision,reference:r.provenance})})))}})
/** One resolved source scope for one physical experiment; System supplies policy, not recipe ions. */
export async function prepareWetLabScope(repository,stocks,chemicalSystem,revision=0){
 if(!stocks?.sample||!stocks?.titrant||!Object.values(stocks).every(s=>isWetLabSolution(s)&&s.preparationRevision===revision))wetLabError('invalid-preparation','Current branded sample and titrant preparations are required.')
 if(!chemicalSystem?.enabledPhases?.includes('aqueous'))wetLabError('unavailable-recipe','System must permit aqueous chemistry.')
 if((chemicalSystem.temperature!==undefined&&chemicalSystem.temperature!==25)||(chemicalSystem.pressure!==undefined&&chemicalSystem.pressure!==1)||(chemicalSystem.activityModel!=null&&chemicalSystem.activityModel!=='ideal'))wetLabError('unsupported-model','Reviewed Wet Lab scope requires Ideal, 25 °C and declared 1 bar.')
 const recipeIds=[...new Set(Object.values(stocks).flatMap(s=>s.contributions.map(r=>r.reagent)))],legacy=!Object.values(stocks).some(s=>s.contributions.some(r=>r.kind==='ionic'))&&recipeIds.some(id=>wetLabRecipes[id]?.requiresCompatibilityScope)&&recipeIds.every(id=>wetLabRecipes[id]?.compatibilityScope==='reviewed-acid-base')
 if(!Object.values(stocks).some(s=>s.preparationContract==='analytical-acid-base')&&recipeIds.includes('HCl')&&recipeIds.includes('B(OH)3'))wetLabError('unsupported-boundary','Boric acid with chloride is outside the reviewed compatibility scope; connected chloride redox chemistry cannot be silently suppressed.')
 if(Object.values(stocks).some(s=>s.preparationContract==='simplified-redox')&&!Object.values(stocks).every(s=>s.preparationContract==='simplified-redox'))wetLabError('incompatible-preparation','Both simplified-redox stocks must use the same counterion model.')
 const excluded=new Set(chemicalSystem.excludedSpecies??[])
 let context,scope
 const analytical=Object.values(stocks).some(s=>s.preparationContract==='analytical-acid-base')
 if(analytical){
  const probe=await compileWetLabAnalytical(repository,mixSolutions(stocks.sample,stocks.titrant),revision,chemicalSystem)
  if(!probe.ok){const error=new Error(probe.diagnostics.map(d=>d.message).join(' '));error.code=probe.diagnostics[0]?.code??'analytical-preparation-unavailable';error.discovery=probe.discovery;throw error}
  scope={boundary:'analytical-acid-base',components:probe.system.components.map(c=>c.id),reactions:probe.system.products.map(p=>p.id),status:'CONDITIONAL',phaseScope:{included:chemicalSystem.enabledPhases},reason:'Analytical acid/base: countercharge unspecified; not a complete physical solution. Uses the selected System and ordinary Calculation phase policy. Mixture pH is derived; no counterions added.'}
  context={version:'wet-lab-analytical-acid-base-v1',convention:volumeConvention}
 }else if(legacy){
  context=await prepareWetLab(repository,{acetate:recipeIds.includes('CH3COOH')})
  const components=[H,Na,Cl,W,...(recipeIds.includes('CH3COOH')?[acetateSource.component]:[])]
  const reactions=[OH,...(recipeIds.includes('CH3COOH')?acetateSource.aqueousIds:[])]
  scope={boundary:'reviewed-acid-base-compatibility',components,reactions,status:'REVIEWED RESTRICTED SCOPE',reason:'Preserves validated HCl/NaOH and acetate compatibility chemistry. General chlorine redox and other database phases are outside this explicitly restricted historical model.'}
 }else{
  const phases=chemicalSystem.enabledPhases.includes('solid')?['aqueous','pure-solids']:['aqueous']
  const probe=await constructEquilibrium(repository,{adapter:'physical',input:physicalRequest(mixSolutions(stocks.sample,stocks.titrant),revision,phases)})
  if(!probe.ok)wetLabError('unsupported-boundary',probe.diagnostics.map(d=>d.message).join(' '))
  scope={boundary:probe.boundary,components:probe.inspection.selectedIds,reactions:probe.inspection.included.map(r=>r.id),status:probe.status,phaseScope:{...probe.inspection.phaseScope,included:phases},reason:`${stocks.sample.preparationContract==='simplified-redox'?'Simplified redox with fictitious inert countercharge; no chloride or nitrate added. ':''}Source-derived ${probe.boundary==='closed-physical'?'closed-redox':'non-redox'} equilibrium under the disclosed phase scope. Each dose is independently equilibrated; no precipitation history or kinetics. Unsupported phase/gas requirements remain gaps. ${probe.boundary==='closed-physical'?'Eh/pe derived.':'Eh/pe not determined.'}`}
  context={version:'wet-lab-general-v1',convention:volumeConvention}
 }
 for(const id of [...scope.components,...scope.reactions])if(excluded.has(id)||(chemicalSystem.excludedComponents??[]).includes(id))wetLabError('explicit-scope-exclusion',`Required recipe chemistry is explicitly excluded: ${id}`)
 const resolved=freeze({...context,preparationRevision:revision,sourceId:await identity({source:context.sourceId??equilibriumSourceFingerprint,scope,chemicalSystem,revision}),scope})
 contexts.add(resolved)
 if(analytical||!legacy)generalContexts.set(resolved,{repository,analytical,chemicalSystem:structuredClone(chemicalSystem),phases:scope.phaseScope.included})
 return resolved
}
/** Versioned reviewed acid/base source scopes, not automatic chemistry discovery. */
export async function prepareWetLab(repository,{acetate=false}={}){
 const records={}
 for(const [id,hash] of Object.entries(acetate?{...pins,...acetateSource.pins}:pins)){
  const row=id.startsWith('component:')?repository.getComponentById(id):repository.getSpeciesById(id)
  if(!row||await identity(row)!==hash)wetLabError('source-identity-mismatch',`Reviewed acid/base source changed or missing: ${id}`)
  records[id]=row
 }
 const context=freeze({version:acetate?'wet-lab-acetate-v1':'wet-lab-acid-base-v0',records,sourceId:await identity(acetate?{...pins,...acetateSource.pins}:pins),convention:volumeConvention})
 contexts.add(context);return context
}
export async function solveMixedSolution(context,mixture,{revision=0,onSolve=()=>{}}={}){
 if(!contexts.has(context)||!isWetLabSolution(mixture)||mixture.volumeMl<=0)wetLabError('invalid-preparation','Branded source context and positive-volume solution required.')
 if(context.preparationRevision!==undefined&&(revision!==context.preparationRevision||mixture.preparationRevision!==revision))wetLabError('stale-preparation','Resolved scope and physical preparation revisions must match.')
 if(generalContexts.has(context)){
  const {repository,phases,analytical,chemicalSystem}=generalContexts.get(context)
  const compiled=analytical?await compileWetLabAnalytical(repository,mixture,revision,chemicalSystem):await constructEquilibrium(repository,{adapter:'physical',input:physicalRequest(mixture,revision,phases)})
  if(!compiled.ok)return freeze({...compiled,pH:null})
  if(analytical){
   onSolve('dose')
   const {system,input}=compiled,result=solvePoint(system,input)
   return freeze({ok:result.ok,system,input,result,pH:result.ok?-result.logActivities[system.components.findIndex(c=>c.role==='proton')]:null,inspection:result.ok?acceptedState(system,input,result):null,diagnostics:result.diagnostics,scientificStatus:'Ordinary Calculation / selected System',scope:context.scope})
  }
  onSolve('dose')
  const result=solveEquilibriumNetwork(compiled)
  if(!result.ok)return freeze({...result,pH:null,compiled})
  const redox=compiled.boundary==='closed-physical'
  const {system,input}=redox?result.accepted:compiled.preparedSystemInput
  const point=redox?result.accepted.result:result.accepted
  return freeze({ok:true,system,input,result:point,pH:redox?result.accepted.inspection.pH:analytical?-point.logActivities[system.components.findIndex(c=>c.role==='proton')]:result.derived.pH,...(redox?{derived:result.accepted.inspection,...(result.accepted.inspection.elementalMetadata==='unavailable'?{elementalMetadata:'unavailable'}:{elementInventories:result.accepted.inspection.elements}),inertCountercharge:result.accepted.closed.inspection.inertCountercharge,conservedInventories:result.accepted.closed.inspection.inventories,elementCarriers:result.accepted.inspection.carriers}:{}),inspection:acceptedState(system,input,point),diagnostics:[],compilerResult:result,scientificStatus:result.status,scope:context.scope})
 }
 if((mixture.moles.boron??0)>0)wetLabError('unreviewed-boundary','Boron requires the general source-derived physical compiler context.')
 const totals={[H]:mixture.moles.protonEquivalent/mixture.modelSolventMassKg,[Na]:mixture.moles.Na/mixture.modelSolventMassKg,[Cl]:mixture.moles.Cl/mixture.modelSolventMassKg}
 // Exactly zero spectator inventory has no physical carrier. Do not approximate zero with trace material.
 const hasAcetate=(mixture.moles.acetate??0)>0
 if(hasAcetate&&!context.records[acetateSource.acid])wetLabError('unreviewed-acetate','Acetate requires the reviewed source context.')
 if(hasAcetate)totals[acetateSource.component]=mixture.moles.acetate/mixture.modelSolventMassKg
 const ids=[H,...[Na,Cl].filter(id=>totals[id]>0),...(hasAcetate?[acetateSource.component]:[]),W]
 const components=ids.map(id=>({id,name:context.records[id].name,role:id===H?'proton':id===W?'water':'ordinary'}))
 const oh=context.records[OH]
 const acetateProducts=hasAcetate?acetateSource.aqueousIds.map(id=>context.records[id]).filter(row=>Object.keys(row.componentStoichiometry).every(name=>ids.some(id=>context.records[id].name===name))).map(row=>({id:row.id,name:row.name,phase:'aqueous',logBeta:row.logK,coefficients:ids.map(id=>row.componentStoichiometry[context.records[id].name]??0),sourceRecord:row})):[]
 const prepared=await prepareChemicalSystem({components,products:[{id:OH,name:oh.name,phase:'aqueous',logBeta:oh.logK,coefficients:ids.map(id=>id===H?-1:id===W?1:0),sourceRecord:oh},...acetateProducts],basisStatus:'explicit-direct',temperatureC:25,pressureBar:1,unit:'mol/kg-H2O',sourceIdentity:{wetLabVersion:context.version,sourceId:context.sourceId,convention:volumeConvention.id,scope:hasAcetate?"Reviewed acetate acid/base with admitted sodium associations; no solids/gases/redox":volumeConvention.scope}})
 if(!prepared.ok)return prepared
 const {system}=prepared
 const point=await createPointInput(system,{constraints:ids.map(id=>({componentId:id,kh:id===W?2:1,value:id===W?0:totals[id]})),revision,unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,activityModel:'ideal'})
 if(!point.ok)return point
 onSolve('dose')
 const result=solvePoint(system,point.input)
 return freeze({ok:result.ok,system,input:point.input,result,pH:result.ok?-result.logActivities[0]:null,inspection:result.ok?acceptedState(system,point.input,result):null,diagnostics:result.diagnostics})
}
export async function runTitration(context,{analyteStock,analyteVolumeMl,titrantStock,additionVolumesMl,revision=0}, {isCurrent=()=>true,yieldControl=async()=>{},onSolve=()=>{}}={}){
 if(!contexts.has(context)||!isWetLabSolution(analyteStock)||!isWetLabSolution(titrantStock))wetLabError('invalid-stock','Branded source context and prepared solutions required.')
 if(!Number.isInteger(revision)||revision<0||!Array.isArray(additionVolumesMl)||!additionVolumesMl.length||additionVolumesMl.length>10000)wetLabError('invalid-series','Provide a revision and 1–10000 total additions.')
 const initial=dispenseVolume(analyteStock,analyteVolumeMl).aliquot
 if(initial.volumeMl<=0)wetLabError('invalid-analyte','Positive initial analyte volume required.')
 // Validate every request before solving; each total is drawn from the original stock independently.
 const doses=additionVolumesMl.map(v=>dispenseVolume(titrantStock,v))
 const id=await identity({context:context.sourceId,analyteStock,analyteVolumeMl,titrantStock,additionVolumesMl,revision}),states=[],start=performance.now()
 for(let index=0;index<doses.length;index++){
  await yieldControl()
  if(!isCurrent())wetLabError('stale-titration','Preparation changed; discard this run.')
  const {aliquot,remainder}=doses[index],mixture=mixSolutions(initial,aliquot)
  const equilibrium=await solveMixedSolution(context,mixture,{revision,onSolve})
  if(!isCurrent())wetLabError('stale-titration','Preparation changed while solving; discard this run.')
  states.push(freeze({id:`${id}:${index}`,seriesId:id,index,revision,initialAnalyte:{reagent:analyteStock.reagent??'Prepared solution',concentrationMolPerL:analyteStock.concentrationMolPerL,contributions:analyteStock.contributions,volumeMl:analyteVolumeMl},titrant:{reagent:titrantStock.reagent??'Prepared solution',concentrationMolPerL:titrantStock.concentrationMolPerL,contributions:titrantStock.contributions},titrantVolumeAddedMl:aliquot.volumeMl,titrantRemainingMl:remainder.volumeMl,titrantMoles:aliquot.moles,totalVolumeMl:mixture.volumeMl,mixture,analyticalMoles:mixture.moles,equilibrium,pH:equilibrium.pH??null,status:equilibrium.ok?'accepted-v0':'unavailable',diagnostics:equilibrium.diagnostics??[],scientificStatus:context.scope?.reason??(mixture.moles.acetate?"Reviewed acetate / sodium-pair acid-base scope; ideal volume convention, no solids/gases/redox":volumeConvention.scope)}))
 }
 const series=freeze({id,revision,convention:volumeConvention,states,curve:states.map(state=>({x:state.titrantVolumeAddedMl,y:state.pH,state})),xLabel:'Titrant volume added / mL',yLabel:'Calculated pH',elapsedMs:performance.now()-start})
 seriesObjects.add(series);return series
}
export function selectTitrationState(series,index,{seriesId,revision}){
 if(!seriesObjects.has(series)||series.id!==seriesId||series.revision!==revision||!Number.isInteger(index)||!series.states[index])wetLabError('stale-or-mismatched-state','Select an existing sample in the current branded series/revision.')
 return series.states[index]
}


