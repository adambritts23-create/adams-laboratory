import fs from 'node:fs'
import assert from 'node:assert/strict'
import {gzipSync,gunzipSync} from 'node:zlib'
import {createHash} from 'node:crypto'
const adam=JSON.parse(gunzipSync(fs.readFileSync('docs/cu-pourbaix-samples.json.gz'))),reference=fs.readFileSync('.local/cu-phase/haltafall-cu.ndjson','utf8').trim().split('\n').map(JSON.parse),source=JSON.parse(fs.readFileSync('.local/cu-phase/independent-chemistry.json'))
assert.equal(reference.length,2565)
// Independent allocation in the official reader's order, including fixed-reservoir zero weights.
const allocations=[[2,1],null,null,null,[1,1],[2,1],[1,1],[2,1],[2,1],[2,2],[2,3],[1,1],[2,1],[2,1],[1,2],[2,1],[0,1]]
const ids=[adam.system.components[0].id,...adam.system.components.slice(1).map(c=>c.id),...source.transformed.map(r=>r.id)]
// Canonical Cu+ is the bridged state identity; validate the actual source binding separately.
ids[4]='canonical-state:component:Cu%2B'
assert.deepEqual(ids,adam.system.speciesIds)
source.transformed.forEach((s,i)=>{const p=adam.system.products[i];assert.deepEqual(s.coefficients,p.coefficients);assert.ok(Math.abs(s.logK-p.logBeta)<1e-13)})
const summary={points:reference.length,flags:{},counts:{},classificationDisagreements:[],solidAssemblageDisagreements:[],maximumSpeciesConcentrationDifference:0,maximumWeightedFractionDifference:0,maximumOxidationFractionDifference:0,maximumReferenceClosureResidual:0,maximumAdamClosureResidual:0,minimumClassificationMargin:1,tolerance:{officialRelative:1e-10,adamBalance:'unchanged componentBalanceTolerance',classificationTie:1e-8},matching:'Identical pH and pe; source thermodynamics independently transformed into Cu2+/H+/e-/H2O by the pinned Cu+ bridge.'}
const comparisons=reference.map((r,index)=>{
 const a=adam.grid.outcomes[index],c=adam.export.points[index];assert.equal(r.index,index);summary.flags[r.flags]=(summary.flags[r.flags]??0)+1
 const fractions={0:0,1:0,2:0};let sum=0
 r.C.forEach((amount,j)=>{const allocation=allocations[j];if(!allocation)return;const [state,count]=allocation;sum+=amount*count;fractions[state]+=amount*count/source.total;const diff=Math.abs(amount-a.result.concentrations[j]);summary.maximumSpeciesConcentrationDifference=Math.max(summary.maximumSpeciesConcentrationDifference,diff);summary.maximumWeightedFractionDifference=Math.max(summary.maximumWeightedFractionDifference,diff*count/source.total)})
 for(const f of c.fractions)summary.maximumOxidationFractionDifference=Math.max(summary.maximumOxidationFractionDifference,Math.abs(f.fraction-fractions[f.oxidationState]))
 summary.maximumReferenceClosureResidual=Math.max(summary.maximumReferenceClosureResidual,Math.abs(sum-source.total));summary.maximumAdamClosureResidual=Math.max(summary.maximumAdamClosureResidual,Math.abs(c.residual))
 const order=Object.entries(fractions).sort((a,b)=>b[1]-a[1]),margin=order[0][1]-order[1][1],winner=margin<=1e-8?null:Number(order[0][0]);summary.minimumClassificationMargin=Math.min(summary.minimumClassificationMargin,margin);summary.counts[winner]=(summary.counts[winner]??0)+1
 if(winner!==c.predominant)summary.classificationDisagreements.push(index)
 const solids=ids.flatMap((id,j)=>j>=13&&r.C[j]>0?[id]:[]),actual=c.acceptedSolids.map(s=>s.id)
 if(JSON.stringify(solids)!==JSON.stringify(actual))summary.solidAssemblageDisagreements.push(index)
 return {index,fractions,predominant:winner,margin,closureResidual:sum-source.total,solidIds:solids}
})
const hash=b=>createHash('sha256').update(b).digest('hex')
const evidence={summary,library:JSON.parse(fs.readFileSync('.local/cu-phase/official-library-verification.json')),chemistry:source,adapterSha256:hash(fs.readFileSync('scripts/validation/PourbaixProbe.java')),coordinatesSha256:hash(fs.readFileSync('.local/cu-phase/coordinates.csv')),datSha256:hash(fs.readFileSync('.local/cu-phase/matched-cu.dat')),referenceOutputSha256:hash(fs.readFileSync('.local/cu-phase/haltafall-cu.ndjson')),reference,comparisons}
fs.writeFileSync('docs/cu-haltafall-comparison.json',JSON.stringify({...evidence,reference:undefined,comparisons:undefined},null,2));fs.writeFileSync('docs/cu-haltafall-reference.json.gz',gzipSync(JSON.stringify(evidence)));console.log(JSON.stringify(summary,null,2))
assert.deepEqual(summary.flags,{0:2565});assert.equal(summary.classificationDisagreements.length,0);assert.equal(summary.solidAssemblageDisagreements.length,0)
