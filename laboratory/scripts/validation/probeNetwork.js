import fs from 'node:fs'
import {createRepository} from '../../src/thermodynamics/repository.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork,equilibriumSourceFingerprint} from '../../src/thermodynamics/equilibriumNetwork.js'
import {independentSourceFamilies} from './networkIndependent.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const shared={revision:0,temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O',sourceFingerprint:equilibriumSourceFingerprint,phases:['aqueous'],solvent:'unit-water-activity'}
const W='component:H2O',H='component:H%2B',A='component:CH3COO-'
const acid=await compileEquilibriumNetwork(repo,{...shared,boundary:'analytical-components',selectedIds:[H,W,A],constraints:[{componentId:H,kh:1,value:0},{componentId:W,kh:2,value:0},{componentId:A,kh:1,value:.5}]})
console.log('acid',acid.ok,acid.diagnostics,acid.inspection?.included.map(r=>r.name));if(acid.ok)console.log(solveEquilibriumNetwork(acid).ok)
const amounts={'component:Fe%202%2B':1e-6,'component:Eu%203%2B':1e-6,'component:Cl-':.010005,[H]:.01}
const compiled=await compileEquilibriumNetwork(repo,{...shared,boundary:'closed-physical',selectedIds:[...Object.keys(amounts),W],amounts})
const result=compiled.ok?solveEquilibriumNetwork(compiled):compiled
console.log('mixed',result.ok,result.diagnostics,result.accepted?.inspection.pH)
const ref=independentSourceFamilies({names:['Fe 2+','Eu 3+','Cl-','H+','e-'],total:[1e-6,1e-6,.010005,.01,0],initial:[-7,-6,-2,-2,-12]})
console.log('reference',ref.pH,ref.pe,ref.rows)
console.log('error',Math.max(...result.accepted.inspection.carriers.map(c=>Math.abs(Math.log10(c.amount/ref.carriers[c.name])))))
