import test from 'node:test'
import assert from 'node:assert/strict'
import { legendReadout } from '../src/plots/legendReadout.js'
import { partitionPercent } from '../src/beaker/componentPartition.js'
test('aqueous legend explicitly reports dissolved denominator without changing raw fractions', () => {
 const derived = {metadata:{revision:0,axis:{quantity:'pH'},output:{type:'aqueous-fraction',unit:'fraction'}},series:[{id:'Fe',name:'Fe',phase:'aqueous',points:[{x:12.04,value:0.982,pointStatus:'converged',fractionTrace:{component:'Fe'}}]}]}
 const before=JSON.stringify(derived)
 const row=legendReadout(derived,0,0).rows[0]
 assert.equal(row.text,'98.2% of dissolved Fe')
 assert.equal(row.value,0.982)
 assert.equal(partitionPercent(0.999999),' >99.9%'.trim())
 assert.equal(JSON.stringify(derived),before)
 assert.equal(legendReadout(derived,0,1).rows[0].text,'Unavailable')
})
