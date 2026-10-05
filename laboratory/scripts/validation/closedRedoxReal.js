// Real-source, reaction-restricted validation fixture. Never imported by production UI.
import assert from 'node:assert/strict'
import {prepareClosedRedox,solveClosedRedox} from '../../src/solver/closedRedox.js'
import {prepareChemicalSystem,createPointInput} from '../../src/solver/models.js'
import {solvePoint} from '../../src/solver/point.js'
import {createCalculationDefinition,toSourceInput} from '../../src/calculations/definition.js'
import {createSweepDefinition,runSweep} from '../../src/calculations/sweep.js'
export const ids={Vo:'component:V%203%2B',Vr:'spana:2ac52a30213c9288:360928',Euo:'component:Eu%203%2B',Eur:'spana:2ac52a30213c9288:120483',Cl:'component:Cl-',e:'component:e-'}
// Independent expectations established analytically before running production.
export const expected={total:.001,extent:0.0005770924758253289,remaining:0.00042290752417467115,netLogK:.27,pe:-5.965,Eh:-0.3528855208697266}
const assertOk=r=>{assert.ok(r.ok,JSON.stringify(r.diagnostics??r));return r}
export function realClosedRequest(repository,{alternate=false,history=0,reverse=false}={}){
 const v=repository.getSpeciesById(ids.Vr),eu=repository.getSpeciesById(ids.Eur)
 for(const [r,name,oxidized,logK] of [[v,'V 2+','V 3+',-5.83],[eu,'Eu 2+','Eu 3+',-6.1]]){assert.equal(r.name,name);assert.equal(r.logK,logK);assert.equal(r.temperatureReference,298.15);assert.equal(r.phase,'aqueous');assert.equal(r.charge,2);assert.ok(r.citation.startsWith("85Bar/Par:"));assert.deepEqual(r.componentStoichiometry,{[oxidized]:1,'e-':1});assert.equal(r.provenance.dbSha256,'2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a')}
 // Static monatomic composition/charge for these explicit identities, never parsed.
 const spec=(id,name,charge,elements,record)=>({id,name,charge,elements,role:'ordinary',phase:'aqueous',sourceIdentity:{id,reference:record.citation??'Imported source component identity; explicit monatomic composition and charge',record:record.provenance}})
 const species=[spec(ids.Vo,'V 3+',3,{V:1},repository.getComponentById(ids.Vo)),spec(ids.Vr,v.name,2,{V:1},v),spec(ids.Euo,'Eu 3+',3,{Eu:1},repository.getComponentById(ids.Euo)),spec(ids.Eur,eu.name,2,{Eu:1},eu),spec(ids.Cl,'Cl-',-1,{Cl:1},repository.getComponentById(ids.Cl)),{id:ids.e,name:'e-',role:'electron',charge:-1,elements:{},sourceIdentity:{id:ids.e,reference:'Imported formal electron component; charge −1, no elemental atoms'}}]
 const names=new Map(species.map(s=>[s.name,s.id]))
 const reactions=[v,eu].map(r=>({id:r.id,productId:r.id,terms:r.metadata.effectiveSourceReaction.components.map(t=>({id:names.get(t.name),coefficient:t.coefficient})),logK:r.logK,phase:r.phase,unit:{kind:'ideal-molal-standard'},provenance:{reference:r.citation,record:r.provenance}}))
 if(reverse)reactions.reverse()
 const t=expected.total,amounts=history?{[ids.Vo]:t/2,[ids.Vr]:t/2,[ids.Euo]:t/2,[ids.Eur]:t/2,[ids.Cl]:5*t}:{[ids.Vo]:t,[ids.Eur]:t,[ids.Cl]:5*t}
 return {mode:'closed-redox',temperatureC:25,pressureBar:1,activityModel:'ideal',unit:'mol/kg-H2O',species,reactions,basisIds:alternate?[ids.Vr,ids.Eur,ids.Vo,ids.Cl]:[ids.Vo,ids.Euo,ids.Vr,ids.Cl],electronId:ids.e,preparation:{amounts,chargePolicy:'electroneutral',description:history?'Half of each oxidation form; identical V, Eu, Cl and charge inventories':'V(III) chloride + Eu(II) chloride; reaction-restricted aqueous benchmark'}}
}
export async function closedReal(repository,options){const request=realClosedRequest(repository,options),prepared=assertOk(await prepareClosedRedox(request)),solved=assertOk(solveClosedRedox(prepared));return {request,prepared,solved}}
export async function imposedReal(repository){
 const request=realClosedRequest(repository),components=[ids.Vo,ids.Euo,ids.Cl,ids.e].map(id=>request.species.find(s=>s.id===id))
 const products=request.reactions.map(r=>({id:r.productId,name:request.species.find(s=>s.id===r.productId).name,phase:'aqueous',charge:2,coefficients:components.map(c=>r.terms.find(t=>t.id===c.id)?.coefficient??0),logBeta:r.logK,sourceRecord:r.provenance}))
 // Exact same physical five-ion system. Generic production LA/Eh machinery;
 // no proton/water species added just to satisfy the single-family UI wrapper.
 const {system}=assertOk(await prepareChemicalSystem({components,products,basisStatus:'explicit-direct',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{kind:'real-closed-crosscheck-v1',scope:'V-Eu-Cl aqueous reaction-restricted',halfReactions:request.reactions}}))
 const totals={[ids.Vo]:expected.total,[ids.Euo]:expected.total,[ids.Cl]:5*expected.total}
 const fixed=async Eh=>{const {input}=assertOk(await createPointInput(system,{revision:0,unit:system.unit,temperatureC:25,pressureBar:1,activityModel:'ideal',constraints:components.map(c=>({componentId:c.id,kh:c.id===ids.e?2:1,value:c.id===ids.e?toSourceInput({mode:'LA',quantity:'Eh'},Eh,25).value:totals[c.id]}))}));return {input,result:assertOk(solvePoint(system,input))}}
 const d=createCalculationDefinition({selectedComponents:components.map(c=>c.id),selectedSpecies:products.map(p=>p.id),temperature:25,pressure:1,enabledPhases:['aqueous','liquid']},{getComponentById:id=>{const c=components.find(c=>c.id===id);return {...c,role:c.role==='ordinary'?'basis-choice':c.role}}})
 d.componentConditions=components.filter(c=>c.id!==ids.e).map(c=>({componentId:c.id,mode:'T',quantity:'total',unit:'mol/kg-H2O',value:totals[c.id]}))
 d.independentVariables=[{componentId:ids.e,mode:'LAV',quantity:'Eh',unit:'V-SHE',range:{min:expected.Eh-.05,max:expected.Eh+.05},points:5}]
 const {sweep}=assertOk(await createSweepDefinition(system,d,0)),result=await runSweep(system,sweep)
 return {system,sweep:result,exact:await fixed(expected.Eh),fixed}
}
export function verifyReal(result){
 const amounts=Object.fromEntries(result.speciesIds.map((id,i)=>[id,result.concentrations[i]])),target={[ids.Vo]:expected.remaining,[ids.Vr]:expected.extent,[ids.Euo]:expected.extent,[ids.Eur]:expected.remaining,[ids.Cl]:.005}
 for(const [id,value] of Object.entries(target))assert.ok(Math.abs(amounts[id]-value)<=1e-12,`${id}: ${amounts[id]} vs ${value}`)
 return amounts
}
