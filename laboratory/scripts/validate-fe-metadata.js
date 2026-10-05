import fs from 'node:fs'
import assert from 'node:assert/strict'
import {gunzipSync,gzipSync} from 'node:zlib'
import {createHash} from 'node:crypto'
import {createRepository} from '../src/thermodynamics/repository.js'
import {prepareFeCandidate,feCandidateGridDefinition} from '../src/analysis/prepareFeCandidate.js'
import {createGridDefinition,runGrid} from '../src/calculations/grid.js'
import {solveFixedRedox} from '../src/solver/redox.js'
import {inspectRegisteredFePoint,assessFePourbaixCandidate,fePourbaixCandidate} from '../src/analysis/fePourbaixContract.js'
import {feOxidationMetadata} from '../src/analysis/feOxidationMetadata.js'
import {identity} from '../src/solver/models.js'

// Old evidence is comparison output only, never allocation input or fallback.
const previousBytes=fs.readFileSync('docs/oxidation-state-fe-validation.json.gz')
const previous=JSON.parse(gunzipSync(previousBytes))
const repository=createRepository(JSON.parse(fs.readFileSync('public/data/thermodynamic-default.json')))
const {system,model,waterModel}=await prepareFeCandidate(repository)
assert.equal(model.status,'registered');assert.equal(system.id,previous.system.id)
const options={currentRevision:0,waterModel}
const inspect=o=>inspectRegisteredFePoint(model,system,o.input,o.result,{...options,status:o.status})
const evidence={contract:fePourbaixCandidate,metadataSha256:await identity(feOxidationMetadata),previousEvidenceSha256:createHash('sha256').update(previousBytes).digest('hex'),totals:[],boundaries:[]}
let acceptedGrid,acceptedSamples
for(const total of [0.001,0.0001,0.01]) {
  const prepared=await createGridDefinition(system,feCandidateGridDefinition(system,total),0)
  assert.ok(prepared.ok,JSON.stringify(prepared))
  const grid=await runGrid(system,prepared.grid),samples=grid.outcomes.map(inspect),counts={}
  for(const c of samples){const key=c.status==='classified'?c.predominant:c.status;counts[key]=(counts[key]??0)+1}
  const assessment=assessFePourbaixCandidate(model,system,grid,options)
  const summary={total,solverCounts:grid.counts,counts,assessment,maximumClosureResidual:Math.max(...samples.map(c=>Math.abs(c.residual??0))),unresolvedSamples:samples.filter(c=>c.status==='unavailable').map((c)=>({reason:c.reason})),candidateIds:system.products.map(c=>c.id)}
  summary.acceptedSolidSampleCounts=Object.fromEntries(system.products.filter(p=>p.phase==='solid').map(p=>[p.id,samples.filter(c=>c.acceptedSolids?.some(s=>s.id===p.id)).length]))
  if(total===0.001){
    assert.deepEqual(counts,{'0':422,'2':581,'3':1473,'6':89});assert.equal(assessment.eligible,true)
    let maximumFractionDifference=0
    samples.forEach((c,i)=>{
      const old=previous.samples[i].classification
      assert.equal(c.status,old.status);assert.equal(c.predominant,old.predominant)
      for(const f of c.fractions)maximumFractionDifference=Math.max(maximumFractionDifference,Math.abs(f.fraction-old.fractions.find(g=>g.oxidationState===f.oxidationState).fraction))
    })
    assert.equal(maximumFractionDifference,0)
    summary.maximumFractionDifference=maximumFractionDifference
    summary.ferrateWaterContexts=[...new Set(samples.filter(c=>c.predominant===6).map(c=>c.waterWindow))]
    acceptedGrid=grid;acceptedSamples=samples
    evidence.samples=samples
  }else assert.equal(assessment.eligible,false)
  evidence.totals.push(summary);console.log(JSON.stringify(summary))
}

