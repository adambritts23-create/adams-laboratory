import test from 'node:test';
import assert from 'node:assert/strict';
import {apartmentWalkable} from '../src/upperFloor/apartment.js';
const walk=(x,z)=>apartmentWalkable(-z-.8,x+15.4);
test('original hall connects to living room, kitchen and bathroom',()=>{
 const queue=[[-25,-8]],seen=new Set(['-25,-8']);
 for(let i=0;i<queue.length;i++)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const x=queue[i][0]+dx,z=queue[i][1]+dz,key=x+','+z;
  if(!seen.has(key)&&walk(x/10,z/10)){seen.add(key);queue.push([x,z]);}
 }
 for(const p of ['22,10','46,-18','9,-23'])assert.ok(seen.has(p),'Reachable room '+p);
 assert.ok(!walk(3.3,5.5),'No purchased piano-side extension');
 assert.ok(!walk(-2.35,-2),'No purchased hall-side extension');
 assert.ok(!walk(6.8,2.5),'Rear windows block walking outside');
});
