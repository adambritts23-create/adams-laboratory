import fs from 'node:fs'
import {prepareClosedRedox,solveClosedRedox} from '../../src/solver/closedRedox.js'
import {closedControl} from './closedRedoxControls.js'
import {scaleReaction} from '../../src/thermodynamics/reactionBasis.js'
const runs=[]
for(const kind of ['original','unequal','three'])for(const alternate of [false,true])for(const history of [0,1]){
 const c=closedControl(kind,alternate,history),p=await prepareClosedRedox(c.request),r=p.ok?solveClosedRedox(p):p
 if(!r.ok)throw Error(JSON.stringify(r))
 runs.push({kind,alternate,history,independentExpected:c.expected,expectedPe:c.definition.pe,equilibriumId:p.equilibriumId,preparationId:p.preparationId,constraints:p.input.constraints,cancellations:p.network.cancellations,concentrations:Object.fromEntries(r.result.speciesIds.map((id,i)=>[id,r.result.concentrations[i]])),inspection:r.inspection,solverResiduals:r.result.residuals})
}
const orderControls=[]
for(const variant of ['reversed-order','reversed-scaled-half-reactions']){
 const c=closedControl('three');c.request.reactions=variant==='reversed-order'?[...c.request.reactions].reverse():c.request.reactions.map((r,i)=>scaleReaction(r,i===1?-2:3))
 const p=await prepareClosedRedox(c.request),r=p.ok?solveClosedRedox(p):p;if(!r.ok)throw Error(JSON.stringify(r))
 orderControls.push({variant,concentrations:Object.fromEntries(r.result.speciesIds.map((id,i)=>[id,r.result.concentrations[i]])),inspection:r.inspection,cancellations:p.network.cancellations})
}
const summary={runs:runs.length,orderControls:orderControls.length,maxConcentrationError:Math.max(...runs.flatMap(r=>Object.keys(r.independentExpected).map(id=>Math.abs(r.concentrations[id]-r.independentExpected[id])))),maxPeError:Math.max(...runs.flatMap(r=>r.inspection.potentials.map(p=>Math.abs(p.pe-r.expectedPe)))),maxPeDisagreement:Math.max(...runs.flatMap(r=>r.inspection.potentials.map(p=>Math.abs(p.difference)))),maxInventoryResidual:Math.max(...runs.flatMap(r=>r.inspection.inventories.map(p=>Math.abs(p.residual))))}
fs.writeFileSync('docs/closed-redox-step2-evidence.json',JSON.stringify({version:'closed-redox-aqueous-v1',summary,runs,orderControls},null,2));console.log(summary)
