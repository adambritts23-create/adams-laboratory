import fs from 'node:fs'
import crypto from 'node:crypto'
import {createRepository} from '../../src/thermodynamics/repository.js'
import {prepareWetLab,runTitration} from '../../src/calculations/wetLabTitration.js'
import {prepareStockSolution,volumeConvention} from '../../src/calculations/wetLabSolutions.js'
import {acetateReference,acetateDoses} from './acetateReference.js'
const text=fs.readFileSync('public/data/thermodynamic-default.json','utf8'),raw=JSON.parse(text),repo=createRepository(raw),row=n=>raw.species.find(s=>s.id.endsWith(':'+n))
const constants={logAcidFormation:row(79298).logK,logSodiumFormation:row(220132).logK,logNaOHFormation:row(224689).logK,logWater:row(250448).logK}
const stock=(reagent,volumeMl)=>prepareStockSolution({reagent,volumeMl,concentrationMolPerL:.1,temperatureC:25,convention:volumeConvention.id})
const series=await runTitration(await prepareWetLab(repo,{acetate:true}),{analyteStock:stock('CH3COOH',50),analyteVolumeMl:50,titrantStock:stock('NaOH',100),additionVolumesMl:acetateDoses,revision:1})
const points=series.states.map(s=>{const V=s.totalVolumeMl/1000,C=.005/V,N=.1*s.titrantVolumeAddedMl/1000/V,reference=acetateReference({...constants,acetateTotal:C,sodiumTotal:N,protonTotal:C-N});return {doseMl:s.titrantVolumeAddedMl,pH:s.pH,reference,pHError:s.pH-reference.pH,status:s.status,concentrations:Object.fromEntries(s.equilibrium.result.speciesIds.map((id,i)=>[id,s.equilibrium.result.concentrations[i]])),residuals:s.equilibrium.result.residuals}})
const basis=new Set(['H+','H2O','CH3COO-','Na+']),audit=raw.species.filter(s=>s.componentStoichiometry?.['CH3COO-']).map(s=>({...s,scopeReason:s.phase!=='aqueous'?'Non-aqueous phase excluded':Object.keys(s.componentStoichiometry).every(k=>basis.has(k))?'Admitted in acetate/NaOH basis':'Requires additional components outside reviewed recipe'}))
fs.writeFileSync('docs/acetate-evidence.json',JSON.stringify({databaseSHA256:crypto.createHash('sha256').update(text).digest('hex'),constants,points,maxPHError:Math.max(...points.map(p=>Math.abs(p.pHError))),acetateSourceAudit:audit},null,2))
console.log(JSON.stringify({points:points.map(({doseMl,pH,pHError})=>({doseMl,pH,pHError})),sourceCount:audit.length,maxPHError:Math.max(...points.map(p=>Math.abs(p.pHError)))},null,2))
