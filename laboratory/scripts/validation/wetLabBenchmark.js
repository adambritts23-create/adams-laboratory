import fs from 'node:fs'
import {createRepository} from '../../src/thermodynamics/repository.js'
import {prepareStockSolution,volumeConvention} from '../../src/calculations/wetLabSolutions.js'
import {prepareWetLab,runTitration} from '../../src/calculations/wetLabTitration.js'
import {strongAcidBaseReference,benchmarkAdditions} from './wetLabReference.js'
const raw=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json'))
const context=await prepareWetLab(createRepository(raw)),logKw=raw.species.find(s=>s.id==='spana:2ac52a30213c9288:250448').logK
const stock=(reagent,volumeMl)=>prepareStockSolution({reagent,volumeMl,concentrationMolPerL:.1,temperatureC:25,convention:volumeConvention.id})
const request={analyteStock:stock('HCl',50),analyteVolumeMl:50,titrantStock:stock('NaOH',100),additionVolumesMl:benchmarkAdditions}
const result=await runTitration(context,request)
const points=result.states.map(s=>({addedMl:s.titrantVolumeAddedMl,totalVolumeMl:s.totalVolumeMl,remainingMl:s.titrantRemainingMl,analyticalMoles:s.analyticalMoles,pH:s.pH,status:s.status,inputId:s.equilibrium.input.id,reference:strongAcidBaseReference(s.titrantVolumeAddedMl,logKw),maximumBalanceResidual:Math.max(...s.equilibrium.result.residuals.componentBalance.map(v=>Math.abs(v??0)))}))
const performance=[]
for(const n of [18,101,501]){const run=await runTitration(context,{...request,additionVolumesMl:n===18?benchmarkAdditions:Array.from({length:n},(_,i)=>100*i/(n-1))});performance.push({points:n,accepted:run.states.filter(s=>s.status==='accepted-v0').length,elapsedMs:run.elapsedMs})}
const report={convention:volumeConvention,sourceWaterLogK:logKw,points,maximumPHError:Math.max(...points.map(p=>Math.abs(p.pH-p.reference.pH))),performance}
fs.writeFileSync('docs/wet-lab-benchmark.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({maximumPHError:report.maximumPHError,performance},null,2))
