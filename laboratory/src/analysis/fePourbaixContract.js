import {freeze} from '../solver/models.js'
import {elementPhaseScope,inspectRegisteredPoint,assessPourbaixCandidate} from './pourbaixContract.js'

// Evidence pins are intentionally independent of the mutable registry module.
// A material metadata change requires a new contract and new validation evidence.
export const fePourbaixCandidate = freeze({
  version:'fe-pourbaix-candidate-v1', publicEnabled:false,
  tieTolerance:1e-8, majorityRule:'strictly greater than 0.5; independent of predominance',
  metadataVersion:'oxidation-state-metadata-v1', metadataSha256:'933fe048793b76fed9f2ddce64760829bee7efc0b55ace4bffd6a7d6d9dafa78',
  systemId:'8ead3d660c3c240620da3c69fa3a4b55810695c1dce8216e166f9579043386a1',
  phaseScopeVersion:'fe-seven-solids-v1', total:0.001, unit:'mol/kg-H2O', temperatureC:25, pressureBar:1, pressureMeaning:'declared', activityModel:'ideal',
  pH:{min:0,max:14,step:0.25,points:57}, Eh:{min:-1,max:1.2,step:0.05,points:45,reference:'SHE'},
  includedSolids:[127500,130902,131188,131294,133739,134486,139276].map(id=>'spana:2ac52a30213c9288:'+id),
  excluded:[{id:'spana:2ac52a30213c9288:132744',name:'Fe0.932O(cr)',reason:'unsupported-fractional-canonical-stoichiometry'}],
  reservoirs:['fixed H+ activity','fixed electron activity','a(H2O)=1'],
  gasTreatment:'H2/O2 reference overlays only; no analytical gas inventory is solved.',
  phaseSuppression:'Modified thermodynamic scope; default validation claim invalidated. No kinetic claim.',
  otherTotals:'Internal exploration only; independent validation is restricted to 0.001 mol/kg H2O.'
})

export const fePhaseScope=system=>elementPhaseScope(system,fePourbaixCandidate)
export function inspectRegisteredFePoint(model,system,input,result,options){
 const c=inspectRegisteredPoint(model,system,input,result,options,fePourbaixCandidate)
 if(c.status==='unavailable')return c
 const {totalInventory,conservedComponent,...legacy}=c
 void conservedComponent
 return freeze({...legacy,totalFe:totalInventory})
}
export const assessFePourbaixCandidate=(model,system,grid,options)=>assessPourbaixCandidate(model,system,grid,options,fePourbaixCandidate)
