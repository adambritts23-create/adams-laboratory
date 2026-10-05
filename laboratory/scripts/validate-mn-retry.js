/** Capture recovery evidence separately; keep the original 29-failure audit immutable. */
import fs from 'node:fs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { prepare,gridDefinition,analytical,coordinates,classify } from './validation/mnAudit.js'
import { createGridDefinition,runGrid } from '../src/calculations/grid.js'
const baselineBytes=fs.readFileSync('docs/mn-grid-validation.json'),baseline=JSON.parse(baselineBytes)
const system=await prepare(),request=await createGridDefinition(system,gridDefinition(system),0)
assert.ok(request.ok)
const grid=await runGrid(system,request.grid)
const stats={...grid.counts,recovered:0,previouslyAcceptedUnchanged:0,maximumLogFreeError:0,maximumBalanceResidual:0,maximumActiveSaturationResidual:0}
const comparisons=grid.outcomes.map((o,i)=>{
 const previous=baseline.grid.outcomes[i];assert.equal(o.x,previous.x);assert.equal(o.y,previous.y);assert.ok(o.result.ok)
 const c=coordinates(o),expected=analytical(c.pH,c.pe),error=Math.abs(Math.log10(expected.free)-o.result.logActivities[0]);assert.ok(error<1e-8)
 if(previous.result.ok){for(const key of ['concentrations','logActivities','componentTotals','solids','residuals'])assert.equal(JSON.stringify(o.result[key]),JSON.stringify(previous.result[key]));stats.previouslyAcceptedUnchanged++}else stats.recovered++
 stats.maximumLogFreeError=Math.max(stats.maximumLogFreeError,error)
 stats.maximumBalanceResidual=Math.max(stats.maximumBalanceResidual,Math.abs(o.result.residuals.componentBalance[0]))
 stats.maximumActiveSaturationResidual=Math.max(stats.maximumActiveSaturationResidual,...o.result.solids.filter(s=>s.amount>0).map(s=>Math.abs(s.logSaturation)))
 return {index:i,coordinates:c,previousStatus:previous.status,expected,logFreeError:error,classification:classify(system,o)}
})
fs.writeFileSync('docs/mn-retry-validation.json',JSON.stringify({kind:'single-total-initialization-retry-validation',historicalEvidenceSha256:createHash('sha256').update(baselineBytes).digest('hex'),stats,system,grid,comparisons},null,2)+'\n')
console.log(JSON.stringify(stats,null,2))
