import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

const source=process.argv[2];
if(!source)throw Error('Pass the original Godot project directory.');
const original=new URL('./science/',pathToFileURL(source.replaceAll('\\','/')+'/'));
const nativeFetch=globalThis.fetch;
globalThis.fetch=async (url,...args)=>String(url).startsWith('file:')
 ? {json:async()=>JSON.parse(await readFile(url,'utf8'))}
 : nativeFetch(url,...args);
// Desktop bridge files have a CLI branch when argv[2] exists.
process.argv=process.argv.slice(0,2);
const desktop=await import(new URL('bridge.mjs',original));
const web=await import('./game/science/bridge.mjs');
for(const dose of [0,25]){
 const input=structuredClone(desktop.gameDefaultSetup);
 assert.deepEqual(await web.calculate(input,dose),await desktop.calculate(input,dose));
 console.log('PASS exact wet-lab parity at',dose,'mL');
}
const a=await import(new URL('calculation_bridge.mjs',original));
const b=await import('./game/science/calculation_bridge.mjs');
const conditions=[{componentId:'component:H%2B',mode:'LAV',quantity:'pH',unit:'dimensionless',axis:'x',range:{min:0,max:14},points:5},{componentId:'component:H2O',mode:'LA',quantity:'log-activity',unit:'dimensionless',value:0}];
assert.deepEqual(await a.calculateConditions({conditions}),await b.calculateConditions({conditions}));
console.log('PASS exact calculation sweep parity');
