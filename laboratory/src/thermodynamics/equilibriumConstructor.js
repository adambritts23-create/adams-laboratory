import {prepareSessionPoint} from '../solver/prepareSession.js'
import {prepareCanonicalRedoxSession} from '../solver/prepareCanonicalRedox.js'
import {prepareReactionBasisSystem} from './prepareReactionBasis.js'
import {compileEquilibriumNetwork} from './equilibriumNetwork.js'
import {freeze} from '../solver/models.js'

export const equilibriumConstructorVersion='component-system-equilibrium-v1'
export const equilibriumBoundaries=freeze([
 {hydrogen:'imposed',electron:'not-connected',supported:true,exchange:'H+ activity replaces its analytical balance; proton reservoir exchange is permitted.'},
 {hydrogen:'derived',electron:'not-connected',supported:true,exchange:'Signed proton/source inventory is conserved; no electron potential is determined.'},
 {hydrogen:'imposed',electron:'imposed',supported:true,exchange:'H+ and electron activities replace their balances; both reservoirs may exchange with the system.'},
 {hydrogen:'imposed',electron:'derived',supported:false,exchange:'Mixed proton-reservoir / closed-electron conservation requires separate validation.'},
 {hydrogen:'derived',electron:'imposed',supported:true,exchange:'Signed analytical proton inventory is conserved; imposed electron activity exchanges with a reservoir. Source-basis preparation and per-point acceptance remain required.'},
 {hydrogen:'derived',electron:'derived',supported:true,exchange:'Closed source inventories determine both proton and electron activities; electrons are not supplied material.'},
])
const provenance=new WeakMap()
export const equilibriumConstruction=value=>provenance.get(value)??null
/** A common dispatch contract, retaining validated structural adapters and result brands.
 * No returned system, inventory, solver options or accepted result is rewritten here.
 */
export async function constructEquilibrium(repository,request){
 let result,boundary
 if(request?.adapter==='physical'){
  result=await compileEquilibriumNetwork(repository,request.input)
  boundary={hydrogen:'derived',electron:result.boundary==='closed-physical'?'derived':'not-connected'}
 }else if(request?.adapter==='ordinary'){
  const {session,options={}}=request,components=session.chemicalSystem.selectedComponents.map(id=>repository.getComponentById(id))
  const h=components.find(c=>c?.role==='proton'),conditions=[...session.calculationDefinition.componentConditions,...session.calculationDefinition.independentVariables]
  const condition=conditions.find(c=>c.componentId===h?.id)
  boundary={hydrogen:condition?.quantity==='total'?'derived':'imposed',electron:components.some(c=>c?.role==='electron')?'imposed':'not-connected'}
  if(!equilibriumBoundaries.find(b=>b.hydrogen===boundary.hydrogen&&b.electron===boundary.electron)?.supported)return freeze({ok:false,diagnostics:[{code:'unsupported-mixed-reservoir',message:'This imposed/derived reservoir combination is not validated.'}]})
  result=await prepareSessionPoint(session,repository,options)
 }else if(request?.adapter==='canonical-imposed'){
  boundary={hydrogen:'imposed',electron:'imposed'}
  result=await prepareCanonicalRedoxSession(request.session,repository,request.options)
 }else if(request?.adapter==='source-imposed'){
  boundary={hydrogen:'imposed',electron:'imposed'}
  result=await prepareReactionBasisSystem(repository,request.options)
 }else return freeze({ok:false,diagnostics:[{code:'unsupported-equilibrium-constructor',message:'An explicit supported source/boundary adapter is required.'}]})
 if(result.ok)provenance.set(result,freeze({version:equilibriumConstructorVersion,adapter:request.adapter,...boundary,semantics:equilibriumBoundaries.find(b=>b.hydrogen===boundary.hydrogen&&b.electron===boundary.electron)}))
 return result
}
