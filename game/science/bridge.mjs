import {inventory} from './sample_inventory.mjs';
import {acceptedState} from './src/beaker/acceptedState.js';
import {createWetLabAnalysis} from './src/calculations/wetLabAnalysis.js';
import {saturatedLogSolubility} from './src/calculations/solubility.js';

import {createRepository} from './src/thermodynamics/repository.js';
import {loadWetLabIons} from './src/calculations/wetLabIons.js';
import {createWetLabExperience} from './src/calculations/wetLabExperience.js';
import {analyticalWetLabSetup} from './src/calculations/wetLabSetup.js';
import {discoverReactionSet,automaticSpeciesPolicy,automaticSolidPolicy} from './src/thermodynamics/compatibility.js';
import {periodicTable} from './src/data/periodicTable.js';
// Game defaults are separate from the unchanged vendored chemistry modules.
export const gameDefaultSetup=structuredClone(analyticalWetLabSetup);
gameDefaultSetup.sample.contributions=structuredClone(analyticalWetLabSetup.titrant.contributions);
gameDefaultSetup.titrant.contributions=structuredClone(analyticalWetLabSetup.sample.contributions);
gameDefaultSetup.sample.contributions[0].id='sample-component';
gameDefaultSetup.titrant.contributions[0].id='titrant-component';
gameDefaultSetup.titrant.volumeMl=400;
const repo=createRepository(await (await fetch(new URL('./database.json',import.meta.url))).json());
const catalog=await loadWetLabIons(repo);
export function chemicalFor(setup){
 const ids=new Set(['component:H%2B','component:H2O']);
 for(const stock of Object.values(setup))for(const row of stock.contributions){
 const form=catalog.analyticalEntries[row.sourceId];if(!form)throw Error('Unsupported component identity.');
 Object.keys(form.coefficients).forEach(id=>ids.add(id));
 }
 const s={selectedComponents:[...ids],selectedSpecies:[],enabledPhases:['aqueous','solid','liquid'],temperature:25,pressure:1,activityModel:'ideal',speciesPolicy:automaticSpeciesPolicy,solidPhasePolicy:automaticSolidPolicy,excludedSpecies:[],solvent:{speciesId:'component:H2O'}};
 return {...s,selectedSpecies:discoverReactionSet(repo,s).selectedSpecies};
}
export async function calculate(setup,dose=0){
 const engine=await createWetLabExperience(repo,{chemicalSystem:chemicalFor(setup),setup});
 if(dose)await engine.setVolume(dose);
 const snap=engine.snapshot();
 const points=snap.points.map(p=>{const s=p.state,r=s.equilibrium.result;return {phaseMessage:r?acceptedState(s.equilibrium.system,s.equilibrium.input,r).phaseMessage:'Equilibrium unavailable',inventory:inventory(r?acceptedState(s.equilibrium.system,s.equilibrium.input,r):null,s.mixture.modelSolventMassKg),x:p.x,y:p.y,status:s.status,volume:s.totalVolumeMl,remaining:s.titrantRemainingMl,modelSolventMassKg:s.mixture.modelSolventMassKg,visual:s.equilibrium.inspection?.visual??{},solids:r?.solids??[],species:r?.speciesIds?.filter(id=>id!=='component:H2O' && !r.solids.some(s=>s.id===id)).map(id=>{const i=r.speciesIds.indexOf(id);return {id,name:repo.getSpeciesById(id)?.name??repo.getComponentById(id)?.name??id,concentration:r.concentrations[i]};})??[],diagnostics:s.diagnostics};});
 const analysis=createWetLabAnalysis(engine), diagrams=[];
 const pack=(v,label)=>({key:v.type+':'+(v.componentId??''),label,series:v.series.map(c=>({name:c.name,phase:c.phase,values:c.points.map(p=>p.value),reasons:c.points.map(p=>p.reason)}))});
 for(const [type,label] of [['titration','pH'],['log-concentration','Log concentrations / mol/kg H2O'],['log-activity','Log activities']])diagrams.push(pack(analysis.view(type),label));
 for(const c of analysis.view('titration').components){
  for(const [type,label] of [['total-fraction','Total fractions'],['aqueous-fraction','Aqueous speciation']])diagrams.push(pack(analysis.view(type,c.id),label+' / '+c.name));
  const values=snap.points.map(p=>p.state.status==='accepted-v0'?saturatedLogSolubility(p.state.equilibrium.system,p.state.equilibrium.result,c.id):{value:null,reason:'equilibrium-unavailable'});
  diagrams.push({key:'solubility:'+c.id,label:'Log solubility / '+c.name,series:[{name:c.name+' / saturated solid only',values:values.map(v=>v.value),reasons:values.map(v=>v.reason)}]});
 }
 if(!analysis.view('titration').components.length){
  for(const [key,label] of [['total-fraction','Total fractions'],['aqueous-fraction','Aqueous speciation'],['solubility','Log solubility']])diagrams.push({key,label,series:[{name:'No eligible ordinary component',values:points.map(()=>null),reasons:points.map(()=> 'ordinary-component-required')}]});
 }
 const solidIds=[...new Set(points.flatMap(p=>p.solids.map(s=>s.id)))];
 diagrams.push({key:'solids',label:'Solid amounts / mol/kg model H2O',series:solidIds.map(id=>({name:repo.getSpeciesById(id)?.name??id,values:points.map(p=>p.y===null?null:(p.solids.find(s=>s.id===id)?.amount??null)),reasons:points.map(p=>p.y===null?'equilibrium-unavailable':null)}))});
 engine.dispose();return {ok:true,points,diagrams,capacity:snap.capacityMl,solveCount:snap.equilibriumSolveCount,scope:snap.scope.reason};
}
