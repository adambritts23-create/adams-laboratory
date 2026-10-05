import fs from 'node:fs'
import {createRepository} from '../src/thermodynamics/repository.js'
import {loadWetLabIons} from '../src/calculations/wetLabIons.js'
import {prepareWetLabStocks} from '../src/calculations/wetLabSetup.js'
import {prepareWetLabScope,runTitration} from '../src/calculations/wetLabTitration.js'

// Run from the project root: node scripts/benchmark-wet-lab-redox.mjs
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const catalog=await loadWetLabIons(repo)
const part=(sourceId,volumeMl)=>({preparationContract:'simplified-redox',volumeMl,contributions:[
 {id:'metal',kind:'ionic',sourceId,concentrationMolPerL:.0001},
 {id:'acid',kind:'ionic',sourceId:'component:H%2B',concentrationMolPerL:.1},
]})
const stocks=prepareWetLabStocks({sample:part('spana:2ac52a30213c9288:94892',50),titrant:part('component:Cu%2B',400)},1,catalog)
const start=performance.now()
const context=await prepareWetLabScope(repo,stocks,{enabledPhases:['aqueous','solid']},1)
const scopeMs=performance.now()-start
const series=await runTitration(context,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,revision:1,additionVolumesMl:Array.from({length:101},(_,i)=>i*4)})
const accepted=series.states.filter(s=>s.status==='accepted-v0').length
console.log(JSON.stringify({
 scenario:'50 mL 0.1 mM dichromate + 0–400 mL 0.1 mM Cu(I), both 100 mM acid',
 points:series.states.length,accepted,scopeMs,curveMs:series.elapsedMs,totalMs:performance.now()-start,
 checkpoints:series.states.filter(s=>[0,296,300,304,392,400].includes(s.titrantVolumeAddedMl)).map(s=>({
  volumeMl:s.titrantVolumeAddedMl,pH:s.pH,Eh:s.equilibrium.derived?.Eh,
  solids:s.equilibrium.result?.solids?.filter(s=>s.amount>0),
 })),
},null,2))
if(accepted!==series.states.length)process.exitCode=1
