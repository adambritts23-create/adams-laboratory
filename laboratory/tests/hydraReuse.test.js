import test from 'node:test'
import assert from 'node:assert/strict'
import {closedControl} from '../scripts/validation/closedRedoxControls.js'
import {compileClosedRedoxNetwork} from '../src/thermodynamics/closedRedoxNetwork.js'
import {prepareClosedRedox,solveClosedRedox} from '../src/solver/closedRedox.js'
import {repo} from '../scripts/validation/nonRedoxPhysicalBenchmark.js'
import {discoverGeneralClosed} from '../src/thermodynamics/generalClosedReagents.js'
import {sourceComponentMetadata} from '../src/thermodynamics/sourceComponentMetadata.js'
test('structural reuse never reuses dose inventory or bypasses boundary validation',async()=>{
 const q=closedControl('original',false,0).request,a=compileClosedRedoxNetwork(q)
 const changed=structuredClone(q);changed.revision=3;for(const id in changed.preparation.amounts)changed.preparation.amounts[id]*=2
 const b=compileClosedRedoxNetwork(changed);assert.equal(a,b)
 const pa=await prepareClosedRedox(q),pb=await prepareClosedRedox(changed),ra=solveClosedRedox(pa),rb=solveClosedRedox(pb)
 assert.ok(ra.ok&&rb.ok);assert.notEqual(pa.input.id,pb.input.id);assert.notDeepEqual(pa.input.constraints,pb.input.constraints)
 assert.equal(compileClosedRedoxNetwork({...q,Eh:0}).ok,false)
 const other=compileClosedRedoxNetwork({...q,sourceFingerprint:'different-source'});assert.notEqual(other,a)
 const alternate=compileClosedRedoxNetwork(closedControl('original',true,0).request);assert.notEqual(alternate,a)
})
test('repository reuse is scoped to immutable identity, ordered support and reviewed phase contract',async()=>{
 const ids=['component:Fe%202%2B','component:Cl-'],a=await discoverGeneralClosed(repo,ids)
 assert.equal(a,await discoverGeneralClosed(repo,ids));assert.notEqual(a,await discoverGeneralClosed(repo,[...ids,'component:H2O2']))
 assert.notEqual(a,await discoverGeneralClosed(repo,ids,{reviewedScope:true}))
 const mutable={...repo};assert.ok((await sourceComponentMetadata(mutable)).ok)
 mutable.getSpecies=()=>repo.getSpecies().slice(1)
 assert.equal((await sourceComponentMetadata(mutable)).ok,false)
})
