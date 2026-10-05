import fs from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// This phase's pre-edit manifest is evidence, never a production dependency.
const directory='.local/metadata-phase/'
const hash=path=>createHash('sha256').update(fs.readFileSync(path)).digest('hex')
const read=name=>fs.readFileSync(directory+name,'utf8')
const count=(text,name)=>Number(text.match(new RegExp('ℹ '+name+' (\\d+)'))?.[1])
function testSummary(name){
 const text=read(name),result=Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,count(text,k)]))
 assert.equal(result.tests,result.pass)
 for(const k of ['fail','cancelled','skipped','todo'])assert.equal(result[k],0)
 const official=['acid-base','complexation','precipitation','redox','fixed-activity']
 for(const key of official)assert.ok(text.includes('✔ independent solver quantitatively reproduces official '+key))
 return {...result,officialGoldens:official,log:directory+name,logSha256:hash(directory+name)}
}
const baseline=testSummary('baseline-tests.txt'),final=testSummary('final-tests.txt')
assert.equal(baseline.tests,440);assert.equal(final.tests,452)
for(const phase of ['baseline','final']){
 assert.match(read(phase+'-build.txt'),/built in/)
 assert.match(read(phase+'-lint.txt'),/0 errors, 1 warning/)
 assert.equal(JSON.parse(read(phase+'-artifact-audit.json')).status,'passed')
}
const protectedFiles=JSON.parse(read('before.json')).map(row=>({...row,afterSha256:hash(row.path)}))
assert.ok(protectedFiles.every(row=>row.sha256===row.afterSha256))
const artifacts=['src/analysis/feOxidationMetadata.js','src/analysis/registeredOxidation.js','src/analysis/fePourbaixContract.js','src/analysis/feWaterContext.js','src/analysis/prepareFeCandidate.js','scripts/validate-fe-metadata.js','tests/feMetadata.test.js','docs/fe-metadata-validation.json','docs/fe-metadata-samples.json.gz','docs/fe-metadata-carriers.md','docs/fe-metadata-support-contract.md']
const result={status:'passed',date:'2026-09-10',baseline,final,
 build:'passed; existing bundle-size advisory retained',lint:'passed; zero errors and one pre-existing ExpandedPlot react-hooks warning',artifactAudit:'passed',
 protectedFileCount:protectedFiles.length,changedProtectedFiles:[],protectedFiles,
 artifacts:artifacts.map(path=>({path,sha256:hash(path)})),
 commands:{tests:'node --test --experimental-test-isolation=none src/chemistry/*.test.js src/thermodynamics/*.test.js src/thermodynamics/importers/*.test.js src/thermodynamics/importers/spana/*.test.js src/calculations/*.test.js tests/*.test.js',build:'npm run build -- --configLoader native',lint:'npm run lint',artifactAudit:'node scripts/audit-production-boundary.js',scientificValidation:'node scripts/validate-fe-metadata.js'},
 publicEnabled:false,deployed:false,pushed:false,recommendation:'Ready for next-phase implementation of the exact fixed Fe candidate contract; no broader support claim.'}
fs.writeFileSync('docs/fe-metadata-checks.json',JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({...result,protectedFiles:undefined,artifacts:undefined}))
