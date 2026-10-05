/** Offline evidence only; does not alter source data, references or public UI. */
import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {createRepository} from '../src/thermodynamics/repository.js'
import {automaticAuditSession} from './validation/automaticSolidsAudit.js'
import {prepareCanonicalRedoxSession,canonicalRedoxTotals} from '../src/solver/prepareCanonicalRedox.js'
import {solveFixedRedox,peToEh} from '../src/solver/redox.js'
import {componentBalanceTolerance} from '../src/solver/validationContract.js'
const data=JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')),repository=createRepository(data)
const cases=[]
for(const [name,exclusions] of [['Fe 2+',['Fe0.932O(cr)']],['Cu+',[]],['Mn 2+',[]]]){
 const session=automaticAuditSession(repository,[name,'e-'])
 session.chemicalSystem.excludedSpecies=exclusions.map(name=>data.species.find(s=>s.name===name).id)
 const started=performance.now(),preparation=await prepareCanonicalRedoxSession(session,repository)
 const preparationMs=performance.now()-started
 if(!preparation.ok)throw Error(JSON.stringify(preparation))
 const {system,canonical}=preparation,mapped=canonicalRedoxTotals(preparation,{componentIds:canonical.inventory.sourceComponentIds,total:.001})
 const points=[]
 for(const [pH,pe] of [[2,0],[7,0],[7,13],[10,20]]){
  const start=performance.now(),x=await solveFixedRedox(system,{pH,Eh:peToEh(pe),totals:mapped.totals}),solveMs=performance.now()-start
  if(!x.ok)throw Error(JSON.stringify(x.diagnostics))
  const solidTotal=x.result.solids.reduce((sum,s)=>sum+s.amount*system.products.find(p=>p.id===s.id).coefficients[0],0)
  const inventoryError=x.result.dissolvedComponentAmounts[0]+solidTotal-.001
  if(Math.abs(inventoryError)>componentBalanceTolerance(.001,.001))throw Error('Inventory contract failed')
  points.push({pH,pe,Eh:x.coordinates.Eh,solveMs,inputId:x.input.id,accepted:true,dissolved:x.result.dissolvedComponentAmounts[0],solidTotal,inventoryError,balanceTolerance:componentBalanceTolerance(.001,.001),massActionMax:Math.max(0,...x.result.residuals.massActionLog.filter(Number.isFinite).map(Math.abs)),componentResiduals:x.result.residuals.componentBalance,electronActivityLog:x.result.logActivities[2],electronFreeAmount:x.result.concentrations[2],solids:x.result.solids,classification:x.classification})
 }
 cases.push({selectedSource:name,preparationMs,systemId:system.id,inventory:canonical.inventory,basis:system.components,validation:canonical.validation,productCount:system.products.length,solidCount:system.solidRows.length,excluded:exclusions,transformedRows:system.products.map(p=>({id:p.id,name:p.name,phase:p.phase,coefficients:p.coefficients,logBeta:p.logBeta,sourceIds:p.sourceRecord.transformations.map(t=>({id:t.bridge.id,multiplier:t.multiplier})),originalId:p.sourceRecord.original.id})),points})
}
const manifest=JSON.parse(fs.readFileSync('.local/canonical-protected.json'))
const changedProtected=manifest.filter(r=>createHash('sha256').update(fs.readFileSync(r.path)).digest('hex')!==r.sha256).map(r=>r.path)
const evidence={kind:'bounded-canonical-redox-validation',date:new Date().toISOString(),baselineTests:408,pourbaixEnabled:false,scope:'One unit electron-bridge-connected source inventory, integer source coefficients; not a public thermodynamic completeness claim.',cases,protectedFileCount:manifest.length,changedProtected}
fs.writeFileSync('docs/canonical-redox-validation.json',JSON.stringify(evidence,null,2)+'\n')
console.log(JSON.stringify({cases:cases.map(c=>({name:c.selectedSource,products:c.productCount,solids:c.solidCount,preparationMs:c.preparationMs,maxInventoryError:Math.max(...c.points.map(p=>Math.abs(p.inventoryError))),maxMassAction:Math.max(...c.points.map(p=>p.massActionMax))})),protectedFileCount:manifest.length,changedProtected},null,2))
