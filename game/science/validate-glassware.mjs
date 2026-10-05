import {calculateConditions} from './calculation_bridge.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const conditions=[{componentId:'component:H%2B',mode:'LAV',quantity:'pH',unit:'dimensionless',axis:'x',range:{min:2,max:12},points:31},{componentId:'component:H2O',mode:'LA',quantity:'log-activity',unit:'dimensionless',value:0},...['component:Ca%202%2B','component:CO3%202-'].map(componentId=>({componentId,mode:'T',quantity:'total',unit:'mol/kg-H2O',value:.01}))];
const r=await calculateConditions({conditions});assert(r.previews.some(p=>p.accepted&&p.visual.bedHeight>0));assert(r.previews.some(p=>p.accepted&&p.visual.bedHeight===0));assert(r.diagrams[0].series.length>3);assert.equal(r.previews.length,31);fs.writeFileSync('validation/glassware-pass/calculation.json',JSON.stringify(r));
console.log('PASS: multi-species output and accepted-state beaker includes both dissolved and precipitated cases');
