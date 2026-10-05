import test from 'node:test';
import assert from 'node:assert/strict';
import {KFRun,KF_VIALS,UG_PER_MA_MIN} from './simulation.js';
test('Faraday conversion and sample units',()=>{assert.ok(Math.abs(400*UG_PER_MA_MIN-2240.58)<.01);assert.equal(.6*1000,600);});
test('water releases gradually and mass is conserved',()=>{
 const r=new KFRun();assert.equal(r.gas,0);assert.equal(r.solid,680);r.start();
 for(let i=0;i<500;i++){r.step(.01);assert.ok(r.solid>=0&&r.gas>=0&&r.deficit>=0);assert.ok(r.current<=400+1e-8);assert.ok(Math.abs(r.solid+r.gas+r.deficit+r.chargeWater-r.baseline*r.t-r.total)<1e-6);}
});
test('prepared samples finish after five minutes with expected corrected ppm',()=>{
 for(const v of KF_VIALS){const r=new KFRun(v);r.start();r.step(30);assert.equal(r.status,'complete');assert.ok(r.t>=5);if(v.blank)assert.ok(Math.abs(r.gross-80)<.3);else assert.ok(Math.abs(r.ppm-v.ppm)/v.ppm<.002);assert.equal(r.rate,3);}
});
test('faster carrier flow transfers more water at the same release constant',()=>{
 const a=new KFRun(KF_VIALS[0],40),b=new KFRun(KF_VIALS[0],60);a.start();b.start();a.step(1);b.step(1);assert.ok(b.delivered>a.delivered);
});
test('idle is not integrated as a sample; aborted results do not advance',()=>{
 const r=new KFRun();r.step(5);assert.equal(r.t,0);r.start();r.step(1);r.status='aborted';r.step(10);assert.ok(Math.abs(r.t-1)<1e-8);
});
test('large overload respects 400 mA and returns timeout rather than a final result',()=>{
 const r=new KFRun({...KF_VIALS[0],mass:10,ppm:50000});r.start();r.step(31);assert.equal(r.status,'timeout');assert.ok(r.current<=400+1e-8);assert.ok(r.deficit>0);
});
