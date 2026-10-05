import fs from 'node:fs'
import {createRepository} from '../../src/thermodynamics/repository.js'
import {loadWetLabIons} from '../../src/calculations/wetLabIons.js'
import {prepareWetLabStocks} from '../../src/calculations/wetLabSetup.js'
import {prepareWetLabScope,runTitration} from '../../src/calculations/wetLabTitration.js'
import {ironHydroxideSetup,wetLabExperimentSystem} from '../../src/calculations/ironHydroxideExample.js'
import {createWorkspaceSession} from '../../src/session/laboratorySession.js'
const repo=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const row=(id,sourceId,c)=>({id,kind:'ionic',sourceId,concentrationMolPerL:c})
const setup={sample:{preparationContract:'simplified-redox',volumeMl:50,contributions:[row('ferrous','component:Fe%202%2B',.05),row('ferric','component:Fe%203%2B',.05),row('acid','component:H%2B',.5)]},titrant:{preparationContract:'simplified-redox',volumeMl:100,contributions:[{id:'base',reagent:'NaOH',concentrationMolPerL:.5}]}}
const fresh=process.argv.includes('--fresh')
const stocks=prepareWetLabStocks(fresh?ironHydroxideSetup:setup,1,await loadWetLabIons(repo))
const context=await prepareWetLabScope(repo,stocks,fresh?wetLabExperimentSystem(repo,createWorkspaceSession(repo).chemicalSystem,ironHydroxideSetup):{enabledPhases:['aqueous','solid']},1)
const t=performance.now()
const result=await runTitration(context,{analyteStock:stocks.sample,analyteVolumeMl:50,titrantStock:stocks.titrant,revision:1,additionVolumesMl:fresh?[0,10,15,20,25,30,35,40,50]:[0,25,50,60,70,75,90,100]})
console.log(JSON.stringify({milliseconds:performance.now()-t,points:result.states.map(s=>({volume:s.titrantVolumeAddedMl,status:s.status,pH:s.pH,Eh:s.equilibrium.derived?.Eh,solids:s.equilibrium.inspection?.solids.map(p=>({id:p.id,name:p.name,moles:p.amount*s.mixture.modelSolventMassKg})),diagnostics:s.diagnostics}))},null,2))