// Subdivide every coarse crossing of the three requested adjacent-state pairs.
// Report bracket-midpoint displacement, retaining finite dense bracket widths.
// No equality solve, graphical smoothing or replacement of the grid classifier.
const wanted=new Set(['0/2','2/3','3/6'])
const pair=(a,b)=>[a,b].sort((x,y)=>x-y).join('/')
let checks=0
for(const o of acceptedGrid.outcomes){
  for(const [direction,next] of [['pH',o.ix<56?acceptedGrid.outcomes[o.index+1]:null],['Eh',o.iy<44?acceptedGrid.outcomes[o.index+57]:null]]){
    if(!next)continue
    const a=acceptedSamples[o.index],b=acceptedSamples[next.index],key=pair(a.predominant,b.predominant)
    if(a.predominant===b.predominant || !wanted.has(key))continue
    const values=[{pH:a.pH,Eh:a.Eh,state:a.predominant,status:a.status}]
    for(let j=1;j<10;j++){
      const pH=o.x+(next.x-o.x)*j/10,Eh=o.y+(next.y-o.y)*j/10
      const point=await solveFixedRedox(system,{pH,Eh,totals:{[system.components[0].id]:0.001}})
      const c=inspectRegisteredFePoint(model,system,point.input,point.result,{...options,status:point.ok?'converged':'failed'})
      values.push({pH,Eh,state:c.predominant,status:c.status});checks++
    }
    values.push({pH:b.pH,Eh:b.Eh,state:b.predominant,status:b.status})
    const brackets=[]
    for(let j=1;j<values.length;j++)if(values[j-1].status==='classified'&&values[j].status==='classified'&&values[j-1].state!==values[j].state){
      const left=values[j-1],right=values[j]
      brackets.push({pair:pair(left.state,right.state),left,right,displacement:Math.abs((left[direction]+right[direction])/2-(a[direction]+b[direction])/2)})
    }
    evidence.boundaries.push({pair:key,direction,coarse:[{pH:a.pH,Eh:a.Eh},{pH:b.pH,Eh:b.Eh}],brackets,exceptions:values.filter(v=>v.status!=='classified'),multipleTransitions:brackets.length!==1})
  }
}
evidence.boundarySummary={additionalSolvedPoints:checks,subdivisions:10,interpretation:'Finite sampled bracket midpoints; not exact boundary roots or a global error bound.',rows:[]}
for(const key of wanted)for(const direction of ['pH','Eh']){
  const edges=evidence.boundaries.filter(e=>e.pair===key&&e.direction===direction),brackets=edges.flatMap(e=>e.brackets.filter(b=>b.pair===key))
  evidence.boundarySummary.rows.push({pair:key,direction,coarseEdges:edges.length,resolvedBrackets:brackets.length,maximumObservedDisplacement:brackets.length?Math.max(...brackets.map(b=>b.displacement)):null,denseBracketWidth:direction==='pH'?0.025:0.005,exceptions:edges.filter(e=>e.exceptions.length||e.multipleTransitions).length})
}
evidence.magnetiteControls=evidence.samples.filter(c=>c.acceptedSolids.some(s=>s.id==='spana:2ac52a30213c9288:134486')&&(c.predominant===2||(Math.abs(c.pH-10)<1e-12&&Math.abs(c.Eh+0.6)<1e-12))).map(c=>({pH:c.pH,Eh:c.Eh,fractions:c.fractions,predominant:c.predominant,carriers:c.dominantThermodynamicCarriers,acceptedSolids:c.acceptedSolids}))
assert.ok(evidence.magnetiteControls.some(c=>c.predominant===2))
fs.writeFileSync('docs/fe-metadata-samples.json.gz',gzipSync(JSON.stringify(evidence)+'\n'))
const summary={...evidence,sampleCount:evidence.samples.length,boundaryEdgeCount:evidence.boundaries.length,sampleArtifact:'fe-metadata-samples.json.gz'}
delete summary.samples;delete summary.boundaries
fs.writeFileSync('docs/fe-metadata-validation.json',JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify(evidence.boundarySummary))
