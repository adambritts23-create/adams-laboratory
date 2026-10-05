import {repo,common,contribution,ids} from './nonRedoxPhysicalBenchmark.js'
import {compileEquilibriumNetwork,solveEquilibriumNetwork} from '../../src/thermodynamics/equilibriumNetwork.js'
import {automaticAuditSession} from './automaticSolidsAudit.js'
import {prepareSessionPoint} from '../../src/solver/prepareSession.js'
import {createPointInput} from '../../src/solver/models.js'
import {solvePoint} from '../../src/solver/point.js'
import {closedSolidsReference} from './closedSolidsReference.js'
export {repo,ids}
export const solidIds=[155572,221010,38100].map(n=>'spana:2ac52a30213c9288:'+n)
export async function parityPoint(v){
 const mass=(50+v)/1000,B=.04/mass,Na=v/1000/mass
 const request={...common,phases:['aqueous','pure-solids'],preparation:{provenance:'50 mL final 0.8 M boric acid; independently delivered 1 M NaOH',solventCoordinate:{convention:'explicit-solvent-mass-kg',modelSolventMassKg:mass},contributions:[contribution('boric',ids.B,.04),contribution('base',ids.base,v/1000)]}}
 const compiled=await compileEquilibriumNetwork(repo,request),physical=compiled.ok?solveEquilibriumNetwork(compiled):compiled
 if(!physical.ok)throw Error(JSON.stringify(physical.diagnostics))
 const names=Na>0?['B(OH)3','Na+']:['B(OH)3'],totals=Na>0?[B,Na]:[B]
 const session=automaticAuditSession(repo,names,totals),prepared=await prepareSessionPoint(session,repo,{sweep:true})
 if(!prepared.ok)throw Error(JSON.stringify(prepared.diagnostics))
 const point=await createPointInput(prepared.system,{constraints:prepared.system.components.map(c=>({componentId:c.id,kh:c.role==='water'?2:1,value:c.role==='water'?0:c.role==='proton'?-Na:c.id===ids.B?B:Na})),revision:0,unit:'mol/kg-H2O',temperatureC:25,pressureBar:1,activityModel:'ideal'})
 const calculation=solvePoint(prepared.system,point.input)
 const reference=closedSolidsReference({names:Na>0?['H+','B(OH)3','Na+']:['H+','B(OH)3'],total:Na>0?[-Na,B,Na]:[0,B],initial:Na>0?[-8,-1,-1]:[-4,-.1],charges:Na>0?[1,0,1]:[1,0],solidIds:solidIds.filter(id=>Na>0||!id.endsWith(':221010'))})
 return {v,request,compiled,physical,calculation,calculationSystem:prepared.system,calculationInput:point.input,reference}
}
