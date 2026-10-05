import fs from 'node:fs'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {repo} from '../../scripts/validation/nonRedoxPhysicalBenchmark.js'
import {parseElb,parseDb} from '../../src/thermodynamics/importers/spana/binary.js'
import {networkComposition} from '../../src/thermodynamics/networkComposition.js'
import {sourceCharge} from '../../src/thermodynamics/importers/spana/names.js'
import {loadWetLabIons} from '../../src/calculations/wetLabIons.js'
import {preflightWetLab} from '../../src/calculations/wetLabPreflight.js'
const dir='docs/component-metadata-audit/',sources='.local/hydra-basis-audit/input/'
const elb=fs.readFileSync(sources+'Reactions.elb'),db=fs.readFileSync(sources+'Reactions.db')
const parsedElb=parseElb(elb),parsedDb=parseDb(db)
assert.ok(parsedElb.complete);assert.ok(parsedDb.complete)
const components=repo.getComponents(),registry=await networkComposition(repo),catalog=await loadWetLabIons(repo)
const official=new Map(fs.readFileSync(dir+'official-charge.txt','utf8').trim().split(/\r?\n/).map(l=>l.split('\t')))
const chargeMismatches=components.filter(c=>sourceCharge(c.name)!==Number(official.get(c.name))).map(c=>({id:c.id,name:c.name,adam:sourceCharge(c.name),official:Number(official.get(c.name))}))
const pins=Object.entries(registry.entries).map(([id,m])=>({id,name:repo.getComponentById(id).name,reviewedCharge:m.charge,officialCharge:Number(official.get(repo.getComponentById(id).name)),reviewedAtoms:m.elements,atomComparison:'Not independently recoverable from ELB/DB schema; existing reviewed vector retained.'}))
assert.equal(chargeMismatches.length,0);assert.ok(pins.every(p=>p.reviewedCharge===p.officialCharge))
assert.equal(official.get('CHECK_balanced'),'true');assert.equal(official.get('CHECK_unbalanced'),'false')
const expected=[['79298',{C:2,H:4,O:2},0],['135557',{Fe:1,Cl:1},2],['133739',{Fe:2,O:3},0],['126584',{Fe:1},3]]
const products=expected.map(([offset,atoms,z])=>{
 const r=repo.getSpeciesById('spana:2ac52a30213c9288:'+offset),elements={};let charge=0
 for(const [name,n] of Object.entries(r.componentStoichiometry)){
  const c=components.find(c=>c.name===name),m=registry.entries[c.id];assert.ok(m)
  charge+=n*m.charge
  for(const [e,k] of Object.entries(m.elements))elements[e]=(elements[e]??0)+n*k
 }
 for(const e of Object.keys(elements))if(elements[e]===0)delete elements[e]
 assert.deepEqual(elements,atoms);assert.equal(charge,z);assert.equal(charge,r.charge)
 return {id:r.id,name:r.name,sourceTerms:r.componentStoichiometry,elements,charge,passed:true}
})
const controls=['H+','e-','H2O','Na+','Cl-','Cr 3+','Cu 2+','NO3-','SO4 2-','CO3 2-','CH3COO-'].map(name=>{
 const c=components.find(c=>c.name===name);assert.ok(c,name)
 return {id:c.id,name,role:c.role,officialCharge:Number(official.get(name)),associations:c.associations.map(a=>({element:a.element,description:a.description})),reviewedAtoms:registry.entries[c.id]?.elements??null,physicalMetadataAvailable:catalog.forms.some(f=>f.id===c.id)&&!!registry.entries[c.id]}
})
const ion=(id,sourceId,c)=>({id,kind:'ionic',sourceId,concentrationMolPerL:c})
const base={titrant:{reagent:'NaOH',volumeMl:100,concentrationMolPerL:.1}}
const preflights=[]
for(const [name,rows] of [['CuCl2',[ion('cu','component:Cu%202%2B',.01),ion('cl','component:Cl-',.02)]],['NaNO3',[ion('na','component:Na%2B',.01),ion('n','component:NO3-',.01)]]]){
 const r=await preflightWetLab(repo,{...base,sample:{volumeMl:50,contributions:rows}},{enabledPhases:['aqueous','solid']},0,catalog)
 assert.equal(r.status,'UNAVAILABLE');assert.match(r.reason,/composition/)
 preflights.push({name,...r})
}
const hashes=Object.fromEntries(['Reactions.elb','Reactions.db'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(sources+f)).digest('hex')]))
const report={decision:'AUDIT STOP: authoritative charge grammar found; no general authoritative elemental composition mechanism established. No production edits.',sourceHashes:hashes,coverage:{activeSourceComponents:components.length,rawUniqueElbNames:new Set(parsedElb.entries.flatMap(b=>b.components.map(c=>c.name))).size,elbBlocks:parsedElb.entries.length,dbRecords:parsedDb.records.length,officialCharges:components.length,newAtomVectorsFromSourceSchema:0,existingReviewedVectors:pins.length,ordinaryReviewedVectors:pins.filter(p=>!['H+','e-','H2O'].includes(p.name)).length,physicalMetadataAvailable:catalog.forms.filter(c=>registry.entries[c.id]).length,specialComponents:3,missingReviewedAtoms:components.length-pins.length,newlyUnlockedPhysicalForms:0},chargeMismatches,pins,controls,products,preflights,chargeDemo:{balanced:true,unbalanced:false,upstreamTolerance:0.001,upstreamSkipCoefficientMagnitudeBelow:0.0001},unresolved:components.filter(c=>!registry.entries[c.id]).map(c=>({id:c.id,name:c.name,reason:'Source links/descriptions do not establish atom counts; no reviewed composition vector.'}))}
fs.writeFileSync(dir+'results.json',JSON.stringify(report,null,2))
console.log(JSON.stringify({coverage:report.coverage,chargeMismatches,pinsChecked:pins.length,productChecks:products.length,preflights,chargeDemo:report.chargeDemo},null,2))
