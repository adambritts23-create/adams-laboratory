import fs from 'node:fs'
import {repo} from './nonRedoxPhysicalBenchmark.js'
import {searchComponentSystem} from '../../src/thermodynamics/componentSearch.js'
import {discoverGeneralClosed} from '../../src/thermodynamics/generalClosedReagents.js'
const cases={Fe:['H+','Fe 2+'],FeElectron:['H+','Fe 2+','e-'],Acetate:['H+','CH3COO-'],Cr:['H+','e-','Cr 3+','Cl-','Na+'],FeCr:['H+','e-','Fe 2+','CrO4 2-','K+','Cl-'],Cu:['H+','e-','Cu 2+','Cl-'],Nitrate:['H+','e-','Na+','NO3-']},results=[]
for(const [name,names] of Object.entries(cases)){
 const selected=names.map(n=>repo.getComponents().find(c=>c.name===n).id),o=searchComponentSystem(repo,selected),java=JSON.parse(fs.readFileSync('.local/hydra-system-search/captured/'+name+'-official.json')),officialNames=new Set(java.map(r=>r.name)),oracleNames=new Set(o.products.map(r=>r.name))
 const adam=await discoverGeneralClosed(repo,selected.filter(id=>id!=='component:e-'))
 results.push({name,selected,officialCount:java.length,oracleCount:o.products.length,officialOnly:java.filter(r=>!oracleNames.has(r.name)).map(r=>r.name),oracleOnly:o.products.filter(r=>!officialNames.has(r.name)).map(r=>r.name),aqueous:o.aqueous.length,solids:o.solids.map(r=>({id:r.id,name:r.name})),gases:o.gases.length,expansions:o.expansions,adamCount:adam.included.length+adam.excluded.length,adamOnly:[...adam.included,...adam.excluded].filter(r=>!oracleNames.has(r.name)).map(r=>({id:r.id,name:r.name})),hydraOnly:o.products.filter(r=>![...adam.included,...adam.excluded].some(a=>a.id===r.id)).map(r=>({id:r.id,name:r.name})),adamStatus:adam.status})
}
fs.writeFileSync('docs/hydra-system-comparison.json',JSON.stringify(results,null,2));console.table(results.map(r=>({case:r.name,java:r.officialCount,oracle:r.oracleCount,javaOnly:r.officialOnly.join(','),oracleOnly:r.oracleOnly.join(','),solids:r.solids.length,adam:r.adamCount,adamOnly:r.adamOnly.map(x=>x.name).join(','),hydraOnly:r.hydraOnly.map(x=>x.name).join(',')})))
