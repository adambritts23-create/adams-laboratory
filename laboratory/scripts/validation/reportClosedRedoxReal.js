import fs from 'node:fs'
import {createRepository} from '../../src/thermodynamics/repository.js'
import {closedReal,imposedReal,verifyReal,expected,ids} from './closedRedoxReal.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json'))),controls=[]
for(const alternate of [false,true])for(const history of [0,1])for(const reverse of [false,true]){
 const r=await closedReal(repo,{alternate,history,reverse});controls.push({alternate,history,reverse,amounts:verifyReal(r.solved.result),preparedInventories:r.prepared.inventories,cancellations:r.prepared.network.cancellations,expressions:r.prepared.network.algebra.componentExpressions,inspection:r.solved.inspection,residuals:r.solved.result.residuals,preparationId:r.prepared.preparationId,equilibriumId:r.prepared.equilibriumId})
}
const cross=await imposedReal(repo),charges={[ids.Vo]:3,[ids.Vr]:2,[ids.Euo]:3,[ids.Eur]:2,[ids.Cl]:-1},charge=r=>r.speciesIds.filter(id=>id!==ids.e).reduce((n,id)=>n+charges[id]*r.concentrations[r.speciesIds.indexOf(id)],0)
fs.writeFileSync('docs/closed-redox-step3-evidence.json',JSON.stringify({scope:'Five-ion V(III/II)/Eu(III/II)/chloride ideal aqueous reaction-restricted benchmark; not a complete aqueous chemistry validation',expected,controls,fixedEh:{Eh:expected.Eh,amounts:verifyReal(cross.exact.result),charge:charge(cross.exact.result),residuals:cross.exact.result.residuals},sweep:{counts:cross.sweep.counts,points:cross.sweep.outcomes.map(o=>({Eh:o.coordinate,accepted:o.scientificAcceptance,amounts:Object.fromEntries(o.result.speciesIds.map((id,i)=>[id,o.result.concentrations[i]])),physicalCharge:charge(o.result)}))}},null,2))
console.log({controls:controls.length,pe:controls[0].inspection.pe,Eh:controls[0].inspection.Eh,maximumCompositionDifference:Math.max(...Object.entries(controls[0].amounts).map(([id,n])=>Math.abs(n-verifyReal(cross.exact.result)[id]))),crossCharge:charge(cross.exact.result),sweep:cross.sweep.counts})
