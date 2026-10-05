import {inventory} from './sample_inventory.mjs';
import {acceptedState} from './src/beaker/acceptedState.js';

import {createRepository} from './src/thermodynamics/repository.js';
import {prepareSessionPoint} from './src/solver/prepareSession.js';
import {createCalculationDefinition} from './src/calculations/definition.js';
import {createSweepDefinition,runSweep} from './src/calculations/sweep.js';
import {createGridDefinition,runGrid} from './src/calculations/grid.js';
import {deriveOutputs,deriveGridOutputs,outputDefinitions} from './src/calculations/outputs.js';
import {solvePoint} from './src/solver/point.js';
import {discoverReactionSet,automaticSpeciesPolicy,automaticSolidPolicy} from './src/thermodynamics/compatibility.js';
const repo=createRepository(await (await fetch(new URL('./database.json',import.meta.url))).json());
const fail=r=>{if(!r.ok)throw Error((r.diagnostics??[]).map(d=>d.message).join('\n')||'Calculation unavailable');return r;};
function preview(system,input,result){
 const s=acceptedState(system,input,result);return s.ok?{accepted:true,inventory:inventory(s,1),pH:s.pH,solids:s.solids,visual:s.visual,message:s.phaseMessage}:{accepted:false,pH:null,solids:[],visual:{bedHeight:0},message:s.message};
}
export async function calculateConditions(request){
 const ids=request.conditions.map(c=>c.componentId);
 const chemical={selectedComponents:ids,selectedSpecies:[],enabledPhases:['aqueous','solid','liquid'],temperature:25,pressure:1,activityModel:'ideal',speciesPolicy:automaticSpeciesPolicy,solidPhasePolicy:automaticSolidPolicy,excludedSpecies:[],solvent:{speciesId:'component:H2O'}};
 chemical.selectedSpecies=discoverReactionSet(repo,chemical).selectedSpecies;
 const def=createCalculationDefinition(chemical,repo);
 def.componentConditions=request.conditions.filter(c=>!c.axis).map(({axis,...c})=>c);
 def.independentVariables=request.conditions.filter(c=>c.axis).sort((a,b)=>a.axis.localeCompare(b.axis)).map(({axis,...c})=>c);
 if(new Set(request.conditions.filter(c=>c.axis).map(c=>c.axis)).size!==def.independentVariables.length)throw Error('Only one component per X or Y axis.');
 def.sampling.maxPoints=2500;
 const count=def.independentVariables.length;
 const prepared=fail(await prepareSessionPoint({chemicalSystem:chemical,calculationDefinition:def,revision:1},repo,{sweep:count===1,grid:count===2}));
 if(count===0){
  const r=fail(solvePoint(prepared.system,prepared.input));
  return {ok:true,previews:[preview(prepared.system,prepared.input,r)],kind:'point',label:'Fixed-condition equilibrium',unit:'mol/kg H2O',species:r.speciesIds.map((id,i)=>({name:repo.getSpeciesById(id)?.name??repo.getComponentById(id)?.name??id,value:r.concentrations[i],logActivity:r.logActivities[i]})),solids:r.solids,pH:-r.logActivities[prepared.system.components.findIndex(c=>c.role==='proton')]};
 }
 const run=count===1?await runSweep(prepared.system,fail(await createSweepDefinition(prepared.system,def,1)).sweep):await runGrid(prepared.system,fail(await createGridDefinition(prepared.system,def,1)).grid);
 const diagrams=[];
 const add=(type,componentId=null)=>{
  const req={type,componentId,redoxQuantity:request.redoxQuantity??'pe'};
  const result=count===1?deriveOutputs(prepared.system,run,req):deriveGridOutputs(prepared.system,run,req);
  const label=outputDefinitions[type].label+(componentId?' / '+repo.getComponentById(componentId).name:'');
  diagrams.push({key:type+':'+(componentId??''),label,unit:outputDefinitions[type].unit,error:result.ok?'':result.diagnostics.map(d=>d.message).join('; '),series:result.ok?result.series.map(s=>({name:s.name,values:s.points.map(p=>p.value),reasons:s.points.map(p=>p.reason??null)})):[]});
 };
 for(const type of ['log-concentration','concentration','log-activity','solid-amount','calculated-pH'])add(type);
 if(prepared.system.components.some(c=>c.role==='electron'))add('calculated-redox');
 for(const c of prepared.system.components.filter(c=>c.role==='ordinary'&&!c.suppressed))for(const type of ['total-fraction','aqueous-fraction','total-dissolved','log-total-dissolved','saturated-log-solubility','analytical-total'])add(type,c.id);
 return {ok:true,previews:run.outcomes.map(o=>o.status==='converged'?preview(prepared.system,o.input,o.result):{accepted:false,pH:null,solids:[],visual:{bedHeight:0},message:'Equilibrium unavailable'}),kind:count===1?'sweep':'grid',axes:def.independentVariables.map(c=>({...c,name:repo.getComponentById(c.componentId).name})),shape:count===1?[run.coordinates.length,1]:run.shape,coordinates:count===1?[run.coordinates]:run.coordinates,diagrams,counts:run.counts,status:run.status};
}
