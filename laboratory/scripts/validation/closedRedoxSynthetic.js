import {transformReactionBasis} from '../../src/thermodynamics/reactionBasis.js'
import {prepareChemicalSystem,createPointInput} from '../../src/solver/models.js'
import {solvePoint} from '../../src/solver/point.js'
import {peToEh} from '../../src/solver/redox.js'
export const preparations=[{name:'reduced A + oxidized B',amounts:{Ao:0,Ar:1,Bo:1,Br:0,X:1}},{name:'partially redistributed mixture',amounts:{Ao:.5,Ar:.5,Bo:.5,Br:.5,X:1}}]
export const attributes={Ao:{charge:1,elements:{A:1}},Ar:{charge:0,elements:{A:1}},Bo:{charge:1,elements:{B:1}},Br:{charge:0,elements:{B:1}},E:{charge:-1,elements:{}},X:{charge:-1,elements:{X:1}}}
const row=(id,productId,terms,logK)=>({id,productId,terms:Object.entries(terms).map(([id,coefficient])=>({id,coefficient})),logK,phase:'aqueous',unit:{kind:'synthetic-ideal-molal-standard'},provenance:{kind:'deliberate-synthetic-control'}})
export const reactions=[row('A reduction','Ar',{Ao:1,E:1},0),row('B reduction','Br',{Bo:1,E:1},2)]
export const bases=[['Ao','Ar','Bo','X'],['Ao','Bo','Br','X'],['Ar','Bo','Br','X']]
// Independent analytic extent: K=100, x/(1-x)=sqrt(K)=10.
// This does not call any production chemistry or nonlinear solver.
export const expected=Object.freeze({Ao:10/11,Ar:1/11,Bo:1/11,Br:10/11,X:1,pe:1,Eh:8.31446261815324*298.15*Math.LN10/96485.33212})
export async function benchmark(basisIds,preparation){
 const algebra=transformReactionBasis({basisIds,componentIds:Object.keys(attributes),reactions,attributes})
 if(!algebra.ok)throw Error(JSON.stringify(algebra))
 const physical=Object.keys(attributes).filter(id=>id!=='E'),products=physical.filter(id=>!basisIds.includes(id)).map(id=>({id,name:id,phase:'aqueous',coefficients:algebra.componentExpressions[id].coefficients,logBeta:algebra.componentExpressions[id].logK,sourceRecord:{synthetic:true,algebra}}))
 const prepared=await prepareChemicalSystem({components:basisIds.map(id=>({id,name:id,phase:'aqueous',role:'ordinary',charge:attributes[id].charge})),products,basisStatus:'explicit-direct',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{kind:'closed-redox-synthetic-only'}})
 if(!prepared.ok)throw Error(JSON.stringify(prepared))
 const constraints=basisIds.map((componentId,i)=>({componentId,kh:1,value:physical.reduce((n,id)=>n+preparation.amounts[id]*algebra.componentExpressions[id].coefficients[i],0)}))
 const options={constraints,revision:0,unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,activityModel:'ideal'}
 const point=await createPointInput(prepared.system,options)
 if(!point.ok)throw Error(JSON.stringify(point))
 const result=solvePoint(prepared.system,point.input)
 if(!result.ok)throw Error(JSON.stringify(result))
 const concentrations=Object.fromEntries(result.speciesIds.map((id,i)=>[id,result.concentrations[i]])),c=concentrations
 const peA=Math.log10(c.Ao/c.Ar),peB=2+Math.log10(c.Bo/c.Br)
 const checks={A:c.Ao+c.Ar,B:c.Bo+c.Br,charge:c.Ao+c.Bo-c.X,electronTransfer:(c.Ao-preparation.amounts.Ao)-(c.Br-preparation.amounts.Br),massActionA:Math.log10(c.Ar/c.Ao)+peA,massActionB:Math.log10(c.Br/c.Bo)+peA-2,netLogK:Math.log10(c.Ao*c.Br/(c.Ar*c.Bo)),peA,peB,Eh:peToEh(peA)}
 const chargeRequest=await createPointInput(prepared.system,{...options,enforceElectroneutrality:true})
 return {basisIds,preparation:preparation.name,constraints,concentrations,checks,result,chargeRequest,algebra}
}
export async function frozenControl(preparation){
 const ids=['Ao','Ar','Bo','Br','X'],p=await prepareChemicalSystem({components:ids.map(id=>({id,name:id,role:'ordinary',phase:'aqueous'})),products:[],basisStatus:'explicit-direct',unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,sourceIdentity:{kind:'deliberately-disconnected-valence-control'}})
 const input=await createPointInput(p.system,{constraints:ids.map(componentId=>({componentId,kh:1,value:preparation.amounts[componentId]})),revision:0,unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,activityModel:'ideal'})
 return solvePoint(p.system,input.input)
}
