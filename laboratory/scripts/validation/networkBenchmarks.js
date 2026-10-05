import fs from 'node:fs'
import {createRepository} from '../../src/thermodynamics/repository.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork,equilibriumSourceFingerprint} from '../../src/thermodynamics/equilibriumNetwork.js'
import {independentSourceFamilies} from './networkIndependent.js'
import {acetateReference} from './acetateReference.js'
export const raw=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')),repo=createRepository(raw)
export const common={revision:0,temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O',sourceFingerprint:equilibriumSourceFingerprint,phases:['aqueous'],solvent:'unit-water-activity'}
export const ids={H:'component:H%2B',W:'component:H2O',F:'component:Fe%202%2B',E:'component:Eu%203%2B',Cl:'component:Cl-',P:'component:H2O2',A:'component:CH3COO-'}
export const physical=async(amounts,extra={})=>{const request={...common,boundary:'closed-physical',selectedIds:[...Object.keys(amounts),ids.W],amounts,...extra},compiled=await compileEquilibriumNetwork(repo,request);return {request,compiled,result:compiled.ok?solveEquilibriumNetwork(compiled):compiled}}
const compare=(result,expected)=>({pHError:result.accepted.inspection.pH-expected.pH,peError:result.accepted.inspection.pe-expected.pe,maximumCarrierLogError:Math.max(...result.accepted.inspection.carriers.map(c=>Math.abs(Math.log10(c.amount/expected.carriers[c.name])))),reference:expected})
export async function networkBenchmarks(){
 const eu=await physical({[ids.E]:1e-6,[ids.Cl]:.010003,[ids.H]:.01}),mixed=await physical({[ids.F]:1e-6,[ids.E]:1e-6,[ids.Cl]:.010005,[ids.H]:.01})
 eu.comparison=compare(eu.result,independentSourceFamilies({names:['Eu 3+','Cl-','H+','e-'],charges:[3,-1,1,-1],total:[1e-6,.010003,.01,0],initial:[-6,-2,-2,-12]}))
 mixed.comparison=compare(mixed.result,independentSourceFamilies({names:['Fe 2+','Eu 3+','Cl-','H+','e-'],charges:[2,3,-1,1,-1],total:[1e-6,1e-6,.010005,.01,0],initial:[-7,-6,-2,-2,-12]}))
 const limited=await physical({[ids.F]:6e-6,'component:CrO4%202-':2e-6,'component:K%2B':2e-6,[ids.Cl]:.010012,[ids.H]:.010002})
 const fe=[]
 for(const e of JSON.parse(fs.readFileSync('docs/closed-redox-step5-independent-points.json'))){const c=await physical({[ids.F]:1e-6,[ids.P]:e.peroxideSupplied,[ids.H]:.01,[ids.Cl]:.010002},{reviewedScope:true});c.comparison={pHError:c.result.accepted.inspection.pH-e.pH,peError:c.result.accepted.inspection.pe-e.pe,maximumCarrierLogError:Math.max(...c.result.accepted.inspection.carriers.map(s=>Math.abs(Math.log10(s.amount/e.amounts[s.id]))))};fe.push(c)}
 const acid=[]
 for(const B of [-1,0,.25,.5,1]){
  const request={...common,boundary:'analytical-components',selectedIds:[ids.H,ids.W,ids.A],constraints:[{componentId:ids.H,kh:1,value:B},{componentId:ids.W,kh:2,value:0},{componentId:ids.A,kh:1,value:.5}]},compiled=await compileEquilibriumNetwork(repo,request),result=compiled.ok?solveEquilibriumNetwork(compiled):compiled
  const expected=acetateReference({acetateTotal:.5,protonTotal:B,logAcidFormation:raw.species.find(r=>r.id.endsWith(':79298')).logK,logWater:raw.species.find(r=>r.id.endsWith(':250448')).logK,logSodiumFormation:0,logNaOHFormation:0})
  const map={[ids.H]:'h',[ids.A]:'a','spana:2ac52a30213c9288:79298':'ha','spana:2ac52a30213c9288:250448':'oh'},r=result.accepted
  const actual=Object.fromEntries(Object.entries(map).map(([id,key])=>[key,r.concentrations[r.speciesIds.indexOf(id)]])),charge=actual.h-actual.oh-actual.a
  acid.push({request,compiled,result,comparison:{chargeError:charge-(B-.5),carbonError:2*(actual.a+actual.ha)-1,protonEquivalentError:actual.h-actual.oh+actual.ha-B,reference:expected,pHError:-r.logActivities[0]-expected.pH,maximumCarrierLogError:Math.max(...r.speciesIds.filter(id=>map[id]).map(id=>Math.abs(Math.log10(r.concentrations[r.speciesIds.indexOf(id)]/expected[map[id]]))))}})
 }
 return {eu,mixed,fe,acid,limited}
}
