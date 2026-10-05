import {isClosedReagentSweep} from './closedReagentSweep.js'
import {freeze} from '../solver/models.js'
const views=new WeakSet()
export const isClosedReagentPlot=value=>views.has(value)
/** Presentation bridge only: preserve exact accepted objects; never call a solver. */
export function closedReagentPlot(closed){
 if(!isClosedReagentSweep(closed)||closed.status!=='completed')return {ok:false,reason:'A completed, current closed-reagent sweep is required.'}
 const system=closed.outcomes.find(o=>o.accepted)?.system
 if(!system||closed.outcomes.some(o=>o.accepted&&o.system.id!==system.id))return {ok:false,reason:'No compatible accepted closed equilibria are available.'}
 const first=closed.outcomes.find(o=>o.accepted),axis={componentId:closed.axis.reagentId,mode:closed.axis.mode??'TV',quantity:'total',unit:closed.axis.unit,range:{min:closed.axis.min,max:closed.axis.max},points:closed.axis.points,start:closed.axis.min,end:closed.axis.max,suppliedReagent:true}
 // Analytical display conditions describe the supplied preparation, not a fixed pH reservoir.
 const componentConditions=system.components.filter(c=>c.id!==axis.componentId).map(c=>({componentId:c.id,mode:c.role==='water'?'LA':'T',quantity:c.role==='water'?'log-activity':'total',unit:c.role==='water'?'dimensionless':'mol/kg-H2O',value:c.role==='water'?0:first.input.constraints.find(k=>k.componentId===c.id).value}))
 const calculationDefinition={schemaVersion:1,dimensions:1,closedReagentView:true,componentConditions,independentVariables:[axis],temperature:{value:25,unit:'C'},pressure:{value:1,unit:'bar'},activityModel:'ideal',ionicStrength:{mode:'automatic',value:null,unit:'mol/kg-H2O'}}
 const outcomes=closed.outcomes.map(o=>({...o,status:o.accepted?'converged':'failed',scientificAcceptance:o.accepted?'passed':'not-accepted',closedAccepted:o.accepted,transformed:{kh:1,value:closed.axis.mode==='LTV'?10**o.coordinate:o.coordinate}}))
 const result=freeze({kind:'closed-reagent-view',closed,systemId:system.id,sweepId:closed.id,revision:closed.revision,sourceIdentity:system.sourceIdentity,definition:{id:closed.id,systemId:system.id,revision:closed.revision,axis,coordinates:closed.coordinates,fixedConditions:componentConditions,calculationDefinition},coordinates:closed.coordinates,transformedCoordinates:outcomes.map(o=>o.transformed),outcomes,status:closed.counts.failed?'completed-with-failed-points':'completed',counts:{requested:closed.counts.requested,converged:closed.counts.accepted,failed:closed.counts.failed,notRun:0},unit:system.unit,method:{name:closed.generic?'general-source-closed-sweep':'validated-closed-reagent-sweep',version:closed.generic?'1':'step5'},warnings:[closed.generic?'Conditional source-closed model; pH and Eh calculated. Unavailable equilibria remain gaps.':'Conditional reviewed aqueous scope; pH and Eh derived. No kinetics, radicals, solids or gas inventory modeled.']})
 views.add(result);return {ok:true,system,sweep:result}
}
