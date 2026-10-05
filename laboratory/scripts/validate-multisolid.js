// Offline evidence generator; never imported by the application.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {prepareChemicalSystem,createPointInput} from '../src/solver/models.js'
import {solvePoint} from '../src/solver/point.js'
import {multiSolidPolicy} from '../src/solver/assemblages.js'
import {specification,solids,basis,totals,reconstruct} from '../tests/mixedCarbonateAudit.js'
import {reconstruct as verify} from '../tests/phase6Helpers.js'
const {system}=await prepareChemicalSystem({...specification(solids),solidPolicy:multiSolidPolicy})
const points=[]
for(let pH=0;pH<=14;pH+=0.5){
 const {input}=await createPointInput(system,{revision:0,unit:system.unit,temperatureC:25,pressureBar:1,activityModel:'ideal',constraints:basis.map((componentId,i)=>({componentId,kh:i<3?1:2,value:i<3?totals[i]:i===3?-pH:0}))})
 const r=solvePoint(system,input); assert.ok(r.ok,JSON.stringify(r)); verify(system,input,r)
 points.push({pH,input,logActivities:r.logActivities,concentrations:r.concentrations,independentReconstruction:reconstruct(r.logActivities),solids:r.solids,residuals:r.residuals,selection:r.assemblageSelection,rejections:r.attempts.filter(a=>!a.accepted).map(a=>({activeIds:a.activeIds,code:a.code,diagnostics:a.diagnostics})),acceptedAttempts:r.attempts.filter(a=>a.accepted)})
}
const hash=path=>createHash('sha256').update(fs.readFileSync(new URL(path,import.meta.url))).digest('hex')
const evidence={policy:multiSolidPolicy,sourceIdentity:system.sourceIdentity,basis,totals,candidates:system.products.filter(p=>p.phase==='solid'),goldenSha256:hash('../tests/fixtures/eq-diagr/references.json'),databaseSha256:hash('../public/data/thermodynamic-default.json'),points}
fs.writeFileSync(new URL('../docs/multisolid-validation.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n')
console.log(JSON.stringify(points.map(p=>({pH:p.pH,active:p.solids.filter(s=>s.amount>0).map(s=>({name:s.name,amount:s.amount})),attempts:p.selection.attempted})),null,2))
