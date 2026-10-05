import fs from 'node:fs'
import {registerHooks} from 'node:module'
const captured=[]
globalThis.captureNitrate=x=>captured.push(x)
registerHooks({load(url,context,next){const r=next(url,context);if(url.endsWith('/src/solver/point.js'))return {...r,source:String(r.source).replace('const linear = solveLinear(jacobian, residual.map(r => -r))','globalThis.captureNitrate({iteration,jacobian,residual,logA:state.logA,productLog:state.productLog,unknown}); const linear = solveLinear(jacobian, residual.map(r => -r))')};return r}})
const {repo}=await import('./nonRedoxPhysicalBenchmark.js')
const {request}=await import('./exactConservationRun.js')
const {compileEquilibriumNetwork,solveEquilibriumNetwork}=await import('../../src/thermodynamics/equilibriumNetwork.js')
const compiled=await compileEquilibriumNetwork(repo,request({'component:Na%2B':.01,'component:NO3-':.01}))
const result=compiled.ok?solveEquilibriumNetwork(compiled):compiled
fs.writeFileSync('docs/production-source-nitrate.json',JSON.stringify({compiled,result,captured},null,2))
console.log(JSON.stringify({ok:compiled.ok,result:result.diagnostics,captured:captured.map(x=>({iteration:x.iteration,jacobian:x.jacobian,logA:x.logA}))},null,2))
