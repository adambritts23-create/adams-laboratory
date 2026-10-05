import assert from 'node:assert/strict'
import {discoverReactionSet,automaticSpeciesPolicy,automaticSolidPolicy} from '../../src/thermodynamics/compatibility.js'
import {createCalculationDefinition} from '../../src/calculations/definition.js'
import {constructEquilibrium} from '../../src/thermodynamics/equilibriumConstructor.js'
import {solvePoint} from '../../src/solver/point.js'
export function selectedSystem(repo,ids,phases=['aqueous','solid','liquid']){
 const s={selectedComponents:['component:H%2B',...ids,'component:H2O'],selectedSpecies:[],enabledPhases:phases,temperature:25,pressure:1,activityModel:'ideal',speciesPolicy:automaticSpeciesPolicy,solidPhasePolicy:automaticSolidPolicy,excludedSpecies:[],solvent:{speciesId:'component:H2O'}}
 return {...s,selectedSpecies:discoverReactionSet(repo,s).selectedSpecies}
}
/** Independent Calculation request assembled from transported dose inventories, not Wet Lab's request builder. */
export async function compareDose(repo,chemical,state){
 const d=createCalculationDefinition(chemical,repo),m=state.mixture,totals={...m.moles,'component:H%2B':m.moles.protonEquivalent??m.moles['component:H%2B']??0}
 // Existing named stock coordinates are source-bound compatibility labels.
 const mapping={acetate:'component:CH3COO-',boron:'component:B(OH)3',Na:'component:Na%2B',Cl:'component:Cl-'}
 for(const [key,id] of Object.entries(mapping))if(m.moles[key]!==undefined)totals[id]=m.moles[key]
 d.componentConditions=chemical.selectedComponents.map(id=>id==='component:H2O'?{componentId:id,mode:'LA',quantity:'log-activity',unit:'dimensionless',value:0}:{componentId:id,mode:'T',quantity:'total',unit:'mol/kg-H2O',value:(totals[id]??0)/m.modelSolventMassKg})
 const prepared=await constructEquilibrium(repo,{adapter:'ordinary',session:{chemicalSystem:chemical,calculationDefinition:d,revision:state.revision}})
 assert.equal(prepared.ok,true,JSON.stringify(prepared.diagnostics));const direct=solvePoint(prepared.system,prepared.input),wet=state.equilibrium
 assert.equal(wet.ok,direct.ok);assert.deepEqual(wet.system,prepared.system);assert.deepEqual(wet.input,prepared.input)
 if(direct.ok){for(const key of ['speciesIds','concentrations','logActivities','residuals','solids'])assert.deepEqual(wet.result[key],direct[key],key);assert.equal(state.pH,-direct.logActivities[prepared.system.components.findIndex(c=>c.role==='proton')])}
 else assert.deepEqual(wet.result.diagnostics,direct.diagnostics)
 return {dose:state.titrantVolumeAddedMl,accepted:direct.ok,pH:state.pH,conditions:d.componentConditions,species:prepared.system.products.map(p=>({id:p.id,phase:p.phase})),solids:direct.solids??[],residuals:direct.residuals,diagnostics:direct.diagnostics}
}


