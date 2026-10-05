// Conditional real-source V/Eu + V(III) hydrolysis + water architecture fixture.
import assert from 'node:assert/strict'
import {realClosedRequest,ids as baseIds} from './closedRedoxReal.js'
import {prepareClosedRedox,solveClosedRedox} from '../../src/solver/closedRedox.js'
import {prepareChemicalSystem,createPointInput} from '../../src/solver/models.js'
import {solvePoint} from '../../src/solver/point.js'
import {toSourceInput} from '../../src/calculations/definition.js'
import {independentProtonRedox} from './closedRedoxProtonIndependent.js'
export const ids={...baseIds,H:'component:H%2B',W:'component:H2O',OH:'spana:2ac52a30213c9288:250448',VH:'spana:2ac52a30213c9288:369711'}
export const expected=independentProtonRedox()
const ok=r=>{assert.ok(r.ok,JSON.stringify(r));return r}
export function protonRequest(repo,{history=0,alternate=false,reverse=false}={}){
 const q=realClosedRequest(repo,{history,alternate})
 const special=(id,name,role,phase,charge,elements)=>({id,name,role,phase,charge,elements,sourceIdentity:{id,reference:'Explicit imported proton/solvent identity with static atom/charge metadata',record:repo.getComponentById(id).provenance}})
 q.species.push(special(ids.H,'H+','proton','aqueous',1,{H:1}),special(ids.W,'H2O','water','liquid',0,{H:2,O:1}))
 for(const [id,name,charge,elements,logK,terms] of [[ids.VH,'VOH+2',2,{V:1,O:1,H:1},-2.26,{'V 3+':1,'H+':-1,H2O:1}],[ids.OH,'OH-',-1,{O:1,H:1},-14.0015,{'H+':-1,H2O:1}]]){
  const s=repo.getSpeciesById(id);assert.equal(s.name,name);assert.equal(s.logK,logK);assert.equal(s.charge,charge);assert.equal(s.temperatureReference,298.15);assert.equal(s.phase,'aqueous');assert.deepEqual(s.componentStoichiometry,terms);assert.equal(s.provenance.dbSha256,'2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a')
  q.species.push({id,name,charge,elements,role:'ordinary',phase:'aqueous',sourceIdentity:{id,reference:s.citation,record:s.provenance}})
  const names=new Map(q.species.map(s=>[s.name,s.id]))
  q.reactions.push({id,productId:id,terms:s.metadata.effectiveSourceReaction.components.map(t=>({id:names.get(t.name),coefficient:t.coefficient})),logK:s.logK,phase:'aqueous',unit:{kind:'ideal-molal-standard'},provenance:{reference:s.citation,record:s.provenance}})
 }
 q.basisIds.push(ids.H,ids.W);q.solvent={kind:'fixed-water-activity',speciesId:ids.W,logActivity:0}
 q.preparation.amounts[ids.H]=expected.A;q.preparation.amounts[ids.Cl]=expected.chloride
 if(history){q.preparation.amounts[ids.Vo]-=.0001;q.preparation.amounts[ids.VH]=.0001;q.preparation.amounts[ids.H]+=.0001}
 q.preparation.description=`Conditional real V/Eu + V hydrolysis; closed solute H-2O, fixed solvent water; history ${history}`
 if(reverse)q.reactions.reverse()
 return q
}
export async function runProton(repo,options){const request=protonRequest(repo,options),prepared=ok(await prepareClosedRedox(request)),solved=ok(solveClosedRedox(prepared));return {request,prepared,solved}}
export function amounts(result){return Object.fromEntries(result.speciesIds.filter(id=>id!==ids.W&&id!==ids.e).map(id=>[id,result.concentrations[result.speciesIds.indexOf(id)]]))}
export function target(){return {[ids.Vo]:expected.v3,[ids.Vr]:expected.x,[ids.Euo]:expected.eu3,[ids.Eur]:expected.eu2,[ids.VH]:expected.vh,[ids.H]:expected.h,[ids.OH]:expected.oh,[ids.Cl]:expected.chloride}}
export async function controls(repo){
 const closed=await runProton(repo),{prepared}=closed
 const fixedPH=async pH=>{const p=ok(await createPointInput(prepared.system,{...prepared.input,constraints:prepared.input.constraints.map(c=>c.componentId===ids.H?{...c,kh:2,value:-pH}:c)}));return ok(solvePoint(prepared.system,p.input))}
 const q=closed.request,components=[ids.Vo,ids.Euo,ids.Cl,ids.H,ids.e,ids.W].map(id=>q.species.find(s=>s.id===id))
 const products=q.reactions.map(r=>{const s=q.species.find(s=>s.id===r.productId);return {id:s.id,name:s.name,phase:'aqueous',charge:s.charge,coefficients:components.map(c=>r.terms.find(t=>t.id===c.id)?.coefficient??0),logBeta:r.logK,sourceRecord:r.provenance}})
 const {system}=ok(await prepareChemicalSystem({components,products,basisStatus:'explicit-direct',unit:q.unit,temperatureC:25,pressureBar:1,sourceIdentity:{scope:'Same eight solutes and water, raw source reactions; exact boundary-condition comparison',reactions:q.reactions}}))
 const fixedEh=async(Eh,pH=null)=>{const totals={[ids.Vo]:expected.T,[ids.Euo]:expected.T,[ids.Cl]:expected.chloride,[ids.H]:expected.A}
  const constraints=components.map(c=>({componentId:c.id,kh:c.id===ids.W||c.id===ids.e||c.id===ids.H&&pH!==null?2:1,value:c.id===ids.W?0:c.id===ids.e?toSourceInput({quantity:'Eh',mode:'LA'},Eh,25).value:c.id===ids.H&&pH!==null?-pH:totals[c.id]}))
  const p=ok(await createPointInput(system,{constraints,revision:0,unit:q.unit,temperatureC:25,pressureBar:1,activityModel:'ideal'}));return ok(solvePoint(system,p.input))
 }
 return {closed,fixedPH,fixedEh,atPH:await fixedPH(expected.pH),atEh:await fixedEh(expected.exactEh),atBoth:await fixedEh(expected.exactEh,expected.pH)}
}
