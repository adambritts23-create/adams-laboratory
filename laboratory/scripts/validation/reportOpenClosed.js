import fs from 'node:fs'
import {createRepository} from '../../src/thermodynamics/repository.js'
import {componentMetadata} from '../../src/thermodynamics/componentMetadata.js'
import {fePeroxideScope} from '../../src/thermodynamics/scopes/fePeroxide.js'
import {discoverGeneralClosed,prepareGeneralClosed,solveGeneralClosed} from '../../src/thermodynamics/generalClosedReagents.js'
import {independentEu} from './openClosedIndependent.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json'))),registry=await componentMetadata(repo)
fs.writeFileSync('docs/open-closed-metadata-coverage.json',JSON.stringify({version:registry.version,importedComponents:repo.getComponents().length,sourceCompositionRecords:repo.getComponents().filter(c=>c.elementalComposition).length,before:repo.getComponents().filter(c=>fePeroxideScope.metadata[c.id]).length,after:Object.keys(registry.entries).length,counts:Object.fromEntries(['SUPPORTED','PARTIAL','REQUIRES_REVIEW'].map(k=>[k,registry.coverage.filter(c=>c.status===k).length])),coverage:registry.coverage},null,2))
const cases=[{name:'Eu chloride acid',forms:{'Eu 3+':1e-6,'Cl-':.010003,'H+':.01}},{name:'full Fe chloride peroxide',forms:{'Fe 2+':1e-6,'H2O2':2.5e-7,'Cl-':.010002,'H+':.01}},{name:'Fe Eu chloride',forms:{'Fe 2+':1e-6,'Eu 3+':1e-6,'Cl-':.010005,'H+':.01}},{name:'Fe Cr K acidic target',forms:{'Fe 2+':6e-6,'CrO4 2-':2e-6,'K+':2e-6,'Cl-':.010012,'H+':.010002}}],results=[]
for(const c of cases){
 const amounts=Object.fromEntries(Object.entries(c.forms).map(([n,v])=>[repo.getComponents().find(c=>c.name===n).id,v])),started=performance.now(),audit=await discoverGeneralClosed(repo,[...Object.keys(amounts),'component:H2O']),prepared=await prepareGeneralClosed(repo,{amounts,description:c.name,revision:0,temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O'},audit),result=prepared.ok?solveGeneralClosed(prepared):prepared
 const comparison=c.name==='Eu chloride acid'?(()=>{const e=independentEu();return {expected:e,pHError:result.accepted.inspection.pH-e.pH,peError:result.accepted.inspection.pe-e.pe,maximumLogConcentrationError:Math.max(...result.accepted.inspection.carriers.map(s=>Math.abs(Math.log10(s.amount/e.carriers[s.name]))))}})():null
 results.push({name:c.name,milliseconds:performance.now()-started,amounts,audit,result,comparison})
}
fs.writeFileSync('docs/open-closed-validation.json',JSON.stringify({metadataVersion:registry.version,results},null,2))
console.log(JSON.stringify({coverage:{before:repo.getComponents().filter(c=>fePeroxideScope.metadata[c.id]).length,after:Object.keys(registry.entries).length},results:results.map(r=>({name:r.name,species:Object.keys(r.audit.metadata).length,reactions:r.audit.included.length,ok:r.result.ok,diagnostics:r.result.diagnostics,pH:r.result.accepted?.inspection.pH,Eh:r.result.accepted?.inspection.Eh,comparison:r.comparison&&{pHError:r.comparison.pHError,peError:r.comparison.peError,maximumLogConcentrationError:r.comparison.maximumLogConcentrationError}}))},null,2))
