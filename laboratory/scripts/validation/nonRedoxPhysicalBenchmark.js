import fs from 'node:fs'
import process from 'node:process'
import {pathToFileURL} from 'node:url'
import {createRepository} from '../../src/thermodynamics/repository.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork,equilibriumSourceFingerprint} from '../../src/thermodynamics/equilibriumNetwork.js'
export const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
export const reference=JSON.parse(fs.readFileSync('docs/mixed-solution-feasibility.json'))
export const ids={H:'component:H%2B',W:'component:H2O',A:'component:CH3COO-',B:'component:B(OH)3',Na:'component:Na%2B',acid:'spana:2ac52a30213c9288:79298',base:'spana:2ac52a30213c9288:224689'}
export const common={boundary:'closed-physical-nonredox',revision:0,temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O',sourceFingerprint:equilibriumSourceFingerprint,phases:['aqueous'],solvent:'unit-water-activity'}
export const contribution=(id,sourceId,moles)=>({id,sourceId,moles,provenance:'Explicit physical formula units supplied in benchmark preparation'})
export const requestFor=v=>({...common,preparation:{provenance:'50 mL final sample: 20 mM acetic acid + 20 mM boric acid; independent addition of 0.1000 M NaOH',solventCoordinate:{convention:'dilute-ideal-aqueous-volume-v0',volumeMl:50+v,modelSolventMassKg:(50+v)/1000},contributions:[contribution('acetic-acid',ids.acid,.001),contribution('boric-acid',ids.B,.001),contribution('sodium-hydroxide',ids.base,.0001*v)]}})
export async function benchmark(){
 const states=[]
 for(const volumeMl of [0,5,10,15,20,100]){
  const request=requestFor(volumeMl),compiled=await compileEquilibriumNetwork(repo,request),result=compiled.ok?solveEquilibriumNetwork(compiled):compiled
  if(!result.ok)throw Error(JSON.stringify(result.diagnostics))
  const {system,input}=compiled.preparedSystemInput,r=result.accepted,expected=reference.benchmark.find(p=>p.volumeMl===volumeMl)
  const carriers=[...system.components,...system.products].filter(c=>c.role!=='water').map(c=>{const i=r.speciesIds.indexOf(c.id),amount=r.concentrations[i],target=expected.amounts[c.name];return {id:c.id,name:c.name,amount,expected:target,absoluteError:Math.abs(amount-target),logError:Math.abs(Math.log10(amount/target))}})
  const balances=input.constraints.filter(c=>c.kh===1).map(c=>{const k=system.componentIndex[c.componentId],total=r.concentrations[k]+system.products.reduce((s,p,j)=>s+p.coefficients[k]*r.concentrations[system.components.length+j],0);return {componentId:c.componentId,expected:c.value,actual:total,residual:total-c.value}})
  const massAction=system.products.map((p,j)=>({id:p.id,residual:Math.log10(r.concentrations[system.components.length+j])-p.logBeta-p.coefficients.reduce((s,n,k)=>s+n*r.logActivities[k],0)}))
  states.push({volumeMl,request,compiled,result,evidence:{volumeMl,pH:result.derived.pH,pHError:result.derived.pH-expected.pH,carriers,balances,massAction,charge:result.charge,phaseDiagnostics:result.phaseDiagnostics,gasActivitySum:result.gasActivitySum,status:result.status,timing:result.timing,carrierCount:carriers.length,sourceReactionCount:system.products.length,basisRank:system.components.length,solvedComponentCount:system.components.filter(c=>c.role!=='water').length,independentReactionRank:compiled.inspection.independentReactionRank}})
 }
 return states
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const states=await benchmark(),evidence=states.map(s=>s.evidence),summary={points:states.length,maxPHError:Math.max(...evidence.map(e=>Math.abs(e.pHError))),maxCarrierAbsoluteError:Math.max(...evidence.flatMap(e=>e.carriers.map(c=>c.absoluteError))),maxCarrierLogError:Math.max(...evidence.flatMap(e=>e.carriers.map(c=>c.logError))),maxComponentResidual:Math.max(...evidence.flatMap(e=>e.balances.map(b=>Math.abs(b.residual)))),maxChargeResidual:Math.max(...evidence.map(e=>Math.abs(e.charge.netCharge))),maxMassActionResidual:Math.max(...evidence.flatMap(e=>e.massAction.map(r=>Math.abs(r.residual))))};fs.writeFileSync('docs/non-redox-physical-benchmark.json',JSON.stringify({summary,evidence},null,2)+'\n');console.log(summary);console.table(evidence.map(e=>({mL:e.volumeMl,pH:e.pH,carriers:e.carrierCount,reactions:e.sourceReactionCount,rank:e.basisRank,...e.timing})))}
