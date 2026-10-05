import assert from 'node:assert/strict';
import fs from 'node:fs';
import {formulaAtoms} from './sample_inventory.mjs';
import {calculateConditions} from './calculation_bridge.mjs';
import {calculate} from './bridge.mjs';
assert.deepEqual(formulaAtoms('UO2 2+'),{U:1,O:2});
assert.deepEqual(formulaAtoms('(UO2)2(OH)2 2+'),{U:2,O:6,H:2});
assert.equal(formulaAtoms('Unknown'),null);
const conditions=[
 {componentId:'component:H%2B',mode:'LA',quantity:'pH',unit:'dimensionless',value:7},
 {componentId:'component:H2O',mode:'LA',quantity:'log-activity',unit:'dimensionless',value:0},
 {componentId:'component:UO2%202%2B',mode:'T',quantity:'total',unit:'mol/kg-H2O',value:.001}
];
const result=await calculateConditions({conditions});
const inv=result.previews[0]?.inventory;
assert(inv?.available && inv.drySolidMassG>0,'Accepted uranium fixture has measurable solids');
let mass=0;
for(const solid of inv.solids){
 assert(solid.composition.U>0 && Number.isFinite(solid.massG));
 assert(Math.abs(solid.massG-solid.moles*solid.molarMassG)<1e-12);
 mass+=solid.massG;
}
assert(Math.abs(inv.drySolidMassG-mass)<1e-12);
fs.writeFileSync('validation/uranium-mass-fixture.json',JSON.stringify(inv));
console.log('PASS uranium formula parsing, accepted result masses, mole-to-gram conversion and total mass');
const setup={sample:{preparationContract:'analytical-acid-base',volumeMl:50,initialPH:2,contributions:[{id:'u',kind:'component',sourceId:'component:UO2%202%2B',concentrationMolPerL:.001}]},titrant:{preparationContract:'analytical-acid-base',volumeMl:100,initialPH:12,contributions:[{id:'base',kind:'component',sourceId:'spana:2ac52a30213c9288:250448',concentrationMolPerL:.01}]}};
const wet=await calculate(setup,60);
const point=wet.points.find(p=>p.inventory?.drySolidMassG>0);
assert(point,'Wet lab bridge includes uranium precipitate grams');
assert.equal(point.inventory.basisKgWater,point.modelSolventMassKg);
fs.writeFileSync('validation/uranium-wet-fixture.json',JSON.stringify({...wet,setup}));
console.log('PASS wet titration bridge carries precipitate mass and actual beaker solvent basis');
