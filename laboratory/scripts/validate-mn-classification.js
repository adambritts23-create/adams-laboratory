// Offline classification of immutable evidence; never invokes an equilibrium solve.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {loadMnSnapshot,classifySnapshot} from '../src/analysis/mnDiagnostic.js'
import {category,diagnosticSvg} from '../src/plots/mnDiagnostic.js'
import {waterReferences} from '../src/analysis/waterReferences.js'
import {analytical} from './validation/mnAudit.js'
const read=name=>fs.readFileSync(new URL(`../docs/${name}`,import.meta.url),'utf8')
const snapshot=await loadMnSnapshot(read('mn-retry-validation.json'),read('mn-diagnostic-inventory.json'))
const points=classifySnapshot(snapshot),modes=['assemblage','species','oxidation']
const counts=Object.fromEntries(modes.map(mode=>[mode,points.reduce((a,p)=>{const k=category(p.classification,mode);a[k]=(a[k]??0)+1;return a},{})]))
const checks=points.map(p=>{
 const a=analytical(p.pH,p.pe),c=p.classification
 assert.deepEqual(c.activeSolids.map(s=>s.id),a.solid?[a.solid.id]:[])
 const maximumWeightedDifference=Math.max(...a.aqueous.map(s=>Math.abs(s.weightedMolality-c.aqueous.find(r=>r.id===s.id).weightedMolality)))
 assert.ok(maximumWeightedDifference<=4e-14+2e-10*Math.abs(a.dissolved))
 return {index:p.index,pH:p.pH,Eh:p.Eh,pe:p.pe,maximumWeightedDifference,independentDissolved:a.dissolved,independentSolid:a.solid}
})
const representatives=Object.fromEntries(modes.map(mode=>[mode,Object.keys(counts[mode]).map(label=>{
 const candidates=points.filter(p=>category(p.classification,mode)===label)
 const p=candidates[Math.floor(candidates.length/2)]
 return {label,...checks[p.index]}
})]))
const adjacentChanges=[]
for(const p of points)for(const q of points){
 if(!((q.index===p.index+1&&q.Eh===p.Eh)||(q.index===p.index+15&&q.pH===p.pH)))continue
 const changed=modes.filter(m=>category(p.classification,m)!==category(q.classification,m))
 if(changed.length)adjacentChanges.push({indices:[p.index,q.index],changed})
}
const evidence={identity:snapshot.identity,method:'Independent original-source monomer/dimer mass-action quadratic and pure-solid activity caps; all 195 states checked, including every adjacent change.',counts,representatives,adjacentChanges,checks,water:[0,7,14].flatMap(pH=>waterReferences(snapshot.inventory,pH)),points}
fs.writeFileSync(new URL('../docs/mn-classification-validation.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n')
fs.writeFileSync(new URL('../docs/mn-diagnostic.svg',import.meta.url),diagnosticSvg(snapshot,points,'assemblage',true,104))
console.log(JSON.stringify({counts,representatives,adjacentChanges:adjacentChanges.length},null,2))

