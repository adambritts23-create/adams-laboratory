import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculate} from './bridge.mjs';
const folder=new URL('../validation/bench-expansion/',import.meta.url);
const old=JSON.parse(fs.readFileSync(new URL('carbonate.json',folder)));
const out=await calculate(old.setup);
assert.equal(out.diagrams.find(d=>d.key==='titration:').series[0].values.at(-1),out.points.at(-1).y);
for(const d of out.diagrams)for(const s of d.series){assert.equal(s.values.length,out.points.length);assert.equal(s.values[0],null);}
assert.ok(out.diagrams.filter(d=>d.key.startsWith('solubility:')).every(d=>d.series[0].values.slice(1).some(v=>Number.isFinite(v))));
assert.ok(out.points.every(p=>p.species.every(s=>!p.solids.some(t=>t.id===s.id))));
assert.ok(out.points.every(p=>Math.abs(p.modelSolventMassKg-p.volume/1000)<1e-9));
const plain=await calculate(JSON.parse(fs.readFileSync(new URL('./catalog.json',import.meta.url))).defaultSetup);
assert.ok(plain.diagrams.find(d=>d.key==='solubility').series[0].values.every(v=>v===null));
console.log('PASS diagram alignment, genuine gaps, saturated solubility, phase partition, model solvent mass, inapplicable solubility');
